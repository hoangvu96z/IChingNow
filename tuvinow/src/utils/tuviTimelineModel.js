/**
 * tuviTimelineModel.js — Biểu Đồ Vận Hạn 10 Năm Lưu Niên & Lịch 30 Ngày Lưu Nhật / Lưu Thời Cá Nhân Hóa
 *
 * Kết nối trực tiếp:
 * - `buildChartStarEvaluation` (đánh giá 5.0 sao / 100 điểm trên từng năm Lưu Niên)
 * - `getLiuNianSiHua`, `getLiuRiSiHua`, `getLiuShiSiHua` từ `shared/src/utils/ziwei/sihua.js`
 * - `Solar.fromYmd(y, m, d).getLunar()` từ `lunar-javascript`
 * - Xuất payload tóm tắt & checklist Nghiệm lý sang NoteNow (`buildTuViNoteNowPayload`)
 */

import { Solar } from 'lunar-javascript';
import { DIA_CHI, THIEN_CAN } from './tuViEngine.js';
import {
  getLiuNianSiHua,
  getLiuRiSiHua,
  getLiuShiSiHua,
} from '../../../shared/src/utils/ziwei/sihua.js';
import { buildChartStarEvaluation, cleanPalaceName } from './tuViStarRating.js';

const BRANCHES_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEMS_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export const TIMELINE_SERIES = [
  { id: 'overall', label: 'Tổng Quan', shortLabel: 'Tổng', color: '#f59e0b' },
  { id: 'career', label: 'Sự Nghiệp', shortLabel: 'Sự Nghiệp', color: '#8b5cf6' },
  { id: 'wealth', label: 'Tài Lộc', shortLabel: 'Tài Lộc', color: '#10b981' },
  { id: 'love', label: 'Tình Duyên', shortLabel: 'Tình Duyên', color: '#ec4899' },
  { id: 'health', label: 'Sức Khỏe', shortLabel: 'Sức Khỏe', color: '#06b6d4' },
];

export const SHICHEN_WINDOWS = [
  { branchIndex: 0, branchName: 'Tý', timeRange: '23:00–01:00' },
  { branchIndex: 1, branchName: 'Sửu', timeRange: '01:00–03:00' },
  { branchIndex: 2, branchName: 'Dần', timeRange: '03:00–05:00' },
  { branchIndex: 3, branchName: 'Mão', timeRange: '05:00–07:00' },
  { branchIndex: 4, branchName: 'Thìn', timeRange: '07:00–09:00' },
  { branchIndex: 5, branchName: 'Tỵ', timeRange: '09:00–11:00' },
  { branchIndex: 6, branchName: 'Ngọ', timeRange: '11:00–13:00' },
  { branchIndex: 7, branchName: 'Mùi', timeRange: '13:00–15:00' },
  { branchIndex: 8, branchName: 'Thân', timeRange: '15:00–17:00' },
  { branchIndex: 9, branchName: 'Dậu', timeRange: '17:00–19:00' },
  { branchIndex: 10, branchName: 'Tuất', timeRange: '19:00–21:00' },
  { branchIndex: 11, branchName: 'Hợi', timeRange: '21:00–23:00' },
];

const SAT_TINH_SET = new Set([
  'Kình Dương',
  'Đà La',
  'Địa Không',
  'Địa Kiếp',
  'Hỏa Tinh',
  'Linh Tinh',
  'Hóa Kỵ',
  'L.Hóa Kỵ',
  'L.Kình Dương',
  'L.Đà La',
  'Thiên Hình',
  'Đại Hao',
]);

function stripStarName(s) {
  return String(s || '').split('(')[0].trim();
}

function buildStarToPalaceLookup(chart) {
  const map = new Map();
  for (const p of chart?.palates || []) {
    const cleanRole = cleanPalaceName(p.chucNang);
    const stars = [...(p.chinhTinh || []), ...(p.phuTinh || [])].map(stripStarName);
    const satCount = stars.filter((st) => SAT_TINH_SET.has(st)).length;
    const entry = {
      chiIndex: p.chiIndex,
      chiName: p.chiName || DIA_CHI[p.chiIndex],
      palaceName: cleanRole,
      satCount,
      isTuan: Boolean(p.isTuan),
      isTriet: Boolean(p.isTriet),
    };
    for (const st of stars) {
      if (!st.startsWith('L.') && !st.startsWith('Hóa ')) {
        map.set(st, entry);
      }
    }
  }
  return map;
}

