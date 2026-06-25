import React from 'react';

/**
 * Bảng Lục Hào chính — render cả quẻ chủ và quẻ biến song song
 * Layout giống ảnh tham chiếu (simkinhdich.com)
 */
export default function LucHaoTable({ result }) {
  if (!result || !result.lines || result.lines.length < 6) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        Chưa có dữ liệu quẻ
      </div>
    );
  }

  const hasChanged = result.movingLines?.length > 0 && result.changedLines;
  // Hào từ H6 xuống H1
  const sortedPrimary = [...result.lines].sort((a, b) => b.index - a.index);
  const sortedChanged = hasChanged
    ? [...result.changedLines].sort((a, b) => b.index - a.index)
    : [];

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Tên quẻ */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '2px solid rgba(184,134,11,0.25)' }}>
        <HexNameHeader
          hexagram={result.primaryHexagram}
          palace={result.palaceName}
          queType={result.queType}
          theHao={result.theHao}
          flex={hasChanged ? 1 : undefined}
        />
        {hasChanged && (
          <>
            <div style={{ width: 1, background: 'rgba(184,134,11,0.2)' }} />
            <HexNameHeader
              hexagram={result.changedHexagram}
              palace={result.changedLines ? findPalaceLabel(result.changedLines, result) : ''}
              isChanged
              theHao={result.changedLines ? findTheHao(result.changedLines) : 6}
              flex={1}
            />
          </>
        )}
      </div>

      {/* Bảng hào chính */}
      <div style={{ display: 'flex', gap: 1 }}>
        {/* Quẻ chủ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <HaoTableSection
            lines={sortedPrimary}
            khongVong={result.khongVong || []}
            showLucThu={false}
            accentColor="var(--color-vermillion)"
            label="Quẻ Chủ"
          />
        </div>

        {hasChanged && (
          <>
            <div style={{ width: 1, background: 'rgba(184,134,11,0.15)', flexShrink: 0 }} />
            {/* Quẻ biến */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <HaoTableSection
                lines={sortedChanged}
                khongVong={result.khongVong || []}
                showLucThu={true}
                accentColor="var(--color-jade)"
                label="Quẻ Biến"
              />
            </div>
          </>
        )}
      </div>

      {/* Thông tin Thế/Ứng và Không Vong */}
      <InfoFooter result={result} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function HexNameHeader({ hexagram, palace, queType, isChanged, theHao, flex }) {
  const queTypeLabel = QUE_TYPE_LABELS[queType] || '';
  return (
    <div style={{
      flex: flex || 1,
      textAlign: 'center',
      padding: '10px 8px 8px',
      background: isChanged
        ? 'rgba(26,107,74,0.06)'
        : 'rgba(192,57,43,0.06)',
    }}>
      <div style={{
        fontFamily: "'Noto Serif', serif",
        fontSize: '1rem',
        fontWeight: 800,
        color: isChanged ? 'var(--color-jade)' : 'var(--color-vermillion)',
        letterSpacing: '0.04em',
        marginBottom: 2,
      }}>
        {hexagram ? hexagram.nameVi.toUpperCase() : '—'}
      </div>
      {palace && (
        <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginBottom: 2 }}>
          {queTypeLabel ? `${palace} (${queTypeLabel})` : palace}
        </div>
      )}
    </div>
  );
}

