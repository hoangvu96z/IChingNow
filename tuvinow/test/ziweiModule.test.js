import test from 'node:test';
import assert from 'node:assert/strict';

import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { solarToLunar } from '../src/utils/lunarConverter.js';
import {
  // 1 & 2: solarTime.js
  THIEN_CAN,
  DIA_CHI,
  VN_LOCATIONS,
  findLocationById,
  findLocationByName,
  isValidGregorianDate,
  shiftGregorianDate,
  sameGregorianDate,
  equationOfTimeMinutes,
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  formatTrueSolarClock,
  formatSignedMinutes,
  isChinaDST,
  isChinaDSTYear,
  chinaDSTRange,
  chinaDSTSpan,
  chinaDSTYears,
  clockToStandardDelta,
  shiftClock,
  formatClock,
  resolveEffectiveLunarDate,
  getFourPillarsFromSolar,
  // 3: schoolConfig.js
  DEFAULT_SCHOOL_CONFIG,
  SCHOOL_MING_ZHU_BY_DIZHI,
  SCHOOL_SHEN_ZHU_BY_DIZHI,
  configToParams,
  paramsToConfig,
  getSchoolStarBrightness,
  schoolStarBrightness,
  validateSchoolData,
  // 4: sihua.js
  SIHUA_TYPES,
  GENG_SIHUA_VARIANTS,
  getSiHuaByStem,
  buildStarSiHuaMap,
  getDaXianSiHua,
  getLiuNianSiHua,
  getLiuYueSiHua,
  getLiuRiSiHua,
  getLiuShiSiHua,
  buildChartFlyingSihua,
  findIncomingPalaces,
  computeCrossChartSihua,
  // 5: shierShen.js & yunxian.js
  JIANG_QIAN_SHEN,
  SUI_QIAN_SHEN,
  THAI_TUE_SHEN_VI,
  BOSHI_SHEN,
  jiangQianShenByBranch,
  suiQianShenByBranch,
  boshiShenByStem,
  boshiReverse,
  buildShierShenForChart,
  YUNXIAN_MODES,
  CHILDHOOD_PALACE_LABELS,
  getActiveDaXianForAge,
  getChartDaXianList,
  getTamPhuongTuChinh,
  getBorrowedStarsForPalace,
  buildYunxianOverlay,
  // 6: patterns.js
  LEVEL_LABELS,
  detectPatterns,
  // 7: knowledge.js & index.js
  MAJOR_STAR_DETAILS,
  HEMING_KNOWLEDGE,
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  CAN_LUONG_POEMS,
  getCanLuongPoem,
  CLASSICS_LIBRARY,
  searchClassics,
  FAMOUS_CHARTS,
  enrichTuViChart,
} from '../../shared/src/utils/ziwei/index.js';

function buildV11ChartFromSolar(year, month, day, hourIndex = 0, gender = 1, policy = 'split', viewYear = undefined) {
  const effective = resolveEffectiveLunarDate(year, month, day, policy);
  const converted = solarToLunar(year, month, day);
  const input = {
    lunarYear: effective.lunarYear,
    lunarMonth: effective.lunarMonth,
    lunarDay: effective.lunarDay,
    lunarHourIndex: hourIndex,
    gender,
    yearCanIndex: converted.yearCanIndex,
    yearChiIndex: converted.yearChiIndex,
  };
  if (viewYear !== undefined) {
    input.viewYear = viewYear;
    input.viewYearCanIndex = ((viewYear - 4) % 10 + 10) % 10;
    input.viewYearChiIndex = ((viewYear - 4) % 12 + 12) % 12;
  }
  return { chart: anLaSoTuVi(input), input };
}

// ============================================================================
// 1. TRUE SOLAR TIME, EQUATION OF TIME, DATE VALIDATION & DST (solarTime.js)
// ============================================================================

test('1a. True Solar Time & Equation of Time for Vietnam (UTC+7) & International locations', () => {
  assert.ok(VN_LOCATIONS.length >= 63, 'VN_LOCATIONS should include all 63 Vietnam provinces plus international cities');

  const hanoi = findLocationById('vn-ha-noi') || findLocationByName('Hà Nội');
  const hcm = findLocationById('vn-tp-hcm') || findLocationByName('TP. Hồ Chí Minh');
  const dienBien = findLocationById('vn-dien-bien') || findLocationByName('Điện Biên');
  const daNang = findLocationById('vn-da-nang') || findLocationByName('Đà Nẵng');

  assert.ok(hanoi && Math.abs(hanoi.longitude - 105.8542) < 0.05 && hanoi.utcOffsetMinutes === 420);
  assert.ok(hcm && Math.abs(hcm.longitude - 106.6297) < 0.05 && hcm.utcOffsetMinutes === 420);
  assert.ok(dienBien && Math.abs(dienBien.longitude - 103.0169) < 0.05 && dienBien.utcOffsetMinutes === 420);
  assert.ok(daNang && Math.abs(daNang.longitude - 108.2022) < 0.05 && daNang.utcOffsetMinutes === 420);

  // Equation of Time sanity: Feb ~ -14 min, Nov ~ +16 min, invalid date = 0
  const eotFeb = equationOfTimeMinutes(2024, 2, 11, 12, 0);
  const eotNov = equationOfTimeMinutes(2024, 11, 3, 12, 0);
  assert.ok(eotFeb < -10 && eotFeb > -16, `Feb 11 EoT expected ~ -14m, got ${eotFeb}`);
  assert.ok(eotNov > 12 && eotNov < 18, `Nov 3 EoT expected ~ +16m, got ${eotNov}`);
  assert.equal(equationOfTimeMinutes(2023, 2, 29, 12, 0), 0);

  // Vietnam UTC+7 standard meridian is 105°E
  const tstHaNoi = calculateTrueSolarTime({
    year: 2024, month: 6, day: 15, clockHour: 11, clockMinute: 0,
    longitude: 105.85, utcOffsetMinutes: 420,
  });
  assert.equal(tstHaNoi.meridianDeg, 105);
  assert.ok(Math.abs(tstHaNoi.longitudeCorrectionMinutes - (105.85 - 105) * 4) < 1e-9);
  assert.equal(tstHaNoi.branch, 6); // Ngọ (11:00 + ~3.4m)
  assert.equal(tstHaNoi.branchName, 'Ngọ');

  // TP.HCM (106.66°E) vs Điện Biên (103.0169°E) vs Đà Nẵng (108.2022°E)
  const tstHcm = calculateTrueSolarTime({
    year: 2024, month: 3, day: 21, clockHour: 12, clockMinute: 0,
    longitude: 106.66, utcOffsetMinutes: 420,
  });
  assert.ok(Math.abs(tstHcm.longitudeCorrectionMinutes - 6.64) < 1e-6);

  const tstDienBien = calculateTrueSolarTime({
    year: 2024, month: 1, day: 15, clockHour: 11, clockMinute: 5,
    longitude: dienBien.longitude, utcOffsetMinutes: 420,
  });
  // Điện Biên is west of 105°E (~ -7.93 min longitude + ~ -9.5 min EoT in mid-Jan => ~ -17.4 min => 10:48 = Giờ Tỵ)
  assert.ok(tstDienBien.longitudeCorrectionMinutes < -7);
  assert.equal(tstDienBien.branch, 5); // Tỵ (shifted back from 11:05 into 10:xx)
  assert.equal(tstDienBien.branchName, 'Tỵ');

  const tstDaNang = calculateTrueSolarTime({
    year: 2024, month: 11, day: 3, clockHour: 10, clockMinute: 40,
    longitude: daNang.longitude, utcOffsetMinutes: 420,
  });
  // Đà Nẵng is east of 105°E (+12.8 min) + Nov EoT (+16.4 min) => +29.2 min => 11:09 = Giờ Ngọ
  assert.ok(tstDaNang.longitudeCorrectionMinutes > 12);
  assert.equal(tstDaNang.branch, 6); // Ngọ

  // International UTC+8 (meridian 120°E) vs New York UTC-5 (meridian -75°W)
  const tstBeijing = calculateTrueSolarTime({
    year: 1990, month: 5, day: 15, clockHour: 9, clockMinute: 16,
    longitude: 116.4, utcOffsetMinutes: 480,
  });
  assert.equal(tstBeijing.meridianDeg, 120);
  assert.ok(Math.abs(tstBeijing.longitudeCorrectionMinutes - (-14.4)) < 1e-9);

  const tstNY = calculateTrueSolarTime({
    year: 1995, month: 1, day: 15, clockHour: 14, clockMinute: 0,
    longitude: -74, utcOffsetMinutes: -300,
  });
  assert.equal(tstNY.meridianDeg, -75);
  assert.ok(Math.abs(tstNY.longitudeCorrectionMinutes - 4) < 1e-9);

  assert.match(formatTrueSolarClock(tstHaNoi, true), /^\d{2}:\d{2}:\d{2}$/);
  assert.equal(formatSignedMinutes(12.6), '+13');
  assert.equal(formatSignedMinutes(-7.9), '-8');
});

