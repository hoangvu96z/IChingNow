/**
 * birthRectifier.js — Động cơ Khảo Chứng & Định Giờ Sinh Khoa Học / Nghiệm Lý Thực Chứng
 *
 * Giải quyết bài toán sinh sát ranh giới canh giờ (06:50–07:10), nhớ khoảng rộng (5h–9h sáng),
 * hoặc sinh khoảng 23:00–00:59 (Giờ Tý Sớm 00:00–00:59 vs Giờ Tý Đêm 23:00–23:59 chuyển ngày / giữ ngày).
 * Hoàn toàn tất định (deterministic), minh bạch bằng chứng sao & cung vị, không hộp đen.
 */

import { Lunar, LunarMonth } from 'lunar-javascript';
import { anLaSoTuVi, DIA_CHI, THIEN_CAN } from './tuViEngine.js';
import { getDaXianSiHua, getLiuNianSiHua } from '../../../shared/src/utils/ziwei/sihua.js';
import { GIO_SINH_OPTIONS, solarToLunar, validateLunarDate, validateSolarDate } from './lunarConverter.js';

export const SHICHEN_LABELS = [
  { index: 0, branch: 'Tý', range: '23:00 – 01:00', shortRange: '23h–01h' },
  { index: 1, branch: 'Sửu', range: '01:00 – 03:00', shortRange: '01h–03h' },
  { index: 2, branch: 'Dần', range: '03:00 – 05:00', shortRange: '03h–05h' },
  { index: 3, branch: 'Mão', range: '05:00 – 07:00', shortRange: '05h–07h' },
  { index: 4, branch: 'Thìn', range: '07:00 – 09:00', shortRange: '07h–09h' },
  { index: 5, branch: 'Tỵ', range: '09:00 – 11:00', shortRange: '09h–11h' },
  { index: 6, branch: 'Ngọ', range: '11:00 – 13:00', shortRange: '11h–13h' },
  { index: 7, branch: 'Mùi', range: '13:00 – 15:00', shortRange: '13h–15h' },
  { index: 8, branch: 'Thân', range: '15:00 – 17:00', shortRange: '15h–17h' },
  { index: 9, branch: 'Dậu', range: '17:00 – 19:00', shortRange: '17h–19h' },
  { index: 10, branch: 'Tuất', range: '19:00 – 21:00', shortRange: '19h–21h' },
  { index: 11, branch: 'Hợi', range: '21:00 – 23:00', shortRange: '21h–23h' },
];

export const RECTIFIER_EVENT_TYPES = [
  {
    id: 'marriage',
    label: 'Kết hôn / Đính ước / Duyên lớn',
    icon: '💍',
    targetPalaces: ['Phu Thê', 'Mệnh', 'Phúc Đức', 'Tử Tức'],
    lnRotatedTargets: ['LN.Phu Thê', 'LN.Mệnh', 'LN.Phúc Đức', 'LN.Tử Tức'],
    keyStars: ['Đào Hoa', 'Hồng Loan', 'Thiên Hỷ', 'Tả Phụ', 'Hữu Bật', 'Thái Âm', 'Thái Dương', 'Tham Lang', 'Liêm Trinh'],
    favorableSihua: ['Hóa Lộc', 'Hóa Khoa', 'Hóa Quyền'],
    triggerSihua: ['Hóa Kỵ'],
  },
  {
    id: 'career_up',
    label: 'Thăng tiến / Đỗ đạt / Thành tựu lớn',
    icon: '🚀',
    targetPalaces: ['Quan Lộc', 'Mệnh', 'Tài Bạch', 'Thiên Di'],
    lnRotatedTargets: ['LN.Quan Lộc', 'LN.Mệnh', 'LN.Tài Bạch'],
    keyStars: ['Thiên Khôi', 'Thiên Việt', 'L.Thiên Khôi', 'L.Thiên Việt', 'Văn Xương', 'Văn Khúc', 'Quốc Ấn', 'Phong Cáo', 'Tử Vi', 'Thiên Phủ', 'Thái Dương', 'Vũ Khúc'],
    favorableSihua: ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa'],
    triggerSihua: [],
  },
  {
    id: 'career_change',
    label: 'Đổi việc / Chuyển ngành / Biến động sự nghiệp',
    icon: '🔄',
    targetPalaces: ['Quan Lộc', 'Thiên Di', 'Mệnh'],
    lnRotatedTargets: ['LN.Quan Lộc', 'LN.Thiên Di', 'LN.Mệnh'],
    keyStars: ['Thiên Mã', 'L.Thiên Mã', 'Phá Quân', 'Thất Sát', 'Tham Lang', 'Thiên Cơ', 'L.Kình Dương', 'L.Đà La'],
    favorableSihua: ['Hóa Quyền', 'Hóa Lộc'],
    triggerSihua: ['Hóa Kỵ'],
  },
  {
    id: 'wealth_gain',
    label: 'Phát tài / Mua nhà đất / Tăng thu nhập lớn',
    icon: '💰',
    targetPalaces: ['Tài Bạch', 'Điền Trạch', 'Mệnh', 'Phúc Đức'],
    lnRotatedTargets: ['LN.Tài Bạch', 'LN.Điền Trạch', 'LN.Mệnh'],
    keyStars: ['Lộc Tồn', 'L.Lộc Tồn', 'Vũ Khúc', 'Thái Âm', 'Thiên Phủ', 'Tham Lang', 'Hỏa Tinh', 'Linh Tinh'],
    favorableSihua: ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa'],
    triggerSihua: [],
  },
  {
    id: 'wealth_loss',
    label: 'Hao tài lớn / Thua lỗ / Vỡ kế hoạch tài chính',
    icon: '📉',
    targetPalaces: ['Tài Bạch', 'Điền Trạch', 'Tử Tức', 'Nô Bộc'],
    lnRotatedTargets: ['LN.Tài Bạch', 'LN.Điền Trạch', 'LN.Tử Tức'],
    keyStars: ['Địa Không', 'Địa Kiếp', 'Đại Hao', 'Tiểu Hao', 'Kình Dương', 'Đà La', 'L.Kình Dương', 'L.Đà La', 'Phá Quân'],
    favorableSihua: [],
    triggerSihua: ['Hóa Kỵ'],
  },
  {
    id: 'health_shock',
    label: 'Biến cố sức khỏe / Phẫu thuật / Tai nạn',
    icon: '🏥',
    targetPalaces: ['Tật Ách', 'Mệnh', 'Thiên Di'],
    lnRotatedTargets: ['LN.Tật Ách', 'LN.Mệnh', 'LN.Thiên Di'],
    keyStars: ['Kình Dương', 'Đà La', 'L.Kình Dương', 'L.Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Bạch Hổ', 'L.Bạch Hổ', 'Thiên Hình', 'Kiếp Sát'],
    favorableSihua: [],
    triggerSihua: ['Hóa Kỵ'],
  },
  {
    id: 'relocation_travel',
    label: 'Xuất ngoại / Chuyển chỗ ở / Đi xa lập nghiệp',
    icon: '✈️',
    targetPalaces: ['Thiên Di', 'Điền Trạch', 'Mệnh'],
    lnRotatedTargets: ['LN.Thiên Di', 'LN.Điền Trạch', 'LN.Mệnh'],
    keyStars: ['Thiên Mã', 'L.Thiên Mã', 'Phá Quân', 'Thiên Cơ', 'Thái Dương', 'Thiên Đồng'],
    favorableSihua: ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa'],
    triggerSihua: ['Hóa Kỵ'],
  },
  {
    id: 'family_bereavement',
    label: 'Tang chế / Biến cố lớn trong gia tộc',
    icon: '🕯️',
    targetPalaces: ['Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Huynh Đệ'],
    lnRotatedTargets: ['LN.Phụ Mẫu', 'LN.Phúc Đức', 'LN.Điền Trạch'],
    keyStars: ['Tang Môn', 'Bạch Hổ', 'L.Tang Môn', 'L.Bạch Hổ', 'Thiên Khốc', 'Thiên Hư', 'L.Thiên Khốc', 'L.Thiên Hư', 'Điếu Khách'],
    favorableSihua: [],
    triggerSihua: ['Hóa Kỵ'],
  },
];

