import { useEvidence } from '../context/evidenceState';
import React from 'react';
import HexagramDisplay from './HexagramDisplay.jsx';
import { useLanguage } from '../context/useLanguage.js';

/**
 * Card hiển thị quẻ chủ + quẻ hỗ + quẻ biến cạnh nhau
 */
export default function HexagramPreview({ result }) {
  const { t } = useLanguage();
  const hasPrimary  = result?.primaryHexagram;
  const hasQueHo    = result?.queHo?.hexagram;
  const hasChanged  = result?.changedHexagram;
  const hasMoving   = result?.movingLines?.length > 0;

  return (
    <div className="responsive-hexagrams-container" style={{ gap: 16 }}>
      {/* Quẻ chủ */}
      <HexCard
        evidenceId="hex.primary"
        label={t('result.primary_hex', 'QUẺ CHỦ')}
        hexagram={hasPrimary}
        lines={result?.lines}
        palaceName={result?.palaceName}
        trait={result?.primaryTrait}
        accent="var(--color-vermillion)"
        isEmpty={!hasPrimary}
      />

      {/* Quẻ Hỗ (nằm giữa như chuẩn Học Viện Phong Thủy Minh Việt) */}
      {hasQueHo && (
        <>
          <div className="arrow-desktop" style={{ paddingTop: 40, fontSize: '1.25rem', color: 'var(--color-ink-muted)' }}>·</div>
          <div className="arrow-mobile" style={{ fontSize: '1.25rem', color: 'var(--color-ink-muted)' }}>↓</div>
          <HexCard
            evidenceId="hex.nuclear"
            label={t('result.nuclear_hex', 'QUẺ HỖ')}
            hexagram={hasQueHo}
            lines={result.queHo.lines}
            palaceName={result.queHo.palaceName}
            trait={result.queHo.trait}
            accent="var(--color-gold, #b8860b)"
            isEmpty={false}
          />
        </>
      )}

      {/* Mũi tên biến */}
      {hasMoving && (
        <>
          <div className="arrow-desktop" style={{ paddingTop: 40, fontSize: '1.5rem' }}>→</div>
          <div className="arrow-mobile" style={{ fontSize: '1.5rem' }}>↓</div>
        </>
      )}

      {/* Quẻ biến */}
      {hasMoving && (
        <HexCard
          evidenceId="hex.changed"
          label={t('result.changed_hex', 'QUẺ BIẾN')}
          hexagram={hasChanged}
          lines={result?.lines ? buildChangedLines(result.lines) : []}
          palaceName={result?.changedPalaceName}
          trait={result?.changedTrait}
          accent="var(--color-jade)"
          isEmpty={!hasChanged}
        />
      )}
    </div>
  );
}

function HexCard({ evidenceId, label, hexagram, lines, palaceName, trait, accent, isEmpty }) {
  const { t, language } = useLanguage();
  const evidence = useEvidence();
  const hexName = hexagram 
    ? (language === 'en' ? t(`hex.name.${hexagram.id}`, hexagram.nameVi) : hexagram.nameVi)
    : '—';

  const palaceTrans = palaceName ? t(`trigram.${palaceName}`, palaceName) : '';
  const traitLabel = trait?.code ? (language === 'en' ? trait.labelEn : trait.labelVi) : '';
  const familyText = palaceTrans
    ? (language === 'en'
        ? `${palaceTrans} Palace${traitLabel ? ` (${traitLabel})` : ''}`
        : `HỌ ${palaceTrans.toUpperCase()}${traitLabel ? ` (${traitLabel.toUpperCase()})` : ''}`)
    : '';

  return (
    <div {...evidence?.targetProps(evidenceId)} style={{
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
          {t('result.no_data', 'Chưa có')}
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
        {hexName}
      </div>

      {familyText && (
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--color-ink-muted)',
          textAlign: 'center',
          letterSpacing: '0.03em',
        }}>
          {familyText}
        </div>
      )}

      {hexagram && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
          {t('result.hex_number', 'Quẻ số')} {hexagram.id}
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
