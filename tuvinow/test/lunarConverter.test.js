import assert from 'node:assert/strict';
import test from 'node:test';
import { getDaysInMonth, validateLunarDate } from '../src/utils/lunarConverter.js';

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
