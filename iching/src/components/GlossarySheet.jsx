import React, { useEffect } from 'react';
import { GLOSSARY, getGlossary } from '../data/glossary.js';

/**
 * Bottom sheet giải nghĩa thuật ngữ (tap-to-learn).
 * Props: termKey (khóa trong GLOSSARY hoặc null), onClose
 */
export default function GlossarySheet({ termKey, onClose }) {
  const item = termKey ? (GLOSSARY[termKey] || getGlossary(termKey)) : null;

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(20,14,6,0.45)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        onClick={(e) => e.stopPropagation()}
        className="animate-in"
        style={{
          width: '100%', maxWidth: 560, background: 'var(--color-paper, #fffaf0)',
          borderRadius: '18px 18px 0 0', padding: '20px 22px 28px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
          borderTop: '3px solid var(--color-gold, #b8860b)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontFamily: "'Noto Serif', serif", fontSize: '1.15rem', color: 'var(--color-vermillion)' }}>
            📖 {item.title}
          </h3>
          <button
            type="button"
            id="glossary-close"
            onClick={onClose}
            aria-label="Đóng"
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
          >
            ×
          </button>
        </div>
        <p style={{ margin: '0 0 10px', fontWeight: 700 }}>{item.short}</p>
        <p style={{ margin: '0 0 12px', lineHeight: 1.6, color: 'var(--color-ink)' }}>{item.detail}</p>
        {item.tip && (
          <div style={{
            padding: '10px 12px', borderRadius: 8, fontSize: '0.875rem',
            background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.25)',
          }}>
            💡 <strong>Mẹo:</strong> {item.tip}
          </div>
        )}
      </div>
    </div>
  );
}
