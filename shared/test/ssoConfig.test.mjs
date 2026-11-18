import test from 'node:test';
import assert from 'node:assert/strict';
import { getSsoApiBase, getSsoWebBase, getSsoLoginUrl, takeSsoCodeFromUrl, exchangeSsoCode, createSsoCodeExchangeCoordinator, fetchSsoSession, isSessionRejected, createSsoAuthFetch, SSO_BEARER_STORAGE_KEY, SSO_TAB_SYNC_CHANNEL, readSsoBearerToken, storeSsoBearerToken, setSsoBearerToken, clearSsoBearerToken, syncBearerFromSiblingTabs, attachSsoTabSync, closeSsoTabSyncListener, ssoFetch } from '../src/utils/ssoConfig.mjs';
import { createSsoProxy } from '../vite/ssoProxy.mjs';

test('local API uses a proxy while login returns to the original app, query and hash', () => {
  const env = { DEV: true, VITE_SSO_URL: 'https://sso.vunph.click/' };
  assert.equal(getSsoApiBase(env), '');
  assert.equal(getSsoWebBase(env), 'https://sso.vunph.click');
  for (const [port, path] of [[5173, 'kinhdich'], [5174, 'tarot'], [5175, 'tuvi'], [5176, 'talk'], [5177, 'note']]) {
    for (const host of ['localhost', '127.0.0.1']) {
      const href = `http://${host}:${port}/${path}/?invite=abc&sso_token=old#hop-hon`;
      const login = new URL(getSsoLoginUrl(env, href));
      assert.equal(login.origin, 'https://sso.vunph.click');
      assert.equal(login.pathname, '/ui/sso');
      assert.equal(login.searchParams.get('redirect'), `http://${host}:${port}/${path}/?invite=abc#hop-hon`);
    }
  }
  const codeRedirect = new URL(getSsoLoginUrl(env, 'http://localhost:5173/kinhdich/?invite=abc&sso_code=old#reading'));
  assert.equal(codeRedirect.searchParams.get('redirect'), 'http://localhost:5173/kinhdich/?invite=abc#reading');
  const productionRedirect = new URL(getSsoLoginUrl(env, 'https://vunph.id.vn/kinhdich/?invite=abc&sso_code=old#reading'));
  assert.equal(productionRedirect.origin, 'https://sso.vunph.click');
  assert.equal(productionRedirect.searchParams.get('redirect'), 'https://vunph.id.vn/kinhdich/?invite=abc#reading');
  const wwwRedirect = new URL(getSsoLoginUrl(env, 'https://www.vunph.id.vn/note/?invite=abc#editor'));
  assert.equal(wwwRedirect.searchParams.get('redirect'), 'https://www.vunph.id.vn/note/?invite=abc#editor');
  assert.equal(getSsoApiBase({ DEV: false }), 'https://sso.vunph.click');
  const custom = { DEV: true, VITE_SSO_URL: 'http://localhost:3000/' };
  assert.equal(new URL(getSsoLoginUrl(custom, 'http://localhost:5177/note/')).origin, 'http://localhost:3000');
  for (const options of Object.values(createSsoProxy(custom))) assert.equal(options.target, getSsoWebBase(custom));
});

test('OAuth callback code is removed from the URL and exchanged for a tab bearer', async () => {
  const historyState = { router: 'state' };
  let replaced;
  const code = takeSsoCodeFromUrl({
    location: { pathname: '/note/', search: '?invite=abc&sso_code=one-time&sso_token=legacy', hash: '#editor' },
    history: { state: historyState, replaceState: (...args) => { replaced = args; } },
    title: 'NoteNow',
  });
  assert.equal(code, 'one-time');
  assert.deepEqual(replaced, [historyState, 'NoteNow', '/note/?invite=abc#editor']);

  let request;
  let savedToken;
  const result = await exchangeSsoCode('https://sso.vunph.click', code, async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ success: true, user: { id: 'u1' }, token: 'short-lived-session' }));
  }, token => { savedToken = token; return true; });
  assert.equal(request.url, 'https://sso.vunph.click/sso/exchange');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'include');
  assert.deepEqual(request.options.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(request.options.body), { code: 'one-time' });
  assert.equal(savedToken, 'short-lived-session');
  assert.deepEqual(result, { success: true, user: { id: 'u1' }, token: 'short-lived-session' });
  await assert.rejects(
    exchangeSsoCode('https://sso.vunph.click', code, async () => new Response(JSON.stringify({ success: true, token: 'legacy-token' }))),
    /phiên đăng nhập không hợp lệ/,
  );
});

