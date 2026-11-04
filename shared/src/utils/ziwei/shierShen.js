/**
 * Vòng Bác Sỹ 12 Thần, Vòng Tuế Tiền (Thái Tuế) 12 Thần & Vòng Tướng Tiền 12 Thần
 * Ported & localized in Vietnamese from lib/ziwei/shier-shen.ts.
 */
import { DIA_CHI, THIEN_CAN } from './solarTime.js';

/**
 * Vòng Tướng Tiền 12 Thần (Khởi Tướng Tinh tại cung Đế Vượng của Tam Hợp Địa Chi, chạy thuận)
 */
export const JIANG_QIAN_SHEN = [
  'Tướng Tinh', 'Phan Án', 'Tuế Dịch', 'Tức Thần', 'Hoa Cái', 'Kiếp Sát',
  'Tai Sát', 'Thiên Sát', 'Chỉ Bối', 'Hàm Trì', 'Nguyệt Sát', 'Vong Thần',
];

/**
 * Vòng Tuế Tiền 12 Thần (Đẩu Số Toàn Thư / Bắc Phái: Tuế Kiến, Hối Khí, Tang Môn, Quán Sách...)
 */
export const SUI_QIAN_SHEN = [
  'Tuế Kiến', 'Hối Khí', 'Tang Môn', 'Quán Sách', 'Quan Phù', 'Tiểu Hao',
  'Tuế Phá', 'Long Đức', 'Bạch Hổ', 'Thiên Đức', 'Điếu Khách', 'Bệnh Phù',
];

/**
 * Vòng Thái Tuế 12 Thần (Chuẩn Nam Phái Việt Nam)
 */
export const THAI_TUE_SHEN_VI = [
  'Thái Tuế', 'Thiếu Dương', 'Tang Môn', 'Thiếu Âm', 'Quan Phù', 'Tử Phù',
  'Tuế Phá', 'Long Đức', 'Bạch Hổ', 'Phúc Đức', 'Điếu Khách', 'Trực Phù',
];

/**
 * Vòng Bác Sỹ 12 Thần (Khởi từ Lộc Tồn năm sinh, Dương Nam Âm Nữ thuận, Âm Nam Dương Nữ nghịch)
 */
export const BOSHI_SHEN = [
  'Bác Sỹ', 'Lực Sĩ', 'Thanh Long', 'Tiểu Hao', 'Tướng Quân', 'Tấu Thư',
  'Phi Liêm', 'Hỷ Thần', 'Bệnh Phù', 'Đại Hao', 'Phục Binh', 'Quan Phù',
];

// Bảng Lộc Tồn theo Thiên Can năm sinh (0=Giáp .. 9=Quý) -> Địa Chi (0=Tý .. 11=Hợi)
export const LUCUN_TABLE = {
  0: 2,  // Giáp: Dần
  1: 3,  // Ất: Mão
  2: 5,  // Bính: Tỵ
  3: 6,  // Đinh: Ngọ
  4: 5,  // Mậu: Tỵ
  5: 6,  // Kỷ: Ngọ
  6: 8,  // Canh: Thân
  7: 9,  // Tân: Dậu
  8: 11, // Nhâm: Hợi
  9: 0,  // Quý: Tý
};

/**
 * Vị trí Tướng Tinh theo Tam Hợp Địa Chi:
 * Thân(8) - Tý(0) - Thìn(4) -> Tý (0)
 * Dần(2) - Ngọ(6) - Tuất(10) -> Ngọ (6)
 * Tỵ(5) - Dậu(9) - Sửu(1) -> Dậu (9)
 * Hợi(11) - Mão(3) - Mùi(7) -> Mão (3)
 */
export function jiangXingBranch(anchorBranch) {
  const b = ((Math.trunc(anchorBranch) % 12) + 12) % 12;
  return [0, 9, 6, 3][b % 4];
}

/**
 * Vòng Tướng Tiền 12 Thần theo Địa Chi gốc (`anchorBranch`):
 * Trả về mảng 12 phần tử, chỉ số là cung Địa Chi (0=Tý..11=Hợi), giá trị là thứ tự thần (0..11).
 */
export function jiangQianShenByBranch(anchorBranch) {
  const start = jiangXingBranch(anchorBranch);
  const out = new Array(12);
  for (let shen = 0; shen < 12; shen++) {
    out[(start + shen) % 12] = shen;
  }
  return out;
}

/**
 * Vòng Tuế Tiền / Thái Tuế 12 Thần theo Địa Chi gốc (`anchorBranch`):
 * Trả về mảng 12 phần tử, chỉ số là cung Địa Chi (0=Tý..11=Hợi), giá trị là thứ tự thần (0..11).
 */
