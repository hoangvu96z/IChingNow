import assert from 'node:assert/strict';
import test from 'node:test';
import { getDaysInMonth, solarToLunar, validateLunarDate } from '../src/utils/lunarConverter.js';

test('lunar validation follows the calendar month length', () => {
  assert.equal(validateLunarDate(2025, 2, 29), true);
  assert.equal(validateLunarDate(2025, 2, 30), false);
  assert.equal(validateLunarDate(2025, 1, 30), true);
});

test('lunar day options omit day 30 for a 29-day month', () => {
  assert.deepEqual(
    getDaysInMonth(true, 2025, 2).map(({ value }) => value),
    Array.from({ length: 29 }, (_, index) => index + 1),
  );
});

test('solar conversion uses the converted lunar year for birth Can Chi', () => {
  const converted = solarToLunar(2024, 2, 5);
  assert.deepEqual(
    {
      lunarYear: converted.lunarYear,
      yearCanIndex: converted.yearCanIndex,
      yearChiIndex: converted.yearChiIndex,
    },
    { lunarYear: 2023, yearCanIndex: 9, yearChiIndex: 3 },
  );
});