test('concurrent callback refreshes share one exchange and keep its result until committed', async () => {
  let resolveExchange;
  let exchangeCount = 0;
  const expected = { success: true, user: { id: 'u1' } };
  const coordinator = createSsoCodeExchangeCoordinator(() => {
    exchangeCount += 1;
    return new Promise(resolve => { resolveExchange = resolve; });
  });

  const callbackRequest = coordinator.getOrStart('/sso', 'one-time');
  const focusRefresh = coordinator.getOrStart('/sso', null);
  assert.equal(focusRefresh, callbackRequest);
  await Promise.resolve();
  assert.equal(exchangeCount, 1);

  resolveExchange(expected);
  assert.deepEqual(await callbackRequest, expected);
  coordinator.finish(callbackRequest);

  // A newer refresh can still persist the result if the original callback
  // request became stale before it could commit local auth state.
  assert.deepEqual(await coordinator.getOrStart('/sso', null), expected);
  coordinator.complete();
  assert.equal(coordinator.getOrStart('/sso', null), null);
  assert.equal(exchangeCount, 1);
});

test('session verification sends credentials and separates rejection from outages', async () => {
  const request = async (url, options) => {
    assert.equal(url, '/sso/me');
    assert.equal(options.headers, undefined);
    assert.equal(options.credentials, 'include');
    return new Response(JSON.stringify({ user: { id: 'test-user' } }));
  };
  assert.deepEqual(await fetchSsoSession('', request), { user: { id: 'test-user' } });
  for (const status of [401, 403, 500, 502, 503]) {
    await assert.rejects(fetchSsoSession('', async () => new Response('', { status })), error => {
      assert.equal(error.status, status);
      assert.equal(isSessionRejected(error), status === 401 || status === 403);
      return true;
    });
  }
  const network = new TypeError('Failed to fetch');
  await assert.rejects(fetchSsoSession('', async () => { throw network; }), error => {
    assert.equal(error, network);
    assert.equal(isSessionRejected(error), false);
    return true;
  });
});

test('authenticated SSO requests send the tab bearer and accept session rotation', async () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const requests = [];
  const auth = createSsoAuthFetch(async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ user: { id: 'u1' } }), {
      headers: { 'X-Sso-Session-Token': 'rotated-session' },
    });
  }, () => storage);
  auth.setToken('initial-session');

  await fetchSsoSession('/sso', auth.fetch);

  assert.equal(requests[0].url, '/sso/sso/me');
  assert.equal(new Headers(requests[0].options.headers).get('authorization'), 'Bearer initial-session');
  assert.equal(requests[0].options.credentials, 'include');
  assert.equal(auth.getToken(), 'rotated-session');
  assert.equal(storage.getItem(SSO_BEARER_STORAGE_KEY), 'rotated-session');

  await auth.fetch('/next-request');
  assert.equal(new Headers(requests[1].options.headers).get('authorization'), 'Bearer rotated-session');
});

test('401/403 clear a tab bearer, while network errors and server failures preserve it', async () => {
  for (const status of [401, 403]) {
    const values = new Map();
    const storage = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
    };
    const auth = createSsoAuthFetch(async () => new Response('', { status }), () => storage);
    auth.setToken('session-to-clear');
    await auth.fetch('/protected');
    assert.equal(auth.getToken(), null);
    assert.equal(values.has(SSO_BEARER_STORAGE_KEY), false);
  }

  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const serverError = createSsoAuthFetch(async () => new Response('', { status: 503 }), () => storage);
  serverError.setToken('session-to-keep');
  await serverError.fetch('/protected');
  assert.equal(serverError.getToken(), 'session-to-keep');

  const networkError = new TypeError('offline');
  const offline = createSsoAuthFetch(async () => { throw networkError; }, () => storage);
  await assert.rejects(offline.fetch('/protected'), error => error === networkError);
  assert.equal(offline.getToken(), 'session-to-keep');
});

