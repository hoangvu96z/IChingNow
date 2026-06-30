/**
 * Engine Lập Quẻ Mai Hoa Dịch Số — v3
 *
 * Hai mode:
 *   1. 'time'   — Ngày giờ động tâm (dùng âm lịch)
 *   2. 'serial' — Số sê-ri tiền (digit-sum)
 *
 * Kết quả gồm 3 quẻ: Quẻ Chủ, Quẻ Hỗ, Quẻ Biến
 *
 * Quy ước bát quái số (Hậu Thiên — Thiệu Khang Tiết):
 *   1=Càn, 2=Đoài, 3=Ly, 4=Chấn, 5=Tốn, 6=Khảm, 7=Cấn, 8=Khôn
 *
 * Quy ước mảng hào:
 *   Index 0 = Hào 1 (dưới cùng), Index 5 = Hào 6 (trên cùng)
 *   1 = Hào Dương (vạch liền), 0 = Hào Âm (vạch đứt)
 */

import { Solar } from 'lunar-javascript';
import { HEXAGRAMS } from '../data/hexagrams.js';

// ─────────────────────────────────────────────────────────────────────────────
// I. BÁT QUÁI — dữ liệu quái đơn
//    binary: mảng 3 phần tử [hào1, hào2, hào3] từ dưới lên trên
// ─────────────────────────────────────────────────────────────────────────────

export const BAT_QUAI = {
  1: { nameVi: 'Càn',  nameZh: '乾', symbol: 'Thiên', element: 'Kim',  binary: [1, 1, 1] },
  2: { nameVi: 'Đoài', nameZh: '兌', symbol: 'Trạch', element: 'Kim',  binary: [1, 1, 0] },
  3: { nameVi: 'Ly',   nameZh: '離', symbol: 'Hỏa',   element: 'Hỏa',  binary: [1, 0, 1] },
  4: { nameVi: 'Chấn', nameZh: '震', symbol: 'Lôi',   element: 'Mộc',  binary: [1, 0, 0] },
  5: { nameVi: 'Tốn',  nameZh: '巽', symbol: 'Phong', element: 'Mộc',  binary: [0, 1, 1] },
  6: { nameVi: 'Khảm', nameZh: '坎', symbol: 'Thủy',  element: 'Thủy', binary: [0, 1, 0] },
  7: { nameVi: 'Cấn',  nameZh: '艮', symbol: 'Sơn',   element: 'Thổ',  binary: [0, 0, 1] },
  8: { nameVi: 'Khôn', nameZh: '坤', symbol: 'Địa',   element: 'Thổ',  binary: [0, 0, 0] },
};

// Alias xuất cho component dùng
export const TRIGRAM_BY_NUMBER = BAT_QUAI;

// Reverse lookup: binaryString '011' → số quái 5
const BINARY_TO_QUAI_NUMBER = Object.fromEntries(
  Object.entries(BAT_QUAI).map(([num, q]) => [q.binary.join(''), Number(num)])
);

// ─────────────────────────────────────────────────────────────────────────────
// II. TỪ ĐIỂN 64 QUẺ — key: "ThuongID-HaID"
//     Thượng quái (Upper) — Hạ quái (Lower)
// ─────────────────────────────────────────────────────────────────────────────

