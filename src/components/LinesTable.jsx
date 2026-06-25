import React from 'react';

const TYPE_LABELS = {
  'lao-am':      'Lão Âm',
  'thieu-duong': 'Thiếu Dương',
  'thieu-am':    'Thiếu Âm',
  'lao-duong':   'Lão Dương',
};

const COIN_CHAR = { ngua: 'N', sap: 'S' };

/**
 * Bảng hiển thị chi tiết 6 hào từ H6 xuống H1
 */
export default function LinesTable({ lines }) {
  if (!lines || lines.length === 0) return null;

  const sorted = [...lines].sort((a, b) => b.index - a.index);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {['Hào', 'Vạch', 'Âm/Dương', 'Loại', 'Động', 'Đồng xu (Tổng)'].map(h => (
              <th key={h} style={{
                padding: '8px 10px',
                textAlign: 'left',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-muted)',
                borderBottom: '2px solid rgba(184,134,11,0.2)',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((line, idx) => (
            <tr key={line.index} style={{
              background: idx % 2 === 0 ? 'transparent' : 'rgba(184,134,11,0.04)',
              borderBottom: '1px solid rgba(184,134,11,0.1)',
            }}>
              {/* Hào */}
              <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--color-ink)' }}>
                H{line.index}
              </td>

              {/* Vạch mini */}
              <td style={{ padding: '10px 10px' }}>
                <MiniLine line={line} />
              </td>

              {/* Âm/Dương */}
              <td style={{ padding: '10px 10px' }}>
                <span className={`badge ${line.yinYang === 'yang' ? 'badge-yang' : 'badge-yin'}`}>
                  {line.yinYang === 'yang' ? 'Dương' : 'Âm'}
                </span>
              </td>

              {/* Loại */}
              <td style={{ padding: '10px 10px', whiteSpace: 'nowrap', color: 'var(--color-ink-muted)' }}>
                {TYPE_LABELS[line.type] || line.type}
              </td>

              {/* Động */}
              <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                {line.moving ? (
                  <span style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    background: 'var(--color-vermillion)',
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: '20px',
                    textAlign: 'center',
                  }}>✕</span>
                ) : (
                  <span style={{ color: 'var(--color-ink-muted)', fontSize: '1rem' }}>—</span>
                )}
              </td>

              {/* Đồng xu */}
              <td style={{ padding: '10px 10px' }}>
                {line.coins ? (
                  <span className="font-mono" style={{ fontSize: '0.8125rem', letterSpacing: '0.05em' }}>
                    {line.coins.map((c, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        marginRight: 3,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: c === 'ngua'
                          ? 'radial-gradient(circle at 35% 35%, #f5d78e, #b8860b)'
                          : 'radial-gradient(circle at 35% 35%, #aaa, #555)',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: '20px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}>
                        {COIN_CHAR[c]}
                      </span>
                    ))}
                    <span style={{ marginLeft: 4, color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>
                      ({line.total})
                    </span>
                  </span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniLine({ line }) {
  const h = 5;
  const color = line.moving ? 'var(--color-vermillion)' : 'var(--color-ink)';
  if (line.yinYang === 'yang') {
    return (
      <div style={{ height: h, background: color, borderRadius: 2, width: 50 }} />
    );
  }
  return (
    <div style={{ display: 'flex', gap: 6, width: 50 }}>
      <div style={{ flex: 1, height: h, background: color, borderRadius: 2 }} />
      <div style={{ flex: 1, height: h, background: color, borderRadius: 2 }} />
    </div>
  );
}
