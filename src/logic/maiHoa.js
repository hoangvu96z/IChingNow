/**
 * Engine Lập Quẻ Mai Hoa Dịch Số — v2
 *
 * Hai mode:
 *   1. 'time'   — Ngày giờ động tâm (dùng âm lịch)
 *   2. 'serial' — Số sê-ri tiền (8 chữ số, digit-sum)
 *
 * Kết quả gồm 3 quẻ: Quẻ Chủ, Quẻ Hỗ, Quẻ Biến
 *
 * Quy ước quái số (Phục Hy bát quái):
 *   1=Càn, 2=Đoài, 3=Ly, 4=Chấn, 5=Tốn, 6=Khảm, 7=Cấn, 8=Khôn
 */

import { Solar } from 'lunar-javascript';
import { HEXAGRAMS } from '../data/hexagrams.js';

// ─────────────────────────────────────────────────────────────────────────────
// Dữ liệu quái
// ─────────────────────────────────────────────────────────────────────────────

/** Số quái (1–8) → tên + mảng 3 hào (1=dương, 0=âm) + hành */
export const TRIGRAM_BY_NUMBER = {
  1: { nameVi: 'Càn',  nameZh: '乾', lines: [1, 1, 1], binary: '111', element: 'Kim'  },
  2: { nameVi: 'Đoài', nameZh: '兌', lines: [1, 1, 0], binary: '110', element: 'Kim'  },
  3: { nameVi: 'Ly',   nameZh: '離', lines: [1, 0, 1], binary: '101', element: 'Hỏa'  },
  4: { nameVi: 'Chấn', nameZh: '震', lines: [1, 0, 0], binary: '100', element: 'Mộc'  },
  5: { nameVi: 'Tốn',  nameZh: '巽', lines: [0, 1, 1], binary: '011', element: 'Mộc'  },
  6: { nameVi: 'Khảm', nameZh: '坎', lines: [0, 1, 0], binary: '010', element: 'Thủy' },
  7: { nameVi: 'Cấn',  nameZh: '艮', lines: [0, 0, 1], binary: '001', element: 'Thổ'  },
  8: { nameVi: 'Khôn', nameZh: '坤', lines: [0, 0, 0], binary: '000', element: 'Thổ'  },
};

/** Reverse lookup binary → số quái */
const BINARY_TO_TRIGRAM_NUMBER = Object.fromEntries(
  Object.entries(TRIGRAM_BY_NUMBER).map(([num, t]) => [t.binary, Number(num)])
);

/** Map địa chi Hán tự → số 1–12 */
const ZH_BRANCH_CHI_NUMBER = {
  '子': 1, '丑': 2, '寅': 3, '卯': 4,
  '辰': 5, '巳': 6, '午': 7, '未': 8,
  '申': 9, '酉': 10, '戌': 11, '亥': 12,
};

/** Địa chi Hán tự → tiếng Việt */
const ZH_BRANCH_TO_VI = {
  '子':'Tý','丑':'Sửu','寅':'Dần','卯':'Mão',
  '辰':'Thìn','巳':'Tỵ','午':'Ngọ','未':'Mùi',
  '申':'Thân','酉':'Dậu','戌':'Tuất','亥':'Hợi',
};

