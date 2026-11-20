/**
 * Huyền Không Phi Tinh Engine (Thuần JS, không phụ thuộc DOM).
 * Hỗ trợ: Hạ quái, Thế quái (Thẩm Thị Huyền Không Học), Lưu Niên, Lưu Nguyệt (Tử Bạch Quyết),
 * Thần Sát lưu niên (Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc), Thành Môn Quyết,
 * Cách cục toàn bàn và đối chiếu Bát Trạch theo năm sinh.
 */

import { CUU_CUNG_META, CUU_TINH_INFO, getStarPairInfo } from '../data/huyenKhong81.js';

export const LUONG_THIEN_XICH = [5, 6, 7, 8, 9, 1, 2, 3, 4];

export const LUOI_CUU_CUNG = [
  [4, 9, 2], // Đông Nam | Nam   | Tây Nam
  [3, 5, 7], // Đông     | Trung | Tây
  [8, 1, 6], // Đông Bắc | Bắc   | Tây Bắc
];

export const OCTAGON_PALACE_RING = [1, 8, 3, 4, 9, 2, 7, 6];

export const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

/**
 * Thẩm Thị Huyền Không Khởi Tinh Thế Quái Ca Quyết (phủ đủ 24 sơn):
 * - Tham Lang (1): Tý, Quý, Giáp, Thân
 * - Cự Môn    (2): Nhâm, Mão, Ất, Mùi, Khôn
 * - Vũ Khúc   (6): Càn, Hợi, Thìn, Tốn, Tỵ, Tuất
 * - Phá Quân  (7): Tân, Dậu, Sửu, Cấn, Bính
 * - Hữu Bật   (9): Dần, Ngọ, Canh, Đinh
 */
export const THE_QUAI_MAP = {
  'Tý': 1, 'Quý': 1, 'Giáp': 1, 'Thân': 1,
  'Nhâm': 2, 'Mão': 2, 'Ất': 2, 'Mùi': 2, 'Khôn': 2,
  'Càn': 6, 'Hợi': 6, 'Thìn': 6, 'Tốn': 6, 'Tỵ': 6, 'Tuất': 6,
  'Tân': 7, 'Dậu': 7, 'Sửu': 7, 'Cấn': 7, 'Bính': 7,
  'Dần': 9, 'Ngọ': 9, 'Canh': 9, 'Đinh': 9,
};

const RAW_SON_24 = [
  ['Tý', 1, 'Thiên', -1],
  ['Quý', 1, 'Nhân', -1],
  ['Sửu', 8, 'Địa', -1],
  ['Cấn', 8, 'Thiên', +1],
  ['Dần', 8, 'Nhân', +1],
  ['Giáp', 3, 'Địa', +1],
  ['Mão', 3, 'Thiên', -1],
  ['Ất', 3, 'Nhân', -1],
  ['Thìn', 4, 'Địa', -1],
  ['Tốn', 4, 'Thiên', +1],
  ['Tỵ', 4, 'Nhân', +1],
  ['Bính', 9, 'Địa', +1],
  ['Ngọ', 9, 'Thiên', -1],
  ['Đinh', 9, 'Nhân', -1],
  ['Mùi', 2, 'Địa', -1],
  ['Khôn', 2, 'Thiên', +1],
  ['Thân', 2, 'Nhân', +1],
  ['Canh', 7, 'Địa', +1],
  ['Dậu', 7, 'Thiên', -1],
  ['Tân', 7, 'Nhân', -1],
  ['Tuất', 6, 'Địa', -1],
  ['Càn', 6, 'Thiên', +1],
  ['Hợi', 6, 'Nhân', +1],
  ['Nhâm', 1, 'Địa', +1],
];

export const SON_24 = RAW_SON_24.map(([ten, cung, nguyenLong, amDuong], index) => {
  const centerDeg = index * 15;
  const startDeg = (centerDeg - 7.5 + 360) % 360;
  const endDeg = (centerDeg + 7.5) % 360;
  const meta = CUU_CUNG_META[cung];
  return {
    index,
    ten,
    cung,
    trigram: meta?.trigram || '',
    directionName: meta?.name || '',
    nguyenLong,
    amDuong,
    polarityLabel: amDuong > 0 ? 'Dương' : 'Âm',
    centerDeg,
    startDeg,
    endDeg,
    theQuaiStar: THE_QUAI_MAP[ten],
  };
});

export const SON_24_BY_NAME = Object.fromEntries(SON_24.map((s) => [s.ten, s]));

export const PERIOD_RANGES = [
  { van: 1, label: 'Vận 1 (1864–1883 · Thượng Nguyên)', start: 1864, end: 1883 },
  { van: 2, label: 'Vận 2 (1884–1903 · Thượng Nguyên)', start: 1884, end: 1903 },
  { van: 3, label: 'Vận 3 (1904–1923 · Thượng Nguyên)', start: 1904, end: 1923 },
  { van: 4, label: 'Vận 4 (1924–1943 · Trung Nguyên)', start: 1924, end: 1943 },
  { van: 5, label: 'Vận 5 (1944–1963 · Trung Nguyên)', start: 1944, end: 1963 },
  { van: 6, label: 'Vận 6 (1964–1983 · Trung Nguyên)', start: 1964, end: 1983 },
  { van: 7, label: 'Vận 7 (1984–2003 · Hạ Nguyên)', start: 1984, end: 2003 },
  { van: 8, label: 'Vận 8 (2004–2023 · Hạ Nguyên)', start: 2004, end: 2023 },
  { van: 9, label: 'Vận 9 (2024–2043 · Hạ Nguyên)', start: 2024, end: 2043 },
];