export const RECTIFIER_EVENT_MAP = Object.fromEntries(
  RECTIFIER_EVENT_TYPES.map((item) => [item.id, item]),
);

function cleanPalaceName(chucNang) {
  return String(chucNang || '').replace(/\s*<THÂN>/g, '').trim();
}

function stripStarBrightness(star) {
  return String(star || '').split('(')[0].trim();
}

function getPalaceCleanStars(palace) {
  if (!palace) return { major: [], minor: [], all: [] };
  const major = (palace.chinhTinh || []).map(stripStarBrightness);
  const minor = (palace.phuTinh || []).map(stripStarBrightness);
  return {
    major,
    minor,
    all: [...major, ...minor],
  };
}

function findPalaceByName(chart, baseName) {
  return (chart?.palates || []).find((p) => cleanPalaceName(p.chucNang) === baseName) || null;
}

/**
 * Xây dựng danh sách 2–4 cấu hình giờ ứng viên để khảo chứng
 */
export function buildRectifierCandidateSpecs({
  baseHourIndex,
  currentHourIndex,
  preset = 'adjacent',
  customHourIndices = [],
  includeLateZiNextDay = true,
} = {}) {
  const effectiveBase = baseHourIndex ?? currentHourIndex ?? 0;
  const safeBase = ((Math.trunc(Number(effectiveBase) || 0) % 12) + 12) % 12;

  if (preset === 'zi_boundary') {
    return [
      {
        id: 'zi_early_same_day',
        hourIndex: 0,
        dayOffset: 0,
        label: 'Giờ Tý Sớm (00:00–00:59) · Giữ nguyên ngày',
        subtitle: 'Hoặc 23:00–23:59 theo phái giữ nguyên ngày sinh',
      },
      {
        id: 'zi_late_next_day',
        hourIndex: 0,
        dayOffset: 1,
        label: 'Giờ Tý Đêm (23:00–23:59) · Sang ngày kế tiếp',
        subtitle: 'Chuẩn phân đoạn Tý Chính: sau 23:00 tính sang ngày hôm sau',
      },
      {
        id: 'hoi_same_day',
        hourIndex: 11,
        dayOffset: 0,
        label: 'Giờ Hợi (21:00–23:00) · Sát trước 23h',
        subtitle: 'Phòng trường hợp đồng hồ sinh chạy nhanh vài phút',
      },
      {
        id: 'suu_same_day',
        hourIndex: 1,
        dayOffset: 0,
        label: 'Giờ Sửu (01:00–03:00) · Sát sau 01h',
        subtitle: 'Phòng trường hợp sinh rạng sáng sau 01:00',
      },
    ];
  }

  if (preset === 'custom' && Array.isArray(customHourIndices) && customHourIndices.length >= 2) {
    const unique = [];
    const seen = new Set();
    for (const raw of customHourIndices) {
      const idx = ((Math.trunc(Number(raw) || 0) % 12) + 12) % 12;
      if (!seen.has(idx)) {
        seen.add(idx);
        unique.push(idx);
      }
      if (unique.length >= 4) break;
    }

    const specs = unique.map((idx) => {
      const info = SHICHEN_LABELS[idx];
      return {
        id: `hour_${idx}_d0`,
        hourIndex: idx,
        dayOffset: 0,
        label: `Giờ ${info.branch} (${info.range})`,
        subtitle: idx === 0 ? 'Giờ Tý tính theo đúng ngày đang chọn' : 'Canh giờ tiêu chuẩn trong ngày',
      };
    });

    if (includeLateZiNextDay && unique.includes(0) && specs.length < 4) {
      specs.push({
        id: 'zi_late_next_day',
        hourIndex: 0,
        dayOffset: 1,
        label: 'Giờ Tý Đêm (23:00–23:59) · Sang ngày kế',
        subtitle: 'Sau 23:00 đổi sang ngày âm/dương kế tiếp',
      });
    }
    return specs.slice(0, 4);
  }

  // Mặc định: preset === 'adjacent'
  if (safeBase === 0) {
    return [
      {
        id: 'hoi_prev',
        hourIndex: 11,
        dayOffset: 0,
        label: 'Giờ Hợi (21:00–23:00) · Canh trước',
        subtitle: 'Canh giờ liền trước Giờ Tý',
      },
      {
        id: 'zi_early_same_day',
        hourIndex: 0,
        dayOffset: 0,
        label: 'Giờ Tý Sớm (00:00–00:59) · Giữ ngày',
        subtitle: 'Giờ Tý thuộc đúng ngày đang chọn',
      },
      {
        id: 'zi_late_next_day',
        hourIndex: 0,
        dayOffset: 1,
        label: 'Giờ Tý Đêm (23:00–23:59) · Sang ngày kế',
        subtitle: 'Sinh khoảng 23:00–23:59 chuyển sang ngày kế tiếp',
      },
      {
        id: 'suu_next',
        hourIndex: 1,
        dayOffset: 0,
        label: 'Giờ Sửu (01:00–03:00) · Canh sau',
        subtitle: 'Canh giờ liền sau Giờ Tý',
      },
    ];
  }

  const prevIdx = (safeBase + 11) % 12;
  const nextIdx = (safeBase + 1) % 12;
  return [
    {
      id: `adj_prev_${prevIdx}`,
      hourIndex: prevIdx,
      dayOffset: 0,
      label: `Giờ ${SHICHEN_LABELS[prevIdx].branch} (${SHICHEN_LABELS[prevIdx].range}) · Canh trước`,
      subtitle: 'Nếu sinh lệch sớm sang canh giờ liền trước',
    },
    {
      id: `adj_curr_${safeBase}`,
      hourIndex: safeBase,
      dayOffset: 0,
      label: `Giờ ${SHICHEN_LABELS[safeBase].branch} (${SHICHEN_LABELS[safeBase].range}) · Đang chọn`,
      subtitle: 'Canh giờ gốc đang nghi vấn',
    },
    {
      id: `adj_next_${nextIdx}`,
      hourIndex: nextIdx,
      dayOffset: 0,
      label: `Giờ ${SHICHEN_LABELS[nextIdx].branch} (${SHICHEN_LABELS[nextIdx].range}) · Canh sau`,
      subtitle: 'Nếu sinh lệch muộn sang canh giờ liền sau',
    },
  ];
}

