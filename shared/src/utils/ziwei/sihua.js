/**
 * Tứ Hóa & Phi Tinh Tứ Hóa (Bản Mệnh, Đại Hạn, Lưu Niên, Lưu Nguyệt, Lưu Nhật, Lưu Thời,
 * Tự Hóa Xuất / Hướng Tâm Tự Hóa, Lai Nhân Cung & Phi Hóa Tương Tham Hợp Hôn)
 * Ported & localized in Vietnamese from lib/ziwei/sihua.ts.
 */
import { Lunar } from 'lunar-javascript';
import { STEMS_ZH, THIEN_CAN, DIA_CHI } from './solarTime.js';

export const SIHUA_TYPES = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];
export const SIHUA_KEYS = ['Loc', 'Quyen', 'Khoa', 'Ky'];

// Bảng Tứ Hóa chuẩn Nam Phái (v11): Can Canh = Nhật - Vũ - Đồng - Âm
export const SI_HUA_TABLE_V11 = {
  0: ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'],   // Giáp
  1: ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],       // Ất
  2: ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], // Bính
  3: ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],       // Đinh
  4: ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'],       // Mậu
  5: ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],   // Kỷ
  6: ['Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Thái Âm'],    // Canh (Nam Phái: Nhật Vũ Đồng Âm)
  7: ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],     // Tân
  8: ['Thiên Lương', 'Tử Vi', 'Tả Phụ', 'Vũ Khúc'],         // Nhâm
  9: ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],        // Quý
};

// Các biến thể Tứ Hóa Can Canh (index 6) theo trường phái
export const GENG_SIHUA_VARIANTS = {
  v11:   ['Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Thái Âm'],    // Nhật Vũ Đồng Âm (Nam Phái Việt Nam)
  GYWTY: ['Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Thái Âm'],    // Nhật Vũ Đồng Âm (Khoa Kỵ hoán đổi)
  GYWYT: ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'],    // Nhật Vũ Âm Đồng (Đẩu Số Toàn Thư / iztro)
  GYWFT: ['Thái Dương', 'Vũ Khúc', 'Thiên Phủ', 'Thiên Đồng'],  // Nhật Vũ Phủ Đồng (Trung Châu Phái)
  GYWFX: ['Thái Dương', 'Vũ Khúc', 'Thiên Phủ', 'Thiên Tướng'], // Nhật Vũ Phủ Tướng
  GYWTX: ['Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Thiên Tướng'],// Nhật Vũ Đồng Tướng
};

// Biến thể Can Mậu / Nhâm / Quý tùy chọn
export const STEM_SIHUA_VARIANTS = {
  mau_thai_duong: ['Tham Lang', 'Thái Âm', 'Thái Dương', 'Thiên Cơ'],
  nham_thien_phu: ['Thiên Lương', 'Tử Vi', 'Thiên Phủ', 'Vũ Khúc'],
  quy_thai_duong: ['Phá Quân', 'Cự Môn', 'Thái Dương', 'Tham Lang'],
};

function resolveStemIndex(stemIndexOrName) {
  if (typeof stemIndexOrName === 'number' && Number.isFinite(stemIndexOrName)) {
    return ((Math.trunc(stemIndexOrName) % 10) + 10) % 10;
  }
  if (typeof stemIndexOrName === 'string') {
    const clean = stemIndexOrName.trim().split(/\s+/)[0];
    const viIdx = THIEN_CAN.indexOf(clean);
    if (viIdx >= 0) return viIdx;
    const zhIdx = STEMS_ZH.indexOf(clean);
    if (zhIdx >= 0) return zhIdx;
  }
  return 0;
}

function getPalaceStarNames(palace) {
  if (!palace) return [];
  if (Array.isArray(palace.chinhTinh) || Array.isArray(palace.phuTinh)) {
    const major = (palace.chinhTinh || []).map(s => String(s).split('(')[0].trim());
    const minor = (palace.phuTinh || []).map(s => String(s).split('(')[0].trim());
    return [...major, ...minor];
  }
  if (Array.isArray(palace.stars)) {
    return palace.stars.map(s => (typeof s === 'string' ? s.split('(')[0].trim() : s.name));
  }
  return [];
}