test('callback exchange clears an old bearer on 401/403 but preserves it on 5xx', async () => {
  const originalFetch = globalThis.fetch;
  const subsequentRequests = [];
  globalThis.fetch = async (url, options) => {
    subsequentRequests.push({ url, options });
    return new Response('ok');
  };

  try {
    for (const status of [401, 403]) {
      setSsoBearerToken('old-tab-session');
      await assert.rejects(
        exchangeSsoCode('/sso', 'one-time-code', async () => new Response('', { status })),
        error => error.status === status,
      );
      await ssoFetch('/after-rejected-exchange');
      assert.equal(new Headers(subsequentRequests.at(-1).options.headers).get('authorization'), null);
    }

    setSsoBearerToken('old-tab-session');
    await assert.rejects(
      exchangeSsoCode('/sso', 'one-time-code', async () => new Response('', { status: 503 })),
      error => error.status === 503,
    );
    await ssoFetch('/after-failed-exchange');
    assert.equal(new Headers(subsequentRequests.at(-1).options.headers).get('authorization'), 'Bearer old-tab-session');
  } finally {
    globalThis.fetch = originalFetch;
    clearSsoBearerToken();
  }
});

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
    size: () => map.size,
  };
}

function createMockBroadcastChannelClass(recordedMessages = []) {
  const channelsByName = new Map();

  return class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.closed = false;
      this.onmessage = null;
      this.listeners = new Set();
      this.unrefCalled = false;
      if (!channelsByName.has(name)) {
        channelsByName.set(name, new Set());
      }
      channelsByName.get(name).add(this);
    }

    addEventListener(type, listener) {
      if (type === 'message' && typeof listener === 'function') {
        this.listeners.add(listener);
      }
    }

    removeEventListener(type, listener) {
      if (type === 'message') {
        this.listeners.delete(listener);
      }
    }

    postMessage(data) {
      if (this.closed) return;
      recordedMessages.push({ channel: this.name, data });
      const peers = Array.from(channelsByName.get(this.name) || []);
      queueMicrotask(() => {
        for (const peer of peers) {
          if (peer === this || peer.closed) continue;
          const event = { data };
          for (const listener of peer.listeners) {
            listener(event);
          }
          if (typeof peer.onmessage === 'function') {
            peer.onmessage(event);
          }
        }
      });
    }

    unref() {
      this.unrefCalled = true;
    }

    close() {
      this.closed = true;
      this.listeners.clear();
      this.onmessage = null;
      channelsByName.get(this.name)?.delete(this);
    }
  };
}