test('1b. resolveZiweiDayOffset across all 4 LateZishiRule modes & 23:30 True Solar Time boundary regression (form-true-solar-day.test.ts)', () => {
  // Ported from form-true-solar-day.test.ts (using UTC+8 / 120°E reference from original regression)
  const baseDate = { year: 2000, month: 1, day: 31 };
  const cases = [
    [23, 30, 120, { year: 2000, month: 2, day: 1, hour: 0 }, '120°E 23:30 Late Zishi -> next day Zi'],
    [0, 30, 120, { year: 2000, month: 1, day: 31, hour: 0 }, '120°E 00:30 Early Zishi -> same day Zi'],
    [23, 30, 100, { year: 2000, month: 1, day: 31, hour: 11 }, '100°E 23:30 (TST ~22:10) -> same day Hai'],
    [22, 30, 135, { year: 2000, month: 2, day: 1, hour: 0 }, '135°E 22:30 (TST ~23:30) -> next day Zi'],
    [0, 30, 80, { year: 2000, month: 1, day: 30, hour: 11 }, '80°E 00:30 (TST prev day ~21:50) -> prev day Hai'],
    [23, 50, 130, { year: 2000, month: 2, day: 1, hour: 0 }, '130°E 23:50 (TST next day ~00:30) -> next day Zi'],
  ];

  for (const [clockHour, clockMinute, longitude, expected, label] of cases) {
    const solar = calculateTrueSolarTime({
      ...baseDate,
      clockHour,
      clockMinute,
      longitude,
      utcOffsetMinutes: 480,
    });
    const dayOffset = resolveZiweiDayOffset(solar, 'next-day');
    const shifted = shiftGregorianDate(baseDate, dayOffset);
    assert.deepEqual(
      { ...shifted, hour: solar.branch },
      expected,
      label,
    );
  }

  // Verify all 4 LateZishiRule modes ('next-day', 'current-day', 'all-current', 'day-cur-time-next') on 23:30 Late Zishi
  const lateZiSolar = calculateTrueSolarTime({
    year: 2024, month: 5, day: 10, clockHour: 23, clockMinute: 30,
    longitude: 105, utcOffsetMinutes: 420,
  });
  assert.equal(lateZiSolar.branch, 0);
  assert.ok(lateZiSolar.normalizedMinutes >= 1380);
  assert.equal(resolveZiweiDayOffset(lateZiSolar, 'next-day'), 1);
  assert.equal(resolveZiweiDayOffset(lateZiSolar, 'current-day'), 0);
  assert.equal(resolveZiweiDayOffset(lateZiSolar, 'all-current'), 0);
  assert.equal(resolveZiweiDayOffset(lateZiSolar, 'day-cur-time-next'), 0);

  // When solar.dayOffset < 0 and lands in previous day's Late Zishi (e.g., 00:15 clock shifted back to 23:35 prev day)
  const prevDayLateZi = calculateTrueSolarTime({
    year: 2024, month: 5, day: 10, clockHour: 0, clockMinute: 15,
    longitude: 95, utcOffsetMinutes: 420,
  });
  assert.equal(prevDayLateZi.dayOffset, -1);
  assert.equal(prevDayLateZi.branch, 0);
  assert.ok(prevDayLateZi.normalizedMinutes >= 1380);
  assert.equal(resolveZiweiDayOffset(prevDayLateZi, 'next-day'), 0);
  assert.equal(resolveZiweiDayOffset(prevDayLateZi, 'current-day'), -1);
  assert.equal(resolveZiweiDayOffset(prevDayLateZi, 'all-current'), -1);
  assert.equal(resolveZiweiDayOffset(prevDayLateZi, 'day-cur-time-next'), -1);
});

test('1c. isValidGregorianDate rejects non-existent dates and accepts leap year dates (solar-date-exists.test.ts)', () => {
  for (const [year, month, day] of [
    [2023, 2, 29],
    [2026, 2, 30],
    [2026, 4, 31],
    [1925, 2, 29],
    [1925, 2, 30],
    [1980, 2, 30],
    [1925, 4, 31],
    [1925, 13, 1],
    [1925, 0, 10],
    [1925, 6, 0],
  ]) {
    assert.equal(isValidGregorianDate(year, month, day), false, `${year}-${month}-${day} must be rejected`);
  }

  for (const [year, month, day] of [
    [2024, 2, 29],
    [2000, 2, 29],
    [1924, 2, 29],
    [1980, 2, 29],
    [2023, 2, 28],
    [2026, 1, 31],
    [2026, 12, 31],
  ]) {
    assert.equal(isValidGregorianDate(year, month, day), true, `${year}-${month}-${day} must be accepted`);
  }

  assert.equal(sameGregorianDate({ year: 2024, month: 2, day: 29 }, shiftGregorianDate({ year: 2024, month: 2, day: 28 }, 1)), true);
});