function cleanPalaceFuncName(chucNang) {
  return String(chucNang || '').replace(/\s*<THÂN>/g, '').trim();
}

// ─── 1. Tra cứu Tứ Hóa theo Thiên Can ───────────────────────────────────────
export function getSiHuaByStem(stemIndexOrName, schoolConfig = {}) {
  const stemIdx = resolveStemIndex(stemIndexOrName);
  let row = [...(SI_HUA_TABLE_V11[stemIdx] || SI_HUA_TABLE_V11[0])];

  if (stemIdx === 6 && schoolConfig?.gengYearSihua && GENG_SIHUA_VARIANTS[schoolConfig.gengYearSihua]) {
    row = [...GENG_SIHUA_VARIANTS[schoolConfig.gengYearSihua]];
  }
  if (stemIdx === 7 && schoolConfig?.gengYearSihua && schoolConfig.gengYearSihua !== 'v11') {
    // Toàn Thư / Bắc Phái Can Tân: Cự Môn Lộc, Thái Dương Quyền, Văn Khúc Khoa, Văn Xương Kỵ
    row = ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'];
  } else if (stemIdx === 7 && (!schoolConfig?.gengYearSihua || schoolConfig.gengYearSihua === 'v11')) {
    // Trong tuViEngineV11.js dòng 541: Tân = Cự Môn Lộc, Thiên Lương Quyền, Văn Khúc Khoa, Văn Xương Kỵ
    row = ['Cự Môn', 'Thiên Lương', 'Văn Khúc', 'Văn Xương'];
  }

  const [loc, quyen, khoa, ky] = row;
  return {
    Loc: loc,
    Quyen: quyen,
    Khoa: khoa,
    Ky: ky,
    'Hóa Lộc': loc,
    'Hóa Quyền': quyen,
    'Hóa Khoa': khoa,
    'Hóa Kỵ': ky,
    禄: loc,
    权: quyen,
    科: khoa,
    忌: ky,
  };
}

export function buildStarSiHuaMap(stemIndexOrName, schoolConfig = {}) {
  const t = getSiHuaByStem(stemIndexOrName, schoolConfig);
  return {
    [t.Loc]: 'Hóa Lộc',
    [t.Quyen]: 'Hóa Quyền',
    [t.Khoa]: 'Hóa Khoa',
    [t.Ky]: 'Hóa Kỵ',
  };
}

export function getYearStemIndex(year) {
  return ((year - 4) % 10 + 10) % 10;
}

export function getYearBranchIndex(year) {
  return ((year - 4) % 12 + 12) % 12;
}

// ─── 2. Tứ Hóa Đại Hạn / Lưu Niên / Lưu Nguyệt / Lưu Nhật / Lưu Thời ───────
/**
 * Tính Tứ Hóa của Đại Hạn theo Can của cung Đại Hạn
 * Hỗ trợ cả truyền `daXianChiIndex` (0..11) hoặc `tuoiAm` (tuổi mụ).
 */
export function getDaXianSiHua(chart, daXianSelector, schoolConfig = {}) {
  const palates = chart?.palates || chart?.palaces || [];
  if (!palates.length) return null;

  let dxPalace = null;
  if (typeof daXianSelector === 'object' && daXianSelector !== null) {
    if (daXianSelector.chiIndex !== undefined) {
      dxPalace = palates.find(p => p.chiIndex === daXianSelector.chiIndex) || null;
    } else if (daXianSelector.age !== undefined) {
      dxPalace = palates.find(p => p.daiHan <= daXianSelector.age && daXianSelector.age < p.daiHan + 10) || null;
    }
  } else if (typeof daXianSelector === 'number') {
    // Nếu truyền chỉ số địa chi 0..11 và không khớp khoảng tuổi đại hạn thì ưu tiên chiIndex
    dxPalace = palates.find(p => p.chiIndex === daXianSelector)
      || palates.find(p => p.daiHan <= daXianSelector && daXianSelector < p.daiHan + 10)
      || null;
  }

  if (!dxPalace) return null;
  const stemIndex = resolveStemIndex(dxPalace.canName ?? dxPalace.stem);
  return {
    stemIndex,
    stemName: THIEN_CAN[stemIndex],
    palaceChiIndex: dxPalace.chiIndex ?? dxPalace.branch,
    palaceChiName: dxPalace.chiName || DIA_CHI[dxPalace.chiIndex ?? dxPalace.branch],
    palaceChucNang: cleanPalaceFuncName(dxPalace.chucNang || dxPalace.name),
    daiHanRange: dxPalace.daiHan ? `${dxPalace.daiHan}–${dxPalace.daiHan + 9}` : null,
    transforms: getSiHuaByStem(stemIndex, schoolConfig),
  };
}