/** Thiên can Hán tự → tiếng Việt */
const ZH_STEM_TO_VI = {
  '甲':'Giáp','乙':'Ất','丙':'Bính','丁':'Đinh','戊':'Mậu',
  '己':'Kỷ','庚':'Canh','辛':'Tân','壬':'Nhâm','癸':'Quý',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers toán học
// ─────────────────────────────────────────────────────────────────────────────

/** mod8: n % 8, nếu dư 0 trả 8 */
function mod8(n) {
  const r = ((n % 8) + 8) % 8;
  return r === 0 ? 8 : r;
}

/** mod6: n % 6, nếu dư 0 trả 6 */
function mod6(n) {
  const r = ((n % 6) + 6) % 6;
  return r === 0 ? 6 : r;
}

/** Tổng các chữ số của một chuỗi số */
function digitSum(str) {
  return str.split('').reduce((acc, ch) => acc + (parseInt(ch, 10) || 0), 0);
}

/** Tra bảng 64 quẻ theo binary hạ quái + thượng quái */
function lookupHexagram(lowerBinary, upperBinary) {
  return HEXAGRAMS.find(h => h.lower === lowerBinary && h.upper === upperBinary) || null;
}

/** Tạo mảng 6 hào từ lowerLines + upperLines */
function buildSixLines(lowerLines, upperLines) {
  return [...lowerLines, ...upperLines].map((bit, i) => ({
    index:   i + 1,
    yinYang: bit === 1 ? 'yang' : 'yin',
    moving:  false,
  }));
}

/** Đánh dấu hào động */
function markMoving(lines, movingLine) {
  return lines.map(l => ({ ...l, moving: l.index === movingLine }));
}

/** Đổi hào → quẻ biến */
function flipMovingLine(lines, movingLine) {
  return lines.map(l => {
    if (l.index !== movingLine) return { ...l, moving: false };
    return { ...l, yinYang: l.yinYang === 'yang' ? 'yin' : 'yang', moving: false };
  });
}

/**
 * Trích xuất Quẻ Hỗ từ 6 hào Quẻ Chủ:
 *   Hạ quái của Quẻ Hỗ = hào 2, 3, 4 của Quẻ Chủ
 *   Thượng quái của Quẻ Hỗ = hào 4, 5, 6 của Quẻ Chủ
 * @param {Array} primaryLines - [{index:1..6, yinYang}]
 * @returns {{ hexagram, lines, lowerTrigram, upperTrigram }}
 */
function buildQueHo(primaryLines) {
  const sorted = [...primaryLines].sort((a, b) => a.index - b.index);
  // hào 2,3,4 → hạ quái quẻ hỗ
  const hoLower = [sorted[1], sorted[2], sorted[3]].map(l => l.yinYang === 'yang' ? 1 : 0);
  // hào 4,5,6 → thượng quái quẻ hỗ
  const hoUpper = [sorted[3], sorted[4], sorted[5]].map(l => l.yinYang === 'yang' ? 1 : 0);

  const hoLowerBinary = hoLower.join('');
  const hoUpperBinary = hoUpper.join('');
  const lowerTrigram  = TRIGRAM_BY_NUMBER[BINARY_TO_TRIGRAM_NUMBER[hoLowerBinary]];
  const upperTrigram  = TRIGRAM_BY_NUMBER[BINARY_TO_TRIGRAM_NUMBER[hoUpperBinary]];

  // Xây 6 hào quẻ hỗ (đánh index lại từ 1)
  const lines = buildSixLines(hoLower, hoUpper);

  return {
    hexagram:    lookupHexagram(hoLowerBinary, hoUpperBinary),
    lines,
    lowerTrigram,
    upperTrigram,
  };
}

/**
 * Tính Thể/Dụng của Quẻ Chủ dựa vào vị trí hào động:
 *   Hào động 1–3 (hạ quái): hạ quái = Dụng, thượng quái = Thể
 *   Hào động 4–6 (thượng quái): thượng quái = Dụng, hạ quái = Thể
 */
function computeTheDung(movingLine) {
  return movingLine <= 3
    ? { the: 'upper', dung: 'lower' }
    : { the: 'lower', dung: 'upper' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lấy thông tin âm lịch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert dương lịch → âm lịch cho Mai Hoa
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} hour    - giờ dương lịch (0–23)
 * @returns {Object|null}
 */
export function getLunarInfo(dateStr, hour = 0) {
  if (!dateStr) return null;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const solar  = Solar.fromYmd(year, month, day);
    const lunar  = solar.getLunar();

    const yearZhBranch  = lunar.getYearZhi();
    const yearChiNumber = ZH_BRANCH_CHI_NUMBER[yearZhBranch] || 1;
    const yearChiName   = ZH_BRANCH_TO_VI[yearZhBranch]      || yearZhBranch;
    const yearStemVi    = ZH_STEM_TO_VI[lunar.getYearGan()]  || '';

    const monthNum = Math.abs(lunar.getMonth());
    const dayNum   = lunar.getDay();

    // Giờ địa chi từ giờ dương lịch
    const hourBranchInfo = getHourBranchInfo(hour);

    return {
      yearChiNumber,
      yearChiName,
      yearStemVi,
      monthNumber: monthNum,
      dayNumber:   dayNum,
      lunarYear:   lunar.getYear(),
      isLeapMonth: lunar.getMonth() < 0,
      lunarLabel:  `${yearStemVi} ${yearChiName} / Tháng ${monthNum} / Ngày ${dayNum}`,
      hourBranchInfo,
    };
  } catch (e) {
    console.error('getLunarInfo error:', e);
    return null;
  }
}

/** Khung giờ địa chi từ giờ dương lịch */
const HOUR_BRANCHES_INFO = [
  { chiNumber: 1,  nameVi: 'Tý',   range: '23:00–00:59' },
  { chiNumber: 2,  nameVi: 'Sửu',  range: '01:00–02:59' },
  { chiNumber: 3,  nameVi: 'Dần',  range: '03:00–04:59' },
  { chiNumber: 4,  nameVi: 'Mão',  range: '05:00–06:59' },
  { chiNumber: 5,  nameVi: 'Thìn', range: '07:00–08:59' },
  { chiNumber: 6,  nameVi: 'Tị',   range: '09:00–10:59' },
  { chiNumber: 7,  nameVi: 'Ngọ',  range: '11:00–12:59' },
  { chiNumber: 8,  nameVi: 'Mùi',  range: '13:00–14:59' },
  { chiNumber: 9,  nameVi: 'Thân', range: '15:00–16:59' },
  { chiNumber: 10, nameVi: 'Dậu',  range: '17:00–18:59' },
  { chiNumber: 11, nameVi: 'Tuất', range: '19:00–20:59' },
  { chiNumber: 12, nameVi: 'Hợi',  range: '21:00–22:59' },
];

export function getHourBranchInfo(hour) {
  if (hour === 23) return HOUR_BRANCHES_INFO[0]; // Tý
  const idx = Math.floor((hour + 1) / 2) % 12;
  return HOUR_BRANCHES_INFO[idx];
}

export { HOUR_BRANCHES_INFO };

// ─────────────────────────────────────────────────────────────────────────────
// Mode 1: Ngày giờ động tâm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number} yearChiNumber  - số địa chi năm (1–12)
 * @param {number} monthNumber    - tháng âm lịch
 * @param {number} dayNumber      - ngày âm lịch
 * @param {number} hourChiNumber  - số địa chi giờ (1–12)
 */
export function getMaiHoaByTime(yearChiNumber, monthNumber, dayNumber, hourChiNumber) {
  const soThuong = yearChiNumber + monthNumber + dayNumber;
  const soHa     = yearChiNumber + monthNumber + dayNumber + hourChiNumber;
  const soHao    = soHa; // cùng giá trị theo spec

  return {
    soThuong,
    soHa,
    soHao,
    upperTrigramNumber: mod8(soThuong),
    lowerTrigramNumber: mod8(soHa),
    movingLine:         mod6(soHao),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode 2: Số sê-ri tiền (8 chữ số, digit-sum)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string} serialStr - chuỗi 2–8 chữ số
 */
export function getMaiHoaBySerial(serialStr) {
  const digits = serialStr.replace(/\D/g, '').slice(0, 8);
  const len    = digits.length;
  const mid    = Math.ceil(len / 2);     // phần đầu: ceil(n/2) chữ số
  const first  = digits.slice(0, mid);
  const last   = digits.slice(mid);

  const soThuong = digitSum(first);
  const soHa     = last.length > 0 ? digitSum(last) : soThuong;
  const soHao    = soThuong + soHa;

  return {
    digits,
    first4: first,   // tên giữ nguyên để tương thích với CalcTable
    last4:  last,
    soThuong,
    soHa,
    soHao,
    upperTrigramNumber: mod8(soThuong),
    lowerTrigramNumber: mod8(soHa),
    movingLine:         mod6(soHao),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hàm chính: buildMaiHoaResult → 3 quẻ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính toán đầy đủ kết quả Mai Hoa (3 quẻ)
 *
 * @param {Object} params
 * @param {string} params.subMode   - 'time' | 'serial'
 * @param {string} [params.dateStr] - 'YYYY-MM-DD' (mode time)
 * @param {string} [params.timeStr] - 'HH:mm' (mode time)
 * @param {string} [params.serial]  - 8 chữ số (mode serial)
 * @param {string} [params.question]
 */
export function buildMaiHoaResult({ subMode, dateStr, timeStr, serial, question = '' }) {
  let calc;
  let lunarInfo = null;

  if (subMode === 'time') {
    const hour = timeStr ? parseInt(timeStr.split(':')[0], 10) : new Date().getHours();
    lunarInfo  = getLunarInfo(dateStr, hour);
    if (!lunarInfo) return null;
    calc = getMaiHoaByTime(
      lunarInfo.yearChiNumber,
      lunarInfo.monthNumber,
      lunarInfo.dayNumber,
      lunarInfo.hourBranchInfo.chiNumber,
    );
  } else {
    // 'serial'
    const cleaned = (serial || '').replace(/\D/g, '');
    if (cleaned.length < 2 || cleaned.length > 8) return null;
    calc = getMaiHoaBySerial(cleaned);
  }

  const { upperTrigramNumber, lowerTrigramNumber, movingLine } = calc;

  const upperTrigram = TRIGRAM_BY_NUMBER[upperTrigramNumber];
  const lowerTrigram = TRIGRAM_BY_NUMBER[lowerTrigramNumber];
  if (!upperTrigram || !lowerTrigram) return null;

  // ── Quẻ Chủ ──
  const rawLines     = buildSixLines(lowerTrigram.lines, upperTrigram.lines);
  const primaryLines = markMoving(rawLines, movingLine);
  const primaryHexagram = lookupHexagram(lowerTrigram.binary, upperTrigram.binary);

  // ── Quẻ Hỗ ──
  const queHo = buildQueHo(rawLines);

  // ── Quẻ Biến ──
  const changedLines = flipMovingLine(rawLines, movingLine);
  const changedLowerBits = changedLines.slice(0, 3).map(l => l.yinYang === 'yang' ? '1' : '0').join('');
  const changedUpperBits = changedLines.slice(3, 6).map(l => l.yinYang === 'yang' ? '1' : '0').join('');
  const changedHexagram  = lookupHexagram(changedLowerBits, changedUpperBits);

  // ── Thể / Dụng ──
  const theDung = computeTheDung(movingLine);

  return {
    method:    'mai-hoa',
    subMode,
    question,
    createdAt: new Date().toISOString(),

    // Inputs
    inputs: { dateStr, timeStr, lunarInfo, serial: calc.padded, calc },

    // Tính toán
    upperTrigramNumber,
    lowerTrigramNumber,
    movingLine,
    upperTrigram,
    lowerTrigram,

    // 3 quẻ
    primaryLines,
    primaryHexagram,
    queHo,
    changedLines,
    changedHexagram,

    // Thể / Dụng
    theDung,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiện ích: random số gợi ý (chính xác 8 chữ số)
// ─────────────────────────────────────────────────────────────────────────────

/** Tạo 5 chuỗi 8 chữ số ngẫu nhiên */
export function generateSerialSuggestions() {
  const results = [];
  while (results.length < 5) {
    const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    // tránh số bắt đầu bằng 0
    if (digits[0] === 0) digits[0] = 1 + Math.floor(Math.random() * 9);
    results.push(digits.join(''));
  }
  return results;
}
