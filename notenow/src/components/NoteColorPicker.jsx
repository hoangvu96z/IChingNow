import React from 'react';
import { NOTE_COLORS, NOTE_PATTERNS } from '../constants.js';
import { Ban, MoreHorizontal, Grid3X3, AlignJustify } from 'lucide-react';

const PATTERN_ICONS = {
  none: <Ban size={12} strokeWidth={2} />,
  dots: <MoreHorizontal size={12} strokeWidth={2} />,
  grid: <Grid3X3 size={12} strokeWidth={2} />,
  lines: <AlignJustify size={12} strokeWidth={2} />,
};

export default function NoteColorPicker({ bgColor, bgPattern, onChange }) {
  const isDark = typeof document !== 'undefined' && document.documentElement
    ? document.documentElement.getAttribute('data-theme') !== 'light'
    : false;

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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {PATTERN_ICONS[p.key] || p.icon}
            </span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
