import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDaysInMonth,
  getYearCanChi,
  solarToLunar,
  validateLunarDate,
  validateSolarDate,
} from '../src/utils/lunarConverter.js';
import * as tuvinowLunarConverter from '../src/utils/lunarConverter.js';
import * as sharedLunarConverter from '../../shared/src/utils/lunarConverter.js';

test('lunar validation follows the calendar month length (29 vs 30 days)', () => {
  assert.equal(validateLunarDate(2025, 2, 29), true);
  assert.equal(validateLunarDate(2025, 2, 30), false);
  assert.equal(validateLunarDate(2025, 1, 30), true);
});

test('lunar day options omit day 30 for a 29-day month and keep 30 for a 30-day month', () => {
  assert.deepEqual(
    getDaysInMonth(true, 2025, 2).map(({ value }) => value),
    Array.from({ length: 29 }, (_, index) => index + 1),
  );
  assert.deepEqual(
    getDaysInMonth(true, 2025, 1).map(({ value }) => value),
    Array.from({ length: 30 }, (_, index) => index + 1),
  );
});

test('solar validation and day options respect leap/non-leap February and 30/31-day months', () => {
  assert.equal(validateSolarDate(2024, 2, 29), true);
  assert.equal(validateSolarDate(2025, 2, 29), false);
  assert.equal(validateSolarDate(2026, 2, 28), true);
  assert.equal(validateSolarDate(2026, 2, 29), false);
  assert.equal(validateSolarDate(2025, 4, 30), true);
  assert.equal(validateSolarDate(2025, 4, 31), false);

  assert.equal(getDaysInMonth(false, 2024, 2).length, 29);
  assert.equal(getDaysInMonth(false, 2025, 2).length, 28);
  assert.equal(getDaysInMonth(false, 2026, 2).length, 28);
  assert.equal(getDaysInMonth(false, 2025, 4).length, 30);
  assert.equal(getDaysInMonth(false, 2025, 1).length, 31);

  assert.throws(() => solarToLunar(2025, 2, 29));
  assert.throws(() => solarToLunar(2025, 4, 31));
});

test('solar conversion uses the converted lunar year for birth Can Chi (2024-02-05 => 2023 Quý Mão)', () => {
  const converted = solarToLunar(2024, 2, 5);
  assert.deepEqual(
    {
      lunarYear: converted.lunarYear,
      lunarMonth: converted.lunarMonth,
      lunarDay: converted.lunarDay,
      yearCanIndex: converted.yearCanIndex,
      yearChiIndex: converted.yearChiIndex,
      yearCanName: converted.yearCanName,
      yearChiName: converted.yearChiName,
    },
    {
      lunarYear: 2023,
      lunarMonth: 12,
      lunarDay: 26,
      yearCanIndex: 9,
      yearChiIndex: 3,
      yearCanName: 'Quý',
      yearChiName: 'Mão',
    },
  );
  assert.equal(getYearCanChi(2024, 2, 5), 'Quý Mão');
  assert.equal(getYearCanChi(2024, 2, 15), 'Giáp Thìn');
});

test('shared lunarConverter is unified with tuvinow lunarConverter', () => {
  assert.equal(sharedLunarConverter.validateLunarDate(2025, 2, 30), false);
  assert.equal(sharedLunarConverter.validateLunarDate(2025, 1, 30), true);
  assert.equal(sharedLunarConverter.validateSolarDate(2025, 2, 29), false);
  assert.equal(sharedLunarConverter.validateSolarDate(2024, 2, 29), true);
  assert.equal(sharedLunarConverter.getDaysInMonth(false, 2026, 2).length, 28);
  assert.equal(sharedLunarConverter.getDaysInMonth(true, 2025, 2).length, 29);
  assert.equal(sharedLunarConverter.getYearCanChi(2024, 2, 5), 'Quý Mão');
});

test('tuvinow lunarConverter exports identical references and signatures as canonical shared lunarConverter', () => {
  const expectedExports = [
    'GIO_SINH_OPTIONS',
    'solarToLunar',
    'validateSolarDate',
    'validateLunarDate',
    'getMonthsInYear',
    'getDaysInMonth',
    'getYearOptions',
    'getYearCanChi',
    'getViewYearOptions',
  ];
  for (const name of expectedExports) {
    assert.ok(name in sharedLunarConverter, `shared lunarConverter missing ${name}`);
    assert.strictEqual(
      tuvinowLunarConverter[name],
      sharedLunarConverter[name],
      `Export ${name} must be strictly identical reference from shared`,
    );
  }
});