test('1d. China DST oracle & clock shift regression (dst-cn.test.ts & clock-adjust.test.ts)', () => {
  const ORACLE_XLS_CN = [
    [1935, 5, 1, 9, 30], [1936, 5, 1, 9, 30], [1937, 5, 1, 9, 30], [1938, 5, 1, 9, 30],
    [1939, 5, 1, 9, 30], [1940, 5, 1, 9, 30], [1941, 5, 1, 9, 30], [1942, 5, 1, 9, 30],
    [1943, 5, 1, 9, 30], [1944, 5, 1, 9, 30], [1945, 5, 1, 9, 30], [1946, 5, 1, 9, 30],
    [1947, 5, 1, 9, 30], [1948, 5, 1, 9, 30], [1949, 5, 1, 9, 30], [1950, 5, 1, 9, 30],
    [1951, 5, 1, 9, 30], [1952, 3, 1, 10, 31], [1953, 4, 1, 10, 31], [1954, 4, 1, 10, 31],
    [1955, 5, 1, 9, 30], [1956, 5, 1, 9, 30], [1957, 4, 1, 9, 30], [1958, 4, 1, 9, 30],
    [1959, 4, 1, 9, 30], [1960, 6, 1, 9, 30], [1961, 6, 1, 9, 30], [1974, 4, 1, 10, 31],
    [1975, 4, 1, 10, 31], [1979, 7, 1, 9, 30], [1986, 5, 4, 9, 14], [1987, 4, 12, 9, 13],
    [1988, 4, 10, 9, 11], [1989, 4, 16, 9, 17], [1990, 4, 15, 9, 16], [1991, 4, 14, 9, 15],
  ];

  for (const [y, m1, d1, m2, d2] of ORACLE_XLS_CN) {
    assert.equal(isChinaDST(y, m1, d1), true, `${y}-${m1}-${d1} start date should be DST`);
    if (d1 > 1) assert.equal(isChinaDST(y, m1, d1 - 1), false, `${y}-${m1}-${d1 - 1} day before start should not be DST`);
    assert.equal(isChinaDST(y, m2, d2), true, `${y}-${m2}-${d2} end date should be DST`);
    const dim = new Date(Date.UTC(y, m2, 0)).getUTCDate();
    const [nm, nd] = d2 < dim ? [m2, d2 + 1] : [m2 + 1, 1];
    if (nm <= 12) assert.equal(isChinaDST(y, nm, nd), false, `${y}-${nm}-${nd} day after end should not be DST`);
  }

  assert.equal(isChinaDST(1986, 5, 3), false);
  assert.equal(isChinaDST(1986, 5, 4), true);
  assert.equal(isChinaDST(1988, 4, 10), true);
  assert.equal(isChinaDST(1991, 9, 15), true);
  assert.equal(isChinaDST(1991, 9, 16), false);
  assert.equal(isChinaDST(1992, 7, 1), false);
  assert.equal(isChinaDSTYear(1988), true);
  assert.equal(isChinaDSTYear(1992), false);
  assert.deepEqual(chinaDSTRange(1990), { start: '15/4', end: '16/9' });
  assert.deepEqual(chinaDSTSpan(1990), { startMonth: 4, startDay: 15, endMonth: 9, endDay: 16 });
  assert.equal(chinaDSTRange(1992), null);
  assert.equal(chinaDSTYears().length, ORACLE_XLS_CN.length);

  // clock-adjust.test.ts assertions
  assert.equal(clockToStandardDelta(540, 480), -60);
  assert.equal(clockToStandardDelta(-240, -300), -60);
  assert.equal(clockToStandardDelta(450, 480), 30);
  assert.deepEqual(shiftClock({ clockHour: '14', clockMinute: '30' }, -60), { clockHour: '13', clockMinute: '30' });
  assert.deepEqual(shiftClock({ clockHour: '1', clockMinute: '5' }, -60), { clockHour: '0', clockMinute: '5' });
  assert.equal(shiftClock({ clockHour: '0', clockMinute: '30' }, -60), null);
  assert.deepEqual(shiftClock({ clockHour: '8', clockMinute: '15' }, 30), { clockHour: '8', clockMinute: '45' });
  assert.equal(shiftClock({ clockHour: '23', clockMinute: '45' }, 30), null);
  assert.equal(shiftClock({ clockHour: '', clockMinute: '0' }, -60), null);
  assert.equal(shiftClock({ clockHour: '9', clockMinute: '0' }, 0), null);
  assert.equal(formatClock({ clockHour: '7', clockMinute: '5' }), '07:05');
});

// ============================================================================
// 2. LEAP MONTH POLICIES & LẬP XUÂN BOUNDARY (solarTime.js)
// ============================================================================

test('2a. resolveEffectiveLunarDate validates policies and resolves 2023 leap 2nd month & 2025 leap 6th month (leap-policy-validation.test.ts)', () => {
  // Invalid policies must throw RangeError immediately
  for (const invalidPolicy of ['nextmonth', 'next-monthh', '', 'NEXT-MONTH', null, 42, true]) {
    assert.throws(
      () => resolveEffectiveLunarDate(2025, 8, 10, invalidPolicy),
      RangeError,
      `Invalid policy ${JSON.stringify(invalidPolicy)} must throw RangeError`,
    );
  }

  // Default policy is 'split': 2025-08-03 (nhuận tháng 6 ngày 10 <= 15) -> tháng 6; 2025-08-10 (ngày 17 > 15) -> tháng 7
  const defFirstHalf = resolveEffectiveLunarDate(2025, 8, 3);
  assert.equal(defFirstHalf.lunarMonth, 6);
  assert.equal(defFirstHalf.isLeapMonth, false);
  const defSecondHalf = resolveEffectiveLunarDate(2025, 8, 10);
  assert.equal(defSecondHalf.lunarMonth, 7);
  assert.equal(defSecondHalf.isLeapMonth, false);

  // 2023 Leap 2nd Lunar Month (2023-03-22 to 2023-04-19) & 2025 Leap 6th Lunar Month (2025-07-25 to 2025-08-22)
  const leapCases = [
    { y: 2023, m: 3, d: 30, rawMonth: -2, isSecondHalf: false }, // 2023 nhuận tháng 2 ngày 9 (<=15)
    { y: 2023, m: 4, d: 10, rawMonth: -2, isSecondHalf: true },  // 2023 nhuận tháng 2 ngày 20 (>15)
    { y: 2025, m: 8, d: 3,  rawMonth: -6, isSecondHalf: false }, // 2025 nhuận tháng 6 ngày 10 (<=15)
    { y: 2025, m: 8, d: 13, rawMonth: -6, isSecondHalf: true },  // 2025 nhuận tháng 6 ngày 20 (>15)
  ];

  for (const tc of leapCases) {
    const absM = Math.abs(tc.rawMonth);
    for (const policy of ['split', 'next-month', 'prev-month', 'origin-month']) {
      const r = resolveEffectiveLunarDate(tc.y, tc.m, tc.d, policy);
      assert.equal(r.rawLunarMonth, tc.rawMonth);
      const expected =
        policy === 'origin-month' ? { month: absM, leap: true }
        : policy === 'prev-month' ? { month: absM, leap: false }
        : policy === 'next-month' ? { month: absM + 1, leap: false }
        : { month: tc.isSecondHalf ? absM + 1 : absM, leap: false };
      assert.equal(r.lunarMonth, expected.month, `${policy} on ${tc.y}-${tc.m}-${tc.d} month`);
      assert.equal(r.isLeapMonth, expected.leap, `${policy} on ${tc.y}-${tc.m}-${tc.d} isLeapMonth`);
    }
  }
});

