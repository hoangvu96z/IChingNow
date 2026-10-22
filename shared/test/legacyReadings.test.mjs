import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptData as decryptIChing } from '../../iching/src/utils/cryptoUtils.js';
import { decryptData as decryptTarot } from '../../tarotnow/src/utils/cryptoUtils.js';

const legacyCiphertext = 'enc_v1::AA==:AA==';

for (const [app, decryptData] of [
  ['IChingNow', decryptIChing],
  ['TarotNow', decryptTarot],
]) {
  test(`${app} refuses legacy decryption without an authenticated account ID`, async () => {
    assert.equal(await decryptData(legacyCiphertext), null);
    assert.equal(await decryptData(legacyCiphertext, ''), null);
    assert.equal(await decryptData(legacyCiphertext, 'default_user'), null);
    assert.equal(await decryptData('plain text without legacy encryption'), 'plain text without legacy encryption');
  });

  test(`${app} retains the legacy decrypt path when an account ID is supplied`, async () => {
    const originalWindow = globalThis.window;
    let digestInput = '';
    const key = {};
    globalThis.window = {
      crypto: {
        subtle: {
          async digest(_algorithm, value) {
            digestInput = new TextDecoder().decode(value);
            return new Uint8Array([1]).buffer;
          },
          async importKey() {
            return key;
          },
          async decrypt(_options, suppliedKey) {
            assert.equal(suppliedKey, key);
            return new TextEncoder().encode('{"restored":true}').buffer;
          },
        },
      },
    };

    try {
      assert.deepEqual(await decryptData(legacyCiphertext, 'account-123'), { restored: true });
      assert.ok(digestInput.startsWith('account-123:'));
    } finally {
      if (originalWindow === undefined) delete globalThis.window;
      else globalThis.window = originalWindow;
    }
  });
}