export const ELEMENT_CLASS_MAP = {
  Thủy: 'thuy',
  Thổ: 'tho',
  Mộc: 'moc',
  Kim: 'kim',
  Hỏa: 'hoa',
};

export function normalizeDegree(deg) {
  const num = Number(deg);
  if (!Number.isFinite(num)) return 0;
  return ((num % 360) + 360) % 360;
}

export function getCanChiYear(year) {
  const y = Math.trunc(Number(year) || 2024);
  const canIndex = ((y - 4) % 10 + 10) % 10;
  const chiIndex = ((y - 4) % 12 + 12) % 12;
  return {
    year: y,
    canIndex,
    chiIndex,
    canName: THIEN_CAN[canIndex],
    chiName: DIA_CHI[chiIndex],
    label: `${THIEN_CAN[canIndex]} ${DIA_CHI[chiIndex]}`,
  };
}

/**
 * Quy đổi năm dương lịch sang Vận (1–9). VD: 2024–2043 là Vận 9.
 */
export function yearToPeriod(nam) {
  const y = Math.trunc(Number(nam) || 2024);
  const idx = Math.floor((y - 1864) / 20);
  return (((idx % 9) + 9) % 9) + 1;
}

/**
 * Từ độ số la bàn (0–360) xác định Sơn Hướng, Sơn Tọa và độ kiêm lệch.
 */
export function degreeToMountain(doHuong) {
  const deg = normalizeDegree(doHuong);
  const idxHuong = Math.floor(((deg + 7.5) % 360) / 15) % 24;
  const idxToa = (idxHuong + 12) % 24;
  const huong = SON_24[idxHuong];
  const toa = SON_24[idxToa];

  const signedOffsetRaw = ((deg - huong.centerDeg + 540) % 360) - 180;
  const signedOffset = Math.round(signedOffsetRaw * 100) / 100;
  const absOffset = Math.abs(signedOffset);
  const distanceToBoundary = Math.round(Math.max(0, 7.5 - absOffset) * 100) / 100;

  const adjacentIdxHuong = signedOffset >= 0 ? (idxHuong + 1) % 24 : (idxHuong + 23) % 24;
  const adjacentIdxToa = (adjacentIdxHuong + 12) % 24;
  const adjacentHuong = SON_24[adjacentIdxHuong];
  const adjacentToa = SON_24[adjacentIdxToa];

  const isSameGuaAdjacent = huong.cung === adjacentHuong.cung;
  const isSameYinYangAdjacent = huong.amDuong === adjacentHuong.amDuong;
  const isKiemHuong = absOffset >= 4.5;

  let kongWangStatus = 'none';
  let statusLabel = 'Chính hướng';
  let statusNote = 'Độ số nằm gọn trong tâm sơn, lập Hạ quái chuẩn.';

  if (absOffset >= 6.0 && !isSameGuaAdjacent) {
    kongWangStatus = 'dai_khong_vong';
    statusLabel = 'Đại Không Vong (Xuất Quái)';
    statusNote = `Sát ranh giới quái ${huong.trigram} / ${adjacentHuong.trigram} (cách ranh ${distanceToBoundary}°). Cần đo lại la bàn thực tế kỹ lưỡng và tham khảo Thế quái.`;
  } else if (absOffset >= 6.0) {
    kongWangStatus = 'tieu_khong_vong';
    statusLabel = 'Tiểu Không Vong (Kiêm sâu)';
    statusNote = `Nằm sát ranh sơn ${huong.ten} / ${adjacentHuong.ten} (cách ranh ${distanceToBoundary}°). Nên kiểm tra cả tinh bàn Thế quái.`;
  } else if (isKiemHuong) {
    kongWangStatus = 'kiem_huong';
    statusLabel = `Kiêm hướng (${signedOffset >= 0 ? '+' : ''}${signedOffset}°)`;
    statusNote = `Lệch tâm ${absOffset}° về phía sơn ${adjacentHuong.ten} (${isSameYinYangAdjacent ? 'cùng Âm/Dương' : 'khác Âm/Dương'}). Khuyến nghị đối chiếu Thế quái.`;
  }

  return {
    degree: Math.round(deg * 100) / 100,
    toaDegree: Math.round(normalizeDegree(deg + 180) * 100) / 100,
    huong,
    toa,
    adjacentHuong,
    adjacentToa,
    signedOffset,
    absOffset,
    distanceToBoundary,
    isSameGuaAdjacent,
    isSameYinYangAdjacent,
    isKiemHuong,
    kongWangStatus,
    statusLabel,
    statusNote,
    recommendedMode: isKiemHuong ? 'the_quai' : 'ha_quai',
  };
}

