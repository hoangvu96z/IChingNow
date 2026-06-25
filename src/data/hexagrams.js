/**
 * 64 Quẻ Kinh Dịch
 * binary: chuỗi 6 bit từ hào 1 (dưới) đến hào 6 (trên)
 *   '1' = dương (—)
 *   '0' = âm (- -)
 * upper: quái trên (hào 4,5,6)
 * lower: quái dưới (hào 1,2,3)
 */

export const TRIGRAMS = {
  '111': { nameVi: 'Càn', nameZh: '乾', element: 'Kim', nature: 'Trời' },
  '000': { nameVi: 'Khôn', nameZh: '坤', element: 'Thổ', nature: 'Đất' },
  '100': { nameVi: 'Chấn', nameZh: '震', element: 'Mộc', nature: 'Sấm' },
  '011': { nameVi: 'Tốn', nameZh: '巽', element: 'Mộc', nature: 'Gió' },
  '010': { nameVi: 'Khảm', nameZh: '坎', element: 'Thủy', nature: 'Nước' },
  '101': { nameVi: 'Ly', nameZh: '離', element: 'Hỏa', nature: 'Lửa' },
  '001': { nameVi: 'Cấn', nameZh: '艮', element: 'Thổ', nature: 'Núi' },
  '110': { nameVi: 'Đoài', nameZh: '兌', element: 'Kim', nature: 'Đầm' },
};