test('2b. getFourPillarsFromSolar distinguishes exact Lập Xuân solar-term pillar vs Lunar pillar (sizhu-lichun-boundary.test.ts)', () => {
  // 2004-02-04: Lập Xuân occurs at 19:56 (Giờ Tuất).
  // Born at Giờ Sửu (hourIndex = 1, 02:00) is BEFORE Lập Xuân -> Solar-term year is Quý Mùi, month is Ất Sửu;
  // Lunar year (already past Mùng 1 Tết 2004-01-22) is Giáp Thân, month is Bính Dần.
  const beforeLiChun = getFourPillarsFromSolar(2004, 2, 4, 1);
  assert.equal(beforeLiChun.fourPillars[0], 'Quý Mùi', 'Before Lập Xuân on 2004-02-04 (Sửu) solar-term year pillar must be Quý Mùi');
  assert.equal(beforeLiChun.fourPillars[1], 'Ất Sửu', 'Before Lập Xuân on 2004-02-04 (Sửu) solar-term month pillar must be Ất Sửu');
  assert.equal(beforeLiChun.fourPillarsLunar[0], 'Giáp Thân', 'Lunar year pillar on 2004-02-04 must be Giáp Thân');
  assert.equal(beforeLiChun.fourPillarsLunar[1], 'Bính Dần', 'Lunar month pillar on 2004-02-04 must be Bính Dần');
  assert.equal(beforeLiChun.fourPillars[2], 'Quý Sửu', 'Day pillar unaffected by Lập Xuân');
  assert.equal(beforeLiChun.fourPillars[3], 'Quý Sửu', 'Hour pillar unaffected by Lập Xuân');

  // Born at Giờ Hợi (hourIndex = 11, 22:00) on 2004-02-04 is AFTER Lập Xuân (19:56) -> Giáp Thân / Bính Dần
  const afterLiChun = getFourPillarsFromSolar(2004, 2, 4, 11);
  assert.equal(afterLiChun.fourPillars[0], 'Giáp Thân', 'After Lập Xuân on 2004-02-04 (Hợi) solar-term year pillar must be Giáp Thân');
  assert.equal(afterLiChun.fourPillars[1], 'Bính Dần', 'After Lập Xuân on 2004-02-04 (Hợi) solar-term month pillar must be Bính Dần');

  // Day before & day after Lập Xuân
  assert.equal(getFourPillarsFromSolar(2004, 2, 3, 1).fourPillars[0], 'Quý Mùi');
  assert.equal(getFourPillarsFromSolar(2004, 2, 5, 1).fourPillars[0], 'Giáp Thân');

  // Non-boundary date 1990-06-15 Giờ Ngọ (hourIndex = 6): Canh Ngọ / Nhâm Ngọ / Tân Hợi / Giáp Ngọ
  const mid1990 = getFourPillarsFromSolar(1990, 6, 15, 6);
  assert.deepEqual(mid1990.fourPillars, ['Canh Ngọ', 'Nhâm Ngọ', 'Tân Hợi', 'Giáp Ngọ']);
});

// ============================================================================
// 3. SCHOOL CONFIG & 85-STAR BRIGHTNESS MATRICES (schoolConfig.js)
// ============================================================================

test('3a. getSchoolStarBrightness across v11, default (Toàn Thư 7 cấp), XD1, ZZ (Trung Châu 5 cấp), XD2 for all 14 major stars × 12 branches', () => {
  const validation = validateSchoolData();
  assert.equal(validation.ok, true, `validateSchoolData failed: ${validation.errors.join(', ')}`);
  assert.equal(Object.keys(SCHOOL_MING_ZHU_BY_DIZHI).length, 12);
  assert.equal(Object.keys(SCHOOL_SHEN_ZHU_BY_DIZHI).length, 12);

  const majorStars = [
    'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh',
    'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương',
    'Thất Sát', 'Phá Quân',
  ];
  const schools = ['v11', 'default', 'XD1', 'ZZ', 'XD2'];
  const validTiers = new Set(['bright', 'normal', 'dim']);

  for (const school of schools) {
    for (const star of majorStars) {
      for (let branch = 0; branch < 12; branch++) {
        const b = getSchoolStarBrightness(star, branch, school);
        assert.ok(b, `Missing brightness for ${star} at branch ${branch} (${DIA_CHI[branch]}) in school ${school}`);
        assert.ok(typeof b.code === 'string' && b.code.length > 0);
        assert.ok(typeof b.label === 'string' && b.label.length > 0);
        assert.ok(validTiers.has(b.tier), `Invalid tier ${b.tier} for ${star}`);
        assert.equal(schoolStarBrightness(star, branch, school), b.label);
      }
    }
  }

  // Specific school differences:
  // 'default' (Toàn Thư 7 cấp) includes 'Lợi' (L) and 'Bất' (Bt); 'ZZ' (Trung Châu 5 cấp) includes 'Nhàn' (N)
  const defaultCodes = new Set();
  const zzCodes = new Set();
  for (const star of majorStars) {
    for (let branch = 0; branch < 12; branch++) {
      defaultCodes.add(getSchoolStarBrightness(star, branch, 'default').code);
      zzCodes.add(getSchoolStarBrightness(star, branch, 'ZZ').code);
    }
  }
  assert.ok(defaultCodes.has('L') && defaultCodes.has('Bt'), 'Toàn Thư 7 cấp should include Lợi (L) and Bất (Bt)');
  assert.ok(zzCodes.has('N') && !zzCodes.has('L'), 'Trung Châu 5 cấp should include Nhàn (N) and not Lợi (L)');
});

test('3b. configToParams & paramsToConfig round-trip serialization', () => {
  // Default config produces empty params object
  assert.deepEqual(configToParams(DEFAULT_SCHOOL_CONFIG), {});
  assert.deepEqual(paramsToConfig({}), DEFAULT_SCHOOL_CONFIG);

  const customConfig = {
    brightnessSchool: 'ZZ',
    gengYearSihua: 'GYWFT',
    tianmaSchool: 'month-branch',
    tiankongSchool: 'shun-jia-shi',
    jiekongSchool: 'single',
    kuiyueSchool: 'qs1',
    tianshiTianshang: 'zhongzhou',
    changshengSchool: 'shui-tu',
    lateZishi: 'current-day',
    leapMonth: 'next-month',
  };
  const params = configToParams(customConfig);
  assert.equal(Object.keys(params).length, 10);
  const restored = paramsToConfig(params);
  assert.deepEqual(restored, customConfig);

  // Also works with URLSearchParams instance and normalizes legacy 'QS' -> 'default'
  const urlParams = new URLSearchParams({ bs: 'QS', gys: 'GYWYT', lm: 'invalid-policy' });
  const fromUrl = paramsToConfig(urlParams);
  assert.equal(fromUrl.brightnessSchool, 'default');
  assert.equal(fromUrl.gengYearSihua, 'GYWYT');
  assert.equal(fromUrl.leapMonth, 'split');
});

// ============================================================================
// 4. MULTI-LAYER TỨ HÓA, PHI TINH TỰ HÓA & CROSS-CHART SYNASTRY (sihua.js)
// ============================================================================