export function getLiuNianSiHua(yearOrStemIndex, schoolConfig = {}) {
  const isFullYear = typeof yearOrStemIndex === 'number' && yearOrStemIndex > 30;
  const stemIndex = isFullYear ? getYearStemIndex(yearOrStemIndex) : resolveStemIndex(yearOrStemIndex);
  const branchIndex = isFullYear ? getYearBranchIndex(yearOrStemIndex) : null;
  return {
    year: isFullYear ? yearOrStemIndex : null,
    stemIndex,
    stemName: THIEN_CAN[stemIndex],
    branchIndex,
    branchName: branchIndex !== null ? DIA_CHI[branchIndex] : null,
    transforms: getSiHuaByStem(stemIndex, schoolConfig),
  };
}

/**
 * Ngũ Hổ Độn khởi Can tháng Giêng (tháng Dần):
 * Giáp Kỷ khởi Bính Dần (2), Ất Canh khởi Mậu Dần (4), Bính Tân khởi Canh Dần (6),
 * Đinh Nhâm khởi Nhâm Dần (8), Mậu Quý khởi Giáp Dần (0).
 */
export function getLiuYueStemIndex(yearStem, month) {
  const startStemOfYin = {
    0: 2, 5: 2,
    1: 4, 6: 4,
    2: 6, 7: 6,
    3: 8, 8: 8,
    4: 0, 9: 0,
  };
  const yStem = resolveStemIndex(yearStem);
  const yinStem = startStemOfYin[yStem] ?? 0;
  return (yinStem + ((month - 1) % 12) + 10) % 10;
}

export function getEffectiveLiuYueMonth(month, options = {}) {
  const normalizedMonth = Math.max(1, Math.min(12, Math.trunc(month || 1)));
  if (!options.isLeapMonth || (options.liuriDay ?? 1) <= 15) return normalizedMonth;
  return normalizedMonth >= 12 ? 1 : normalizedMonth + 1;
}

export function getLiuYueSiHua(yearStem, month, options = {}, schoolConfig = {}) {
  const effectiveMonth = getEffectiveLiuYueMonth(month, options);
  const yStem = resolveStemIndex(yearStem);
  const sourceYearStem = options.isLeapMonth
    && effectiveMonth === 1
    && (options.liuriDay ?? 1) > 15
    ? resolveStemIndex(options.nextYearStem ?? ((yStem + 1) % 10))
    : yStem;
  const stemIndex = getLiuYueStemIndex(sourceYearStem, effectiveMonth);
  const branchIndex = (effectiveMonth + 1) % 12; // Tháng 1 = Dần (2)
  return {
    stemIndex,
    stemName: THIEN_CAN[stemIndex],
    branchIndex,
    branchName: DIA_CHI[branchIndex],
    month: effectiveMonth,
    transforms: getSiHuaByStem(stemIndex, schoolConfig),
  };
}

