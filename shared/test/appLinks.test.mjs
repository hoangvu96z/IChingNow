import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppLink } from '../src/utils/appLinks.mjs';

test('SpiritNow uses the same origin in production and its own local dev port', () => {
  const location = new URL('http://localhost:5173/kinhdich/');

  assert.equal(getAppLink('/spiritnow/', { DEV: false }, location), '/spiritnow/');
  assert.equal(
    getAppLink('/spiritnow/', { DEV: true }, location),
    'http://localhost:5178/spiritnow/',
  );
});

test('.click-to-.id.vn: production on vunph.click maps known app routes to https://vunph.id.vn', () => {
  const location = new URL('https://vunph.click/kinhdich/');

  assert.equal(getAppLink('/note/', { DEV: false }, location), 'https://vunph.id.vn/note/');
  assert.equal(getAppLink('/kinhdich/', { DEV: false }, location), 'https://vunph.id.vn/kinhdich/');
  assert.equal(getAppLink('/tarot/', { DEV: false }, location), 'https://vunph.id.vn/tarot/');
  assert.equal(getAppLink('/tuvi/', { DEV: false }, location), 'https://vunph.id.vn/tuvi/');
  assert.equal(getAppLink('/talk/', { DEV: false }, location), 'https://vunph.id.vn/talk/');
  assert.equal(getAppLink('/spiritnow/', { DEV: false }, location), 'https://vunph.id.vn/spiritnow/');

  // Unknown route or SSO/admin URLs are not modified
  assert.equal(getAppLink('/admin/', { DEV: false }, location), '/admin/');
  assert.equal(getAppLink('/sso/login', { DEV: false }, location), '/sso/login');
});

test('.id.vn same-origin: production on vunph.id.vn keeps relative URLs', () => {
  const location = new URL('https://vunph.id.vn/kinhdich/');

  assert.equal(getAppLink('/note/', { DEV: false }, location), '/note/');
  assert.equal(getAppLink('/spiritnow/', { DEV: false }, location), '/spiritnow/');
  assert.equal(getAppLink('/tarot/', { DEV: false }, location), '/tarot/');
  assert.equal(getAppLink('/tuvi/', { DEV: false }, location), '/tuvi/');
  assert.equal(getAppLink('/talk/', { DEV: false }, location), '/talk/');
});

test('localhost DEV: preserves per-app port switching and current app relative link', () => {
  const location = new URL('http://localhost:5173/kinhdich/');

  // Different app switches to configured dev port
  assert.equal(getAppLink('/note/', { DEV: true }, location), 'http://localhost:5177/note/');
  assert.equal(getAppLink('/tarot/', { DEV: true }, location), 'http://localhost:5174/tarot/');
  assert.equal(getAppLink('/tuvi/', { DEV: true }, location), 'http://localhost:5175/tuvi/');
  assert.equal(getAppLink('/talk/', { DEV: true }, location), 'http://localhost:5176/talk/');

  // Same app keeps relative path
  assert.equal(getAppLink('/kinhdich/', { DEV: true }, location), '/kinhdich/');

  // Subpath on same app keeps relative path
  const subLocation = new URL('http://localhost:5173/kinhdich/history');
  assert.equal(getAppLink('/kinhdich/', { DEV: true }, subLocation), '/kinhdich/');

  // Unknown route returns unmodified path
  assert.equal(getAppLink('/admin/', { DEV: true }, location), '/admin/');
});

test('unknown host: preserves relative URLs in production and does not map to .id.vn', () => {
  const previewLocation = new URL('https://preview-123.example.com/kinhdich/');
  assert.equal(getAppLink('/note/', { DEV: false }, previewLocation), '/note/');
  assert.equal(getAppLink('/spiritnow/', { DEV: false }, previewLocation), '/spiritnow/');

  // Subdomain of vunph.click is not exactly vunph.click
  const ssoLocation = new URL('https://sso.vunph.click/login');
  assert.equal(getAppLink('/note/', { DEV: false }, ssoLocation), '/note/');
});
