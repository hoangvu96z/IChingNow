import { LunarMonth } from 'lunar-javascript';
import {
  anLaSoTuVi as sharedAnLaSoTuVi,
  THIEN_CAN,
  DIA_CHI,
  TEN_CUNG_CHUC_NANG,
  NGU_HANH_CUC_NAME,
  MIEU_HAM_MAP,
  getMenhThanIndex,
  getCuc,
  getTuViIndex,
  getTrangThaiStar,
  computeZiweiMeta,
  enrichTuViChart,
  VN_LOCATIONS,
  findLocationById,
  findLocationByName,
  equationOfTimeMinutes,
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  resolveEffectiveLunarDate,
  getFourPillarsFromSolar,
  isChinaDST,
  chinaDSTRange,
  clockToStandardDelta,
  shiftClock,
  DEFAULT_SCHOOL_CONFIG,
  SCHOOL_DEFAULT_CONFIG,
  SCHOOL_OPTIONS,
  SCHOOL_LABELS,
  loadSchoolConfig,
  saveSchoolConfig,
  resetSchoolConfig,
  getSchoolStarBrightness,
  getSiHuaByStem,
  getDaXianSiHua,
  getLiuNianSiHua,
  getLiuYueSiHua,
  getLiuRiSiHua,
  getLiuShiSiHua,
  detectPalaceSelfSihua,
  buildChartFlyingSihua,
  computeCrossChartSihua,
  boshiShenByStem,
  suiQianShenByBranch,
  jiangQianShenByBranch,
  buildShierShenForChart,
  YUNXIAN_MODES,
  CHILDHOOD_MING_OFFSET,
  getActiveDaXianForAge,
  getChartDaXianList,
  getDaXianPalaceNames,
  getLuuNienPalaceNames,
  getTamPhuongTuChinh,
  getBorrowedStarsForPalace,
  buildYunxianOverlay,
  detectPatterns,
  getMingGongSummary,
  MAJOR_STAR_DETAILS,
  MINOR_STAR_DETAILS,
  getStarDetail,
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
  HEMING_KNOWLEDGE,
  CAN_LUONG_POEMS,
  getCanLuongPoem,
  CLASSICS_LIBRARY,
  searchClassics,
  FAMOUS_CHARTS,
  TUVI_ENGINE_VERSION,
  getTrangThaiName,
} from '../../../shared/src/utils/tuViEngine.js';

export {
  THIEN_CAN,
  DIA_CHI,
  TEN_CUNG_CHUC_NANG,
  NGU_HANH_CUC_NAME,
  MIEU_HAM_MAP,
  getMenhThanIndex,
  getCuc,
  getTuViIndex,
  getTrangThaiStar,
  computeZiweiMeta,
  enrichTuViChart,
  VN_LOCATIONS,
  findLocationById,
  findLocationByName,
  equationOfTimeMinutes,
  calculateTrueSolarTime,
  resolveZiweiDayOffset,
  resolveEffectiveLunarDate,
  getFourPillarsFromSolar,
  isChinaDST,
  chinaDSTRange,
  clockToStandardDelta,
  shiftClock,
  DEFAULT_SCHOOL_CONFIG,
  SCHOOL_DEFAULT_CONFIG,
  SCHOOL_OPTIONS,
  SCHOOL_LABELS,
  loadSchoolConfig,
  saveSchoolConfig,
  resetSchoolConfig,
  getSchoolStarBrightness,
  getSiHuaByStem,
  getDaXianSiHua,
  getLiuNianSiHua,
  getLiuYueSiHua,
  getLiuRiSiHua,
  getLiuShiSiHua,
  detectPalaceSelfSihua,
  buildChartFlyingSihua,
  computeCrossChartSihua,
  boshiShenByStem,
  suiQianShenByBranch,
  jiangQianShenByBranch,
  buildShierShenForChart,
  YUNXIAN_MODES,
  CHILDHOOD_MING_OFFSET,
  getActiveDaXianForAge,
  getChartDaXianList,
  getDaXianPalaceNames,
  getLuuNienPalaceNames,
  getTamPhuongTuChinh,
  getBorrowedStarsForPalace,
  buildYunxianOverlay,
  detectPatterns,
  getMingGongSummary,
  MAJOR_STAR_DETAILS,
  MINOR_STAR_DETAILS,
  getStarDetail,
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
  HEMING_KNOWLEDGE,
  CAN_LUONG_POEMS,
  getCanLuongPoem,
  CLASSICS_LIBRARY,
  searchClassics,
  FAMOUS_CHARTS,
  TUVI_ENGINE_VERSION,
  getTrangThaiName,
};

function resolveLeapAdjustedEngineInput(input) {
  if (!input || typeof input !== 'object') return input;
  const isLeap = Boolean(input.isLeap || input.isLeapMonth);
  if (!isLeap) return input;

  const policy = input?.schoolConfig?.leapMonth || DEFAULT_SCHOOL_CONFIG.leapMonth || 'split';
  if (policy === 'prev-month' || policy === 'origin-month') {
    return input;
  }

  const rawMonth = Number(input.lunarMonth);
  const rawDay = Number(input.lunarDay);
  if (!Number.isInteger(rawMonth) || !Number.isInteger(rawDay)) {
    return input;
  }

  const shouldAdvanceMonth =
    policy === 'next-month' || (policy === 'split' && rawDay > 15);
  if (!shouldAdvanceMonth) {
    return input;
  }

  let effectiveMonth = rawMonth + 1;
  let effectiveYear = input.lunarYear;
  let yearCanIndex = input.yearCanIndex;
  let yearChiIndex = input.yearChiIndex;

  if (effectiveMonth > 12) {
    effectiveMonth = 1;
    if (Number.isInteger(effectiveYear)) {
      effectiveYear += 1;
      yearCanIndex = ((effectiveYear - 4) % 10 + 10) % 10;
      yearChiIndex = ((effectiveYear - 4) % 12 + 12) % 12;
    }
  }

  let effectiveDay = rawDay;
  if (Number.isInteger(effectiveYear)) {
    try {
      const targetMonthObj = LunarMonth.fromYm(effectiveYear, effectiveMonth);
      const maxDays = targetMonthObj?.getDayCount?.();
      if (typeof maxDays === 'number' && maxDays > 0 && effectiveDay > maxDays) {
        effectiveDay = maxDays;
      }
    } catch {
      // Keep rawDay if out of ephemeris range
    }
  }

  const safeLunarYear =
    input.viewYear !== undefined &&
    Number.isInteger(effectiveYear) &&
    input.viewYear < effectiveYear
      ? input.lunarYear
      : effectiveYear;

  return {
    ...input,
    lunarYear: safeLunarYear,
    lunarMonth: effectiveMonth,
    lunarDay: effectiveDay,
    yearCanIndex,
    yearChiIndex,
  };
}

export function anLaSoTuVi(input) {
  return sharedAnLaSoTuVi(resolveLeapAdjustedEngineInput(input));
}
