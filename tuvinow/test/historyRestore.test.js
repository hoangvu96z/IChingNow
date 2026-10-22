import assert from 'node:assert/strict';
import test from 'node:test';
import { getHistoryRestoreError } from '../src/utils/historyRestore.js';

test('legacy reading decryption failure prevents opening the reading', () => {
  const error = getHistoryRestoreError({
    _decryptionError: true,
    data: { inputData: { year: 1996 } },
  });

  assert.match(error, /không thể giải mã/i);
  assert.match(error, /không thể mở để ghi đè/i);
});

test('reading without input data cannot be restored', () => {
  assert.equal(getHistoryRestoreError({ data: {} }), 'Lá số này thiếu dữ liệu đầu vào.');
});

test('readable reading with input data can be restored', () => {
  assert.equal(getHistoryRestoreError({ data: { inputData: { year: 1996 } } }), '');
});
