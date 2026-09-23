// UI adapter for the user-supplied v8 algorithm. No star placement is performed here.
import { anLaSoTuVi as calculate, DIA_CHI } from './tuViEngineV8.js';
export { THIEN_CAN, DIA_CHI, TEN_CUNG_CHUC_NANG,
  MIEU_HAM_MAP, getMenhThanIndex, getCuc, getTuViIndex, getTrangThaiStar } from './tuViEngineV8.js';
import { THIEN_CAN } from './tuViEngineV8.js';

// Compatibility export retained for chart consumers; the supplied v8 source
// exposes the Cục number/name through getCuc rather than this lookup table.
export const NGU_HANH_CUC_NAME = { 2: 'Thủy', 3: 'Mộc', 4: 'Kim', 5: 'Thổ', 6: 'Hỏa' };

export const TUVI_ENGINE_VERSION = 'user-v8';

export function getTrangThaiName(code) {
  return ({ M: 'Miếu', V: 'Vượng', Đ: 'Đắc', B: 'Bình', H: 'Hãm' })[code] || code;
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
  const result = calculate(input);
  const menhIndex = DIA_CHI.indexOf(result.menhCung);
  const thanIndex = DIA_CHI.indexOf(result.thanCung);
  return {
    ...result,
    engineVersion: TUVI_ENGINE_VERSION,
    isThuan: (input.yearCanIndex % 2 === 0) === (input.gender === 1),
    tuanCung: result.palates.filter(p => p.isTuan).map(p => p.chiName),
    trietCung: result.palates.filter(p => p.isTriet).map(p => p.chiName),
    ...(hasViewYear ? {
      viewYear: input.viewYear,
      viewYearCanChi: `${THIEN_CAN[input.viewYearCanIndex]} ${DIA_CHI[input.viewYearChiIndex]}`,
    } : {}),
    palates: result.palates.map(p => ({ ...p, isMenh: p.chiIndex === menhIndex, isThan: p.chiIndex === thanIndex })),
  };
}
