import { anLaSoTuVi } from './tuViEngine.js';
import { solarToLunar, validateLunarDate, validateSolarDate } from './lunarConverter.js';

/**
 * Tính toán nhanh lá số Tử Vi từ thông tin ngày tháng năm giờ sinh
 * Dùng cho modal Luận giải kết hợp khi người dùng mở từ IChingNow hoặc TuViNow
 *
 * @param {Object} birthInfo
 * @param {number|string} [birthInfo.day] - Ngày dương lịch
 * @param {number|string} [birthInfo.month] - Tháng dương lịch (1-12)
 * @param {number|string} [birthInfo.year] - Năm dương lịch (1900-2100)
 * @param {boolean} [birthInfo.isLunar=false] - Đánh dấu dữ liệu âm lịch trực tiếp
 * @param {number|string} [birthInfo.lunarDay] - Ngày âm lịch (1-30)
 * @param {number|string} [birthInfo.lunarMonth] - Tháng âm lịch (1-12)
 * @param {number|string} [birthInfo.lunarYear] - Năm âm lịch (1900-2100)
 * @param {number} [birthInfo.hourIndex=6] - Index 12 Canh Giờ (0: Tý ... 11: Hợi)
 * @param {string|number} [birthInfo.gender='nam'] - 'nam' | 'nu' | 1 | 0
 * @param {string} [birthInfo.name='Người hỏi'] - Tên người hỏi
 * @returns {Object|null} chartResult chứa 12 cung palates, cục, mệnh, thân, chính/phụ tinh
 */
export function calculateChartFromBirthInfo(birthInfo) {
  if (!birthInfo) return null;
  const { gender = 'nam', name = '' } = birthInfo;
  const rawHour = birthInfo.lunarHourIndex !== undefined && birthInfo.lunarHourIndex !== null
    ? birthInfo.lunarHourIndex
    : birthInfo.hourIndex;

  try {
    const hIdx = (rawHour !== undefined && rawHour !== null && !isNaN(Number(rawHour)))
      ? Math.max(0, Math.min(11, parseInt(rawHour, 10)))
      : 6;
    const g = (gender === 'nam' || gender === 1 || gender === '1') ? 1 : 0;

    let lunar;
    const treatAsLunar = Boolean(birthInfo.isLunar) || (
      !birthInfo.day && !birthInfo.month && !birthInfo.year &&
      !birthInfo.solarInput?.day && !birthInfo.solarInput?.month && !birthInfo.solarInput?.year &&
      birthInfo.lunarDay && birthInfo.lunarMonth && birthInfo.lunarYear
    );

    if (treatAsLunar) {
      const d = parseInt(birthInfo.lunarDay ?? birthInfo.day, 10);
      const m = parseInt(birthInfo.lunarMonth ?? birthInfo.month, 10);
      const y = parseInt(birthInfo.lunarYear ?? birthInfo.year, 10);
      if (!validateLunarDate(y, m, d)) {
        return null;
      }
      const yearCanIndex = Number.isInteger(birthInfo.yearCanIndex)
        ? birthInfo.yearCanIndex
        : ((y - 4) % 10 + 10) % 10;
      const yearChiIndex = Number.isInteger(birthInfo.yearChiIndex)
        ? birthInfo.yearChiIndex
        : ((y - 4) % 12 + 12) % 12;
      lunar = {
        lunarYear: y,
        lunarMonth: m,
        lunarDay: d,
        isLeap: Boolean(birthInfo.isLeap),
        yearCanIndex,
        yearChiIndex,
      };
    } else {
      const d = parseInt(birthInfo.solarInput?.day ?? birthInfo.day, 10);
      const m = parseInt(birthInfo.solarInput?.month ?? birthInfo.month, 10);
      const y = parseInt(birthInfo.solarInput?.year ?? birthInfo.year, 10);
      if (!validateSolarDate(y, m, d)) {
        return null;
      }
      lunar = solarToLunar(y, m, d);
      if (!lunar) return null;
    }

    const currentYear = new Date().getFullYear();
    const requestedViewYear = birthInfo.viewYear !== undefined && birthInfo.viewYear !== null && birthInfo.viewYear !== ''
      ? parseInt(birthInfo.viewYear, 10)
      : NaN;
    const effectiveViewYear = (!isNaN(requestedViewYear) && requestedViewYear >= lunar.lunarYear && requestedViewYear <= 2100)
      ? requestedViewYear
      : Math.max(currentYear, lunar.lunarYear);

    const chart = anLaSoTuVi({
      ...lunar,
      lunarHourIndex: hIdx,
      gender: g,
      namSinh: lunar.lunarYear,
      name: name || 'Người hỏi',
      viewYear: effectiveViewYear,
      viewYearCanIndex: ((effectiveViewYear - 4) % 10 + 10) % 10,
      viewYearChiIndex: ((effectiveViewYear - 4) % 12 + 12) % 12,
    });

    return chart;
  } catch (err) {
    console.warn('Lỗi an lá số Tử Vi từ thông tin sinh:', err);
    return null;
  }
}
