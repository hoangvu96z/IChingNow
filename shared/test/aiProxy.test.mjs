import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AiProxyError,
  DEFAULT_AI_MODEL,
  PREDEFINED_AI_MODELS,
  loadSanitizedAiSettings,
  refreshAiQuota,
  requestAiChat,
  resolveAllowedAiModel,
} from '../src/utils/aiProxy.mjs';
import { readOpenAiChatStream } from '../src/utils/openAiSse.mjs';
import { clearSsoBearerToken, setSsoBearerToken } from '../src/utils/ssoConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function createSseStreamResponse(chunks, init = {}) {
  const encoder = new TextEncoder();
  let index = 0;
  return new Response(
    new ReadableStream({
      pull(controller) {
        if (index < chunks.length) controller.enqueue(encoder.encode(chunks[index++]));
        else controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Quota-Remaining': '4',
        ...(init.headers || {}),
      },
    },
  );
}

test('requestAiChat sends authenticated POST /plans/ai requests for iching, tarot, and tuvi without upstream keys', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return createSseStreamResponse([
      'data: {"choices":[{"delta":{"content":"Luận giải "}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"thành công"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
  };

  setSsoBearerToken('tab-session-token');
  try {
    for (const app of ['iching', 'tarot', 'tuvi']) {
      const response = await requestAiChat(
        {
          app,
          model: 'combo1',
          messages: [
            { role: 'system', content: `System prompt for ${app}` },
            { role: 'user', content: `User question for ${app}` },
          ],
        },
        { ssoBase: 'https://sso.vunph.click' },
      );

      const text = await readOpenAiChatStream(response);
      assert.equal(text, 'Luận giải thành công');
      assert.equal(response.headers.get('X-Quota-Remaining'), '4');
    }

    assert.equal(requests.length, 3);
    for (const [index, app] of ['iching', 'tarot', 'tuvi'].entries()) {
      const req = requests[index];
      assert.equal(req.url, 'https://sso.vunph.click/plans/ai');
      assert.equal(req.options.method, 'POST');
      assert.equal(req.options.credentials, 'include');

      const headers = new Headers(req.options.headers);
      assert.equal(headers.get('content-type'), 'application/json');
      assert.equal(headers.get('authorization'), 'Bearer tab-session-token');

      const payload = JSON.parse(req.options.body);
      assert.deepEqual(Object.keys(payload).sort(), ['app', 'messages', 'model', 'stream']);
      assert.equal(payload.app, app);
      assert.equal(payload.model, 'combo1');
      assert.equal(payload.stream, true);
      assert.equal(payload.messages.length, 2);
    }
  } finally {
    globalThis.fetch = originalFetch;
    clearSsoBearerToken();
  }
});

test('requestAiChat preserves proxy error status/code/message and never falls back to a direct AI upstream', async () => {
  const cases = [
    { status: 401, code: 'UNAUTHORIZED', message: 'Phiên đăng nhập đã hết hạn.' },
    { status: 403, code: 'QUOTA_EXCEEDED', message: 'Bạn đã hết lượt hỏi AI hôm nay.' },
    { status: 502, code: 'AI_UPSTREAM_ERROR', message: 'Dịch vụ AI tạm thời không phản hồi.' },
    { status: 503, code: 'AI_NOT_CONFIGURED', message: 'Dịch vụ AI chưa được cấu hình.' },
  ];

  for (const testCase of cases) {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      return new Response(
        JSON.stringify({ code: testCase.code, message: testCase.message }),
        { status: testCase.status, headers: { 'Content-Type': 'application/json' } },
      );
    };

    await assert.rejects(
      requestAiChat(
        {
          app: 'iching',
          model: 'combo1',
          messages: [{ role: 'user', content: 'Xin hỏi quẻ này' }],
        },
        { ssoBase: 'https://sso.vunph.click', fetchImpl },
      ),
      error => {
        assert.ok(error instanceof AiProxyError);
        assert.equal(error.status, testCase.status);
        assert.equal(error.code, testCase.code);
        assert.equal(error.message, testCase.message);
        return true;
      },
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://sso.vunph.click/plans/ai');
  }
});

