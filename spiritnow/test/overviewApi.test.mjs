import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchMeOverview, fetchTarotCards, tarotCardsUrl } from '../src/overviewApi.mjs';
import { setSsoBearerToken, clearSsoBearerToken } from '../../shared/src/utils/ssoConfig.mjs';

test('overview request uses the authenticated read-only route with the tab bearer', async () => {
  const controller = new AbortController();
  let request;
  const originalFetch = globalThis.fetch;
  const payload = {
    apps: [
      { id: 'iching', href: '/kinhdich/', streak: null },
      { id: 'talk', label: 'TalkWithMe', href: '/talk/', streak: null },
    ],
  };
  setSsoBearerToken('overview-test-token');
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify(payload));
  };
  let result;
  try {
    result = await fetchMeOverview({ signal: controller.signal, apiBase: 'https://sso.example.test' });
  } finally {
    globalThis.fetch = originalFetch;
    clearSsoBearerToken();
  }

  assert.equal(request.url, 'https://sso.example.test/me/overview');
  assert.equal(request.options.credentials, 'include');
  assert.equal(request.options.signal, controller.signal);
  assert.equal(new Headers(request.options.headers).get('authorization'), 'Bearer overview-test-token');
  assert.deepEqual(result, payload);
});

test('overview request reports an HTTP failure without swallowing its status', async () => {
  await assert.rejects(
    () => fetchMeOverview({ fetchImpl: async () => ({ ok: false, status: 401 }), apiBase: '' }),
    (error) => error.status === 401 && /401/.test(error.message),
  );
});

test('Tarot data URL stays on the hosting origin and uses the Tarot dev port locally', async () => {
  const location = new URL('https://vunph.id.vn/spiritnow/');
  assert.equal(tarotCardsUrl(location, false).href, 'https://vunph.id.vn/tarot/data/cards.json');
  assert.equal(tarotCardsUrl(new URL('http://localhost:5178/spiritnow/'), true).href, 'http://localhost:5174/tarot/data/cards.json');

  let requestedUrl;
  const cards = [{ id: 'major-0' }];
  const result = await fetchTarotCards(async (url) => {
    requestedUrl = String(url);
    return { ok: true, json: async () => cards };
  }, location, { dev: false });
  assert.equal(requestedUrl, 'https://vunph.id.vn/tarot/data/cards.json');
  assert.deepEqual(result, cards);
});