/**
 * Quy đổi ngày sinh gốc + dayOffset (-1, 0, +1) sang dữ liệu đầu vào chuẩn cho anLaSoTuVi & BirthInputForm
 */
export function resolveCandidateBirthInput(baseInput, spec) {
  const {
    name = 'Đương số',
    day = 15,
    month = 1,
    year = 1990,
    gender = 1,
    isLunar = false,
    calendarType,
    isLeapMonth = false,
    isLeap = false,
    schoolConfig,
  } = baseInput || {};

  const effectiveIsLunar = calendarType ? calendarType === 'lunar' : Boolean(isLunar);
  const effectiveLeap = effectiveIsLunar ? Boolean(isLeapMonth || isLeap) : false;

  const hourIndex = ((Math.trunc(Number(spec?.hourIndex) || 0) % 12) + 12) % 12;
  const dayOffset = Math.trunc(Number(spec?.dayOffset) || 0);

  let solarYear;
  let solarMonth;
  let solarDay;

  if (effectiveIsLunar) {
    const lYear = Number(year);
    const lMonth = Number(month);
    const lDay = Number(day);
    let validLunar = false;
    if (effectiveLeap) {
      try {
        const lm = LunarMonth.fromYm(lYear, -Math.abs(lMonth));
        if (lm && typeof lm.getDayCount === 'function') {
          validLunar = Number.isInteger(lDay) && lDay >= 1 && lDay <= lm.getDayCount();
        } else {
          validLunar = validateLunarDate(lYear, lMonth, lDay);
        }
      } catch {
        validLunar = validateLunarDate(lYear, lMonth, lDay);
      }
    } else {
      validLunar = validateLunarDate(lYear, lMonth, lDay);
    }
    if (!validLunar) {
      throw new Error('Ngày âm lịch cơ sở không hợp lệ để khảo giờ sinh.');
    }
    let lunarObj;
    try {
      lunarObj = Lunar.fromYmd(lYear, effectiveLeap ? -Math.abs(lMonth) : Math.abs(lMonth), lDay);
    } catch {
      lunarObj = Lunar.fromYmd(lYear, Math.abs(lMonth), lDay);
    }
    const baseSolar = lunarObj.getSolar();
    const shiftedDate = new Date(baseSolar.getYear(), baseSolar.getMonth() - 1, baseSolar.getDay() + dayOffset);
    solarYear = shiftedDate.getFullYear();
    solarMonth = shiftedDate.getMonth() + 1;
    solarDay = shiftedDate.getDate();
  } else {
    const sYear = Number(year);
    const sMonth = Number(month);
    const sDay = Number(day);
    if (!validateSolarDate(sYear, sMonth, sDay)) {
      throw new Error('Ngày dương lịch cơ sở không hợp lệ để khảo giờ sinh.');
    }
    const shiftedDate = new Date(sYear, sMonth - 1, sDay + dayOffset);
    solarYear = shiftedDate.getFullYear();
    solarMonth = shiftedDate.getMonth() + 1;
    solarDay = shiftedDate.getDate();
  }

  const lunarData = solarToLunar(solarYear, solarMonth, solarDay);
  const cleanName = (name || '').trim() || 'Đương số';
  const resolvedPatchLeap = effectiveIsLunar ? Boolean(lunarData.isLeap) : false;

  const engineInput = {
    name: cleanName,
    ...lunarData,
    lunarHourIndex: hourIndex,
    gender: Number(gender) === 0 ? 0 : 1,
    calendarType: effectiveIsLunar ? 'lunar' : 'solar',
    isLunar: effectiveIsLunar,
    isLeapMonth: resolvedPatchLeap,
    solarInput: effectiveIsLunar ? null : { day: solarDay, month: solarMonth, year: solarYear },
    ...(schoolConfig ? { schoolConfig } : {}),
  };

  const formPatch = {
    name: cleanName,
    day: effectiveIsLunar ? lunarData.lunarDay : solarDay,
    month: effectiveIsLunar ? lunarData.lunarMonth : solarMonth,
    year: effectiveIsLunar ? lunarData.lunarYear : solarYear,
    calendarType: effectiveIsLunar ? 'lunar' : 'solar',
    isLunar: effectiveIsLunar,
    isLeap: resolvedPatchLeap,
    isLeapMonth: resolvedPatchLeap,
    hourIndex,
    gender: Number(gender) === 0 ? 0 : 1,
    dayOffsetApplied: dayOffset,
    hourLabel: GIO_SINH_OPTIONS[hourIndex]?.label || `Giờ ${DIA_CHI[hourIndex]}`,
  };

  return { engineInput, formPatch };
}

