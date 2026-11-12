/**
 * Tử Vi Đẩu Số Hợp Hôn Engine v2 (`tuvi-hophon-v2`)
 * Tổng hợp tinh hoa:
 * 1. Dương Dịch Đức (*Sử Ký Tính Mệnh*): PP1 Phối hợp Chính Tinh Mệnh ⇄ Phu Thê 2 chiều & PP3 Bù trừ tính cách Âm Dương Cương Nhu.
 * 2. Nam Phái & Thiên Kỷ Nghê Hải Hạ: Tam cung liên tham (Mệnh · Phu Thê · Phúc Đức), Vô Chính Diệu mượn sao xung chiếu (70%) & Tuần/Triệt chế hóa.
 * 3. Hà Lạc / Bắc Phái & Lương Phái Phi Tinh: Phi hóa 2 chiều (Can Năm Sinh, Can Cung Mệnh, Can Cung Phu Thê) nhập Mệnh/Phu Thê/Tật Ách/Phúc Đức/Điền Trạch, xét Xung Chiếu & Tự Hóa / Lộc-Kỵ chuyển hóa.
 * 4. Ngũ Hành Nạp Âm toàn diện (Tương Sinh, Tỷ Hòa, Tương Khắc & Nạp Âm đắc cách trong khắc), Thiên Can Ngũ Hợp/Xung, Địa Chi Lục Hợp/Tam Hợp/Xung/Hại & Dự báo Lưu Niên Hỷ Tín.
 */
import { Lunar } from 'lunar-javascript';
import { solarToLunar } from './lunarConverter.js';
import { anLaSoTuVi } from './tuViEngine.js';
import {
  getSiHuaByStem,
  buildChartFlyingSihua,
  detectPalaceSelfSihua,
  getDaXianSiHua,
  getLiuNianSiHua,
  getTamPhuongTuChinh,
  getBorrowedStarsForPalace,
  getActiveDaXianForAge,
  getChartDaXianList,
  getLuuNienPalaceNames,
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  THIEN_CAN,
  DIA_CHI,
} from './tuViZiweiModule.js';

export const COMPATIBILITY_VERSION = 'tuvi-hophon-v2';

export const WEIGHTS = {
  tamHop: 0.35,
  phiTinh: 0.30,
  tinhCach: 0.20,
  nguHanhDaoHoa: 0.15,
};

export const ROMANCE_STARS = [
  'Hồng Loan',
  'Thiên Hỷ',
  'Đào Hoa',
  'Thiên Diêu',
  'Hỷ Thần',
  'Thanh Long',
  'Thái Âm',
  'Tham Lang',
  'Liêm Trinh',
  'Văn Khúc',
  'Văn Xương',
  'Hữu Bật',
  'Hóa Lộc',
  'Hóa Khoa',
  'Thiên Cơ',
];

const CHINH_DAO_HOA_STARS = new Set([
  'Hồng Loan',
  'Thiên Hỷ',
  'Hỷ Thần',
  'Thanh Long',
  'Hữu Bật',
  'Văn Khúc',
  'Hóa Khoa',
  'Hóa Lộc',
]);

const DIEM_TINH_STARS = new Set(['Đào Hoa', 'Thiên Diêu', 'Tham Lang', 'Liêm Trinh']);

export const ELEMENTS = {
  Kim: 'Kim',
  Moc: 'Mộc',
  Thuy: 'Thủy',
  Hoa: 'Hỏa',
  Tho: 'Thổ',
};

const SINH = { Kim: 'Thuy', Thuy: 'Moc', Moc: 'Hoa', Hoa: 'Tho', Tho: 'Kim' };
const KHAC = { Kim: 'Moc', Moc: 'Tho', Tho: 'Thuy', Thuy: 'Hoa', Hoa: 'Kim' };
const INTERMEDIATE_ELEMENT = {
  'Kim->Moc': 'Thủy',
  'Moc->Tho': 'Hỏa',
  'Tho->Thuy': 'Kim',
  'Thuy->Hoa': 'Mộc',
  'Hoa->Kim': 'Thổ',
};

const BRIGHTNESS_SCORE = { M: 95, V: 84, Đ: 72, B: 56, H: 34 };

const STAR_FAMILIES = {
  TPVT: {
    key: 'TPVT',
    label: 'Tử Phủ Vũ Tướng',
    stars: new Set(['Tử Vi', 'Thiên Phủ', 'Vũ Khúc', 'Thiên Tướng', 'Liêm Trinh']),
  },
  CNDL: {
    key: 'CNDL',
    label: 'Cơ Nguyệt Đồng Lương',
    stars: new Set(['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương']),
  },
  SPT: {
    key: 'SPT',
    label: 'Sát Phá Tham',
    stars: new Set(['Thất Sát', 'Phá Quân', 'Tham Lang']),
  },
  CN: {
    key: 'CN',
    label: 'Cự Nhật',
    stars: new Set(['Cự Môn', 'Thái Dương']),
  },
};

const CAT_TINH_SET = new Set([
  'Tả Phụ',
  'Hữu Bật',
  'Văn Xương',
  'Văn Khúc',
  'Thiên Khôi',
  'Thiên Việt',
  'Lộc Tồn',
  'Hóa Lộc',
  'Hóa Quyền',
  'Hóa Khoa',
  'Ân Quang',
  'Thiên Quý',
  'Giải Thần',
  'Thiên Phúc',
]);

const RESCUE_STARS_SET = new Set([
  'Hóa Khoa',
  'Giải Thần',
  'Thiên Giải',
  'Địa Giải',
  'Ân Quang',
  'Thiên Quý',
  'Thiên Lương',
  'Tử Vi',
  'Thiên Phủ',
  'Lộc Tồn',
  'Thiên Phúc',
  'Thiên Đức',
  'Nguyệt Đức',
]);

const CALM_BUFFER_STARS = new Set([
  'Thiên Lương',
  'Thiên Đồng',
  'Thiên Phủ',
  'Hóa Khoa',
  'Ân Quang',
  'Thiên Quý',
  'Giải Thần',
  'Lộc Tồn',
  'Thiên Phúc',
  'Hữu Bật',
]);

const PALACE_SUMMARY_MAP = {
  menh: 'Mệnh',
  phuThe: 'Phu Thê',
  phucDuc: 'Phúc Đức',
  taiBach: 'Tài Bạch',
  quanLoc: 'Quan Lộc',
  thienDi: 'Thiên Di',
  tatAch: 'Tật Ách',
  dienTrach: 'Điền Trạch',
};

