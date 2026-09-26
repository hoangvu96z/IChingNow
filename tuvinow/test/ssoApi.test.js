import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('SSO AI errors preserve their status, make one request, and never fall back to a provider', async () => {
  const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const originalFetch = globalThis.fetch;
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  try {
    const { ssoRequest } = await server.ssrLoadModule('/src/services/ssoApi.js');
    for (const status of [401, 403, 503]) {
      const calls = [];
      globalThis.fetch = async (url, options) => {
        calls.push({ url, options });
        return new Response(JSON.stringify({ message: 'Dịch vụ chưa sẵn sàng', code: 'AI_NOT_CONFIGURED' }), { status });
      };
      await assert.rejects(ssoRequest('/plans/tuvi-ai', { method: 'POST', body: { messages: [] } }), error => {
        assert.equal(error.message, 'Dịch vụ chưa sẵn sàng');
        assert.equal(error.status, status);
        assert.equal(error.code, 'AI_NOT_CONFIGURED');
        return true;
      });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, '/plans/tuvi-ai');
    }
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(ssoRequest('/plans/tuvi-ai'), /Không kết nối được máy chủ/);
    const abort = new AbortController();
    abort.abort();
    const abortError = new DOMException('Aborted', 'AbortError');
    globalThis.fetch = async () => { throw abortError; };
    await assert.rejects(ssoRequest('/plans/tuvi-ai', { signal: abort.signal }), error => error === abortError);
    globalThis.fetch = async () => new Response(JSON.stringify({ content: 'Luận giải thành công' }));
    assert.deepEqual(await ssoRequest('/plans/tuvi-ai'), { content: 'Luận giải thành công' });

    // Test deleteAll endpoint
    let deleteCall = null;
    globalThis.fetch = async (url, options) => {
      deleteCall = { url, options };
      return new Response(JSON.stringify({ success: true }));
    };
    const res = await ssoRequest('/readings/all?app=tuvi', { method: 'DELETE' });
    assert.deepEqual(res, { success: true });
    assert.equal(deleteCall.url, '/readings/all?app=tuvi');
    assert.equal(deleteCall.options.method, 'DELETE');
  } finally {
    globalThis.fetch = originalFetch;
    if (storage) Object.defineProperty(globalThis, 'localStorage', storage);
    else delete globalThis.localStorage;
    await server.close();
  }
});