/**
 * Xác định chiều bay thuận (+1) hoặc nghịch (-1) theo Lưỡng Phiến Âm Dương.
 */
export function getFlightDirection(sao, nguyenLong, amDuongSonNha) {
  if (sao === 5) return amDuongSonNha;
  if (sao === 1 || sao === 3 || sao === 7 || sao === 9) {
    return nguyenLong === 'Địa' ? +1 : -1;
  }
  return nguyenLong === 'Địa' ? -1 : +1;
}

/**
 * Rải 9 sao vào 9 cung theo quỹ đạo Lượng Thiên Xích.
 */
export function phiTinh(saoTrungCung, chieuBay) {
  const result = {};
  for (let i = 0; i < LUONG_THIEN_XICH.length; i++) {
    const cung = LUONG_THIEN_XICH[i];
    const star = ((((saoTrungCung - 1 + i * chieuBay) % 9) + 9) % 9) + 1;
    result[cung] = star;
  }
  return result;
}

/**
 * Tra sao Thế quái thay thế khi nhập trung cung (dựa theo cung gốc và Tam Nguyên Long).
 */
export function resolveTheQuaiStar(saoGoc, nguyenLong) {
  if (saoGoc === 5) {
    return {
      saoGoc: 5,
      saoThe: 5,
      sourceMountain: null,
      changed: false,
      note: 'Ngũ Hoàng nhập trung cung không thế quái.',
    };
  }
  const sourceMountain = SON_24.find((s) => s.cung === saoGoc && s.nguyenLong === nguyenLong) || null;
  const saoThe = sourceMountain ? THE_QUAI_MAP[sourceMountain.ten] : saoGoc;
  return {
    saoGoc,
    saoThe,
    sourceMountain,
    changed: saoThe !== saoGoc,
    note: sourceMountain
      ? saoThe !== saoGoc
        ? `Sơn ${sourceMountain.ten} (${nguyenLong} Nguyên Long) thế bằng sao ${saoThe}`
        : `Sơn ${sourceMountain.ten} (${nguyenLong} Nguyên Long) giữ nguyên sao ${saoThe}`
      : '',
  };
}

/**
 * Sao Lưu Niên nhập Trung cung (2024=3, 2025=2, 2026=1, 2027=9, 2028=8...).
 */
export function getAnnualCenterStar(year) {
  const y = Math.trunc(Number(year) || new Date().getFullYear());
  const mod = (((2027 - y) % 9) + 9) % 9;
  return mod === 0 ? 9 : mod;
}

export function getAnnualFlyingStars(year) {
  const centerStar = getAnnualCenterStar(year);
  return {
    year: Math.trunc(Number(year) || new Date().getFullYear()),
    canChi: getCanChiYear(year),
    centerStar,
    ban: phiTinh(centerStar, +1),
  };
}

/**
 * Sao Lưu Nguyệt nhập Trung cung theo Tử Bạch Quyết:
 * - Năm Tý Ngọ Mão Dậu -> tháng 1 khởi 8
 * - Năm Sửu Thìn Mùi Tuất -> tháng 1 khởi 5
 * - Năm Dần Tỵ Thân Hợi -> tháng 1 khởi 2
 * Mỗi tháng tiếp theo lùi 1 số (vẫn phi thuận trên Lạc Thư).
 */
export function getMonthlyCenterStar(year, lunarMonth = 1) {
  const y = Math.trunc(Number(year) || new Date().getFullYear());
  const month = Math.max(1, Math.min(12, Math.trunc(Number(lunarMonth) || 1)));
  const chiIndex = ((y - 4) % 12 + 12) % 12;
  const mod4 = chiIndex % 3;
  const startMonth1 = mod4 === 0 ? 8 : mod4 === 1 ? 5 : 2;
  return ((((startMonth1 - (month - 1) - 1) % 9) + 9) % 9) + 1;
}

export function getMonthlyFlyingStars(year, lunarMonth = 1) {
  const month = Math.max(1, Math.min(12, Math.trunc(Number(lunarMonth) || 1)));
  const monthBranch = DIA_CHI[(month + 1) % 12]; // Tháng 1 = Dần (idx 2)
  const centerStar = getMonthlyCenterStar(year, month);
  return {
    year: Math.trunc(Number(year) || new Date().getFullYear()),
    lunarMonth: month,
    monthBranch,
    centerStar,
    ban: phiTinh(centerStar, +1),
  };
}

/**
 * Tính các Thần Sát Lưu Niên: Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc.
 */
