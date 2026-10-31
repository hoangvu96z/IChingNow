/**
 * Engine An Quẻ Lục Hào — tích hợp toàn bộ 9 bước thuật toán
 *
 * Đầu vào:
 *   - lines[6]: 6 hào từ castLines ({index, yinYang, moving, ...})
 *   - formData: dữ liệu form (castDate, castTime, ...)
 *
 * Đầu ra:
 *   - Kết quả đầy đủ để render bảng Lục Hào (như ảnh tham chiếu)
 */

import { findHexagram, findChangedHexagram, TRIGRAMS } from '../data/hexagrams.js';
import {
  DEFINITIVE_PALACE_TABLE,
  PALACES,
  getUngHao,
  getHexagramTrait,
  getQuaiThanChi,
  getTruongSinhStage,
  getDayShenSha,
} from '../data/lucYao.js';
import { getCanChiFromDate } from './canChi.js';
import { computeNapGiap }    from './napGiap.js';
import { computeLucThan }    from './lucThan.js';
import { attachLucThu }      from './lucThu.js';
import { computePhucThan }   from './phucThan.js';
import { getHexagramDescription } from '../data/hexagramDescriptions.js';

const BINARY_TO_QUAI_NUMBER = {
  '111': 1, // Càn
  '110': 2, // Đoài
  '101': 3, // Ly
  '100': 4, // Chấn
  '011': 5, // Tốn
  '010': 6, // Khảm
  '001': 7, // Cấn
  '000': 8, // Khôn
};

function getDescriptionForHex(hex) {
  if (!hex) return null;
  const upperId = BINARY_TO_QUAI_NUMBER[hex.upper];
  const lowerId = BINARY_TO_QUAI_NUMBER[hex.lower];
  return getHexagramDescription(upperId, lowerId);
}

// ──────────────────────────────────────────────────────────────────────────
// Bước 2+3: Tầm Cung (Palace Finder)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Tìm Cung, Loại quẻ, Thế/Ứng từ 6 hào
 * @param {Array} lines - [{index:1..6, yinYang:'yang'|'yin', ...}]
 * @returns {{ palaceName, palaceElement, palaceBinary, queType, theHao, ungHao }}
 */