test('4a. getSiHuaByStem across all 10 stems & all 5 Can Canh (Geng) school variants', () => {
  for (let stemIdx = 0; stemIdx < 10; stemIdx++) {
    const sh = getSiHuaByStem(stemIdx);
    const byName = getSiHuaByStem(THIEN_CAN[stemIdx]);
    assert.deepEqual(sh, byName);
    for (const key of ['Loc', 'Quyen', 'Khoa', 'Ky', ...SIHUA_TYPES]) {
      assert.ok(typeof sh[key] === 'string' && sh[key].length > 0, `Missing ${key} for stem ${stemIdx}`);
    }
    const map = buildStarSiHuaMap(stemIdx);
    assert.equal(Object.keys(map).length, 4);
  }

  // Verify all 5 Can Canh (Geng, index 6) variants: v11, GYWYT, GYWFT, GYWFX, GYWTX
  const expectedGeng = {
    v11:   ['Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Thái Âm'],
    GYWYT: ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'],
    GYWFT: ['Thái Dương', 'Vũ Khúc', 'Thiên Phủ', 'Thiên Đồng'],
    GYWFX: ['Thái Dương', 'Vũ Khúc', 'Thiên Phủ', 'Thiên Tướng'],
    GYWTX: ['Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Thiên Tướng'],
  };
  for (const [variant, [loc, quyen, khoa, ky]] of Object.entries(expectedGeng)) {
    const res = getSiHuaByStem('Canh', { gengYearSihua: variant });
    assert.deepEqual([res.Loc, res.Quyen, res.Khoa, res.Ky], [loc, quyen, khoa, ky], `Geng variant ${variant} mismatch`);
    assert.deepEqual(GENG_SIHUA_VARIANTS[variant], [loc, quyen, khoa, ky]);
  }
});

test('4b. Multi-layer Tứ Hóa: getDaXianSiHua, getLiuNianSiHua, getLiuYueSiHua, getLiuRiSiHua, getLiuShiSiHua', () => {
  const { chart } = buildV11ChartFromSolar(1990, 5, 15, 4, 1, 'split', 2026);

  const dxByChi = getDaXianSiHua(chart, { chiIndex: 2 });
  const dxByAge = getDaXianSiHua(chart, { age: 25 });
  assert.ok(dxByChi && dxByChi.palaceChiIndex === 2 && dxByChi.transforms.Loc);
  assert.ok(dxByAge && dxByAge.transforms.Ky);

  // 2026 = Bính Ngọ (stemIndex 2, branchIndex 6): Đồng - Cơ - Xương - Liêm
  const ln = getLiuNianSiHua(2026);
  assert.equal(ln.stemName, 'Bính');
  assert.equal(ln.branchName, 'Ngọ');
  assert.equal(ln.transforms.Loc, 'Thiên Đồng');
  assert.equal(ln.transforms.Ky, 'Liêm Trinh');

  // Năm Bính (stem 2), tháng 1 Âm lịch = Canh Dần (stem 6, branch 2)
  const ly = getLiuYueSiHua(ln.stemIndex, 1);
  assert.equal(ly.stemName, 'Canh');
  assert.equal(ly.branchName, 'Dần');
  assert.equal(ly.transforms.Loc, 'Thái Dương');

  // Lưu Nhật & Lưu Thời
  const lr = getLiuRiSiHua(2026, 4, 15, false);
  assert.ok(lr && typeof lr.stemIndex === 'number' && lr.transforms.Loc);

  const ls = getLiuShiSiHua(0, 0); // Ngày Giáp (0) giờ Tý (0) -> Giáp Tý (0)
  assert.equal(ls.stemName, 'Giáp');
  assert.equal(ls.branchName, 'Tý');
  assert.equal(ls.transforms.Loc, 'Liêm Trinh');
});

test('4c. buildChartFlyingSihua computes 12-palace flying transformations, laiNhanCung, selfSihua & xiangXinSihua', () => {
  const { chart } = buildV11ChartFromSolar(1988, 10, 8, 6, 1);
  const flying = buildChartFlyingSihua(chart);

  assert.ok(flying.laiNhanCung, 'laiNhanCung should be resolved');
  assert.equal(flying.laiNhanCung.canName, 'Mậu', '1988 Mậu Thìn birth stem is Mậu');
  assert.equal(flying.palaces.length, 12, 'Should compute flying transformations for all 12 palaces');

  for (const p of flying.palaces) {
    assert.equal(p.flights.length, 4, 'Each palace emits 4 flying transformations (Lộc, Quyền, Khoa, Kỵ)');
    assert.ok(Array.isArray(p.selfOut) && Array.isArray(p.selfSihua));
    assert.ok(Array.isArray(p.oppositeIn) && Array.isArray(p.xiangXinSihua));
  }
  assert.ok(Array.isArray(flying.selfSihua));
  assert.ok(Array.isArray(flying.xiangXinSihua));

  // Verify detectPalaceSelfSihua & findIncomingPalaces on a controlled synthetic palace pair:
  // Cung Tý (0) Can Giáp (Liêm Lộc, Phá Quyền, Vũ Khoa, Dương Kỵ) has Liêm Trinh (Tự Hóa Lộc)
  // Đối cung Ngọ (6) Can Canh (Dương Lộc, Vũ Quyền, Đồng Khoa, Âm Kỵ) has Thái Dương -> Tý flies Hóa Kỵ to Ngọ (Hướng Tâm vào Ngọ),
  // and Ngọ has Can Canh which flies Thái Dương Hóa Lộc into Ngọ itself and Vũ Khúc Hóa Quyền into Tý!
  const mockPalaces = Array.from({ length: 12 }, (_, idx) => ({
    chiIndex: idx,
    chiName: DIA_CHI[idx],
    canName: idx === 0 ? 'Giáp' : idx === 6 ? 'Canh' : THIEN_CAN[idx % 10],
    chucNang: idx === 0 ? 'Mệnh' : idx === 6 ? 'Thiên Di' : `Cung ${idx}`,
    isMenh: idx === 0,
    chinhTinh: idx === 0 ? ['Liêm Trinh(V)', 'Vũ Khúc(M)'] : idx === 6 ? ['Thái Dương(M)'] : [],
    phuTinh: [],
  }));
  const mockChart = { canChiNam: 'Giáp Tý', palates: mockPalaces };
  const mockFlying = buildChartFlyingSihua(mockChart);
  const tyPalace = mockFlying.palaces.find(p => p.chiIndex === 0);
  const ngoPalace = mockFlying.palaces.find(p => p.chiIndex === 6);

  assert.ok(tyPalace.selfSihua.some(s => s.starName === 'Liêm Trinh' && s.siHua === 'Hóa Lộc'), 'Tý should have Tự Hóa Lộc on Liêm Trinh');
  assert.ok(tyPalace.selfSihua.some(s => s.starName === 'Vũ Khúc' && s.siHua === 'Hóa Khoa'), 'Tý should have Tự Hóa Khoa on Vũ Khúc');
  assert.ok(tyPalace.xiangXinSihua.some(s => s.starName === 'Vũ Khúc' && s.siHua === 'Hóa Quyền'), 'Tý should receive Hướng Tâm Hóa Quyền from Ngọ (Canh)');
  assert.ok(ngoPalace.xiangXinSihua.some(s => s.starName === 'Thái Dương' && s.siHua === 'Hóa Kỵ'), 'Ngọ should receive Hướng Tâm Hóa Kỵ from Tý (Giáp)');
  assert.ok(findIncomingPalaces(mockChart, 'Thái Dương', 'Hóa Kỵ').some(p => p.chiIndex === 0));
});

test('4d. computeCrossChartSihua returns bidirectional Lộc/Quyền/Khoa/Kỵ synastry hits and score', () => {
  const { chart: chartA } = buildV11ChartFromSolar(1992, 4, 18, 4, 1);
  const { chart: chartB } = buildV11ChartFromSolar(1995, 9, 22, 5, 0);

  const cross = computeCrossChartSihua(chartA, chartB);
  assert.ok(cross.aToB && Array.isArray(cross.aToB.flights) && cross.aToB.flights.length >= 12);
  assert.ok(cross.bToA && Array.isArray(cross.bToA.flights) && cross.bToA.flights.length >= 12);
  assert.ok(Array.isArray(cross.highlights));
  assert.equal(cross.totalScoreDelta, cross.aToB.harmonyScore + cross.bToA.harmonyScore);

  const allHits = [...cross.aToB.flights, ...cross.bToA.flights];
  for (const shType of SIHUA_TYPES) {
    assert.ok(allHits.some(f => f.siHua === shType), `Expected cross-chart flight for ${shType}`);
  }
});

