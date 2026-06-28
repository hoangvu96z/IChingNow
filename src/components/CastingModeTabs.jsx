import React from 'react';

/**
 * Tab bar 2 nhóm:
 *   [LỤC HÀO] Gieo nhanh | Gieo từng hào
 *   [MAI HOA] Ngày giờ động tâm | Số seri tiền
 */
export default function CastingModeTabs({ mode, onChange }) {
  const groups = [
    {
      label: 'Lục Hào',
      tabs: [
        { value: 'quick',       label: '⚡ Gieo nhanh',    desc: '1 lần — 6 hào' },
        { value: 'manual-step', label: '🪙 Gieo từng hào', desc: '6 bước' },
      ],
    },
    {
      label: 'Mai Hoa',
      tabs: [
        { value: 'mai-hoa-time',   label: '🕐 Ngày giờ',    desc: 'Âm lịch' },
        { value: 'mai-hoa-serial', label: '💵 Số seri tiền', desc: '2–8 chữ số' },
      ],
    },
  ];

  const isMaiHoa = mode.startsWith('mai-hoa');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {groups.map((group, gi) => {
        const groupActive = gi === 0 ? !isMaiHoa : isMaiHoa;
        return (
          <div key={group.label}>
            {/* Group header */}
            <div style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: groupActive ? 'var(--color-gold)' : 'var(--color-ink-muted)',
              marginBottom: 4,
              paddingLeft: 4,
              transition: 'color 0.2s',
            }}>
              {group.label}
            </div>

            {/* Tabs */}
            <div className="tab-bar" style={{ opacity: groupActive ? 1 : 0.55, transition: 'opacity 0.2s' }}>
              {group.tabs.map(t => (
                <button
                  key={t.value}
                  className={`tab-item ${mode === t.value ? 'active' : ''}`}
                  onClick={() => onChange(t.value)}
                  title={t.desc}
                >
                  {t.label}
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 1 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
