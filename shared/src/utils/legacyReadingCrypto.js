/**
 * Legacy enc_v1 reader for readings written before server-side encryption.
 * Its key is derived from public account data and a value shipped in this bundle,
 * so this format is not zero-knowledge or end-to-end encryption. New records are
 * sent over HTTPS and encrypted at rest by the SSO backend.
 */

const ENC_PREFIX = 'enc_v1::';
const MASTER_SALT = 'vinfi_client_e2ee_salt_2026_x89f2a';

function hasValidUserId(userId) {
  return (
    (typeof userId === 'string' && userId.trim() !== '' && userId.trim() !== 'default_user') ||
    (typeof userId === 'number' && Number.isSafeInteger(userId))
  );
}

async function getUserKey(userId) {
  if (!hasValidUserId(userId)) throw new Error('A valid account ID is required to decrypt legacy readings');
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${userId}:${MASTER_SALT}`)
  );
  return await window.crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

export async function decryptData(ciphertext, userId) {
  if (typeof ciphertext !== 'string' || !ciphertext.startsWith(ENC_PREFIX)) {
    return ciphertext;
  }
  if (!hasValidUserId(userId)) return null;

  try {
    const payload = ciphertext.slice(ENC_PREFIX.length);
    const [ivBase64, cipherBase64] = payload.split(':');

    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipherBuffer = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const key = await getUserKey(userId);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);

    try {
      return JSON.parse(decryptedText);
    } catch {
      return decryptedText;
    }
  } catch (err) {
    console.warn('Decryption failed or invalid key:', err);
    return null;
  }
}
