/**
 * Bộ tra cứu Từ Điển 64 Quẻ Kinh Dịch (64-Hexagram Reference Atlas)
 * Hỗ trợ: Tìm kiếm tên / số quẻ / từ khóa, Ma trận 8×8 Thượng × Hạ Quái,
 * Hỗ Quái – Thác Quái – Đảo (Tông) Quái, Thoán Từ, Đại Tượng, 6 Hào & Nạp Giáp Lục Thân.
 */
import { HEXAGRAMS, TRIGRAMS } from '../data/hexagrams.js';
import { getHexagramDescription } from '../data/hexagramDescriptions.js';
import classicalJudgements from '../data/classicalChineseJudgements.js';
import { DAI_TUONG_BY_ID } from '../data/hexagramAtlasData.js';
import { DEFINITIVE_PALACE_TABLE, PALACES, getUngHao, getHexagramTrait } from '../data/lucYao.js';
import { computeNapGiap } from './napGiap.js';
import { computeLucThan } from './lucThan.js';
import { trigramsToLineValues } from './buildHexagram.js';

export const TRIGRAM_LIST = [
  { bits: '111', quaiNum: 1, nameVi: 'Càn',  nature: 'Thiên (Trời)', shortNature: 'Thiên', glyph: '☰', element: 'Kim' },
  { bits: '110', quaiNum: 2, nameVi: 'Đoài', nature: 'Trạch (Đầm)',  shortNature: 'Trạch', glyph: '☱', element: 'Kim' },
  { bits: '101', quaiNum: 3, nameVi: 'Ly',   nature: 'Hỏa (Lửa)',    shortNature: 'Hỏa',   glyph: '☲', element: 'Hỏa' },
  { bits: '100', quaiNum: 4, nameVi: 'Chấn', nature: 'Lôi (Sấm)',    shortNature: 'Lôi',   glyph: '☳', element: 'Mộc' },
  { bits: '011', quaiNum: 5, nameVi: 'Tốn',  nature: 'Phong (Gió)',  shortNature: 'Phong', glyph: '☴', element: 'Mộc' },
  { bits: '010', quaiNum: 6, nameVi: 'Khảm', nature: 'Thủy (Nước)',  shortNature: 'Thủy',  glyph: '☵', element: 'Thủy' },
  { bits: '001', quaiNum: 7, nameVi: 'Cấn',  nature: 'Sơn (Núi)',    shortNature: 'Sơn',   glyph: '☶', element: 'Thổ' },
  { bits: '000', quaiNum: 8, nameVi: 'Khôn', nature: 'Địa (Đất)',    shortNature: 'Địa',   glyph: '☷', element: 'Thổ' },
];

const TRIGRAM_BY_BITS = Object.fromEntries(TRIGRAM_LIST.map((t) => [t.bits, t]));
const HEX_BY_ID = Object.fromEntries(HEXAGRAMS.map((h) => [h.id, h]));
const HEX_BY_BINARY = Object.fromEntries(HEXAGRAMS.map((h) => [h.binary, h]));
const JUDGEMENT_BY_ID = Object.fromEntries(classicalJudgements.map((j) => [j.id, j]));

export function stripDiacritics(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Ký tự Unicode Chu Dịch 64 quẻ (U+4DC0 .. U+4DFF khớp thứ tự Văn Vương 1..64) */
export function getHexagramUnicode(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1 || n > 64) return '䷀';
  return String.fromCodePoint(0x4dc0 + n - 1);
}

function resolveHex(hexOrIdOrBinary) {
  if (!hexOrIdOrBinary) return null;
  if (typeof hexOrIdOrBinary === 'number') return HEX_BY_ID[hexOrIdOrBinary] || null;
  if (typeof hexOrIdOrBinary === 'string') {
    if (/^[01]{6}$/.test(hexOrIdOrBinary)) return HEX_BY_BINARY[hexOrIdOrBinary] || null;
    const asNum = Number(hexOrIdOrBinary);
    if (Number.isInteger(asNum)) return HEX_BY_ID[asNum] || null;
  }
  if (typeof hexOrIdOrBinary === 'object') {
    if (hexOrIdOrBinary.id && HEX_BY_ID[hexOrIdOrBinary.id]) return HEX_BY_ID[hexOrIdOrBinary.id];
    if (hexOrIdOrBinary.binary && HEX_BY_BINARY[hexOrIdOrBinary.binary]) {
      return HEX_BY_BINARY[hexOrIdOrBinary.binary];
    }
  }
  return null;
}

