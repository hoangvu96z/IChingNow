import test from 'node:test';
import assert from 'node:assert/strict';
import { getSsoApiBase, getSsoWebBase, getSsoLoginUrl, fetchSsoSession, isSessionRejected } from '../src/utils/ssoConfig.mjs';
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
  assert.equal(getSsoApiBase({ DEV: false }), 'https://sso.vunph.click');
  const custom = { DEV: true, VITE_SSO_URL: 'http://localhost:3000/' };
  assert.equal(new URL(getSsoLoginUrl(custom, 'http://localhost:5177/note/')).origin, 'http://localhost:3000');
  for (const options of Object.values(createSsoProxy(custom))) assert.equal(options.target, getSsoWebBase(custom));
});

test('session verification sends bearer token, separates rejection from outages', async () => {
  const request = async (url, options) => {
    assert.equal(url, '/sso/me');
    assert.deepEqual(options.headers, { Authorization: 'Bearer test-token' });
    assert.equal(options.credentials, 'include');
    return new Response(JSON.stringify({ user: { id: 'test-user' } }));
  };
  assert.deepEqual(await fetchSsoSession('', 'test-token', request), { user: { id: 'test-user' } });
  for (const status of [401, 403, 500, 502, 503]) {
    await assert.rejects(fetchSsoSession('', null, async () => new Response('', { status })), error => {
      assert.equal(error.status, status);
      assert.equal(isSessionRejected(error), status === 401 || status === 403);
      return true;
    });
  }
  const network = new TypeError('Failed to fetch');
  await assert.rejects(fetchSsoSession('', 'test-token', async () => { throw network; }), error => {
    assert.equal(error, network);
    assert.equal(isSessionRejected(error), false);
    return true;
  });
});
