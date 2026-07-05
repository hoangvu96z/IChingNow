/**
 * Nạp Giáp — Gán Địa Chi và Thiên Can cho từng hào của quẻ
 * theo hệ thống Kinh Phòng (京房)
 *
 * Dựa vào quái nội và quái ngoại của quẻ (từ hàm palaceFinder)
 * để tìm đúng bảng Nạp Giáp.
 */

import {
  NAP_GIAP_CHI,
  NAP_GIAP_CAN,
  BRANCH_BY_NAME,
  STEM_BY_NAME,
} from '../data/lucYao.js';

import { TRIGRAMS } from '../data/hexagrams.js';

/**
 * Lấy tên Bát Quái từ chuỗi 3 bit
 * '111'→Càn, '000'→Khôn, v.v.
 */
export function getTrigramName(bits3) {
  const t = TRIGRAMS[bits3];
  return t ? t.nameVi : null;
}

/**
 * Tính Nạp Giáp cho toàn bộ 6 hào của một quẻ
 *
 * @param {string} hexBinary - 6 bit từ hào 1 đến hào 6 ('1'=dương, '0'=âm)
 * @returns {Array} mảng 6 phần tử (index 0=H1..5=H6):
 *   { index, can, chi, nguHanhHao, canObj, chiObj }
 */
export function computeNapGiap(hexBinary) {
  if (!hexBinary || hexBinary.length !== 6) return [];

  const innerBits = hexBinary.slice(0, 3); // hào 1,2,3 = quái dưới
  const outerBits = hexBinary.slice(3, 6); // hào 4,5,6 = quái trên

  const innerName = getTrigramName(innerBits);
  const outerName = getTrigramName(outerBits);

  if (!innerName || !outerName) return [];

  const innerChi = NAP_GIAP_CHI[innerName]?.inner || [];
  const outerChi = NAP_GIAP_CHI[outerName]?.outer || [];
  const innerCan = NAP_GIAP_CAN[innerName]?.inner || [];
  const outerCan = NAP_GIAP_CAN[outerName]?.outer || [];

  const result = [];

  // Hào 1,2,3 — quái dưới (inner)
  for (let i = 0; i < 3; i++) {
    const chi    = innerChi[i] || '?';
    const can    = innerCan[i] || '?';
    const chiObj = BRANCH_BY_NAME[chi] || null;
    const canObj = STEM_BY_NAME[can]   || null;
    result.push({
      index: i + 1,
      can,
      chi,
      chiObj,
      canObj,
      nguHanhHao: chiObj?.element || '?',
      displayLabel: `${can} ${chi}`,         // e.g. "Giáp Tý"
      displayElement: chiObj?.element || '?', // e.g. "Thủy"
    });
  }

  // Hào 4,5,6 — quái trên (outer)
  for (let i = 0; i < 3; i++) {
    const chi    = outerChi[i] || '?';
    const can    = outerCan[i] || '?';
    const chiObj = BRANCH_BY_NAME[chi] || null;
    const canObj = STEM_BY_NAME[can]   || null;
    result.push({
      index: i + 4,
      can,
      chi,
      chiObj,
      canObj,
      nguHanhHao: chiObj?.element || '?',
      displayLabel: `${can} ${chi}`,
      displayElement: chiObj?.element || '?',
    });
  }

  return result; // [H1, H2, H3, H4, H5, H6]
}

/**
 * Nạp giáp cho quẻ biến (hào động đã đảo yinYang)
 * Địa Chi KHÔNG thay đổi khi hào động — chỉ yinYang đảo
 * nhưng hào biến vẫn dùng Chi của quẻ biến (cùng quái)
 *
 * @param {string} changedBinary - binary của quẻ biến
 */
export function computeNapGiapChanged(changedBinary) {
  return computeNapGiap(changedBinary);
}
