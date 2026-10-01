/**
 * useCombinedReading
 * Hook quản lý toàn bộ state của tính năng kết hợp Tử Vi + Kinh Dịch.
 *
 * NOTE: Module này hoàn toàn tự chứa (no cross-app imports) để có thể dùng
 * trong cả IChingNow lẫn TuViNow mà không kéo theo lunar-javascript dependency.
 */
import { useState, useCallback, useRef } from 'react';

// ─── 64 Hexagrams compact table (binary lower+upper → name) ────────────────
const HEXAGRAMS = [
  { id:  1, binary:'111111', nameVi:'Thuần Càn',            nameZh:'乾' },
  { id:  2, binary:'000000', nameVi:'Thuần Khôn',           nameZh:'坤' },
  { id:  3, binary:'100010', nameVi:'Thủy Lôi Truân',       nameZh:'屯' },
  { id:  4, binary:'010001', nameVi:'Sơn Thủy Mông',        nameZh:'蒙' },
  { id:  5, binary:'111010', nameVi:'Thủy Thiên Nhu',       nameZh:'需' },
  { id:  6, binary:'010111', nameVi:'Thiên Thủy Tụng',      nameZh:'訟' },
  { id:  7, binary:'010000', nameVi:'Địa Thủy Sư',          nameZh:'師' },
  { id:  8, binary:'000010', nameVi:'Thủy Địa Tỷ',          nameZh:'比' },
  { id:  9, binary:'111011', nameVi:'Phong Thiên Tiểu Súc', nameZh:'小畜' },
  { id: 10, binary:'110111', nameVi:'Thiên Trạch Lý',       nameZh:'履' },
  { id: 11, binary:'111000', nameVi:'Địa Thiên Thái',       nameZh:'泰' },
  { id: 12, binary:'000111', nameVi:'Thiên Địa Bĩ',         nameZh:'否' },
  { id: 13, binary:'101111', nameVi:'Thiên Hỏa Đồng Nhân', nameZh:'同人' },
  { id: 14, binary:'111101', nameVi:'Hỏa Thiên Đại Hữu',   nameZh:'大有' },
  { id: 15, binary:'001000', nameVi:'Địa Sơn Khiêm',        nameZh:'謙' },
  { id: 16, binary:'000100', nameVi:'Lôi Địa Dự',           nameZh:'豫' },
  { id: 17, binary:'100110', nameVi:'Trạch Lôi Tùy',        nameZh:'隨' },
  { id: 18, binary:'011001', nameVi:'Sơn Phong Cổ',         nameZh:'蠱' },
  { id: 19, binary:'110000', nameVi:'Địa Trạch Lâm',        nameZh:'臨' },
  { id: 20, binary:'000011', nameVi:'Phong Địa Quan',        nameZh:'觀' },
  { id: 21, binary:'100101', nameVi:'Hỏa Lôi Phệ Hạp',     nameZh:'噬嗑' },
  { id: 22, binary:'101001', nameVi:'Sơn Hỏa Bí',           nameZh:'賁' },
  { id: 23, binary:'000001', nameVi:'Sơn Địa Bác',          nameZh:'剝' },
  { id: 24, binary:'100000', nameVi:'Địa Lôi Phục',         nameZh:'復' },
  { id: 25, binary:'100111', nameVi:'Thiên Lôi Vô Vọng',    nameZh:'無妄' },
  { id: 26, binary:'111001', nameVi:'Sơn Thiên Đại Súc',    nameZh:'大畜' },
  { id: 27, binary:'100001', nameVi:'Sơn Lôi Di',           nameZh:'頤' },
  { id: 28, binary:'011110', nameVi:'Trạch Phong Đại Quá',  nameZh:'大過' },
  { id: 29, binary:'010010', nameVi:'Thuần Khảm',           nameZh:'坎' },
  { id: 30, binary:'101101', nameVi:'Thuần Ly',             nameZh:'離' },
  { id: 31, binary:'001110', nameVi:'Trạch Sơn Hàm',        nameZh:'咸' },
  { id: 32, binary:'011100', nameVi:'Lôi Phong Hằng',       nameZh:'恆' },
  { id: 33, binary:'001111', nameVi:'Thiên Sơn Độn',        nameZh:'遯' },
  { id: 34, binary:'111100', nameVi:'Lôi Thiên Đại Tráng',  nameZh:'大壯' },
  { id: 35, binary:'000101', nameVi:'Hỏa Địa Tấn',          nameZh:'晉' },
  { id: 36, binary:'101000', nameVi:'Địa Hỏa Minh Di',      nameZh:'明夷' },
  { id: 37, binary:'101011', nameVi:'Phong Hỏa Gia Nhân',   nameZh:'家人' },
  { id: 38, binary:'110101', nameVi:'Hỏa Trạch Khuê',       nameZh:'睽' },
  { id: 39, binary:'001010', nameVi:'Thủy Sơn Kiển',        nameZh:'蹇' },
  { id: 40, binary:'010100', nameVi:'Lôi Thủy Giải',        nameZh:'解' },
  { id: 41, binary:'110001', nameVi:'Sơn Trạch Tổn',        nameZh:'損' },
  { id: 42, binary:'100011', nameVi:'Phong Lôi Ích',         nameZh:'益' },
  { id: 43, binary:'111110', nameVi:'Trạch Thiên Quải',      nameZh:'夬' },
  { id: 44, binary:'011111', nameVi:'Thiên Phong Cấu',       nameZh:'姤' },
  { id: 45, binary:'000110', nameVi:'Trạch Địa Tụy',         nameZh:'萃' },
  { id: 46, binary:'011000', nameVi:'Địa Phong Thăng',       nameZh:'升' },
  { id: 47, binary:'010110', nameVi:'Trạch Thủy Khốn',       nameZh:'困' },
  { id: 48, binary:'011010', nameVi:'Thủy Phong Tỉnh',       nameZh:'井' },
  { id: 49, binary:'101110', nameVi:'Trạch Hỏa Cách',        nameZh:'革' },
  { id: 50, binary:'011101', nameVi:'Hỏa Phong Đỉnh',        nameZh:'鼎' },
  { id: 51, binary:'100100', nameVi:'Thuần Chấn',            nameZh:'震' },
  { id: 52, binary:'001001', nameVi:'Thuần Cấn',             nameZh:'艮' },
  { id: 53, binary:'001011', nameVi:'Phong Sơn Tiệm',        nameZh:'漸' },
  { id: 54, binary:'110100', nameVi:'Lôi Trạch Quy Muội',   nameZh:'歸妹' },
  { id: 55, binary:'101100', nameVi:'Lôi Hỏa Phong',        nameZh:'豐' },
  { id: 56, binary:'001101', nameVi:'Hỏa Sơn Lữ',           nameZh:'旅' },
  { id: 57, binary:'011011', nameVi:'Thuần Tốn',             nameZh:'巽' },
  { id: 58, binary:'110110', nameVi:'Thuần Đoài',            nameZh:'兌' },
  { id: 59, binary:'010011', nameVi:'Phong Thủy Hoán',       nameZh:'渙' },
  { id: 60, binary:'110010', nameVi:'Thủy Trạch Tiết',       nameZh:'節' },
  { id: 61, binary:'110011', nameVi:'Phong Trạch Trung Phu', nameZh:'中孚' },
  { id: 62, binary:'001100', nameVi:'Lôi Sơn Tiểu Quá',     nameZh:'小過' },
  { id: 63, binary:'101010', nameVi:'Thủy Hỏa Ký Tế',       nameZh:'既濟' },
  { id: 64, binary:'010101', nameVi:'Hỏa Thủy Vị Tế',       nameZh:'未濟' },
];