// ============================================================================
// 5. THẬP NHỊ THẦN (shierShen.js) & VẬN HẠN (yunxian.js)
// ============================================================================

test('5a. boshiShenByStem, suiQianShenByBranch, jiangQianShenByBranch return all 12 spirits with Vietnamese names', () => {
  assert.equal(BOSHI_SHEN.length, 12);
  assert.equal(SUI_QIAN_SHEN.length, 12);
  assert.equal(THAI_TUE_SHEN_VI.length, 12);
  assert.equal(JIANG_QIAN_SHEN.length, 12);

  // Verify Dương Nam Âm Nữ thuận (reverse=false), Âm Nam Dương Nữ nghịch (reverse=true)
  assert.equal(boshiReverse(0, 1), false); // Giáp (Dương) + Nam -> thuận
  assert.equal(boshiReverse(0, 0), true);  // Giáp (Dương) + Nữ -> nghịch
  assert.equal(boshiReverse(1, 1), true);  // Ất (Âm) + Nam -> nghịch
  assert.equal(boshiReverse(1, 0), false); // Ất (Âm) + Nữ -> thuận

  for (let stem = 0; stem < 10; stem++) {
    for (const gender of [0, 1]) {
      const indices = boshiShenByStem(stem, gender);
      assert.equal(indices.length, 12);
      assert.deepEqual([...indices].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    }
  }

  for (let branch = 0; branch < 12; branch++) {
    const sui = suiQianShenByBranch(branch);
    const jiang = jiangQianShenByBranch(branch);
    assert.deepEqual([...sui].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.deepEqual([...jiang].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    // At anchor branch itself, suiQianShen must be index 0 ('Tuế Kiến' / 'Thái Tuế')
    assert.equal(SUI_QIAN_SHEN[sui[branch]], 'Tuế Kiến');
    assert.equal(THAI_TUE_SHEN_VI[sui[branch]], 'Thái Tuế');
  }

  const { chart } = buildV11ChartFromSolar(1990, 5, 15, 4, 1);
  const chartShen = buildShierShenForChart(chart, { activeBranchIndex: 6 });
  assert.equal(chartShen.length, 12);
  assert.equal(chartShen[6].activeThaiTue, 'Thái Tuế');
  assert.equal(chartShen[6].activeJiangQian, 'Tướng Tinh'); // Dần Ngọ Tuất -> Tướng Tinh tại Ngọ (6)
});

test('5b. getTamPhuongTuChinh, getBorrowedStarsForPalace (Vô Chính Diệu), getActiveDaXianForAge (Đồng Hạn 1–5) & buildYunxianOverlay', () => {
  // Tam Phương Tứ Chính for Dần (2): tamHop Ngọ(6) & Tuất(10), xungChieu Thân(8), giapCung Sửu(1) & Mão(3)
  const tp = getTamPhuongTuChinh(2);
  assert.equal(tp.targetName, 'Dần');
  assert.equal(tp.xungChieu, 8);
  assert.equal(tp.xungChieuName, 'Thân');
  assert.deepEqual(tp.tamHop, [6, 10]);
  assert.deepEqual(tp.giapCung, [1, 3]);

  // Find a chart with Vô Chính Diệu palace and verify getBorrowedStarsForPalace borrows 70% from opposite palace
  const { chart } = buildV11ChartFromSolar(1996, 4, 12, 3, 1, 'split', 2026);
  const borrowList = Array.from({ length: 12 }, (_, i) => getBorrowedStarsForPalace(chart, i));
  const vcdPalace = borrowList.find(b => b.isVoChinhDieu && b.borrowedChinhTinh.length > 0);
  assert.ok(vcdPalace, 'Should have at least one Vô Chính Diệu palace borrowing major stars from opposite palace');
  assert.equal(vcdPalace.strengthRatio, 0.7);
  assert.equal(vcdPalace.borrowedFromChiIndex, (vcdPalace.chiIndex + 6) % 12);
  assert.deepEqual(vcdPalace.effectiveChinhTinh, vcdPalace.borrowedChinhTinh);
  assert.ok(typeof vcdPalace.tuanTrietNote === 'string' && vcdPalace.tuanTrietNote.length > 0);

  // Đồng Hạn (Childhood ages 1..5 before first Đại Hạn): Nhất Mệnh, Nhị Tài, Tam Tật, Tứ Phối, Ngũ Phúc
  // Construct a Hoả Lục Cục chart (cucNumber = 6, first Đại Hạn starts at age 6) so ages 1..5 are all Đồng Hạn
  let lucCucChart = null;
  for (let h = 0; h < 12; h++) {
    const { chart: c } = buildV11ChartFromSolar(1990, 5, 15, h, 1);
    const minDh = Math.min(...c.palates.map(p => p.daiHan));
    if (minDh === 6) {
      lucCucChart = c;
      break;
    }
  }
  assert.ok(lucCucChart, 'Should find a Hỏa Lục Cục chart starting Đại Hạn at age 6');

  for (let age = 1; age <= 5; age++) {
    const dh = getActiveDaXianForAge(lucCucChart, age);
    assert.equal(dh.isChildhood, true, `Age ${age} in Lục Cục must be Đồng Hạn`);
    assert.equal(dh.natalChucNang, CHILDHOOD_PALACE_LABELS[age], `Age ${age} Đồng Hạn must map to ${CHILDHOOD_PALACE_LABELS[age]}`);
  }
  const adultDh = getActiveDaXianForAge(lucCucChart, 28);
  assert.equal(adultDh.isChildhood, false);
  assert.ok(adultDh.startAge <= 28 && 28 <= adultDh.endAge);
  assert.equal(getChartDaXianList(lucCucChart).length, 12);

  // buildYunxianOverlay
  assert.equal(YUNXIAN_MODES.length, 6);
  const overlay = buildYunxianOverlay(chart, {
    mode: 'liuyue',
    viewYear: 2026,
    lunarMonth: 4,
    lunarDay: 15,
    hourIndex: 6,
  });
  assert.equal(overlay.mode, 'liuyue');
  assert.ok(overlay.activeDaXian);
  assert.equal(Object.keys(overlay.daXianPalaceMap).length, 12);
  assert.equal(Object.keys(overlay.luuNienPalaceMap).length, 12);
  assert.equal(Object.keys(overlay.luuNguyetPalaceMap).length, 12);
  assert.ok(overlay.sihuaLayers.daXian);
  assert.ok(overlay.sihuaLayers.liuNian);
  assert.ok(overlay.sihuaLayers.liuYue);
  assert.ok(overlay.sihuaLayers.liuRi);
  assert.ok(overlay.sihuaLayers.liuShi);
});

// ============================================================================
// 6. 44 CLASSICAL PATTERNS RECOGNITION & SIHUA BONUS REGRESSION (patterns.js)
// ============================================================================

function makeCustomChart({ canChiNam = 'Giáp Tý', menhChi = 2, thanChi = 2, palaceStars = {} }) {
  const names = [
    'Mệnh', 'Huynh Đệ', 'Phu Thê', 'Tử Tức', 'Tài Bạch', 'Tật Ách',
    'Thiên Di', 'Nô Bộc', 'Quan Lộc', 'Điền Trạch', 'Phúc Đức', 'Phụ Mẫu',
  ];
  const palates = Array.from({ length: 12 }, (_, chi) => {
    const offset = ((menhChi - chi) % 12 + 12) % 12;
    const baseName = names[offset];
    const spec = palaceStars[chi] || {};
    return {
      chiIndex: chi,
      chiName: DIA_CHI[chi],
      canName: THIEN_CAN[chi % 10],
      chucNang: chi === thanChi ? `${baseName} <THÂN>` : baseName,
      isMenh: chi === menhChi,
      isThan: chi === thanChi,
      chinhTinh: spec.chinhTinh || [],
      phuTinh: spec.phuTinh || [],
      daiHan: 2 + offset * 10,
    };
  });
  return {
    canChiNam,
    menhCung: DIA_CHI[menhChi],
    thanCung: DIA_CHI[thanChi],
    palates,
  };
}

test('6a. detectPatterns detects major classical patterns with Vietnamese names, conditions.required/bonus/breaking & source', () => {
  // 1. Tử Phủ Đồng Cung + Quân Thần Khánh Hội + Tam Kỳ Gia Hội
  const chartTuPhu = makeCustomChart({
    canChiNam: 'Giáp Tý', // Giáp: Liêm Lộc, Phá Quyền, Vũ Khoa, Dương Kỵ
    menhChi: 2, // Dần
    palaceStars: {
      2:  { chinhTinh: ['Tử Vi(M)', 'Thiên Phủ(M)'], phuTinh: ['Tả Phụ', 'Văn Xương', 'Hóa Lộc'] },
      6:  { chinhTinh: ['Liêm Trinh(V)', 'Thiên Tướng(M)'], phuTinh: ['Hữu Bật', 'Hóa Quyền'] },
      10: { chinhTinh: ['Vũ Khúc(M)'], phuTinh: ['Hóa Khoa', 'Địa Không', 'Địa Kiếp'] },
    },
  });
  const pats1 = detectPatterns(chartTuPhu);
  const patIds1 = new Set(pats1.map(p => p.id));
  assert.ok(patIds1.has('tu-phu-dong-cung'), 'Should detect Tử Phủ Đồng Cung');
  assert.ok(patIds1.has('quan-than-khanh-hoi'), 'Should detect Quân Thần Khánh Hội');
  assert.ok(patIds1.has('tam-ky-gia-hoi'), 'Should detect Tam Kỳ Gia Hội');

  for (const p of pats1) {
    assert.ok(p.name && p.level && LEVEL_LABELS[p.level]);
    assert.ok(Array.isArray(p.conditions.required) && p.conditions.required.length > 0);
    assert.ok(Array.isArray(p.conditions.bonus));
    assert.ok(Array.isArray(p.conditions.breaking));
    assert.ok(typeof p.source === 'string' && p.source.includes('《'));
  }

  // 2. Cơ Nguyệt Đồng Lương + Nhật Nguyệt Đồng Cung
  const chartCNDL = makeCustomChart({
    canChiNam: 'Ất Sửu',
    menhChi: 2, // Dần: Thiên Đồng + Thiên Lương
    palaceStars: {
      2:  { chinhTinh: ['Thiên Đồng(M)', 'Thiên Lương(M)'], phuTinh: ['Văn Xương', 'Hóa Khoa'] },
      6:  { chinhTinh: ['Thái Âm(V)'], phuTinh: [] },
      10: { chinhTinh: ['Thiên Cơ(M)'], phuTinh: [] },
      1:  { chinhTinh: ['Thái Dương(Đ)', 'Thái Âm(M)'], phuTinh: [] },
    },
  });
  const patIds2 = new Set(detectPatterns(chartCNDL).map(p => p.id));
  assert.ok(patIds2.has('co-nguyet-dong-luong'), 'Should detect Cơ Nguyệt Đồng Lương');
  assert.ok(patIds2.has('thien-dong-thien-luong'), 'Should detect Đồng Lương Dần Thân');
  assert.ok(patIds2.has('nhat-nguyet-dong-cung'), 'Should detect Nhật Nguyệt Đồng Cung');

  // 3. Sát Phá Lang + Thất Sát Triều Đẩu + Vũ Tham Cách + Hỏa Tham Cách
  const chartSPL = makeCustomChart({
    canChiNam: 'Mậu Thìn', // Mậu: Tham Lộc
    menhChi: 2, // Dần: Thất Sát độc tọa
    palaceStars: {
      2:  { chinhTinh: ['Thất Sát(M)'], phuTinh: ['Tả Phụ', 'Hữu Bật'] },
      6:  { chinhTinh: ['Phá Quân(M)'], phuTinh: [] },
      10: { chinhTinh: ['Vũ Khúc(M)', 'Tham Lang(M)'], phuTinh: ['Hỏa Tinh', 'Hóa Lộc'] },
    },
  });
  const patsSPL = detectPatterns(chartSPL);
  const patIds3 = new Set(patsSPL.map(p => p.id));
  assert.ok(patIds3.has('sat-pha-lang'), 'Should detect Sát Phá Lang');
  assert.ok(patIds3.has('that-sat-trieu-dau'), 'Should detect Thất Sát Triều Đẩu');
  assert.ok(patIds3.has('vu-tham-cach'), 'Should detect Vũ Tham Cách');
  assert.ok(patIds3.has('hoa-tham-cach'), 'Should detect Hỏa Tham Cách');

  // 4. Thạch Trung Ẩn Ngọc + Dương Đà Giáp Kỵ
  const chartTTAN = makeCustomChart({
    canChiNam: 'Đinh Mão', // Đinh: Cự Môn Hóa Kỵ
    menhChi: 0, // Tý: Cự Môn
    palaceStars: {
      0:  { chinhTinh: ['Cự Môn(V)'], phuTinh: ['Lộc Tồn', 'Hóa Kỵ'] },
      11: { chinhTinh: [], phuTinh: ['Đà La'] },
      1:  { chinhTinh: [], phuTinh: ['Kình Dương'] },
    },
  });
  const patsTTAN = detectPatterns(chartTTAN);
  const patIds4 = new Set(patsTTAN.map(p => p.id));
  assert.ok(patIds4.has('thach-trung-an-ngoc'), 'Should detect Thạch Trung Ẩn Ngọc');
  assert.ok(patIds4.has('duong-da-giap-ky'), 'Should detect Dương Đà Giáp Kỵ');
  const ttan = patsTTAN.find(p => p.id === 'thach-trung-an-ngoc');
  assert.ok(ttan.conditions.breaking.includes('Cự Môn Hóa Kỵ'));
});

test('6b. Sihua bonus detection across 365 days of real v11 charts (patterns-sihua-bonus.test.ts)', () => {
  // Ported from patterns-sihua-bonus.test.ts: scan real charts across 1990 and verify Tứ Hóa bonus conditions trigger accurately
  const bonusHits = {
    'phu-tuong-trieu-vien': 0,
    'sat-pha-lang': 0,
    'co-nguyet-dong-luong': 0,
    'duong-luong-xuong-loc': 0,
  };

  for (let m = 1; m <= 12; m++) {
    for (const d of [1, 5, 10, 15, 20, 25]) {
      for (const h of [0, 2, 4, 6, 8, 10]) {
        const { chart } = buildV11ChartFromSolar(1990, m, d, h, 1);
        const found = detectPatterns(chart);
        for (const p of found) {
          if (p.id === 'phu-tuong-trieu-vien' && p.conditions.bonus.includes('Cung Mệnh đắc Lộc (Lộc Tồn hoặc Hóa Lộc)')) {
            bonusHits['phu-tuong-trieu-vien']++;
          }
          if (p.id === 'sat-pha-lang' && p.conditions.bonus.includes('Tam Phương có Hóa Lộc hoặc Hóa Quyền (khai sáng đắc lực)')) {
            bonusHits['sat-pha-lang']++;
          }
          if (p.id === 'co-nguyet-dong-luong' && p.conditions.bonus.includes('Hội Hóa Khoa / Hóa Lộc')) {
            bonusHits['co-nguyet-dong-luong']++;
          }
          if (p.id === 'duong-luong-xuong-loc' && p.conditions.bonus.includes('Hội thêm Hóa Khoa (khoa danh hiển đạt)')) {
            bonusHits['duong-luong-xuong-loc']++;
          }
        }
      }
    }
  }

  assert.ok(bonusHits['phu-tuong-trieu-vien'] > 0, 'Phủ Tướng Triều Viên Tứ Hóa bonus must trigger on real charts');
  assert.ok(bonusHits['sat-pha-lang'] > 0, 'Sát Phá Lang Tứ Hóa bonus must trigger on real charts');
  assert.ok(bonusHits['co-nguyet-dong-luong'] > 0, 'Cơ Nguyệt Đồng Lương Tứ Hóa bonus must trigger on real charts');
});

// ============================================================================
// 7. KNOWLEDGE BASE, CÂN LƯỢNG POEMS, CLASSICS SEARCH & FAMOUS CHARTS (knowledge.js)
// ============================================================================

test('7a. MAJOR_STAR_DETAILS covers all 14 major stars with classicQuote, niHaixiaQuote, career, relationship, wealth, health', () => {
  const expected14 = [
    'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh',
    'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương',
    'Thất Sát', 'Phá Quân',
  ];
  assert.equal(Object.keys(MAJOR_STAR_DETAILS).length, 14);
  for (const star of expected14) {
    const info = MAJOR_STAR_DETAILS[star];
    assert.ok(info, `Missing MAJOR_STAR_DETAILS for ${star}`);
    for (const field of ['classicQuote', 'niHaixiaQuote', 'career', 'relationship', 'wealth', 'health']) {
      assert.ok(typeof info[field] === 'string' && info[field].length >= 20, `${star}.${field} must be non-empty`);
    }
    assert.ok(STAR_IN_FUQI_GU[star], `STAR_IN_FUQI_GU should include ${star}`);
  }
  assert.equal(Object.keys(SIHUA_IN_FUQI_GU).length, 4);
  assert.ok(HEMING_KNOWLEDGE.HEMING_METHODOLOGY.length >= 5);
});

test('7b. getCanLuongPoem resolves poems for canLuongStr values from anLaSoTuVi & searchClassics finds passages', () => {
  assert.ok(Object.keys(CAN_LUONG_POEMS).length >= 20);
  const { chart } = buildV11ChartFromSolar(1990, 5, 15, 4, 1);
  const poem = getCanLuongPoem(chart.canLuongStr);
  assert.ok(poem, `getCanLuongPoem should resolve for ${chart.canLuongStr}`);
  assert.ok(typeof poem.poem === 'string' && poem.poem.length > 10);
  assert.ok(typeof poem.meaning === 'string' && poem.meaning.length > 10);
  assert.ok(typeof poem.tier === 'string' && poem.tier.length > 0);

  // Also test fallback interpolation for an arbitrary weight like "4 lượng 5 chỉ"
  const fallbackPoem = getCanLuongPoem('4 lượng 5 chỉ');
  assert.equal(fallbackPoem.luong, 4);
  assert.equal(fallbackPoem.chi, 5);
  assert.ok(fallbackPoem.poem.length > 10);

  // searchClassics
  assert.ok(CLASSICS_LIBRARY.length >= 3);
  const hitsTuVi = searchClassics('Quân Thần Khánh Hội');
  assert.ok(hitsTuVi.length >= 1 && hitsTuVi[0].hanViet.includes('Tử Vi'));
  const hitsDongY = searchClassics('Đông Y');
  assert.ok(hitsDongY.length >= 1);
  const allPassages = searchClassics('');
  assert.ok(allPassages.length >= 8);
});

test('7c. All FAMOUS_CHARTS generate valid 12-palace charts via anLaSoTuVi and computeZiweiMeta (famous-hour-consistency & pan-integrity)', () => {
  assert.equal(FAMOUS_CHARTS.length, 12);

  for (const famous of FAMOUS_CHARTS) {
    assert.ok(Number.isInteger(famous.hourIndex) && famous.hourIndex >= 0 && famous.hourIndex <= 11, `${famous.id} hourIndex must be 0..11`);
    const { chart, input } = buildV11ChartFromSolar(
      famous.solarYear,
      famous.solarMonth,
      famous.solarDay,
      famous.hourIndex,
      famous.gender,
      'split',
      2026,
    );
    assert.equal(chart.palates.length, 12, `${famous.id} must have 12 palaces`);

    // Verify Tử Vi / Thiên Phủ symmetry rule: (ziweiBranch + tianfuBranch) % 12 === 4
    const ziPalace = chart.palates.find(p => p.chinhTinh.some(s => s.startsWith('Tử Vi')));
    const fuPalace = chart.palates.find(p => p.chinhTinh.some(s => s.startsWith('Thiên Phủ')));
    assert.ok(ziPalace && fuPalace);
    assert.equal((ziPalace.chiIndex + fuPalace.chiIndex) % 12, 4, `${famous.id} Tử Vi & Thiên Phủ must be symmetric across Dần-Thân axis`);

    const enriched = enrichTuViChart(chart, {
      ...input,
      solarInput: { year: famous.solarYear, month: famous.solarMonth, day: famous.solarDay },
      clockHour: famous.hourIndex * 2,
      clockMinute: 0,
      longitude: 105.85,
    });
    const meta = enriched.ziweiMeta;
    assert.ok(meta, `${famous.id} computeZiweiMeta should return metadata`);
    assert.ok(Array.isArray(meta.patterns));
    assert.ok(meta.mingSummary && typeof meta.mingSummary.nature === 'string');
    assert.equal(meta.flyingSihua.palaces.length, 12);
    assert.equal(meta.shierShen.length, 12);
    assert.equal(meta.emptyPalaceBorrowing.length, 12);
    assert.equal(meta.tamPhuongMap.length, 12);
    assert.ok(meta.canLuongPoem && meta.canLuongPoem.poem);
    assert.equal(meta.daXianList.length, 12);
    assert.ok(meta.activeDaXian);
    assert.ok(meta.yunxianOverlay);
    assert.ok(meta.fourPillarsInfo && meta.fourPillarsInfo.fourPillars.length === 4);
    assert.ok(meta.trueSolarTimeInfo && meta.trueSolarTimeInfo.corrected === true);
    assert.equal(Object.keys(meta.schoolStarBrightnessMap).length, 12);
  }
});
