import React from 'react';
import HexagramDisplay from './HexagramDisplay.jsx';

// ─── Hexagram card (1 trong 3 quẻ) ───────────────────────────────────────────
function HexCard({ label, labelColor, hexagram, lines, subtitle, badge }) {
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
        {hexagram?.nameVi || '—'}
      </div>

      {/* Số hiệu */}
      {hexagram && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
          Quẻ số {hexagram.id}
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

// ─── Panel mô tả chi tiết 1 quẻ (5 khía cạnh) ───────────────────────────────
function DescriptionPanel({ hexagram, color }) {
  if (!hexagram?.description) return null;
  const d = hexagram.description;
  const aspects = [
    { key: 'tong_quat', label: 'Tổng quát' },
    { key: 'tinh_cam',  label: 'Tình cảm' },
    { key: 'gia_dao',   label: 'Gia đạo'  },
    { key: 'cong_viec', label: 'Công việc' },
    { key: 'suc_khoe',  label: 'Sức khỏe' },
  ];
  return (
    <div style={{
      padding: '14px 16px',
      background: `${color || 'rgba(184,134,11,0.04)'}08`,
      border: `1px solid ${color || 'rgba(184,134,11,0.2)'}`,
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingBottom: 8,
        borderBottom: `1px solid ${color || 'rgba(184,134,11,0.2)'}`,
      }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: color || 'var(--color-gold)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          📖 Luận giải chi tiết
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
          fontStyle: 'italic',
        }}>
          {hexagram.nameVi}
        </div>
      </div>
      {aspects.map(({ key, label }) => (
        d[key] && (
          <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{
              flexShrink: 0,
              minWidth: 78,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: color || 'var(--color-gold)',
              paddingTop: 2,
            }}>
              {label}:
            </span>
            <span style={{
              flex: 1,
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--color-ink)',
            }}>
              {d[key]}
            </span>
          </div>
        )
      ))}
    </div>
  );
}

// ─── Mũi tên giữa các quẻ ─────────────────────────────────────────────────────
function Arrow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingTop: 36,
      color: 'var(--color-gold)',
      fontSize: '1.25rem',
      flexShrink: 0,
    }}>→</div>
  );
}

// ─── Thể/Dụng badge trong card quẻ chủ ───────────────────────────────────────
function TheDungOverlay({ upperTrigram, lowerTrigram, theDung }) {
  const dungIsUpper  = theDung.dung === 'upper';
  const dungTrigram  = dungIsUpper ? upperTrigram : lowerTrigram;
  const theTrigram   = dungIsUpper ? lowerTrigram : upperTrigram;

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: 2,
    }}>
      {[
        { label: 'Dụng', trigram: dungTrigram, color: 'var(--color-vermillion)' },
        { label: 'Thể',  trigram: theTrigram,  color: 'var(--color-jade)'       },
      ].map(({ label, trigram, color }) => (
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
          {label}: {trigram?.nameVi}
        </span>
      ))}
    </div>
  );
}