const LUU_DAO_HOA_MAP = {
  0: 9, 4: 9, 8: 9,
  6: 3, 10: 3, 2: 3,
  3: 0, 7: 0, 11: 0,
  9: 6, 1: 6, 5: 6,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function cleanStarName(raw) {
  return String(raw || '').replace(/\s*\([MVĐBH]\)$/, '').trim();
}

export function extractBrightnessCode(raw) {
  const m = String(raw || '').match(/\(([MVĐBH])\)$/);
  return m ? m[1] : null;
}

export function cleanPalaceFunc(chucNang) {
  return String(chucNang || '').replace(/\s*<THÂN>/g, '').trim();
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function findPalaceByName(chart, funcName) {
  const palates = chart?.palates || [];
  return palates.find((p) => cleanPalaceFunc(p.chucNang) === funcName) || null;
}

function computeBrightnessAvg(rawStars, fallback = 60) {
  if (!Array.isArray(rawStars) || rawStars.length === 0) return fallback;
  const codes = rawStars.map(extractBrightnessCode).filter(Boolean);
  if (!codes.length) return fallback;
  const avg = codes.reduce((sum, code) => sum + (BRIGHTNESS_SCORE[code] ?? 60), 0) / codes.length;
  return Math.round(avg);
}

function classifyPalaceStarGroup(chart, palace, borrowedInfo) {
  const ownMajors = (palace?.chinhTinh || []).map(cleanStarName);
  const effectiveMajors = ownMajors.length > 0 ? ownMajors : (borrowedInfo?.borrowedMajorNames || []);
  const votes = { TPVT: 0, CNDL: 0, SPT: 0, CN: 0 };

  for (const s of effectiveMajors) {
    for (const [gKey, gDef] of Object.entries(STAR_FAMILIES)) {
      if (gDef.stars.has(s)) votes[gKey] += 2.5;
    }
  }

  if (chart?.palates?.length === 12 && palace) {
    const tptc = getTamPhuongTuChinh(palace.chiIndex);
    for (const branchIdx of [...tptc.tamHop, tptc.xungChieu]) {
      const relPalace = chart.palates.find((p) => p.chiIndex === branchIdx);
      const w = branchIdx === tptc.xungChieu ? 0.9 : 1.0;
      for (const raw of relPalace?.chinhTinh || []) {
        const s = cleanStarName(raw);
        for (const [gKey, gDef] of Object.entries(STAR_FAMILIES)) {
          if (gDef.stars.has(s)) votes[gKey] += w;
        }
      }
    }
  }

  // Tie-breaking priority when Tử/Vũ/Liêm đồng độ Sát/Phá/Tham
  if (votes.TPVT > 0 && votes.TPVT === votes.SPT) {
    if (effectiveMajors.includes('Tử Vi') || effectiveMajors.includes('Thiên Phủ') || effectiveMajors.includes('Thiên Tướng')) {
      votes.TPVT += 0.2;
    } else {
      votes.SPT += 0.2;
    }
  }

  const bestKey = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TPVT';
  return {
    groupKey: bestKey,
    groupLabel: STAR_FAMILIES[bestKey].label,
  };
}

function buildSinglePalaceSummary(chart, palace) {
  if (!palace) return null;
  const borrowedInfo = getBorrowedStarsForPalace(chart, palace.chiIndex);
  const isVoChinhDieu = Boolean(borrowedInfo?.isVoChinhDieu);
  const chinhTinhRaw = [...(palace.chinhTinh || [])];
  const chinhTinhNames = chinhTinhRaw.map(cleanStarName);
  const effectiveRaw = isVoChinhDieu ? (borrowedInfo?.borrowedChinhTinh || []) : chinhTinhRaw;
  const rawBrightness = computeBrightnessAvg(effectiveRaw, 58);
  const brightnessAvg = isVoChinhDieu ? Math.round(rawBrightness * 0.88) : rawBrightness;
  const { groupKey, groupLabel } = classifyPalaceStarGroup(chart, palace, borrowedInfo);

  const hasTuan = Boolean(palace.isTuan);
  const hasTriet = Boolean(palace.isTriet);
  const tuanTrietNote =
    borrowedInfo?.tuanTrietNote ||
    (hasTuan && hasTriet
      ? 'Đồng độ cả Tuần Không lẫn Triệt Không (giảm xung sát nhưng cần kiên nhẫn buổi đầu)'
      : hasTriet
      ? 'Có Triệt Không đóng (cắt giảm tính bốc đồng tiền vận, cần thời gian thử thách)'
      : hasTuan
      ? 'Có Tuần Không đóng (lắng đọng khí chất, trung hậu vận bền hơn tiền vận)'
      : null);

  return {
    chiIndex: palace.chiIndex,
    chiName: palace.chiName,
    canName: palace.canName,
    chucNang: cleanPalaceFunc(palace.chucNang),
    isThan: Boolean(palace.isThan || String(palace.chucNang || '').includes('<THÂN>')),
    chinhTinhRaw,
    chinhTinhNames,
    effectiveChinhTinhNames: isVoChinhDieu ? (borrowedInfo?.borrowedMajorNames || []) : chinhTinhNames,
    phuTinh: [...(palace.phuTinh || [])],
    isVoChinhDieu,
    borrowedStars: borrowedInfo,
    tuanTrietNote,
    hasTuan,
    hasTriet,
    groupKey,
    groupLabel: isVoChinhDieu ? `${groupLabel} (VCD mượn sao)` : groupLabel,
    brightnessAvg,
  };
}

export function buildPalaceSummaries(chart) {
  const palates = chart?.palates || [];
  const summary = {};
  for (const [key, funcName] of Object.entries(PALACE_SUMMARY_MAP)) {
    const p = findPalaceByName(chart, funcName);
    summary[key] = buildSinglePalaceSummary(chart, p);
  }
  const thanPalace =
    palates.find((p) => p.isThan || String(p.chucNang || '').includes('<THÂN>')) ||
    palates.find((p) => p.chiName === chart?.thanCung) ||
    null;
  summary.than = buildSinglePalaceSummary(chart, thanPalace);
  return summary;
}

// ─── Temperament Profile (Dương Dịch Đức PP3) ────────────────────────────────

export function buildTemperamentProfile(chart, palaceSummary) {
  const menh = palaceSummary?.menh;
  const than = palaceSummary?.than;
  const phuThe = palaceSummary?.phuThe;
  const phucDuc = palaceSummary?.phucDuc;
  const tatAch = palaceSummary?.tatAch;

  let yangRaw = 0;
  let yinRaw = 0;

  const yangStarWeights = {
    'Thất Sát': 18,
    'Phá Quân': 17,
    'Vũ Khúc': 15,
    'Thái Dương': 15,
    'Tử Vi': 14,
    'Liêm Trinh': 12,
    'Tham Lang': 10,
    'Hóa Quyền': 12,
    'Kình Dương': 12,
    'Hỏa Tinh': 11,
    'Linh Tinh': 8,
    'Thiên Hình': 9,
    'Địa Kiếp': 7,
    'Tướng Quân': 6,
    'Bạch Hổ': 5,
  };

  const yinStarWeights = {
    'Thái Âm': 18,
    'Thiên Đồng': 18,
    'Thiên Lương': 14,
    'Thiên Cơ': 13,
    'Thiên Tướng': 12,
    'Thiên Phủ': 11,
    'Hóa Khoa': 11,
    'Hóa Lộc': 8,
    'Văn Khúc': 9,
    'Văn Xương': 8,
    'Hữu Bật': 8,
    'Tả Phụ': 6,
    'Ân Quang': 9,
    'Thiên Quý': 9,
    'Thiên Phúc': 7,
    'Giải Thần': 6,
    'Lộc Tồn': 7,
  };

  const weightedPalaces = [
    { pal: menh, w: 1.0 },
    { pal: than, w: 0.65 },
    { pal: phucDuc, w: 0.5 },
    { pal: tatAch, w: 0.35 },
  ];

  for (const { pal, w } of weightedPalaces) {
    if (!pal) continue;
    const majorFactor = pal.isVoChinhDieu ? 0.65 : 1.0;
    if (pal.isVoChinhDieu && pal === menh) yinRaw += 9;
    for (const s of pal.effectiveChinhTinhNames || []) {
      if (yangStarWeights[s]) yangRaw += yangStarWeights[s] * w * majorFactor;
      if (yinStarWeights[s]) yinRaw += yinStarWeights[s] * w * majorFactor;
    }
    for (const s of pal.phuTinh || []) {
      if (yangStarWeights[s]) yangRaw += yangStarWeights[s] * w;
      if (yinStarWeights[s]) yinRaw += yinStarWeights[s] * w;
    }
    if ((pal.hasTriet || pal.hasTuan) && pal === menh) {
      yangRaw *= 0.9;
      yinRaw += 4;
    }
  }

  const totalRaw = Math.max(1, yangRaw + yinRaw);
  const yangScore = clamp(Math.round(50 + ((yangRaw - yinRaw) / (totalRaw + 18)) * 68), 15, 88);
  const yinScore = 100 - yangScore;

  let mode = 'CanBang';
  let label = 'Cương Nhu Quân Bình';
  if (yangScore >= 57) {
    mode = 'Cuong';
    label = 'Cương Nghị · Chủ Động';
  } else if (yinScore >= 57) {
    mode = 'Nhu';
    label = 'Nhu Hòa · Thấu Cảm';
  }

  // 5 Friction Traits (0..100)
  const traitRaw = {
    nongNay: 28,
    hayGhen: 26,
    tuAiCao: 30,
    apDat: 26,
    khacKhau: 25,
  };

  const traitPalaces = [
    { pal: menh, w: 1.0 },
    { pal: than, w: 0.65 },
    { pal: phuThe, w: 0.8 },
    { pal: phucDuc, w: 0.45 },
    { pal: tatAch, w: 0.35 },
  ];

  const traitNotes = [];

  for (const { pal, w } of traitPalaces) {
    if (!pal) continue;
    const stars = new Set([...(pal.effectiveChinhTinhNames || []), ...(pal.phuTinh || [])]);

    // Nóng nảy
    for (const [s, pts] of [
      ['Hỏa Tinh', 22], ['Linh Tinh', 18], ['Kình Dương', 18], ['Thất Sát', 16],
      ['Phá Quân', 16], ['Địa Kiếp', 14], ['Liêm Trinh', 11], ['Hóa Quyền', 10], ['Thái Dương', 8],
    ]) {
      if (stars.has(s)) traitRaw.nongNay += pts * w;
    }
    for (const [s, pts] of [
      ['Thiên Đồng', -12], ['Thiên Lương', -10], ['Thái Âm', -10], ['Hóa Khoa', -10],
      ['Lộc Tồn', -8], ['Ân Quang', -8], ['Thiên Quý', -8],
    ]) {
      if (stars.has(s)) traitRaw.nongNay += pts * w;
    }

    // Hay ghen
    for (const [s, pts] of [
      ['Hóa Kỵ', 20], ['Liêm Trinh', 15], ['Tham Lang', 14], ['Cự Môn', 14],
      ['Đà La', 15], ['Cô Thần', 12], ['Quả Tú', 12], ['Thiên Diêu', 12], ['Phục Binh', 11],
    ]) {
      if (stars.has(s)) traitRaw.hayGhen += pts * w;
    }
    for (const [s, pts] of [['Hóa Khoa', -10], ['Thiên Phủ', -8], ['Thiên Lương', -9], ['Giải Thần', -8]]) {
      if (stars.has(s)) traitRaw.hayGhen += pts * w;
    }

    // Tự ái cao
    for (const [s, pts] of [
      ['Tử Vi', 22], ['Thái Dương', 16], ['Vũ Khúc', 15], ['Hóa Quyền', 18],
      ['Kình Dương', 13], ['Thiên Lương', 12], ['Thiên Tướng', 10], ['Hoa Cái', 9],
    ]) {
      if (stars.has(s)) traitRaw.tuAiCao += pts * w;
    }
    for (const [s, pts] of [['Thiên Đồng', -10], ['Hữu Bật', -7], ['Hóa Lộc', -7]]) {
      if (stars.has(s)) traitRaw.tuAiCao += pts * w;
    }

    // Áp đặt
    for (const [s, pts] of [
      ['Hóa Quyền', 22], ['Tử Vi', 20], ['Thất Sát', 18], ['Vũ Khúc', 16],
      ['Phá Quân', 14], ['Thái Dương', 13], ['Kình Dương', 13], ['Thiên Hình', 12], ['Tướng Quân', 8],
    ]) {
      if (stars.has(s)) traitRaw.apDat += pts * w;
    }
    for (const [s, pts] of [['Thiên Đồng', -12], ['Thái Âm', -10], ['Thiên Cơ', -8], ['Hóa Khoa', -10], ['Ân Quang', -8]]) {
      if (stars.has(s)) traitRaw.apDat += pts * w;
    }

    // Khắc khẩu
    for (const [s, pts] of [
      ['Cự Môn', 24], ['Hóa Kỵ', 20], ['Thiên Hình', 14], ['Phục Binh', 12],
      ['Kình Dương', 12], ['Đà La', 11], ['Quan Phù', 9], ['Tuế Phá', 9], ['Thiên Khốc', 8],
    ]) {
      if (stars.has(s)) traitRaw.khacKhau += pts * w;
    }
    if ((stars.has('Văn Xương') || stars.has('Văn Khúc')) && stars.has('Hóa Kỵ')) {
      traitRaw.khacKhau += 14 * w;
    }
    for (const [s, pts] of [
      ['Hóa Khoa', -12], ['Hóa Lộc', -10], ['Thiên Đồng', -10], ['Ân Quang', -8], ['Thiên Quý', -8], ['Giải Thần', -8],
    ]) {
      if (stars.has(s)) traitRaw.khacKhau += pts * w;
    }
  }

  const traits = {
    nongNay: clamp(Math.round(traitRaw.nongNay), 12, 94),
    hayGhen: clamp(Math.round(traitRaw.hayGhen), 12, 94),
    tuAiCao: clamp(Math.round(traitRaw.tuAiCao), 12, 94),
    apDat: clamp(Math.round(traitRaw.apDat), 12, 94),
    khacKhau: clamp(Math.round(traitRaw.khacKhau), 12, 94),
  };

  // Build specific star-cited trait notes
  if (menh) {
    const menhStarDesc = menh.isVoChinhDieu
      ? `Mệnh Vô Chính Diệu mượn ${menh.effectiveChinhTinhNames.join(', ') || 'đối cung'}`
      : `Mệnh tọa ${menh.chinhTinhRaw.join(', ')}`;
    traitNotes.push(`${menhStarDesc} (${menh.chiName}): thiên hướng khí chất ${label.toLowerCase()} (Dương ${yangScore}% · Âm ${yinScore}%).`);
  }
  if (traits.nongNay >= 64) {
    traitNotes.push('Có tổ hợp sao Hỏa/Sát mạnh: phản ứng nhanh, thẳng tính nhưng cần chậm lại 1 nhịp khi nóng giận.');
  }
  if (traits.tuAiCao >= 66 || traits.apDat >= 66) {
    traitNotes.push('Tinh hệ Đế/Quyền/Cương tinh nổi bật: trọng danh dự và thích tự quyết, rất hợp lời góp ý khéo léo riêng tư.');
  }
  if (traits.khacKhau >= 62) {
    traitNotes.push('Có dấu ấn Cự Môn / Hóa Kỵ / Hình tinh: tư duy phân tích sắc bén, nên dùng lời khích lệ thay vì bắt lỗi câu chữ.');
  }
  if (traits.hayGhen >= 62) {
    traitNotes.push('Nội tâm sâu nặng tình cảm, dễ để ý tiểu tiết; sự minh bạch và chia sẻ lịch trình giúp tâm lý an ổn.');
  }
  const calmInMenhPhuc = [...(menh?.phuTinh || []), ...(menh?.effectiveChinhTinhNames || []), ...(phucDuc?.effectiveChinhTinhNames || [])]
    .filter((s) => CALM_BUFFER_STARS.has(s));
  if (calmInMenhPhuc.length > 0) {
    traitNotes.push(`Có sao phúc giải (${[...new Set(calmInMenhPhuc)].slice(0, 3).join(', ')}) tại Mệnh/Phúc Đức giúp biết bao dung và tự điều tiết cảm xúc.`);
  }

  return {
    mode,
    label,
    yangScore,
    yinScore,
    traits,
    traitNotes: traitNotes.slice(0, 5),
  };
}

// ─── Internal Marriage Sihua & Individual Love Profile ───────────────────────

export function analyzeInternalMarriageFlows(chart, flyingInfo) {
  const palates = chart?.palates || [];
  const flying = flyingInfo || buildChartFlyingSihua(chart);
  const notes = [];
  const flowItems = [];
  let internalScoreDelta = 0;

  const pushFlow = (type, label, isAuspicious, detail) => {
    notes.push(`${label}: ${detail}`);
    flowItems.push({ type, label, isAuspicious, detail });
  };

  const phuThe = findPalaceByName(chart, 'Phu Thê');
  const menh = findPalaceByName(chart, 'Mệnh');
  if (!phuThe || !menh) return { notes, flowItems, internalScoreDelta };

  // 1. Sinh Niên Tứ Hóa tại Phu Thê / Phúc Đức / Quan Lộc
  for (const sh of ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ']) {
    if (phuThe.phuTinh?.includes(sh)) {
      const meaning = SIHUA_IN_FUQI_GU[sh] || '';
      const good = sh !== 'Hóa Kỵ';
      pushFlow('sinh-nien', `Cung Phu Thê tọa Sinh Niên ${sh}`, good, meaning);
      if (sh === 'Hóa Lộc' || sh === 'Hóa Khoa') internalScoreDelta += 3;
      else if (sh === 'Hóa Quyền') internalScoreDelta += 1;
      else if (sh === 'Hóa Kỵ') internalScoreDelta -= 3;
    }
  }

  // 2. Tự Hóa Xuất & Hướng Tâm Tự Hóa tại Phu Thê
  const selfPhuThe = detectPalaceSelfSihua(phuThe, palates);
  for (const s of selfPhuThe.selfOut) {
    if (s.siHua === 'Hóa Kỵ') {
      pushFlow(
        'tu-hoa-ky',
        `Cung Phu Thê Tự Hóa Kỵ (${s.starName})`,
        false,
        'Trong hôn nhân dễ tự suy diễn hoặc thay đổi tâm trạng đột ngột, cần giữ tâm bình thản.'
      );
      internalScoreDelta -= 4;
    } else if (s.siHua === 'Hóa Lộc' || s.siHua === 'Hóa Khoa') {
      pushFlow(
        'tu-hoa-cat',
        `Cung Phu Thê Tự ${s.siHua} (${s.starName})`,
        true,
        'Đời sống tình cảm có sự cởi mở, tự làm mới và bao dung.'
      );
      internalScoreDelta += 3;
    } else {
      pushFlow(
        'tu-hoa-quyen',
        `Cung Phu Thê Tự Hóa Quyền (${s.starName})`,
        true,
        'Bạn đời hoặc bản thân thích chủ động quán xuyến việc nhà.'
      );
    }
  }
  for (const opp of selfPhuThe.oppositeIn) {
    pushFlow(
      'huong-tam',
      `Hướng Tâm ${opp.siHua} (${opp.starName}) từ Quan Lộc`,
      opp.siHua !== 'Hóa Kỵ',
      'Công việc và người bạn đời có sự gắn kết, tương tác trực tiếp trên trục Quan – Phối.'
    );
  }

  // 3. Mệnh phi hóa & Phu Thê phi hóa + Lộc chuyển Kỵ / Kỵ chuyển Kỵ (Lương Phái)
  const menhFly = flying.palaces.find((p) => p.chucNang === 'Mệnh');
  const phuTheFly = flying.palaces.find((p) => p.chucNang === 'Phu Thê');

  if (menhFly) {
    for (const f of menhFly.flights) {
      if (f.targetChucNang === 'Phu Thê' && (f.siHua === 'Hóa Lộc' || f.siHua === 'Hóa Khoa')) {
        pushFlow(
          'menh-phi-phuthe',
          `Cung Mệnh phi ${f.siHua} (${f.starName}) nhập Phu Thê`,
          true,
          'Bản thân rất nặng tình, chủ động vun vén cho người phối ngẫu.'
        );
        internalScoreDelta += 3;
      } else if (f.targetChucNang === 'Phu Thê' && f.siHua === 'Hóa Kỵ') {
        pushFlow(
          'menh-ky-phuthe',
          `Cung Mệnh phi Hóa Kỵ (${f.starName}) nhập Phu Thê`,
          false,
          'Duyên nợ gắn bó sâu nhưng dễ lo lắng thái quá cho bạn đời.'
        );
        internalScoreDelta -= 2;
      } else if (f.targetChucNang === 'Quan Lộc' && f.siHua === 'Hóa Kỵ') {
        pushFlow(
          'menh-ky-quan',
          `Cung Mệnh phi Hóa Kỵ (${f.starName}) nhập Quan Lộc xung Phu Thê`,
          false,
          'Bận tâm sự nghiệp dễ làm xao nhãng chuyện tình cảm.'
        );
        internalScoreDelta -= 3;
      }
    }
  }

  if (phuTheFly) {
    const locFlight = phuTheFly.flights.find((f) => f.siHua === 'Hóa Lộc');
    const kyFlight = phuTheFly.flights.find((f) => f.siHua === 'Hóa Kỵ');

    if (locFlight?.targetChucNang) {
      if (['Mệnh', 'Điền Trạch', 'Phúc Đức', 'Tài Bạch'].includes(locFlight.targetChucNang)) {
        pushFlow(
          'phuthe-loc',
          `Cung Phu Thê phi Hóa Lộc (${locFlight.starName}) nhập ${locFlight.targetChucNang}`,
          true,
          `Kết hôn xong người phối ngẫu mang lại sinh khí tốt cho ${locFlight.targetChucNang.toLowerCase()}.`
        );
        internalScoreDelta += 3;
      }
      // Lộc chuyển Kỵ
      const nextPalace = flying.palaces.find((p) => p.chiIndex === locFlight.targetChiIndex);
      const chuyenKy = nextPalace?.flights?.find((f) => f.siHua === 'Hóa Kỵ');
      if (chuyenKy?.targetChucNang) {
        const isHarsh = chuyenKy.targetChucNang === 'Thiên Di' || chuyenKy.targetChucNang === 'Quan Lộc';
        pushFlow(
          'loc-chuyen-ky',
          `Lộc chuyển Kỵ: Phu Thê Lộc nhập ${locFlight.targetChucNang} → Kỵ (${chuyenKy.starName}) về ${chuyenKy.targetChucNang}`,
          !isHarsh,
          `Tình cảm khởi đầu nồng ấm, về sau cần chú ý giữ cân bằng tại cung ${chuyenKy.targetChucNang}.`
        );
        if (isHarsh) {
          internalScoreDelta -= 2;
        }
      }
    }

    if (kyFlight?.targetChucNang) {
      if (kyFlight.targetChucNang === 'Thiên Di') {
        pushFlow(
          'phuthe-ky-di',
          `Cung Phu Thê phi Hóa Kỵ (${kyFlight.starName}) nhập Thiên Di xung Mệnh`,
          false,
          'Dễ có giai đoạn thử thách khoảng cách hoặc khác biệt lối sống.'
        );
        internalScoreDelta -= 4;
      } else if (kyFlight.targetChucNang === 'Mệnh') {
        pushFlow(
          'phuthe-ky-menh',
          `Cung Phu Thê phi Hóa Kỵ (${kyFlight.starName}) nhập Mệnh`,
          false,
          'Người bạn đời rất quyến luyến và hay quan tâm sát sao.'
        );
        internalScoreDelta -= 1;
      }
      // Kỵ chuyển Kỵ
      const nextKyPalace = flying.palaces.find((p) => p.chiIndex === kyFlight.targetChiIndex);
      const kyChuyenKy = nextKyPalace?.flights?.find((f) => f.siHua === 'Hóa Kỵ');
      if (kyChuyenKy?.targetChucNang && kyChuyenKy.targetChiIndex !== kyFlight.targetChiIndex) {
        pushFlow(
          'ky-chuyen-ky',
          `Truy căn Kỵ chuyển Kỵ: Phu Thê Kỵ nhập ${kyFlight.targetChucNang} → Kỵ (${kyChuyenKy.starName}) sang ${kyChuyenKy.targetChucNang}`,
          false,
          'Điểm nút cảm xúc cần tháo gỡ bằng sự cởi mở và đối thoại thẳng thắn.'
        );
      }
    }
  }

  return {
    notes: notes.slice(0, 6),
    flowItems: flowItems.slice(0, 6),
    internalScoreDelta: clamp(internalScoreDelta, -7, 7),
  };
}

function buildActiveMarriageDecades(chart) {
  const decades = getChartDaXianList(chart).filter((d) => d.startAge >= 14 && d.startAge <= 56);
  const phuThe = findPalaceByName(chart, 'Phu Thê');
  const menh = findPalaceByName(chart, 'Mệnh');
  const dienTrach = findPalaceByName(chart, 'Điền Trạch');

  const scored = decades.map((d) => {
    const pal = chart.palates.find((p) => p.chiIndex === d.chiIndex);
    const stars = new Set([...(pal?.chinhTinh || []).map(cleanStarName), ...(pal?.phuTinh || [])]);
    let priority = 0;
    const reasons = [];

    if (d.natalChucNang === 'Phu Thê') {
      priority += 30;
      reasons.push('Đại Hạn đi thẳng vào cung Phu Thê (cột mốc trọng đại định hình hôn nhân)');
    } else if (d.natalChucNang === 'Phúc Đức') {
      priority += 24;
      reasons.push('Đại Hạn lâm cung Phúc Đức (nền tảng phúc ấm gia đạo và kết duyên bền vững)');
    } else if (d.natalChucNang === 'Điền Trạch') {
      priority += 20;
      reasons.push('Đại Hạn lâm cung Điền Trạch (vận an cư lập nghiệp, xây dựng tổ ấm chung)');
    } else if (d.natalChucNang === 'Thiên Di' || d.natalChucNang === 'Tử Tức') {
      priority += 15;
      reasons.push(`Đại Hạn tại cung ${d.natalChucNang} (mở rộng nhân duyên và trách nhiệm gia đình)`);
    }

    const hyPresent = ['Hồng Loan', 'Thiên Hỷ', 'Đào Hoa', 'Hỷ Thần', 'Hóa Lộc', 'Hóa Khoa', 'Lộc Tồn'].filter((s) =>
      stars.has(s)
    );
    if (hyPresent.length > 0) {
      priority += hyPresent.length * 6;
      reasons.push(`hội ${hyPresent.join(', ')}`);
    }

    const dxSihua = getDaXianSiHua(chart, { chiIndex: d.chiIndex });
    if (dxSihua?.transforms) {
      const checkPalaces = [
        { p: phuThe, name: 'Phu Thê' },
        { p: menh, name: 'Mệnh' },
        { p: dienTrach, name: 'Điền Trạch' },
      ];
      for (const { p, name } of checkPalaces) {
        if (!p) continue;
        const pStars = new Set([...(p.chinhTinh || []).map(cleanStarName), ...(p.phuTinh || [])]);
        if (pStars.has(dxSihua.transforms.Loc)) {
          priority += 10;
          reasons.push(`Can Đại Hạn (${d.canName}) phi ĐH.Hóa Lộc nhập cung ${name}`);
        } else if (pStars.has(dxSihua.transforms.Khoa)) {
          priority += 8;
          reasons.push(`Can Đại Hạn (${d.canName}) phi ĐH.Hóa Khoa nhập cung ${name}`);
        }
      }
    }

    if (d.startAge >= 22 && d.startAge <= 36) priority += 8;

    return {
      startAge: d.startAge,
      range: `${d.startAge}–${d.endAge} tuổi`,
      palaceName: d.natalChucNang,
      chiName: d.chiName,
      priority,
      note: reasons.join('; ') || `Đại Hạn cung ${d.natalChucNang} (${d.canName} ${d.chiName}) ổn định nhịp sống gia đình.`,
    };
  });

  return scored
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .sort((a, b) => a.startAge - b.startAge)
    .map(({ range, palaceName, chiName, note }) => ({ range, palaceName, chiName, note }));
}

export function buildIndividualLoveProfile(chart, palaceSummary, flyingInfo) {
  const phuThe = palaceSummary?.phuThe;
  const phucDuc = palaceSummary?.phucDuc;
  const menh = palaceSummary?.menh;

  const effectiveStars = phuThe?.effectiveChinhTinhNames || [];
  const primaryStar = effectiveStars[0] || null;
  const fuqiKnowledge = primaryStar ? STAR_IN_FUQI_GU[primaryStar] : null;

  const groupTagMap = {
    TPVT: 'Trọng Chữ Tín & Nề Nếp',
    CNDL: 'Tinh Tế, Tri Kỷ & Ôn Hòa',
    SPT: 'Cá Tính Mạnh & Duyên Sau Thử Thách',
    CN: 'Thẳng Thắn, Sâu Sắc & Trọng Đối Thoại',
  };
  const groupTag = groupTagMap[phuThe?.groupKey] || 'Trọng Nhân Duyên & Đồng Hành';

  const archetypeTitle = phuThe?.isVoChinhDieu
    ? `Phu Thê Vô Chính Diệu (Mượn ${effectiveStars.join(' · ') || 'Đối Cung'}) · Duyên Muộn Mà Bền`
    : `Phu Thê ${ phuThe?.chinhTinhNames?.join(' · ') || 'Chính Cách'} · ${groupTag}`;

  const spousePortrait = fuqiKnowledge
    ? `${fuqiKnowledge.summary} Hình mẫu người phối ngẫu thường mang nét: ${fuqiKnowledge.spouseTraits} ${fuqiKnowledge.timing || ''}`.trim()
    : `Cung Phu Thê thuộc hệ ${phuThe?.groupLabel || 'Tử Vi'}, người bạn đời có duyên gắn kết qua sự đồng điệu lối sống và chia sẻ trách nhiệm thực tế.`;

  const catInPhuThe = (phuThe?.phuTinh || []).filter((s) => CAT_TINH_SET.has(s) || s === 'Hồng Loan' || s === 'Thiên Hỷ');
  const satInPhuThe = (phuThe?.phuTinh || []).filter((s) =>
    ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Cô Thần', 'Quả Tú', 'Thiên Hình', 'Hóa Kỵ'].includes(s)
  );

  const phuTheParts = [];
  if (phuThe) {
    phuTheParts.push(
      phuThe.isVoChinhDieu
        ? `Cung Phu Thê tại ${phuThe.canName} ${phuThe.chiName} Vô Chính Diệu, mượn chính tinh [${(phuThe.borrowedStars?.borrowedChinhTinh || []).join(', ') || 'đối cung'}] từ Quan Lộc xung chiếu (lực ~70%).`
        : `Cung Phu Thê tại ${phuThe.canName} ${phuThe.chiName} tọa thủ ${phuThe.chinhTinhRaw.join(', ')} (độ sáng TB ${phuThe.brightnessAvg}/100).`
    );
    if (catInPhuThe.length > 0) {
      phuTheParts.push(`Đắc cát/hỷ tinh hội trợ (${catInPhuThe.join(', ')}), tăng thêm nhân duyên quý nhân và sự nâng đỡ từ người bạn đời.`);
    }
    if (satInPhuThe.length > 0) {
      phuTheParts.push(`Có sự hiện diện của ${satInPhuThe.join(', ')} nên tình cảm cần trải qua thử thách hoặc kết hôn muộn để đủ độ chín chắn.`);
    }
    if (phuThe.tuanTrietNote) {
      phuTheParts.push(phuThe.tuanTrietNote + '.');
    }
  }

  const phucDucParts = [];
  if (phucDuc) {
    const phucDesc = phucDuc.isVoChinhDieu
      ? `Vô Chính Diệu (mượn ${phucDuc.effectiveChinhTinhNames.join(', ') || 'Tài Bạch'})`
      : phucDuc.chinhTinhRaw.join(', ');
    phucDucParts.push(
      `Theo Thiên Kỷ Nghê Hải Hạ, cung Phúc Đức (${phucDuc.canName} ${phucDuc.chiName} · ${phucDesc}) là gốc rễ giữ gìn hạnh phúc hậu vận.`
    );
    const catPhuc = (phucDuc.phuTinh || []).filter((s) => CAT_TINH_SET.has(s));
    if (catPhuc.length > 0 || phucDuc.brightnessAvg >= 72) {
      phucDucParts.push(`Phúc cung sáng và hội cát tinh (${catPhuc.slice(0, 4).join(', ') || 'chính tinh đắc địa'}) giúp vợ chồng gặp chuyện lớn hóa nhỏ, càng về trung hậu vận càng gắn bó.`);
    } else {
      phucDucParts.push('Cần chủ động bồi đắp đời sống tinh thần chung, giữ tâm an định và tránh mang áp lực tài chính vào không gian gia đình.');
    }
  }

  const { notes: internalSihuaNotes } = analyzeInternalMarriageFlows(chart, flyingInfo);
  const activeMarriageDecades = buildActiveMarriageDecades(chart);

  const strengths = [];
  const cautions = [];

  if (catInPhuThe.length > 0) {
    strengths.push(`Cung Phu Thê hội ${catInPhuThe.slice(0, 3).join(', ')}: dễ gặp người phối ngẫu có trách nhiệm và thiện chí vun đắp.`);
  }
  if ((phucDuc?.brightnessAvg ?? 0) >= 72) {
    strengths.push(`Cung Phúc Đức (${phucDuc.chiName}) vững vàng: nội lực tinh thần và phúc ấm hậu vận hôn nhân tốt.`);
  }
  if (menh && ['TPVT', 'CNDL'].includes(menh.groupKey)) {
    strengths.push(`Bản Mệnh thuộc hệ ${menh.groupLabel}: coi trọng sự gắn kết lâu dài và chữ tín trong gia đạo.`);
  } else if (menh) {
    strengths.push(`Bản Mệnh thuộc hệ ${menh.groupLabel}: giàu nghị lực gánh vác, dám cùng bạn đời vượt sóng gió dựng xây cơ nghiệp.`);
  }

  if (satInPhuThe.length > 0) {
    cautions.push(`Phu Thê có ${satInPhuThe.slice(0, 3).join(', ')}: tránh nóng vội kết luận lúc mâu thuẫn, hợp kết hôn khi tâm tính đã chín chắn.`);
  }
  if (phuThe?.hasTriet || phuThe?.hasTuan) {
    cautions.push(`Phu Thê gặp ${phuThe.hasTriet ? 'Triệt' : 'Tuần'}: mối tình đầu dễ trắc trở, càng trải nghiệm và nhường nhịn thì duyên sau càng bền.`);
  }
  if (cautions.length < 2) {
    cautions.push('Cần duy trì thói quen trò chuyện cởi mở mỗi tuần để tránh tích tụ những hiểu lầm không nói thành lời.');
    cautions.push('Cân bằng thời gian giữa sự nghiệp cá nhân (Quan Lộc) và sự hiện diện ấm áp bên gia đình (Phu Thê · Điền Trạch).');
  }

  return {
    archetypeTitle,
    spousePortrait,
    phuTheAnalysis: phuTheParts.join(' '),
    phucDucAnalysis: phucDucParts.join(' '),
    internalSihuaNotes,
    activeMarriageDecades,
    strengths: strengths.slice(0, 4),
    cautions: cautions.slice(0, 4),
  };
}

// ─── Person Creation & Restoration ───────────────────────────────────────────

export function buildPersonProfileFromChart({ hoTen, gioiTinh, inputData, result }) {
  const phuThe = findPalaceByName(result, 'Phu Thê');
  const menh = Object.keys(ELEMENTS).find((key) => String(result?.banMenhNapAm || '').endsWith(ELEMENTS[key]));
  if (!menh || !phuThe) {
    throw new Error('Lá số thiếu Nạp Âm hoặc cung Phu Thê để đối chiếu.');
  }

  const [canNam = '', chiNam = ''] = String(result.canChiNam || '').trim().split(/\s+/);
  const flyingInfo = buildChartFlyingSihua(result);
  const palaceSummary = buildPalaceSummaries(result);
  const temperament = buildTemperamentProfile(result, palaceSummary);
  const individualLoveProfile = buildIndividualLoveProfile(result, palaceSummary, flyingInfo);

  const personObj = {
    hoTen,
    gioiTinh: gioiTinh || (inputData?.gender === 0 ? 'Nữ' : 'Nam'),
    menh,
    napAm: result.banMenhNapAm,
    canChiNam: result.canChiNam,
    canNam,
    chiNam,
    cucName: result.cucName,
    cucNumber: result.cucNumber,
    phuTheStars: [...(phuThe.chinhTinh || []), ...(phuThe.phuTinh || [])].map(cleanStarName),
    canPhuThe: phuThe.canName,
    daoHoaStars: (result.palates || []).flatMap((p) =>
      [...(p.chinhTinh || []), ...(p.phuTinh || [])]
        .map(cleanStarName)
        .filter((sao) => ROMANCE_STARS.includes(sao))
        .map((sao) => ({ sao, cung: cleanPalaceFunc(p.chucNang) }))
    ),
    palaceSummary,
    laiNhanCung: flyingInfo.laiNhanCung,
    temperament,
    individualLoveProfile,
  };

  Object.defineProperty(personObj, '_chart', { value: result, enumerable: false, configurable: true });
  Object.defineProperty(personObj, '_inputData', { value: inputData, enumerable: false, configurable: true });

  return personObj;
}

export function createCompatibilityPerson(person) {
  if (!person || typeof person !== 'object') {
    throw new Error('Thông tin người xem hợp hôn không hợp lệ.');
  }
  const hoTen = person.hoTen?.trim();
  if (!hoTen || hoTen.length > 100) {
    throw new Error('Họ tên cần từ 1 đến 100 ký tự.');
  }

  const { ngay, thang, nam, gioiTinh } = person;
  const isLunar = Boolean(person.isLunar);
  const isLeap = Boolean(person.isLeap);
  const maxAllowedYear = new Date().getFullYear();

  if (!['Nam', 'Nữ'].includes(gioiTinh)) {
    throw new Error('Giới tính cần là Nam hoặc Nữ.');
  }

  let lunarHourIndex;
  if (person.gio !== undefined && person.gio !== null) {
    if (!Number.isInteger(person.gio) || person.gio < 0 || person.gio > 23) {
      throw new Error('Kiểm tra giờ sinh hợp lệ (số nguyên từ 0 đến 23).');
    }
    lunarHourIndex = Math.floor((person.gio + 1) / 2) % 12;
  } else if (person.lunarHourIndex !== undefined && person.lunarHourIndex !== null) {
    if (!Number.isInteger(person.lunarHourIndex) || person.lunarHourIndex < 0 || person.lunarHourIndex > 11) {
      throw new Error('Kiểm tra giờ Địa Chi hợp lệ (0–11).');
    }
    lunarHourIndex = person.lunarHourIndex;
  } else {
    throw new Error('Vui lòng nhập giờ sinh (0–23).');
  }

  if (![ngay, thang, nam].every(Number.isInteger) || nam < 1900 || nam > maxAllowedYear || thang < 1 || thang > 12) {
    throw new Error('Kiểm tra ngày, tháng, năm sinh hợp lệ (từ năm 1900 đến hiện tại).');
  }

  let inputData;
  if (isLunar) {
    if (ngay < 1 || ngay > 30) {
      throw new Error('Ngày sinh âm lịch cần từ 1 đến 30.');
    }
    let lunarObj;
    try {
      const monthArg = isLeap ? -Math.abs(thang) : Math.abs(thang);
      lunarObj = Lunar.fromYmd(nam, monthArg, ngay);
      if (lunarObj.getYear() !== nam || lunarObj.getMonth() !== monthArg || lunarObj.getDay() !== ngay) {
        throw new Error('Mismatch');
      }
    } catch {
      throw new Error('Ngày sinh âm lịch hoặc tháng nhuận không tồn tại trong lịch pháp. Vui lòng kiểm tra lại.');
    }
    const solarObj = lunarObj.getSolar();
    const yearCanIndex = ((nam - 4) % 10 + 10) % 10;
    const yearChiIndex = ((nam - 4) % 12 + 12) % 12;
    inputData = {
      lunarYear: nam,
      lunarMonth: thang,
      lunarDay: ngay,
      isLeap,
      yearCanIndex,
      yearChiIndex,
      yearCanName: THIEN_CAN[yearCanIndex],
      yearChiName: DIA_CHI[yearChiIndex],
      lunarDateStr: `${thang}/${ngay}/${nam}${isLeap ? ' (Nhuận)' : ''} (Âm lịch)`,
      solarDateStr: `${solarObj.getDay()}/${solarObj.getMonth()}/${solarObj.getYear()} (Dương lịch)`,
      name: hoTen,
      isLunar: true,
      lunarHourIndex,
      gender: gioiTinh === 'Nam' ? 1 : 0,
    };
  } else {
    const maxSolarDay = new Date(nam, thang, 0).getDate();
    if (ngay < 1 || ngay > maxSolarDay) {
      throw new Error('Ngày sinh dương lịch không hợp lệ (kiểm tra số ngày trong tháng / năm nhuận).');
    }
    const converted = solarToLunar(nam, thang, ngay);
    inputData = {
      ...converted,
      name: hoTen,
      isLunar: false,
      solarInput: { day: ngay, month: thang, year: nam },
      lunarHourIndex,
      gender: gioiTinh === 'Nam' ? 1 : 0,
    };
  }

  const result = anLaSoTuVi(inputData);
  const personProfile = buildPersonProfileFromChart({ hoTen, gioiTinh, inputData, result });

  return {
    inputData,
    result,
    person: personProfile,
  };
}

// ─── Pillar 1: Tam Hợp Mệnh ⇄ Phu Thê & Phúc Đức (35%) ───────────────────────

const GROUP_AFFINITY_MATRIX = {
  'TPVT|TPVT': { delta: 5, text: 'đồng hệ Tử Phủ Vũ Tướng (chuẩn mực, trọng chữ tín và nền nếp gia đạo)' },
  'CNDL|CNDL': { delta: 5, text: 'đồng hệ Cơ Nguyệt Đồng Lương (ôn hòa, thấu cảm và giàu tình nghĩa)' },
  'CN|CN': { delta: 3, text: 'đồng hệ Cự Nhật (quang minh thẳng thắn, hợp chia sẻ lý tưởng)' },
  'SPT|SPT': { delta: 3, text: 'đồng hệ Sát Phá Tham (năng động, quyết đoán, đồng hành mở lối)' },
  'CNDL|CN': { delta: 4, text: 'Cơ Nguyệt Đồng Lương hội Cự Nhật (trí tuệ văn tinh tương trợ ấm áp)' },
  'CN|CNDL': { delta: 4, text: 'Cự Nhật hội Cơ Nguyệt Đồng Lương (quang minh đi cùng sự tinh tế)' },
  'TPVT|SPT': { delta: 3, text: 'Tử Phủ Vũ Tướng phối Sát Phá Tham (bản lĩnh quản trị điều phối sức bật tiên phong)' },
  'SPT|TPVT': { delta: 3, text: 'Sát Phá Tham phối Tử Phủ Vũ Tướng (nhiệt huyết hành động gặp hậu phương vững chãi)' },
  'TPVT|CN': { delta: 2, text: 'Tử Phủ Vũ Tướng phối Cự Nhật (tôn trọng danh dự và trách nhiệm chung)' },
  'CN|TPVT': { delta: 2, text: 'Cự Nhật phối Tử Phủ Vũ Tướng (cởi mở đồng hành cùng nề nếp ổn định)' },
  'TPVT|CNDL': { delta: 2, text: 'Tử Phủ Vũ Tướng phối Cơ Nguyệt Đồng Lương (vững vàng che chở kết hợp dịu dàng chu toàn)' },
  'CNDL|TPVT': { delta: 2, text: 'Cơ Nguyệt Đồng Lương phối Tử Phủ Vũ Tướng (mềm mỏng dung hòa cùng trụ cột điềm tĩnh)' },
  'SPT|CN': { delta: -2, text: 'Sát Phá Tham gặp Cự Nhật (hành động dứt khoát dễ va chạm khẩu khí phản biện nếu thiếu lắng nghe)' },
  'CN|SPT': { delta: -2, text: 'Cự Nhật gặp Sát Phá Tham (một bên trọng lý lẽ, một bên trọng hành động nhanh)' },
  'SPT|CNDL': { delta: -4, text: 'Sát Phá Tham gặp Cơ Nguyệt Đồng Lương (một bên ưa đột phá biến động, một bên ưa an ổn truyền thống)' },
  'CNDL|SPT': { delta: -4, text: 'Cơ Nguyệt Đồng Lương gặp Sát Phá Tham (nhịp sống tĩnh tại cần dung hòa với nhịp sống xông pha)' },
};

function evaluateOneWayThaiCucMatch(sourcePerson, targetPerson, targetChart, sourceLabel, targetLabel) {
  const sMenh = sourcePerson?.palaceSummary?.menh;
  const tPhuThe = targetPerson?.palaceSummary?.phuThe;

  if (!sMenh || !tPhuThe) {
    return {
      title: `${sourceLabel} (Mệnh) ⇄ ${targetLabel} (Phu Thê)`,
      matchType: 'Cơ bản',
      scoreDelta: 0,
      sharedStars: [],
      menhGroup: sMenh?.groupLabel || 'Chưa rõ',
      phuTheGroup: tPhuThe?.groupLabel || 'Chưa rõ',
      summary: 'Đủ dữ kiện cơ bản để tham chiếu cung Phu Thê.',
    };
  }

  const menhStars = sMenh.effectiveChinhTinhNames || [];
  const phuTheDirect = new Set(tPhuThe.effectiveChinhTinhNames || []);
  const phuTheSanFang = new Set();

  if (targetChart?.palates?.length === 12) {
    const tptc = getTamPhuongTuChinh(tPhuThe.chiIndex);
    for (const bIdx of tptc.allSanFangBranches) {
      const p = targetChart.palates.find((pal) => pal.chiIndex === bIdx);
      for (const raw of p?.chinhTinh || []) {
        phuTheSanFang.add(cleanStarName(raw));
      }
    }
  }

  const directShared = menhStars.filter((s) => phuTheDirect.has(s));
  const sanFangShared = menhStars.filter((s) => !phuTheDirect.has(s) && phuTheSanFang.has(s));

  let delta = 0;
  let matchType = 'Bổ Khuyết Tinh Hệ';
  const notes = [];

  if (directShared.length > 0) {
    const isBorrowed = sMenh.isVoChinhDieu || tPhuThe.isVoChinhDieu;
    const pts = isBorrowed ? 6 : 8;
    delta += pts;
    matchType = 'Đắc Duyên Chính Tinh Trực Tiếp';
    notes.push(
      `Mệnh ${sourceLabel}${sMenh.isVoChinhDieu ? ' (VCD mượn xung chiếu)' : ''} và Phu Thê ${targetLabel}${tPhuThe.isVoChinhDieu ? ' (VCD mượn xung chiếu)' : ''} trùng chính tinh [${directShared.join(', ')}] — đúng mẫu người phối ngẫu thiên định`
    );
  } else if (sanFangShared.length > 0) {
    delta += 4;
    matchType = 'Hội Duyên Tam Phương Phu Thê';
    notes.push(
      `Chính tinh Mệnh ${sourceLabel} [${sanFangShared.join(', ')}] hội chiếu trong Tam Phương Tứ Chính cung Phu Thê ${targetLabel}`
    );
  }

  const affKey = `${sMenh.groupKey}|${tPhuThe.groupKey}`;
  const aff = GROUP_AFFINITY_MATRIX[affKey] || { delta: 0, text: 'tương giao bình hòa' };
  let affDelta = aff.delta;
  if (affDelta < 0) {
    const hasMediation = [...(sMenh.phuTinh || []), ...(tPhuThe.phuTinh || [])].some((s) =>
      ['Hóa Khoa', 'Tả Phụ', 'Hữu Bật', 'Lộc Tồn', 'Ân Quang', 'Thiên Quý'].includes(s)
    );
    if (hasMediation) {
      affDelta = Math.ceil(affDelta / 2);
      notes.push(`Tinh hệ ${aff.text}, nhưng đắc Cát/Khoa tinh làm cầu nối dung hòa`);
    } else {
      notes.push(`Tinh hệ ${aff.text}`);
    }
  } else {
    notes.push(`Tinh hệ ${aff.text}`);
  }
  delta += affDelta;

  return {
    title: `${sourceLabel} (Mệnh) ⇄ ${targetLabel} (Phu Thê)`,
    matchType,
    matchLevel: matchType,
    score: clamp(70 + delta * 2, 35, 96),
    scoreDelta: delta,
    sharedStars: directShared.length > 0 ? directShared : sanFangShared,
    menhGroup: sMenh.groupLabel,
    phuTheGroup: tPhuThe.groupLabel,
    summary: notes.join('; ') + '.',
  };
}

function scoreSinglePhuTheQuality(person, label) {
  const phuThe = person?.palaceSummary?.phuThe;
  if (!phuThe) {
    // Fallback if synthetic minimal person without full chart
    const stars = person?.phuTheStars || [];
    const catTinh = stars.filter((s) => CAT_TINH_SET.has(s) || s === 'Hồng Loan' || s === 'Thiên Hỷ');
    const satTinh = stars.filter((s) =>
      ['Quả Tú', 'Cô Thần', 'Kình Dương', 'Đà La', 'Địa Không', 'Địa Kiếp', 'Hỏa Tinh', 'Linh Tinh', 'Hóa Kỵ'].includes(s)
    );
    let pen = 0;
    for (const s of stars) {
      if (satTinh.includes(s)) pen -= 3;
      if (CAT_TINH_SET.has(s)) pen += 2;
    }
    return {
      delta: clamp(pen, -10, 8),
      note: `${label}: cung Phu Thê có ${stars.join(', ') || 'chưa rõ'}.`,
      rescued: false,
      stars,
      catTinh,
      satTinh,
    };
  }

  let catBonus = 0;
  let satPenalty = 0;
  const allStars = [...(phuThe.effectiveChinhTinhNames || []), ...(phuThe.phuTinh || [])];
  const catTinh = [];
  const satTinh = [];

  if (phuThe.brightnessAvg >= 80) catBonus += 3;
  else if (phuThe.brightnessAvg <= 42) satPenalty -= 3;

  for (const s of phuThe.phuTinh || []) {
    if (CAT_TINH_SET.has(s) || s === 'Hồng Loan' || s === 'Thiên Hỷ') {
      catBonus += 2;
      catTinh.push(s);
    }
    if (s === 'Địa Không' || s === 'Địa Kiếp' || s === 'Hóa Kỵ') {
      satPenalty -= 4;
      satTinh.push(s);
    } else if (['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Cô Thần', 'Quả Tú', 'Thiên Hình', 'Phục Binh'].includes(s)) {
      satPenalty -= 3;
      satTinh.push(s);
    }
  }
  catBonus = Math.min(7, catBonus);

  let rescued = false;
  if (satPenalty < 0) {
    const hasRescue = allStars.some((s) => RESCUE_STARS_SET.has(s)) || (phuThe.isVoChinhDieu && (phuThe.hasTuan || phuThe.hasTriet));
    if (hasRescue) {
      satPenalty = Math.trunc(satPenalty * 0.6);
      rescued = true;
    }
  }
  satPenalty = Math.max(-10, satPenalty);

  const delta = catBonus + satPenalty;
  const desc = phuThe.isVoChinhDieu
    ? `Vô Chính Diệu mượn ${phuThe.effectiveChinhTinhNames.join(', ') || 'xung chiếu'}`
    : phuThe.chinhTinhRaw.join(', ');

  return {
    delta,
    rescued,
    stars: phuThe.effectiveChinhTinhNames || [],
    catTinh,
    satTinh,
    note: `${label} (${phuThe.chiName} · ${desc})${rescued ? ' — có Cát tinh / Tuần-Triệt cứu giải sát khí' : ''}`,
  };
}

function scoreSinglePhucDucQuality(person, label) {
  const phuc = person?.palaceSummary?.phucDuc;
  if (!phuc) return { delta: 0, note: `${label}: chưa có dữ liệu Phúc Đức.` };

  let delta = 0;
  if (phuc.brightnessAvg >= 78) delta += 2;
  else if (phuc.brightnessAvg <= 40) delta -= 2;

  const goodPhuc = [...(phuc.effectiveChinhTinhNames || []), ...(phuc.phuTinh || [])].filter((s) =>
    ['Thiên Đồng', 'Thiên Lương', 'Thiên Phủ', 'Hóa Lộc', 'Hóa Khoa', 'Lộc Tồn', 'Ân Quang', 'Thiên Quý', 'Thiên Phúc'].includes(s)
  );
  const harshPhuc = (phuc.phuTinh || []).filter((s) =>
    ['Địa Không', 'Địa Kiếp', 'Kình Dương', 'Đà La', 'Hóa Kỵ'].includes(s)
  );

  delta += Math.min(4, goodPhuc.length * 2);
  delta -= Math.min(4, harshPhuc.length * 2);
  delta = clamp(delta, -5, 5);

  return {
    delta,
    note: `${label}: Phúc Đức tại ${phuc.chiName} (${phuc.isVoChinhDieu ? `VCD mượn ${phuc.effectiveChinhTinhNames.join(', ')}` : phuc.chinhTinhRaw.join(', ')})`,
  };
}

export function evaluateTamHopPillar(personA, personB, chartA, chartB, labelA, labelB) {
  const factors = [];
  let rawDelta = 0;

  // 1. 2-way Mệnh ⇄ Phu Thê
  const aToB = evaluateOneWayThaiCucMatch(personA, personB, chartB, labelA, labelB);
  const bToA = evaluateOneWayThaiCucMatch(personB, personA, chartA, labelB, labelA);

  const matchDelta = aToB.scoreDelta + bToA.scoreDelta;
  rawDelta += matchDelta;
  factors.push({
    label: `${aToB.title}: ${aToB.matchType}`,
    delta: aToB.scoreDelta,
    kind: aToB.scoreDelta > 0 ? 'good' : aToB.scoreDelta < 0 ? 'warn' : 'neutral',
  });
  factors.push({
    label: `${bToA.title}: ${bToA.matchType}`,
    delta: bToA.scoreDelta,
    kind: bToA.scoreDelta > 0 ? 'good' : bToA.scoreDelta < 0 ? 'warn' : 'neutral',
  });

  // 2. Direct Phu Thê quality of both charts
  const ptA = scoreSinglePhuTheQuality(personA, labelA);
  const ptB = scoreSinglePhuTheQuality(personB, labelB);
  const ptSum = ptA.delta + ptB.delta;
  rawDelta += ptSum;
  factors.push({
    label: `Chất lượng cung Phu Thê đôi bên (${ptA.rescued || ptB.rescued ? 'có sao chế hóa cứu giải' : 'xét độ sáng & Cát/Sát tinh'})`,
    delta: ptSum,
    kind: ptSum > 0 ? 'good' : ptSum < 0 ? 'warn' : 'neutral',
  });

  // 3. Phúc Đức foundation of both charts
  const pdA = scoreSinglePhucDucQuality(personA, labelA);
  const pdB = scoreSinglePhucDucQuality(personB, labelB);
  const pdSum = pdA.delta + pdB.delta;
  rawDelta += pdSum;
  factors.push({
    label: 'Gốc rễ cung Phúc Đức hậu vận hai lá số',
    delta: pdSum,
    kind: pdSum > 0 ? 'good' : pdSum < 0 ? 'warn' : 'neutral',
  });

  const score = clamp(66 + rawDelta, 25, 98);
  const detail = `${aToB.summary} ${bToA.summary} Nền tảng Phúc Đức hai bên đóng vai trò giữ lửa hậu vận.`;

  return {
    score,
    detail,
    factors,
    tamHopDetail: {
      aMenhToBPhuThe: {
        ...aToB,
        aMenhGroup: aToB.menhGroup,
        bPhuTheGroup: aToB.phuTheGroup,
      },
      bMenhToAPhuThe: {
        ...bToA,
        bMenhGroup: bToA.menhGroup,
        aPhuTheGroup: bToA.phuTheGroup,
      },
      phuTheComparison: {
        summary: `${ptA.note}. ${ptB.note}.`,
        aStars: ptA.stars || [],
        bStars: ptB.stars || [],
        aCatTinh: ptA.catTinh || [],
        bCatTinh: ptB.catTinh || [],
        aSatTinh: ptA.satTinh || [],
        bSatTinh: ptB.satTinh || [],
        personA: ptA,
        personB: ptB,
      },
      phucDucFoundation: {
        summary: `${pdA.note}; ${pdB.note}.`,
        score: clamp(72 + pdSum * 3, 35, 96),
        personA: pdA,
        personB: pdB,
      },
    },
  };
}

// ─── Pillar 2: Phi Tinh Tứ Hóa 2 Chiều (30%) ─────────────────────────────────

function indexChartStarsForMarriage(chart) {
  const palates = chart?.palates || [];
  const map = {};
  for (const p of palates) {
    const func = cleanPalaceFunc(p.chucNang);
    const stars = [...(p.chinhTinh || []).map(cleanStarName), ...(p.phuTinh || []).map(cleanStarName)];
    for (const s of stars) {
      map[s] = {
        chiIndex: p.chiIndex,
        chiName: p.chiName,
        chucNang: func,
        isMenh: Boolean(p.isMenh || func === 'Mệnh'),
        isThan: Boolean(p.isThan || String(p.chucNang || '').includes('<THÂN>')),
      };
    }
  }
  return map;
}

function evaluateOneWayMarriageSihua(sourceChart, targetChart, sourceLabel, targetLabel) {
  if (!sourceChart?.palates?.length || !targetChart?.palates?.length) {
    return { flights: [], totalDelta: 0, positiveCount: 0, kyClashCount: 0, locKhoaCore: false, quyenCore: false };
  }

  const targetStars = indexChartStarsForMarriage(targetChart);
  const birthStem = String(sourceChart.canChiNam || '').trim().split(/\s+/)[0];
  const menhPalace = findPalaceByName(sourceChart, 'Mệnh');
  const phuThePalace = findPalaceByName(sourceChart, 'Phu Thê');

  const emitters = [
    { key: 'birthYear', label: `Can Năm Sinh (${birthStem})`, stemName: birthStem },
    ...(menhPalace ? [{ key: 'menh', label: `Can Cung Mệnh (${menhPalace.canName})`, stemName: menhPalace.canName }] : []),
    ...(phuThePalace ? [{ key: 'phuThe', label: `Can Cung Phu Thê (${phuThePalace.canName})`, stemName: phuThePalace.canName }] : []),
  ];

  const flights = [];
  let totalDelta = 0;
  let positiveCount = 0;
  let kyClashCount = 0;
  let locKhoaCore = false;
  let quyenCore = false;

  for (const emitter of emitters) {
    const t = getSiHuaByStem(emitter.stemName);
    for (const shType of ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ']) {
      const starName = t[shType];
      const landed = targetStars[starName];
      if (!landed) continue;

      const pal = landed.chucNang;
      let delta = 0;
      let isClash = false;
      let clashTarget = null;
      let note = '';

      if (pal === 'Mệnh' || landed.isThan) {
        const tag = pal === 'Mệnh' ? 'cung Mệnh' : `cung ${pal} <Thân>`;
        if (shType === 'Hóa Lộc') {
          delta = emitter.key === 'menh' ? 8 : 7;
          locKhoaCore = true;
          note = `mang niềm vui, thiện cảm và phúc lộc tự nguyện đến ${tag} của ${targetLabel}`;
        } else if (shType === 'Hóa Khoa') {
          delta = emitter.key === 'menh' ? 7 : 6;
          locKhoaCore = true;
          note = `trân trọng, bao dung và dễ thấu hiểu tâm tư ${targetLabel} (${tag})`;
        } else if (shType === 'Hóa Quyền') {
          delta = 3;
          quyenCore = true;
          note = `chủ động che chở và nâng đỡ ${targetLabel} nhưng đôi khi muốn dẫn dắt`;
        } else if (shType === 'Hóa Kỵ') {
          delta = -5;
          kyClashCount++;
          note = `duyên nợ tiền kiếp sâu nặng với ${targetLabel}, rất quan tâm nhưng dễ lo âu khắt khe`;
        }
      } else if (pal === 'Phu Thê') {
        if (shType === 'Hóa Lộc') {
          delta = 7;
          locKhoaCore = true;
          note = `bồi đắp duyên lành ngọt ngào thẳng vào cung Phu Thê của ${targetLabel}`;
        } else if (shType === 'Hóa Khoa') {
          delta = 6;
          locKhoaCore = true;
          note = `đối đãi lịch thiệp, hóa giải mâu thuẫn tại cung Phu Thê của ${targetLabel}`;
        } else if (shType === 'Hóa Quyền') {
          delta = 2;
          quyenCore = true;
          note = `gắn kết trách nhiệm mạnh mẽ vào cung Phu Thê của ${targetLabel}`;
        } else if (shType === 'Hóa Kỵ') {
          delta = -5;
          kyClashCount++;
          note = `nặng nợ nhân duyên tại cung Phu Thê của ${targetLabel}, cần tránh chấp nhặt chuyện cũ`;
        }
      } else if (pal === 'Tật Ách') {
        if (shType === 'Hóa Lộc') {
          delta = emitter.key === 'birthYear' ? 4 : 6;
          locKhoaCore = true;
          note = `nhập Tật Ách ("thân thể của Mệnh"): sự gắn bó thân mật, thương yêu chăm sóc cho ${targetLabel}`;
        } else if (shType === 'Hóa Khoa') {
          delta = emitter.key === 'birthYear' ? 3 : 5;
          locKhoaCore = true;
          note = `nhập Tật Ách: dịu dàng ủi an sức khỏe và cảm xúc của ${targetLabel}`;
        } else if (shType === 'Hóa Kỵ') {
          delta = -3;
          note = `nhập Tật Ách: dễ chạm vào nỗi lo thầm kín của ${targetLabel}, cần tinh tế sẻ chia`;
        }
      } else if (pal === 'Phúc Đức') {
        if (shType === 'Hóa Lộc' || shType === 'Hóa Khoa') {
          delta = 4;
          note = `bồi đắp sự an vui tinh thần tại cung Phúc Đức của ${targetLabel}`;
        } else if (shType === 'Hóa Kỵ') {
          delta = -3;
          note = `nhập Phúc Đức của ${targetLabel}: đôi khi làm đối phương suy nghĩ trăn trở`;
        }
      } else if (pal === 'Điền Trạch') {
        if (shType === 'Hóa Lộc') {
          delta = 4;
          note = `vượng khí vun đắp nhà cửa và kho tài sản gia đình (${targetLabel})`;
        } else if (shType === 'Hóa Khoa') {
          delta = 3;
          note = `giữ gìn nề nếp êm ấm trong tổ ấm (${targetLabel})`;
        } else if (shType === 'Hóa Kỵ') {
          delta = -2;
          note = `nhập Điền Trạch: cần thống nhất sinh hoạt trong nhà với ${targetLabel}`;
        }
      } else if (pal === 'Thiên Di') {
        if (shType === 'Hóa Kỵ') {
          delta = -7;
          isClash = true;
          clashTarget = 'Mệnh';
          kyClashCount++;
          note = `nhập Thiên Di XUNG CHIẾU trực tiếp cung Mệnh của ${targetLabel} (Kỵ xung mạnh hơn Kỵ nhập, cần đặc biệt mềm mỏng lắng nghe)`;
        } else if (shType === 'Hóa Lộc' || shType === 'Hóa Khoa') {
          delta = 3;
          note = `từ Thiên Di chiếu sáng cát khí về cung Mệnh của ${targetLabel}`;
        }
      } else if (pal === 'Quan Lộc') {
        if (shType === 'Hóa Kỵ') {
          delta = -6;
          isClash = true;
          clashTarget = 'Phu Thê';
          kyClashCount++;
          note = `nhập Quan Lộc XUNG CHIẾU cung Phu Thê của ${targetLabel} (tránh để áp lực công việc ảnh hưởng hòa khí vợ chồng)`;
        } else if (shType === 'Hóa Lộc' || shType === 'Hóa Khoa') {
          delta = 3;
          note = `trợ lực công danh và chiếu cát khí về cung Phu Thê của ${targetLabel}`;
        }
      } else if (pal === 'Tài Bạch') {
        if (shType === 'Hóa Lộc') {
          delta = 3;
          note = `trợ vượng tài lộc thực tế cho ${targetLabel}`;
        } else if (shType === 'Hóa Kỵ') {
          delta = -3;
          isClash = true;
          clashTarget = 'Phúc Đức';
          note = `nhập Tài Bạch xung chiếu Phúc Đức của ${targetLabel} (cần minh bạch kế hoạch tài chính chung)`;
        }
      }

      if (delta !== 0) {
        totalDelta += delta;
        if (delta > 0) positiveCount += delta;
        flights.push({
          emitterKey: emitter.key,
          emitterLabel: `${sourceLabel} · ${emitter.label}`,
          stemName: emitter.stemName,
          siHua: shType,
          starName,
          targetPalace: pal,
          targetChiName: landed.chiName,
          targetIsThan: landed.isThan,
          isClash,
          clashTarget,
          isAuspicious: delta > 0,
          scoreDelta: delta,
          meaning: note ? `${note.charAt(0).toUpperCase()}${note.slice(1)}.` : '',
          summary: `${sourceLabel} (${emitter.label}) phi ${shType} (${starName}) → ${pal} (${landed.chiName}) của ${targetLabel}: ${note}.`,
        });
      }
    }
  }

  // Sort flights by impact magnitude while preserving determinism
  flights.sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta));

  return {
    flights,
    totalDelta: clamp(totalDelta, -22, 24),
    positiveCount,
    kyClashCount,
    locKhoaCore,
    quyenCore,
  };
}