export function getLiuRiSiHua(lunarYear, lunarMonth, lunarDay, isLeapMonth = false, schoolConfig = {}) {
  try {
    const monthKey = isLeapMonth ? -Math.abs(lunarMonth) : Math.abs(lunarMonth);
    const lunar = Lunar.fromYmd(lunarYear, monthKey, lunarDay);
    const stemIndex = STEMS_ZH.indexOf(lunar.getDayGan());
    if (stemIndex < 0) return null;
    return {
      stemIndex,
      stemName: THIEN_CAN[stemIndex],
      transforms: getSiHuaByStem(stemIndex, schoolConfig),
    };
  } catch {
    return null;
  }
}

export function getLiuShiSiHua(dayStemIndex, hourBranch, schoolConfig = {}) {
  // Ngũ Thử Độn: Giáp Kỷ -> Giáp Tý (0), Ất Canh -> Bính Tý (2), Bính Tân -> Mậu Tý (4), Đinh Nhâm -> Canh Tý (6), Mậu Quý -> Nhâm Tý (8)
  const ziStemByDayStem = {
    0: 0, 5: 0,
    1: 2, 6: 2,
    2: 4, 7: 4,
    3: 6, 8: 6,
    4: 8, 9: 8,
  };
  const dStem = resolveStemIndex(dayStemIndex);
  const branch = ((Math.trunc(hourBranch) % 12) + 12) % 12;
  const stemIndex = ((ziStemByDayStem[dStem] ?? 0) + branch) % 10;
  return {
    stemIndex,
    stemName: THIEN_CAN[stemIndex],
    branchIndex: branch,
    branchName: DIA_CHI[branch],
    transforms: getSiHuaByStem(stemIndex, schoolConfig),
  };
}

// ─── 3. Tự Hóa Xuất, Hướng Tâm Tự Hóa & Phi Tinh Tứ Hóa 12 Cung ───────────
/**
 * Phát hiện Tự Hóa Xuất (cung tự hóa Lộc/Quyền/Khoa/Kỵ ngay tại cung đó)
 * và Hướng Tâm Tự Hóa (phi hóa sang cung đối diện xung chiếu, hoặc từ đối cung phi hóa sang).
 */
export function detectPalaceSelfSihua(palace, allPalaces = [], schoolConfig = {}) {
  if (!palace) return { selfOut: [], oppositeIn: [], flyingToOpposite: [] };
  const chiIdx = palace.chiIndex ?? palace.branch ?? 0;
  const oppIdx = (chiIdx + 6) % 12;
  const oppPalace = allPalaces.find(p => (p.chiIndex ?? p.branch) === oppIdx) || null;

  const transforms = getSiHuaByStem(palace.canName ?? palace.stem, schoolConfig);
  const ownStars = new Set(getPalaceStarNames(palace));
  const oppStars = new Set(getPalaceStarNames(oppPalace));

  const selfOut = [];
  const flyingToOpposite = [];

  for (const shType of SIHUA_TYPES) {
    const starName = transforms[shType];
    if (!starName) continue;
    if (ownStars.has(starName)) {
      selfOut.push({
        siHua: shType,
        shortCode: shType.replace('Hóa ', ''),
        starName,
        type: 'tu-hoa-xuat',
        label: `Tự ${shType}`,
      });
    }
    if (oppStars.has(starName)) {
      flyingToOpposite.push({
        siHua: shType,
        shortCode: shType.replace('Hóa ', ''),
        starName,
        targetChiIndex: oppIdx,
        targetChiName: oppPalace?.chiName || DIA_CHI[oppIdx],
        targetChucNang: cleanPalaceFuncName(oppPalace?.chucNang || oppPalace?.name),
        type: 'hoa-xung-doi-cung',
        label: `Phi ${shType} sang Đối Cung`,
      });
    }
  }

  // Hướng Tâm Tự Hóa: Đối cung có Thiên Can phi hóa ngược vào các sao tọa thủ tại bản cung
  const oppositeIn = [];
  if (oppPalace) {
    const oppTransforms = getSiHuaByStem(oppPalace.canName ?? oppPalace.stem, schoolConfig);
    for (const shType of SIHUA_TYPES) {
      const starName = oppTransforms[shType];
      if (starName && ownStars.has(starName)) {
        oppositeIn.push({
          siHua: shType,
          shortCode: shType.replace('Hóa ', ''),
          starName,
          fromChiIndex: oppIdx,
          fromChiName: oppPalace.chiName || DIA_CHI[oppIdx],
          fromChucNang: cleanPalaceFuncName(oppPalace.chucNang || oppPalace.name),
          type: 'huong-tam-tu-hoa',
          label: `Hướng Tâm ${shType} (từ ${cleanPalaceFuncName(oppPalace.chucNang || oppPalace.name)})`,
        });
      }
    }
  }

  return {
    selfOut,
    oppositeIn,
    flyingToOpposite,
  };
}