/**
 * Trích xuất các dấu hiệu thực chứng (Empirical Trait Signatures) từ lá số ứng viên:
 * 1) Tính khí, diện mạo & cơ địa (Mệnh + Thân + Tật Ách)
 * 2) Gia cảnh Cha Mẹ & Anh Chị Em (Phụ Mẫu + Huynh Đệ)
 */
export function extractEmpiricalTraits(chart, candidateId = 'cand') {
  if (!chart || !Array.isArray(chart.palates)) {
    return { menhThanTat: [], family: [], all: [] };
  }

  const menhPalace = findPalaceByName(chart, 'Mệnh') || chart.palates.find((p) => p.isMenh);
  const thanPalace = chart.palates.find((p) => p.isThan) || menhPalace;
  const thienDiPalace = findPalaceByName(chart, 'Thiên Di');
  const tatAchPalace = findPalaceByName(chart, 'Tật Ách');
  const phuMauPalace = findPalaceByName(chart, 'Phụ Mẫu');
  const huynhDePalace = findPalaceByName(chart, 'Huynh Đệ');

  const menhStars = getPalaceCleanStars(menhPalace);
  const thanStars = getPalaceCleanStars(thanPalace);
  const diStars = getPalaceCleanStars(thienDiPalace);
  const tatStars = getPalaceCleanStars(tatAchPalace);
  const phuMauStars = getPalaceCleanStars(phuMauPalace);
  const huynhDeStars = getPalaceCleanStars(huynhDePalace);

  const menhThanTat = [];
  const family = [];

  // --- 1A. Chính Tinh tọa Mệnh ---
  const mMajor = menhStars.major;
  if (mMajor.length === 0) {
    const borrowed = diStars.major.length ? diStars.major.join(', ') : 'Chính tinh đối cung';
    menhThanTat.push({
      id: `${candidateId}::menh_vcd`,
      category: 'menh_than_tat',
      title: 'Tâm thế linh hoạt, nhạy bén thích nghi hoàn cảnh',
      description: `Mệnh Vô Chính Diệu (mượn ${borrowed} từ Thiên Di): giỏi đọc tình huống, mềm dẻo ứng biến, ra ngoài xã hội mới bộc lộ hết năng lực.`,
      evidence: `Mệnh tại ${menhPalace?.chiName} Vô Chính Diệu · Xung chiếu ${borrowed}`,
    });
  } else {
    if (mMajor.some((s) => s === 'Tử Vi' || s === 'Thiên Phủ')) {
      menhThanTat.push({
        id: `${candidateId}::menh_tu_phu`,
        category: 'menh_than_tat',
        title: 'Khí chất đĩnh đạc, tự trọng cao, thích tự chủ & quản lý',
        description: 'Phong thái chững chạc, có xu hướng bao quát, trọng danh dự và không thích bị kiểm soát vụn vặt.',
        evidence: `Mệnh tại ${menhPalace?.chiName} tọa ${mMajor.join(', ')}`,
      });
    }
    if (mMajor.some((s) => s === 'Thất Sát' || s === 'Phá Quân' || s === 'Tham Lang')) {
      menhThanTat.push({
        id: `${candidateId}::menh_sat_pha_tham`,
        category: 'menh_than_tat',
        title: 'Cá tính quyết liệt, ưa hành động & đổi mới (Sát Phá Tham)',
        description: 'Dám nghĩ dám làm, phản ứng nhanh trước biến động; thời nhỏ hiếu động, dễ có sẹo nhỏ hoặc va chạm thể chất.',
        evidence: `Mệnh tại ${menhPalace?.chiName} thuộc cách Sát Phá Tham (${mMajor.join(', ')})`,
      });
    }
    if (mMajor.some((s) => ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'].includes(s))) {
      menhThanTat.push({
        id: `${candidateId}::menh_co_nguyet_dong_luong`,
        category: 'menh_than_tat',
        title: 'Điềm đạm, sâu sắc, thiên về tư duy kế hoạch & chuyên môn',
        description: 'Ứng xử ôn hòa, chu đáo, giàu suy tư nội tâm hoặc có duyên làm tham mưu, giáo dục, kỹ thuật, chăm sóc.',
        evidence: `Mệnh tại ${menhPalace?.chiName} tọa ${mMajor.join(', ')}`,
      });
    }
    if (mMajor.some((s) => s === 'Cự Môn' || s === 'Thái Dương')) {
      menhThanTat.push({
        id: `${candidateId}::menh_cu_nhat`,
        category: 'menh_than_tat',
        title: 'Tư duy phản biện rõ ràng, mạnh về ngôn từ & lý lẽ',
        description: 'Thẳng thắn, trọng lý lẽ, có khả năng thuyết phục, giảng giải, ngoại ngữ hoặc làm việc với công chúng.',
        evidence: `Mệnh tại ${menhPalace?.chiName} tọa ${mMajor.join(', ')}`,
      });
    }
    if (mMajor.some((s) => s === 'Vũ Khúc' || s === 'Liêm Trinh' || s === 'Thiên Tướng')) {
      menhThanTat.push({
        id: `${candidateId}::menh_vu_liem_tuong`,
        category: 'menh_than_tat',
        title: 'Thực tế, nguyên tắc rõ ràng, trọng chữ tín & hiệu quả',
        description: 'Làm việc có kỷ luật, nhạy bén tài chính hoặc quy trình tổ chức, ghét sự mập mờ thất hứa.',
        evidence: `Mệnh tại ${menhPalace?.chiName} tọa ${mMajor.join(', ')}`,
      });
    }
  }

  // --- 1B. Phụ tinh Mệnh / Thân / Tật Ách (Cơ địa & Khí chất phụ trợ) ---
  const menhTatCombined = new Set([...menhStars.minor, ...tatStars.minor, ...tatStars.major]);
  const menhThanMinor = new Set([...menhStars.minor, ...thanStars.minor]);

  const satMarkers = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Thiên Hình'].filter(
    (s) => menhTatCombined.has(s),
  );
  if (satMarkers.length > 0) {
    menhThanTat.push({
      id: `${candidateId}::co_dia_sat_hinh`,
      category: 'menh_than_tat',
      title: 'Cơ địa nhạy cảm, từng có vết sẹo/tiểu phẫu hoặc hay căng thẳng thần kinh – tiêu hóa',
      description: 'Mệnh/Tật Ách hội Sát – Hình tinh: cơ thể phản ứng nhanh khi thức khuya, áp lực hoặc từng khâu/mổ nhỏ.',
      evidence: `Mệnh/Tật Ách có ${satMarkers.slice(0, 4).join(', ')}`,
    });
  } else {
    menhThanTat.push({
      id: `${candidateId}::co_dia_binh_on`,
      category: 'menh_than_tat',
      title: 'Thể trạng nền tương đối lành, ít va chạm phẫu thuật lớn thuở nhỏ',
      description: 'Mệnh và Tật Ách ít Sát Hình tinh xâm phạm trực diện, khi ốm dễ gặp thầy gặp thuốc hồi phục.',
      evidence: `Tật Ách tại ${tatAchPalace?.chiName} (${tatStars.major.join(', ') || 'Vô Chính Diệu'})`,
    });
  }

  const vanDaoMarkers = ['Văn Xương', 'Văn Khúc', 'Hóa Khoa', 'Thiên Khôi', 'Thiên Việt', 'Đào Hoa', 'Hồng Loan'].filter(
    (s) => menhThanMinor.has(s),
  );
  if (vanDaoMarkers.length > 0) {
    menhThanTat.push({
      id: `${candidateId}::khi_chat_van_dao`,
      category: 'menh_than_tat',
      title: 'Có khiếu thẩm mỹ, học thuật hoặc dễ tạo thiện cảm xã giao',
      description: 'Mệnh/Thân hội Văn tinh hoặc Đào Hồng Khôi Việt: sáng dạ, tinh tế, có duyên ăn nói hoặc nghệ thuật.',
      evidence: `Mệnh/Thân hội ${vanDaoMarkers.join(', ')}`,
    });
  }

  // Hướng hậu vận theo cung an Thân
  const thanRole = cleanPalaceName(thanPalace?.chucNang);
  const thanDescMap = {
    Mệnh: 'Tự thân định đoạt mạnh mẽ, tính cách trước sau nhất quán.',
    'Quan Lộc': 'Sau tuổi 30 tâm trí dồn mạnh cho sự nghiệp, danh vị và trách nhiệm công việc.',
    'Tài Bạch': 'Sau tuổi 30 rất thực tế về dòng tiền, tích lũy tài chính và giá trị kinh tế.',
    'Phu Thê': 'Sau tuổi 30 gia đình, hôn nhân và người bạn đời ảnh hưởng rất lớn tới mọi quyết định.',
    'Thiên Di': 'Hay đi xa, đổi môi trường sống/làm việc hoặc phát triển mạnh ở bên ngoài xã hội.',
    'Phúc Đức': 'Trọng đời sống tinh thần, nhân quả, cội nguồn gia tộc và sự bình an nội tâm.',
  };
  if (thanRole && thanDescMap[thanRole]) {
    menhThanTat.push({
      id: `${candidateId}::than_cu_${thanRole}`,
      category: 'menh_than_tat',
      title: `Xu hướng trung vận (Thân cư ${thanRole})`,
      description: thanDescMap[thanRole],
      evidence: `Thân cư ${thanRole} tại ${thanPalace?.chiName}`,
    });
  }

  // --- 2. Gia cảnh Cha Mẹ & Anh Chị Em (Phụ Mẫu + Huynh Đệ) ---
  const distanceStars = [
    'Hóa Kỵ',
    'Địa Không',
    'Địa Kiếp',
    'Kình Dương',
    'Đà La',
    'Cô Thần',
    'Quả Tú',
    'Tang Môn',
    'Bạch Hổ',
    'Thiên Hình',
  ];
  const supportStars = [
    'Hóa Lộc',
    'Hóa Quyền',
    'Hóa Khoa',
    'Lộc Tồn',
    'Tả Phụ',
    'Hữu Bật',
    'Thiên Khôi',
    'Thiên Việt',
    'Ân Quang',
    'Thiên Quý',
  ];

  const phuMauDist = distanceStars.filter((s) => phuMauStars.all.includes(s));
  const phuMauSupp = supportStars.filter((s) => phuMauStars.all.includes(s));

  if (phuMauDist.length > 0 || phuMauPalace?.isTriet || phuMauPalace?.isTuan) {
    const markers = [
      ...phuMauDist,
      ...(phuMauPalace?.isTriet ? ['Triệt'] : []),
      ...(phuMauPalace?.isTuan ? ['Tuần'] : []),
    ];
    family.push({
      id: `${candidateId}::phu_mau_xa_cach`,
      category: 'phu_mau_huynh_de',
      title: 'Sớm tự lập, sống xa cha mẹ hoặc có khoảng cách quan điểm thế hệ',
      description: 'Cung Phụ Mẫu có dấu hiệu khắc khẩu/khác biệt tư duy, sống xa nhà sớm hoặc cha mẹ vất vả sức khỏe.',
      evidence: `Phụ Mẫu (${phuMauPalace?.chiName}) có ${markers.join(', ')}`,
    });
  }
  if (phuMauSupp.length > 0 && phuMauDist.length === 0 && !phuMauPalace?.isTriet) {
    family.push({
      id: `${candidateId}::phu_mau_tro_luc`,
      category: 'phu_mau_huynh_de',
      title: 'Cha mẹ hòa thuận, có nền nếp nâng đỡ tinh thần hoặc học vấn',
      description: 'Cung Phụ Mẫu hội Cát tinh / Khoa Lộc Quyền: nhận được sự dạy dỗ hoặc hậu thuẫn đáng kể từ song thân.',
      evidence: `Phụ Mẫu (${phuMauPalace?.chiName}) hội ${phuMauSupp.join(', ')}`,
    });
  }
  if (family.length === 0) {
    family.push({
      id: `${candidateId}::phu_mau_binh_hoa`,
      category: 'phu_mau_huynh_de',
      title: 'Quan hệ với cha mẹ bình hòa, nề nếp ổn định nhưng tự lực là chính',
      description: 'Cha mẹ chăm lo vừa sức, trưởng thành chủ yếu tự gây dựng sự nghiệp riêng.',
      evidence: `Phụ Mẫu (${phuMauPalace?.chiName}): ${phuMauStars.major.join(', ') || 'Vô Chính Diệu'}`,
    });
  }

  const huynhDeDist = distanceStars.filter((s) => huynhDeStars.all.includes(s));
  const huynhDeSupp = supportStars.filter((s) => huynhDeStars.all.includes(s));

  if (huynhDeDist.length > 0 || huynhDePalace?.isTriet) {
    const markers = [...huynhDeDist, ...(huynhDePalace?.isTriet ? ['Triệt'] : [])];
    family.push({
      id: `${candidateId}::huynh_de_doc_lap`,
      category: 'phu_mau_huynh_de',
      title: 'Anh chị em ít người, ở xa nhau hoặc mỗi người một chí hướng độc lập',
      description: 'Cung Huynh Đệ có sao phân tán/khắc chế: anh chị em tự lập sớm, ít làm ăn chung lâu dài.',
      evidence: `Huynh Đệ (${huynhDePalace?.chiName}) có ${markers.join(', ')}`,
    });
  } else if (huynhDeSupp.length > 0) {
    family.push({
      id: `${candidateId}::huynh_de_hoa_thuan`,
      category: 'phu_mau_huynh_de',
      title: 'Anh chị em/bạn hữu thân cận hòa thuận, có người thành đạt hỗ trợ',
      description: 'Cung Huynh Đệ hội Cát hóa / Phụ Bật: dễ thương lượng, giúp đỡ nhau khi hữu sự.',
      evidence: `Huynh Đệ (${huynhDePalace?.chiName}) hội ${huynhDeSupp.join(', ')}`,
    });
  } else {
    family.push({
      id: `${candidateId}::huynh_de_binh_thuong`,
      category: 'phu_mau_huynh_de',
      title: 'Anh chị em giao hảo bình thường, ai giữ nếp nhà người nấy',
      description: 'Quan hệ anh chị em ổn định, tôn trọng đời sống riêng của nhau.',
      evidence: `Huynh Đệ (${huynhDePalace?.chiName}): ${huynhDeStars.major.join(', ') || 'Vô Chính Diệu'}`,
    });
  }

  return {
    menhPalaceName: menhPalace?.chiName || '',
    menhThanTat,
    family,
    all: [...menhThanTat, ...family],
  };
}