export function getAnnualAfflictions(year, annualBan) {
  const canChi = getCanChiYear(year);
  const { chiIndex, chiName } = canChi;
  const tuePhaChi = DIA_CHI[(chiIndex + 6) % 12];

  const thaiTueCung = SON_24_BY_NAME[chiName].cung;
  const tuePhaCung = SON_24_BY_NAME[tuePhaChi].cung;

  // Tam Sát theo Tam Hợp của Địa Chi năm
  const tamHopMod = chiIndex % 4;
  let tamSatList = [];
  let tamSatDirection = '';
  if (tamHopMod === 0) {
    // Thân - Tý - Thìn (Thủy cục) -> Tam Sát ở Nam (Tỵ Ngọ Mùi)
    tamSatDirection = 'Nam';
    tamSatList = [
      { label: 'Kiếp Sát', mountain: 'Tỵ', cung: SON_24_BY_NAME['Tỵ'].cung },
      { label: 'Tai Sát', mountain: 'Ngọ', cung: SON_24_BY_NAME['Ngọ'].cung },
      { label: 'Tuế Sát', mountain: 'Mùi', cung: SON_24_BY_NAME['Mùi'].cung },
    ];
  } else if (tamHopMod === 2) {
    // Dần - Ngọ - Tuất (Hỏa cục) -> Tam Sát ở Bắc (Hợi Tý Sửu)
    tamSatDirection = 'Bắc';
    tamSatList = [
      { label: 'Kiếp Sát', mountain: 'Hợi', cung: SON_24_BY_NAME['Hợi'].cung },
      { label: 'Tai Sát', mountain: 'Tý', cung: SON_24_BY_NAME['Tý'].cung },
      { label: 'Tuế Sát', mountain: 'Sửu', cung: SON_24_BY_NAME['Sửu'].cung },
    ];
  } else if (tamHopMod === 1) {
    // Tỵ - Dậu - Sửu (Kim cục) -> Tam Sát ở Đông (Dần Mão Thìn)
    tamSatDirection = 'Đông';
    tamSatList = [
      { label: 'Kiếp Sát', mountain: 'Dần', cung: SON_24_BY_NAME['Dần'].cung },
      { label: 'Tai Sát', mountain: 'Mão', cung: SON_24_BY_NAME['Mão'].cung },
      { label: 'Tuế Sát', mountain: 'Thìn', cung: SON_24_BY_NAME['Thìn'].cung },
    ];
  } else {
    // Hợi - Mão - Mùi (Mộc cục) -> Tam Sát ở Tây (Thân Dậu Tuất)
    tamSatDirection = 'Tây';
    tamSatList = [
      { label: 'Kiếp Sát', mountain: 'Thân', cung: SON_24_BY_NAME['Thân'].cung },
      { label: 'Tai Sát', mountain: 'Dậu', cung: SON_24_BY_NAME['Dậu'].cung },
      { label: 'Tuế Sát', mountain: 'Tuất', cung: SON_24_BY_NAME['Tuất'].cung },
    ];
  }

  let nguHoangCung = null;
  let nhiHacCung = null;
  for (let c = 1; c <= 9; c++) {
    if (annualBan[c] === 5) nguHoangCung = c;
    if (annualBan[c] === 2) nhiHacCung = c;
  }

  const byPalace = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, []]));
  byPalace[thaiTueCung].push({
    type: 'thai_tue',
    label: `Thái Tuế · ${chiName}`,
    shortLabel: `Thái Tuế (${chiName})`,
    severity: 'warn',
  });
  byPalace[tuePhaCung].push({
    type: 'tue_pha',
    label: `Tuế Phá · ${tuePhaChi}`,
    shortLabel: `Tuế Phá (${tuePhaChi})`,
    severity: 'hung',
  });
  for (const item of tamSatList) {
    byPalace[item.cung].push({
      type: 'tam_sat',
      label: `Tam Sát (${item.label} · ${item.mountain})`,
      shortLabel: `Tam Sát · ${item.mountain}`,
      severity: 'hung',
    });
  }
  if (nguHoangCung) {
    byPalace[nguHoangCung].push({
      type: 'ngu_hoang',
      label: 'Ngũ Hoàng Đại Sát (LN 5)',
      shortLabel: 'Ngũ Hoàng (LN)',
      severity: 'hung',
    });
  }
  if (nhiHacCung) {
    byPalace[nhiHacCung].push({
      type: 'nhi_hac',
      label: 'Nhị Hắc Bệnh Phù (LN 2)',
      shortLabel: 'Nhị Hắc (LN)',
      severity: 'warn',
    });
  }

  return {
    canChi,
    thaiTue: { mountain: chiName, cung: thaiTueCung },
    tuePha: { mountain: tuePhaChi, cung: tuePhaCung },
    tamSatDirection,
    tamSatList,
    nguHoangCung,
    nhiHacCung,
    byPalace,
  };
}

/**
 * Đánh giá Sinh/Vượng/Tiến/Thoái/Tử của một sao trong Vận hiện tại.
 */
export function getStarQiState(star, van) {
  const sinh = (van % 9) + 1;
  const tien = ((van + 1) % 9) + 1;
  const thoai = ((van - 2 + 9) % 9) + 1;

  if (star === van) return { code: 'vuong', label: 'Đương Vận', tone: 'cat' };
  if (star === sinh) return { code: 'sinh', label: 'Sinh Khí', tone: 'cat' };
  if (star === tien) return { code: 'tien', label: 'Tiến Khí', tone: 'binh' };
  if (star === thoai) return { code: 'thoai', label: 'Thoái Khí', tone: 'binh' };
  return { code: 'tu', label: 'Thất Vận', tone: 'hung' };
}