export function detectSelfSihua(palace, allPalaces = [], schoolConfig = {}) {
  return detectPalaceSelfSihua(palace, allPalaces, schoolConfig).selfOut;
}

/**
 * Tính toàn bộ mạng lưới Phi Tinh Tứ Hóa 12 cung + xác định Lai Nhân Cung (cung có Thiên Can trùng Can năm sinh).
 */
export function buildChartFlyingSihua(chart, schoolConfig = {}) {
  const palates = chart?.palates || chart?.palaces || [];
  if (!palates.length) {
    return { laiNhanCung: null, palaces: [], incomingByPalace: {} };
  }

  const birthCanName = chart?.canChiNam ? String(chart.canChiNam).trim().split(/\s+/)[0] : null;

  // Map sao -> cung tọa thủ
  const starToPalace = {};
  for (const p of palates) {
    const cIdx = p.chiIndex ?? p.branch;
    for (const sName of getPalaceStarNames(p)) {
      starToPalace[sName] = {
        chiIndex: cIdx,
        chiName: p.chiName || DIA_CHI[cIdx],
        chucNang: cleanPalaceFuncName(p.chucNang || p.name),
      };
    }
  }

  // Tìm Lai Nhân Cung: ưu tiên các cung ngoài Tý/Sửu bị lặp Can với Dần/Mão theo chuẩn Khâm Thiên Tứ Hóa,
  // hoặc trả về danh sách tất cả cung có canName === birthCanName.
  const matchingLaiNhan = palates.filter(p => p.canName === birthCanName);
  const primaryLaiNhan = matchingLaiNhan.find(p => p.chiIndex >= 2) || matchingLaiNhan[0] || null;
  const laiNhanCung = primaryLaiNhan
    ? {
        chiIndex: primaryLaiNhan.chiIndex,
        chiName: primaryLaiNhan.chiName,
        canName: primaryLaiNhan.canName,
        chucNang: cleanPalaceFuncName(primaryLaiNhan.chucNang),
        allMatches: matchingLaiNhan.map(p => ({
          chiIndex: p.chiIndex,
          chiName: p.chiName,
          canName: p.canName,
          chucNang: cleanPalaceFuncName(p.chucNang),
        })),
      }
    : null;

  const incomingByPalace = {};
  for (let i = 0; i < 12; i++) incomingByPalace[i] = [];

  const palaceResults = palates.map(p => {
    const fromChiIndex = p.chiIndex ?? p.branch;
    const oppChiIndex = (fromChiIndex + 6) % 12;
    const fromChucNang = cleanPalaceFuncName(p.chucNang || p.name);
    const transforms = getSiHuaByStem(p.canName ?? p.stem, schoolConfig);
    const selfInfo = detectPalaceSelfSihua(p, palates, schoolConfig);

    const flights = SIHUA_TYPES.map(shType => {
      const starName = transforms[shType];
      const target = starToPalace[starName] || null;
      const isSelfSihua = target ? target.chiIndex === fromChiIndex : false;
      const isOppositeSihua = target ? target.chiIndex === oppChiIndex : false;

      const flight = {
        siHua: shType,
        shortCode: shType.replace('Hóa ', ''),
        starName,
        fromChiIndex,
        fromChiName: p.chiName || DIA_CHI[fromChiIndex],
        fromCanName: p.canName,
        fromChucNang,
        targetChiIndex: target ? target.chiIndex : null,
        targetChiName: target ? target.chiName : null,
        targetChucNang: target ? target.chucNang : null,
        isSelfSihua,
        isOppositeSihua,
      };

      if (target && incomingByPalace[target.chiIndex]) {
        incomingByPalace[target.chiIndex].push(flight);
      }
      return flight;
    });

    return {
      chiIndex: fromChiIndex,
      chiName: p.chiName || DIA_CHI[fromChiIndex],
      canName: p.canName,
      chucNang: fromChucNang,
      isLaiNhanCung: primaryLaiNhan ? primaryLaiNhan.chiIndex === fromChiIndex : false,
      transforms: {
        Loc: transforms.Loc,
        Quyen: transforms.Quyen,
        Khoa: transforms.Khoa,
        Ky: transforms.Ky,
      },
      flights,
      selfOut: selfInfo.selfOut,
      selfSihua: selfInfo.selfOut,
      oppositeIn: selfInfo.oppositeIn,
      xiangXinSihua: selfInfo.oppositeIn,
    };
  });

  const selfSihua = palaceResults.flatMap(p =>
    p.selfOut.map(item => ({
      ...item,
      chiIndex: p.chiIndex,
      chiName: p.chiName,
      chucNang: p.chucNang,
    }))
  );
  const xiangXinSihua = palaceResults.flatMap(p =>
    p.oppositeIn.map(item => ({
      ...item,
      targetChiIndex: p.chiIndex,
      targetChiName: p.chiName,
      targetChucNang: p.chucNang,
    }))
  );

  return {
    laiNhanCung,
    palaces: palaceResults,
    incomingByPalace,
    selfSihua,
    xiangXinSihua,
  };
}

