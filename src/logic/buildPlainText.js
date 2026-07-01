/**
 * Xây dựng plaintext output từ kết quả Lục Hào đầy đủ
 */

export function buildPlainTextResult(result) {
  if (!result) return '';

  const lines = [];

  // === Metadata ===
  const createdAt = result.createdAt ? new Date(result.createdAt) : new Date();
  lines.push(`Ngày lập quẻ : ${formatDateTime(createdAt)}`);

  if (result.canChi && !result.canChi.isFallback) {
    const cc = result.canChi;
    lines.push(`Can Chi ngày : ${cc.ngayCan} ${cc.ngayChi}, tháng ${cc.thangCan} ${cc.thangChi}, năm ${cc.namCan} ${cc.namChi}`);
  }

  if (result.movingMindDate) {
    lines.push(`Ngày động tâm: ${result.movingMindDate}`);
  }
  if (result.movingMindTime?.enabled && result.movingMindTime?.hourBranch) {
    lines.push(`Giờ động tâm : ${result.movingMindTime.hourBranch}`);
  }
  if (result.useSolarTerm && result.solarTerm) {
    lines.push(`Tiết khí     : ${result.solarTerm.nameVi}`);
  }
  if (result.khongVong?.length > 0) {
    lines.push(`Tuần không   : ${result.khongVong.join(', ')}`);
  }
  if (result.caster) {
    lines.push(`Người lập    : ${result.caster}`);
  }
  if (result.question) {
    lines.push(`Việc cần xem : ${result.question}`);
  }

  lines.push('');
  lines.push('─'.repeat(62));
  lines.push('');

  // === Tên quẻ ===
  const primary = result.primaryHexagram;
  const changed = result.changedHexagram;
  const palaceLabel = result.palaceName ? `[Cung ${result.palaceName} - ${result.queType ? QUE_TYPE_LABELS[result.queType] || result.queType : ''}]` : '';

  lines.push(`QUẺ CHỦ  : ${primary ? primary.nameVi.toUpperCase() : '(chưa xác định)'}  ${palaceLabel}`);
  if (changed && result.movingLines?.length > 0) {
    lines.push(`QUẺ BIẾN : ${changed.nameVi.toUpperCase()}`);
  } else {
    lines.push(`QUẺ BIẾN : (không có hào động)`);
  }

  lines.push('');
  lines.push('─'.repeat(62));
  lines.push('');

  // === Bảng 6 hào (H6 → H1) ===
  if (result.lines && result.lines.length > 0) {
    lines.push(padRight('Hào', 4) + padRight('T/Ứ', 5) + padRight('Lục Thân', 12) +
               padRight('Can Chi', 12) + padRight('P.Thần', 14) + padRight('T.K', 5) +
               padRight('Lục Thú', 14) + 'Vạch');
    lines.push('─'.repeat(78));

    const sortedLines = [...result.lines].sort((a, b) => b.index - a.index);
    sortedLines.forEach(line => {
      const haoLabel    = `H${line.index}`;
      const theUng      = line.theUng || '';
      const lucThan     = line.lucThan || '';
      const canChi      = `${line.chi || '?'}-${line.nguHanhHao || '?'}`;
      const phucThan    = line.phucThan ? line.phucThan.displayLabel : '';
      const kv          = line.isKhongVong ? 'K' : '';
      const lucThu      = line.lucThu || '';
      const yaoSymbol   = getYaoSymbol(line);

      lines.push(
        padRight(haoLabel, 4) +
        padRight(theUng, 5) +
        padRight(lucThan, 12) +
        padRight(canChi, 12) +
        padRight(phucThan, 14) +
        padRight(kv, 5) +
        padRight(lucThu, 14) +
        yaoSymbol
      );
    });

    // Nếu có quẻ biến → thêm cột so sánh
    if (result.changedLines && result.movingLines?.length > 0) {
      lines.push('');
      lines.push('SO SÁNH QUẺ CHỦ → QUẺ BIẾN:');
      lines.push('─'.repeat(70));

      sortedLines.forEach(line => {
        const changedLine = result.changedLines.find(l => l.index === line.index);
        const movingMark  = line.moving ? ' (x)' : '    ';
        const arrow       = line.moving ? ' -->' : '    ';
        const cLucThan    = changedLine?.lucThan  || '';
        const cCanChi     = changedLine ? `${changedLine.chi}-${changedLine.nguHanhHao}` : '';
        const cYao        = changedLine ? getYaoSymbol(changedLine) : '';

        lines.push(
          `H${line.index}: ` +
          padRight(line.lucThan || '', 10) +
          padRight(`${line.chi}-${line.nguHanhHao}`, 10) +
          getYaoSymbol(line) +
          `${movingMark}  ${padRight(line.lucThu || '', 12)}${arrow}  ` +
          padRight(cLucThan, 10) +
          padRight(cCanChi, 10) +
          cYao
        );
      });
    }
  }

  lines.push('');
  lines.push('─'.repeat(62));
  lines.push('');

  // === Thông tin bổ sung ===
  if (result.movingLines?.length > 0) {
    lines.push(`Hào động: ${result.movingLines.join(', ')}`);
  } else {
    lines.push('Hào động: không có');
  }
  lines.push(`Cung quẻ: ${result.palaceName || '?'} (${result.palaceElement || '?'})`);
  lines.push(`Thế hào : H${result.theHao || '?'}   Ứng hào: H${result.ungHao || '?'}`);
  lines.push(`Phương pháp: ${getModeLabel(result.mode)}`);

  return lines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function padRight(str, len) {
  const s = String(str || '');
  if (s.length >= len) return s.slice(0, len - 1) + ' ';
  return s + ' '.repeat(len - s.length);
}

function formatDateTime(d) {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function getYaoSymbol(line) {
  if (!line) return '?';
  if (line.yinYang === 'yang') {
    return line.moving ? '═══○═══' : '═══════';
  } else {
    return line.moving ? '══ × ══' : '══   ══';
  }
}

function getModeLabel(mode) {
  return mode === 'quick' ? 'Gieo nhanh 1 lần' : 'Gieo từng hào (6 bước)';
}

const QUE_TYPE_LABELS = {
  'bat-thuan': 'Bát Thuần',
  'nhat-the':  'Nhất Thế',
  'nhi-the':   'Nhị Thế',
  'tam-the':   'Tam Thế',
  'tu-the':    'Tứ Thế',
  'ngu-the':   'Ngũ Thế',
  'du-hon':    'Du Hồn',
  'quy-hon':   'Quy Hồn',
};

// ─────────────────────────────────────────────────────────────────────────────
// Plaintext cho kết quả Mai Hoa (3 quẻ)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vẽ 6 hào dạng ASCII, từ hào 6 xuống hào 1
 * @param {Array} lines  - [{index, yinYang, moving}]
 * @param {number|null} movingLine
 */
function drawHexAscii(lines, movingLine = null) {
  const sorted = [...lines].sort((a, b) => b.index - a.index);
  return sorted.map(l => {
    const moving = l.index === movingLine || l.moving;
    const sym = l.yinYang === 'yang'
      ? (moving ? '═══○═══' : '═══════')
      : (moving ? '══ ● ══' : '══   ══');
    return `  H${l.index}: ${sym}${moving ? ' ← động' : ''}`;
  }).join('\n');
}

export function buildMaiHoaPlainText(result) {
  if (!result) return '';

  const SEP = '─'.repeat(62);
  const lines = [];
  const createdAt = result.createdAt ? new Date(result.createdAt) : new Date();

  // Header
  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║              LẬP QUẺ MAI HOA DỊCH SỐ                   ║');
  lines.push('╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`Thời gian lập : ${formatDateTime(createdAt)}`);
  if (result.question) lines.push(`Việc cần xem  : ${result.question}`);
  const subLabel = result.subMode === 'time' ? 'Ngày giờ động tâm (Âm lịch)' : 'Số seri tiền (digit-sum)';
  lines.push(`Phương pháp   : Mai Hoa — ${subLabel}`);
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // Tính toán
  const calc = result.inputs?.calc || {};
  const li   = result.inputs?.lunarInfo;
  lines.push('CHI TIẾT TÍNH TOÁN:');
  if (result.subMode === 'time' && li) {
    lines.push(`  Năm (chi)  : ${li.yearStemVi} ${li.yearChiName} — số ${li.yearChiNumber}`);
    lines.push(`  Tháng AL   : ${li.monthNumber}`);
    lines.push(`  Ngày AL    : ${li.dayNumber}`);
    lines.push(`  Giờ (chi)  : ${li.hourBranchInfo?.nameVi} — số ${li.hourBranchInfo?.chiNumber}`);
    lines.push(`  Số thượng  : ${li.yearChiNumber} + ${li.monthNumber} + ${li.dayNumber} = ${calc.soThuong}`);
    lines.push(`  Số hạ      : ${calc.soThuong} + ${li.hourBranchInfo?.chiNumber} = ${calc.soHa}`);
    lines.push(`  Số hào     : ${calc.soHao}`);
  } else {
    lines.push(`  Số nhập    : ${calc.first4} | ${calc.last4}`);
    lines.push(`  Số thượng  : tổng ${calc.first4} = ${calc.soThuong}`);
    lines.push(`  Số hạ      : tổng ${calc.last4} = ${calc.soHa}`);
    lines.push(`  Số hào     : ${calc.soHao}`);
  }
  lines.push(`  Thượng quái: ${result.upperTrigram?.nameVi} (số ${result.upperTrigramNumber})`);
  lines.push(`  Hạ quái    : ${result.lowerTrigram?.nameVi} (số ${result.lowerTrigramNumber})`);
  lines.push(`  Hào động   : Hào ${result.movingLine}`);
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // 3 quẻ
  const theDung = result.theDung;
  const dungLabel = theDung?.dung === 'lower'
    ? `Hạ quái (${result.lowerTrigram?.nameVi}) = Dụng  |  Thượng quái (${result.upperTrigram?.nameVi}) = Thể`
    : `Thượng quái (${result.upperTrigram?.nameVi}) = Dụng  |  Hạ quái (${result.lowerTrigram?.nameVi}) = Thể`;

  lines.push('QUẺ CHỦ (Hiện tại):');
  lines.push(`  ${result.primaryHexagram?.nameVi?.toUpperCase() || '?'}  (Quẻ số ${result.primaryHexagram?.id || '?'})`);
  lines.push(`  ${dungLabel}`);
  lines.push(drawHexAscii(result.primaryLines, result.movingLine));
  lines.push('');

  lines.push('QUẺ HỖ (Diễn biến):');
  lines.push(`  ${result.queHo?.hexagram?.nameVi?.toUpperCase() || '?'}  (Quẻ số ${result.queHo?.hexagram?.id || '?'})`);
  lines.push(`  Thượng / Hạ: ${result.queHo?.upperTrigram?.nameVi} / ${result.queHo?.lowerTrigram?.nameVi}`);
  lines.push(drawHexAscii(result.queHo?.lines || []));
  lines.push('');

  lines.push('QUẺ BIẾN (Kết quả):');
  lines.push(`  ${result.changedHexagram?.nameVi?.toUpperCase() || '?'}  (Quẻ số ${result.changedHexagram?.id || '?'})`);
  lines.push(drawHexAscii(result.changedLines));
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // Tích hợp Bảng Lục Hào đi kèm
  if (result.lucHaoResult && result.lucHaoResult.lines) {
    lines.push('BẢNG LỤC HÀO ĐI KÈM (Tính theo giờ động tâm):');
    lines.push('─'.repeat(78));
    lines.push(padRight('Hào', 4) + padRight('T/Ứ', 5) + padRight('Lục Thân', 12) +
               padRight('Can Chi', 12) + padRight('P.Thần', 14) + padRight('T.K', 5) +
               padRight('Lục Thú', 14) + 'Vạch');
    lines.push('─'.repeat(78));

    const sortedLH = [...result.lucHaoResult.lines].sort((a, b) => b.index - a.index);
    sortedLH.forEach(line => {
      const haoLabel    = `H${line.index}`;
      const theUng      = line.theUng || '';
      const lucThan     = line.lucThan || '';
      const canChi      = `${line.chi || '?'}-${line.nguHanhHao || '?'}`;
      const phucThan    = line.phucThan ? line.phucThan.displayLabel || '' : '';
      const kv          = line.isKhongVong ? 'K' : '';
      const lucThu      = line.lucThu || '';
      const yaoSymbol   = getYaoSymbol(line);

      lines.push(
        padRight(haoLabel, 4) +
        padRight(theUng, 5) +
        padRight(lucThan, 12) +
        padRight(canChi, 12) +
        padRight(phucThan, 14) +
        padRight(kv, 5) +
        padRight(lucThu, 14) +
        yaoSymbol
      );
    });
    lines.push('');
    lines.push(`Cung quẻ: ${result.lucHaoResult.palaceName || '?'} (${result.lucHaoResult.palaceElement || '?'})`);
    lines.push(`Thế hào : H${result.lucHaoResult.theHao || '?'}   Ứng hào: H${result.lucHaoResult.ungHao || '?'}`);
    lines.push('');
    lines.push(SEP);
  }

  return lines.join('\n');
}
