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
