/**
 * Logic gieo quẻ - mô phỏng 3 đồng xu
 * 
 * Quy tắc 3 đồng xu:
 *   Ngửa (Heads) = 3 điểm
 *   Sấp (Tails)  = 2 điểm
 * 
 *   Tổng 6  (3x sấp)       = Lão âm  (moving yin)   ══ x ══
 *   Tổng 7  (2 sấp + ngửa) = Thiếu dương (static yang) ═══════
 *   Tổng 8  (1 sấp + ngửa) = Thiếu âm  (static yin)  ═══ ═══
 *   Tổng 9  (3x ngửa)      = Lão dương (moving yang)  ═══○═══
 */

const COIN_VALUES = { ngua: 3, sap: 2 };

/**
 * Tung 1 đồng xu
 * @returns {'ngua'|'sap'}
 */
export function tossOneCoin() {
  return Math.random() < 0.5 ? 'ngua' : 'sap';
}

/**
 * Mô phỏng phương pháp Cỏ Thi (Yarrow Stalks) cổ xưa
 * Xác suất phân chia chính xác:
 * - Lão âm (6) [Âm động]: 1/16 (6.25%)
 * - Thiếu dương (7) [Dương tĩnh]: 5/16 (31.25%)
 * - Thiếu âm (8) [Âm tĩnh]: 7/16 (43.75%)
 * - Lão dương (9) [Dương động]: 3/16 (18.75%)
 */
function castYarrowStalks() {
  const r = Math.random();
  if (r < 0.0625) {
    return ['sap', 'sap', 'sap']; // Tổng 6 (Lão âm)
  } else if (r < 0.375) {
    return ['sap', 'sap', 'ngua']; // Tổng 7 (Thiếu dương)
  } else if (r < 0.8125) {
    return ['sap', 'ngua', 'ngua']; // Tổng 8 (Thiếu âm)
  } else {
    return ['ngua', 'ngua', 'ngua']; // Tổng 9 (Lão dương)
  }
}

/**
 * Phương pháp đồng xác suất (Equal Probability)
 * Tỷ lệ: 25% cho mỗi trạng thái hào
 */
function castEqualProbability() {
  const r = Math.random();
  if (r < 0.25) {
    return ['sap', 'sap', 'sap'];
  } else if (r < 0.50) {
    return ['sap', 'sap', 'ngua'];
  } else if (r < 0.75) {
    return ['sap', 'ngua', 'ngua'];
  } else {
    return ['ngua', 'ngua', 'ngua'];
  }
}

/**
 * Tung 3 đồng xu và tính kết quả theo thuật toán được chọn
 * @returns {{ coins: string[], total: number, yinYang: string, moving: boolean, type: string }}
 */
export function castOneLine(algorithm = 'three-coin') {
  let coins;
  if (algorithm === 'yarrow-stalks') {
    coins = castYarrowStalks();
  } else if (algorithm === 'equal-prob') {
    coins = castEqualProbability();
  } else {
    coins = [tossOneCoin(), tossOneCoin(), tossOneCoin()];
  }
  return coinsToLine(coins);
}

/**
 * Tính kết quả từ 3 đồng xu đã tung
 * @param {string[]} coins - mảng 3 phần tử, mỗi phần tử là 'ngua' hoặc 'sap'
 */
export function coinsToLine(coins) {
  const total = coins.reduce((sum, c) => sum + COIN_VALUES[c], 0);
  let yinYang, moving, type;

  switch (total) {
    case 6:
      yinYang = 'yin';  moving = true;  type = 'lao-am';    break;
    case 7:
      yinYang = 'yang'; moving = false; type = 'thieu-duong'; break;
    case 8:
      yinYang = 'yin';  moving = false; type = 'thieu-am';   break;
    case 9:
      yinYang = 'yang'; moving = true;  type = 'lao-duong';  break;
    default:
      yinYang = 'yin';  moving = false; type = 'thieu-am';   break;
  }

  return { coins, total, yinYang, moving, type };
}

/**
 * Gieo nhanh 6 hào
 * @returns {Array} mảng 6 hào từ hào 1 (dưới) đến hào 6 (trên)
 */
export function castAllLines(algorithm = 'three-coin') {
  return Array.from({ length: 6 }, (_, i) => ({
    index: i + 1,
    ...castOneLine(algorithm),
  }));
}

/**
 * Label cho loại hào
 */
export const LINE_TYPE_LABELS = {
  'lao-am':      'Lão Âm',
  'thieu-duong': 'Thiếu Dương',
  'thieu-am':    'Thiếu Âm',
  'lao-duong':   'Lão Dương',
};

/**
 * Label cho đồng xu
 */
export const COIN_LABELS = {
  ngua: 'Ngửa',
  sap:  'Sấp',
};
