import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../../notenow/node_modules/vite/dist/node/index.js';

test('NoteNow callback preserves URL, retries outages with the token, rejects expired sessions', async () => {
  const originals = Object.fromEntries(['window', 'document', 'localStorage', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const items = new Map([['sso_logged_out', '1']]);
  let cleanedUrl;
  const setGlobal = (key, value) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  setGlobal('localStorage', { getItem: key => items.get(key) || null, setItem: (key, value) => items.set(key, value), removeItem: key => items.delete(key) });
  setGlobal('document', { title: 'NoteNow' });
  setGlobal('window', {
    location: { search: '?invite=abc&sso_token=callback-token', pathname: '/note/', hash: '#invite' },
    history: { replaceState: (_state, _title, url) => { cleanedUrl = url; window.location.search = '?invite=abc'; } },
  });
  const server = await createServer({ root: new URL('../../notenow/', import.meta.url).pathname, configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { ssoApi } = await server.ssrLoadModule('/src/api.js');
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/sso/me');
      assert.deepEqual(options.headers, { Authorization: 'Bearer callback-token' });
      return new Response(JSON.stringify({ user: { id: 'test-user' } }));
    };
    assert.equal((await ssoApi.getMe()).user.id, 'test-user');
    assert.equal(cleanedUrl, '/note/?invite=abc#invite');
    assert.equal(items.get('sso_token'), 'callback-token');
    assert.equal(items.has('sso_logged_out'), false);
    globalThis.fetch = async () => new Response('', { status: 502 });
    await assert.rejects(ssoApi.getMe(), error => error.status === 502);
    assert.equal(items.get('sso_token'), 'callback-token');
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(ssoApi.getMe(), /Failed to fetch/);
    assert.equal(items.get('sso_token'), 'callback-token');
    globalThis.fetch = async () => new Response('', { status: 401 });
    assert.equal(await ssoApi.getMe(), null);
    assert.equal(items.has('sso_token'), false);
    items.set('sso_logged_out', '1');
    globalThis.fetch = () => { throw new Error('Logged-out session must not be checked'); };
    assert.equal(await ssoApi.getMe(), null);
  } finally {
    await server.close();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