/**
 * Kiểm tra Thành Môn Quyết tại 2 cung liền kề cung Hướng.
 */
export function evaluateThanhMon({ van, vanBan, huongBan, huongMountain }) {
  const cungH = huongMountain.cung;
  const idx = OCTAGON_PALACE_RING.indexOf(cungH);
  if (idx === -1) return [];

  const leftCung = OCTAGON_PALACE_RING[(idx + 7) % 8];
  const rightCung = OCTAGON_PALACE_RING[(idx + 1) % 8];
  const sinhStar = (van % 9) + 1;

  return [leftCung, rightCung].map((adjCung) => {
    const saoAdj = vanBan[adjCung];
    const dirAdj = getFlightDirection(saoAdj, huongMountain.nguyenLong, huongMountain.amDuong);
    const phiBan = phiTinh(saoAdj, dirAdj);
    const hitsFacing = phiBan[cungH] === van;
    const huongStarAtAdj = huongBan[adjCung];
    const isUsable = hitsFacing && (huongStarAtAdj === van || huongStarAtAdj === sinhStar);
    return {
      cung: adjCung,
      palaceName: CUU_CUNG_META[adjCung].name,
      hitsFacing,
      isUsable,
      label: isUsable
        ? 'Chính Thành Môn hữu dụng'
        : hitsFacing
          ? 'Thành Môn (cần xét sao Hướng)'
          : null,
    };
  }).filter((item) => Boolean(item.label));
}

/**
 * Phát hiện các cách cục toàn bàn (Vượng Sơn Vượng Hướng, Thượng Sơn Hạ Thủy, Song Tinh, Hợp Thập, Tam Ban Quái, Phục/Phản Ngâm, Thành Môn).
 */