/**
 * Truy vết cung nào phi Tứ Hóa (`sihua`) vào sao `starName`
 */
export function findIncomingPalaces(chart, starName, sihua = 'Hóa Kỵ', schoolConfig = {}) {
  const palates = chart?.palates || chart?.palaces || [];
  const normalizedSihua = sihua.startsWith('Hóa ') ? sihua : `Hóa ${sihua}`;
  return palates.filter(p => {
    const t = getSiHuaByStem(p.canName ?? p.stem, schoolConfig);
    return t[normalizedSihua] === starName || t[sihua] === starName;
  });
}

// ─── 4. Phi Hóa Tương Tham Giữa 2 Lá Số (Hợp Hôn / Hợp Tác) ────────────────
function indexChartStars(chart) {
  const palates = chart?.palates || chart?.palaces || [];
  const map = {};
  for (const p of palates) {
    const cIdx = p.chiIndex ?? p.branch;
    for (const sName of getPalaceStarNames(p)) {
      map[sName] = {
        chiIndex: cIdx,
        chiName: p.chiName || DIA_CHI[cIdx],
        chucNang: cleanPalaceFuncName(p.chucNang || p.name),
        isMenh: Boolean(p.isMenh || cleanPalaceFuncName(p.chucNang) === 'Mệnh'),
        isThan: Boolean(p.isThan || String(p.chucNang || '').includes('<THÂN>')),
      };
    }
  }
  return map;
}