export function evaluatePhiTinhPillar(personA, personB, chartA, chartB, labelA, labelB) {
  const aToB = evaluateOneWayMarriageSihua(chartA, chartB, labelA, labelB);
  const bToA = evaluateOneWayMarriageSihua(chartB, chartA, labelB, labelA);
  const internalA = chartA?.palates?.length
    ? analyzeInternalMarriageFlows(chartA)
    : { notes: [], flowItems: [], internalScoreDelta: 0 };
  const internalB = chartB?.palates?.length
    ? analyzeInternalMarriageFlows(chartB)
    : { notes: [], flowItems: [], internalScoreDelta: 0 };

  const factors = [];
  let totalDelta = aToB.totalDelta + bToA.totalDelta;

  factors.push({
    label: `Phi hóa từ ${labelA} sang các cung trọng yếu của ${labelB} (${aToB.flights.length} đường bay đáng chú ý)`,
    delta: aToB.totalDelta,
    kind: aToB.totalDelta > 0 ? 'good' : aToB.totalDelta < 0 ? 'warn' : 'neutral',
  });
  factors.push({
    label: `Phi hóa từ ${labelB} sang các cung trọng yếu của ${labelA} (${bToA.flights.length} đường bay đáng chú ý)`,
    delta: bToA.totalDelta,
    kind: bToA.totalDelta > 0 ? 'good' : bToA.totalDelta < 0 ? 'warn' : 'neutral',
  });

  // Reciprocal resonance checks (100% symmetric)
  if (aToB.locKhoaCore && bToA.locKhoaCore) {
    totalDelta += 5;
    factors.push({
      label: 'Song Lộc / Song Khoa Giao Chiếu: hai bản mệnh đều mang phúc khí nâng đỡ Mệnh/Phu Thê/Tật Ách của nhau',
      delta: 5,
      kind: 'good',
    });
  }
  if (aToB.quyenCore && bToA.quyenCore) {
    totalDelta -= 3;
    factors.push({
      label: 'Lưỡng Quyền Tương Đối: cả hai đều phi Hóa Quyền sang nhau, cần phân công rõ việc ai người nấy quyết',
      delta: -3,
      kind: 'warn',
    });
  }
  if (aToB.kyClashCount > 0 && bToA.kyClashCount > 0) {
    totalDelta -= 4;
    factors.push({
      label: 'Song Kỵ Giao Triền: duyên nợ tiền kiếp ràng buộc chặt, cần tránh suy diễn hay đay nghiến lúc mệt mỏi',
      delta: -4,
      kind: 'warn',
    });
  }

  const internalSum = Math.round((internalA.internalScoreDelta + internalB.internalScoreDelta) * 0.6);
  if (internalSum !== 0) {
    totalDelta += internalSum;
    factors.push({
      label: 'Nội tại dòng khí hôn nhân Lương Phái (Tự Hóa & Lộc/Kỵ chuyển hóa cung Phu Thê)',
      delta: internalSum,
      kind: internalSum > 0 ? 'good' : 'warn',
    });
  }

  const score = clamp(64 + totalDelta, 25, 98);

  let whoSupportsWhom;
  if (aToB.totalDelta - bToA.totalDelta >= 5) {
    whoSupportsWhom = `${labelA} phi nhiều Hóa Lộc / Hóa Khoa trợ lực mạnh cho ${labelB}, đóng vai trò người chủ động trao đi phúc khí và che chở nhiều hơn.`;
  } else if (bToA.totalDelta - aToB.totalDelta >= 5) {
    whoSupportsWhom = `${labelB} phi nhiều Hóa Lộc / Hóa Khoa trợ lực mạnh cho ${labelA}, là nguồn động viên tinh thần và vượng khí rất lớn cho đối phương.`;
  } else if (aToB.totalDelta > 0 && bToA.totalDelta > 0) {
    whoSupportsWhom = `Hai lá số trao nhận Hóa Lộc / Hóa Khoa cân bằng hai chiều — đôi bên đều mang lại may mắn và sự nâng đỡ thiết thực cho nhau.`;
  } else {
    whoSupportsWhom = `Tứ Hóa giữa hai lá số thiên về duyên nợ rèn giũa lẫn nhau; càng trưởng thành và bớt cầu toàn thì tình nghĩa càng sâu sắc.`;
  }

  return {
    score,
    detail: `${whoSupportsWhom} Đã khảo sát đầy đủ Can Năm Sinh, Can Cung Mệnh và Can Cung Phu Thê hai chiều.`,
    factors,
    phiTinhDetail: {
      aToBFlights: aToB.flights.slice(0, 8),
      bToAFlights: bToA.flights.slice(0, 8),
      internalFlows: {
        personA: internalA.flowItems || [],
        personB: internalB.flowItems || [],
      },
      whoSupportsWhom,
    },
  };
}

