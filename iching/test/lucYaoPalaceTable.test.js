import assert from 'node:assert/strict';
import test from 'node:test';
import { HEX_PALACE_AUTHORITATIVE } from '../src/data/lucYao.js';

test('palace lookup keeps the current final value for conflicting binary keys', () => {
  const retainedValues = {
    '011111': { palace: 'Chấn', queType: 'ngu-the', theHao: 5 },
    '001111': { palace: 'Đoài', queType: 'ngu-the', theHao: 5 },
    '000111': { palace: 'Đoài', queType: 'tu-the', theHao: 4 },
    '100011': { palace: 'Tốn', queType: 'tam-the', theHao: 3 },
    '100001': { palace: 'Tốn', queType: 'tu-the', theHao: 4 },
    '100000': { palace: 'Khôn', queType: 'nhat-the', theHao: 1 },
    '100010': { palace: 'Tốn', queType: 'du-hon', theHao: 4 },
    '110011': { palace: 'Đoài', queType: 'quy-hon', theHao: 3 },
    '001101': { palace: 'Ly', queType: 'nhat-the', theHao: 1 },
    '011101': { palace: 'Ly', queType: 'nhi-the', theHao: 2 },
    '011010': { palace: 'Ly', queType: 'ngu-the', theHao: 5 },
    '010010': { palace: 'Ly', queType: 'du-hon', theHao: 4 },
    '000100': { palace: 'Đoài', queType: 'tam-the', theHao: 3 },
  };

  for (const [binary, expected] of Object.entries(retainedValues)) {
    assert.deepEqual(HEX_PALACE_AUTHORITATIVE[binary], expected, binary);
  }
});