export function findPalaceInfo(lines) {
  if (!lines || lines.length < 6) return null;

  const sorted = [...lines].sort((a, b) => a.index - b.index);
  const binary = sorted.map(l => l.yinYang === 'yang' ? '1' : '0').join('');

  const info = DEFINITIVE_PALACE_TABLE[binary];
  if (!info) {
    // Fallback: dùng quái dưới làm cung
    const innerBits = binary.slice(0, 3);
    const triName   = TRIGRAMS[innerBits]?.nameVi || 'Càn';
    return {
      palaceName:    triName,
      palaceElement: PALACES[triName]?.element || 'Kim',
      palaceBinary:  PALACES[triName]?.binary  || binary,
      queType:       'unknown',
      theHao:        6,
      ungHao:        3,
    };
  }

  const { palace, queType, theHao } = info;
  const palaceData = PALACES[palace] || {};

  return {
    palaceName:    palace,
    palaceElement: palaceData.element || '?',
    palaceBinary:  palaceData.binary  || '',
    queType,
    theHao,
    ungHao:        getUngHao(theHao),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Tính binary của quẻ từ lines
// ──────────────────────────────────────────────────────────────────────────
function linesToBinary(lines) {
  return [...lines]
    .sort((a, b) => a.index - b.index)
    .map(l => l.yinYang === 'yang' ? '1' : '0')
    .join('');
}

function getChangedBinary(lines) {
  const changed = lines.map(l => ({
    ...l,
    yinYang: l.moving ? (l.yinYang === 'yang' ? 'yin' : 'yang') : l.yinYang,
  }));
  return linesToBinary(changed);
}

/**
 * Xây dựng Quẻ Hỗ (Nuclear Hexagram) từ 6 hào của Quẻ Chủ
 * Hạ quái Quẻ Hỗ = Hào 2, 3, 4 của Quẻ Chủ
 * Thượng quái Quẻ Hỗ = Hào 3, 4, 5 của Quẻ Chủ
 */
export function buildQueHoFromLines(lines) {
  if (!lines || lines.length < 6) return null;
  const sorted = [...lines].sort((a, b) => a.index - b.index);
  const hoBits = [
    sorted[1].yinYang, sorted[2].yinYang, sorted[3].yinYang,
    sorted[2].yinYang, sorted[3].yinYang, sorted[4].yinYang,
  ];
  const hoLines = hoBits.map((yinYang, i) => ({
    index: i + 1,
    yinYang,
    moving: false,
  }));
  const hoBinary = linesToBinary(hoLines);
  const hoHexResult = findHexagram(hoLines);
  const hoHexagram = hoHexResult
    ? { ...hoHexResult, description: getDescriptionForHex(hoHexResult) }
    : null;
  const hoPalaceInfo = findPalaceInfo(hoLines);
  const hoNapGiap = computeNapGiap(hoBinary);
  const hoTrait = getHexagramTrait(
    hoNapGiap.map(l => l.chi),
    hoPalaceInfo?.queType
  );

  return {
    binary:        hoBinary,
    lines:         hoLines,
    hexagram:      hoHexagram,
    palaceName:    hoPalaceInfo?.palaceName    || 'Càn',
    palaceElement: hoPalaceInfo?.palaceElement || 'Kim',
    queType:       hoPalaceInfo?.queType       || 'unknown',
    theHao:        hoPalaceInfo?.theHao        || 6,
    ungHao:        hoPalaceInfo?.ungHao        || 3,
    trait:         hoTrait,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Annotate một quẻ (primary hoặc changed) với đầy đủ thông tin
// ──────────────────────────────────────────────────────────────────────────

/**
 * Annotate 6 hào với: Nạp Giáp, Lục Thân, Lục Thú, Thế/Ứng, Không Vong,
 * Quái Thân, Vòng Trường Sinh (TS.Ngày, TS.Tháng), Thần Sát (Lộc, Mã, Đào Hoa)
 */
function annotateLines({
  binary,
  palaceName: _palaceName,
  palaceElement,
  theHao,
  ungHao,
  ngayCan,
  ngayChi,
  thangChi,
  khongVong,
  locChi,
  maChi,
  daoHoaChi,
  originalLines,
}) {
  // Nạp Giáp
  const napGiapLines = computeNapGiap(binary);

  // Lục Thân
  const withLucThan = computeLucThan(napGiapLines, palaceElement);

  // Lục Thú
  const withLucThu = attachLucThu(withLucThan, ngayCan);

  // Tính Quái Thân cho quẻ này dựa trên vị trí & âm dương của Hào Thế
  const theOrigLine = originalLines?.find(l => l.index === theHao);
  const theYinYang = theOrigLine
    ? theOrigLine.yinYang
    : (binary[theHao - 1] === '1' ? 'yang' : 'yin');
  const quaiThanChi = getQuaiThanChi(theHao, theYinYang);

  // Thế/Ứng, Không Vong, Moving, Quái Thân, Trường Sinh, Lộc/Mã/Đào
  return withLucThu.map(line => {
    const isThe = line.index === theHao;
    const isUng = line.index === ungHao;
    const isKV  = khongVong.includes(line.chi);
    const origLine = originalLines?.find(l => l.index === line.index);

    const isQuaiThan = Boolean(quaiThanChi && line.chi === quaiThanChi);
    const tsNgayObj  = ngayChi  ? getTruongSinhStage(line.nguHanhHao, ngayChi)  : null;
    const tsThangObj = thangChi ? getTruongSinhStage(line.nguHanhHao, thangChi) : null;

    const isLoc    = Boolean(locChi    && line.chi === locChi);
    const isMa     = Boolean(maChi     && line.chi === maChi);
    const isDaoHoa = Boolean(daoHoaChi && line.chi === daoHoaChi);

    return {
      ...line,
      isThe,
      isUng,
      theUng: isThe ? 'Thế' : isUng ? 'Ứng' : '',
      isKhongVong: isKV,
      moving: origLine?.moving ?? false,
      yinYang: origLine
        ? origLine.yinYang  // giữ yinYang gốc của quẻ này
        : (binary[line.index - 1] === '1' ? 'yang' : 'yin'),
      coins:  origLine?.coins,
      lineType: origLine?.type,
      // Bảng phụ (Quái Thân, Trường Sinh Ngày/Tháng, Lộc/Mã/Đào)
      quaiThanChi,
      isQuaiThan,
      quaiThanLabel: isQuaiThan ? 'QT' : '-',
      tsNgay:      tsNgayObj?.shortVi  || '-',
      tsNgayEn:    tsNgayObj?.shortEn  || '-',
      tsNgayFull:  tsNgayObj?.name     || '-',
      tsThang:     tsThangObj?.shortVi || '-',
      tsThangEn:   tsThangObj?.shortEn || '-',
      tsThangFull: tsThangObj?.name    || '-',
      isLoc,
      locLabel:    isLoc    ? 'L' : '-',
      isMa,
      maLabel:     isMa     ? 'M' : '-',
      isDaoHoa,
      daoHoaLabel: isDaoHoa ? 'Đ' : '-',
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Hàm chính: buildLucHaoResult
// ──────────────────────────────────────────────────────────────────────────

/**
 * Tính toán đầy đủ kết quả Lục Hào
 *
 * @param {{ formData, lines, mode }} param
 * @returns {Object} kết quả đầy đủ
 */
export function buildLucHaoResult({ formData, lines, mode }) {
  if (!lines || lines.length < 6) return null;

  // ── Bước 1: Can Chi & Thần Sát ─────────────────────────────────────────
  const canChi    = getCanChiFromDate(formData.castDate, formData.castTime);
  const ngayCan   = canChi?.ngayCan   || 'Giáp';
  const ngayChi   = canChi?.ngayChi   || 'Tý';
  const thangChi  = canChi?.thangChi  || '';
  const khongVong = canChi?.khongVong || [];
  const shenSha   = getDayShenSha(ngayCan, ngayChi);
  const locChi    = canChi?.locChi    || shenSha.locChi;
  const maChi     = canChi?.maChi     || shenSha.maChi;
  const daoHoaChi = canChi?.daoHoaChi || shenSha.daoHoaChi;

  // ── Bước 2+3: Tầm Cung ─────────────────────────────────────────────────
  const primaryBinary  = linesToBinary(lines);
  const palaceInfo     = findPalaceInfo(lines);
  const { palaceName, palaceElement, queType, theHao, ungHao } = palaceInfo || {
    palaceName: 'Càn', palaceElement: 'Kim',
    queType: 'unknown', theHao: 6, ungHao: 3,
  };

  // ── Bước 4: Xác định quẻ biến & quẻ hỗ ─────────────────────────────────
  const movingLines    = lines.filter(l => l.moving).map(l => l.index);
  const changedBinary  = getChangedBinary(lines);
  const changedLines   = lines.map(l => ({
    ...l,
    yinYang: l.moving ? (l.yinYang === 'yang' ? 'yin' : 'yang') : l.yinYang,
  }));

  // Quẻ Hỗ (Nuclear Hexagram)
  const queHo = buildQueHoFromLines(lines);

  // Cung của quẻ biến (dùng để annotate quẻ biến với đúng Thế/Ứng & Họ quẻ biến)
  const changedPalaceInfo    = findPalaceInfo(changedLines);
  const changedPalaceName    = changedPalaceInfo?.palaceName    || palaceName;
  const changedPalaceElement = changedPalaceInfo?.palaceElement || palaceElement;
  const changedQueType       = changedPalaceInfo?.queType       || 'unknown';
  const changedTheHao        = changedPalaceInfo?.theHao        || 6;
  const changedUngHao        = changedPalaceInfo?.ungHao        || 3;

  // ── Bước 5-8: Annotate quẻ chủ ─────────────────────────────────────────
  const primaryAnnotated = annotateLines({
    binary:        primaryBinary,
    palaceName,
    palaceElement,
    theHao,
    ungHao,
    ngayCan,
    ngayChi,
    thangChi,
    khongVong,
    locChi,
    maChi,
    daoHoaChi,
    originalLines: lines,
  });

  // ── Bước 8: Phục Thần ──────────────────────────────────────────────────
  const phucThanMap = computePhucThan(primaryAnnotated, palaceName, palaceElement);

  // Gắn Phục Thần vào primaryAnnotated
  const primaryFinal = primaryAnnotated.map(line => ({
    ...line,
    phucThan: phucThanMap[line.index] || null,
  }));

  const primaryTrait = getHexagramTrait(
    primaryFinal.map(l => l.chi),
    queType
  );
  const quaiThanChi = primaryFinal[0]?.quaiThanChi || null;

  // ── Annotate quẻ biến ───────────────────────────────────────────────────
  let changedAnnotated = null;
  let changedTrait = null;
  let changedQuaiThanChi = null;
  if (movingLines.length > 0) {
    changedAnnotated = annotateLines({
      binary:        changedBinary,
      palaceName:    changedPalaceName,
      palaceElement: palaceElement, // Lục Thân quẻ biến bắt buộc tính theo Cung quẻ chủ
      theHao:        changedTheHao,
      ungHao:        changedUngHao,
      ngayCan,
      ngayChi,
      thangChi,
      khongVong,
      locChi,
      maChi,
      daoHoaChi,
      originalLines: changedLines,
    });
    changedTrait = getHexagramTrait(
      changedAnnotated.map(l => l.chi),
      changedQueType
    );
    changedQuaiThanChi = changedAnnotated[0]?.quaiThanChi || null;
  }

  // ── Lookup tên quẻ ─────────────────────────────────────────────────────
  const primaryHexResult = findHexagram(lines);
  const primaryHexagram = primaryHexResult
    ? { ...primaryHexResult, description: getDescriptionForHex(primaryHexResult) }
    : null;

  const changedHexResult = movingLines.length > 0 ? findChangedHexagram(lines) : null;
  const changedHexagram = changedHexResult
    ? { ...changedHexResult, description: getDescriptionForHex(changedHexResult) }
    : null;

  // ── Build createdAt ─────────────────────────────────────────────────────
  const createdAt = formData.castDate && formData.castTime
    ? new Date(`${formData.castDate}T${formData.castTime}:00+07:00`).toISOString()
    : new Date().toISOString();

  return {
    // Metadata
    question:       formData.question || '',
    caster:         formData.caster   || '',
    castDate:       formData.castDate || '',
    castTime:       formData.castTime || '',
    createdAt,
    mode,
    useSolarTerm:   formData.useSolarTerm  || false,
    solarTerm:      formData.solarTerm || canChi?.solarTermObj || null,
    movingMindDate: formData.movingMindDate || '',
    movingMindTime: formData.movingMindTime || { enabled: false, hourBranch: '' },

    // Can Chi & Thần Sát
    canChi,
    ngayCan,
    ngayChi,
    thangChi,
    khongVong,
    locChi,
    maChi,
    daoHoaChi,

    // Cung & Thế/Ứng (Quẻ Chủ)
    palaceName,
    palaceElement,
    queType,
    theHao,
    ungHao,
    primaryTrait,
    quaiThanChi,

    // Cung & Thế/Ứng (Quẻ Biến)
    changedPalaceName:    movingLines.length > 0 ? changedPalaceName    : null,
    changedPalaceElement: movingLines.length > 0 ? changedPalaceElement : null,
    changedQueType:       movingLines.length > 0 ? changedQueType       : null,
    changedTheHao:        movingLines.length > 0 ? changedTheHao        : null,
    changedUngHao:        movingLines.length > 0 ? changedUngHao        : null,
    changedTrait,
    changedQuaiThanChi,

    // Quẻ
    primaryBinary,
    changedBinary,
    movingLines,
    primaryHexagram,
    changedHexagram,
    queHo,

    // Annotated lines
    lines: primaryFinal,
    changedLines: changedAnnotated,

    // Phục Thần map
    phucThanMap,

    // Legacy compat
    primaryAnnotated:  primaryFinal,
    changedAnnotated,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Re-export buildResult (backward compat với buildHexagram.js cũ)
// ──────────────────────────────────────────────────────────────────────────
export function buildResult({ formData, lines, mode }) {
  return buildLucHaoResult({ formData, lines, mode });
}