/**
 * Chấm điểm đối chiếu các mốc sự kiện quá khứ (Historical Event Backtesting) trên một lá số ứng viên
 */
export function scoreCandidateWithPastEvents(candidate, pastEvents = [], schoolConfig = {}) {
  const validEvents = (Array.isArray(pastEvents) ? pastEvents : []).filter((ev) => {
    const y = Number(ev?.year);
    return Number.isInteger(y) && y >= 1900 && y <= 2100 && RECTIFIER_EVENT_MAP[ev?.eventType];
  });

  if (!candidate?.chart || validEvents.length === 0) {
    return {
      hasEvents: false,
      eventCount: 0,
      eventScore: 50,
      eventBreakdown: [],
      evidenceBullets: [],
    };
  }

  const birthLunarYear = Number(candidate.engineInput?.lunarYear || 1990);
  const eventBreakdown = [];
  const allEvidenceBullets = [];

  for (const ev of validEvents) {
    const year = Number(ev.year);
    const meta = RECTIFIER_EVENT_MAP[ev.eventType];
    if (year < birthLunarYear) {
      eventBreakdown.push({
        year,
        eventType: ev.eventType,
        label: meta.label,
        score: 20,
        reasons: [`Năm ${year} trước năm sinh âm lịch (${birthLunarYear}) nên không tính ứng kỳ.`],
      });
      continue;
    }

    const viewYearCanIndex = ((year - 4) % 10 + 10) % 10;
    const viewYearChiIndex = ((year - 4) % 12 + 12) % 12;
    const yearCanChi = `${THIEN_CAN[viewYearCanIndex]} ${DIA_CHI[viewYearChiIndex]}`;
    const tuoiAm = year - birthLunarYear + 1;

    let annualChart = candidate.chart;
    try {
      annualChart = anLaSoTuVi({
        ...candidate.engineInput,
        viewYear: year,
        viewYearCanIndex,
        viewYearChiIndex,
      });
    } catch {
      annualChart = candidate.chart;
    }

    const palates = annualChart.palates || [];
    const liuNianPalace = palates.find((p) => p.chiIndex === viewYearChiIndex);
    const tieuHanPalace = palates.find((p) => p.isTieuHan);
    const activeDaXian = palates.find((p) => p.daiHan <= tuoiAm && tuoiAm < p.daiHan + 10) || null;
    const lnSiHua = getLiuNianSiHua(year, schoolConfig);
    const dxSiHua = activeDaXian ? getDaXianSiHua(annualChart, { chiIndex: activeDaXian.chiIndex }, schoolConfig) : null;

    // Tam phương tứ chính của Lưu Thái Tuế (Lưu Niên Mệnh)
    const lnTptcIndices = new Set([
      viewYearChiIndex,
      (viewYearChiIndex + 4) % 12,
      (viewYearChiIndex + 8) % 12,
      (viewYearChiIndex + 6) % 12,
    ]);

    let rawPoints = 22; // Nền cơ sở
    const reasons = [];

    // 1. Cung Lưu Niên Thái Tuế trùng hoặc hội chiếu đúng Cung chủ sự gốc
    const lnNatalRole = cleanPalaceName(liuNianPalace?.chucNang);
    if (meta.targetPalaces[0] === lnNatalRole) {
      rawPoints += 28;
      reasons.push(
        `Năm ${year} (${yearCanChi}): Lưu Thái Tuế nhập thẳng cung gốc ${lnNatalRole} (${liuNianPalace?.chiName}) — đúng trọng tâm ${meta.label.toLowerCase()}.`,
      );
    } else if (meta.targetPalaces.includes(lnNatalRole)) {
      rawPoints += 18;
      reasons.push(
        `Năm ${year} (${yearCanChi}): Lưu Niên Mệnh đóng tại cung ${lnNatalRole} (${liuNianPalace?.chiName}), kích hoạt trực tiếp trục sự kiện.`,
      );
    } else {
      const hitInTptc = palates.find(
        (p) => lnTptcIndices.has(p.chiIndex) && cleanPalaceName(p.chucNang) === meta.targetPalaces[0],
      );
      if (hitInTptc) {
        rawPoints += 12;
        reasons.push(
          `Năm ${year} (${yearCanChi}): Tam phương tứ chính Lưu Thái Tuế hội chiếu cung ${meta.targetPalaces[0]} (${hitInTptc.chiName}).`,
        );
      }
    }

    // 2. Tiểu Hạn nhập đúng cung chủ sự
    const tieuHanRole = cleanPalaceName(tieuHanPalace?.chucNang);
    if (tieuHanPalace && meta.targetPalaces.includes(tieuHanRole)) {
      rawPoints += 16;
      reasons.push(
        `Tiểu Hạn ${tuoiAm} tuổi nhập cung ${tieuHanRole} (${tieuHanPalace.chiName}), ứng động nội cảnh năm ${year}.`,
      );
    }

    // 3. Đại Hạn 10 năm đang hành vận qua cung chủ sự hoặc Tứ Hóa Đại Hạn kích hoạt
    if (activeDaXian) {
      const dxRole = cleanPalaceName(activeDaXian.chucNang);
      if (meta.targetPalaces.includes(dxRole)) {
        rawPoints += 12;
        reasons.push(
          `Đại Hạn ${activeDaXian.daiHan}–${activeDaXian.daiHan + 9} tuổi đi qua cung ${dxRole} (${activeDaXian.chiName}), mở nền vận cho biến chuyển.`,
        );
      }
      if (dxSiHua?.transforms) {
        for (const shType of [...meta.favorableSihua, ...meta.triggerSihua]) {
          const star = dxSiHua.transforms[shType];
          const hitPalace = star
            ? palates.find((p) => getPalaceCleanStars(p).all.includes(star))
            : null;
          const hitRole = cleanPalaceName(hitPalace?.chucNang);
          if (hitPalace && meta.targetPalaces.includes(hitRole)) {
            rawPoints += 10;
            reasons.push(
              `Đại Hạn phi ${shType} (${star}) nhập cung ${hitRole} (${hitPalace.chiName}).`,
            );
            break;
          }
        }
      }
    }

    // 4. Lưu Niên Tứ Hóa (getLiuNianSiHua) đánh trúng cung chủ sự gốc hoặc cung xoay Lưu Niên (LN.*)
    if (lnSiHua?.transforms) {
      const relevantTransforms = [
        ...meta.favorableSihua.map((sh) => ({ sh, weight: 22 })),
        ...meta.triggerSihua.map((sh) => ({ sh, weight: 24 })),
      ];
      for (const { sh, weight } of relevantTransforms) {
        const star = lnSiHua.transforms[sh];
        if (!star) continue;
        const starPalace = palates.find((p) => getPalaceCleanStars(p).all.includes(star));
        if (!starPalace) continue;
        const natalRole = cleanPalaceName(starPalace.chucNang);
        const lnRole = String(starPalace.luuNienChucNang || '').trim();
        const oppPalace = palates.find((p) => p.chiIndex === (starPalace.chiIndex + 6) % 12);
        const oppRole = cleanPalaceName(oppPalace?.chucNang);

        if (meta.targetPalaces.includes(natalRole) || meta.lnRotatedTargets.includes(lnRole)) {
          rawPoints += weight;
          const roleTag = meta.lnRotatedTargets.includes(lnRole) && !meta.targetPalaces.includes(natalRole)
            ? `${natalRole} (${lnRole})`
            : natalRole;
          reasons.push(
            `Lưu Niên Can ${lnSiHua.stemName} hóa ${sh} tại sao ${star} nhập thẳng cung ${roleTag} (${starPalace.chiName}).`,
          );
        } else if (sh === 'Hóa Kỵ' && meta.targetPalaces.includes(oppRole)) {
          rawPoints += Math.round(weight * 0.75);
          reasons.push(
            `Lưu Niên Hóa Kỵ (${star} tại ${starPalace.chiName}) xung chiếu thẳng cung ${oppRole} (${oppPalace?.chiName}).`,
          );
        }
      }
    }

    // 5. Bộ sao chuyên biệt (Đào Hồng Hỷ / Mã / Khôi Việt / Tang Hổ / Không Kiếp / Kình Đà...) hội tại cung Lưu Niên hoặc Cung chủ sự
    const focusPalaces = palates.filter(
      (p) =>
        p.chiIndex === viewYearChiIndex ||
        cleanPalaceName(p.chucNang) === meta.targetPalaces[0] ||
        (tieuHanPalace && p.chiIndex === tieuHanPalace.chiIndex),
    );
    const matchedSpecialStars = new Set();
    for (const fp of focusPalaces) {
      const stars = getPalaceCleanStars(fp).all;
      for (const ks of meta.keyStars) {
        if (stars.includes(ks)) matchedSpecialStars.add(`${ks} (${cleanPalaceName(fp.chucNang)})`);
      }
    }
    if (matchedSpecialStars.size > 0) {
      const starBonus = Math.min(20, matchedSpecialStars.size * 7);
      rawPoints += starBonus;
      reasons.push(
        `Hội tín hiệu sao chuyên biệt: ${Array.from(matchedSpecialStars).slice(0, 3).join(', ')}.`,
      );
    }

    const clampedScore = Math.max(15, Math.min(99, Math.round(rawPoints)));
    if (reasons.length === 0) {
      reasons.push(
        `Năm ${year} (${yearCanChi}): cung ${meta.targetPalaces[0]} ít chịu xung động trực diện từ Lưu Thái Tuế và Lưu Tứ Hóa.`,
      );
    }

    eventBreakdown.push({
      year,
      eventType: ev.eventType,
      label: meta.label,
      icon: meta.icon,
      note: ev.note || '',
      score: clampedScore,
      reasons,
    });

    allEvidenceBullets.push(...reasons.slice(0, 2));
  }

  const avgScore = Math.round(
    eventBreakdown.reduce((sum, item) => sum + item.score, 0) / eventBreakdown.length,
  );

  return {
    hasEvents: true,
    eventCount: eventBreakdown.length,
    eventScore: avgScore,
    eventBreakdown,
    evidenceBullets: allEvidenceBullets,
  };
}

