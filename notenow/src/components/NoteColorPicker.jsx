import React from 'react';
import { NOTE_COLORS, NOTE_PATTERNS } from '../constants.js';

export default function NoteColorPicker({ bgColor, bgPattern, onChange }) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  return (
    <div className="nn-color-picker">
      <p className="nn-color-picker-label">Màu nền</p>
      <div className="nn-colors" role="group" aria-label="Chọn màu nền">
        {NOTE_COLORS.map((c) => (
          <button
            key={c.key}
            className={`nn-color-swatch${bgColor === c.key ? ' active' : ''}`}
            style={{
              background: isDark ? c.dark : c.light,
              borderColor: isDark ? c.darkBorder : c.lightBorder,
            }}
            title={c.label}
            aria-label={c.label}
            aria-pressed={bgColor === c.key}
            onClick={() => onChange({ bgColor: c.key })}
            type="button"
          >
            {c.key === 'default' && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ pointerEvents: 'none' }}>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <p className="nn-color-picker-label nn-pattern-label">Hoa văn</p>
      <div className="nn-patterns" role="group" aria-label="Chọn hoa văn">
        {NOTE_PATTERNS.map((p) => (
          <button
            key={p.key}
            className={`nn-pattern-btn${bgPattern === p.key ? ' active' : ''}`}
            title={p.label}
            aria-pressed={bgPattern === p.key}
            onClick={() => onChange({ bgPattern: p.key })}
            type="button"
          >
            <span aria-hidden="true">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