export function detectChartPatterns({ van, vanBan, sonBan, huongBan, huong, toa, thanhMonList }) {
  const patterns = [];
  const cungH = huong.cung;
  const cungT = toa.cung;

  const isVuongSon = sonBan[cungT] === van;
  const isVuongHuong = huongBan[cungH] === van;
  const sonTaiHuong = sonBan[cungH] === van;
  const huongTaiToa = huongBan[cungT] === van;

  if (isVuongSon && isVuongHuong) {
    patterns.push({
      id: 'vuong_son_vuong_huong',
      name: 'Vượng Sơn Vượng Hướng',
      tone: 'cat',
      summary: `Sơn tinh ${van} đáo Tọa (${CUU_CUNG_META[cungT].name}) và Hướng tinh ${van} đáo Hướng (${CUU_CUNG_META[cungH].name}) — cách cục đại cát lợi cả nhân đinh lẫn tài lộc.`,
    });
  } else if (sonTaiHuong && huongTaiToa) {
    patterns.push({
      id: 'thuong_son_ha_thuy',
      name: 'Thượng Sơn Hạ Thủy (Đảo Sơn Đảo Hướng)',
      tone: 'hung',
      summary: `Sơn tinh ${van} lạc ra Hướng và Hướng tinh ${van} lạc về Tọa. Cần địa thế phía sau thoáng/có thủy khí và phía trước có điểm tựa cao hoặc kích hoạt Thành Môn.`,
    });
  } else if (sonTaiHuong && isVuongHuong) {
    patterns.push({
      id: 'song_tinh_dao_huong',
      name: 'Song Tinh Đáo Hướng',
      tone: 'binh',
      summary: `Cả Sơn tinh ${van} và Hướng tinh ${van} cùng hội tụ tại cung Hướng (${CUU_CUNG_META[cungH].name}). Đắc tài lộc phía trước nhưng cần giữ hậu tọa yên ổn hoặc có điểm tựa nhân đinh.`,
    });
  } else if (isVuongSon && huongTaiToa) {
    patterns.push({
      id: 'song_tinh_dao_toa',
      name: 'Song Tinh Đáo Tọa',
      tone: 'binh',
      summary: `Cả Sơn tinh ${van} và Hướng tinh ${van} cùng tụ tại cung Tọa (${CUU_CUNG_META[cungT].name}). Vượng nhân đinh, gia đạo ấm êm nhưng cần mở minh đường hoặc dùng thủy khí sau/bên để kích tài.`,
    });
  }

  // Hợp Thập toàn bàn
  const sonVanHopThap = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => sonBan[c] + vanBan[c] === 10);
  const huongVanHopThap = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => huongBan[c] + vanBan[c] === 10);
  if (sonVanHopThap) {
    patterns.push({
      id: 'son_van_hop_thap',
      name: 'Sơn – Vận Hợp Thập Toàn Bàn',
      tone: 'cat',
      summary: 'Mọi cung đều có tổng Sơn tinh + Vận tinh = 10, khí trường nhân đinh và sức khỏe giao thông thông suốt.',
    });
  }
  if (huongVanHopThap) {
    patterns.push({
      id: 'huong_van_hop_thap',
      name: 'Hướng – Vận Hợp Thập Toàn Bàn',
      tone: 'cat',
      summary: 'Mọi cung đều có tổng Hướng tinh + Vận tinh = 10, giúp tài vận và công việc luân chuyển thuận lợi khắp 9 cung.',
    });
  }

  // Tam Ban Quái
  const phuMauGroups = new Set(['1-4-7', '2-5-8', '3-6-9']);
  const isPhuMauTamBan = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => {
    const sorted = [sonBan[c], vanBan[c], huongBan[c]].sort((a, b) => a - b).join('-');
    return phuMauGroups.has(sorted);
  });
  if (isPhuMauTamBan) {
    patterns.push({
      id: 'phu_mau_tam_ban',
      name: 'Phụ Mẫu Tam Ban Quái',
      tone: 'cat',
      summary: 'Cả 9 cung đều quy tụ 3 bộ (1-4-7 / 2-5-8 / 3-6-9), thông tam nguyên khí, hóa giải được nhiều tiểu sát cục bộ.',
    });
  }

  const isLienChauTamBan = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => {
    const [a, b, d] = [sonBan[c], vanBan[c], huongBan[c]].sort((x, y) => x - y);
    return (b === a + 1 && d === b + 1) || (a === 1 && b === 2 && d === 9) || (a === 1 && b === 8 && d === 9);
  });
  if (isLienChauTamBan) {
    patterns.push({
      id: 'lien_chau_tam_ban',
      name: 'Liên Châu Tam Ban Quái',
      tone: 'cat',
      summary: 'Mỗi cung đều gồm 3 số liên tiếp nhau, chủ vận khí thông suốt, quý nhân hỗ trợ vượt khó.',
    });
  }

  // Phục Ngâm / Phản Ngâm
  const isSonPhucNgam = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => sonBan[c] === c);
  const isHuongPhucNgam = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => huongBan[c] === c);
  const isSonPhanNgam = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => sonBan[c] + c === 10);
  const isHuongPhanNgam = Array.from({ length: 9 }, (_, i) => i + 1).every((c) => huongBan[c] + c === 10);

  if (isSonPhucNgam || isHuongPhucNgam) {
    patterns.push({
      id: 'phuc_ngam',
      name: `Phục Ngâm (${isSonPhucNgam && isHuongPhucNgam ? 'Sơn & Hướng' : isSonPhucNgam ? 'Sơn tinh' : 'Hướng tinh'})`,
      tone: 'hung',
      summary: 'Các sao trùng về đúng cung nguyên thủy Lạc Thư — khí trường dễ trì trệ, lặp lại bế tắc cũ nếu thiếu kích hoạt.',
    });
  }
  if (isSonPhanNgam || isHuongPhanNgam) {
    patterns.push({
      id: 'phan_ngam',
      name: `Phản Ngâm (${isSonPhanNgam && isHuongPhanNgam ? 'Sơn & Hướng' : isSonPhanNgam ? 'Sơn tinh' : 'Hướng tinh'})`,
      tone: 'hung',
      summary: 'Các sao đối xung tổng 10 với cung nguyên thủy — biến động mạnh, cần giữ ổn định nhân sự và tài chính.',
    });
  }

  // Thành Môn
  for (const tm of thanhMonList) {
    if (tm.isUsable) {
      patterns.push({
        id: `thanh_mon_${tm.cung}`,
        name: `Chính Thành Môn tại ${tm.palaceName}`,
        tone: 'cat',
        summary: `Cung ${tm.palaceName} liền kề Hướng đáp ứng phép Thành Môn Quyết và có Hướng tinh ${huongBan[tm.cung]} sinh/vượng — rất tốt để mở cổng hoặc đón khí phụ.`,
      });
    }
  }

  return patterns;
}

function reduceToSingleDigit(num) {
  let n = Math.abs(Math.trunc(Number(num) || 0));
  while (n > 9) {
    let sum = 0;
    while (n > 0) {
      sum += n % 10;
      n = Math.floor(n / 10);
    }
    n = sum;
  }
  return n || 9;
}

