import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { decryptData as decryptIChing } from '../../iching/src/utils/cryptoUtils.js';
import { decryptData as decryptTarot } from '../../tarotnow/src/utils/cryptoUtils.js';
import { decryptData as decryptTuVi } from '../../tuvinow/src/utils/cryptoUtils.js';

const legacyCiphertext = 'enc_v1::AAECAwQFBgcICQoL:LzAhZMRgJTSGIC5mC2kzY3rdgcfBh+f9Oenf';
const legacyAccountId = 'account-123';

for (const [app, decryptData] of [
  ['IChingNow', decryptIChing],
  ['TarotNow', decryptTarot],
  ['TuViNow', decryptTuVi],
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

  test(`${app} decrypts an enc_v1 ciphertext produced by the legacy AES-GCM format`, async () => {
    const originalWindow = globalThis.window;
    globalThis.window = { crypto: webcrypto };

    try {
      assert.equal(await decryptData(legacyCiphertext, legacyAccountId), 'legacy-v1');
    } finally {
      if (originalWindow === undefined) delete globalThis.window;
      else globalThis.window = originalWindow;
    }
  });

  test(`${app} returns null when a legacy payload cannot be decrypted`, async () => {
    const originalWindow = globalThis.window;
    const originalWarn = console.warn;
    globalThis.window = { crypto: webcrypto };
    console.warn = () => {};

    try {
      assert.equal(await decryptData('enc_v1::malformed', legacyAccountId), null);
      assert.equal(await decryptData(legacyCiphertext, 'different-account'), null);
    } finally {
      console.warn = originalWarn;
      if (originalWindow === undefined) delete globalThis.window;
      else globalThis.window = originalWindow;
    }
  });
}