// ─── Bảng tóm tắt tính toán ───────────────────────────────────────────────────
function CalcTable({ result }) {
  const { subMode, inputs, upperTrigram, lowerTrigram, movingLine, upperTrigramNumber, lowerTrigramNumber } = result;
  const calc = inputs?.calc || {};

  const rows = [];

  if (subMode === 'time') {
    const li = inputs?.lunarInfo;
    rows.push({ label: 'Năm (chi)',   value: `${li?.yearChiName || '?'} — số ${li?.yearChiNumber || '?'}` });
    rows.push({ label: 'Tháng AL',    value: String(li?.monthNumber || '?') });
    rows.push({ label: 'Ngày AL',     value: String(li?.dayNumber || '?') });
    rows.push({ label: 'Giờ (chi)',   value: `${li?.hourBranchInfo?.nameVi || '?'} — số ${li?.hourBranchInfo?.chiNumber || '?'}` });
    rows.push({ label: 'Số thượng',   value: String(calc.soThuong ?? '?') });
    rows.push({ label: 'Số hạ',       value: String(calc.soHa ?? '?') });
  } else {
    rows.push({ label: 'Số seri',     value: `${calc.first4 || '????'} | ${calc.last4 || '????'}` });
    rows.push({ label: 'Số thượng',   value: `Tổng ${calc.first4 || '?'} = ${calc.soThuong ?? '?'}` });
    rows.push({ label: 'Số hạ',       value: `Tổng ${calc.last4 || '?'} = ${calc.soHa ?? '?'}` });
    rows.push({ label: 'Số hào',      value: String(calc.soHao ?? '?') });
  }

  rows.push({ label: 'Thượng quái',  value: `${upperTrigram?.nameVi} (số ${upperTrigramNumber})`, accent: 'var(--color-vermillion)' });
  rows.push({ label: 'Hạ quái',      value: `${lowerTrigram?.nameVi} (số ${lowerTrigramNumber})`, accent: 'var(--color-jade)'      });
  rows.push({ label: 'Hào động',     value: `Hào ${movingLine}`, accent: 'var(--color-vermillion)', bold: true });

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

  const subModeLabel = subMode === 'time' ? 'Ngày giờ động tâm' : 'Số seri tiền';

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
          🌸 MAI HOA — {subModeLabel.toUpperCase()}
        </span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
          Hào động: <strong style={{ color: 'var(--color-vermillion)' }}>{movingLine}</strong>
        </span>
      </div>

      {/* 3 quẻ ngang hàng */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Quẻ Chủ */}
        <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-vermillion)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Quẻ Chủ
          </div>
          <div style={{ width: 100 }}>
            <HexagramDisplay lines={primaryLines} size="md" />
          </div>
          <div style={{ textAlign: 'center', fontFamily: "'Noto Serif', serif", fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-ink)', lineHeight: 1.3 }}>
            {primaryHexagram?.nameVi || '—'}
          </div>
          {primaryHexagram && <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Quẻ số {primaryHexagram.id}</div>}
          {/* Thể/Dụng */}
          <TheDungOverlay upperTrigram={upperTrigram} lowerTrigram={lowerTrigram} theDung={theDung} />
        </div>

        <Arrow />

        {/* Quẻ Hỗ */}
        <HexCard
          label="Quẻ Hỗ"
          labelColor="#7c5cbf"
          hexagram={queHo?.hexagram}
          lines={queHo?.lines || []}
          subtitle={queHo ? `${queHo.upperTrigram?.nameVi} / ${queHo.lowerTrigram?.nameVi}` : ''}
        />

        <Arrow />

        {/* Quẻ Biến */}
        <HexCard
          label="Quẻ Biến"
          labelColor="var(--color-jade)"
          hexagram={changedHexagram}
          lines={changedLines}
        />
      </div>

      {/* Mô tả chi tiết cho Quẻ Chủ (đầy đủ 5 khía cạnh) */}
      <DescriptionPanel hexagram={primaryHexagram} color="var(--color-vermillion)" />

      <hr className="divider" />

      {/* Mô tả Quẻ Hỗ (nếu có) */}
      {queHo?.hexagram?.description && (
        <>
          <DescriptionPanel hexagram={queHo.hexagram} color="#7c5cbf" />
          <hr className="divider" style={{ opacity: 0.4 }} />
        </>
      )}

      {/* Mô tả Quẻ Biến (nếu có) */}
      {changedHexagram?.description && (
        <DescriptionPanel hexagram={changedHexagram} color="var(--color-jade)" />
      )}

      {/* Chi tiết tính toán */}
      <div>
        <div style={{
          fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          Chi tiết tính toán
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
        Hào {movingLine} là hào động — đánh dấu màu đỏ trên Quẻ Chủ
      </div>
    </div>
  );
}