/**
 * 1. Xây dựng mô hình Quỹ Đạo 10 Năm Lưu Niên (theo Đại Hạn đang chọn hoặc 10 năm quanh hiện tại)
 */
export function buildTenYearTimelineModel(
  result,
  inputData = {},
  {
    windowMode = 'daxian', // 'daxian' | 'rolling'
    daXianChiIndex = null,
    referenceYear = new Date().getFullYear(),
    lifeEvents = [],
  } = {},
) {
  if (!result || !Array.isArray(result.palates) || result.palates.length !== 12) {
    return null;
  }

  const palates = result.palates;
  const birthLunarYear = Number(inputData?.lunarYear) || (result.viewYear && result.tuoiAm ? result.viewYear - result.tuoiAm + 1 : 1990);
  const currentAge = Math.max(1, referenceYear - birthLunarYear + 1);

  const daXianList = [...palates]
    .filter((p) => Number.isInteger(p.daiHan))
    .sort((a, b) => a.daiHan - b.daiHan)
    .map((p) => ({
      chiIndex: p.chiIndex,
      chiName: p.chiName,
      canName: p.canName,
      palaceName: cleanPalaceName(p.chucNang),
      startAge: p.daiHan,
      endAge: p.daiHan + 9,
      startYear: birthLunarYear + p.daiHan - 1,
      endYear: birthLunarYear + p.daiHan + 8,
    }));

  const activeDaXian =
    (daXianChiIndex !== null && daXianChiIndex !== undefined
      ? daXianList.find((dx) => dx.chiIndex === Number(daXianChiIndex))
      : null) ||
    daXianList.find((dx) => currentAge >= dx.startAge && currentAge <= dx.endAge) ||
    daXianList[0] ||
    null;

  let startYear;
  let windowTitle;
  if (windowMode === 'rolling' || !activeDaXian) {
    startYear = Math.max(birthLunarYear, referenceYear - 2);
    windowTitle = `Chu kỳ 10 năm (${startYear}–${startYear + 9})`;
  } else {
    startYear = activeDaXian.startYear;
    windowTitle = `Đại Hạn ${activeDaXian.startAge}–${activeDaXian.endAge} tuổi · Cung ${activeDaXian.palaceName} (${activeDaXian.startYear}–${activeDaXian.endYear})`;
  }

  const eventsByYear = new Map();
  for (const ev of Array.isArray(lifeEvents) ? lifeEvents : []) {
    const y = Number(ev?.year);
    if (!Number.isInteger(y)) continue;
    if (!eventsByYear.has(y)) eventsByYear.set(y, []);
    eventsByYear.get(y).push(ev);
  }

  const starLookup = buildStarToPalaceLookup(result);
  const years = [];

  for (let offset = 0; offset < 10; offset++) {
    const year = startYear + offset;
    const age = year - birthLunarYear + 1;
    const stemIdx = ((year - 4) % 10 + 10) % 10;
    const branchIdx = ((year - 4) % 12 + 12) % 12;
    const canChi = `${THIEN_CAN[stemIdx]} ${DIA_CHI[branchIdx]}`;

    const evalYear = buildChartStarEvaluation(result, inputData, {
      mode: 'liunian',
      viewYear: year,
      daXianChiIndex: activeDaXian?.chiIndex ?? null,
    });

    const aspectMap = Object.fromEntries(
      (evalYear?.aspects || []).map((a) => [a.id, a]),
    );

    const overallStars = evalYear?.overall?.score ?? 3.2;
    const overall100 = evalYear?.overall?.score100 ?? Math.round(overallStars * 20);
    const careerStars = aspectMap.career?.stars ?? 3.0;
    const wealthStars = aspectMap.wealth?.stars ?? 3.0;
    const loveStars = aspectMap.love?.stars ?? 3.0;
    const healthStars = aspectMap.health?.stars ?? 3.0;

    const lnSiHua = getLiuNianSiHua(year, inputData?.schoolConfig);
    const locPalace = starLookup.get(lnSiHua.transforms.Loc);
    const quyenPalace = starLookup.get(lnSiHua.transforms.Quyen);
    const khoaPalace = starLookup.get(lnSiHua.transforms.Khoa);
    const kyPalace = starLookup.get(lnSiHua.transforms.Ky);

    const lnMenhPalace = palates.find((p) => p.chiIndex === branchIdx);
    const lnMenhRole = cleanPalaceName(lnMenhPalace?.chucNang);

    let posture = 'steady';
    let postureLabel = '⚖️ Củng cố vững nhịp';
    let postureSummary = 'Năm giữ nhịp cân bằng: ưu tiên tích lũy chuyên môn, thu chi có kế hoạch và bồi đắp nền tảng.';

    if (overallStars >= 3.8) {
      posture = 'expand';
      postureLabel = '🚀 Năm thuận lợi mở rộng';
      postureSummary = `Khí vận hanh thông (LN.Lộc nhập ${locPalace?.palaceName || 'cát địa'}): thuận lợi triển khai mục tiêu lớn, mở rộng sự nghiệp hoặc tài sản.`;
    } else if (overallStars <= 3.1) {
      posture = 'defend';
      postureLabel = '🛡️ Năm cần phòng thủ / giữ sức';
      postureSummary = `Cần quản trị rủi ro (LN.Kỵ động tại ${kyPalace?.palaceName || 'trọng cung'}): tránh đầu tư tất tay, giữ gìn sức khỏe và hòa khí.`;
    }

    years.push({
      year,
      age,
      canChi,
      branchIndex: branchIdx,
      branchName: DIA_CHI[branchIdx],
      luuNienPalaceName: lnMenhRole,
      ratings: {
        overall: overallStars,
        career: careerStars,
        wealth: wealthStars,
        love: loveStars,
        health: healthStars,
      },
      scores100: {
        overall: overall100,
        career: Math.round((aspectMap.career?.rawScore ?? careerStars) * 20),
        wealth: Math.round((aspectMap.wealth?.rawScore ?? wealthStars) * 20),
        love: Math.round((aspectMap.love?.rawScore ?? loveStars) * 20),
        health: Math.round((aspectMap.health?.rawScore ?? healthStars) * 20),
      },
      tierLabel: evalYear?.overall?.tierLabel || 'Bình Hòa',
      badgeClass: evalYear?.overall?.badgeClass || 'tier-binh-hoa',
      posture,
      postureLabel,
      postureSummary,
      sihua: {
        Loc: { star: lnSiHua.transforms.Loc, palaceName: locPalace?.palaceName || '—', chiName: locPalace?.chiName || '' },
        Quyen: { star: lnSiHua.transforms.Quyen, palaceName: quyenPalace?.palaceName || '—', chiName: quyenPalace?.chiName || '' },
        Khoa: { star: lnSiHua.transforms.Khoa, palaceName: khoaPalace?.palaceName || '—', chiName: khoaPalace?.chiName || '' },
        Ky: { star: lnSiHua.transforms.Ky, palaceName: kyPalace?.palaceName || '—', chiName: kyPalace?.chiName || '' },
      },
      pinnedEvents: eventsByYear.get(year) || [],
    });
  }

  const sortedByScore = [...years].sort((a, b) => b.ratings.overall - a.ratings.overall);
  const peakYear = sortedByScore[0] || null;
  const defensiveYear = sortedByScore[sortedByScore.length - 1] || null;

  return {
    windowMode,
    windowTitle,
    startYear,
    endYear: startYear + 9,
    daXianList,
    activeDaXian,
    years,
    peakYear,
    defensiveYear,
  };
}

