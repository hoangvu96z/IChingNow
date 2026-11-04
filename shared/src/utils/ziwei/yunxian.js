/**
 * Điều Hướng Vận Hạn Tương Tác (Bản Mệnh, Đồng Hạn, Đại Hạn, Lưu Niên, Lưu Nguyệt, Lưu Nhật, Lưu Thời),
 * Tam Phương Tứ Chính + Giáp Cung & Vô Chính Diệu Mượn Sao Xung Chiếu.
 * Ported & localized in Vietnamese from lib/ziwei/yunxian-context.ts.
 */
import { DIA_CHI, THIEN_CAN } from './solarTime.js';
import {
  getSiHuaByStem,
  getDaXianSiHua,
  getLiuNianSiHua,
  getLiuYueSiHua,
  getLiuRiSiHua,
  getLiuShiSiHua,
} from './sihua.js';
import { buildShierShenForChart } from './shierShen.js';

export const YUNXIAN_MODES = [
  { id: 'mingpan', label: 'Bản Mệnh', shortLabel: 'Bản Mệnh' },
  { id: 'daxian', label: 'Đại Hạn (10 Năm)', shortLabel: 'Đại Hạn' },
  { id: 'liunian', label: 'Lưu Niên (1 Năm)', shortLabel: 'Lưu Niên' },
  { id: 'liuyue', label: 'Lưu Nguyệt (Tháng)', shortLabel: 'Lưu Nguyệt' },
  { id: 'liuri', label: 'Lưu Nhật (Ngày)', shortLabel: 'Lưu Nhật' },
  { id: 'liushi', label: 'Lưu Thời (Giờ)', shortLabel: 'Lưu Thời' },
];

export const CHILDHOOD_DAXIAN_INDEX = -2;

/**
 * Khẩu quyết Đồng Hạn (trước khi vào Đại Hạn đầu tiên, tuổi mụ 1–5):
 * "Nhất Mệnh, Nhị Tài, Tam Tật, Tứ Phối, Ngũ Phúc"
 * Trong hệ trục Địa Chi của lá số:
 * - 1 tuổi: Cung Mệnh (+0)
 * - 2 tuổi: Cung Tài Bạch (-4 hay +8)
 * - 3 tuổi: Cung Tật Ách (-5 hay +7)
 * - 4 tuổi: Cung Phu Thê (-2 hay +10)
 * - 5 tuổi: Cung Phúc Đức (+2)
 */
export const CHILDHOOD_MING_OFFSET = {
  1: 0,
  2: -4,
  3: -5,
  4: -2,
  5: 2,
};

export const CHILDHOOD_PALACE_LABELS = {
  1: 'Mệnh',
  2: 'Tài Bạch',
  3: 'Tật Ách',
  4: 'Phu Thê',
  5: 'Phúc Đức',
};

export const TEN_CUNG_CHUC_NANG = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch',
  'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách',
  'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
];

export const TEN_DAI_HAN_CHUC_NANG = [
  'ĐH.Mệnh', 'ĐH.Phụ', 'ĐH.Phúc', 'ĐH.Điền',
  'ĐH.Quan', 'ĐH.Nô', 'ĐH.Di', 'ĐH.Tật',
  'ĐH.Tài', 'ĐH.Tử', 'ĐH.Phối', 'ĐH.Huynh',
];

export const TEN_LUU_NIEN_CHUC_NANG = [
  'LN.Mệnh', 'LN.Phụ', 'LN.Phúc', 'LN.Điền',
  'LN.Quan', 'LN.Nô', 'LN.Di', 'LN.Tật',
  'LN.Tài', 'LN.Tử', 'LN.Phối', 'LN.Huynh',
];

export const TEN_LUU_NGUYET_CHUC_NANG = [
  'LNg.Mệnh', 'LNg.Phụ', 'LNg.Phúc', 'LNg.Điền',
  'LNg.Quan', 'LNg.Nô', 'LNg.Di', 'LNg.Tật',
  'LNg.Tài', 'LNg.Tử', 'LNg.Phối', 'LNg.Huynh',
];

function cleanPalaceName(name) {
  return String(name || '').replace(/\s*<THÂN>/g, '').trim();
}

function getMenhBranchFromChart(chart) {
  const palates = chart?.palates || [];
  const menhPalace = palates.find(p => p.isMenh || cleanPalaceName(p.chucNang) === 'Mệnh');
  if (menhPalace) return menhPalace.chiIndex;
  const idx = DIA_CHI.indexOf(chart?.menhCung);
  return idx >= 0 ? idx : 0;
}

/**
 * Tra cứu Đại Hạn (hoặc Đồng Hạn) tương ứng với tuổi mụ (`age`).
 */
