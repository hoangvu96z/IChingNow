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