const PALACE_FAVORABLE_GUIDANCE = {
  Mệnh: 'Chủ động ra quyết định quan trọng, khởi động dự án cá nhân hoặc nâng cấp hình ảnh bản thân.',
  'Quan Lộc': 'Thúc đẩy công việc, ký kết văn bản, thuyết trình hoặc trao đổi mục tiêu với cấp trên.',
  'Tài Bạch': 'Cầu tài, chốt giao dịch thương mại, thu hồi công nợ hoặc lập kế hoạch dòng tiền.',
  'Điền Trạch': 'Chỉnh trang nhà cửa, sắp xếp không gian làm việc, bàn việc đất đai/tài sản tích lũy.',
  'Phu Thê': 'Dành thời gian hâm nóng tình cảm, trò chuyện sâu sắc hoặc gỡ nút thắt với bạn đời/đối tác.',
  'Phúc Đức': 'Thiền định, làm việc thiện, thăm hỏi họ hàng và tái tạo năng lượng tinh thần.',
  'Thiên Di': 'Thuận lợi xuất hành, gặp gỡ khách hàng bên ngoài, mở rộng mạng lưới xã giao.',
  'Nô Bộc': 'Hợp tác đội nhóm, kết nối cộng sự, nhờ cậy quý nhân hoặc đồng nghiệp hỗ trợ.',
  'Tử Tức': 'Gắn kết con cái, thúc đẩy ý tưởng sáng tạo hoặc ươm mầm dự án hợp tác mới.',
  'Tật Ách': 'Thăm khám sức khỏe định kỳ, điều chỉnh chế độ nghỉ ngơi và phục hồi thể lực.',
  'Phụ Mẫu': 'Xin lời khuyên từ bậc trưởng bối, hoàn tất thủ tục giấy tờ hành chính / chứng chỉ.',
  'Huynh Đệ': 'Trao đổi kế hoạch cùng anh chị em, bạn hữu thân tín hoặc điều phối nguồn lực nội bộ.',
};