test('newly opened same-origin Tab B hydrates bearer from Tab A via BroadcastChannel without touching localStorage, and syncs rotation/logout', async () => {
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;

  const recordedMessages = [];
  const MockBroadcastChannel = createMockBroadcastChannelClass(recordedMessages);
  const tabASession = createMemoryStorage();
  const tabBSession = createMemoryStorage();
  const sharedLocalStorage = createMemoryStorage();

  // Tab A is already logged in with a valid session bearer in its tab-scoped sessionStorage.
  tabASession.setItem(SSO_BEARER_STORAGE_KEY, 'tab-a-session-bearer');

  globalThis.BroadcastChannel = MockBroadcastChannel;
  globalThis.localStorage = sharedLocalStorage;
  // Active window represents newly opened Tab B (e.g. clicking "Mở NoteNow ↗" with target="_blank" rel="noopener").
  globalThis.window = { sessionStorage: tabBSession };

  const tabA = attachSsoTabSync({
    storage: tabASession,
    BroadcastChannelImpl: MockBroadcastChannel,
  });

  const meRequests = [];
  globalThis.fetch = async (url, options = {}) => {
    meRequests.push({ url, options });
    return new Response(JSON.stringify({ user: { id: 'user-cross-tab', email: 'vu@vunph.id.vn' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    assert.equal(readSsoBearerToken(tabBSession), null);

    // Tab B calls fetchSsoSession with empty sessionStorage -> requests bearer from Tab A!
    const session = await fetchSsoSession('https://sso.vunph.click');
    assert.equal(session.user.id, 'user-cross-tab');
    assert.equal(tabBSession.getItem(SSO_BEARER_STORAGE_KEY), 'tab-a-session-bearer');
    assert.equal(meRequests.length, 1);
    assert.equal(meRequests[0].url, 'https://sso.vunph.click/sso/me');
    assert.equal(
      new Headers(meRequests[0].options.headers).get('authorization'),
      'Bearer tab-a-session-bearer',
    );
    // Security invariant: NEVER write bearer token to localStorage!
    assert.equal(sharedLocalStorage.size(), 0);
    assert.equal(sharedLocalStorage.getItem(SSO_BEARER_STORAGE_KEY), null);

    // Providing bearer must NOT trigger a sync-bearer storm.
    assert.deepEqual(
      recordedMessages.map((m) => m.data.type),
      ['request-bearer', 'provide-bearer'],
    );
    assert.equal(recordedMessages[0].channel, SSO_TAB_SYNC_CHANNEL);

    // Storing a refreshed/new bearer in Tab B broadcasts sync-bearer once to Tab A.
    recordedMessages.length = 0;
    assert.equal(storeSsoBearerToken('rotated-cross-tab-bearer'), true);
    await new Promise((resolve) => queueMicrotask(resolve));
    assert.equal(tabBSession.getItem(SSO_BEARER_STORAGE_KEY), 'rotated-cross-tab-bearer');
    assert.equal(tabASession.getItem(SSO_BEARER_STORAGE_KEY), 'rotated-cross-tab-bearer');
    assert.deepEqual(
      recordedMessages.map((m) => m.data.type),
      ['sync-bearer'],
    );

    // Logging out / clearing bearer in Tab B clears Tab A's sessionStorage too without re-broadcasting.
    recordedMessages.length = 0;
    clearSsoBearerToken();
    await new Promise((resolve) => queueMicrotask(resolve));
    assert.equal(tabBSession.getItem(SSO_BEARER_STORAGE_KEY), null);
    assert.equal(tabASession.getItem(SSO_BEARER_STORAGE_KEY), null);
    assert.equal(readSsoBearerToken(), null);
    assert.deepEqual(
      recordedMessages.map((m) => m.data.type),
      ['clear-bearer'],
    );
  } finally {
    tabA.close();
    closeSsoTabSyncListener();
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalBroadcastChannel === undefined) delete globalThis.BroadcastChannel;
    else globalThis.BroadcastChannel = originalBroadcastChannel;
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
    clearSsoBearerToken();
  }
});

test('syncBearerFromSiblingTabs resolves null after timeout when no sibling tab holds a bearer and skips BroadcastChannel for custom mock storage', async () => {
  const originalWindow = globalThis.window;
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  const recordedMessages = [];
  const MockBroadcastChannel = createMockBroadcastChannelClass(recordedMessages);
  const emptyTabStorage = createMemoryStorage();
  const customInjectedStorage = createMemoryStorage();

  globalThis.BroadcastChannel = MockBroadcastChannel;
  globalThis.window = { sessionStorage: emptyTabStorage };

  try {
    // Custom injected storage in unit tests bypasses BroadcastChannel immediately (0 messages).
    const customResult = await syncBearerFromSiblingTabs({
      timeoutMs: 80,
      storage: customInjectedStorage,
    });
    assert.equal(customResult, null);
    assert.equal(recordedMessages.length, 0);

    // Default tab storage with no logged-in sibling times out cleanly and closes temporary channel.
    const guestResult = await syncBearerFromSiblingTabs({ timeoutMs: 15 });
    assert.equal(guestResult, null);
    assert.equal(recordedMessages.length, 1);
    assert.equal(recordedMessages[0].data.type, 'request-bearer');
  } finally {
    closeSsoTabSyncListener();
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalBroadcastChannel === undefined) delete globalThis.BroadcastChannel;
    else globalThis.BroadcastChannel = originalBroadcastChannel;
  }
});