export function getActiveDaXianForAge(chart, age) {
  const palates = chart?.palates || [];
  if (!palates.length || !Number.isFinite(age)) return null;
  const safeAge = Math.trunc(age);
  const cucNum = chart?.cucNumber || Math.min(...palates.map(p => p.daiHan || 2));

  if (safeAge >= 1 && safeAge < cucNum) {
    const menhBranch = getMenhBranchFromChart(chart);
    const offset = CHILDHOOD_MING_OFFSET[safeAge] ?? 0;
    const branch = ((menhBranch + offset) % 12 + 12) % 12;
    const targetPalace = palates.find(p => p.chiIndex === branch) || palates[0];
    return {
      isChildhood: true,
      age: safeAge,
      startAge: safeAge,
      endAge: safeAge,
      label: `Đồng Hạn (${safeAge} tuổi · Cung ${CHILDHOOD_PALACE_LABELS[safeAge] || cleanPalaceName(targetPalace.chucNang)})`,
      chiIndex: targetPalace.chiIndex,
      chiName: targetPalace.chiName,
      canName: targetPalace.canName,
      natalChucNang: cleanPalaceName(targetPalace.chucNang),
      palace: targetPalace,
    };
  }

  const found = palates.find(p => safeAge >= p.daiHan && safeAge <= p.daiHan + 9);
  if (!found) return null;
  return {
    isChildhood: false,
    age: safeAge,
    startAge: found.daiHan,
    endAge: found.daiHan + 9,
    label: `Đại Hạn ${found.daiHan}–${found.daiHan + 9} tuổi (${found.canName} ${found.chiName} · ${cleanPalaceName(found.chucNang)})`,
    chiIndex: found.chiIndex,
    chiName: found.chiName,
    canName: found.canName,
    natalChucNang: cleanPalaceName(found.chucNang),
    palace: found,
  };
}

/**
 * Danh sách tất cả các kỳ Đại Hạn (sắp xếp theo độ tuổi tăng dần) để hiển thị thanh chọn Đại Hạn.
 */
export function getChartDaXianList(chart) {
  const palates = chart?.palates || [];
  return [...palates]
    .sort((a, b) => (a.daiHan || 0) - (b.daiHan || 0))
    .map((p, idx) => ({
      index: idx,
      chiIndex: p.chiIndex,
      chiName: p.chiName,
      canName: p.canName,
      natalChucNang: cleanPalaceName(p.chucNang),
      startAge: p.daiHan,
      endAge: p.daiHan + 9,
      label: `${p.daiHan}–${p.daiHan + 9}t (${p.chiName})`,
      fullLabel: `Đại Hạn ${p.daiHan}–${p.daiHan + 9} tuổi · Cung ${cleanPalaceName(p.chucNang)} (${p.canName} ${p.chiName})`,
    }));
}

/**
 * Xoay 12 cung chức năng Đại Hạn lấy `daXianChiIndex` làm ĐH.Mệnh (chạy thuận chiều Địa Chi).
 */
export function getDaXianPalaceNames(daXianChiIndex) {
  if (daXianChiIndex === undefined || daXianChiIndex === null || daXianChiIndex < 0) return {};
  const base = ((Math.trunc(daXianChiIndex) % 12) + 12) % 12;
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[(base + i) % 12] = TEN_DAI_HAN_CHUC_NANG[i];
  }
  return map;
}

/**
 * Xoay 12 cung chức năng Lưu Niên lấy `luuNienChiIndex` làm LN.Mệnh (chạy thuận chiều Địa Chi).
 */
export function getLuuNienPalaceNames(luuNienChiIndex) {
  if (luuNienChiIndex === undefined || luuNienChiIndex === null || luuNienChiIndex < 0) return {};
  const base = ((Math.trunc(luuNienChiIndex) % 12) + 12) % 12;
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[(base + i) % 12] = TEN_LUU_NIEN_CHUC_NANG[i];
  }
  return map;
}

/**
 * Xoay 12 cung chức năng Lưu Nguyệt lấy `luuNguyetChiIndex` làm LNg.Mệnh.
 */
export function getLuuNguyetPalaceNames(luuNguyetChiIndex) {
  if (luuNguyetChiIndex === undefined || luuNguyetChiIndex === null || luuNguyetChiIndex < 0) return {};
  const base = ((Math.trunc(luuNguyetChiIndex) % 12) + 12) % 12;
  const map = {};
  for (let i = 0; i < 12; i++) {
    map[(base + i) % 12] = TEN_LUU_NGUYET_CHUC_NANG[i];
  }
  return map;
}

