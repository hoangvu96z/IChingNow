import test from 'node:test';
import assert from 'node:assert/strict';
import { getSsoApiBase, getSsoWebBase, getSsoLoginUrl, takeSsoCodeFromUrl, exchangeSsoCode, createSsoCodeExchangeCoordinator, fetchSsoSession, isSessionRejected } from '../src/utils/ssoConfig.mjs';
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
  const legacyRedirect = new URL(getSsoLoginUrl(env, 'https://vunph.id.vn/note/?invite=abc#editor'));
  assert.equal(legacyRedirect.searchParams.get('redirect'), 'https://vunph.click/note/?invite=abc#editor');
  assert.equal(getSsoApiBase({ DEV: false }), 'https://sso.vunph.click');
  const custom = { DEV: true, VITE_SSO_URL: 'http://localhost:3000/' };
  assert.equal(new URL(getSsoLoginUrl(custom, 'http://localhost:5177/note/')).origin, 'http://localhost:3000');
  for (const options of Object.values(createSsoProxy(custom))) assert.equal(options.target, getSsoWebBase(custom));
});

test('OAuth callback code is removed from the URL and exchanged for a cookie session', async () => {
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
  const result = await exchangeSsoCode('https://sso.vunph.click', code, async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ success: true, user: { id: 'u1' } }));
  });
  assert.equal(request.url, 'https://sso.vunph.click/sso/exchange');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'include');
  assert.deepEqual(request.options.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(request.options.body), { code: 'one-time' });
  assert.deepEqual(result, { success: true, user: { id: 'u1' } });
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

test('session verification uses only the HttpOnly cookie and separates rejection from outages', async () => {
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