const PALACE_CAUTION_GUIDANCE = {
  Mệnh: 'Tránh tự tạo áp lực tâm lý hoặc quyết định bốc đồng khi cảm xúc chưa lắng dịu.',
  'Quan Lộc': 'Rà soát kỹ điều khoản công việc, tránh tranh cãi trực diện với cấp trên hoặc đối tác.',
  'Tài Bạch': 'Lưu Nhật Hóa Kỵ nhập Tài Bạch: hạn chế cho vay mượn, đầu tư mạo hiểm hoặc chi khoản lớn ngoài kế hoạch.',
  'Điền Trạch': 'Kiểm tra kỹ giấy tờ nhà cửa/kho bãi, giữ hòa khí trong sinh hoạt gia đình.',
  'Phu Thê': 'Tránh lời nói nóng vội gây hiểu lầm với người thương; ưu tiên lắng nghe hơn hơn thua lý lẽ.',
  'Phúc Đức': 'Tránh suy nghĩ tiêu cực quá mức làm hao tổn tinh thần; không nên tính toán đường tắt mạo hiểm.',
  'Thiên Di': 'Lưu ý an toàn khi di chuyển đường xa và giữ thái độ mềm mỏng nơi đông người.',
  'Nô Bộc': 'Thận trọng khi ủy thác tiền bạc hoặc thông tin nhạy cảm cho người mới quen.',
  'Tử Tức': 'Kiên nhẫn với con trẻ/cấp dưới; tránh đầu tư dàn trải vào các dự án chưa rõ pháp lý.',
  'Tật Ách': 'Không nên thức khuya hoặc làm việc quá sức; chú ý hệ tiêu hóa và giấc ngủ.',
  'Phụ Mẫu': 'Kiểm tra kỹ hồ sơ giấy tờ pháp lý; quan tâm sức khỏe cha mẹ và người lớn tuổi.',
  'Huynh Đệ': 'Minh bạch chi phí khi chung đụng tiền bạc với bạn bè hoặc người thân.',
};

function formatIsoDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 2. Tính chi tiết 12 Canh Giờ Lưu Thời (`getLiuShiSiHua`) cho một ngày cụ thể trên lá số cá nhân
 */