const DICTIONARY_64_QUE = {
  // Thượng = Càn (1)
  '1-1': { id: 1,  nameVi: 'Thuần Càn'             },
  '1-2': { id: 10, nameVi: 'Thiên Trạch Lý'         },
  '1-3': { id: 13, nameVi: 'Thiên Hỏa Đồng Nhân'    },
  '1-4': { id: 25, nameVi: 'Thiên Lôi Vô Vọng'      },
  '1-5': { id: 44, nameVi: 'Thiên Phong Cấu'         },
  '1-6': { id: 6,  nameVi: 'Thiên Thủy Tụng'         },
  '1-7': { id: 33, nameVi: 'Thiên Sơn Độn'           },
  '1-8': { id: 12, nameVi: 'Thiên Địa Bĩ'            },
  // Thượng = Đoài (2)
  '2-1': { id: 43, nameVi: 'Trạch Thiên Quải'        },
  '2-2': { id: 58, nameVi: 'Thuần Đoài'              },
  '2-3': { id: 49, nameVi: 'Trạch Hỏa Cách'          },
  '2-4': { id: 17, nameVi: 'Trạch Lôi Tùy'           },
  '2-5': { id: 28, nameVi: 'Trạch Phong Đại Quá'     },
  '2-6': { id: 47, nameVi: 'Trạch Thủy Khốn'         },
  '2-7': { id: 31, nameVi: 'Trạch Sơn Hàm'           },
  '2-8': { id: 45, nameVi: 'Trạch Địa Tụy'           },
  // Thượng = Ly (3)
  '3-1': { id: 14, nameVi: 'Hỏa Thiên Đại Hữu'       },
  '3-2': { id: 38, nameVi: 'Hỏa Trạch Khuê'          },
  '3-3': { id: 30, nameVi: 'Thuần Ly'                 },
  '3-4': { id: 21, nameVi: 'Hỏa Lôi Phệ Hạp'         },
  '3-5': { id: 50, nameVi: 'Hỏa Phong Đỉnh'          },
  '3-6': { id: 64, nameVi: 'Hỏa Thủy Vị Tế'          },
  '3-7': { id: 56, nameVi: 'Hỏa Sơn Lữ'              },
  '3-8': { id: 35, nameVi: 'Hỏa Địa Tấn'             },
  // Thượng = Chấn (4)
  '4-1': { id: 34, nameVi: 'Lôi Thiên Đại Tráng'     },
  '4-2': { id: 54, nameVi: 'Lôi Trạch Quy Muội'      },
  '4-3': { id: 55, nameVi: 'Lôi Hỏa Phong'           },
  '4-4': { id: 51, nameVi: 'Thuần Chấn'              },
  '4-5': { id: 32, nameVi: 'Lôi Phong Hằng'          },
  '4-6': { id: 40, nameVi: 'Lôi Thủy Giải'           },
  '4-7': { id: 62, nameVi: 'Lôi Sơn Tiểu Quá'        },
  '4-8': { id: 16, nameVi: 'Lôi Địa Dự'              },
  // Thượng = Tốn (5)
  '5-1': { id: 9,  nameVi: 'Phong Thiên Tiểu Súc'    },
  '5-2': { id: 61, nameVi: 'Phong Trạch Trung Phu'   },
  '5-3': { id: 37, nameVi: 'Phong Hỏa Gia Nhân'      },
  '5-4': { id: 42, nameVi: 'Phong Lôi Ích'           },
  '5-5': { id: 57, nameVi: 'Thuần Tốn'               },
  '5-6': { id: 59, nameVi: 'Phong Thủy Hoán'         },
  '5-7': { id: 53, nameVi: 'Phong Sơn Tiệm'          },
  '5-8': { id: 20, nameVi: 'Phong Địa Quan'          },
  // Thượng = Khảm (6)
  '6-1': { id: 5,  nameVi: 'Thủy Thiên Nhu'          },
  '6-2': { id: 60, nameVi: 'Thủy Trạch Tiết'         },
  '6-3': { id: 63, nameVi: 'Thủy Hỏa Ký Tế'         },
  '6-4': { id: 3,  nameVi: 'Thủy Lôi Truân'          },
  '6-5': { id: 48, nameVi: 'Thủy Phong Tỉnh'         },
  '6-6': { id: 29, nameVi: 'Thuần Khảm'              },
  '6-7': { id: 39, nameVi: 'Thủy Sơn Kiển'           },
  '6-8': { id: 8,  nameVi: 'Thủy Địa Tỷ'             },
  // Thượng = Cấn (7)
  '7-1': { id: 26, nameVi: 'Sơn Thiên Đại Súc'       },
  '7-2': { id: 41, nameVi: 'Sơn Trạch Tổn'           },
  '7-3': { id: 22, nameVi: 'Sơn Hỏa Bí'              },
  '7-4': { id: 27, nameVi: 'Sơn Lôi Di'              },
  '7-5': { id: 18, nameVi: 'Sơn Phong Cổ'            },
  '7-6': { id: 4,  nameVi: 'Sơn Thủy Mông'           },
  '7-7': { id: 52, nameVi: 'Thuần Cấn'               },
  '7-8': { id: 23, nameVi: 'Sơn Địa Bác'             },
  // Thượng = Khôn (8)
  '8-1': { id: 11, nameVi: 'Địa Thiên Thái'          },
  '8-2': { id: 19, nameVi: 'Địa Trạch Lâm'           },
  '8-3': { id: 36, nameVi: 'Địa Hỏa Minh Di'         },
  '8-4': { id: 24, nameVi: 'Địa Lôi Phục'            },
  '8-5': { id: 46, nameVi: 'Địa Phong Thăng'         },
  '8-6': { id: 7,  nameVi: 'Địa Thủy Sư'             },
  '8-7': { id: 15, nameVi: 'Địa Sơn Khiêm'           },
  '8-8': { id: 2,  nameVi: 'Thuần Khôn'              },
};