/**
 * Tính Tam Phương Tứ Chính (Bản Cung, Xung Chiếu, Tam Hợp) và Giáp Cung cho một cung Địa Chi bất kỳ (0..11).
 */
export function getTamPhuongTuChinh(chiIndex) {
  const c = ((Math.trunc(chiIndex) % 12) + 12) % 12;
  const xungChieu = (c + 6) % 12;
  const tamHop = [(c + 4) % 12, (c + 8) % 12];
  const giapCung = [(c + 11) % 12, (c + 1) % 12];
  return {
    target: c,
    targetName: DIA_CHI[c],
    xungChieu,
    xungChieuName: DIA_CHI[xungChieu],
    tamHop,
    tamHopNames: tamHop.map(i => DIA_CHI[i]),
    giapCung,
    giapCungNames: giapCung.map(i => DIA_CHI[i]),
    allSanFangBranches: [c, tamHop[0], tamHop[1], xungChieu],
  };
}

/**
 * Tính thông tin Vô Chính Diệu & Mượn Sao Xung Chiếu cho một cung cụ thể.
 * Khi cung không có Chính Tinh (`chinhTinh.length === 0`), mượn toàn bộ Chính Tinh của cung Xung Chiếu
 * (tỷ lệ lực chiếu khoảng 70%), đồng thời xét trạng thái Đắc Tuần / Đắc Triệt.
 */
export function getBorrowedStarsForPalace(chart, chiIndex) {
  const palates = chart?.palates || [];
  const c = ((Math.trunc(chiIndex) % 12) + 12) % 12;
  const palace = palates.find(p => p.chiIndex === c);
  if (!palace) return null;

  const isVoChinhDieu = !Array.isArray(palace.chinhTinh) || palace.chinhTinh.length === 0;
  const oppIndex = (c + 6) % 12;
  const oppPalace = palates.find(p => p.chiIndex === oppIndex) || null;
  const borrowedChinhTinh = isVoChinhDieu && oppPalace ? [...(oppPalace.chinhTinh || [])] : [];
  const borrowedMajorNames = borrowedChinhTinh.map(s => String(s).split('(')[0].trim());

  const hasTuan = Boolean(palace.isTuan);
  const hasTriet = Boolean(palace.isTriet);
  let tuanTrietNote = null;
  if (isVoChinhDieu) {
    if (hasTuan && hasTriet) {
      tuanTrietNote = 'Vô Chính Diệu đắc Tuần lẫn Triệt (Tuần Triệt đương đầu, thiếu niên tân khổ, trung vận phát đạt bền vững)';
    } else if (hasTriet) {
      tuanTrietNote = 'Vô Chính Diệu đắc Triệt Không (Triệt đáo kim cung / Không cung đắc Triệt, hóa giải xung sát, biến hư thành thực)';
    } else if (hasTuan) {
      tuanTrietNote = 'Vô Chính Diệu đắc Tuần Không (Tuần trung Không Vong giữ khí, trung hậu vận ổn định)';
    } else {
      tuanTrietNote = `Vô Chính Diệu mượn chính tinh cung ${cleanPalaceName(oppPalace?.chucNang)} (${oppPalace?.chiName}) xung chiếu (lực chiếu ~70%)`;
    }
  }

  return {
    chiIndex: c,
    chiName: palace.chiName,
    chucNang: cleanPalaceName(palace.chucNang),
    isVoChinhDieu,
    effectiveChinhTinh: isVoChinhDieu ? borrowedChinhTinh : [...(palace.chinhTinh || [])],
    borrowedChinhTinh,
    borrowedMajorNames,
    borrowedFromChiIndex: isVoChinhDieu ? oppIndex : null,
    borrowedFromChiName: isVoChinhDieu ? oppPalace?.chiName : null,
    borrowedFromChucNang: isVoChinhDieu ? cleanPalaceName(oppPalace?.chucNang) : null,
    strengthRatio: isVoChinhDieu ? 0.7 : 1.0,
    hasTuan,
    hasTriet,
    tuanTrietNote,
  };
}

/**
 * Xây dựng lớp phủ Vận Hạn Tương Tác (`buildYunxianOverlay`) cho Bản Mệnh, Đại Hạn, Lưu Niên, Lưu Nguyệt, Lưu Nhật, Lưu Thời.
 */