// Binary lookup (hào 1-6 từ dưới lên: 3 hào dưới = lower trigram, 3 hào trên = upper trigram)
const _hexLookup = {};
HEXAGRAMS.forEach(h => { _hexLookup[h.binary] = h; });

/**
 * Cast 6 lines using three-coin method.
 * Returns array of 6 values: 6=old-yin(moving), 7=young-yang, 8=young-yin, 9=old-yang(moving)
 */
function castAllLines() {
  return Array.from({ length: 6 }, () => {
    // Each coin: head=3 (yang), tail=2 (yin)
    const total = (Math.random() < 0.5 ? 3 : 2)
                + (Math.random() < 0.5 ? 3 : 2)
                + (Math.random() < 0.5 ? 3 : 2);
    return total; // 6,7,8,9
  });
}

/**
 * Convert line values to binary string (1=yang, 0=yin), lines[0]=bottom
 */
function linesToBinary(lines) {
  return lines.map(v => (v === 7 || v === 9) ? '1' : '0').join('');
}

/**
 * Build simplified hexagram result from raw line values
 */
function buildSimpleResult(lines) {
  const binary = linesToBinary(lines);
  const primary = _hexLookup[binary] || null;

  const hasMoving = lines.some(v => v === 6 || v === 9);
  let changed = null;
  if (hasMoving) {
    const changedBinary = lines.map(v => {
      if (v === 6) return '1'; // old yin → yang
      if (v === 9) return '0'; // old yang → yin
      return (v === 7 || v === 9) ? '1' : '0';
    }).join('');
    changed = _hexLookup[changedBinary] || null;
  }

  return {
    lines,
    primary: primary ? { ...primary, name: primary.nameVi, chineseName: primary.nameZh } : null,
    changed:  changed ? { ...changed,  name: changed.nameVi,  chineseName: changed.nameZh  } : null,
    hasMoving,
  };
}

