import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchMeOverview, fetchTarotCards, tarotCardsUrl } from '../src/overviewApi.mjs';

test('overview request uses the authenticated read-only route with cookies', async () => {
  const controller = new AbortController();
  let request;
  const payload = {
    apps: [
      { id: 'iching', href: '/kinhdich/', streak: null },
      { id: 'talk', label: 'TalkWithMe', href: '/talk/', streak: null },
    ],
  };
  const result = await fetchMeOverview(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => payload };
  }, controller.signal, 'https://sso.example.test');

  assert.equal(request.url, 'https://sso.example.test/me/overview');
  assert.equal(request.options.credentials, 'include');
  assert.equal(request.options.signal, controller.signal);
  assert.deepEqual(result, payload);
});

test('overview request reports an HTTP failure without swallowing its status', async () => {
  await assert.rejects(
    () => fetchMeOverview(async () => ({ ok: false, status: 401 }), undefined, ''),
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