// ─────────────────────────────────────────────────────────────────────────────
// III. HELPERS TRA CỨU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tra quẻ từ số thượng quái + số hạ quái
 * @param {number} thuongId - số quái thượng (1–8)
 * @param {number} haId     - số quái hạ (1–8)
 * @returns {Object|null} - object có { id, nameVi, ... } lấy từ HEXAGRAMS
 */
function lookupQueByNumbers(thuongId, haId) {
  const entry = DICTIONARY_64_QUE[`${thuongId}-${haId}`];
  if (!entry) return null;
  // Lấy full object (binary, lower, upper, nameZh) từ HEXAGRAMS
  const full = HEXAGRAMS.find(h => h.id === entry.id);
  return full ? { ...full, nameVi: entry.nameVi } : { id: entry.id, nameVi: entry.nameVi };
}

/**
 * Tra số quái từ mảng nhị phân 3 bit (từ dưới lên trên)
 * @param {number[]} bits - [hào1, hào2, hào3]
 * @returns {number} 1–8
 */
function bitsToQuaiNumber(bits) {
  return BINARY_TO_QUAI_NUMBER[bits.join('')] ?? 8;
}

// ─────────────────────────────────────────────────────────────────────────────
// IV. HELPERS TOÁN HỌC
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

// ─────────────────────────────────────────────────────────────────────────────
// V. XÂY DỰNG MẢNG HÀO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo mảng 6 hào từ hạ quái + thượng quái
 * Quy ước: index 0 = hào 1 (dưới), index 5 = hào 6 (trên)
 */
function buildSixLines(lowerBits, upperBits) {
  // lowerBits: [hào1, hào2, hào3], upperBits: [hào4, hào5, hào6]
  return [...lowerBits, ...upperBits].map((bit, i) => ({
    index:   i + 1,
    yinYang: bit === 1 ? 'yang' : 'yin',
    moving:  false,
  }));
}

/** Đánh dấu hào động trên mảng 6 hào */
function markMoving(lines, movingLine) {
  return lines.map(l => ({ ...l, moving: l.index === movingLine }));
}

/**
 * Lật hào động → tạo mảng 6 hào của Quẻ Biến
 * (hào động đổi âm↔dương, các hào khác giữ nguyên)
 */
