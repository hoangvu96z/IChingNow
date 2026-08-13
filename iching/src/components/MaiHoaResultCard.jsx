import React from 'react';
import HexagramDisplay from './HexagramDisplay.jsx';
import DescriptionPanel from './DescriptionPanel.jsx';
import LucHaoTable from './LucHaoTable.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

// ─── Hexagram card (1 trong 3 quẻ) ───────────────────────────────────────────
function HexCard({ label, labelColor, hexagram, lines, subtitle, badge }) {
  const { t, language } = useLanguage();
  const hexName = hexagram
    ? (language === 'en' ? t(`hex.name.${hexagram.id}`, hexagram.nameVi) : hexagram.nameVi)
    : '—';

  return (
    <div style={{
      flex: 1,
      minWidth: 120,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Label */}
      <div style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        color: labelColor,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {label}
        {badge && (
          <span style={{
            marginLeft: 5,
            padding: '1px 6px',
            background: `${labelColor}20`,
            border: `1px solid ${labelColor}40`,
            borderRadius: 999,
            fontSize: '0.65rem',
          }}>
            {badge}
          </span>
        )}
      </div>

      {/* Quẻ đồ họa */}
      <div style={{ width: 100 }}>
        <HexagramDisplay lines={lines} size="md" />
      </div>

      {/* Tên quẻ */}
      <div style={{
        textAlign: 'center',
        fontFamily: "'Noto Serif', serif",
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: hexagram ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        lineHeight: 1.3,
      }}>
        {hexName}
      </div>

      {/* Số hiệu */}
      {hexagram && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
          {t('result.hex_number', 'Quẻ số')} {hexagram.id}
        </div>
      )}

      {/* Subtitle (thông tin thêm) */}
      {subtitle && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
          textAlign: 'center',
          lineHeight: 1.4,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Mũi tên giữa các quẻ ─────────────────────────────────────────────────────
function Arrow() {
  return (
    <>
      <div className="arrow-desktop">→</div>
      <div className="arrow-mobile">↓</div>
    </>
  );
}

// ─── Thể/Dụng badge trong card quẻ chủ ───────────────────────────────────────
function TheDungOverlay({ upperTrigram, lowerTrigram, theDung }) {
  const { t } = useLanguage();
  const dungIsUpper  = theDung.dung === 'upper';
  const dungTrigram  = dungIsUpper ? upperTrigram : lowerTrigram;
  const theTrigram   = dungIsUpper ? lowerTrigram : upperTrigram;

  const dungTrigramName = dungTrigram ? t(`trigram.${dungTrigram.nameVi}`, dungTrigram.nameVi) : '';
  const theTrigramName = theTrigram ? t(`trigram.${theTrigram.nameVi}`, theTrigram.nameVi) : '';

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: 2,
    }}>
      {[
        { label: t('maihoa.dung', 'Dụng'), trigramName: dungTrigramName, color: 'var(--color-vermillion)' },
        { label: t('maihoa.the', 'Thể'),   trigramName: theTrigramName,  color: 'var(--color-jade)'       },
      ].map(({ label, trigramName, color }) => (
        <span key={label} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 9px',
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 999,
          fontSize: '0.75rem',
          fontWeight: 700,
          color,
        }}>
          {label}: {trigramName}
        </span>
      ))}
    </div>
  );
}

