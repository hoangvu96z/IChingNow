import React from 'react';
import HexagramDisplay from './HexagramDisplay.jsx';

/**
 * Card hiển thị quẻ chủ + quẻ biến cạnh nhau
 */
export default function HexagramPreview({ result }) {
  const hasPrimary  = result?.primaryHexagram;
  const hasChanged  = result?.changedHexagram;
  const hasMoving   = result?.movingLines?.length > 0;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Quẻ chủ */}
      <HexCard
        label="QUẺ CHỦ"
        hexagram={hasPrimary}
        lines={result?.lines}
        accent="var(--color-vermillion)"
        isEmpty={!hasPrimary}
      />

      {/* Mũi tên biến */}
      {hasMoving && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 40,
          color: 'var(--color-gold)',
          fontSize: '1.5rem',
        }}>
          →
        </div>
      )}

      {/* Quẻ biến */}
      {hasMoving && (
        <HexCard
          label="QUẺ BIẾN"
          hexagram={hasChanged}
          lines={result?.lines ? buildChangedLines(result.lines) : []}
          accent="var(--color-jade)"
          isEmpty={!hasChanged}
        />
      )}
    </div>
  );
}

function HexCard({ label, hexagram, lines, accent, isEmpty }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 130,
      maxWidth: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        color: accent,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        {label}
      </div>

      {isEmpty ? (
        <div style={{
          width: 100,
          height: 80,
          borderRadius: 8,
          background: 'rgba(44,24,16,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink-muted)',
          fontSize: '0.75rem',
        }}>
          Chưa có
        </div>
      ) : (
        <div style={{ width: 100 }}>
          <HexagramDisplay lines={lines} size="md" />
        </div>
      )}

      <div style={{
        textAlign: 'center',
        fontFamily: "'Noto Serif', serif",
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: isEmpty ? 'var(--color-ink-muted)' : 'var(--color-ink)',
        lineHeight: 1.3,
      }}>
        {hexagram ? hexagram.nameVi : '—'}
      </div>

      {hexagram && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
          Quẻ số {hexagram.id}
        </div>
      )}
    </div>
  );
}

function buildChangedLines(lines) {
  return lines.map(l => ({
    ...l,
    yinYang: l.moving ? (l.yinYang === 'yang' ? 'yin' : 'yang') : l.yinYang,
    moving: false,
  }));
}