function toSummaryRef(hex) {
  if (!hex) return null;
  return {
    id: hex.id,
    binary: hex.binary,
    nameVi: hex.nameVi,
    nameZh: hex.nameZh,
    unicodeGlyph: getHexagramUnicode(hex.id),
  };
}

/** Hỗ Quái (Nuclear Hexagram): Hạ = hào 2,3,4; Thượng = hào 3,4,5 */
export function getHoQuai(hexOrId) {
  const hex = resolveHex(hexOrId);
  if (!hex) return null;
  const b = hex.binary;
  const hoBinary = `${b[1]}${b[2]}${b[3]}${b[2]}${b[3]}${b[4]}`;
  return toSummaryRef(HEX_BY_BINARY[hoBinary]);
}

/** Thác Quái / Bàng Thông Quái (Opposite Hexagram): đảo âm dương toàn bộ 6 hào (0 ↔ 1) */
export function getThacQuai(hexOrId) {
  const hex = resolveHex(hexOrId);
  if (!hex) return null;
  const thacBinary = hex.binary
    .split('')
    .map((c) => (c === '1' ? '0' : '1'))
    .join('');
  return toSummaryRef(HEX_BY_BINARY[thacBinary]);
}

/** Đảo Quái / Tông Quái (Inverted Hexagram): lật ngược trên dưới 180° (hào 6→1 .. hào 1→6) */
export function getDaoQuai(hexOrId) {
  const hex = resolveHex(hexOrId);
  if (!hex) return null;
  const daoBinary = hex.binary.split('').reverse().join('');
  return toSummaryRef(HEX_BY_BINARY[daoBinary]);
}

export const getTongQuai = getDaoQuai;

/** Tên cổ điển của từng vị trí hào (Sơ, Nhị, Tam, Tứ, Ngũ, Thượng × Cửu/Lục) */
export function getClassicalLineTitle(index, isYang) {
  const numWord = isYang ? 'Cửu' : 'Lục';
  switch (index) {
    case 1:
      return `Sơ ${numWord}`;
    case 2:
      return `${numWord} Nhị`;
    case 3:
      return `${numWord} Tam`;
    case 4:
      return `${numWord} Tứ`;
    case 5:
      return `${numWord} Ngũ`;
    case 6:
      return `Thượng ${numWord}`;
    default:
      return `Hào ${index}`;
  }
}

const POSITION_ARCHETYPE = {
  1: 'Khởi đầu (tiềm thời, đặt nền móng, chưa nên nóng vội)',
  2: 'Trung vị nội quái (thực chất, giữ đạo trung dung, tìm sự đồng thanh tương ứng)',
  3: 'Chuyển giao nội–ngoại (nhiều biến động, cần tỉnh táo cẩn trọng lúc tiến thoái)',
  4: 'Cận quân ngoại quái (gần cấp trên/trung tâm, cần mềm dẻo khéo léo giữ phép)',
  5: 'Chí tôn trung chính (ngôi chủ đạo quyết định đại cục của quẻ)',
  6: 'Cực điểm của thời quẻ (vật cực tất phản, biết dừng đúng lúc để giữ trọn thành quả)',
};

