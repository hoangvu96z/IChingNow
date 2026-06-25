import React from 'react';

/**
 * Hiển thị metadata của lần lập quẻ
 */
export default function ResultMetadata({ result }) {
  if (!result) return null;

  const createdAt = result.createdAt ? new Date(result.createdAt) : null;

  const rows = [
    { label: 'Việc cần xem',   value: result.question || '—' },
    { label: 'Người lập',      value: result.caster   || '—', hide: !result.caster },
    { label: 'Ngày lập quẻ',   value: createdAt ? formatDateTime(createdAt) : '—' },
    { label: 'Ngày động tâm',  value: result.movingMindDate || '—' },
    { label: 'Giờ động tâm',   value: result.movingMindTime?.enabled ? result.movingMindTime.hourBranch : '—' },
    { label: 'Tiết khí',       value: result.useSolarTerm && result.solarTerm ? result.solarTerm.nameVi : '—' },
    { label: 'Phương pháp',    value: getModeLabel(result.mode) },
    { label: 'Hào động',       value: result.movingLines?.length > 0 ? `Hào ${result.movingLines.join(', ')}` : 'Không có hào động' },
  ].filter(r => !r.hide);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{
          display: 'flex',
          gap: 12,
          padding: '6px 0',
          borderBottom: '1px solid rgba(184,134,11,0.1)',
          alignItems: 'flex-start',
        }}>
          <span style={{
            minWidth: 120,
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            flexShrink: 0,
          }}>
            {label}
          </span>
          <span style={{
            fontSize: '0.9rem',
            color: 'var(--color-ink)',
            fontFamily: "'Noto Serif', serif",
          }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(d) {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function getModeLabel(mode) {
  return mode === 'quick' ? 'Gieo nhanh 1 lần' : 'Gieo từng hào (6 bước)';
}
