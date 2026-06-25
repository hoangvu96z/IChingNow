import React from 'react';

/**
 * Tab bar chuyển mode: Gieo nhanh | Gieo từng hào
 */
export default function CastingModeTabs({ mode, onChange }) {
  const tabs = [
    { value: 'quick',       label: '⚡ Gieo nhanh', desc: '1 lần — 6 hào' },
    { value: 'manual-step', label: '🪙 Gieo từng hào', desc: '6 bước' },
  ];

  return (
    <div>
      <div className="tab-bar">
        {tabs.map(t => (
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
}
