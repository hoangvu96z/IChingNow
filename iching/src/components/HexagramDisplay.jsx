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
export default function HexagramDisplay({ lines = [], size = 'md', showIndex = false }) {
  // Construct 6 lines (from Hào 6 at top down to Hào 1 at bottom)
  const fullLines = [6, 5, 4, 3, 2, 1].map(index => {
    const existing = lines.find(l => l.index === index);
    return existing || { index, isPlaceholder: true };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: size === 'sm' ? 5 : size === 'lg' ? 10 : 7, padding: '6px 0' }}>
      {fullLines.map((line) => (
        line.isPlaceholder ? (
          <PlaceholderLine key={line.index} size={size} showIndex={showIndex} index={line.index} />
        ) : (
          <HexLine key={line.index} line={line} size={size} showIndex={showIndex} />
        )
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

function PlaceholderLine({ size = 'md', showIndex = false, index }) {
  const h = size === 'sm' ? 5 : size === 'lg' ? 10 : 7;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.35 }}>
      {showIndex && (
        <span style={{
          fontSize: 10, color: 'var(--color-ink-muted)',
          width: 14, textAlign: 'right', flexShrink: 0, fontWeight: 500,
        }}>
          {index}
        </span>
      )}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{
          height: h,
          background: 'rgba(184, 134, 11, 0.12)',
          border: '1px dashed rgba(184, 134, 11, 0.35)',
          borderRadius: 2,
          flex: 1,
        }} />
      </div>
    </div>
  );
}
