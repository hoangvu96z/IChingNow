import React, { useEffect } from 'react';
import { lookupTuViTerm } from '../data/tuViGlossary';

/**
 * TuViGlossaryModal — Bottom Sheet tra cứu nhanh (Tap-to-learn) cho Tử Vi
 * Nhận prop: term (string tên sao/cung/thuật ngữ), onClose (hàm đóng)
 */
export default function TuViGlossaryModal({ term, onClose }) {
  const info = term ? lookupTuViTerm(term) : null;

  useEffect(() => {
    if (!info) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [info, onClose]);

  if (!info) return null;

  // Lựa chọn màu sắc badge theo ngũ hành / loại sao
  const getElementColor = (elem) => {
    if (!elem) return '#b8860b';
    if (elem.includes('Kim')) return '#c2a649';
    if (elem.includes('Mộc')) return '#2e8b57';
    if (elem.includes('Thủy')) return '#2b78c5';
    if (elem.includes('Hỏa')) return '#d9483b';
    if (elem.includes('Thổ')) return '#a3704c';
    return '#b8860b';
  };

  const elemColor = getElementColor(info.element);

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(10, 8, 16, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
        animation: 'tuviFadeIn 0.2s ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={info.title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--color-bg-card, #1c182b)',
          color: 'var(--color-text, #f0e6d2)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 24px 32px',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(229, 193, 88, 0.2)',
          borderTop: '3px solid var(--color-gold, #e5c158)',
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'tuviSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Handle bar on mobile */}
        <div style={{
          width: 44,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.25)',
          margin: '-10px auto 16px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h3 style={{
                margin: 0,
                fontFamily: "'Noto Serif', serif",
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--color-gold, #e5c158)',
                letterSpacing: '0.02em',
              }}>
                {info.title}
                {info.han && (
                  <span style={{ fontSize: '1rem', marginLeft: 8, opacity: 0.7, fontWeight: 400 }}>
                    ({info.han})
                  </span>
                )}
              </h3>

              {info.type && (
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(229, 193, 88, 0.15)',
                  border: '1px solid rgba(229, 193, 88, 0.35)',
                  color: '#f3d98b',
                }}>
                  {info.type}
                </span>
              )}

              {info.element && (
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: `${elemColor}22`,
                  border: `1px solid ${elemColor}66`,
                  color: elemColor,
                }}>
                  {info.element}
                </span>
              )}
            </div>

            {info.constellation && (
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>
                {info.constellation}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-text-muted, #a0988d)',
              transition: 'all 0.2s',
            }}
          >
            ×
          </button>
        </div>

        {/* Trạng thái đắc hãm nếu có */}
        {info.statusLabel && (
          <div style={{
            margin: '0 0 14px',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: '0.85rem',
            background: info.statusCode === 'H' ? 'rgba(217, 72, 59, 0.15)' : 'rgba(46, 139, 87, 0.15)',
            border: `1px solid ${info.statusCode === 'H' ? 'rgba(217, 72, 59, 0.4)' : 'rgba(46, 139, 87, 0.4)'}`,
            color: info.statusCode === 'H' ? '#ff9e94' : '#a3e8b8',
            fontWeight: 600,
          }}>
            ⭐ {info.statusLabel}
          </div>
        )}

        {/* Tóm tắt súc tích */}
        <p style={{
          margin: '0 0 14px',
          fontSize: '0.975rem',
          fontWeight: 600,
          lineHeight: 1.5,
          color: 'var(--color-text, #f0e6d2)',
          borderLeft: '3px solid var(--color-gold, #e5c158)',
          paddingLeft: 12,
        }}>
          {info.short}
        </p>

        {/* Chi tiết luận giải */}
        <div style={{
          margin: '0 0 16px',
          fontSize: '0.9rem',
          lineHeight: 1.65,
          color: 'rgba(240, 230, 210, 0.88)',
        }}>
          {info.detail}
        </div>

        {/* Thông tin Miếu / Vượng vs Hãm địa nếu có */}
        {(info.mieuVuong || info.hamDia) && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            margin: '0 0 16px',
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.85rem',
            lineHeight: 1.55,
          }}>
            {info.mieuVuong && (
              <div>
                <strong style={{ color: '#68d391' }}>✨ Đắc/Miếu/Vượng:</strong>{' '}
                <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{info.mieuVuong}</span>
              </div>
            )}
            {info.hamDia && (
              <div>
                <strong style={{ color: '#fc8181' }}>⚠️ Hãm địa:</strong>{' '}
                <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{info.hamDia}</span>
              </div>
            )}
          </div>
        )}

        {/* Mẹo luận giải chiêm nghiệm */}
        {info.tip && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            fontSize: '0.85rem',
            lineHeight: 1.55,
            background: 'rgba(229, 193, 88, 0.1)',
            border: '1px solid rgba(229, 193, 88, 0.25)',
            color: '#f0e6d2',
          }}>
            💡 <strong style={{ color: 'var(--color-gold, #e5c158)' }}>Mẹo luận giải:</strong> {info.tip}
          </div>
        )}
      </div>

      <style>{`
        @keyframes tuviFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tuviSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