function buildSixLinesForAtlas(hex, palaceElement, theHao, ungHao, desc) {
  const napGiap = computeNapGiap(hex.binary);
  const withLucThan = computeLucThan(napGiap, palaceElement);
  const bits = hex.binary.split('');

  return withLucThan.map((line) => {
    const idx = line.index;
    const isYang = bits[idx - 1] === '1';
    const title = getClassicalLineTitle(idx, isYang);
    // Hào lẻ (1, 3, 5) là vị Dương; hào chẵn (2, 4, 6) là vị Âm
    const expectedYangPos = idx % 2 === 1;
    const isDacVi = isYang === expectedYangPos;
    const isTrung = idx === 2 || idx === 5;
    const pairIdx = idx <= 3 ? idx + 3 : idx - 3;
    const pairIsYang = bits[pairIdx - 1] === '1';
    const isChinhUng = isYang !== pairIsYang;

    const trigramPart =
      idx <= 3
        ? `Nội quái ${TRIGRAMS[hex.lower]?.nameVi || ''}`
        : `Ngoại quái ${TRIGRAMS[hex.upper]?.nameVi || ''}`;

    const qualities = [];
    if (isTrung && isDacVi) qualities.push('Trung Chính (vừa đắc trung vừa đắc vị — rất tốt)');
    else if (isTrung) qualities.push('Đắc Trung (giữ được thế cân bằng giữa quái)');
    else if (isDacVi) qualities.push('Đắc Vị / Đắc Chính (âm dương đúng ngôi)');
    else qualities.push('Bất Chính (cương nhu lệch ngôi, cần linh hoạt điều tiết)');

    qualities.push(
      isChinhUng
        ? `Chính Ứng với hào ${pairIdx} (âm dương tương ứng)`
        : `Địch Ứng với hào ${pairIdx} (đồng tính ít tương trợ)`
    );

    const shortTheme = (desc?.tong_quat || '').split('.')[0].trim();
    const haoTuSummary = `${title} (${trigramPart}): ${POSITION_ARCHETYPE[idx]}. Trong thời "${hex.nameVi}"${shortTheme ? ` (${shortTheme})` : ''}, ${qualities.join('; ')}.`;

    return {
      index: idx,
      title,
      yinYang: isYang ? 'yang' : 'yin',
      can: line.can,
      chi: line.chi,
      element: line.nguHanhHao,
      lucThan: line.lucThan,
      isThe: idx === theHao,
      isUng: idx === ungHao,
      theUng: idx === theHao ? 'Thế' : idx === ungHao ? 'Ứng' : '',
      isDacVi,
      isTrung,
      isChinhUng,
      pairIndex: pairIdx,
      summaryVi: haoTuSummary,
    };
  });
}

/** Lấy hồ sơ đầy đủ cho 1 quẻ trong Atlas */
export function getAtlasHexagramDetail(idOrBinary) {
  const hex = resolveHex(idOrBinary);
  if (!hex) return null;

  const upperTrigram = TRIGRAM_BY_BITS[hex.upper];
  const lowerTrigram = TRIGRAM_BY_BITS[hex.lower];
  const desc = getHexagramDescription(upperTrigram.quaiNum, lowerTrigram.quaiNum);
  const judge = JUDGEMENT_BY_ID[hex.id] || null;
  const daiTuong = DAI_TUONG_BY_ID[hex.id] || { hanViet: '', vi: '', keywords: '' };

  const pInfo = DEFINITIVE_PALACE_TABLE[hex.binary] || {
    palace: lowerTrigram.nameVi,
    queType: 'unknown',
    theHao: 6,
  };
  const palaceName = pInfo.palace;
  const palaceElement = PALACES[palaceName]?.element || 'Kim';
  const theHao = pInfo.theHao;
  const ungHao = getUngHao(theHao);
  const napGiapChis = computeNapGiap(hex.binary).map((l) => l.chi);
  const trait = getHexagramTrait(napGiapChis, pInfo.queType);

  const haoDetails = buildSixLinesForAtlas(hex, palaceElement, theHao, ungHao, desc);
  const lineValuesStatic = trigramsToLineValues(hex.upper, hex.lower, []);

  return {
    id: hex.id,
    binary: hex.binary,
    unicodeGlyph: getHexagramUnicode(hex.id),
    nameVi: hex.nameVi,
    nameZh: hex.nameZh,
    upper: hex.upper,
    lower: hex.lower,
    upperTrigram,
    lowerTrigram,
    palaceName,
    palaceElement,
    queType: pInfo.queType,
    theHao,
    ungHao,
    trait,
    thoanTu: {
      classicalZh: judge?.classicalChineseJudgement || '',
      sourceUrl: judge?.sourceUrl || '',
      summaryVi: (desc?.tong_quat || '').split('.')[0].trim() || daiTuong.keywords || '',
      overviewVi: desc?.tong_quat || '',
      adviceVi: desc?.cong_viec
        ? `Sự nghiệp & Tài lộc: ${desc.cong_viec}${desc.tinh_cam ? ` · Tình cảm: ${desc.tinh_cam}` : ''}`
        : '',
      aspects: {
        tongQuat: desc?.tong_quat || '',
        congViec: desc?.cong_viec || '',
        tinhCam: desc?.tinh_cam || '',
        giaDao: desc?.gia_dao || '',
        sucKhoe: desc?.suc_khoe || '',
      },
    },
    daiTuong: {
      hanViet: daiTuong.hanViet,
      vi: daiTuong.vi,
    },
    keywords: daiTuong.keywords || '',
    haoDetails,
    relations: {
      hoQuai: getHoQuai(hex),
      thacQuai: getThacQuai(hex),
      daoQuai: getDaoQuai(hex),
    },
    lineValuesStatic,
  };
}

