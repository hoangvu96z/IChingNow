import React from 'react';

/**
 * Hiển thị 6 vạch âm/dương của một quẻ
 * lines: mảng từ hào 1 đến hào 6 (index 1=dưới, 6=trên)
 * Render từ trên xuống (hào 6 hiển thị ở trên cùng)
 *
 * Quy tắc hiển thị hào động:
 *   - Hào Dương động (moving yang): vạch liền ĐỎ + vòng tròn ● trắng ở giữa
 *   - Hào Âm động (moving yin)  : 2 vạch KHÔNG đổi màu + vòng tròn ● đỏ ở khe giữa
 *   → Luôn phân biệt rõ Dương (liền) và Âm (đứt), chỉ dấu ● báo hào động
 */
export default function HexagramDisplay({ lines, size = 'md', showIndex = false }) {
  if (!lines || lines.length < 6) {
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
  const h       = size === 'sm' ? 5 : size === 'lg' ? 10 : 7;
  const gap     = size === 'sm' ? 10 : 14;
  const dotSize = h + 6; // đường kính vòng tròn hào động

  // Thanh vạch — KHÔNG đổi màu khi động (màu do yin/yang, không do moving)
  const barStyle = {
    height:     h,
    background: 'var(--color-ink)',
    borderRadius: 2,
    flex: 1,
    transition: 'background 0.3s',
  };

  // Vòng tròn ● báo hào động
  const dotStyle = {
    width:        dotSize,
    height:       dotSize,
    background:   '#c0392b',
    border:       '2px solid white',
    borderRadius: '50%',
    flexShrink:   0,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {showIndex && (
        <span style={{
          fontSize: 10, color: 'var(--color-ink-muted)',
          width: 14, textAlign: 'right', flexShrink: 0,
        }}>
          {line.index}
        </span>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {line.yinYang === 'yang' ? (
          /* ── Hào Dương: vạch liền ── */
          <div style={{
            ...barStyle,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Nếu động: tô đỏ vạch Dương để dễ nhận biết
            background: line.moving ? '#c0392b' : 'var(--color-ink)',
          }}>
            {line.moving && <div style={dotStyle} />}
          </div>
        ) : (
          /* ── Hào Âm: hai vạch đứt + ● ở khe giữa nếu động ── */
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: line.moving ? 6 : gap, // thu hẹp gap khi có dot để dot vừa vặn
          }}>
            <div style={barStyle} />
            {line.moving && <div style={dotStyle} />}
            <div style={barStyle} />
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
