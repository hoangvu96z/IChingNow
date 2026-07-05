/**
 * Xây dựng plaintext output từ kết quả Lục Hào đầy đủ
 */

import { vi } from '../data/translations/vi.js';
import { en } from '../data/translations/en.js';

export function buildPlainTextResult(result, language = 'vi') {
  if (!result) return '';

  const dict = language === 'en' ? en : vi;
  const t = (key, fallback = '') => dict[key] ?? fallback ?? key;

  const lines = [];

  const translateCanChiVal = (can, chi) => {
    if (!can || !chi) return '?';
    const stemTrans = t(`stem.${can}`, can);
    const branchTrans = t(`branch.${chi}`, chi);
    return `${stemTrans} ${branchTrans}`;
  };

  // === Metadata ===
  const createdAt = result.createdAt ? new Date(result.createdAt) : new Date();
  lines.push(`${t('meta.cast_date', 'Ngày lập quẻ')} : ${formatDateTime(createdAt, language)}`);

  if (result.canChi && !result.canChi.isFallback) {
    const cc = result.canChi;
    const ngayCC = translateCanChiVal(cc.ngayCan, cc.ngayChi);
    const thangCC = translateCanChiVal(cc.thangCan, cc.thangChi);
    const namCC = translateCanChiVal(cc.namCan, cc.namChi);
    
    if (language === 'en') {
      lines.push(`Day Stem/Branch: ${ngayCC}, Month: ${thangCC}, Year: ${namCC}`);
    } else {
      lines.push(`Can Chi ngày : ${ngayCC}, tháng ${thangCC}, năm ${namCC}`);
    }
  }

  if (result.movingMindDate) {
    lines.push(`${t('meta.moving_date', 'Ngày động tâm')}: ${result.movingMindDate}`);
  }
  if (result.movingMindTime?.enabled && result.movingMindTime?.hourBranch) {
    const branchName = result.movingMindTime.hourBranch.replace('Giờ ', '');
    const localizedHour = `${t('common.hour_prefix', 'Giờ')} ${t(`branch.${branchName}`, branchName)}`;
    lines.push(`${t('meta.moving_time', 'Giờ động tâm')} : ${localizedHour}`);
  }
  if (result.useSolarTerm && result.solarTerm) {
    const stName = language === 'en' ? result.solarTerm.nameEn || result.solarTerm.nameVi : result.solarTerm.nameVi;
    lines.push(`${t('meta.solar_term', 'Tiết khí')}     : ${stName}`);
  }
  if (result.khongVong?.length > 0) {
    const kvTrans = result.khongVong.map(v => t(`branch.${v}`, v)).join(', ');
    lines.push(`${t('info.tuan_khong', 'Tuần không')}   : ${kvTrans}`);
  }
  if (result.caster) {
    lines.push(`${t('meta.caster', 'Người lập')}    : ${result.caster}`);
  }
  if (result.question) {
    lines.push(`${t('meta.question', 'Việc cần xem')} : ${result.question}`);
  }

  lines.push('');
  lines.push('─'.repeat(62));
  lines.push('');

  // === Tên quẻ ===
  const primary = result.primaryHexagram;
  const changed = result.changedHexagram;
  
  const primaryName = primary ? (language === 'en' ? t(`hex.name.${primary.id}`, primary.nameVi) : primary.nameVi) : '';
  const changedName = changed ? (language === 'en' ? t(`hex.name.${changed.id}`, changed.nameVi) : changed.nameVi) : '';

  const palaceNameTrans = result.palaceName ? t(`trigram.${result.palaceName}`, result.palaceName) : '';
  const queTypeTrans = result.queType ? t(`queType.${result.queType}`, result.queType) : '';
  const palaceLabel = result.palaceName ? `[${t('info.palace', 'Cung')} ${palaceNameTrans} - ${queTypeTrans}]` : '';

  lines.push(`${t('result.primary_hex', 'QUẺ CHỦ')}  : ${primaryName ? primaryName.toUpperCase() : t('common.unknown', '(chưa xác định)')}  ${palaceLabel}`);
  if (changed && result.movingLines?.length > 0) {
    lines.push(`${t('result.changed_hex', 'QUẺ BIẾN')} : ${changedName.toUpperCase()}`);
  } else {
    lines.push(`${t('result.changed_hex', 'QUẺ BIẾN')} : ${t('result.no_moving_lines', '(không có hào động)')}`);
  }

  lines.push('');
  lines.push('─'.repeat(62));
  lines.push('');

  // === Bảng 6 hào (H6 → H1) ===
  if (result.lines && result.lines.length > 0) {
    const colYao = t('result.col_yao', 'Hào');
    const colTheUng = t('result.col_the_ung', 'T/Ứ');
    const colLucThan = t('result.col_luc_than', 'Lục Thân');
    const colCanChi = t('result.col_can_chi', 'Can Chi');
    const colPhucThan = t('result.col_phuc_than', 'P.Thần');
    const colTK = t('result.col_tuan_khong', 'T.K');
    const colLucThu = t('result.col_luc_thu', 'Lục Thú');
    
    lines.push(padRight(colYao, 6) + padRight(colTheUng, 6) + padRight(colLucThan, 12) +
               padRight(colCanChi, 12) + padRight(colPhucThan, 14) + padRight(colTK, 6) +
               padRight(colLucThu, 14) + (language === 'en' ? 'Yao' : 'Vạch'));
    lines.push('─'.repeat(78));

    const sortedLines = [...result.lines].sort((a, b) => b.index - a.index);
    sortedLines.forEach(line => {
      const haoLabel    = `H${line.index}`;
      const theUng      = line.theUng === 'Thế' ? t('theUng.the', 'Thế') : line.theUng === 'Ứng' ? t('theUng.ung', 'Ứng') : '';
      const lucThan     = line.lucThan ? t(`lucThan.${line.lucThan}`, line.lucThan) : '';
      
      const chiTrans = t(`branch.${line.chi}`, line.chi);
      const elementTrans = t(`element.${line.nguHanhHao}`, line.nguHanhHao);
      const canChi      = line.chi && line.nguHanhHao ? `${chiTrans}-${elementTrans}` : '?';
      
      let phucThan = '';
      if (line.phucThan) {
        const ftLucThan = t(`lucThan.${line.phucThan.lucThan}`, line.phucThan.lucThan);
        const ftChi = t(`branch.${line.phucThan.chi}`, line.phucThan.chi);
        const ftElement = t(`element.${line.phucThan.nguHanh}`, line.phucThan.nguHanh);
        phucThan = `${ftLucThan}(${ftChi}-${ftElement})`;
      }
      
      const kv          = line.isKhongVong ? (language === 'en' ? 'V' : 'K') : '';
      const lucThu      = line.lucThu ? t(`lucThu.${line.lucThu}`, line.lucThu) : '';
      const yaoSymbol   = getYaoSymbol(line);

      lines.push(
        padRight(haoLabel, 6) +
        padRight(theUng, 6) +
        padRight(lucThan, 12) +
        padRight(canChi, 12) +
        padRight(phucThan, 14) +
        padRight(kv, 6) +
        padRight(lucThu, 14) +
        yaoSymbol
      );
    });

    // Nếu có quẻ biến → thêm cột so sánh
    if (result.changedLines && result.movingLines?.length > 0) {
      lines.push('');
      lines.push(language === 'en' ? 'COMPARE PRIMARY HEXAGRAM → CHANGED HEXAGRAM:' : 'SO SÁNH QUẺ CHỦ → QUẺ BIẾN:');
      lines.push('─'.repeat(70));

      sortedLines.forEach(line => {
        const changedLine = result.changedLines.find(l => l.index === line.index);
        const movingMark  = line.moving ? ' (x)' : '    ';
        const arrow       = line.moving ? ' -->' : '    ';
        const cLucThan    = changedLine?.lucThan ? t(`lucThan.${changedLine.lucThan}`, changedLine.lucThan) : '';
        
        const cChiTrans   = changedLine ? t(`branch.${changedLine.chi}`, changedLine.chi) : '';
        const cElementTrans = changedLine ? t(`element.${changedLine.nguHanhHao}`, changedLine.nguHanhHao) : '';
        const cCanChi     = changedLine ? `${cChiTrans}-${cElementTrans}` : '';
        const cYao        = changedLine ? getYaoSymbol(changedLine) : '';
        const lineLucThan = line.lucThan ? t(`lucThan.${line.lucThan}`, line.lucThan) : '';
        const lineChiTrans = t(`branch.${line.chi}`, line.chi);
        const lineElementTrans = t(`element.${line.nguHanhHao}`, line.nguHanhHao);
        const lineLucThuTrans = line.lucThu ? t(`lucThu.${line.lucThu}`, line.lucThu) : '';

        lines.push(
          `H${line.index}: ` +
          padRight(lineLucThan, 10) +
          padRight(`${lineChiTrans}-${lineElementTrans}`, 10) +
          getYaoSymbol(line) +
          `${movingMark}  ${padRight(lineLucThuTrans, 12)}${arrow}  ` +
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
    lines.push(`${t('meta.moving_lines', 'Hào động')}: ${result.movingLines.join(', ')}`);
  } else {
    lines.push(`${t('meta.moving_lines', 'Hào động')}: ${t('meta.moving_lines_none', 'không có')}`);
  }
  const palaceElementTrans = result.palaceElement ? t(`element.${result.palaceElement}`, result.palaceElement) : '';
  lines.push(`${t('info.palace', 'Cung quẻ')}: ${palaceNameTrans || '?'} (${palaceElementTrans || '?'})`);
  lines.push(`${t('info.the_h', 'Thế hào')} : H${result.theHao || '?'}   ${t('info.ung_h', 'Ứng hào')}: H${result.ungHao || '?'}`);
  lines.push(`${t('meta.method', 'Phương pháp')}: ${result.mode === 'quick' ? t('meta.method_quick', 'Gieo nhanh 1 lần') : t('meta.method_manual', 'Gieo từng hào (6 bước)')}`);

  return lines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function padRight(str, len) {
  const s = String(str || '');
  if (s.length >= len) return s.slice(0, len - 1) + ' ';
  return s + ' '.repeat(len - s.length);
}

function formatDateTime(d, language) {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return language === 'en' ? `${mm}/${dd}/${yyyy} ${hh}:${min}` : `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function getYaoSymbol(line) {
  if (!line) return '?';
  if (line.yinYang === 'yang') {
    return line.moving ? '═══○═══' : '═══════';
  } else {
    return line.moving ? '══ × ══' : '══   ══';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Plaintext cho kết quả Mai Hoa (3 quẻ)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vẽ 6 hào dạng ASCII, từ hào 6 xuống hào 1
 */
function drawHexAscii(lines, movingLine = null, language = 'vi') {
  const sorted = [...lines].sort((a, b) => b.index - a.index);
  const dongLabel = language === 'en' ? ' ← active' : ' ← động';
  const labelH = language === 'en' ? 'Line' : 'Hào';
  return sorted.map(l => {
    const moving = l.index === movingLine || l.moving;
    const sym = l.yinYang === 'yang'
      ? (moving ? '═══○═══' : '═══════')
      : (moving ? '══ ● ══' : '══   ══');
    return `  ${labelH} ${l.index}: ${sym}${moving ? dongLabel : ''}`;
  }).join('\n');
}

export function buildMaiHoaPlainText(result, language = 'vi') {
  if (!result) return '';

  const dict = language === 'en' ? en : vi;
  const t = (key, fallback = '') => dict[key] ?? fallback ?? key;

  const SEP = '─'.repeat(62);
  const lines = [];
  const createdAt = result.createdAt ? new Date(result.createdAt) : new Date();

  // Header
  if (language === 'en') {
    lines.push('╔══════════════════════════════════════════════════════════╗');
    lines.push('║             PLUM BLOSSOM CASTING METHOD                  ║');
    lines.push('╚══════════════════════════════════════════════════════════╝');
  } else {
    lines.push('╔══════════════════════════════════════════════════════════╗');
    lines.push('║              LẬP QUẺ MAI HOA DỊCH SỐ                   ║');
    lines.push('╚══════════════════════════════════════════════════════════╝');
  }
  lines.push('');
  lines.push(`${t('meta.cast_time', 'Thời gian lập')} : ${formatDateTime(createdAt, language)}`);
  if (result.question) lines.push(`${t('meta.question', 'Việc cần xem')}  : ${result.question}`);
  
  const subLabel = result.subMode === 'time' 
    ? t('maihoa.time_title', 'Ngày giờ động tâm (Âm lịch)') 
    : t('maihoa.serial_title', 'Số seri tiền (digit-sum)');
  lines.push(`${t('meta.method', 'Phương pháp')}   : ${subLabel}`);
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // Tính toán
  const calc = result.inputs?.calc || {};
  const li   = result.inputs?.lunarInfo;
  
  lines.push(language === 'en' ? 'CALCULATION DETAILS:' : 'CHI TIẾT TÍNH TOÁN:');
  if (result.subMode === 'time' && li) {
    const yearStemTrans = t(`stem.${li.yearStemVi}`, li.yearStemVi);
    const yearChiTrans = t(`branch.${li.yearChiName}`, li.yearChiName);
    const hourBranchTrans = li.hourBranchInfo ? t(`branch.${li.hourBranchInfo.nameVi.replace('Giờ ', '')}`, li.hourBranchInfo.nameVi) : '';
    
    if (language === 'en') {
      lines.push(`  Year (branch) : ${yearStemTrans} ${yearChiTrans} — number ${li.yearChiNumber}`);
      lines.push(`  Lunar Month   : ${li.monthNumber}`);
      lines.push(`  Lunar Day     : ${li.dayNumber}`);
      lines.push(`  Hour (branch) : ${hourBranchTrans} — number ${li.hourBranchInfo?.chiNumber}`);
      lines.push(`  Upper Number  : ${li.yearChiNumber} + ${li.monthNumber} + ${li.dayNumber} = ${calc.soThuong}`);
      lines.push(`  Lower Number  : ${calc.soThuong} + ${li.hourBranchInfo?.chiNumber} = ${calc.soHa}`);
      lines.push(`  Line Number   : ${calc.soHao}`);
    } else {
      lines.push(`  Năm (chi)  : ${li.yearStemVi} ${li.yearChiName} — số ${li.yearChiNumber}`);
      lines.push(`  Tháng AL   : ${li.monthNumber}`);
      lines.push(`  Ngày AL    : ${li.dayNumber}`);
      lines.push(`  Giờ (chi)  : ${li.hourBranchInfo?.nameVi} — số ${li.hourBranchInfo?.chiNumber}`);
      lines.push(`  Số thượng  : ${li.yearChiNumber} + ${li.monthNumber} + ${li.dayNumber} = ${calc.soThuong}`);
      lines.push(`  Số hạ      : ${calc.soThuong} + ${li.hourBranchInfo?.chiNumber} = ${calc.soHa}`);
      lines.push(`  Số hào     : ${calc.soHao}`);
    }
  } else {
    if (language === 'en') {
      lines.push(`  Input number  : ${calc.first4} | ${calc.last4}`);
      lines.push(`  Upper Number  : sum of ${calc.first4} = ${calc.soThuong}`);
      lines.push(`  Lower Number  : sum of ${calc.last4} = ${calc.soHa}`);
      lines.push(`  Line Number   : ${calc.soHao}`);
    } else {
      lines.push(`  Số nhập    : ${calc.first4} | ${calc.last4}`);
      lines.push(`  Số thượng  : tổng ${calc.first4} = ${calc.soThuong}`);
      lines.push(`  Số hạ      : tổng ${calc.last4} = ${calc.soHa}`);
      lines.push(`  Số hào     : ${calc.soHao}`);
    }
  }
  
  const upperTrigramTrans = result.upperTrigram ? t(`trigram.${result.upperTrigram.nameVi}`, result.upperTrigram.nameVi) : '';
  const lowerTrigramTrans = result.lowerTrigram ? t(`trigram.${result.lowerTrigram.nameVi}`, result.lowerTrigram.nameVi) : '';
  
  if (language === 'en') {
    lines.push(`  Upper Trigram: ${upperTrigramTrans} (number ${result.upperTrigramNumber})`);
    lines.push(`  Lower Trigram: ${lowerTrigramTrans} (number ${result.lowerTrigramNumber})`);
    lines.push(`  Changing Line: Line ${result.movingLine}`);
  } else {
    lines.push(`  Thượng quái: ${result.upperTrigram?.nameVi} (số ${result.upperTrigramNumber})`);
    lines.push(`  Hạ quái    : ${result.lowerTrigram?.nameVi} (số ${result.lowerTrigramNumber})`);
    lines.push(`  Hào động   : Hào ${result.movingLine}`);
  }
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // 3 quẻ
  const theDung = result.theDung;
  let dungLabel = '';
  if (language === 'en') {
    dungLabel = theDung?.dung === 'lower'
      ? `Lower Trigram (${lowerTrigramTrans}) = Object (Yong)  |  Upper Trigram (${upperTrigramTrans}) = Subject (Ti)`
      : `Upper Trigram (${upperTrigramTrans}) = Object (Yong)  |  Lower Trigram (${lowerTrigramTrans}) = Subject (Ti)`;
  } else {
    dungLabel = theDung?.dung === 'lower'
      ? `Hạ quái (${result.lowerTrigram?.nameVi}) = Dụng  |  Thượng quái (${result.upperTrigram?.nameVi}) = Thể`
      : `Thượng quái (${result.upperTrigram?.nameVi}) = Dụng  |  Hạ quái (${result.lowerTrigram?.nameVi}) = Thể`;
  }

  const primaryName = result.primaryHexagram ? (language === 'en' ? t(`hex.name.${result.primaryHexagram.id}`, result.primaryHexagram.nameVi) : result.primaryHexagram.nameVi) : '?';
  const changedName = result.changedHexagram ? (language === 'en' ? t(`hex.name.${result.changedHexagram.id}`, result.changedHexagram.nameVi) : result.changedHexagram.nameVi) : '?';
  const queHoName = result.queHo?.hexagram ? (language === 'en' ? t(`hex.name.${result.queHo.hexagram.id}`, result.queHo.hexagram.nameVi) : result.queHo.hexagram.nameVi) : '?';
  const queHoUpperTrans = result.queHo?.upperTrigram ? t(`trigram.${result.queHo.upperTrigram.nameVi}`, result.queHo.upperTrigram.nameVi) : '';
  const queHoLowerTrans = result.queHo?.lowerTrigram ? t(`trigram.${result.queHo.lowerTrigram.nameVi}`, result.queHo.lowerTrigram.nameVi) : '';

  lines.push(`${t('maihoa.result_aspect_chu', 'QUẺ CHỦ (Hiện tại)')}:`);
  lines.push(`  ${primaryName.toUpperCase()}  (${t('result.hex_number', 'Quẻ số')} ${result.primaryHexagram?.id || '?'})`);
  lines.push(`  ${dungLabel}`);
  lines.push(drawHexAscii(result.primaryLines, result.movingLine, language));
  lines.push('');

  lines.push(`${t('maihoa.result_aspect_ho', 'QUẺ HỖ (Diễn biến)')}:`);
  lines.push(`  ${queHoName.toUpperCase()}  (${t('result.hex_number', 'Quẻ số')} ${result.queHo?.hexagram?.id || '?'})`);
  lines.push(`  Thượng / Hạ: ${queHoUpperTrans} / ${queHoLowerTrans}`);
  lines.push(drawHexAscii(result.queHo?.lines || [], null, language));
  lines.push('');

  lines.push(`${t('maihoa.result_aspect_bien', 'QUẺ BIẾN (Kết quả)')}:`);
  lines.push(`  ${changedName.toUpperCase()}  (${t('result.hex_number', 'Quẻ số')} ${result.changedHexagram?.id || '?'})`);
  lines.push(drawHexAscii(result.changedLines, null, language));
  lines.push('');
  lines.push(SEP);
  lines.push('');

  // Tích hợp Bảng Lục Hào đi kèm
  if (result.lucHaoResult && result.lucHaoResult.lines) {
    if (language === 'en') {
      lines.push('ACCOMPANYING SIX LINES TABLE (Computed from Time of Intent):');
    } else {
      lines.push('BẢNG LỤC HÀO ĐI KÈM (Tính theo giờ động tâm):');
    }
    lines.push('─'.repeat(78));
    
    const colYao = t('result.col_yao', 'Hào');
    const colTheUng = t('result.col_the_ung', 'T/Ứ');
    const colLucThan = t('result.col_luc_than', 'Lục Thân');
    const colCanChi = t('result.col_can_chi', 'Can Chi');
    const colPhucThan = t('result.col_phuc_than', 'P.Thần');
    const colTK = t('result.col_tuan_khong', 'T.K');
    const colLucThu = t('result.col_luc_thu', 'Lục Thú');

    lines.push(padRight(colYao, 6) + padRight(colTheUng, 6) + padRight(colLucThan, 12) +
               padRight(colCanChi, 12) + padRight(colPhucThan, 14) + padRight(colTK, 6) +
               padRight(colLucThu, 14) + (language === 'en' ? 'Yao' : 'Vạch'));
    lines.push('─'.repeat(78));

    const sortedLH = [...result.lucHaoResult.lines].sort((a, b) => b.index - a.index);
    sortedLH.forEach(line => {
      const haoLabel    = `H${line.index}`;
      const theUng      = line.theUng === 'Thế' ? t('theUng.the', 'Thế') : line.theUng === 'Ứng' ? t('theUng.ung', 'Ứng') : '';
      const lucThan     = line.lucThan ? t(`lucThan.${line.lucThan}`, line.lucThan) : '';
      
      const chiTrans = t(`branch.${line.chi}`, line.chi);
      const elementTrans = t(`element.${line.nguHanhHao}`, line.nguHanhHao);
      const canChi      = line.chi && line.nguHanhHao ? `${chiTrans}-${elementTrans}` : '?';
      
      let phucThan = '';
      if (line.phucThan) {
        const ftLucThan = t(`lucThan.${line.phucThan.lucThan}`, line.phucThan.lucThan);
        const ftChi = t(`branch.${line.phucThan.chi}`, line.phucThan.chi);
        const ftElement = t(`element.${line.phucThan.nguHanh}`, line.phucThan.nguHanh);
        phucThan = `${ftLucThan}(${ftChi}-${ftElement})`;
      }
      
      const kv          = line.isKhongVong ? (language === 'en' ? 'V' : 'K') : '';
      const lucThu      = line.lucThu ? t(`lucThu.${line.lucThu}`, line.lucThu) : '';
      const yaoSymbol   = getYaoSymbol(line);

      lines.push(
        padRight(haoLabel, 6) +
        padRight(theUng, 6) +
        padRight(lucThan, 12) +
        padRight(canChi, 12) +
        padRight(phucThan, 14) +
        padRight(kv, 6) +
        padRight(lucThu, 14) +
        yaoSymbol
      );
    });
    lines.push('');
    
    const palaceTrans = t(`trigram.${result.lucHaoResult.palaceName}`, result.lucHaoResult.palaceName);
    const elemTrans = t(`element.${result.lucHaoResult.palaceElement}`, result.lucHaoResult.palaceElement);
    
    lines.push(`${t('info.palace', 'Cung quẻ')}: ${palaceTrans || '?'} (${elemTrans || '?'})`);
    lines.push(`${t('info.the_h', 'Thế hào')} : H${result.lucHaoResult.theHao || '?'}   ${t('info.ung_h', 'Ứng hào')}: H${result.lucHaoResult.ungHao || '?'}`);
    lines.push('');
    lines.push(SEP);
  }

  return lines.join('\n');
}