// ─── Can Chi & Nạp Âm Helpers ──────────────────────────────────────────────
const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const NAP_AM_MAP = {
  'Giáp Tý': 'Hải Trung Kim', 'Ất Sửu': 'Hải Trung Kim',
  'Bính Dần': 'Lư Trung Hỏa', 'Đinh Mão': 'Lư Trung Hỏa',
  'Mậu Thìn': 'Đại Lâm Mộc', 'Kỷ Tỵ': 'Đại Lâm Mộc',
  'Canh Ngọ': 'Lộ Bàng Thổ', 'Tân Mùi': 'Lộ Bàng Thổ',
  'Nhâm Thân': 'Kiếm Phong Kim', 'Quý Dậu': 'Kiếm Phong Kim',
  'Giáp Tuất': 'Sơn Đầu Hỏa', 'Ất Hợi': 'Sơn Đầu Hỏa',
  'Bính Tý': 'Giản Hạ Thủy', 'Đinh Sửu': 'Giản Hạ Thủy',
  'Mậu Dần': 'Thành Đầu Thổ', 'Kỷ Mão': 'Thành Đầu Thổ',
  'Canh Thìn': 'Bạch Lạp Kim', 'Tân Tỵ': 'Bạch Lạp Kim',
  'Nhâm Ngọ': 'Dương Liễu Mộc', 'Quý Mùi': 'Dương Liễu Mộc',
  'Giáp Thân': 'Tuyền Trung Thủy', 'Ất Dậu': 'Tuyền Trung Thủy',
  'Bính Tuất': 'Ốc Thượng Thổ', 'Đinh Hợi': 'Ốc Thượng Thổ',
  'Mậu Tý': 'Tích Lịch Hỏa', 'Kỷ Sửu': 'Tích Lịch Hỏa',
  'Canh Dần': 'Tùng Bách Mộc', 'Tân Mão': 'Tùng Bách Mộc',
  'Nhâm Thìn': 'Trường Lưu Thủy', 'Quý Tỵ': 'Trường Lưu Thủy',
  'Giáp Ngọ': 'Sa Trung Kim', 'Ất Mùi': 'Sa Trung Kim',
  'Bính Thân': 'Sơn Hạ Hỏa', 'Đinh Dậu': 'Sơn Hạ Hỏa',
  'Mậu Tuất': 'Bình Địa Mộc', 'Kỷ Hợi': 'Bình Địa Mộc',
  'Canh Tý': 'Bích Thượng Thổ', 'Tân Sửu': 'Bích Thượng Thổ',
  'Nhâm Dần': 'Kim Bạch Kim', 'Quý Mão': 'Kim Bạch Kim',
  'Giáp Thìn': 'Phúc Đăng Hỏa', 'Ất Tỵ': 'Phúc Đăng Hỏa',
  'Bính Ngọ': 'Thiên Hà Thủy', 'Đinh Mùi': 'Thiên Hà Thủy',
  'Mậu Thân': 'Đại Trạch Thổ', 'Kỷ Dậu': 'Đại Trạch Thổ',
  'Canh Tuất': 'Thoa Xuyến Kim', 'Tân Hợi': 'Thoa Xuyến Kim',
  'Nhâm Tý': 'Tang Đố Mộc', 'Quý Sửu': 'Tang Đố Mộc',
  'Giáp Dần': 'Đại Khê Thủy', 'Ất Mão': 'Đại Khê Thủy',
  'Bính Thìn': 'Sa Trung Thổ', 'Đinh Tỵ': 'Sa Trung Thổ',
  'Mậu Ngọ': 'Thiên Thượng Hỏa', 'Kỷ Mùi': 'Thiên Thượng Hỏa',
  'Canh Thân': 'Thạch Lựu Mộc', 'Tân Dậu': 'Thạch Lựu Mộc',
  'Nhâm Tuất': 'Đại Hải Thủy', 'Quý Hợi': 'Đại Hải Thủy',
};