/**
 * Sinh các lá số ứng viên, trích xuất đặc trưng thực chứng và xếp hạng độ khớp nghiệm lý (0–100%)
 */
export function evaluateBirthRectification({
  baseInput,
  preset = 'adjacent',
  candidateSpecs = null,
  customHourIndices = [],
  includeLateZiNextDay = true,
  selectedTraitIds = [],
  pastEvents = [],
} = {}) {
  const specs =
    Array.isArray(candidateSpecs) && candidateSpecs.length >= 2
      ? candidateSpecs.slice(0, 4)
      : buildRectifierCandidateSpecs({
          baseHourIndex: baseInput?.hourIndex ?? baseInput?.lunarHourIndex ?? 0,
          preset,
          customHourIndices,
          includeLateZiNextDay,
        });

  const selectedSet = new Set(Array.isArray(selectedTraitIds) ? selectedTraitIds : []);

  const candidates = specs.map((spec) => {
    const { engineInput, formPatch } = resolveCandidateBirthInput(baseInput, spec);
    const chart = anLaSoTuVi(engineInput);
    const traits = extractEmpiricalTraits(chart, spec.id);
    const matchedTraits = traits.all.filter((t) => selectedSet.has(t.id));
    const totalTraits = Math.max(1, traits.all.length);
    const traitRatio = matchedTraits.length / totalTraits;
    const traitScore = selectedSet.size > 0 ? Math.min(98, Math.round(32 + traitRatio * 68)) : 50;

    const eventEval = scoreCandidateWithPastEvents(
      { chart, engineInput },
      pastEvents,
      baseInput?.schoolConfig,
    );

    const hasTraitInput = selectedSet.size > 0;
    const hasEventInput = eventEval.hasEvents;

    let matchScore = 50;
    if (hasTraitInput && hasEventInput) {
      matchScore = Math.round(traitScore * 0.42 + eventEval.eventScore * 0.58);
    } else if (hasEventInput) {
      matchScore = eventEval.eventScore;
    } else if (hasTraitInput) {
      matchScore = traitScore;
    }

    const menhPalace = findPalaceByName(chart, 'Mệnh') || chart.palates.find((p) => p.isMenh);
    const thanPalace = chart.palates.find((p) => p.isThan);
    const menhMajorText =
      menhPalace?.chinhTinh?.length > 0 ? menhPalace.chinhTinh.join(', ') : 'Vô Chính Diệu';

    const summaryBullets = [
      ...matchedTraits.map((t) => `✓ Khớp đặc điểm thực tế: ${t.title} (${t.evidence})`),
      ...eventEval.evidenceBullets,
    ];
    if (summaryBullets.length === 0) {
      summaryBullets.push(
        `Mệnh đóng tại ${chart.menhCung} (${menhMajorText}), Thân cư ${cleanPalaceName(thanPalace?.chucNang)} (${chart.thanCung}), ${chart.cucName}. Hãy tích chọn đặc điểm thực tế hoặc thêm năm sự kiện quá khứ để phân hóa điểm khớp.`,
      );
    }

    let confidenceLabel = 'Chờ dữ kiện đối chiếu';
    if (hasTraitInput || hasEventInput) {
      if (matchScore >= 78) confidenceLabel = 'Độ khớp cao';
      else if (matchScore >= 60) confidenceLabel = 'Khá tương hợp';
      else confidenceLabel = 'Ít dấu hiệu trùng khớp';
    }

    return {
      id: spec.id,
      label: spec.label,
      subtitle: spec.subtitle || '',
      hourIndex: spec.hourIndex,
      hourBranchName: DIA_CHI[spec.hourIndex],
      dayOffset: spec.dayOffset || 0,
      engineInput,
      formPatch,
      chart,
      menhSummary: `Mệnh ${chart.menhCung} (${menhMajorText})`,
      thanSummary: `Thân cư ${cleanPalaceName(thanPalace?.chucNang)} (${chart.thanCung})`,
      cucSummary: `${chart.cucName} · ${chart.banMenhNapAm}`,
      traits,
      matchedTraitCount: matchedTraits.length,
      traitScore,
      eventEval,
      matchScore,
      confidenceLabel,
      evidenceBullets: summaryBullets,
    };
  });

  const ranked = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
  return {
    candidates,
    ranked,
    topCandidate: ranked[0] || null,
    hasUserSignals: selectedSet.size > 0 || (Array.isArray(pastEvents) && pastEvents.length > 0),
  };
}
