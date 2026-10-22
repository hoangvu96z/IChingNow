import assert from 'node:assert/strict';
import test from 'node:test';
import { decryptData } from '../src/utils/legacyReadingCrypto.js';

test('legacy encrypted readings require a real account ID', async () => {
  assert.equal(await decryptData('enc_v1::legacy-payload', undefined), null);
  assert.equal(await decryptData('enc_v1::legacy-payload', 'default_user'), null);
  assert.equal(await decryptData('enc_v1::legacy-payload', '  '), null);
});

test('legacy reader leaves values without the legacy prefix unchanged', async () => {
  assert.deepEqual(await decryptData({ already: 'decoded' }, undefined), {
    already: 'decoded',
  });
  assert.equal(await decryptData('plain legacy text', undefined), 'plain legacy text');
});