export function buildDailyLiuShiHours(result, dayStemIndex, schoolConfig = {}) {
  if (!result || !Array.isArray(result.palates)) return [];
  const starLookup = buildStarToPalaceLookup(result);
  const coreAuspiciousPalaces = new Set(['Mệnh', 'Quan Lộc', 'Tài Bạch', 'Phúc Đức', 'Thiên Di', 'Điền Trạch']);
  const sensitiveCautionPalaces = new Set(['Mệnh', 'Tài Bạch', 'Quan Lộc', 'Tật Ách', 'Thiên Di']);

  return SHICHEN_WINDOWS.map((win) => {
    const liuShi = getLiuShiSiHua(dayStemIndex, win.branchIndex, schoolConfig);
    const locHit = starLookup.get(liuShi.transforms.Loc);
    const quyenHit = starLookup.get(liuShi.transforms.Quyen);
    const khoaHit = starLookup.get(liuShi.transforms.Khoa);
    const kyHit = starLookup.get(liuShi.transforms.Ky);

    let score = 0;
    if (locHit && coreAuspiciousPalaces.has(locHit.palaceName)) score += 2;
    else if (locHit) score += 1;

    if (quyenHit && coreAuspiciousPalaces.has(quyenHit.palaceName)) score += 1.5;
    if (khoaHit && coreAuspiciousPalaces.has(khoaHit.palaceName)) score += 1.5;

    if (kyHit && sensitiveCautionPalaces.has(kyHit.palaceName)) {
      score -= kyHit.satCount > 0 ? 3 : 2;
    } else if (kyHit) {
      score -= 1;
    }

    let status = 'binh';
    let statusLabel = 'Bình';
    if (score >= 2) {
      status = 'cat';
      statusLabel = 'Cát';
    } else if (score <= -1.5) {
      status = 'can_trong';
      statusLabel = 'Cẩn trọng';
    }

    return {
      branchIndex: win.branchIndex,
      branchName: win.branchName,
      timeRange: win.timeRange,
      canChiHour: `${liuShi.stemName} ${liuShi.branchName}`,
      status,
      statusLabel,
      score,
      locSummary: locHit ? `Lộc → ${locHit.palaceName}` : `Lộc (${liuShi.transforms.Loc})`,
      khoaQuyenSummary: khoaHit ? `Khoa → ${khoaHit.palaceName}` : quyenHit ? `Quyền → ${quyenHit.palaceName}` : '',
      kySummary: kyHit ? `Kỵ → ${kyHit.palaceName}` : `Kỵ (${liuShi.transforms.Ky})`,
    };
  });
}

/**
 * 3. Xây dựng Lịch 30 Ngày Lưu Nhật Cá Nhân Hóa (`getLiuRiSiHua` + `Solar.fromYmd().getLunar()`)
 */
