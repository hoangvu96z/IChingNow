import { anLaSoTuVi } from './tuViEngine.js';
import { solarToLunar } from './lunarConverter.js';

/**
 * Tính toán nhanh lá số Tử Vi từ thông tin ngày tháng năm giờ sinh
 * Dùng cho modal Luận giải kết hợp khi người dùng mở từ IChingNow
 *
 * @param {Object} birthInfo
 * @param {number|string} birthInfo.day - Ngày dương lịch
 * @param {number|string} birthInfo.month - Tháng dương lịch (1-12)
 * @param {number|string} birthInfo.year - Năm dương lịch (1900-2100)
 * @param {number} [birthInfo.hourIndex=6] - Index 12 Canh Giờ (0: Tý ... 11: Hợi)
 * @param {string|number} [birthInfo.gender='nam'] - 'nam' | 'nu' | 1 | 0
 * @param {string} [birthInfo.name='Người hỏi'] - Tên người hỏi
 * @returns {Object|null} chartResult chứa 12 cung palates, cục, mệnh, thân, chính/phụ tinh
 */
export function calculateChartFromBirthInfo(birthInfo) {
  if (!birthInfo) return null;
  const { day, month, year, hourIndex = 6, gender = 'nam', name = '' } = birthInfo;
  if (!day || !month || !year) return null;

  try {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(d) || isNaN(m) || isNaN(y) || y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      return null;
    }

    const hIdx = (hourIndex !== undefined && hourIndex !== null && !isNaN(Number(hourIndex)))
      ? Math.max(0, Math.min(11, parseInt(hourIndex, 10)))
      : 6;
    const g = (gender === 'nam' || gender === 1 || gender === '1') ? 1 : 0;

    const lunar = solarToLunar(y, m, d);
    if (!lunar) return null;

    const chart = anLaSoTuVi({
      ...lunar,
      lunarHourIndex: hIdx,
      gender: g,
      namSinh: lunar.lunarYear || y,
      name: name || 'Người hỏi',
      viewYear: new Date().getFullYear(),
      viewYearCanIndex: ((new Date().getFullYear() - 4) % 10 + 10) % 10,
      viewYearChiIndex: ((new Date().getFullYear() - 4) % 12 + 12) % 12,
    });

    return chart;
  } catch (err) {
    console.warn('Lỗi an lá số Tử Vi từ thông tin sinh:', err);
    return null;
  }
}