// ─── Bảng tóm tắt tính toán ───────────────────────────────────────────────────
function CalcTable({ result }) {
  const { t, language } = useLanguage();
  const { subMode, inputs, upperTrigram, lowerTrigram, movingLine, upperTrigramNumber, lowerTrigramNumber } = result;
  const calc = inputs?.calc || {};

  const rows = [];

  if (subMode === 'time') {
    const li = inputs?.lunarInfo;
    const yearStemTrans = li ? t(`stem.${li.yearStemVi}`, li.yearStemVi) : '';
    const yearChiTrans = li ? t(`branch.${li.yearChiName}`, li.yearChiName) : '';
    const hourBranchTrans = li?.hourBranchInfo ? t(`branch.${li.hourBranchInfo.nameVi.replace('Giờ ', '')}`, li.hourBranchInfo.nameVi) : '';

    rows.push({ label: t('maihoa.lunar_year', 'Năm (chi)'),   value: `${yearStemTrans} ${yearChiTrans} — # ${li?.yearChiNumber || '?'}` });
    rows.push({ label: t('maihoa.lunar_month', 'Tháng AL'),    value: String(li?.monthNumber || '?') });
    rows.push({ label: t('maihoa.lunar_day', 'Ngày AL'),     value: String(li?.dayNumber || '?') });
    rows.push({ label: t('maihoa.lunar_hour', 'Giờ (chi)'),   value: `${hourBranchTrans} — # ${li?.hourBranchInfo?.chiNumber || '?'}` });
    rows.push({ label: t('maihoa.serial_upper', 'Số thượng'),   value: String(calc.soThuong ?? '?') });
    rows.push({ label: t('maihoa.serial_lower', 'Số hạ'),       value: String(calc.soHa ?? '?') });
  } else {
    rows.push({ label: t('maihoa.serial_num', 'Số seri'),     value: `${calc.first4 || '????'} | ${calc.last4 || '????'}` });
    rows.push({ label: t('maihoa.serial_upper', 'Số thượng'),   value: `${language === 'en' ? 'Sum of' : 'Tổng'} ${calc.first4 || '?'} = ${calc.soThuong ?? '?'}` });
    rows.push({ label: t('maihoa.serial_lower', 'Số hạ'),       value: `${language === 'en' ? 'Sum of' : 'Tổng'} ${calc.last4 || '?'} = ${calc.soHa ?? '?'}` });
    rows.push({ label: t('maihoa.serial_line', 'Số hào'),      value: String(calc.soHao ?? '?') });
  }

  const upperTrigramTrans = upperTrigram ? t(`trigram.${upperTrigram.nameVi}`, upperTrigram.nameVi) : '';
  const lowerTrigramTrans = lowerTrigram ? t(`trigram.${lowerTrigram.nameVi}`, lowerTrigram.nameVi) : '';

  rows.push({ label: t('maihoa.calc_upper', 'Thượng quái'),  value: `${upperTrigramTrans} (# ${upperTrigramNumber})`, accent: 'var(--color-vermillion)' });
  rows.push({ label: t('maihoa.calc_lower', 'Hạ quái'),      value: `${lowerTrigramTrans} (# ${lowerTrigramNumber})`, accent: 'var(--color-jade)'      });
  rows.push({ label: t('meta.moving_lines', 'Hào động'),     value: `${language === 'en' ? 'Line' : 'Hào'} ${movingLine}`, accent: 'var(--color-vermillion)', bold: true });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {rows.map(({ label, value, accent, bold }) => (
        <div key={label} style={{
          display: 'flex', gap: 12, padding: '4px 0',
          borderBottom: '1px solid rgba(184,134,11,0.1)',
          alignItems: 'baseline',
        }}>
          <span style={{ minWidth: 100, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>
            {label}
          </span>
          <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif", color: accent || 'var(--color-ink)', fontWeight: bold ? 700 : 400 }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MaiHoaResultCard({ result }) {
  const { t, language } = useLanguage();

  if (!result) return null;

  const {
    primaryLines, primaryHexagram,
    queHo,
    changedLines, changedHexagram,
    movingLine,
    upperTrigram, lowerTrigram,
    theDung,
    subMode,
  } = result;

  const subModeLabel = subMode === 'time' 
    ? t('maihoa.time_title', 'Ngày giờ động tâm').replace('🕐 ', '')
    : t('maihoa.serial_title', 'Số seri tiền').replace('💵 ', '');

  const primaryName = primaryHexagram ? (language === 'en' ? t(`hex.name.${primaryHexagram.id}`, primaryHexagram.nameVi) : primaryHexagram.nameVi) : '—';
  const queHoUpperTrans = queHo?.upperTrigram ? t(`trigram.${queHo.upperTrigram.nameVi}`, queHo.upperTrigram.nameVi) : '';
  const queHoLowerTrans = queHo?.lowerTrigram ? t(`trigram.${queHo.lowerTrigram.nameVi}`, queHo.lowerTrigram.nameVi) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Badge phương pháp */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 12px',
          background: 'linear-gradient(135deg, rgba(184,134,11,0.15), rgba(184,134,11,0.08))',
          border: '1px solid rgba(184,134,11,0.35)',
          borderRadius: 999,
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.06em',
        }}>
          🌸 {subModeLabel.toUpperCase()}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
          {t('meta.moving_lines', 'Hào động')}: <strong style={{ color: 'var(--color-vermillion)' }}>{movingLine}</strong>
        </span>
      </div>

      {/* 3 quẻ ngang hàng */}
      <div className="responsive-hexagrams-container">

        {/* Quẻ Chủ */}
        <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-vermillion)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t('maihoa.result_aspect_chu', 'Quẻ Chủ')}
          </div>
          <div style={{ width: 100 }}>
            <HexagramDisplay lines={primaryLines} size="md" />
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'Noto Serif', serif", fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ink)', lineHeight: 1.3 }}>
            {primaryName}
          </div>
          {primaryHexagram && <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{t('result.hex_number', 'Quẻ số')} {primaryHexagram.id}</div>}
          {/* Thể/Dụng */}
          <TheDungOverlay upperTrigram={upperTrigram} lowerTrigram={lowerTrigram} theDung={theDung} />
        </div>

        <Arrow />

        {/* Quẻ Hỗ */}
        <HexCard
          label={t('maihoa.result_aspect_ho', 'Quẻ Hỗ')}
          labelColor="#7c5cbf"
          hexagram={queHo?.hexagram}
          lines={queHo?.lines || []}
          subtitle={queHo ? `${queHoUpperTrans} / ${queHoLowerTrans}` : ''}
        />

        <Arrow />

        {/* Quẻ Biến */}
        <HexCard
          label={t('maihoa.result_aspect_bien', 'Quẻ Biến')}
          labelColor="var(--color-jade)"
          hexagram={changedHexagram}
          lines={changedLines}
        />
      </div>

      {/* Mô tả chi tiết cho Quẻ Chủ (đầy đủ 5 khía cạnh) */}
      <DescriptionPanel hexagram={primaryHexagram} color="var(--color-vermillion)" />

      <hr className="divider" />

      {/* Mô tả Quẻ Hỗ (nếu có) */}
      {queHo?.hexagram && (
        <>
          <DescriptionPanel hexagram={queHo.hexagram} color="#7c5cbf" />
          <hr className="divider" style={{ opacity: 0.4 }} />
        </>
      )}

      {/* Mô tả Quẻ Biến (nếu có) */}
      {changedHexagram && (
        <DescriptionPanel hexagram={changedHexagram} color="var(--color-jade)" />
      )}

      {/* Bảng Lục Hào đi kèm (Nếu có) */}
      {result.lucHaoResult && (
        <>
          <hr className="divider" />
          <div>
            <div style={{
              fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted)',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
            }}>
              📊 {t('maihoa.accompanying_luc_hao', 'Bảng Lục Hào của quẻ')}
            </div>
            <LucHaoTable result={result.lucHaoResult} />
          </div>
        </>
      )}

      {/* Chi tiết tính toán */}
      <div>
        <div style={{
          fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          {t('maihoa.calc_details', 'Chi tiết tính toán')}
        </div>
        <CalcTable result={result} />
      </div>

      {/* Ghi chú hào động */}
      <div style={{
        padding: '8px 14px',
        background: 'rgba(192,57,43,0.06)',
        borderRadius: 8,
        border: '1px solid rgba(192,57,43,0.15)',
        fontSize: '0.8125rem',
        color: 'var(--color-ink-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ width: 14, height: 6, background: 'var(--color-vermillion)', borderRadius: 2, flexShrink: 0 }} />
        {t('maihoa.moving_line_note', `Hào ${movingLine} là hào động — đánh dấu màu đỏ trên Quẻ Chủ`).replace('${movingLine}', movingLine).replace('{movingLine}', movingLine)}
      </div>
    </div>
  );
}