export function buildThirtyDayLiuRiCalendar(
  result,
  inputData = {},
  {
    startDate = new Date(),
    daysCount = 30,
  } = {},
) {
  if (!result || !Array.isArray(result.palates) || result.palates.length !== 12) {
    return null;
  }

  const baseDate =
    typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate)
      ? new Date(`${startDate}T12:00:00`)
      : new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);

  const safeCount = Math.max(7, Math.min(42, Math.trunc(Number(daysCount) || 30)));
  const starLookup = buildStarToPalaceLookup(result);
  const schoolConfig = inputData?.schoolConfig || {};
  const corePalaces = new Set(['Mệnh', 'Quan Lộc', 'Tài Bạch', 'Điền Trạch', 'Phúc Đức', 'Thiên Di', 'Phu Thê']);
  const criticalKyPalaces = new Set(['Mệnh', 'Tài Bạch', 'Quan Lộc', 'Tật Ách', 'Thiên Di', 'Phu Thê']);

  const days = [];

  for (let i = 0; i < safeCount; i++) {
    const dObj = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i, 12, 0, 0);
    const sYear = dObj.getFullYear();
    const sMonth = dObj.getMonth() + 1;
    const sDay = dObj.getDate();
    const weekday = dObj.getDay(); // 0 = CN .. 6 = T7

    const solar = Solar.fromYmd(sYear, sMonth, sDay);
    const lunar = solar.getLunar();
    const lYear = lunar.getYear();
    const rawLunarMonth = lunar.getMonth();
    const isLeapMonth = rawLunarMonth < 0;
    const lMonth = Math.abs(rawLunarMonth);
    const lDay = lunar.getDay();

    const stemZh = lunar.getDayGan();
    const branchZh = lunar.getDayZhi();
    const dayStemIndex = Math.max(0, STEMS_ZH.indexOf(stemZh));
    const dayBranchIndex = Math.max(0, BRANCHES_ZH.indexOf(branchZh));
    const dayCanChi = `${THIEN_CAN[dayStemIndex]} ${DIA_CHI[dayBranchIndex]}`;

    const liuRi = getLiuRiSiHua(lYear, lMonth, lDay, isLeapMonth, schoolConfig) || {
      stemIndex: dayStemIndex,
      stemName: THIEN_CAN[dayStemIndex],
      transforms: {},
    };

    const locHit = starLookup.get(liuRi.transforms.Loc);
    const quyenHit = starLookup.get(liuRi.transforms.Quyen);
    const khoaHit = starLookup.get(liuRi.transforms.Khoa);
    const kyHit = starLookup.get(liuRi.transforms.Ky);

    const dayBranchPalace = result.palates.find((p) => p.chiIndex === dayBranchIndex);
    const dayBranchPalaceName = cleanPalaceName(dayBranchPalace?.chucNang);
    const dayBranchStars = [
      ...(dayBranchPalace?.chinhTinh || []),
      ...(dayBranchPalace?.phuTinh || []),
    ].map(stripStarName);
    const branchSatHits = dayBranchStars.filter((st) => SAT_TINH_SET.has(st));

    let dailyScore = 0;
    if (locHit && corePalaces.has(locHit.palaceName)) dailyScore += 2.2;
    else if (locHit) dailyScore += 1.0;

    if (quyenHit && corePalaces.has(quyenHit.palaceName)) dailyScore += 1.4;
    if (khoaHit && corePalaces.has(khoaHit.palaceName)) dailyScore += 1.5;

    if (kyHit && criticalKyPalaces.has(kyHit.palaceName)) {
      dailyScore -= kyHit.satCount > 0 ? 3.2 : 2.1;
    } else if (kyHit) {
      dailyScore -= 1.0;
    }

    if (branchSatHits.length >= 2) {
      dailyScore -= 1.1;
    } else if (dayBranchStars.includes('Hóa Lộc') || dayBranchStars.includes('Lộc Tồn')) {
      dailyScore += 0.8;
    }

    let status = 'binh';
    let statusLabel = 'Bình hòa';
    let shortBadge = 'Bình';
    if (dailyScore >= 1.8) {
      status = 'cat';
      statusLabel = 'Cát lợi';
      shortBadge = 'Cát';
    } else if (dailyScore <= -1.2) {
      status = 'can_trong';
      statusLabel = 'Cẩn trọng';
      shortBadge = 'Cẩn trọng';
    }

    const bestActivities = [];
    if (locHit && PALACE_FAVORABLE_GUIDANCE[locHit.palaceName]) {
      bestActivities.push(
        `Lưu Nhật Hóa Lộc (${liuRi.transforms.Loc}) chiếu cung ${locHit.palaceName}: ${PALACE_FAVORABLE_GUIDANCE[locHit.palaceName]}`,
      );
    }
    if (quyenHit && quyenHit.palaceName !== locHit?.palaceName && PALACE_FAVORABLE_GUIDANCE[quyenHit.palaceName]) {
      bestActivities.push(
        `Lưu Nhật Hóa Quyền (${liuRi.transforms.Quyen}) tại cung ${quyenHit.palaceName}: ${PALACE_FAVORABLE_GUIDANCE[quyenHit.palaceName]}`,
      );
    }
    if (khoaHit && khoaHit.palaceName !== locHit?.palaceName && PALACE_FAVORABLE_GUIDANCE[khoaHit.palaceName]) {
      bestActivities.push(
        `Lưu Nhật Hóa Khoa (${liuRi.transforms.Khoa}) tại cung ${khoaHit.palaceName}: ${PALACE_FAVORABLE_GUIDANCE[khoaHit.palaceName]}`,
      );
    }
    if (bestActivities.length === 0) {
      bestActivities.push('Xử lý công việc thường nhật theo kế hoạch sẵn có, duy trì nhịp sinh hoạt điều độ.');
    }

    const avoidActivities = [];
    if (kyHit && PALACE_CAUTION_GUIDANCE[kyHit.palaceName]) {
      avoidActivities.push(
        `${PALACE_CAUTION_GUIDANCE[kyHit.palaceName]} (do Lưu Nhật Hóa Kỵ tại ${liuRi.transforms.Ky} · cung ${kyHit.palaceName}${kyHit.satCount > 0 ? ', hội Sát tinh' : ''}).`,
      );
    }
    if (branchSatHits.length >= 2) {
      avoidActivities.push(
        `Cung ứng ngày (${dayBranchPalaceName} · ${DIA_CHI[dayBranchIndex]}) hội ${branchSatHits.slice(0, 3).join(', ')}: tránh quyết định nóng vội hoặc tranh luận gay gắt.`,
      );
    }
    if (avoidActivities.length === 0) {
      avoidActivities.push('Không có xung sát lớn; chỉ cần tránh ôm đồm quá nhiều đầu việc cùng lúc.');
    }

    const hours = buildDailyLiuShiHours(result, dayStemIndex, schoolConfig);
    const favorableHours = hours.filter((h) => h.status === 'cat');

    days.push({
      isoDate: formatIsoDate(dObj),
      solarDay: sDay,
      solarMonth: sMonth,
      solarYear: sYear,
      weekday,
      lunarDay: lDay,
      lunarMonth: lMonth,
      lunarYear: lYear,
      isLeapMonth,
      lunarLabel: `${lDay}/${lMonth}${isLeapMonth ? 'N' : ''}`,
      dayCanChi,
      dayStemIndex,
      dayBranchIndex,
      dayBranchPalaceName,
      status,
      statusLabel,
      shortBadge,
      dailyScore: Math.round(dailyScore * 10) / 10,
      sihua: {
        Loc: { star: liuRi.transforms.Loc || '—', palaceName: locHit?.palaceName || '—', chiName: locHit?.chiName || '' },
        Quyen: { star: liuRi.transforms.Quyen || '—', palaceName: quyenHit?.palaceName || '—', chiName: quyenHit?.chiName || '' },
        Khoa: { star: liuRi.transforms.Khoa || '—', palaceName: khoaHit?.palaceName || '—', chiName: khoaHit?.chiName || '' },
        Ky: { star: liuRi.transforms.Ky || '—', palaceName: kyHit?.palaceName || '—', chiName: kyHit?.chiName || '' },
      },
      bestActivities: bestActivities.slice(0, 3),
      avoidActivities: avoidActivities.slice(0, 2),
      hours,
      favorableHourLabels: favorableHours.slice(0, 4).map((h) => `Giờ ${h.branchName} (${h.timeRange})`),
    });
  }

  const summary = {
    catCount: days.filter((d) => d.status === 'cat').length,
    binhCount: days.filter((d) => d.status === 'binh').length,
    cautionCount: days.filter((d) => d.status === 'can_trong').length,
  };

  return {
    startDateIso: days[0]?.isoDate || '',
    endDateIso: days[days.length - 1]?.isoDate || '',
    days,
    summary,
  };
}