/** Danh sách tóm tắt toàn bộ 64 quẻ (thứ tự Chu Dịch 1..64) để lọc nhanh */
const ALL_ATLAS_SUMMARIES = HEXAGRAMS.map((hex) => {
  const upperTrigram = TRIGRAM_BY_BITS[hex.upper];
  const lowerTrigram = TRIGRAM_BY_BITS[hex.lower];
  const desc = getHexagramDescription(upperTrigram.quaiNum, lowerTrigram.quaiNum);
  const dt = DAI_TUONG_BY_ID[hex.id] || {};
  const pInfo = DEFINITIVE_PALACE_TABLE[hex.binary];
  const palaceName = pInfo?.palace || lowerTrigram.nameVi;
  const palaceElement = PALACES[palaceName]?.element || '';

  const shortSummary = (desc?.tong_quat || '').split('.')[0].trim();
  const searchBlob = stripDiacritics(
    `${hex.id} #${hex.id} que ${hex.id} ${hex.nameVi} ${hex.nameZh} ${upperTrigram.nameVi} ${lowerTrigram.nameVi} ${upperTrigram.nature} ${lowerTrigram.nature} ${palaceName} ${desc?.tong_quat || ''} ${desc?.cong_viec || ''} ${dt.keywords || ''} ${dt.hanViet || ''}`
  );

  return {
    id: hex.id,
    binary: hex.binary,
    unicodeGlyph: getHexagramUnicode(hex.id),
    nameVi: hex.nameVi,
    nameZh: hex.nameZh,
    upper: hex.upper,
    lower: hex.lower,
    upperTrigram,
    lowerTrigram,
    palaceName,
    palaceElement,
    summaryVi: shortSummary || dt.keywords || '',
    keywords: dt.keywords || '',
    searchBlob,
    rawNameZh: hex.nameZh,
  };
});

/** Tìm kiếm 64 quẻ theo số (1-64), tên Hán–Việt (có dấu hoặc không dấu), Hán tự, hoặc từ khóa */
export function searchHexagramAtlas(query = '') {
  const raw = String(query || '').trim();
  if (!raw) return ALL_ATLAS_SUMMARIES;

  // Nếu gõ số 1..64 hoặc #1..#64 ưu tiên khớp số quẻ lên đầu
  const numMatch = raw.match(/^#?(\d{1,2})$/);
  if (numMatch) {
    const exactId = Number(numMatch[1]);
    if (exactId >= 1 && exactId <= 64) {
      const exact = ALL_ATLAS_SUMMARIES.filter((h) => h.id === exactId);
      const others = ALL_ATLAS_SUMMARIES.filter(
        (h) => h.id !== exactId && String(h.id).includes(numMatch[1])
      );
      return [...exact, ...others];
    }
  }

  const norm = stripDiacritics(raw);
  const tokens = norm.split(/\s+/).filter(Boolean);

  return ALL_ATLAS_SUMMARIES.filter((item) => {
    if (item.rawNameZh.includes(raw)) return true;
    return tokens.every((tok) => item.searchBlob.includes(tok));
  });
}

/**
 * Tạo ma trận 8×8 Thượng Quái (hàng) × Hạ Quái (cột) cho tra cứu trực quan.
 * Mỗi hàng là 1 Thượng Quái, mỗi cột là 1 Hạ Quái → ô giao nhau là quẻ tương ứng.
 */
export function getTrigramMatrix() {
  return {
    trigrams: TRIGRAM_LIST,
    rows: TRIGRAM_LIST.map((upper) => ({
      upper,
      cells: TRIGRAM_LIST.map((lower) => {
        const binary = `${lower.bits}${upper.bits}`;
        const hex = HEX_BY_BINARY[binary];
        return {
          id: hex.id,
          binary: hex.binary,
          unicodeGlyph: getHexagramUnicode(hex.id),
          nameVi: hex.nameVi,
          nameZh: hex.nameZh,
          upperBits: upper.bits,
          lowerBits: lower.bits,
        };
      }),
    })),
  };
}