export function buildYunxianOverlay(chart, options = {}) {
  const palates = chart?.palates || [];
  if (!palates.length) return null;

  const mode = options.mode || 'mingpan';
  const schoolConfig = options.schoolConfig || {};
  const birthYear = options.birthYear || null;
  const viewYear = options.viewYear || chart?.viewYear || null;
  const age = options.age ?? chart?.tuoiAm ?? (birthYear && viewYear ? viewYear - birthYear + 1 : null);

  // 1. Xác định Đại Hạn đang chọn
  let activeDaXian = null;
  if (options.daXianChiIndex !== undefined && options.daXianChiIndex !== null) {
    const p = palates.find(pal => pal.chiIndex === options.daXianChiIndex);
    if (p) {
      activeDaXian = {
        isChildhood: false,
        startAge: p.daiHan,
        endAge: p.daiHan + 9,
        chiIndex: p.chiIndex,
        chiName: p.chiName,
        canName: p.canName,
        natalChucNang: cleanPalaceName(p.chucNang),
        label: `Đại Hạn ${p.daiHan}–${p.daiHan + 9} tuổi (${p.canName} ${p.chiName} · ${cleanPalaceName(p.chucNang)})`,
        palace: p,
      };
    }
  } else if (age !== null) {
    activeDaXian = getActiveDaXianForAge(chart, age);
  }

  const daXianPalaceMap = activeDaXian ? getDaXianPalaceNames(activeDaXian.chiIndex) : {};
  const daXianSiHua = activeDaXian ? getDaXianSiHua(chart, { chiIndex: activeDaXian.chiIndex }, schoolConfig) : null;

  // 2. Xác định Lưu Niên
  let liuNianSiHua = null;
  let luuNienChiIndex = null;
  if (viewYear !== null && Number.isFinite(viewYear)) {
    liuNianSiHua = getLiuNianSiHua(viewYear, schoolConfig);
    luuNienChiIndex = liuNianSiHua.branchIndex;
  } else if (chart?.viewYearStr) {
    const parts = String(chart.viewYearStr).trim().split(/\s+/);
    const stemIdx = THIEN_CAN.indexOf(parts[0]);
    const branchIdx = DIA_CHI.indexOf(parts[1]);
    if (stemIdx >= 0 && branchIdx >= 0) {
      liuNianSiHua = {
        year: viewYear,
        stemIndex: stemIdx,
        stemName: parts[0],
        branchIndex: branchIdx,
        branchName: parts[1],
        transforms: getSiHuaByStem(stemIdx, schoolConfig),
      };
      luuNienChiIndex = branchIdx;
    }
  }
  const luuNienPalaceMap = luuNienChiIndex !== null ? getLuuNienPalaceNames(luuNienChiIndex) : {};

  // 3. Xác định Lưu Nguyệt (khởi từ cung Lưu Niên Đẩu Quân hoặc theo Địa Chi tháng)
  const lunarMonth = options.lunarMonth || 1;
  let liuYueSiHua = null;
  let luuNguyetPalaceMap = {};
  if (liuNianSiHua) {
    liuYueSiHua = getLiuYueSiHua(liuNianSiHua.stemIndex, lunarMonth, options, schoolConfig);
    luuNguyetPalaceMap = getLuuNguyetPalaceNames(liuYueSiHua.branchIndex);
  }

  // 4. Lưu Nhật & Lưu Thời
  const lunarDay = options.lunarDay || 1;
  const hourIndex = options.hourIndex ?? 0;
  const liuRiSiHua = viewYear
    ? getLiuRiSiHua(viewYear, lunarMonth, lunarDay, Boolean(options.isLeapMonth), schoolConfig)
    : null;
  const liuShiSiHua = liuRiSiHua
    ? getLiuShiSiHua(liuRiSiHua.stemIndex, hourIndex, schoolConfig)
    : null;

  // 5. Vòng 12 Thần theo nhánh vận hạn đang kích hoạt
  let activeBranchIndex = null;
  if (mode === 'daxian' && activeDaXian) activeBranchIndex = activeDaXian.chiIndex;
  else if (mode === 'liunian' && luuNienChiIndex !== null) activeBranchIndex = luuNienChiIndex;
  else if (mode === 'liuyue' && liuYueSiHua) activeBranchIndex = liuYueSiHua.branchIndex;
  else if (mode === 'liushi') activeBranchIndex = hourIndex;

  const shierShen = buildShierShenForChart(chart, { activeBranchIndex });

  return {
    mode,
    age,
    viewYear,
    lunarMonth,
    lunarDay,
    hourIndex,
    activeDaXian,
    daXianPalaceMap,
    luuNienPalaceMap,
    luuNguyetPalaceMap,
    sihuaLayers: {
      daXian: daXianSiHua,
      liuNian: liuNianSiHua,
      liuYue: liuYueSiHua,
      liuRi: liuRiSiHua,
      liuShi: liuShiSiHua,
    },
    shierShen,
  };
}