// ─── Pillar 3: Bù Trừ Tính Cách Âm Dương · Cương Nhu (20%) ───────────────────

function countCalmBufferStars(person) {
  const ps = person?.palaceSummary;
  if (!ps) return 0;
  const collected = new Set();
  for (const pal of [ps.menh, ps.than, ps.phucDuc, ps.phuThe]) {
    if (!pal) continue;
    for (const s of [...(pal.effectiveChinhTinhNames || []), ...(pal.phuTinh || [])]) {
      if (CALM_BUFFER_STARS.has(s)) collected.add(s);
      if (s === 'Thái Âm' && pal.brightnessAvg >= 70) collected.add('Thái Âm sáng');
    }
  }
  return collected.size;
}

export function evaluateTinhCachPillar(personA, personB, labelA, labelB) {
  const tempA = personA?.temperament || {
    mode: 'CanBang',
    label: 'Cương Nhu Quân Bình',
    yangScore: 50,
    yinScore: 50,
    traits: { nongNay: 40, hayGhen: 40, tuAiCao: 40, apDat: 40, khacKhau: 40 },
    traitNotes: [],
  };
  const tempB = personB?.temperament || {
    mode: 'CanBang',
    label: 'Cương Nhu Quân Bình',
    yangScore: 50,
    yinScore: 50,
    traits: { nongNay: 40, hayGhen: 40, tuAiCao: 40, apDat: 40, khacKhau: 40 },
    traitNotes: [],
  };

  const factors = [];
  const frictionWarnings = [];
  const harmonyTips = [];
  let delta = 0;

  // 1. Cương – Nhu Mode Pairing (Symmetric!)
  const modes = [tempA.mode, tempB.mode].sort().join('+');
  let complementarityType = 'Quân Bình Hài Hòa';

  if (modes === 'Cuong+Nhu') {
    delta += 14;
    complementarityType = 'Một Cương Một Nhu · Bù Trừ Lý Tưởng';
    factors.push({
      label: 'Âm Dương Cương Nhu tương phối (PP3 Dương Dịch Đức): một bên quyết đoán mở đường, một bên mềm mỏng giữ hòa khí',
      delta: 14,
      kind: 'good',
    });
    harmonyTips.push('Phát huy thế mạnh tự nhiên: bên Cương quyết định mục tiêu đối ngoại, bên Nhu điều tiết nhịp ấm êm trong gia đình.');
  } else if (modes === 'CanBang+Cuong' || modes === 'CanBang+Nhu') {
    delta += 10;
    complementarityType = 'Linh Hoạt Điều Tiết · Nâng Đỡ Tốt';
    factors.push({
      label: 'Một bên Cương Nhu Quân Bình biết linh hoạt thích nghi với cá tính của bạn đời',
      delta: 10,
      kind: 'good',
    });
    harmonyTips.push('Người có khí chất Quân Bình đóng vai trò "nhịp cầu" giữ sự cân bằng khi người kia bận rộn hoặc căng thẳng.');
  } else if (modes === 'CanBang+CanBang') {
    delta += 12;
    complementarityType = 'Song Phương Quân Bình · Dễ Đồng Thuận';
    factors.push({
      label: 'Cả hai đều có khí chất Cương Nhu Quân Bình: điềm đạm, tôn trọng lý lẽ và dễ bàn bạc',
      delta: 12,
      kind: 'good',
    });
    harmonyTips.push('Duy trì sự lãng mạn và trải nghiệm mới mẻ để đời sống hôn nhân luôn sinh động.');
  } else if (modes === 'Cuong+Cuong') {
    const bothVeryStrong = tempA.yangScore >= 66 && tempB.yangScore >= 66;
    const pen = bothVeryStrong ? -11 : -7;
    delta += pen;
    complementarityType = 'Lưỡng Cương Đối Lập · Cần Nhường Nhịn';
    factors.push({
      label: 'Lưỡng Cương hội ngộ: cả hai đều bản lĩnh, độc lập và quyết đoán mạnh nên dễ chạm cái tôi',
      delta: pen,
      kind: 'warn',
    });
    frictionWarnings.push('Khi cả hai cùng căng thẳng, tuyệt đối tránh phân định đúng – sai ngay lập tức.');
    harmonyTips.push('Áp dụng nguyên tắc "phân vùng tự chủ": mỗi người làm chủ một mảng chuyên môn trong gia đình để tôn trọng uy tín nhau.');
  } else if (modes === 'Nhu+Nhu') {
    const bothVerySoft = tempA.yinScore >= 66 && tempB.yinScore >= 66;
    const pen = bothVerySoft ? -6 : -3;
    delta += pen;
    complementarityType = 'Lưỡng Nhu Ôn Hòa · Cần Thêm Quyết Đoán';
    factors.push({
      label: 'Lưỡng Nhu tương hội: đời sống êm đềm ít to tiếng nhưng đôi khi chần chừ trước quyết định lớn',
      delta: pen,
      kind: 'warn',
    });
    harmonyTips.push('Cần đặt mốc thời gian cụ thể khi bàn việc tài chính, mua nhà hoặc định hướng con cái để tránh trì hoãn.');
  }

  // 2. 5 Friction Traits Double-High Check (Symmetric!)
  const traitChecks = [
    {
      key: 'nongNay',
      threshold: 64,
      pen: -6,
      warn: 'Cả hai đều có chỉ số nóng nảy cao (Hỏa/Sát tinh vượng): dễ bùng nổ cảm xúc tức thời.',
      tip: 'Thống nhất quy tắc "tạm dừng 20 phút" khi một trong hai đang bực bội trước khi tiếp tục nói chuyện.',
    },
    {
      key: 'tuAiCao',
      threshold: 68,
      pen: -5,
      warn: 'Cả hai đều có lòng tự tôn cao: khi giận dễ im lặng chờ đối phương làm lành trước.',
      tip: 'Luôn khen ngợi trước mặt người ngoài và chỉ góp ý riêng tư bằng thái độ tôn trọng.',
    },
    {
      key: 'apDat',
      threshold: 68,
      pen: -5,
      warn: 'Cả hai đều quen cầm trịch quyết định, dễ sinh cảm giác bị kiểm soát.',
      tip: 'Chuyển câu mệnh lệnh thành câu hỏi xin ý kiến để người bạn đời cảm thấy được đồng sở hữu quyết định.',
    },
    {
      key: 'khacKhau',
      threshold: 62,
      pen: -6,
      warn: 'Cả hai đều sắc sảo ngôn từ (dấu ấn Cự Môn / Hóa Kỵ / Hình tinh): dễ khắc khẩu vì chuyện nhỏ.',
      tip: 'Tập trung giải quyết sự việc hiện tại, không nhắc lại lỗi cũ và tránh dùng từ ngữ tuyệt đối hóa.',
    },
    {
      key: 'hayGhen',
      threshold: 64,
      pen: -4,
      warn: 'Cả hai đều nhạy cảm sở hữu trong tình yêu, dễ lo nghĩ khi thiếu thông tin.',
      tip: 'Chủ động minh bạch các mối quan hệ xã hội và tạo thói quen chia sẻ lịch trình tự nhiên.',
    },
  ];

  for (const tc of traitChecks) {
    const vA = tempA.traits?.[tc.key] ?? 40;
    const vB = tempB.traits?.[tc.key] ?? 40;
    if (vA >= tc.threshold && vB >= tc.threshold) {
      delta += tc.pen;
      frictionWarnings.push(tc.warn);
      harmonyTips.push(tc.tip);
      factors.push({
        label: tc.warn,
        delta: tc.pen,
        kind: 'warn',
      });
    }
  }

  // 3. Calm / Tolerant Star Buffering (Symmetric sum of A buffering B + B buffering A)
  const calmA = countCalmBufferStars(personA);
  const calmB = countCalmBufferStars(personB);
  const maxSharpA = Math.max(tempA.traits.nongNay, tempA.traits.khacKhau, tempA.traits.apDat);
  const maxSharpB = Math.max(tempB.traits.nongNay, tempB.traits.khacKhau, tempB.traits.apDat);

  let bufferBonus = 0;
  if (maxSharpA >= 64 && calmB >= 2) bufferBonus += 4;
  if (maxSharpB >= 64 && calmA >= 2) bufferBonus += 4;

  if (bufferBonus > 0) {
    delta += bufferBonus;
    factors.push({
      label: 'Sao Phúc / Khoa / Quang Quý của một bên làm dịu và bao dung cho nét tính cách sắc cạnh của bên kia',
      delta: bufferBonus,
      kind: 'good',
    });
  }

  const score = clamp(68 + delta, 25, 98);
  const summary = `${complementarityType}: ${labelA} (${tempA.label}) kết hợp cùng ${labelB} (${tempB.label}).`;

  return {
    score,
    detail: summary + (frictionWarnings[0] ? ` Lưu ý: ${frictionWarnings[0]}` : ' Tương quan tính cách tạo nền tảng giao tiếp thuận hòa.'),
    factors,
    tinhCachDetail: {
      complementarityType,
      summary,
      personA: tempA,
      personB: tempB,
      frictionWarnings,
      harmonyTips: harmonyTips.slice(0, 4),
    },
  };
}