/**
 * Tính Can Chi và Mệnh Nạp Âm từ năm sinh dương lịch
 */
export function getBirthCanChiAndMenh(year) {
  const y = parseInt(year, 10);
  if (!y || isNaN(y) || y < 1900 || y > 2100) return null;
  const canIndex = (y + 6) % 10;
  const chiIndex = (y + 8) % 12;
  const yearCan = CAN[canIndex >= 0 ? canIndex : canIndex + 10];
  const yearChi = CHI[chiIndex >= 0 ? chiIndex : chiIndex + 12];
  const canChi = `${yearCan} ${yearChi}`;
  const menh = NAP_AM_MAP[canChi] || '';
  return { yearCan, yearChi, canChi, menh };
}

/**
 * Chuẩn hóa kết quả quẻ từ IChingNow hoặc các nguồn khác
 */
export function normalizeHexResult(raw) {
  if (!raw) return null;
  // Đã ở dạng chuẩn của useCombinedReading
  if (raw.primary && raw.lines && typeof raw.primary.name === 'string' && !raw.primaryHexagram) {
    return raw;
  }
  // Từ buildLucHaoResult / buildResult / maiHoaResult của IChingNow
  const primary = raw.primaryHexagram || raw.primary || null;
  const changed = raw.changedHexagram || raw.changed || null;
  const lines = raw.lines || [];
  const changedLines = raw.changedLines || null;
  const movingLines = raw.movingLines || (lines.filter ? lines.filter(l => l?.moving).map(l => l.index) : []);
  const hasMoving = movingLines.length > 0 || lines.some(l => (typeof l === 'object' ? !!l.moving : (l === 6 || l === 9)));

  return {
    lines,
    changedLines,
    movingLines,
    primary: primary ? {
      ...primary,
      name: primary.nameVi || primary.name || '',
      chineseName: primary.nameZh || primary.chineseName || '',
      description: primary.description || '',
    } : null,
    changed: changed ? {
      ...changed,
      name: changed.nameVi || changed.name || '',
      chineseName: changed.nameZh || changed.chineseName || '',
      description: changed.description || '',
    } : null,
    hasMoving,
    raw,
  };
}

// ─── Topic → Cung mapping ──────────────────────────────────────────────────
export const TOPIC_CUNG_MAP = {
  career:       ['Quan Lộc', 'Mệnh', 'Tài Bạch'],
  love:         ['Phu Thê', 'Mệnh', 'Phúc Đức'],
  finance:      ['Tài Bạch', 'Quan Lộc', 'Điền Trạch'],
  health:       ['Tật Ách', 'Mệnh', 'Phúc Đức'],
  family:       ['Phụ Mẫu', 'Tử Tức', 'Huynh Đệ'],
  general:      ['Mệnh', 'Quan Lộc', 'Tài Bạch'],
};