function computeOneWayCrossFlights(sourceChart, targetChart, sourceLabel, targetLabel, schoolConfig = {}) {
  const sourcePalates = sourceChart?.palates || [];
  const targetStarMap = indexChartStars(targetChart);

  const birthStem = sourceChart?.canChiNam ? String(sourceChart.canChiNam).split(/\s+/)[0] : 'Giáp';
  const menhPalace = sourcePalates.find(p => p.isMenh || cleanPalaceFuncName(p.chucNang) === 'Mệnh');
  const phuThePalace = sourcePalates.find(p => cleanPalaceFuncName(p.chucNang) === 'Phu Thê');
  const quanLocPalace = sourcePalates.find(p => cleanPalaceFuncName(p.chucNang) === 'Quan Lộc');

  const emitters = [
    { key: 'birthYear', label: `Can Năm Sinh (${birthStem})`, stemName: birthStem },
    ...(menhPalace ? [{ key: 'menh', label: `Cung Mệnh (${menhPalace.canName})`, stemName: menhPalace.canName }] : []),
    ...(phuThePalace ? [{ key: 'phuThe', label: `Cung Phu Thê (${phuThePalace.canName})`, stemName: phuThePalace.canName }] : []),
    ...(quanLocPalace ? [{ key: 'quanLoc', label: `Cung Quan Lộc (${quanLocPalace.canName})`, stemName: quanLocPalace.canName }] : []),
  ];

  const keyTargetPalaces = new Set(['Mệnh', 'Phu Thê', 'Phúc Đức', 'Tài Bạch', 'Quan Lộc', 'Điền Trạch']);
  const flights = [];
  let harmonyScore = 0;

  for (const emitter of emitters) {
    const transforms = getSiHuaByStem(emitter.stemName, schoolConfig);
    for (const shType of SIHUA_TYPES) {
      const starName = transforms[shType];
      const landed = targetStarMap[starName];
      if (!landed) continue;

      const isKeyTarget = keyTargetPalaces.has(landed.chucNang) || landed.isThan;
      const isAuspicious = shType !== 'Hóa Kỵ';
      let delta = 0;
      if (isKeyTarget) {
        if (shType === 'Hóa Lộc') delta = landed.chucNang === 'Mệnh' || landed.chucNang === 'Phu Thê' ? 12 : 8;
        else if (shType === 'Hóa Khoa') delta = landed.chucNang === 'Mệnh' || landed.chucNang === 'Phu Thê' ? 10 : 6;
        else if (shType === 'Hóa Quyền') delta = 5;
        else if (shType === 'Hóa Kỵ') delta = landed.chucNang === 'Mệnh' || landed.chucNang === 'Phu Thê' ? -12 : -7;
      }
      harmonyScore += delta;

      flights.push({
        emitterKey: emitter.key,
        emitterLabel: `${sourceLabel} · ${emitter.label}`,
        stemName: emitter.stemName,
        siHua: shType,
        starName,
        targetPalace: landed.chucNang,
        targetChiName: landed.chiName,
        targetIsThan: landed.isThan,
        isKeyTarget,
        isAuspicious,
        scoreDelta: delta,
        summary: `${sourceLabel} (${emitter.label}) phi ${shType} (${starName}) nhập cung ${landed.chucNang}${landed.isThan ? ' <Thân>' : ''} (${landed.chiName}) của ${targetLabel}`,
      });
    }
  }

  return {
    flights,
    keyFlights: flights.filter(f => f.isKeyTarget),
    harmonyScore,
  };
}

/**
 * Tính Phi Hóa Tương Tham (Cross-Chart Flying Transformations) giữa Lá Số A và Lá Số B.
 * Kiểm tra Can Năm Sinh, Can Cung Mệnh, Can Cung Phu Thê và Can Cung Quan Lộc của A
 * phi Hóa Lộc / Hóa Quyền / Hóa Khoa / Hóa Kỵ vào các cung trọng yếu (Mệnh, Thân, Phu Thê,
 * Phúc Đức, Tài Bạch, Quan Lộc) của B và ngược lại.
 */
export function computeCrossChartSihua(chartA, chartB, schoolConfig = {}) {
  const aToB = computeOneWayCrossFlights(chartA, chartB, 'Người A', 'Người B', schoolConfig);
  const bToA = computeOneWayCrossFlights(chartB, chartA, 'Người B', 'Người A', schoolConfig);

  const highlights = [
    ...aToB.keyFlights.filter(f => ['Mệnh', 'Phu Thê', 'Phúc Đức'].includes(f.targetPalace)),
    ...bToA.keyFlights.filter(f => ['Mệnh', 'Phu Thê', 'Phúc Đức'].includes(f.targetPalace)),
  ];

  const totalScoreDelta = aToB.harmonyScore + bToA.harmonyScore;

  return {
    aToB,
    bToA,
    highlights,
    totalScoreDelta,
  };
}