/**
 * 4. Xây dựng payload xuất lá số + điểm vận hạn + ngày tốt + checklist nghiệm lý sang NoteNow
 */
export function buildTuViNoteNowPayload({
  result,
  inputData = {},
  yunxianState = null,
  lifeEvents = [],
  referenceDate = new Date(),
} = {}) {
  if (!result || !Array.isArray(result.palates)) return null;

  const evalData = buildChartStarEvaluation(result, inputData, yunxianState);
  const timeline = buildTenYearTimelineModel(result, inputData, {
    windowMode: 'rolling',
    referenceYear: referenceDate.getFullYear(),
    lifeEvents,
  });
  const dailyCal = buildThirtyDayLiuRiCalendar(result, inputData, {
    startDate: referenceDate,
    daysCount: 14,
  });

  const name = inputData?.name || 'Đương số';
  const menhPalace = result.palates.find((p) => p.isMenh);
  const thanPalace = result.palates.find((p) => p.isThan);
  const menhStars = menhPalace?.chinhTinh?.join(', ') || 'Vô Chính Diệu';

  const summaryLines = [
    `Đương số: ${name} · ${result.amDuongNamNu} · Năm ${result.canChiNam} · Bản mệnh ${result.banMenhNapAm} · ${result.cucName}.`,
    `Trục cốt lõi: Mệnh tại ${result.menhCung} (${menhStars}) · Thân cư ${cleanPalaceName(thanPalace?.chucNang)} (${result.thanCung}).`,
  ];

  if (evalData?.overall) {
    summaryLines.push(
      `Đánh giá tổng thể (${evalData.overall.contextLabel}): ${evalData.overall.score}/5.0 sao (${evalData.overall.score100}/100 điểm · ${evalData.overall.tierLabel}).`,
    );
  }

  if (timeline?.peakYear && timeline?.defensiveYear) {
    summaryLines.push(
      `Quỹ đạo 10 năm tới: Năm thuận lợi bứt phá nhất là ${timeline.peakYear.year} (${timeline.peakYear.canChi} · ${timeline.peakYear.ratings.overall}★); năm cần giữ sức/phòng thủ là ${timeline.defensiveYear.year} (${timeline.defensiveYear.canChi} · ${timeline.defensiveYear.ratings.overall}★).`,
    );
  }

  const upcomingCatDays = (dailyCal?.days || [])
    .filter((d) => d.status === 'cat')
    .slice(0, 4)
    .map((d) => `${d.solarDay}/${d.solarMonth} (${d.dayCanChi})`);
  if (upcomingCatDays.length > 0) {
    summaryLines.push(`Ngày Cát cá nhân hóa gần nhất (14 ngày tới): ${upcomingCatDays.join(', ')}.`);
  }

  if (Array.isArray(lifeEvents) && lifeEvents.length > 0) {
    const pinnedText = lifeEvents
      .slice(0, 4)
      .map((ev) => `${ev.year}: ${ev.label || ev.note || ev.eventType}`)
      .join(' | ');
    summaryLines.push(`Mốc sự kiện thực tế đã ghim nghiệm lý: ${pinnedText}.`);
  }

  const topStrength = evalData?.overall?.topStrengths?.[0];
  const checklistItems = [
    topStrength
      ? `Phát huy trọng điểm mạnh nhất (${topStrength.name} · ${topStrength.stars}/5★) vào mục tiêu chính quý này.`
      : 'Rà soát mục tiêu trọng tâm theo thế mạnh cung Mệnh – Thân.',
    timeline?.peakYear
      ? `Chuẩn bị nguồn lực đón nhịp mở rộng năm ${timeline.peakYear.year} (${timeline.peakYear.canChi}) và dự phòng rủi ro năm ${timeline.defensiveYear?.year}.`
      : 'Đối chiếu kế hoạch tài chính & sự nghiệp với chu kỳ Lưu Niên hiện hành.',
    upcomingCatDays.length > 0
      ? `Ưu tiên xếp lịch ký kết / giao dịch quan trọng vào ngày Cát gần nhất (${upcomingCatDays.slice(0, 2).join(', ')}).`
      : 'Kiểm tra Lưu Nhật Hóa Kỵ trước các quyết định xuất tiền hoặc ký kết lớn.',
    'Cuối tháng ghi chú lại 1–2 sự kiện thực tế ứng nghiệm để hiệu chuẩn lá số.',
  ];

  return {
    title: `Tử Vi Nghiệm Lý — ${name} (${result.canChiNam} · ${result.cucName})`,
    sourceAppLabel: 'TuViNow',
    question: evalData?.overall?.contextLabel
      ? `Hồ sơ & Lộ trình Vận hạn (${evalData.overall.contextLabel})`
      : 'Tổng hợp Lá số Tử Vi & Checklist Nghiệm lý',
    summaryLines,
    checklistItems,
    tags: ['tuvinow', 'tu-vi', 'nghiem-ly', result.canChiNam],
  };
}
