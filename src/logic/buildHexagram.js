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

// ──────────────────────────────────────────────────────────────────────────
// Annotate một quẻ (primary hoặc changed) với đầy đủ thông tin
// ──────────────────────────────────────────────────────────────────────────

/**
 * Annotate 6 hào với: Nạp Giáp, Lục Thân, Lục Thú, Thế/Ứng, Không Vong
 *
 * @param {string} binary - 6-bit chuỗi của quẻ
 * @param {string} palaceName - Cung
 * @param {string} palaceElement - Ngũ Hành cung
 * @param {number} theHao - hào Thế (1-6)
 * @param {number} ungHao - hào Ứng (1-6)
 * @param {string} ngayCan - Thiên Can Ngày
 * @param {string[]} khongVong - [chi1, chi2]
 * @param {Array} originalLines - mảng hào gốc (có field moving)
 * @returns {Array} 6 phần tử annotated line objects
 */
function annotateLines({
  binary,
  palaceName,
  palaceElement,
  theHao,
  ungHao,
  ngayCan,
  khongVong,
  originalLines,
}) {
  // Nạp Giáp
  const napGiapLines = computeNapGiap(binary);

  // Lục Thân
  const withLucThan = computeLucThan(napGiapLines, palaceElement);

  // Lục Thú
  const withLucThu = attachLucThu(withLucThan, ngayCan);

  // Thế/Ứng, Không Vong, Moving
  return withLucThu.map(line => {
    const isThe = line.index === theHao;
    const isUng = line.index === ungHao;
    const isKV  = khongVong.includes(line.chi);
    const origLine = originalLines?.find(l => l.index === line.index);

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

  // ── Bước 1: Can Chi ────────────────────────────────────────────────────
  const canChi = getCanChiFromDate(formData.castDate, formData.castTime);
  const ngayCan   = canChi?.ngayCan  || 'Giáp';
  const ngayChi   = canChi?.ngayChi  || 'Tý';
  const khongVong = canChi?.khongVong || [];

  // ── Bước 2+3: Tầm Cung ─────────────────────────────────────────────────
  const primaryBinary  = linesToBinary(lines);
  const palaceInfo     = findPalaceInfo(lines);
  const { palaceName, palaceElement, palaceBinary, queType, theHao, ungHao } = palaceInfo || {
    palaceName: 'Càn', palaceElement: 'Kim', palaceBinary: '111111',
    queType: 'unknown', theHao: 6, ungHao: 3,
  };

  // ── Bước 4: Xác định quẻ biến ──────────────────────────────────────────
  const movingLines    = lines.filter(l => l.moving).map(l => l.index);
  const changedBinary  = getChangedBinary(lines);
  const changedLines   = lines.map(l => ({
    ...l,
    yinYang: l.moving ? (l.yinYang === 'yang' ? 'yin' : 'yang') : l.yinYang,
  }));

  // Cung của quẻ biến (dùng để annotate quẻ biến với đúng Thế/Ứng)
  const changedPalaceInfo = findPalaceInfo(changedLines);
  const changedTheHao = changedPalaceInfo?.theHao || 6;
  const changedUngHao = changedPalaceInfo?.ungHao || 3;

  // ── Bước 5-8: Annotate quẻ chủ ─────────────────────────────────────────
  const primaryAnnotated = annotateLines({
    binary:        primaryBinary,
    palaceName,
    palaceElement,
    theHao,
    ungHao,
    ngayCan,
    khongVong,
    originalLines: lines,
  });

  // ── Bước 8: Phục Thần ──────────────────────────────────────────────────
  const phucThanMap = computePhucThan(primaryAnnotated, palaceName, palaceElement);

  // Gắn Phục Thần vào primaryAnnotated
  const primaryFinal = primaryAnnotated.map(line => ({
    ...line,
    phucThan: phucThanMap[line.index] || null,
  }));

  // ── Annotate quẻ biến ───────────────────────────────────────────────────
  let changedAnnotated = null;
  if (movingLines.length > 0) {
    changedAnnotated = annotateLines({
      binary:        changedBinary,
      palaceName:    changedPalaceInfo?.palaceName    || palaceName,
      palaceElement: palaceElement, // Lục Thân quẻ biến bắt buộc tính theo Cung quẻ chủ
      theHao:        changedTheHao,
      ungHao:        changedUngHao,
      ngayCan,
      khongVong,
      originalLines: changedLines,
    });
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
    ? new Date(`${formData.castDate}T${formData.castTime}`).toISOString()
    : new Date().toISOString();

  return {
    // Metadata
    question:       formData.question || '',
    caster:         formData.caster   || '',
    createdAt,
    mode,
    useSolarTerm:   formData.useSolarTerm  || false,
    solarTerm:      formData.solarTerm     || null,
    movingMindDate: formData.movingMindDate || '',
    movingMindTime: formData.movingMindTime || { enabled: false, hourBranch: '' },

    // Can Chi
    canChi,
    ngayCan,
    ngayChi,
    khongVong,

    // Cung & Thế/Ứng
    palaceName,
    palaceElement,
    queType,
    theHao,
    ungHao,

    // Quẻ
    primaryBinary,
    changedBinary,
    movingLines,
    primaryHexagram,
    changedHexagram,

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