export const TOPIC_LABELS = {
  career:  { vi: '💼 Công danh sự nghiệp', en: '💼 Career & Fame' },
  love:    { vi: '💑 Tình duyên hôn nhân', en: '💑 Love & Marriage' },
  finance: { vi: '💰 Tài lộc tiền bạc',    en: '💰 Finance & Wealth' },
  health:  { vi: '🌿 Sức khoẻ',             en: '🌿 Health & Vitality' },
  family:  { vi: '👨‍👩‍👧 Gia đình con cái',    en: '👨‍👩‍👧 Family & Children' },
  general: { vi: '✨ Tổng quát vận mệnh',    en: '✨ General Fortune' },
};

/**
 * Tóm tắt thông tin các cung liên quan từ kết quả lá số Tử Vi
 */
export function summarizeRelevantPalaces(chartResult, topic) {
  if (!chartResult?.palates) return null;
  const relevantCungs = TOPIC_CUNG_MAP[topic] || TOPIC_CUNG_MAP.general;
  return chartResult.palates
    .filter(p => relevantCungs.some(c => (p.chucNang || '').includes(c) || c.includes(p.chucNang || '')))
    .slice(0, 3)
    .map(p => {
      let starsFormatted = '';
      if (Array.isArray(p.stars) && p.stars.length > 0) {
        starsFormatted = p.stars.map(s => typeof s === 'string' ? s : `${s.name}${s.trangThai ? ` (${s.trangThai})` : ''}`).join(', ');
      } else {
        const chinh = Array.isArray(p.chinhTinh) && p.chinhTinh.length > 0
          ? `Chính: ${p.chinhTinh.join(', ')}`
          : 'Vô chính diệu';
        const phu = Array.isArray(p.phuTinh) && p.phuTinh.length > 0
          ? `Phụ: ${p.phuTinh.slice(0, 4).join(', ')}`
          : '';
        starsFormatted = [chinh, phu].filter(Boolean).join(' · ');
      }
      return {
        name: p.chucNang || p.chiName,
        chi: p.chiName,
        stars: starsFormatted,
        isMenh: p.isMenh,
        isThan: p.isThan,
        isTuan: p.isTuan,
        isTriet: p.isTriet,
      };
    });
}

// ─── 12 Canh Giờ Sinh ──────────────────────────────────────────────────────
export const GIO_SINH_OPTIONS = [
  { label: 'Tý (23:00 – 01:00)', value: 0, name: 'Tý', startHour: 23, endHour: 1 },
  { label: 'Sửu (01:00 – 03:00)', value: 1, name: 'Sửu', startHour: 1, endHour: 3 },
  { label: 'Dần (03:00 – 05:00)', value: 2, name: 'Dần', startHour: 3, endHour: 5 },
  { label: 'Mão (05:00 – 07:00)', value: 3, name: 'Mão', startHour: 5, endHour: 7 },
  { label: 'Thìn (07:00 – 09:00)', value: 4, name: 'Thìn', startHour: 7, endHour: 9 },
  { label: 'Tỵ (09:00 – 11:00)', value: 5, name: 'Tỵ', startHour: 9, endHour: 11 },
  { label: 'Ngọ (11:00 – 13:00)', value: 6, name: 'Ngọ', startHour: 11, endHour: 13 },
  { label: 'Mùi (13:00 – 15:00)', value: 7, name: 'Mùi', startHour: 13, endHour: 15 },
  { label: 'Thân (15:00 – 17:00)', value: 8, name: 'Thân', startHour: 15, endHour: 17 },
  { label: 'Dậu (17:00 – 19:00)', value: 9, name: 'Dậu', startHour: 17, endHour: 19 },
  { label: 'Tuất (19:00 – 21:00)', value: 10, name: 'Tuất', startHour: 19, endHour: 21 },
  { label: 'Hợi (21:00 – 23:00)', value: 11, name: 'Hợi', startHour: 21, endHour: 23 },
];

/**
 * Chuyển đổi giờ đồng hồ (hh:mm) thành index 12 Canh Giờ (0 = Tý ... 11 = Hợi)
 */