export function suiQianShenByBranch(anchorBranch) {
  const a = ((Math.trunc(anchorBranch) % 12) + 12) % 12;
  const out = new Array(12);
  for (let shen = 0; shen < 12; shen++) {
    out[(a + shen) % 12] = shen;
  }
  return out;
}

export function jiangQianShenName(anchorBranch, palaceBranch) {
  const idx = jiangQianShenByBranch(anchorBranch)[((Math.trunc(palaceBranch) % 12) + 12) % 12];
  return JIANG_QIAN_SHEN[idx];
}

export function suiQianShenName(anchorBranch, palaceBranch, useNamPhai = false) {
  const idx = suiQianShenByBranch(anchorBranch)[((Math.trunc(palaceBranch) % 12) + 12) % 12];
  return useNamPhai ? THAI_TUE_SHEN_VI[idx] : SUI_QIAN_SHEN[idx];
}

function isMaleGender(gender) {
  if (gender === 1 || gender === 'male' || gender === 'Nam') return true;
  return false;
}

/**
 * Dương Nam Âm Nữ thuận (reverse = false), Âm Nam Dương Nữ nghịch (reverse = true)
 */
export function boshiReverse(yearStem, gender) {
  const yangStem = ((Math.trunc(yearStem) % 10) + 10) % 10 % 2 === 0;
  return yangStem !== isMaleGender(gender);
}

/**
 * Vòng Bác Sỹ 12 Thần theo Thiên Can năm sinh (`yearStem`) và Giới tính (`gender`):
 * Trả về mảng 12 phần tử, chỉ số là cung Địa Chi (0=Tý..11=Hợi), giá trị là thứ tự thần (0..11).
 */
export function boshiShenByStem(yearStem, gender = 1) {
  const stemIdx = ((Math.trunc(yearStem) % 10) + 10) % 10;
  const start = LUCUN_TABLE[stemIdx];
  const reverse = boshiReverse(stemIdx, gender);
  const out = new Array(12);
  for (let shen = 0; shen < 12; shen++) {
    const branch = reverse ? (start - shen + 12) % 12 : (start + shen) % 12;
    out[branch] = shen;
  }
  return out;
}

export function boshiShenName(yearStem, gender, palaceBranch) {
  const idx = boshiShenByStem(yearStem, gender)[((Math.trunc(palaceBranch) % 12) + 12) % 12];
  return BOSHI_SHEN[idx];
}

/**
 * Xây dựng dữ liệu 3 vòng Thập Nhị Thần (Bác Sỹ, Tuế Tiền / Thái Tuế, Tướng Tiền)
 * cho cả Bản Mệnh (`yearChiIndex`) và Vận Hạn Đương Thời (`activeBranchIndex`).
 */
export function buildShierShenForChart(chart, options = {}) {
  const canChiParts = String(chart?.canChiNam || '').trim().split(/\s+/);
  const natalStemIdx = options.yearCanIndex !== undefined
    ? options.yearCanIndex
    : Math.max(0, THIEN_CAN.indexOf(canChiParts[0]));
  const natalBranchIdx = options.yearChiIndex !== undefined
    ? options.yearChiIndex
    : Math.max(0, DIA_CHI.indexOf(canChiParts[1]));
  const gender = options.gender !== undefined
    ? options.gender
    : (String(chart?.amDuongNamNu || '').includes('Nam') ? 1 : 0);

  const activeBranchIdx = options.activeBranchIndex !== undefined && options.activeBranchIndex !== null
    ? ((Math.trunc(options.activeBranchIndex) % 12) + 12) % 12
    : natalBranchIdx;

  const boshiArr = boshiShenByStem(natalStemIdx, gender);
  const natalSuiQianArr = suiQianShenByBranch(natalBranchIdx);
  const natalJiangQianArr = jiangQianShenByBranch(natalBranchIdx);
  const activeSuiQianArr = suiQianShenByBranch(activeBranchIdx);
  const activeJiangQianArr = jiangQianShenByBranch(activeBranchIdx);

  return Array.from({ length: 12 }, (_, branch) => ({
    chiIndex: branch,
    chiName: DIA_CHI[branch],
    boshi: BOSHI_SHEN[boshiArr[branch]],
    natalSuiQian: SUI_QIAN_SHEN[natalSuiQianArr[branch]],
    natalThaiTue: THAI_TUE_SHEN_VI[natalSuiQianArr[branch]],
    natalJiangQian: JIANG_QIAN_SHEN[natalJiangQianArr[branch]],
    activeSuiQian: SUI_QIAN_SHEN[activeSuiQianArr[branch]],
    activeThaiTue: THAI_TUE_SHEN_VI[activeSuiQianArr[branch]],
    activeJiangQian: JIANG_QIAN_SHEN[activeJiangQianArr[branch]],
  }));
}