test('refreshAiQuota normalizes app names and queries /plans/my-quota once per call', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(
      JSON.stringify({
        remaining: 2,
        limit: 5,
        used: 3,
        hasKey: true,
        planCode: 'FREE',
        planName: 'Miễn phí',
        expiresAt: null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  for (const [inputApp, expectedQueryApp] of [
    ['iching', 'ichingnow'],
    ['ichingnow', 'ichingnow'],
    ['tarot', 'tarotnow'],
    ['tarotnow', 'tarotnow'],
    ['tuvi', 'tuvinow'],
    ['tuvinow', 'tuvinow'],
  ]) {
    const quota = await refreshAiQuota(inputApp, {
      ssoBase: 'https://sso.vunph.click',
      fetchImpl,
    });
    assert.equal(quota?.remaining, 2);
    assert.equal(quota?.limit, 5);
    assert.equal(quota?.used, 3);
    assert.equal(
      calls.at(-1).url,
      `https://sso.vunph.click/plans/my-quota?app=${expectedQueryApp}`,
    );
  }
});

test('loadSanitizedAiSettings strips legacy apiKey/baseUrl and enforces allowed proxy models', () => {
  const store = new Map([
    [
      'iching_ai_settings',
      JSON.stringify({
        apiKey: 'legacy-secret-do-not-keep',
        baseUrl: 'https://legacy-upstream.example/v1',
        model: 'openrouter/google/gemma-4-26b-a4b-it:free',
      }),
    ],
    [
      'tarot_ai_settings',
      JSON.stringify({
        apiKey: 'legacy-secret-2',
        baseUrl: 'http://127.0.0.1:20128/v1',
        model: 'disallowed-custom-model',
      }),
    ],
  ]);

  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };

  const ichingSettings = loadSanitizedAiSettings('iching_ai_settings', storage);
  assert.deepEqual(ichingSettings, { model: 'openrouter/google/gemma-4-26b-a4b-it:free' });
  assert.deepEqual(JSON.parse(store.get('iching_ai_settings')), {
    model: 'openrouter/google/gemma-4-26b-a4b-it:free',
  });

  const tarotSettings = loadSanitizedAiSettings('tarot_ai_settings', storage);
  assert.deepEqual(tarotSettings, { model: DEFAULT_AI_MODEL });
  assert.deepEqual(JSON.parse(store.get('tarot_ai_settings')), {
    model: DEFAULT_AI_MODEL,
  });

  assert.equal(resolveAllowedAiModel('unknown-model'), DEFAULT_AI_MODEL);
  for (const item of PREDEFINED_AI_MODELS) {
    assert.equal(resolveAllowedAiModel(item.value), item.value);
  }
});

function walkTextFiles(dirPath, extensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx', '.html', '.css'])) {
  if (!fs.existsSync(dirPath)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTextFiles(fullPath, extensions));
    } else if (extensions.has(path.extname(entry.name)) || entry.name === '.env.example') {
      results.push(fullPath);
    }
  }
  return results;
}

test('tracked frontend source, config, and production bundles contain zero AI upstream keys, hosts, or client quota consume calls', () => {
  const forbiddenPatterns = [
    { name: 'VITE_AI_ENV', regex: new RegExp('VITE_' + 'AI_[A-Z0-9_]*', 'g') },
    { name: 'DIRECT_CHAT_COMPLETIONS', regex: new RegExp('/chat/' + 'completions', 'g') },
    { name: 'LOCAL_AI_UPSTREAM_HOST', regex: new RegExp('127\\.0\\.0\\.1:' + '20128', 'g') },
    { name: 'LOCAL_AI_UPSTREAM_PORT', regex: new RegExp(':20128/' + 'v1', 'g') },
    { name: 'LEGACY_UPSTREAM_IP', regex: new RegExp('43\\.128\\.' + '116\\.69', 'g') },
    { name: 'CLIENT_QUOTA_CONSUME_ENDPOINT', regex: new RegExp('/plans/' + 'consume', 'g') },
    { name: 'CLIENT_CONSUME_QUOTA_FN', regex: new RegExp('\\bconsume' + 'Quota\\b', 'g') },
  ];

  const sourceDirs = [
    'shared/src',
    'shared/vite',
    'iching/src',
    'tarotnow/src',
    'tuvinow/src',
    'talkwithme/src',
    'notenow/src',
    'spiritnow/src',
  ].map(rel => path.join(repoRoot, rel));

  const configFiles = [
    'iching/.env.example',
    'tarotnow/.env.example',
    'tuvinow/.env.example',
    'talkwithme/.env.example',
    'notenow/.env.example',
    'iching/vite.config.js',
    'tarotnow/vite.config.js',
    'tuvinow/vite.config.js',
    'talkwithme/vite.config.js',
    'notenow/vite.config.js',
    'spiritnow/vite.config.js',
  ]
    .map(rel => path.join(repoRoot, rel))
    .filter(filePath => fs.existsSync(filePath));

  const distDirs = [
    'iching/dist',
    'tarotnow/dist',
    'tuvinow/dist',
    'talkwithme/dist',
    'notenow/dist',
    'spiritnow/dist',
  ]
    .map(rel => path.join(repoRoot, rel))
    .filter(dirPath => fs.existsSync(dirPath));

  const filesToScan = [
    ...sourceDirs.flatMap(dirPath => walkTextFiles(dirPath)),
    ...configFiles,
    ...distDirs.flatMap(dirPath => walkTextFiles(dirPath)),
  ];

  assert.ok(filesToScan.length > 0, 'Expected source and config files to scan');

  const violations = [];
  for (const filePath of filesToScan) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const { name, regex } of forbiddenPatterns) {
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        violations.push({
          file: path.relative(repoRoot, filePath),
          pattern: name,
          count: matches.length,
        });
      }
    }
  }

  assert.deepEqual(violations, []);
});