export function getHourIndexFromTimeStr(timeStr) {
  if (!timeStr) return 6;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return 6;
  if (h >= 23 || h < 1) return 0;
  if (h >= 1 && h < 3) return 1;
  if (h >= 3 && h < 5) return 2;
  if (h >= 5 && h < 7) return 3;
  if (h >= 7 && h < 9) return 4;
  if (h >= 9 && h < 11) return 5;
  if (h >= 11 && h < 13) return 6;
  if (h >= 13 && h < 15) return 7;
  if (h >= 15 && h < 17) return 8;
  if (h >= 17 && h < 19) return 9;
  if (h >= 19 && h < 21) return 10;
  if (h >= 21 && h < 23) return 11;
  return 6;
}

/**
 * Build AI prompt kết hợp Tử Vi + Kinh Dịch
 */
export function buildCombinedPrompt({ topic, question, birthInfo, relevantPalaces, hexResult, language, chartResult }) {
  const isVi = language !== 'en';
  const topicLabel = TOPIC_LABELS[topic]?.[isVi ? 'vi' : 'en'] || topic;

  const palaceSection = relevantPalaces?.map(p =>
    `  - Cung ${p.name} (${p.chi}): ${p.stars || '(chưa có sao chiếu)'}`
    + (p.isMenh ? ' [Cung Mệnh]' : '')
    + (p.isThan ? ' [Cung Thân]' : '')
    + (p.isTuan ? ' [bị Tuần]' : '')
    + (p.isTriet ? ' [bị Triệt]' : '')
  ).join('\n') || '  (chưa có dữ liệu lá số)';

  let birthDesc = 'Chưa có thông tin cá nhân.';
  if (birthInfo) {
    const parts = [];
    if (birthInfo.name && birthInfo.name !== 'Người hỏi') parts.push(`Họ tên: ${birthInfo.name}`);
    if (birthInfo.day && birthInfo.month && birthInfo.year) {
      parts.push(`Sinh ngày ${birthInfo.day}/${birthInfo.month}/${birthInfo.year}`);
    }
    if (birthInfo.hourName || birthInfo.hourLabel) {
      parts.push(`Giờ sinh: Giờ ${birthInfo.hourName || ''} (${birthInfo.hourLabel || ''})`);
    }
    if (birthInfo.gender) {
      parts.push(`Giới tính: ${birthInfo.gender === 'nam' ? 'Nam' : 'Nữ'}`);
    }
    const canChi = birthInfo.canChi || (birthInfo.yearCan ? `${birthInfo.yearCan} ${birthInfo.yearChi || ''}` : '');
    if (canChi) parts.push(`Năm Can Chi: ${canChi}`);
    if (birthInfo.menh) parts.push(`Mệnh Nạp Âm: ${birthInfo.menh}`);
    if (birthInfo.cuc) parts.push(`Cục: ${birthInfo.cuc}`);
    birthDesc = parts.length > 0 ? `Người hỏi: ${parts.join(', ')}` : birthDesc;
  }

  let hexSection = '(chưa gieo quẻ)';
  if (hexResult?.primary) {
    const hexParts = [
      `- Quẻ chủ: ${hexResult.primary.name} (${hexResult.primary.chineseName || ''})`,
    ];
    if (hexResult.changed) {
      hexParts.push(`- Quẻ biến: ${hexResult.changed.name} (${hexResult.changed.chineseName || ''}) — hướng chuyển hóa / kết quả`);
    } else {
      hexParts.push('- Quẻ thuần (không có hào động)');
    }
    if (hexResult.movingLines?.length > 0) {
      hexParts.push(`- Hào động: Hào ${hexResult.movingLines.join(', ')}`);
    }
    if (hexResult.raw?.palaceName) {
      hexParts.push(`- Cung quẻ: ${hexResult.raw.palaceName} (Hành ${hexResult.raw.palaceElement || ''})`);
    }
    if (hexResult.raw?.theHao) {
      hexParts.push(`- Hào Thế: Hào ${hexResult.raw.theHao}, Hào Ứng: Hào ${hexResult.raw.ungHao}`);
    }
    if (hexResult.raw?.canChi?.ngayCan) {
      hexParts.push(`- Thời điểm lập quẻ: Ngày ${hexResult.raw.canChi.ngayCan} ${hexResult.raw.canChi.ngayChi} (Tháng ${hexResult.raw.canChi.thangCan} ${hexResult.raw.canChi.thangChi})`);
    }
    if (hexResult.primary.description) {
      hexParts.push(`- Thoán từ / Ý nghĩa: ${hexResult.primary.description}`);
    }
    hexSection = hexParts.join('\n');
  }

  if (isVi) {
    return `Bạn là chuyên gia phương Đông tổng hợp hai hệ thống chiêm tinh: Tử Vi Đẩu Số và Kinh Dịch.

CHỦ ĐỀ HỎI: ${topicLabel}
CÂU HỎI CỤ THỂ: "${question}"

--- THÔNG TIN LÁ SỐ TỬ VI ---
${birthDesc}
Các cung liên quan đến chủ đề "${topicLabel}":
${palaceSection}
${chartResult?.daiHan ? `Đại hạn hiện tại: ${chartResult.daiHan}` : ''}

--- KẾT QUẢ KINH DỊCH ---
${hexSection}

--- YÊU CẦU LUẬN GIẢI ---
Kết hợp cả hai nguồn để đưa ra luận giải toàn diện:

**1. Tử Vi nói gì?** — Từ bản mệnh, các cung liên quan và sao chiếu, cho biết xu hướng nền tảng, căn cơ của người hỏi.

**2. Kinh Dịch nói gì?** — Từ quẻ chủ, hào động và quẻ biến, cho biết thời điểm hiện tại, diễn biến sắp tới và thời cơ.

**3. Tổng hợp** — Khi kết hợp, hai hệ thống có đồng thuận không? Thời vận hiện tại đang mở ra hay cần ẩn nhẫn?

**4. Lời khuyên cụ thể** — 3 hành động thực tế người hỏi nên làm ngay lúc này.

Viết tiếng Việt, ân cần nhưng sâu sắc, thẳng thắn, tránh sáo rỗng.`;
  }

  return `You are an Eastern wisdom expert synthesizing Zi Wei Dou Shu astrology and I Ching divination.

TOPIC: ${topicLabel}
QUESTION: "${question}"

--- ZI WEI DOU SHU ---
${birthDesc}
Relevant palaces:
${palaceSection}

--- I CHING ---
${hexSection}

Provide: (1) What Zi Wei reveals about the foundation, (2) What I Ching shows about current timing, (3) Synthesized verdict, (4) 3 practical actions.
Write in English, warm and insightful.`;
}

