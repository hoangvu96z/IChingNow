import React from 'react';

/**
 * Hiển thị 6 vạch âm/dương của một quẻ
 * lines: mảng từ hào 1 đến hào 6 (index 1=dưới, 6=trên)
 * Render từ trên xuống (hào 6 hiển thị ở trên cùng)
 */
export default function HexagramDisplay({ lines, size = 'md', showIndex = false }) {
  if (!lines || lines.length < 6) {
    // Placeholder khi chưa có quẻ
    return (
      <div className={`hexagram-display ${size}`} style={{ padding: '12px 0' }}>
        {[...Array(6)].map((_, i) => (
          <PlaceholderLine key={i} />
        ))}
      </div>
    );
  }

  const sorted = [...lines].sort((a, b) => b.index - a.index); // hào 6 trên cùng

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: size === 'sm' ? 4 : 6, padding: '8px 0' }}>
      {sorted.map((line) => (
        <HexLine key={line.index} line={line} size={size} showIndex={showIndex} />
      ))}
    </div>
  );
}

function HexLine({ line, size, showIndex }) {
  const h = size === 'sm' ? 5 : size === 'lg' ? 10 : 7;
  const gap = size === 'sm' ? 10 : 14;

  const lineStyle = {
    height: h,
    background: line.moving ? '#c0392b' : 'var(--color-ink)',
    borderRadius: 2,
    flex: 1,
    transition: 'background 0.3s',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {showIndex && (
        <span style={{ fontSize: 10, color: 'var(--color-ink-muted)', width: 14, textAlign: 'right', flexShrink: 0 }}>
          {line.index}
        </span>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
        {line.yinYang === 'yang' ? (
          // Dương: vạch liền
          <div style={{ ...lineStyle, flex: 1, position: 'relative' }}>
            {line.moving && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: h + 8,
                height: h + 8,
                background: '#c0392b',
                border: '2px solid white',
                borderRadius: '50%',
                zIndex: 2,
              }} />
            )}
          </div>
        ) : (
          // Âm: hai vạch gián
          <div style={{ flex: 1, display: 'flex', gap: gap }}>
            <div style={lineStyle} />
            <div style={lineStyle} />
            {line.moving && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 10,
                color: '#c0392b',
                fontWeight: 'bold',
                lineHeight: 1,
              }}>✕</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderLine() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', opacity: 0.2 }}>
      <div style={{ height: 7, background: 'var(--color-ink)', borderRadius: 2, flex: 1 }} />
    </div>
  );
}
