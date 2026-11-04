// UI adapter for the user-supplied v11 algorithm. No star placement is performed here.
import { anLaSoTuVi as calculate, DIA_CHI } from './tuViEngineV11.js';
export { THIEN_CAN, DIA_CHI, TEN_CUNG_CHUC_NANG, NGU_HANH_CUC_NAME,
  MIEU_HAM_MAP, getMenhThanIndex, getCuc, getTuViIndex, getTrangThaiStar } from './tuViEngineV11.js';
import { THIEN_CAN } from './tuViEngineV11.js';
import { computeZiweiMeta, enrichTuViChart } from './ziwei/index.js';

export {
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
} from './ziwei/index.js';


export const TUVI_ENGINE_VERSION = 'user-v11';

export function getTrangThaiName(code) {
  return ({ M: 'Miếu', V: 'Vượng', Đ: 'Đắc', B: 'Bình', H: 'Hãm', L: 'Lợi', Bt: 'Bất', N: 'Nhàn' })[code] || code;
}

function requireInteger(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`${label} không hợp lệ.`);
}

export function anLaSoTuVi(input) {
  requireInteger(input.yearCanIndex, 0, 9, 'Can năm sinh');
  requireInteger(input.yearChiIndex, 0, 11, 'Chi năm sinh');
  requireInteger(input.lunarMonth, 1, 12, 'Tháng âm lịch');
  requireInteger(input.lunarDay, 1, 30, 'Ngày âm lịch');
  requireInteger(input.lunarHourIndex, 0, 11, 'Giờ sinh');
  requireInteger(input.gender, 0, 1, 'Giới tính');
  const hasViewYear = input.viewYearCanIndex !== undefined || input.viewYearChiIndex !== undefined;
  if (hasViewYear) {
    requireInteger(input.viewYearCanIndex, 0, 9, 'Can năm xem');
    requireInteger(input.viewYearChiIndex, 0, 11, 'Chi năm xem');
  }
  // Pass explicit lunar birth/view years. Never activate the source's clock-based
  // fallback when an older chart provides only annual Can/Chi.
  const namSinh = input.namSinh ?? input.lunarYear;
  const namXem = input.namXem ?? input.viewYear;
  if (namSinh !== undefined) requireInteger(namSinh, 1, 9999, 'Năm sinh âm lịch');
  if (namXem !== undefined) {
    requireInteger(namXem, 1, 9999, 'Năm xem');
    if (namSinh !== undefined && namXem < namSinh) throw new Error('Năm xem phải từ năm sinh âm lịch trở đi.');
  }
  const result = calculate({ ...input, namSinh: namXem === undefined ? undefined : namSinh, namXem });
  const menhIndex = DIA_CHI.indexOf(result.menhCung);
  const thanIndex = DIA_CHI.indexOf(result.thanCung);
  const chart = {
    ...result,
    engineVersion: TUVI_ENGINE_VERSION,
    isThuan: (input.yearCanIndex % 2 === 0) === (input.gender === 1),
    tuanCung: result.palates.filter(p => p.isTuan).map(p => p.chiName),
    trietCung: result.palates.filter(p => p.isTriet).map(p => p.chiName),
    ...(hasViewYear ? {
      viewYear: namXem,
      viewYearCanChi: `${THIEN_CAN[input.viewYearCanIndex]} ${DIA_CHI[input.viewYearChiIndex]}`,
    } : {}),
    palates: result.palates.map(p => ({ ...p, isMenh: p.chiIndex === menhIndex, isThan: p.chiIndex === thanIndex })),
  };
  if (input.enrichZiwei) {
    return enrichTuViChart(chart, input, input.schoolConfig);
  }
  return chart;
}