// ─── Main hook ─────────────────────────────────────────────────────────────
export function useCombinedReading({ apiBaseUrl, apiKey, model = 'combo1' }) {
  const [topic, setTopic] = useState('career');
  const [question, setQuestion] = useState('');
  const [hexResult, setHexResult] = useState(null);
  const [isCasting, setIsCasting] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef(null);

  const castHexagram = useCallback(() => {
    setIsCasting(true);
    // Small delay for animation feel
    setTimeout(() => {
      const lines = castAllLines();
      const result = buildSimpleResult(lines);
      setHexResult(result);
      setIsCasting(false);
    }, 800);
  }, []);

  const queryAi = useCallback(async ({ chartResult, birthInfo, language = 'vi' }) => {
    if (!question.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingAi(true);
    setAiError('');
    setAiResponse('');

    const relevantPalaces = summarizeRelevantPalaces(chartResult, topic);
    const prompt = buildCombinedPrompt({
      topic, question, birthInfo, relevantPalaces, hexResult, language, chartResult,
    });

    try {
      const res = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: 'system', content: 'Bạn là chuyên gia tổng hợp Tử Vi Đẩu Số và Kinh Dịch phương Đông.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2000,
          temperature: 0.75,
        }),
      });

      if (!res.ok) throw new Error(`AI trả lỗi ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() || '';
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            full += delta;
            setAiResponse(full);
          } catch { /* skip malformed SSE */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setAiError(err.message || 'Lỗi kết nối AI');
    } finally {
      setIsLoadingAi(false);
    }
  }, [question, topic, hexResult, apiBaseUrl, apiKey, model]);

  return {
    topic, setTopic,
    question, setQuestion,
    hexResult, setHexResult,
    isCasting, castHexagram,
    aiResponse, isLoadingAi, aiError,
    queryAi,
  };
}