function flipMovingLine(lines, movingLine) {
  return lines.map(l => {
    if (l.index !== movingLine) return { ...l, moving: false };
    return { ...l, yinYang: l.yinYang === 'yang' ? 'yin' : 'yang', moving: false };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VI. QUẺ HỖ (Nuclear Hexagram)
//     Chuẩn Kinh Dịch:
//       Hạ quái Quẻ Hỗ = Hào 2, 3, 4 của Quẻ Chủ
//       Thượng quái Quẻ Hỗ = Hào 3, 4, 5 của Quẻ Chủ
// ─────────────────────────────────────────────────────────────────────────────

function buildQueHo(primaryLines) {
  // primaryLines đã được sort theo index tăng dần từ buildSixLines
  // idx[0]=hào1, idx[1]=hào2, idx[2]=hào3, idx[3]=hào4, idx[4]=hào5, idx[5]=hào6

  // Hạ quái Hỗ = hào 2, 3, 4 → index 1, 2, 3
  const hoLowerBits = [primaryLines[1], primaryLines[2], primaryLines[3]]
    .map(l => l.yinYang === 'yang' ? 1 : 0);

  // Thượng quái Hỗ = hào 3, 4, 5 → index 2, 3, 4  (KHÔNG phải 4,5,6)
  const hoUpperBits = [primaryLines[2], primaryLines[3], primaryLines[4]]
    .map(l => l.yinYang === 'yang' ? 1 : 0);

  const hoThuongId = bitsToQuaiNumber(hoUpperBits);
  const hoHaId     = bitsToQuaiNumber(hoLowerBits);

  const hexagram    = lookupQueByNumbers(hoThuongId, hoHaId);
  const lines       = buildSixLines(hoLowerBits, hoUpperBits);

  return {
    hexagram,
    lines,
    upperTrigram: BAT_QUAI[hoThuongId],
    lowerTrigram: BAT_QUAI[hoHaId],
    upperTrigramNumber: hoThuongId,
    lowerTrigramNumber: hoHaId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VII. THỂ / DỤNG
//      Hào động 1–3 (hạ quái): Hạ quái = Dụng, Thượng quái = Thể
//      Hào động 4–6 (thượng quái): Thượng quái = Dụng, Hạ quái = Thể
// ─────────────────────────────────────────────────────────────────────────────

function computeTheDung(movingLine) {
  return movingLine <= 3
    ? { the: 'upper', dung: 'lower' }
    : { the: 'lower', dung: 'upper' };
}

// ─────────────────────────────────────────────────────────────────────────────
// VIII. ÂM LỊCH
// ─────────────────────────────────────────────────────────────────────────────

const ZH_BRANCH_CHI_NUMBER = {
  '子': 1, '丑': 2, '寅': 3, '卯': 4,
  '辰': 5, '巳': 6, '午': 7, '未': 8,
  '申': 9, '酉': 10, '戌': 11, '亥': 12,
};

const ZH_BRANCH_TO_VI = {
  '子':'Tý','丑':'Sửu','寅':'Dần','卯':'Mão',
  '辰':'Thìn','巳':'Tỵ','午':'Ngọ','未':'Mùi',
  '申':'Thân','酉':'Dậu','戌':'Tuất','亥':'Hợi',
};

const ZH_STEM_TO_VI = {
  '甲':'Giáp','乙':'Ất','丙':'Bính','丁':'Đinh','戊':'Mậu',
  '己':'Kỷ','庚':'Canh','辛':'Tân','壬':'Nhâm','癸':'Quý',
};

/** Bảng khung giờ địa chi */
export const HOUR_BRANCHES_INFO = [
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

/** Khung giờ địa chi từ giờ dương lịch (0–23) */
export function getHourBranchInfo(hour) {
  if (hour === 23) return HOUR_BRANCHES_INFO[0]; // Tý
  const idx = Math.floor((hour + 1) / 2) % 12;
  return HOUR_BRANCHES_INFO[idx];
}

/**
 * Convert dương lịch → thông tin âm lịch
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} hour    - giờ dương lịch (0–23)
 */
export function getLunarInfo(dateStr, hour = 0) {
  if (!dateStr) return null;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    const yearZhBranch  = lunar.getYearZhi();
    const yearChiNumber = ZH_BRANCH_CHI_NUMBER[yearZhBranch] || 1;
    const yearChiName   = ZH_BRANCH_TO_VI[yearZhBranch]      || yearZhBranch;
    const yearStemVi    = ZH_STEM_TO_VI[lunar.getYearGan()]  || '';
    const monthNum      = Math.abs(lunar.getMonth());
    const dayNum        = lunar.getDay();
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

// ─────────────────────────────────────────────────────────────────────────────
// IX. CÔNG THỨC TÍNH SỐ THƯỢNG / HẠ / HÀO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mode ngày giờ động tâm
 *   Số Thượng = năm chi + tháng + ngày  → thượng quái
 *   Số Hạ     = năm chi + tháng + ngày + giờ chi → hạ quái
 *   Hào động  = Số Hạ % 6
 */
export function getMaiHoaByTime(yearChiNumber, monthNumber, dayNumber, hourChiNumber) {
  const soThuong = yearChiNumber + monthNumber + dayNumber;
  const soHa     = soThuong + hourChiNumber;
  const soHao    = soHa;

  return {
    soThuong,
    soHa,
    soHao,
    upperTrigramNumber: mod8(soThuong),
    lowerTrigramNumber: mod8(soHa),
    movingLine:         mod6(soHao),
  };
}

/**
 * Mode số sê-ri tiền
 *   Tách số thành 2 nửa: nửa đầu (ceil) / nửa sau
 *   Số Thượng = tổng chữ số nửa đầu → thượng quái
 *   Số Hạ     = tổng chữ số nửa sau → hạ quái
 *   Số Hào    = Số Thượng + Số Hạ   → hào động
 */
export function getMaiHoaBySerial(serialStr) {
  const digits = serialStr.replace(/\D/g, '').slice(0, 8);
  const len    = digits.length;
  const mid    = Math.ceil(len / 2);
  const first  = digits.slice(0, mid);
  const last   = digits.slice(mid);

  const soThuong = digitSum(first);
  const soHa     = last.length > 0 ? digitSum(last) : soThuong;
  const soHao    = soThuong + soHa;

  return {
    digits,
    first4: first,
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
// X. HÀM CHÍNH: buildMaiHoaResult → bộ 3 quẻ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tính toán đầy đủ kết quả Mai Hoa (3 quẻ: Chủ, Hỗ, Biến)
 *
 * @param {Object} params
 * @param {string} params.subMode   - 'time' | 'serial'
 * @param {string} [params.dateStr] - 'YYYY-MM-DD' (mode time)
 * @param {string} [params.timeStr] - 'HH:mm' (mode time)
 * @param {string} [params.serial]  - chuỗi số (mode serial)
 * @param {string} [params.question]
 * @returns {Object|null}
 */
export function buildMaiHoaResult({ subMode, dateStr, timeStr, serial, question = '' }) {
  let calc;
  let lunarInfo = null;

  // ── Bước 1: Tính Số Thượng / Số Hạ / Hào động ──
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
    const cleaned = (serial || '').replace(/\D/g, '');
    if (cleaned.length < 2 || cleaned.length > 8) return null;
    calc = getMaiHoaBySerial(cleaned);
  }

  const { upperTrigramNumber, lowerTrigramNumber, movingLine } = calc;

  // ── Bước 2: Lấy quái đơn ──
  const upperTrigram = BAT_QUAI[upperTrigramNumber];
  const lowerTrigram = BAT_QUAI[lowerTrigramNumber];
  if (!upperTrigram || !lowerTrigram) return null;

  // ── Bước 3: Quẻ Chủ ──
  // 6 hào: [lowerBits[0..2], upperBits[0..2]] → hào 1–6
  const rawLines        = buildSixLines(lowerTrigram.binary, upperTrigram.binary);
  const primaryLines    = markMoving(rawLines, movingLine);
  const primaryHexagram = lookupQueByNumbers(upperTrigramNumber, lowerTrigramNumber);

  // ── Bước 4: Quẻ Hỗ ──
  // rawLines là mảng index 0–5 = hào 1–6 (chưa đánh moving)
  const queHo = buildQueHo(rawLines);

  // ── Bước 5: Quẻ Biến ──
  const changedLines = flipMovingLine(rawLines, movingLine);
  // Xác định quái hạ/thượng của quẻ biến
  const changedLowerBits = changedLines.slice(0, 3).map(l => l.yinYang === 'yang' ? 1 : 0);
  const changedUpperBits = changedLines.slice(3, 6).map(l => l.yinYang === 'yang' ? 1 : 0);
  const changedThuongId  = bitsToQuaiNumber(changedUpperBits);
  const changedHaId      = bitsToQuaiNumber(changedLowerBits);
  const changedHexagram  = lookupQueByNumbers(changedThuongId, changedHaId);

  // ── Bước 6: Thể / Dụng ──
  const theDung = computeTheDung(movingLine);

  return {
    method:    'mai-hoa',
    subMode,
    question,
    createdAt: new Date().toISOString(),

    // Inputs (dùng cho export / bảng tóm tắt)
    inputs: {
      dateStr,
      timeStr,
      lunarInfo,
      serial: calc.digits,
      calc,
    },

    // Số quái & hào động
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
// XI. TIỆN ÍCH
// ─────────────────────────────────────────────────────────────────────────────

/** Tạo 5 chuỗi 8 chữ số ngẫu nhiên để gợi ý */
export function generateSerialSuggestions() {
  const results = [];
  while (results.length < 5) {
    const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10));
    if (digits[0] === 0) digits[0] = 1 + Math.floor(Math.random() * 9);
    results.push(digits.join(''));
  }
  return results;
}
