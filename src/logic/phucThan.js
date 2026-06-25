/**
 * Tìm Phục Thần (Hidden Spirits)
 *
 * Khi quẻ chủ thiếu một hoặc nhiều trong 5 loại Lục Thân,
 * thần bị thiếu được "ẩn" (Phục) dưới một hào nào đó.
 *
 * Cách tìm Phục Thần:
 * 1. Kiểm tra quẻ chủ có đủ 5 loại Lục Thân không.
 * 2. Nếu thiếu thần X, tra quẻ Bát Thuần của cung → tìm hào nào là thần X.
 * 3. Phục Thần X ẩn dưới hào tương ứng (cùng index) của quẻ chủ.
 *
 * Lưu ý: Quẻ Bát Thuần có đủ 5 loại Lục Thân (một số có 2 hào cùng loại).
 * Khi thiếu thần, ta lấy hào đầu tiên (tính từ H1 lên) của Bát Thuần có thần đó.
 */

import { PALACES, NAP_GIAP_CHI, BRANCH_BY_NAME } from '../data/lucYao.js';
import { getLucThan, LUC_THAN } from './lucThan.js';
import { computeNapGiap } from './napGiap.js';

/**
 * Tính Phục Thần cho quẻ chủ
 *
 * @param {Array} primaryAnnotated - 6 hào đã annotated (index 1-6, có lucThan)
 * @param {string} palaceName - tên Cung (Càn, Khảm, ...)
 * @param {string} cungElement - Ngũ Hành của Cung
 * @returns {Object} map: lineIndex → { lucThan, chi, can, nguHanh, displayLabel }
 *                   chỉ có entry nếu hào đó CÓ Phục Thần
 */
export function computePhucThan(primaryAnnotated, palaceName, cungElement) {
  const result = {};

  // Bước 1: Tìm các thần còn thiếu trong quẻ chủ
  const existingThans = new Set(primaryAnnotated.map(l => l.lucThan).filter(Boolean));
  const allThans = Object.values(LUC_THAN);
  const missingThans = allThans.filter(t => !existingThans.has(t));

  if (missingThans.length === 0) return result; // Đủ thần, không cần Phục Thần

  // Bước 2: Tra Quẻ Bát Thuần của cung
  const batThuanBinary = PALACES[palaceName]?.binary;
  if (!batThuanBinary) return result;

  // Tính Nạp Giáp cho quẻ Bát Thuần
  const batThuanNapGiap = computeNapGiap(batThuanBinary);

  // Gắn Lục Thân cho quẻ Bát Thuần
  const batThuanAnnotated = batThuanNapGiap.map(line => ({
    ...line,
    lucThan: getLucThan(line.nguHanhHao, cungElement),
  }));

  // Bước 3: Với mỗi thần bị thiếu, tìm hào đầu tiên trong Bát Thuần có thần đó
  for (const missingThan of missingThans) {
    const batThuanLine = batThuanAnnotated.find(l => l.lucThan === missingThan);
    if (!batThuanLine) continue;

    const targetLineIdx = batThuanLine.index; // hào index trong Bát Thuần (1-6)

    // Phục Thần ẩn dưới hào cùng index trong quẻ chủ
    // Nếu đã có Phục Thần tại vị trí đó → bỏ qua (lấy thần đầu tiên)
    if (result[targetLineIdx]) continue;

    result[targetLineIdx] = {
      lucThan:      missingThan,
      chi:          batThuanLine.chi,
      can:          batThuanLine.can,
      nguHanh:      batThuanLine.nguHanhHao,
      displayLabel: batThuanLine.displayLabel,
    };
  }

  return result;
}
