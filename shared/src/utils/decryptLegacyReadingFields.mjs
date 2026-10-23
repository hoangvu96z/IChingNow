/**
 * Decrypt only legacy enc_v1 fields that a reading adapter explicitly owns.
 * Failed fields stay encrypted so callers can preserve the record and surface
 * a decryption warning without mutating the API response object.
 */
export async function decryptLegacyReadingFields(
  source,
  fields,
  userId,
  decryptData,
) {
  const data = { ...(source || {}) };
  let decryptionError = false;

  for (const field of fields) {
    const value = data[field];
    if (typeof value !== 'string' || !value.startsWith('enc_v1::')) continue;

    const decrypted = await decryptData(value, userId);
    if (decrypted === null) {
      decryptionError = true;
    } else {
      data[field] = decrypted;
    }
  }

  return { data, decryptionError };
}
