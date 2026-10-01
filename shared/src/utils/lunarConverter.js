/**
 * Lunar Calendar Converter
 * Wrapper around lunar-javascript to convert Solar → Lunar dates
 * and extract Can-Chi information needed by the TuVi engine.
 */
import { Solar } from 'lunar-javascript';

const THIEN_CAN_VI = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI_VI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Map Hán tự sang tiếng Việt
const CAN_MAP = { '甲': 0, '乙': 1, '丙': 2, '丁': 3, '戊': 4, '己': 5, '庚': 6, '辛': 7, '壬': 8, '癸': 9 };
const CHI_MAP = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 };

// 12 canh giờ
export const GIO_SINH_OPTIONS = [
  { label: "Tý (23:00 – 01:00)", value: 0 },
  { label: "Sửu (01:00 – 03:00)", value: 1 },
  { label: "Dần (03:00 – 05:00)", value: 2 },
  { label: "Mão (05:00 – 07:00)", value: 3 },
  { label: "Thìn (07:00 – 09:00)", value: 4 },
  { label: "Tỵ (09:00 – 11:00)", value: 5 },
  { label: "Ngọ (11:00 – 13:00)", value: 6 },
  { label: "Mùi (13:00 – 15:00)", value: 7 },
  { label: "Thân (15:00 – 17:00)", value: 8 },
  { label: "Dậu (17:00 – 19:00)", value: 9 },
  { label: "Tuất (19:00 – 21:00)", value: 10 },
  { label: "Hợi (21:00 – 23:00)", value: 11 },
];

/**
 * Convert Solar date to Lunar date and extract Can-Chi info
 * @param {number} year - Solar year
 * @param {number} month - Solar month (1-12)
 * @param {number} day - Solar day (1-31)
 * @returns {{ lunarYear, lunarMonth, lunarDay, isLeap, yearCanIndex, yearChiIndex, lunarDateStr, solarDateStr }}
 */
export function solarToLunar(year, month, day) {
  try {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    const lunarYear = lunar.getYear();
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();
    const isLeap = lunar.getMonth() < 0; // negative month = leap

    // Can Chi năm từ Bát Tự
    const eightChar = lunar.getEightChar();
    const yearGanZhi = eightChar.getYear();
    const yearGan = yearGanZhi.charAt(0);
    const yearZhi = yearGanZhi.charAt(1);

    const yearCanIndex = CAN_MAP[yearGan] ?? fallbackYearCan(lunarYear);
    const yearChiIndex = CHI_MAP[yearZhi] ?? fallbackYearChi(lunarYear);

    return {
      lunarYear,
      lunarMonth: Math.abs(lunarMonth),
      lunarDay,
      isLeap,
      yearCanIndex,
      yearChiIndex,
      yearCanName: THIEN_CAN_VI[yearCanIndex],
      yearChiName: DIA_CHI_VI[yearChiIndex],
      lunarDateStr: `${Math.abs(lunarMonth)}/${lunarDay}/${lunarYear} (Âm lịch)`,
      solarDateStr: `${day}/${month}/${year} (Dương lịch)`,
    };
  } catch (err) {
    console.error('Solar to Lunar conversion error:', err);
    throw new Error('Không chuyển được ngày sinh sang âm lịch. Vui lòng kiểm tra ngày hoặc nhập âm lịch trực tiếp.');
  }
}

/**
 * Validate nếu ngày âm lịch hợp lệ
 */
export function validateLunarDate(year, month, day) {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 30) return false;
  return true;
}

/**
 * Lấy Can Chi năm từ số năm âm lịch (fallback)
 */
function fallbackYearCan(lunarYear) {
  return (lunarYear - 4) % 10;
}

function fallbackYearChi(lunarYear) {
  return (lunarYear - 4) % 12;
}

/**
 * Generate month options for a specific year
 */
export function getMonthsInYear() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`
  }));
}

/**
 * Generate day options
 */
export function getDaysInMonth(isLunar = false) {
  const maxDay = isLunar ? 30 : 31;
  return Array.from({ length: maxDay }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));
}

/**
 * Generate year options (1920 - current year + 1)
 */
export function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 1920; y--) {
    years.push({ value: y, label: `${y}` });
  }
  return years;
}

/**
 * Lấy chuỗi Can Chi của một năm
 * @param {number} year
 * @returns {string} ví dụ: "Bính Ngọ", "Ất Tỵ"
 */
export function getYearCanChi(year) {
  const canIndex = ((year - 4) % 10 + 10) % 10;
  const chiIndex = ((year - 4) % 12 + 12) % 12;
  return `${THIEN_CAN_VI[canIndex]} ${DIA_CHI_VI[chiIndex]}`;
}

/**
 * Danh sách lựa chọn năm xem lưu niên kèm Can Chi
 */
export function getViewYearOptions(minYear = 1920, maxOffset = 25) {
  const currentYear = new Date().getFullYear();
  const topYear = currentYear + maxOffset;
  const years = [];
  for (let y = topYear; y >= minYear; y--) {
    const canChi = getYearCanChi(y);
    const tag = y === currentYear ? ' (Năm nay)' : y === currentYear + 1 ? ' (Năm sau)' : '';
    years.push({
      value: y,
      label: `${y} · ${canChi}${tag}`,
      canChi,
    });
  }
  return years;
}