const BAT_TRACH_DIRECTIONS = {
  1: { // Khảm (Đông Tứ Mệnh)
    1: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    4: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    9: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    3: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    7: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    8: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    6: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    2: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  2: { // Khôn (Tây Tứ Mệnh)
    2: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    8: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    6: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    7: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    9: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    4: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    3: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    1: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  3: { // Chấn (Đông Tứ Mệnh)
    3: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    9: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    4: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    1: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    2: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    6: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    8: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    7: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  4: { // Tốn (Đông Tứ Mệnh)
    4: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    1: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    3: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    9: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    6: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    2: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    7: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    8: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  6: { // Càn (Tây Tứ Mệnh)
    6: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    7: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    2: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    8: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    4: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    3: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    1: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    9: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  7: { // Đoài (Tây Tứ Mệnh)
    7: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    6: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    8: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    2: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    1: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    9: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    4: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    3: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  8: { // Cấn (Tây Tứ Mệnh)
    8: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    2: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    7: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    6: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    9: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    1: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    3: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    4: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
  9: { // Ly (Đông Tứ Mệnh)
    9: { name: 'Phục Vị', good: true, label: 'Bình an, ổn định' },
    3: { name: 'Sinh Khí', good: true, label: 'Tài lộc, thăng tiến' },
    1: { name: 'Diên Niên', good: true, label: 'Hòa thuận, bền lâu' },
    4: { name: 'Thiên Y', good: true, label: 'Sức khỏe, quý nhân' },
    8: { name: 'Họa Hại', good: false, label: 'Thị phi nhỏ' },
    7: { name: 'Ngũ Quỷ', good: false, label: 'Tranh chấp, biến động' },
    2: { name: 'Lục Sát', good: false, label: 'Xáo trộn tình cảm' },
    6: { name: 'Tuyệt Mệnh', good: false, label: 'Hung họa lớn' },
  },
};

/**
 * Tính Cung Phi Bát Trạch theo năm sinh Âm lịch và giới tính (tùy chọn đối chiếu).
 */
export function computeBatTrachFromBirth(birthYear, gender = 'nam') {
  const year = Math.trunc(Number(birthYear) || 1990);
  const isFemale = gender === 'nu' || gender === 0 || gender === '0' || gender === 'Nữ';
  const digitSum = reduceToSingleDigit(year);

  let cungPhi;
  if (!isFemale) {
    // 1900-1999 vs 2000-2099 unified by digitSum formula:
    // Verify: 1990(sum=1)->11-1=10->1(Khảm); 1996(sum=7)->4(Tốn); 2000(sum=2)->9(Ly); 2001(sum=3)->8(Cấn)
    const raw = ((((11 - digitSum) - 1) % 9) + 9) % 9 + 1;
    cungPhi = raw === 5 ? 2 : raw;
  } else {
    // Verify: 1990(sum=1)->1+4=5->8(Cấn); 1996(sum=7)->7+4=11->2(Khôn); 2000(sum=2)->6(Càn)
    const raw = ((((digitSum + 4) - 1) % 9) + 9) % 9 + 1;
    cungPhi = raw === 5 ? 8 : raw;
  }

  const meta = CUU_CUNG_META[cungPhi];
  const isDongTu = [1, 3, 4, 9].includes(cungPhi);
  const canChi = getCanChiYear(year);
  const dirTable = BAT_TRACH_DIRECTIONS[cungPhi];

  const directions = Object.entries(dirTable).map(([cungStr, info]) => {
    const cung = Number(cungStr);
    return {
      cung,
      directionName: CUU_CUNG_META[cung].name,
      trigram: CUU_CUNG_META[cung].trigram,
      ...info,
    };
  });

  return {
    birthYear: year,
    canChi,
    genderLabel: isFemale ? 'Nữ' : 'Nam',
    cungPhi,
    trigram: meta.trigram,
    element: meta.element,
    group: isDongTu ? 'Đông Tứ Mệnh' : 'Tây Tứ Mệnh',
    directions,
    byCung: dirTable,
  };
}

/**
 * Lập Tinh bàn Huyền Không Phi Tinh đầy đủ.
 */
export function lapTinhBanHuyenKhong({
  namXay = 2024,
  vanOverride = null,
  doHuong = 90,
  cheDo = 'ha_quai', // 'ha_quai' | 'the_quai' | 'auto'
  namXem = 2026,
  thangXem = 1,
  includeAnnual = true,
  includeMonthly = false,
} = {}) {
  const van = vanOverride && Number(vanOverride) >= 1 && Number(vanOverride) <= 9
    ? Math.trunc(Number(vanOverride))
    : yearToPeriod(namXay);

  const directionInfo = degreeToMountain(doHuong);
  const { huong, toa } = directionInfo;

  const effectiveMode = cheDo === 'auto'
    ? (directionInfo.isKiemHuong ? 'the_quai' : 'ha_quai')
    : (cheDo === 'the_quai' ? 'the_quai' : 'ha_quai');

  // 1. Vận bàn (luôn bay thuận)
  const vanBan = phiTinh(van, +1);

  // 2. Sơn bàn
  const saoSonGoc = vanBan[toa.cung];
  const sonTheInfo = effectiveMode === 'the_quai'
    ? resolveTheQuaiStar(saoSonGoc, toa.nguyenLong)
    : { saoGoc: saoSonGoc, saoThe: saoSonGoc, sourceMountain: null, changed: false, note: '' };
  const saoSonNhapTrung = sonTheInfo.saoThe;
  const chieuSon = getFlightDirection(saoSonGoc, toa.nguyenLong, toa.amDuong);
  const sonBan = phiTinh(saoSonNhapTrung, chieuSon);

  // 3. Hướng bàn
  const saoHuongGoc = vanBan[huong.cung];
  const huongTheInfo = effectiveMode === 'the_quai'
    ? resolveTheQuaiStar(saoHuongGoc, huong.nguyenLong)
    : { saoGoc: saoHuongGoc, saoThe: saoHuongGoc, sourceMountain: null, changed: false, note: '' };
  const saoHuongNhapTrung = huongTheInfo.saoThe;
  const chieuHuong = getFlightDirection(saoHuongGoc, huong.nguyenLong, huong.amDuong);
  const huongBan = phiTinh(saoHuongNhapTrung, chieuHuong);

  // 4. Lưu niên & Lưu nguyệt
  const annual = getAnnualFlyingStars(namXem);
  const monthly = getMonthlyFlyingStars(namXem, thangXem);
  const afflictions = getAnnualAfflictions(namXem, annual.ban);

  // 5. Thành Môn & Cách cục toàn bàn
  const thanhMonList = evaluateThanhMon({ van, vanBan, huongBan, huongMountain: huong });
  const thanhMonMap = Object.fromEntries(thanhMonList.map((t) => [t.cung, t]));
  const patterns = detectChartPatterns({ van, vanBan, sonBan, huongBan, huong, toa, thanhMonList });

  // 6. Dữ liệu từng cung (1..9)
  const palacesByCung = {};
  for (let cung = 1; cung <= 9; cung++) {
    const meta = CUU_CUNG_META[cung];
    const sonStar = sonBan[cung];
    const vanStar = vanBan[cung];
    const huongStar = huongBan[cung];
    const pair = getStarPairInfo(sonStar, huongStar);

    const isHuongPalace = cung === huong.cung;
    const isToaPalace = cung === toa.cung;
    const isTrung = cung === 5;
    const sonState = getStarQiState(sonStar, van);
    const huongState = getStarQiState(huongStar, van);

    const specialTags = [];
    if (isToaPalace && sonStar === van) {
      specialTags.push({ type: 'vuong_son', label: 'Vượng Sơn', tone: 'cat' });
    }
    if (isHuongPalace && huongStar === van) {
      specialTags.push({ type: 'vuong_huong', label: 'Vượng Hướng', tone: 'cat' });
    }
    if (isHuongPalace && sonStar === van && huongStar === van) {
      specialTags.push({ type: 'song_tinh', label: 'Song Tinh Đáo Hướng', tone: 'binh' });
    }
    if (isToaPalace && sonStar === van && huongStar === van) {
      specialTags.push({ type: 'song_tinh', label: 'Song Tinh Đáo Tọa', tone: 'binh' });
    }
    if (sonStar + vanStar === 10) {
      specialTags.push({ type: 'hop_thap', label: 'Sơn–Vận Hợp Thập', tone: 'cat' });
    }
    if (huongStar + vanStar === 10) {
      specialTags.push({ type: 'hop_thap', label: 'Hướng–Vận Hợp Thập', tone: 'cat' });
    }
    if (thanhMonMap[cung]) {
      specialTags.push({
        type: 'thanh_mon',
        label: thanhMonMap[cung].isUsable ? 'Thành Môn Cát' : 'Thành Môn',
        tone: thanhMonMap[cung].isUsable ? 'cat' : 'binh',
      });
    }

    // Tổng hợp xếp hạng thực tế tại cung theo Vận
    let rating = pair?.baseRating || 'binh';
    if ((isHuongPalace && huongState.code === 'vuong') || (isToaPalace && sonState.code === 'vuong')) {
      if (rating === 'binh') rating = 'cat';
    }
    if (sonStar === 5 || huongStar === 5) {
      if (sonStar === 5 && huongStar === 5) rating = 'hung';
    }

    const annualStar = includeAnnual ? annual.ban[cung] : null;
    const monthlyStar = includeMonthly ? monthly.ban[cung] : null;
    const palaceAfflictions = includeAnnual ? afflictions.byPalace[cung] : [];

    palacesByCung[cung] = {
      cung,
      ...meta,
      sonStar,
      vanStar,
      huongStar,
      sonStarInfo: CUU_TINH_INFO[sonStar],
      vanStarInfo: CUU_TINH_INFO[vanStar],
      huongStarInfo: CUU_TINH_INFO[huongStar],
      sonState,
      huongState,
      pair,
      rating,
      isHuongPalace,
      isToaPalace,
      isTrung,
      specialTags,
      thanhMon: thanhMonMap[cung] || null,
      annualStar,
      annualStarInfo: annualStar ? CUU_TINH_INFO[annualStar] : null,
      monthlyStar,
      monthlyStarInfo: monthlyStar ? CUU_TINH_INFO[monthlyStar] : null,
      afflictions: palaceAfflictions,
    };
  }

  const grid = LUOI_CUU_CUNG.map((row) => row.map((cung) => palacesByCung[cung]));

  return {
    namXay: Math.trunc(Number(namXay) || 2024),
    van,
    periodInfo: PERIOD_RANGES.find((p) => p.van === van) || null,
    requestedMode: cheDo,
    effectiveMode,
    effectiveModeLabel: effectiveMode === 'the_quai' ? 'Lập theo Thế quái' : 'Lập theo Hạ quái',
    directionInfo,
    vanBan,
    sonBan,
    huongBan,
    trace: {
      vanTrungCung: van,
      saoSonGoc,
      saoSonNhapTrung,
      chieuSon,
      sonTheInfo,
      saoHuongGoc,
      saoHuongNhapTrung,
      chieuHuong,
      huongTheInfo,
    },
    annual,
    monthly,
    afflictions,
    includeAnnual,
    includeMonthly,
    thanhMonList,
    patterns,
    palacesByCung,
    grid,
  };
}
