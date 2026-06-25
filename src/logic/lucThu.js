/**
 * An Lục Thú / Lục Thần (Six Beasts)
 *
 * 6 thú theo thứ tự từ Hào 1 lên Hào 6:
 *   Thanh Long, Chu Tước, Câu Trận, Đằng Xà, Bạch Hổ, Huyền Vũ
 *
 * Thú xuất phát (tại Hào 1) phụ thuộc vào Thiên Can Ngày gieo quẻ:
 *   Giáp/Ất  → Thanh Long (index 0)
 *   Bính/Đinh→ Chu Tước   (index 1)
 *   Mậu      → Câu Trận   (index 2)
 *   Kỷ       → Đằng Xà    (index 3)
 *   Canh/Tân → Bạch Hổ   (index 4)
 *   Nhâm/Quý → Huyền Vũ  (index 5)
 */

import { LUC_THU, LUC_THU_START } from '../data/lucYao.js';

export { LUC_THU };

/**
 * Lấy index thú bắt đầu tại Hào 1 từ Thiên Can Ngày
 * @param {string} ngayCan - tên Thiên Can ngày (Giáp, Ất, ...)
 * @returns {number} index 0-5
 */
export function getLucThuStartIndex(ngayCan) {
  return LUC_THU_START[ngayCan] ?? 0;
}

/**
 * Tính Lục Thú cho cả 6 hào
 * Hào 1 = startIdx, Hào 2 = (startIdx+1)%6, ..., Hào 6 = (startIdx+5)%6
 *
 * @param {string} ngayCan - Thiên Can Ngày
 * @returns {string[]} mảng 6 tên thú [H1, H2, H3, H4, H5, H6]
 */
export function computeLucThu(ngayCan) {
  const startIdx = getLucThuStartIndex(ngayCan);
  return Array.from({ length: 6 }, (_, i) => LUC_THU[(startIdx + i) % 6]);
}

/**
 * Gắn Lục Thú vào mảng hào đã annotated
 * @param {Array} annotatedLines - mảng [{index, ...}]
 * @param {string} ngayCan
 * @returns {Array} mảng với thêm field `lucThu`
 */
export function attachLucThu(annotatedLines, ngayCan) {
  const thuList = computeLucThu(ngayCan);
  return annotatedLines.map(line => ({
    ...line,
    lucThu: thuList[line.index - 1] || '?',
  }));
}
