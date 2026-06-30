import React from 'react';

export default function HistoryList({ history, onSelect, onClear, currentActiveData }) {
  if (!history || history.length === 0) {
    return (
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>
          📜 Lịch sử gieo quẻ
        </div>
        <div style={{
          textAlign: 'center',
          padding: '20px 10px',
          color: 'var(--color-ink-muted)',
          fontSize: '0.85rem',
          fontStyle: 'italic',
        }}>
          Chưa có quẻ nào được lưu
        </div>
      </section>
    );
  }

  // Format date dd/mm HH:MM
  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const isCurrentActive = (item) => {
    if (!currentActiveData) return false;
    return currentActiveData.createdAt === item.data.createdAt;
  };

  return (
    <section className="card animate-in" style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <div className="section-title" style={{ margin: 0 }}>
          📜 Lịch sử gieo quẻ
        </div>
        <button
          onClick={onClear}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-vermillion)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(192, 57, 43, 0.08)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          Xóa tất cả
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxHeight: 320,
        overflowY: 'auto',
        paddingRight: 4,
      }}>
        {history.map((item) => {
          const active = isCurrentActive(item);
          const isLucHao = item.type === 'luc-hao';
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 8,
                border: active
                  ? '1px solid var(--color-gold)'
                  : '1px solid rgba(184, 134, 11, 0.15)',
                background: active
                  ? 'rgba(184, 134, 11, 0.08)'
                  : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(184, 134, 11, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.15)';
                }
              }}
            >
              {/* Top row: Type badge, time */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: isLucHao ? 'var(--color-vermillion)' : 'var(--color-jade)',
                  background: isLucHao ? 'rgba(192, 57, 43, 0.08)' : 'rgba(26, 107, 74, 0.08)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {isLucHao ? '🪙 Lục Hào' : '🌸 Mai Hoa'}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-ink-muted)',
                  fontFamily: 'monospace',
                }}>
                  {formatTime(item.timestamp)}
                </span>
              </div>

              {/* Middle row: Hexagram title */}
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-ink)',
                fontFamily: "'Noto Serif', serif",
              }}>
                {item.title}
              </div>

              {/* Bottom row: Truncated question */}
              {item.question && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-ink-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}>
                  {item.question}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