// ─── Pillar 4: Ngũ Hành Nạp Âm · Can Chi & Duyên Hỷ Tín (15%) ────────────────

function evaluateNapAmInteraction(personA, personB, labelA, labelB) {
  const mA = personA?.menh || 'Thuy';
  const mB = personB?.menh || 'Thuy';
  const napA = personA?.napAm || ELEMENTS[mA];
  const napB = personB?.napAm || ELEMENTS[mB];
  const pairSet = new Set([napA, napB]);
  const hasAny = (list) => list.some((x) => pairSet.has(x));
  const hasBothFrom = (list1, list2) =>
    (list1.includes(napA) && list2.includes(napB)) || (list1.includes(napB) && list2.includes(napA));

  // 1. Tương Sinh (Symmetric score!)
  if (SINH[mA] === mB || SINH[mB] === mA) {
    const giverLabel = SINH[mA] === mB ? labelA : labelB;
    const receiverLabel = SINH[mA] === mB ? labelB : labelA;
    const giverElem = SINH[mA] === mB ? ELEMENTS[mA] : ELEMENTS[mB];
    const receiverElem = SINH[mA] === mB ? ELEMENTS[mB] : ELEMENTS[mA];
    const interaction = `${giverElem} sinh ${receiverElem}`;

    let bonus = 14;
    let extraNote = '';
    if (
      hasBothFrom(['Hải Trung Kim', 'Kiếm Phong Kim', 'Kim Bạc Kim'], ['Giản Hạ Thủy', 'Tuyền Trung Thủy', 'Đại Khê Thủy']) ||
      hasBothFrom(['Đại Khê Thủy', 'Trường Lưu Thủy', 'Thiên Hà Thủy'], ['Đại Lâm Mộc', 'Tùng Bách Mộc', 'Dương Liễu Mộc']) ||
      hasBothFrom(['Đại Lâm Mộc', 'Tùng Bách Mộc', 'Bình Địa Mộc'], ['Lư Trung Hỏa', 'Phúc Đăng Hỏa', 'Sơn Đầu Hỏa']) ||
      hasBothFrom(['Lư Trung Hỏa', 'Sơn Đầu Hỏa', 'Sơn Hạ Hỏa'], ['Thành Đầu Thổ', 'Ốc Thượng Thổ', 'Sa Trung Thổ']) ||
      hasBothFrom(['Thành Đầu Thổ', 'Sa Trung Thổ', 'Lộ Trung Thổ'], ['Sa Trung Kim', 'Bạch Lạp Kim', 'Thoa Xuyến Kim'])
    ) {
      bonus += 2;
      extraNote = ' Nạp Âm tương sinh đắc cách, nguồn khí bồi đắp dồi dào.';
    }

    return {
      delta: bonus,
      interaction,
      detail: `${interaction} (${napA} & ${napB}): ${giverLabel} tự nhiên che chở, tiếp sức và nuôi dưỡng vận khí cho ${receiverLabel}.${extraNote}`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  // 2. Tỷ Hòa (Cùng hành — Symmetric!)
  if (mA === mB) {
    const elemName = ELEMENTS[mA];
    const tyHoaMap = {
      Thuy: { delta: 8, phrase: 'Lưỡng Thủy thành giang — đồng thanh tương ứng, dễ thấu hiểu tâm ý' },
      Moc: { delta: 8, phrase: 'Lưỡng Mộc thành lâm — cùng nhau vươn lên xây dựng tổ ấm' },
      Tho: { delta: 7, phrase: 'Lưỡng Thổ thành sơn — điềm đạm, bền vững và giữ chữ tín' },
      Kim: {
        delta: napA === 'Kiếm Phong Kim' && napB === 'Kiếm Phong Kim' ? 4 : 7,
        phrase: 'Lưỡng Kim thành khí — thẳng thắn, rõ ràng và đồng lòng quản trị tài sản',
      },
      Hoa: {
        delta: hasAny(['Thiên Thượng Hỏa', 'Tích Lịch Hỏa']) && napA === napB ? 4 : 6,
        phrase: 'Lưỡng Hỏa vi minh — ấm áp nhiệt thành, chỉ cần tránh cùng lúc nóng vội',
      },
    };
    const cfg = tyHoaMap[mA] || { delta: 6, phrase: 'đồng hành bình hòa' };
    return {
      delta: cfg.delta,
      interaction: `Tỷ hòa (${elemName} – ${elemName})`,
      detail: `Đồng hành ${elemName} (${napA} & ${napB}): ${cfg.phrase}.`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  // 3. Tương Khắc (Full matrix + Nạp Âm Đắc Cách exceptions — Symmetric!)
  const aControlsB = KHAC[mA] === mB;
  const controllerElem = aControlsB ? ELEMENTS[mA] : ELEMENTS[mB];
  const targetElem = aControlsB ? ELEMENTS[mB] : ELEMENTS[mA];
  const khacKey = aControlsB ? `${mA}->${mB}` : `${mB}->${mA}`;
  const bridgeElem = INTERMEDIATE_ELEMENT[khacKey] || 'cân bằng';

  // Classic Nạp Âm Đắc Cách trong Khắc
  if (
    hasBothFrom(
      ['Kiếm Phong Kim', 'Sa Trung Kim', 'Bạch Lạp Kim'],
      ['Lư Trung Hỏa', 'Sơn Hạ Hỏa', 'Phúc Đăng Hỏa']
    )
  ) {
    return {
      delta: 4,
      interaction: `${controllerElem} khắc ${targetElem} (Đắc cách Hỏa luyện Chân Kim)`,
      detail: `${napA} gặp ${napB}: tuy hành Hỏa khắc Kim nhưng thuộc thượng cách "Hỏa luyện Chân Kim thành bảo khí" — hai người rèn giũa giúp nhau càng thêm bản lĩnh và thành đạt.`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  if (hasBothFrom(['Kiếm Phong Kim'], ['Đại Lâm Mộc', 'Tùng Bách Mộc', 'Dương Liễu Mộc'])) {
    return {
      delta: 3,
      interaction: `${controllerElem} khắc ${targetElem} (Đắc cách Kim tu bổ Mộc)`,
      detail: `${napA} gặp ${napB}: thuộc cách "Kim tài thành Mộc khí" — đao kiếm cắt tỉa gỗ lớn thành rường cột, góp ý thẳng thắn giúp nhau trưởng thành.`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  if (
    hasBothFrom(
      ['Thành Đầu Thổ', 'Sa Trung Thổ', 'Đại Dịch Thổ'],
      ['Đại Hải Thủy', 'Trường Lưu Thủy', 'Đại Khê Thủy']
    )
  ) {
    return {
      delta: 3,
      interaction: `${controllerElem} khắc ${targetElem} (Đắc cách Thổ chế Thủy hộ đê)`,
      detail: `${napA} gặp ${napB}: thuộc cách "Đê điều dẫn dòng nước lớn" — định hướng nguồn lực vào khuôn khổ sinh tài lộc vững chắc.`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  if (
    hasBothFrom(
      ['Bình Địa Mộc', 'Tang Đố Mộc', 'Dương Liễu Mộc'],
      ['Đại Dịch Thổ', 'Sa Trung Thổ', 'Lộ Trung Thổ']
    )
  ) {
    return {
      delta: 2,
      interaction: `${controllerElem} khắc ${targetElem} (Đắc cách Mộc Thổ giao dung)`,
      detail: `${napA} gặp ${napB}: cây cỏ nương tựa đất rộng, tuy khắc về danh nhưng thực tế nương tựa bồi đắp cho nhau.`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  if (hasBothFrom(['Giản Hạ Thủy', 'Tuyền Trung Thủy'], ['Thiên Thượng Hỏa', 'Tích Lịch Hỏa'])) {
    return {
      delta: 2,
      interaction: `${controllerElem} khắc ${targetElem} (Đắc cách Thủy Hỏa ký tế)`,
      detail: `${napA} gặp ${napB}: nắng mưa điều hòa thành tượng "Thủy Hỏa ký tế", bổ khuyết năng lượng cho nhau.`,
      isHarshKhac: false,
      remedy: null,
    };
  }

  // Harsh Nạp Âm Khắc
  const isHarsh =
    hasBothFrom(['Đại Hải Thủy', 'Thiên Hà Thủy'], ['Lư Trung Hỏa', 'Phúc Đăng Hỏa', 'Sơn Hạ Hỏa']) ||
    hasBothFrom(['Thiên Thượng Hỏa', 'Lư Trung Hỏa'], ['Kim Bạc Kim', 'Thoa Xuyến Kim']) ||
    hasBothFrom(['Kiếm Phong Kim'], ['Bình Địa Mộc', 'Thạch Lựu Mộc']);

  const pen = isHarsh ? -11 : -7;
  return {
    delta: pen,
    interaction: `${controllerElem} khắc ${targetElem}`,
    detail: `${controllerElem} khắc ${targetElem} (${napA} & ${napB}): khác biệt nhịp năng lượng bẩm sinh, dễ có lúc lệch pha thói quen sinh hoạt; có thể dùng hành ${bridgeElem} (Thông Quan) và sự nhường nhịn để chuyển khắc thành bổ trợ.`,
    isHarshKhac: true,
    remedy: `Dùng nguyên lý Thông Quan hành ${bridgeElem} trong không gian sống / phong cách giao tiếp và tránh tranh hơn thua để hóa giải thế ${controllerElem} khắc ${targetElem}.`,
  };
}

function evaluateThienCanRelation(canA, canB) {
  const iA = THIEN_CAN.indexOf(canA);
  const iB = THIEN_CAN.indexOf(canB);
  if (iA < 0 || iB < 0) return { delta: 0, label: 'Chưa xác định Thiên Can' };

  const diff = Math.abs(iA - iB);
  if (diff === 5) {
    return { delta: 8, label: `Thiên Can Ngũ Hợp (${canA} – ${canB}): tâm đầu ý hợp, dễ đồng lòng việc lớn` };
  }
  if (diff === 6) {
    return { delta: -5, label: `Thiên Can Tương Xung (${canA} – ${canB}): góc nhìn tiếp cận vấn đề đôi khi trái chiều` };
  }
  return { delta: 0, label: `Thiên Can Bình Hòa (${canA} – ${canB})` };
}

function evaluateDiaChiRelation(chiA, chiB) {
  const bA = DIA_CHI.indexOf(chiA);
  const bB = DIA_CHI.indexOf(chiB);
  if (bA < 0 || bB < 0) return { delta: 0, label: 'Chưa xác định Địa Chi' };

  if (bA !== bB && (bA + bB) % 12 === 1) {
    return { delta: 8, label: `Địa Chi Lục Hợp (${chiA} – ${chiB}): gắn bó quấn quýt, gia đạo thuận hòa` };
  }
  if (bA !== bB && (bA - bB + 12) % 4 === 0) {
    return { delta: 7, label: `Địa Chi Tam Hợp (${chiA} – ${chiB}): đồng chí hướng, phối hợp ăn ý` };
  }
  if (Math.abs(bA - bB) === 6) {
    return {
      delta: -6,
      label: `Địa Chi Lục Xung (${chiA} – ${chiB}): tuổi xung nhịp điệu bên ngoài (nhưng Mệnh · Phu Thê · Phúc Đức mới là gốc quyết định)`,
    };
  }
  if ((bA + bB) % 12 === 7) {
    return {
      delta: -4,
      label: `Địa Chi Lục Hại (${chiA} – ${chiB}): tránh để lời bàn tán bên ngoài gây hiểu lầm giữa hai người`,
    };
  }
  return { delta: 0, label: `Địa Chi Bình Hòa (${chiA} – ${chiB})` };
}

function evaluatePersonRomanceStars(person, chart) {
  if (!chart?.palates?.length) {
    const entries = person?.daoHoaStars || [];
    const hyCount = entries.filter((e) => CHINH_DAO_HOA_STARS.has(e.sao)).length;
    return {
      delta: clamp(Math.min(4, hyCount), 0, 4),
      hyList: entries.filter((e) => CHINH_DAO_HOA_STARS.has(e.sao)).map((e) => `${e.sao} (${e.cung})`),
      diemRisk: false,
    };
  }

  const keyFuncs = new Set(['Mệnh', 'Phu Thê', 'Phúc Đức', 'Thiên Di']);
  const hyList = [];
  let hyPoints = 0;
  let diemPoints = 0;
  let diemRisk = false;

  for (const p of chart.palates) {
    const func = cleanPalaceFunc(p.chucNang);
    const isKey = keyFuncs.has(func) || p.isThan;
    const stars = [...(p.chinhTinh || []).map(cleanStarName), ...(p.phuTinh || []).map(cleanStarName)];
    const starSet = new Set(stars);

    if (isKey) {
      for (const s of stars) {
        if (CHINH_DAO_HOA_STARS.has(s)) {
          hyPoints += func === 'Phu Thê' || func === 'Mệnh' ? 2 : 1;
          hyList.push(`${s} (${func})`);
        }
      }
    }

    const hasDiem = stars.some((s) => DIEM_TINH_STARS.has(s));
    if (hasDiem && ['Phu Thê', 'Thiên Di', 'Nô Bộc'].includes(func)) {
      const hasTrouble =
        starSet.has('Hóa Kỵ') || starSet.has('Phục Binh') || starSet.has('Địa Không') || starSet.has('Địa Kiếp');
      if (hasTrouble) {
        diemRisk = true;
      } else if (func === 'Phu Thê' || func === 'Mệnh') {
        diemPoints += 1;
      }
    }
  }

  const delta = Math.min(5, hyPoints + Math.min(1, diemPoints)) + (diemRisk ? -3 : 0);
  return { delta, hyList: [...new Set(hyList)].slice(0, 5), diemRisk };
}

export function evaluateNguHanhDaoHoaPillar(personA, personB, chartA, chartB, labelA, labelB) {
  const factors = [];
  let delta = 0;

  // 1. Ngũ Hành Nạp Âm
  const napAmRes = evaluateNapAmInteraction(personA, personB, labelA, labelB);
  delta += napAmRes.delta;
  factors.push({
    label: `Ngũ Hành Nạp Âm: ${napAmRes.interaction}`,
    delta: napAmRes.delta,
    kind: napAmRes.delta > 0 ? 'good' : napAmRes.delta < 0 ? 'warn' : 'neutral',
  });

  // 2. Thiên Can Năm Sinh
  const canRes = evaluateThienCanRelation(personA?.canNam, personB?.canNam);
  if (personA?.canNam && personB?.canNam) {
    delta += canRes.delta;
    factors.push({
      label: canRes.label,
      delta: canRes.delta,
      kind: canRes.delta > 0 ? 'good' : canRes.delta < 0 ? 'warn' : 'neutral',
    });
  }

  // 3. Địa Chi Năm Sinh
  const chiRes = evaluateDiaChiRelation(personA?.chiNam, personB?.chiNam);
  if (personA?.chiNam && personB?.chiNam) {
    delta += chiRes.delta;
    factors.push({
      label: chiRes.label,
      delta: chiRes.delta,
      kind: chiRes.delta > 0 ? 'good' : chiRes.delta < 0 ? 'warn' : 'neutral',
    });
  }

  // 4. Chính Đào Hoa / Hỷ Tinh vs Diễm Tinh
  const romA = evaluatePersonRomanceStars(personA, chartA);
  const romB = evaluatePersonRomanceStars(personB, chartB);
  const romSum = romA.delta + romB.delta;
  delta += romSum;
  factors.push({
    label:
      romA.diemRisk || romB.diemRisk
        ? 'Sao Tình Duyên: có Chính Hỷ Tinh nhưng kèm Diễm Tinh gặp Kỵ/Binh/Không Kiếp (cần giữ ranh giới cảm xúc bên ngoài)'
        : 'Sao Tình Duyên & Chính Hỷ Tinh (Hồng Loan, Thiên Hỷ, Văn Khúc, Hữu Bật, Hóa Khoa/Lộc) bồi đắp duyên lành',
    delta: romSum,
    kind: romSum > 0 ? 'good' : romSum < 0 ? 'warn' : 'neutral',
  });

  const score = clamp(65 + delta, 25, 98);
  const detailParts = [napAmRes.detail];
  if (personA?.canNam && personB?.canNam) detailParts.push(`${canRes.label}; ${chiRes.label}.`);
  if (romA.diemRisk || romB.diemRisk) {
    detailParts.push('Có Diễm Tinh hội Kỵ/Binh ở cung ngoại giao, đôi bên nên giữ sự minh bạch để bảo vệ niềm tin.');
  }

  return {
    score,
    detail: detailParts.join(' '),
    factors,
    elements: {
      husbandElement: ELEMENTS[personA?.menh] || 'Chưa rõ',
      wifeElement: ELEMENTS[personB?.menh] || 'Chưa rõ',
      husbandNapAm: personA?.napAm || ELEMENTS[personA?.menh] || '',
      wifeNapAm: personB?.napAm || ELEMENTS[personB?.menh] || '',
      interaction: napAmRes.interaction,
      thienCanRelation: canRes.label,
      diaChiRelation: chiRes.label,
    },
    khacRemedy: napAmRes.remedy,
    diemRisk: romA.diemRisk || romB.diemRisk,
  };
}

// ─── 4-Tier Verdict & Master Assessment ──────────────────────────────────────

export function classifyCompatibilityTier(totalScore) {
  if (totalScore >= 80) {
    return {
      tier: 'thuong_dang',
      ratingText: 'Thượng Đẳng Hợp Hôn · Duyên Khởi Tương Đắc',
    };
  }
  if (totalScore >= 68) {
    return {
      tier: 'trung_thuong',
      ratingText: 'Trung Thượng Hợp Hôn · Tương Hợp & Bổ Khuyết Tốt',
    };
  }
  if (totalScore >= 55) {
    return {
      tier: 'trung_binh',
      ratingText: 'Trung Bình Hòa Hợp · Cần Thấu Hiểu & Dung Hòa',
    };
  }
  return {
    tier: 'can_hoa_giai',
    ratingText: 'Nhiều Điểm Đối Khắc · Cần Chủ Động Hóa Giải',
  };
}

function normalizeEvaluatorSide(arg, explicitChart) {
  if (!arg) return { person: {}, chart: explicitChart || null };
  if (arg.person && arg.result) {
    return { person: arg.person, chart: explicitChart || arg.result };
  }
  const chart = explicitChart || arg._chart || null;
  let person = arg;
  if (chart && (!person.palaceSummary || !person.temperament)) {
    person = buildPersonProfileFromChart({
      hoTen: person.hoTen || 'Ẩn danh',
      gioiTinh: person.gioiTinh || 'Nam',
      inputData: person._inputData || {},
      result: chart,
    });
  }
  return { person, chart };
}

export function evaluateCompatibility(chongArg, voArg, chartArgA, chartArgB) {
  const sideA = normalizeEvaluatorSide(chongArg, chartArgA);
  const sideB = normalizeEvaluatorSide(voArg, chartArgB);
  const personA = sideA.person;
  const personB = sideB.person;
  const chartA = sideA.chart;
  const chartB = sideB.chart;

  const labelA = personA.hoTen || 'Người A';
  const labelB = personB.hoTen || 'Người B';

  const tamHopRes = evaluateTamHopPillar(personA, personB, chartA, chartB, labelA, labelB);
  const phiTinhRes = evaluatePhiTinhPillar(personA, personB, chartA, chartB, labelA, labelB);
  const tinhCachRes = evaluateTinhCachPillar(personA, personB, labelA, labelB);
  const nguHanhRes = evaluateNguHanhDaoHoaPillar(personA, personB, chartA, chartB, labelA, labelB);

  const cards = {
    tamHop: {
      title: 'Tam Hợp Mệnh · Phu Thê · Phúc Đức',
      shortTitle: 'Tam Hợp Bàn',
      weight: WEIGHTS.tamHop,
      score: tamHopRes.score,
      detail: tamHopRes.detail,
      provisional: false,
      factors: tamHopRes.factors,
    },
    phiTinh: {
      title: 'Phi Tinh Tứ Hóa 2 Chiều',
      shortTitle: 'Phi Tinh Tứ Hóa',
      weight: WEIGHTS.phiTinh,
      score: phiTinhRes.score,
      detail: phiTinhRes.detail,
      provisional: false,
      factors: phiTinhRes.factors,
    },
    tinhCach: {
      title: 'Bù Trừ Tính Cách · Cương Nhu',
      shortTitle: 'Bù Trừ Tính Cách',
      weight: WEIGHTS.tinhCach,
      score: tinhCachRes.score,
      detail: tinhCachRes.detail,
      provisional: false,
      factors: tinhCachRes.factors,
    },
    nguHanhDaoHoa: {
      title: 'Ngũ Hành Nạp Âm · Can Chi & Hỷ Tín',
      shortTitle: 'Ngũ Hành & Hỷ Tín',
      weight: WEIGHTS.nguHanhDaoHoa,
      score: nguHanhRes.score,
      detail: nguHanhRes.detail,
      provisional: false,
      factors: nguHanhRes.factors,
    },
  };

  const rawScore = Number(
    (
      cards.tamHop.score * WEIGHTS.tamHop +
      cards.phiTinh.score * WEIGHTS.phiTinh +
      cards.tinhCach.score * WEIGHTS.tinhCach +
      cards.nguHanhDaoHoa.score * WEIGHTS.nguHanhDaoHoa
    ).toFixed(2)
  );
  const totalScore = Math.round(rawScore);
  const { tier, ratingText } = classifyCompatibilityTier(totalScore);

  // Synthesize couple strengths & challenges with remedies
  const allFactors = [
    ...tamHopRes.factors,
    ...phiTinhRes.factors,
    ...tinhCachRes.factors,
    ...nguHanhRes.factors,
  ];

  const strengths = allFactors
    .filter((f) => f.kind === 'good' && f.delta >= 3)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map((f) => f.label);

  if (strengths.length === 0) {
    strengths.push('Hai lá số có nền tảng tự chủ, hoàn toàn có thể xây dựng hạnh phúc bền vững nhờ sự đồng thuận và tôn trọng.');
  }

  const challenges = [];
  for (const f of [...phiTinhRes.factors, ...tamHopRes.factors]) {
    if (f.kind === 'warn' && f.delta <= -3) {
      challenges.push({
        issue: f.label,
        remedy:
          'Chủ động lắng nghe, tránh suy diễn ý đồ của bạn đời và thống nhất nguyên tắc tài chính – công việc rõ ràng để hóa giải xung lực Hóa Kỵ / Sát tinh.',
      });
    }
  }
  for (const i of tinhCachRes.tinhCachDetail.frictionWarnings.slice(0, 2)) {
    challenges.push({
      issue: i,
      remedy:
        tinhCachRes.tinhCachDetail.harmonyTips[0] ||
        'Giữ nhịp đối thoại bình tĩnh, nhường nhau một bước khi cảm xúc đang dâng cao.',
    });
  }
  if (nguHanhRes.khacRemedy) {
    challenges.push({
      issue: `Ngũ Hành Nạp Âm ${nguHanhRes.elements.interaction}`,
      remedy: nguHanhRes.khacRemedy,
    });
  }
  if (nguHanhRes.diemRisk) {
    challenges.push({
      issue: 'Diễm Tinh gặp Hóa Kỵ / Phục Binh / Không Kiếp trên trục ngoại giao',
      remedy: 'Giữ ranh giới rõ ràng trong quan hệ xã hội và luôn minh bạch với người phối ngẫu để củng cố niềm tin.',
    });
  }
  if (challenges.length === 0) {
    challenges.push({
      issue: 'Duy trì sự tươi mới khi cuộc sống đi vào quỹ đạo ổn định',
      remedy: 'Dành thời gian trò chuyện sâu sắc và cùng nhau lập kế hoạch mục tiêu chung theo từng cột mốc 3–5 năm.',
    });
  }

  const sortedPillars = Object.values(cards).sort((a, b) => b.score - a.score);
  const ratingSummary = `Tổng điểm hòa hợp đạt ${totalScore}/100 (${ratingText}). Điểm sáng nổi bật nhất nằm ở trụ cột "${sortedPillars[0].title}" (${sortedPillars[0].score}/100), trong khi "${sortedPillars[sortedPillars.length - 1].title}" (${sortedPillars[sortedPillars.length - 1].score}/100) là phương diện hai người nên lưu tâm vun đắp thêm.`;

  return {
    version: COMPATIBILITY_VERSION,
    totalScore,
    rawScore,
    tier,
    ratingText,
    ratingSummary,
    husbandName: labelA,
    wifeName: labelB,
    personALabel: `${personA.gioiTinh === 'Nữ' ? 'Bên A' : 'Chồng'} · ${labelA}`,
    personBLabel: `${personB.gioiTinh === 'Nam' ? 'Bên B' : 'Vợ'} · ${labelB}`,
    elements: nguHanhRes.elements,
    weights: { ...WEIGHTS },
    cards,
    tamHopDetail: tamHopRes.tamHopDetail,
    phiTinhDetail: phiTinhRes.phiTinhDetail,
    tinhCachDetail: tinhCachRes.tinhCachDetail,
    strengths,
    challenges: challenges.slice(0, 5),
  };
}

// ─── Multi-Year Romance & Marriage Forecast ──────────────────────────────────

function getTieuHanBranchIndex(yearChiIndex, gender, tuoiAm) {
  let startPos = 10;
  if ([2, 6, 10].includes(yearChiIndex)) startPos = 4;      // Dần-Ngọ-Tuất -> Thìn (4)
  else if ([8, 0, 4].includes(yearChiIndex)) startPos = 10; // Thân-Tý-Thìn -> Tuất (10)
  else if ([5, 9, 1].includes(yearChiIndex)) startPos = 7;  // Tỵ-Dậu-Sửu -> Mùi (7)
  else if ([11, 3, 7].includes(yearChiIndex)) startPos = 1; // Hợi-Mão-Mùi -> Sửu (1)

  if (gender === 1) {
    return (startPos + (tuoiAm - 1)) % 12;
  }
  return (startPos - ((tuoiAm - 1) % 12) + 120) % 12;
}

function resolvePersonBirthMeta(side) {
  const inputData = side?.inputData || side?.person?._inputData || {};
  const chart = side?.result || side?.person?._chart || null;
  const person = side?.person || side || {};

  let lunarBirthYear = inputData.lunarYear;
  if (!Number.isInteger(lunarBirthYear)) {
    lunarBirthYear = Number.isInteger(person.nam) ? person.nam : 1995;
  }

  let yearChiIndex = inputData.yearChiIndex;
  if (!Number.isInteger(yearChiIndex)) {
    const chiStr = person.chiNam || String(chart?.canChiNam || '').trim().split(/\s+/)[1];
    const idx = DIA_CHI.indexOf(chiStr);
    yearChiIndex = idx >= 0 ? idx : ((lunarBirthYear - 4) % 12 + 12) % 12;
  }

  const gender = Number.isInteger(inputData.gender)
    ? inputData.gender
    : person.gioiTinh === 'Nữ'
    ? 0
    : 1;

  return { chart, person, lunarBirthYear, yearChiIndex, gender };
}

function evaluateSinglePersonYear(meta, year, lnSihua, yearBranchIndex) {
  const { chart, lunarBirthYear, yearChiIndex, gender } = meta;
  const age = Math.max(1, year - lunarBirthYear + 1);
  const palates = chart?.palates || [];

  const activeDx = chart ? getActiveDaXianForAge(chart, age) : null;
  const daXianLabel = activeDx
    ? `${activeDx.startAge}–${activeDx.endAge}t (${activeDx.natalChucNang} · ${activeDx.chiName})`
    : `${age} tuổi`;

  const tieuHanIdx = getTieuHanBranchIndex(yearChiIndex, gender, age);
  const lnMap = getLuuNienPalaceNames(yearBranchIndex);
  const lnPhuTheIdx = (yearBranchIndex + 10) % 12; // LN.Phối

  const byChi = (idx) => palates.find((p) => p.chiIndex === idx) || null;
  const tieuHanPal = byChi(tieuHanIdx);
  const lnPhuThePal = byChi(lnPhuTheIdx);
  const lnMenhPal = byChi(yearBranchIndex);

  const tieuHanPalace = tieuHanPal ? `${cleanPalaceFunc(tieuHanPal.chucNang)} (${tieuHanPal.chiName})` : DIA_CHI[tieuHanIdx];
  const lnPhuThePalace = lnPhuThePal ? `${cleanPalaceFunc(lnPhuThePal.chucNang)} (${lnPhuThePal.chiName})` : DIA_CHI[lnPhuTheIdx];

  let score = 58;
  let hasHyTinTrigger = false;
  const signals = [];

  if (palates.length === 12) {
    // 1. Lưu Hồng Loan, Lưu Thiên Hỷ, Lưu Đào Hoa
    const luuHongLoanIdx = (3 - yearBranchIndex + 12) % 12;
    const luuThienHyIdx = (9 - yearBranchIndex + 12) % 12;
    const luuDaoHoaIdx = LUU_DAO_HOA_MAP[yearBranchIndex];

    const checkFlyingHy = (branchIdx, starLabel) => {
      const p = byChi(branchIdx);
      if (!p) return;
      const func = cleanPalaceFunc(p.chucNang);
      if (func === 'Phu Thê' || func === 'Mệnh' || p.isThan) {
        score += 13;
        hasHyTinTrigger = true;
        signals.push(`${starLabel} nhập đúng cung ${func}${p.isThan && func !== 'Mệnh' ? ' <Thân>' : ''} (${p.chiName}): tín hiệu hỷ sự / nhân duyên rất vượng`);
      } else if (func === 'Phúc Đức' || func === 'Điền Trạch' || func === 'Tử Tức') {
        score += 8;
        hasHyTinTrigger = true;
        signals.push(`${starLabel} chiếu cung ${func} (${p.chiName}): tin vui gia đạo, nhà cửa hoặc con cái`);
      } else if (func === 'Thiên Di') {
        score += 7;
        hasHyTinTrigger = true;
        signals.push(`${starLabel} tại Thiên Di (${p.chiName}) xung chiếu Mệnh: vượng duyên giao tiếp & hỷ khí`);
      }
    };

    checkFlyingHy(luuHongLoanIdx, 'Lưu Hồng Loan');
    checkFlyingHy(luuThienHyIdx, 'Lưu Thiên Hỷ');

    const daoPal = byChi(luuDaoHoaIdx);
    if (daoPal) {
      const daoFunc = cleanPalaceFunc(daoPal.chucNang);
      if (['Mệnh', 'Phu Thê', 'Thiên Di'].includes(daoFunc) || daoPal.isThan) {
        score += 6;
        signals.push(`Lưu Đào Hoa kích hoạt cung ${daoFunc} (${daoPal.chiName}): tăng sức hút lãng mạn`);
      }
    }

    // 2. Natal Hồng Loan / Thiên Hỷ / Đào Hoa / Hỷ Thần at LN.Mệnh, LN.Phối, Tiểu Hạn
    const activeBranches = new Set([yearBranchIndex, lnPhuTheIdx, tieuHanIdx]);
    for (const bIdx of activeBranches) {
      const p = byChi(bIdx);
      if (!p) continue;
      const pStars = [...(p.chinhTinh || []).map(cleanStarName), ...(p.phuTinh || [])];
      const hitHy = pStars.filter((s) => ['Hồng Loan', 'Thiên Hỷ', 'Đào Hoa', 'Hỷ Thần'].includes(s));
      if (hitHy.length > 0) {
        score += 9;
        hasHyTinTrigger = true;
        const role = bIdx === lnPhuTheIdx ? 'LN.Phối' : bIdx === yearBranchIndex ? (lnMap[bIdx] || 'LN.Mệnh') : 'Tiểu Hạn';
        signals.push(`${role} tại ${p.chiName} hội ${hitHy.join(', ')} nguyên cục`);
      }
    }

    // 3. LN.Mệnh or Tiểu Hạn stepping onto natal Phu Thê / Điền Trạch / Tử Tức
    const lnMenhFunc = lnMenhPal ? cleanPalaceFunc(lnMenhPal.chucNang) : '';
    const tieuHanFunc = tieuHanPal ? cleanPalaceFunc(tieuHanPal.chucNang) : '';
    if (lnMenhFunc === 'Phu Thê' || tieuHanFunc === 'Phu Thê') {
      score += 6;
      signals.push('Lưu Niên / Tiểu Hạn đi vào cung Phu Thê nguyên cục (năm trọng điểm chuyện tình cảm)');
    } else if (lnMenhFunc === 'Điền Trạch' || lnMenhFunc === 'Tử Tức') {
      score += 4;
      signals.push(`Lưu Thái Tuế lâm cung ${lnMenhFunc} (thuận bàn chuyện tổ ấm / gia đình)`);
    }

    // 4. Lưu Niên Tứ Hóa hitting marriage palaces
    const starMap = indexChartStarsForMarriage(chart);
    const transforms = lnSihua.transforms;

    for (const [shType, ptsMap] of [
      ['Hóa Lộc', { Mệnh: 10, 'Phu Thê': 11, 'Phúc Đức': 7, 'Điền Trạch': 7, 'Tử Tức': 7 }],
      ['Hóa Khoa', { Mệnh: 8, 'Phu Thê': 9, 'Phúc Đức': 6, 'Điền Trạch': 6 }],
      ['Hóa Quyền', { Mệnh: 4, 'Phu Thê': 4, 'Điền Trạch': 4 }],
    ]) {
      const sName = transforms[shType];
      const landed = starMap[sName];
      if (landed && ptsMap[landed.chucNang]) {
        score += ptsMap[landed.chucNang];
        if (landed.chucNang === 'Phu Thê' || landed.chucNang === 'Mệnh') hasHyTinTrigger = true;
        signals.push(`LN.${shType} (${sName}) nhập cung ${landed.chucNang} (${landed.chiName})`);
      }
    }

    const kyStar = transforms['Hóa Kỵ'];
    const kyLanded = starMap[kyStar];
    if (kyLanded) {
      if (kyLanded.chucNang === 'Phu Thê') {
        score -= 11;
        signals.push(`LN.Hóa Kỵ (${kyStar}) nhập cung Phu Thê: dễ nhạy cảm hoặc vướng áp lực lời nói, cần nhẫn nại`);
      } else if (kyLanded.chucNang === 'Quan Lộc') {
        score -= 9;
        signals.push(`LN.Hóa Kỵ (${kyStar}) nhập Quan Lộc xung chiếu Phu Thê: tránh mang căng thẳng công việc về nhà`);
      } else if (kyLanded.chucNang === 'Thiên Di') {
        score -= 7;
        signals.push(`LN.Hóa Kỵ (${kyStar}) nhập Thiên Di xung Mệnh: đi lại bận rộn, cần giữ sức khỏe & bình tâm`);
      } else if (kyLanded.chucNang === 'Mệnh') {
        score -= 6;
        signals.push(`LN.Hóa Kỵ (${kyStar}) nhập Mệnh: dễ lo nghĩ nhiều trong năm`);
      }
    }

    // 5. Active Đại Hạn synergy
    if (activeDx && ['Phu Thê', 'Phúc Đức', 'Điền Trạch'].includes(activeDx.natalChucNang)) {
      score += 4;
    }
  }

  return {
    age,
    daXianLabel,
    tieuHanPalace,
    lnPhuThePalace,
    signals: signals.slice(0, 5),
    romanceScore: clamp(score, 25, 98),
    hasHyTinTrigger,
  };
}

export function computeYearlyCompatibilityForecast(pairOrChong, voOrOptions, maybeOptions) {
  let chongSide;
  let voSide;
  let options;

  if (pairOrChong && typeof pairOrChong === 'object' && pairOrChong.chong && pairOrChong.vo) {
    chongSide = pairOrChong.chong;
    voSide = pairOrChong.vo;
    options = voOrOptions || {};
  } else {
    chongSide = pairOrChong;
    voSide = voOrOptions;
    options = maybeOptions || {};
  }

  const currentYear = new Date().getFullYear();
  const startYear = Number.isInteger(options?.startYear) ? options.startYear : currentYear;
  const yearsCount = clamp(Number.isInteger(options?.yearsCount) ? options.yearsCount : 5, 1, 15);

  const metaA = resolvePersonBirthMeta(chongSide);
  const metaB = resolvePersonBirthMeta(voSide);

  const years = [];
  for (let i = 0; i < yearsCount; i++) {
    const year = startYear + i;
    const lnSihua = getLiuNianSiHua(year);
    const yearBranchIndex = lnSihua.branchIndex;
    const canChiYear = `${lnSihua.stemName} ${lnSihua.branchName}`;

    const pA = evaluateSinglePersonYear(metaA, year, lnSihua, yearBranchIndex);
    const pB = evaluateSinglePersonYear(metaB, year, lnSihua, yearBranchIndex);

    const dualHyBonus = pA.hasHyTinTrigger && pB.hasHyTinTrigger ? 5 : 0;
    const combinedScore = clamp(Math.round((pA.romanceScore + pB.romanceScore) / 2 + dualHyBonus), 25, 98);

    let status;
    let statusLabel;
    if (combinedScore >= 76 || (combinedScore >= 72 && pA.hasHyTinTrigger && pB.hasHyTinTrigger)) {
      status = 'hy_tin';
      statusLabel = 'Vượng Khí Hỷ Tín · Rất Tốt';
    } else if (combinedScore >= 64) {
      status = 'thuan_loi';
      statusLabel = 'Thuận Lợi · Tình Cảm Ấm Êm';
    } else if (combinedScore >= 52) {
      status = 'binh_on';
      statusLabel = 'Bình Ổn · Giữ Nhịp Gia Đạo';
    } else {
      status = 'can_luu_y';
      statusLabel = 'Cần Lưu Ý · Tránh Va Chạm';
    }

    const isSharedHighlight = Boolean(
      (pA.romanceScore >= 70 && pB.romanceScore >= 70) ||
      ((pA.hasHyTinTrigger || pB.hasHyTinTrigger) && combinedScore >= 74)
    );

    let advice;
    if (status === 'hy_tin') {
      advice = `Năm ${year} (${canChiYear}) hội tụ tín hiệu Hồng Hỷ / Hóa Lộc rất sáng cho đôi bên — thời điểm vàng để bàn tính chuyện cưới hỏi, kỷ niệm lớn, mua sắm điền sản hoặc đón tin vui gia đình.`;
    } else if (status === 'thuan_loi') {
      advice = `Năm ${year} (${canChiYear}) dòng khí tình cảm êm thuận, phù hợp củng cố tài chính chung, du lịch gắn kết và thực hiện các mục tiêu dài hạn của hai người.`;
    } else if (status === 'binh_on') {
      advice = `Năm ${year} (${canChiYear}) vận trình tình cảm ở mức ổn định; đôi bên nên duy trì sự quan tâm đều đặn và chia sẻ việc nhà để giữ lửa ấm.`;
    } else {
      advice = `Năm ${year} (${canChiYear}) có Lưu Hóa Kỵ / xung lực tác động trục Mệnh – Phối; hai người nên tránh quyết định nóng vội, nhường lời khi bất đồng và ưu tiên chăm sóc sức khỏe tinh thần.`;
    }

    years.push({
      year,
      canChi: canChiYear,
      canChiYear,
      combinedScore,
      status,
      statusLabel,
      isSharedHighlight,
      personA: {
        age: pA.age,
        daXianLabel: pA.daXianLabel,
        tieuHanPalace: pA.tieuHanPalace,
        lnPhuThePalace: pA.lnPhuThePalace,
        signals: pA.signals,
        romanceScore: pA.romanceScore,
      },
      personB: {
        age: pB.age,
        daXianLabel: pB.daXianLabel,
        tieuHanPalace: pB.tieuHanPalace,
        lnPhuThePalace: pB.lnPhuThePalace,
        signals: pB.signals,
        romanceScore: pB.romanceScore,
      },
      advice,
    });
  }

  const sharedHighlightYears = years.filter((y) => y.isSharedHighlight).map((y) => y.year);
  const bestYear = [...years].sort((a, b) => b.combinedScore - a.combinedScore)[0] || null;

  const summary =
    sharedHighlightYears.length > 0
      ? `Trong giai đoạn ${startYear}–${startYear + yearsCount - 1}, các năm cộng hưởng hỷ tín nổi bật nhất của cặp đôi là: ${sharedHighlightYears.join(', ')} (cao điểm năm ${bestYear.year} · ${bestYear.combinedScore}/100).`
      : `Trong giai đoạn ${startYear}–${startYear + yearsCount - 1}, năm thuận lợi nhất của hai người là ${bestYear?.year} (${bestYear?.canChiYear} · ${bestYear?.combinedScore}/100 điểm).`;

  return {
    startYear,
    endYear: startYear + yearsCount - 1,
    yearsCount,
    years,
    sharedHighlightYears,
    bestYear,
    summary,
  };
}
