/**
 * Xác định Lục Thân (Six Relatives) cho từng hào
 *
 * Lục Thân dựa vào quan hệ Ngũ Hành giữa hào và Cung quẻ:
 *   Hào sinh Cung  → Phụ Mẫu    (Father/Mother)
 *   Cung sinh Hào  → Tử Tôn     (Child/Offspring)
 *   Hào khắc Cung  → Quan Quỷ   (Officer/Ghost)
 *   Cung khắc Hào  → Thê Tài    (Wife/Wealth)
 *   Đồng hành Cung → Huynh Đệ   (Siblings/Brothers)
 */

import { WU_XING } from '../data/lucYao.js';

export const LUC_THAN = {
  PHU_MAU:    'Phụ Mẫu',
  TU_TON:     'Tử Tôn',
  QUAN_QUY:   'Quan Quỷ',
  THE_TAI:    'Thê Tài',
  HUYNH_DE:   'Huynh Đệ',
};

/**
 * Tính Lục Thân cho một hào
 *
 * @param {string} haoElement   - Ngũ Hành của Địa Chi hào (Mộc/Hỏa/Thổ/Kim/Thủy)
 * @param {string} cungElement  - Ngũ Hành của Cung quẻ
 * @returns {string} tên Lục Thân
 */
export function getLucThan(haoElement, cungElement) {
  if (!haoElement || !cungElement) return '?';

  if (haoElement === cungElement) {
    return LUC_THAN.HUYNH_DE; // Đồng hành
  }

  const haoInfo = WU_XING[haoElement];
  if (!haoInfo) return '?';

  if (haoInfo.generates === cungElement) {
    return LUC_THAN.PHU_MAU;   // Hào sinh Cung
  }
  if (haoInfo.overcomes === cungElement) {
    return LUC_THAN.QUAN_QUY;  // Hào khắc Cung
  }
  if (haoInfo.generatedBy === cungElement) {
    return LUC_THAN.TU_TON;    // Cung sinh Hào
  }
  if (haoInfo.overcomeBy === cungElement) {
    return LUC_THAN.THE_TAI;   // Cung khắc Hào
  }

  return '?';
}

/**
 * Tính Lục Thân cho cả 6 hào
 *
 * @param {Array} napGiapLines - kết quả từ computeNapGiap() → [{index, nguHanhHao, ...}]
 * @param {string} cungElement - Ngũ Hành cung (từ PALACES[palaceName].element)
 * @returns {Array} [{index, lucThan}, ...]
 */
export function computeLucThan(napGiapLines, cungElement) {
  return napGiapLines.map(line => ({
    ...line,
    lucThan: getLucThan(line.nguHanhHao, cungElement),
  }));
}