// Lookup by lower+upper trigram binary string (lower 3 bits + upper 3 bits)
export const HEXAGRAMS = [
  { id: 1,  binary: '111111', nameVi: 'Thuần Càn',       nameZh: '乾', lower: '111', upper: '111' },
  { id: 2,  binary: '000000', nameVi: 'Thuần Khôn',      nameZh: '坤', lower: '000', upper: '000' },
  { id: 3,  binary: '100010', nameVi: 'Thủy Lôi Truân',  nameZh: '屯', lower: '100', upper: '010' },
  { id: 4,  binary: '010001', nameVi: 'Sơn Thủy Mông',   nameZh: '蒙', lower: '010', upper: '001' },
  { id: 5,  binary: '111010', nameVi: 'Thủy Thiên Nhu',  nameZh: '需', lower: '111', upper: '010' },
  { id: 6,  binary: '010111', nameVi: 'Thiên Thủy Tụng', nameZh: '訟', lower: '010', upper: '111' },
  { id: 7,  binary: '000010', nameVi: 'Địa Thủy Sư',     nameZh: '師', lower: '000', upper: '010' },  // fixed
  { id: 8,  binary: '010000', nameVi: 'Thủy Địa Tỷ',     nameZh: '比', lower: '010', upper: '000' },  // fixed
  { id: 9,  binary: '111011', nameVi: 'Phong Thiên Tiểu Súc', nameZh: '小畜', lower: '111', upper: '011' },
  { id: 10, binary: '110111', nameVi: 'Thiên Trạch Lý',  nameZh: '履', lower: '110', upper: '111' },
  { id: 11, binary: '111000', nameVi: 'Địa Thiên Thái',  nameZh: '泰', lower: '111', upper: '000' },
  { id: 12, binary: '000111', nameVi: 'Thiên Địa Bĩ',    nameZh: '否', lower: '000', upper: '111' },
  { id: 13, binary: '101111', nameVi: 'Thiên Hỏa Đồng Nhân', nameZh: '同人', lower: '101', upper: '111' },
  { id: 14, binary: '111101', nameVi: 'Hỏa Thiên Đại Hữu', nameZh: '大有', lower: '111', upper: '101' },
  { id: 15, binary: '001000', nameVi: 'Địa Sơn Khiêm',   nameZh: '謙', lower: '001', upper: '000' },
  { id: 16, binary: '000100', nameVi: 'Lôi Địa Dự',      nameZh: '豫', lower: '000', upper: '100' },  // fixed
  { id: 17, binary: '100110', nameVi: 'Trạch Lôi Tùy',   nameZh: '隨', lower: '100', upper: '110' },
  { id: 18, binary: '011001', nameVi: 'Sơn Phong Cổ',    nameZh: '蠱', lower: '011', upper: '001' },
  { id: 19, binary: '110000', nameVi: 'Địa Trạch Lâm',   nameZh: '臨', lower: '110', upper: '000' },
  { id: 20, binary: '000011', nameVi: 'Phong Địa Quan',   nameZh: '觀', lower: '000', upper: '011' },
  { id: 21, binary: '100101', nameVi: 'Hỏa Lôi Phệ Hạp', nameZh: '噬嗑', lower: '100', upper: '101' },
  { id: 22, binary: '101001', nameVi: 'Sơn Hỏa Bí',      nameZh: '賁', lower: '101', upper: '001' },
  { id: 23, binary: '000001', nameVi: 'Sơn Địa Bác',     nameZh: '剝', lower: '000', upper: '001' },
  { id: 24, binary: '100000', nameVi: 'Địa Lôi Phục',    nameZh: '復', lower: '100', upper: '000' },  // fixed
  { id: 25, binary: '100111', nameVi: 'Thiên Lôi Vô Vọng', nameZh: '無妄', lower: '100', upper: '111' },
  { id: 26, binary: '111001', nameVi: 'Sơn Thiên Đại Súc', nameZh: '大畜', lower: '111', upper: '001' },
  { id: 27, binary: '100001', nameVi: 'Sơn Lôi Di',      nameZh: '頤',  lower: '100', upper: '001' },
  { id: 28, binary: '011110', nameVi: 'Trạch Phong Đại Quá', nameZh: '大過', lower: '011', upper: '110' },
  { id: 29, binary: '010010', nameVi: 'Thuần Khảm',      nameZh: '坎', lower: '010', upper: '010' },
  { id: 30, binary: '101101', nameVi: 'Thuần Ly',        nameZh: '離', lower: '101', upper: '101' },
  { id: 31, binary: '001110', nameVi: 'Trạch Sơn Hàm',   nameZh: '咸', lower: '001', upper: '110' },
  { id: 32, binary: '011100', nameVi: 'Lôi Phong Hằng',  nameZh: '恆', lower: '011', upper: '100' },
  { id: 33, binary: '001111', nameVi: 'Thiên Sơn Độn',   nameZh: '遯', lower: '001', upper: '111' },
  { id: 34, binary: '111100', nameVi: 'Lôi Thiên Đại Tráng', nameZh: '大壯', lower: '111', upper: '100' },
  { id: 35, binary: '000101', nameVi: 'Hỏa Địa Tấn',     nameZh: '晉', lower: '000', upper: '101' },
  { id: 36, binary: '101000', nameVi: 'Địa Hỏa Minh Di', nameZh: '明夷', lower: '101', upper: '000' },
  { id: 37, binary: '101011', nameVi: 'Phong Hỏa Gia Nhân', nameZh: '家人', lower: '101', upper: '011' },
  { id: 38, binary: '110101', nameVi: 'Hỏa Trạch Khuê',  nameZh: '睽', lower: '110', upper: '101' },
  { id: 39, binary: '001010', nameVi: 'Thủy Sơn Kiển',   nameZh: '蹇', lower: '001', upper: '010' },
  { id: 40, binary: '010100', nameVi: 'Lôi Thủy Giải',   nameZh: '解', lower: '010', upper: '100' },  // fixed
  { id: 41, binary: '110001', nameVi: 'Sơn Trạch Tổn',   nameZh: '損', lower: '110', upper: '001' },
  { id: 42, binary: '100011', nameVi: 'Phong Lôi Ích',   nameZh: '益', lower: '100', upper: '011' },
  { id: 43, binary: '111110', nameVi: 'Trạch Thiên Quải', nameZh: '夬', lower: '111', upper: '110' },
  { id: 44, binary: '011111', nameVi: 'Thiên Phong Cấu',  nameZh: '姤', lower: '011', upper: '111' },
  { id: 45, binary: '000110', nameVi: 'Trạch Địa Tụy',   nameZh: '萃', lower: '000', upper: '110' },
  { id: 46, binary: '011000', nameVi: 'Địa Phong Thăng',  nameZh: '升', lower: '011', upper: '000' },
  { id: 47, binary: '010110', nameVi: 'Trạch Thủy Khốn',  nameZh: '困', lower: '010', upper: '110' },
  { id: 48, binary: '011010', nameVi: 'Thủy Phong Tỉnh',  nameZh: '井', lower: '011', upper: '010' },
  { id: 49, binary: '101110', nameVi: 'Trạch Hỏa Cách',  nameZh: '革', lower: '101', upper: '110' },
  { id: 50, binary: '011101', nameVi: 'Hỏa Phong Đỉnh',  nameZh: '鼎', lower: '011', upper: '101' },
  { id: 51, binary: '100100', nameVi: 'Thuần Chấn',      nameZh: '震', lower: '100', upper: '100' },
  { id: 52, binary: '001001', nameVi: 'Thuần Cấn',       nameZh: '艮', lower: '001', upper: '001' },
  { id: 53, binary: '001011', nameVi: 'Phong Sơn Tiệm',  nameZh: '漸', lower: '001', upper: '011' },
  { id: 54, binary: '110100', nameVi: 'Lôi Trạch Quy Muội', nameZh: '歸妹', lower: '110', upper: '100' },
  { id: 55, binary: '101100', nameVi: 'Lôi Hỏa Phong',   nameZh: '豐', lower: '101', upper: '100' },
  { id: 56, binary: '001101', nameVi: 'Hỏa Sơn Lữ',     nameZh: '旅', lower: '001', upper: '101' },
  { id: 57, binary: '011011', nameVi: 'Thuần Tốn',       nameZh: '巽', lower: '011', upper: '011' },
  { id: 58, binary: '110110', nameVi: 'Thuần Đoài',      nameZh: '兌', lower: '110', upper: '110' },
  { id: 59, binary: '011010', nameVi: 'Phong Thủy Hoán', nameZh: '渙', lower: '010', upper: '011' },
  { id: 60, binary: '010110', nameVi: 'Thủy Trạch Tiết', nameZh: '節', lower: '110', upper: '010' },
  { id: 61, binary: '011110', nameVi: 'Phong Trạch Trung Phu', nameZh: '中孚', lower: '110', upper: '011' },
  { id: 62, binary: '001100', nameVi: 'Lôi Sơn Tiểu Quá', nameZh: '小過', lower: '001', upper: '100' },
  { id: 63, binary: '101010', nameVi: 'Thủy Hỏa Ký Tế', nameZh: '既濟', lower: '101', upper: '010' },
  { id: 64, binary: '010101', nameVi: 'Hỏa Thủy Vị Tế', nameZh: '未濟', lower: '010', upper: '101' },
];

// Build lookup table by lower+upper
const _lookup = {};
HEXAGRAMS.forEach(h => {
  const key = h.lower + h.upper;
  _lookup[key] = h;
});

/**
 * Tìm quẻ từ mảng 6 hào
 * @param {Array} lines - mảng 6 hào [{yinYang, moving, ...}], index 1=dưới, 6=trên
 * @returns {Object|null} hexagram object
 */
export function findHexagram(lines) {
  if (!lines || lines.length < 6) return null;
  const sorted = [...lines].sort((a, b) => a.index - b.index);
  // binary: hào 1..6, '1'=dương, '0'=âm
  const bits = sorted.map(l => l.yinYang === 'yang' ? '1' : '0');
  const lower = bits.slice(0, 3).join('');
  const upper = bits.slice(3, 6).join('');
  return _lookup[lower + upper] || null;
}

/**
 * Tìm quẻ biến (đảo bit những hào động)
 */
export function findChangedHexagram(lines) {
  if (!lines || lines.length < 6) return null;
  const changed = lines.map(l => ({
    ...l,
    yinYang: l.moving ? (l.yinYang === 'yang' ? 'yin' : 'yang') : l.yinYang,
  }));
  return findHexagram(changed);
}