function HaoTableSection({ lines, khongVong, showLucThu, accentColor }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', tableLayout: 'fixed' }}>
      <thead>
        <tr style={{ borderBottom: '1.5px solid rgba(184,134,11,0.25)' }}>
          {['Vạch', 'T/Ứ', 'Lục Thân', 'Can Chi', 'P.Thần', 'T.K'].map(h => (
            <Th key={h}>{h}</Th>
          ))}
          {showLucThu && <Th>Lục Thú</Th>}
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => {
          const isKV = khongVong.includes(line.chi);
          const isMoving = line.moving;
          return (
            <tr key={line.index} style={{
              borderBottom: '1px solid rgba(184,134,11,0.09)',
              background: idx % 2 === 0 ? 'transparent' : 'rgba(184,134,11,0.03)',
            }}>
              {/* Vạch */}
              <Td>
                <YaoMiniLine line={line} accent={isMoving ? accentColor : 'var(--color-ink)'} />
              </Td>

              {/* Thế/Ứng */}
              <Td center>
                {line.theUng && (
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: line.isThe ? 'var(--color-vermillion)' : 'var(--color-jade)',
                    background: line.isThe ? 'rgba(192,57,43,0.1)' : 'rgba(26,107,74,0.1)',
                    padding: '1px 5px',
                    borderRadius: 4,
                  }}>
                    {line.theUng}
                  </span>
                )}
              </Td>

              {/* Lục Thân */}
              <Td>
                <span style={{
                  color: isMoving ? accentColor : 'var(--color-ink)',
                  fontWeight: isMoving ? 700 : 500,
                }}>
                  {line.lucThan || '—'}
                </span>
              </Td>

              {/* Can Chi + Ngũ Hành */}
              <Td>
                <span style={{ color: isKV ? 'var(--color-ink-muted)' : 'var(--color-ink)' }}>
                  {line.chi && line.nguHanhHao
                    ? `${line.chi}-${line.nguHanhHao}`
                    : '—'
                  }
                </span>
                {line.can && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)', marginTop: 1 }}>
                    {line.can}
                  </div>
                )}
              </Td>

              {/* Phục Thần */}
              <Td>
                {line.phucThan && (
                  <div style={{ fontSize: '0.75rem' }}>
                    <div style={{ color: '#7b6f3a', fontWeight: 600 }}>{line.phucThan.lucThan}</div>
                    <div style={{ color: 'var(--color-ink-muted)' }}>{line.phucThan.chi}-{line.phucThan.nguHanh}</div>
                  </div>
                )}
              </Td>

              {/* Tuần Không */}
              <Td center>
                {isKV && (
                  <span style={{
                    color: '#7b6f3a',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid #b8860b55',
                    borderRadius: 3,
                    padding: '1px 4px',
                  }}>
                    K
                  </span>
                )}
              </Td>

              {/* Lục Thú (chỉ quẻ biến) */}
              {showLucThu && (
                <Td>
                  <span style={{ fontSize: '0.75rem', color: getLucThuColor(line.lucThu) }}>
                    {line.lucThu || '—'}
                  </span>
                </Td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function InfoFooter({ result }) {
  return (
    <div style={{
      marginTop: 10,
      padding: '8px 10px',
      background: 'rgba(184,134,11,0.05)',
      borderRadius: 6,
      border: '1px solid rgba(184,134,11,0.15)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px 20px',
      fontSize: '0.8125rem',
    }}>
      <InfoItem label="Cung" value={`${result.palaceName} (${result.palaceElement})`} />
      <InfoItem label="Loại quẻ" value={QUE_TYPE_LABELS[result.queType] || result.queType} />
      <InfoItem label="Thế H" value={result.theHao} />
      <InfoItem label="Ứng H" value={result.ungHao} />
      {result.khongVong?.length > 0 && (
        <InfoItem label="Tuần Không" value={result.khongVong.join(', ')} color="#7b6f3a" />
      )}
      {result.canChi && (
        <InfoItem label="Can Ngày" value={`${result.canChi.ngayCan} ${result.canChi.ngayChi}`} />
      )}
    </div>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────

function Th({ children }) {
  return (
    <th style={{
      padding: '6px 6px',
      textAlign: 'left',
      fontSize: '0.6875rem',
      fontWeight: 700,
      color: 'var(--color-ink-muted)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children, center }) {
  return (
    <td style={{
      padding: '7px 6px',
      verticalAlign: 'middle',
      textAlign: center ? 'center' : 'left',
    }}>
      {children}
    </td>
  );
}

function YaoMiniLine({ line, accent }) {
  const h  = 5;
  const bg = accent || 'var(--color-ink)';
  if (line.yinYang === 'yang') {
    return <div style={{ height: h, width: 44, background: bg, borderRadius: 2 }} />;
  }
  return (
    <div style={{ display: 'flex', gap: 6, width: 44 }}>
      <div style={{ flex: 1, height: h, background: bg, borderRadius: 2 }} />
      <div style={{ flex: 1, height: h, background: bg, borderRadius: 2 }} />
    </div>
  );
}

function InfoItem({ label, value, color }) {
  return (
    <span>
      <span style={{ color: 'var(--color-ink-muted)', marginRight: 3 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: color || 'var(--color-ink)' }}>{value}</span>
    </span>
  );
}

// ── Utilities ──────────────────────────────────────────────────────────────

const QUE_TYPE_LABELS = {
  'bat-thuan': 'Bát Thuần',
  'nhat-the':  'Nhất Thế',
  'nhi-the':   'Nhị Thế',
  'tam-the':   'Tam Thế',
  'tu-the':    'Tứ Thế',
  'ngu-the':   'Ngũ Thế',
  'du-hon':    'Du Hồn',
  'quy-hon':   'Quy Hồn',
};

const LUC_THU_COLORS = {
  'Thanh Long': '#1a6b4a',
  'Chu Tước':   '#c0392b',
  'Câu Trận':   '#8B6914',
  'Đằng Xà':    '#6A0DAD',
  'Bạch Hổ':    '#555',
  'Huyền Vũ':   '#1a4a6b',
};

function getLucThuColor(name) {
  return LUC_THU_COLORS[name] || 'var(--color-ink-muted)';
}

function findTheHao(lines) {
  // For changed hexagram: just return 6 as default or check palace
  return lines?.[0]?.index || 6;
}

function findPalaceLabel(changedLines, result) {
  return result.changedHexagram ? '' : '';
}
