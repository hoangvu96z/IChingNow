import React from 'react';

// ─── Hexagram Display (Chuẩn mực Kinh Dịch, tinh tế, sang trọng) ───
export function HexLines({ lines, size = 'md' }) {
  if (!lines || lines.length === 0) return null;

  // Lấy 6 hào từ Thượng Hào (Hào 6 - trên cùng) xuống Sơ Hào (Hào 1 - dưới cùng)
  const fullLines = [6, 5, 4, 3, 2, 1].map(index => {
    if (Array.isArray(lines)) {
      const byIndex = lines.find(l => (typeof l === 'object' && l.index === index));
      if (byIndex) return byIndex;
      const byPos = lines[index - 1];
      if (byPos !== undefined) {
        if (typeof byPos === 'object') return { ...byPos, index };
        return { index, value: byPos, yinYang: (byPos === 7 || byPos === 9) ? 'yang' : 'yin', moving: (byPos === 6 || byPos === 9) };
      }
    }
    return { index, yinYang: 'yang', moving: false };
  });

  const isLg = size === 'lg';
  const isSm = size === 'sm';
  const totalW = isLg ? 104 : (isSm ? 58 : 80);
  const barH = isLg ? 8 : (isSm ? 5 : 7);
  const gap = isLg ? 16 : (isSm ? 10 : 12);
  const halfW = (totalW - gap) / 2;
  const dotSize = barH + 4;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isLg ? '8px' : (isSm ? '5px' : '6px'),
      alignItems: 'center',
      padding: isLg ? '14px 18px' : (isSm ? '8px 10px' : '10px 14px'),
      background: 'radial-gradient(ellipse at center, rgba(32, 24, 50, 0.75) 0%, rgba(14, 10, 24, 0.95) 100%)',
      borderRadius: '14px',
      border: '1px solid rgba(229,193,88,0.22)',
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.3)',
    }}>
      {fullLines.map((line) => {
        const isYang = line.yinYang === 'yang' || line.value === 7 || line.value === 9;
        const isMoving = !!line.moving;

        // Vạch vàng hoàng kim sơn mài cổ điển, nếu động thì ánh chu sa trầm ấm (không chói loá)
        const barBackground = isMoving
          ? 'linear-gradient(180deg, #d94a38 0%, #a82e20 100%)'
          : 'linear-gradient(180deg, #f5d77f 0%, #c99a32 100%)';
        const barBorder = isMoving
          ? '1px solid rgba(239, 68, 68, 0.5)'
          : '1px solid rgba(255, 235, 150, 0.35)';
        const barShadow = isMoving
          ? '0 0 8px rgba(217, 74, 56, 0.5)'
          : '0 1px 3px rgba(0,0,0,0.4)';

        return (
          <div
            key={line.index}
            style={{
              width: `${totalW}px`,
              height: `${barH}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {isYang ? (
              /* ── Hào Dương: một thanh liền nguyên vẹn ── */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: barBackground,
                  border: barBorder,
                  borderRadius: '3px',
                  boxShadow: barShadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                {isMoving && (
                  <div
                    style={{
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      background: '#fff',
                      border: '2px solid #a82e20',
                      borderRadius: '50%',
                      boxShadow: '0 0 4px rgba(0,0,0,0.4)',
                    }}
                    title="Hào Dương động (Thái Dương biến thành Thiếu Âm)"
                  />
                )}
              </div>
            ) : (
              /* ── Hào Âm: hai thanh cân đối tuyệt đối với khe giữa ── */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${halfW}px`,
                    height: '100%',
                    background: barBackground,
                    border: barBorder,
                    borderRadius: '3px',
                    boxShadow: barShadow,
                  }}
                />
                {isMoving && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      background: '#d94a38',
                      border: '2px solid #fff',
                      borderRadius: '50%',
                      boxShadow: '0 0 5px rgba(217, 74, 56, 0.6)',
                      zIndex: 2,
                    }}
                    title="Hào Âm động (Thái Âm biến thành Thiếu Dương)"
                  />
                )}
                <div
                  style={{
                    width: `${halfW}px`,
                    height: '100%',
                    background: barBackground,
                    border: barBorder,
                    borderRadius: '3px',
                    boxShadow: barShadow,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function resolveChangedLines(hexResult) {
  if (!hexResult) return [];
  const src = (hexResult.changedLines && hexResult.changedLines.length === 6)
    ? hexResult.changedLines
    : hexResult.lines;
  if (!src) return [];
  return src.map(line => {
    if (typeof line === 'object') {
      const wasMoving = !!line.moving;
      return {
        ...line,
        yinYang: (src === hexResult.lines && wasMoving)
          ? (line.yinYang === 'yang' ? 'yin' : 'yang')
          : line.yinYang,
        moving: false, // Quẻ biến tuyệt đối KHÔNG có hào động
      };
    }
    if (line === 6) return 7;
    if (line === 9) return 8;
    return line;
  });
}
