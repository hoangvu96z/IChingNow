import React, { useState } from 'react';

/**
 * SpreadLayoutVisualizer
 * Renders drawn cards in their iconic positional layout
 * Supported layouts: celtic-cross, horseshoe, cross-5, row, yes-no
 */

function CardSlot({ card, position, positionLabel, index, onCardClick, baseUrl, revealDelay = 0, isCrossed = false }) {
  const [revealed, setRevealed] = useState(false);

  React.useEffect(() => {
    if (card) {
      const t = setTimeout(() => setRevealed(true), revealDelay + 100);
      return () => clearTimeout(t);
    }
    setRevealed(false);
  }, [card, revealDelay]);

  const isReversed = card?.orientation === 'reversed';

  return (
    <div
      className="spread-card-slot"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: card ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={() => card && onCardClick && onCardClick(card)}
    >
      {/* Position number badge */}
      <div style={{
        position: 'absolute',
        top: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: card ? 'rgba(229,193,88,0.9)' : 'rgba(255,255,255,0.12)',
        color: card ? '#1a1430' : 'rgba(255,255,255,0.4)',
        fontSize: '10px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        boxShadow: card ? '0 2px 8px rgba(229,193,88,0.4)' : 'none',
      }}>
        {index + 1}
      </div>

      {/* Card visual */}
      <div style={{
        width: isCrossed ? '44px' : '52px',
        height: isCrossed ? '52px' : '80px',
        borderRadius: '6px',
        border: card
          ? `1px solid rgba(229,193,88,${revealed ? '0.5' : '0.15'})`
          : '1px dashed rgba(255,255,255,0.12)',
        background: card ? 'transparent' : 'rgba(255,255,255,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'all 0.4s ease',
        transform: isCrossed
          ? `rotate(90deg)${isReversed ? ' rotate(180deg)' : ''}`
          : isReversed
          ? 'rotate(180deg)'
          : 'none',
        boxShadow: card && revealed ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(229,193,88,0.15)' : 'none',
        opacity: revealed ? 1 : 0,
        animation: revealed ? 'cardReveal 0.4s ease forwards' : 'none',
        marginTop: '8px',
      }}>
        {card ? (
          <img
            src={baseUrl + card.image.replace(/^\//, '')}
            alt={card.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <span style={{ fontSize: '18px', opacity: 0.3 }}>🃏</span>
        )}
      </div>

      {/* Position label */}
      <div style={{
        fontSize: '9px',
        color: card ? 'rgba(229,193,88,0.7)' : 'rgba(255,255,255,0.2)',
        textAlign: 'center',
        maxWidth: isCrossed ? '60px' : '72px',
        lineHeight: '1.3',
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        marginTop: '2px',
      }}>
        {positionLabel}
      </div>

      {/* Card name tooltip */}
      {card && revealed && (
        <div style={{
          fontSize: '10px',
          color: '#fff',
          textAlign: 'center',
          maxWidth: '72px',
          lineHeight: '1.3',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          opacity: 0.85,
        }}>
          {card.name}
        </div>
      )}
    </div>
  );
}

/* ─── Celtic Cross Layout ──────────────────────────────────────────── */
function CelticCrossLayout({ cards, positions, onCardClick, baseUrl }) {
  // Positions: [0]=center, [1]=crossing, [2]=below, [3]=left, [4]=above, [5]=right, [6-9]=staff right column
  const c = (i) => cards[i] || null;
  const p = (i) => positions[i] || '';

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
      {/* Left cross section */}
      <div style={{ position: 'relative', width: '200px', height: '300px', flexShrink: 0 }}>
        {/* Card 5 — Above (top center) */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <CardSlot card={c(4)} position={4} positionLabel={p(4)} index={4} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={200} />
        </div>
        {/* Card 4 — Left */}
        <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>
          <CardSlot card={c(3)} position={3} positionLabel={p(3)} index={3} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={150} />
        </div>
        {/* Card 1 — Center (Present) */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <CardSlot card={c(0)} position={0} positionLabel={p(0)} index={0} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={0} />
        </div>
        {/* Card 2 — Crossing (rotated 90°) */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2, pointerEvents: 'none' }}>
          <div style={{ opacity: 0.85 }}>
            <CardSlot card={c(1)} position={1} positionLabel={p(1)} index={1} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={50} isCrossed={true} />
          </div>
        </div>
        {/* Card 6 — Right */}
        <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)' }}>
          <CardSlot card={c(5)} position={5} positionLabel={p(5)} index={5} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={250} />
        </div>
        {/* Card 3 — Below (bottom center) */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <CardSlot card={c(2)} position={2} positionLabel={p(2)} index={2} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={100} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '300px', background: 'rgba(229,193,88,0.1)', flexShrink: 0, alignSelf: 'center' }} />

      {/* Right staff column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        {[9, 8, 7, 6].map((i, staffIdx) => (
          <CardSlot
            key={i}
            card={c(i)}
            position={i}
            positionLabel={p(i)}
            index={i}
            onCardClick={onCardClick}
            baseUrl={baseUrl}
            revealDelay={300 + staffIdx * 80}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Horseshoe Layout ─────────────────────────────────────────────── */
function HorseshoeLayout({ cards, positions, onCardClick, baseUrl }) {
  // 7 cards arranged in an arc/horseshoe shape
  const count = Math.min(cards.length || positions.length, 7);
  // x,y offsets for horseshoe (% of container)
  const slots = [
    { x: 0,   y: 70 },   // 1 bottom-left
    { x: 20,  y: 30 },   // 2 mid-left
    { x: 40,  y: 5  },   // 3 top-left-center
    { x: 60,  y: 5  },   // 4 top-right-center (center top)
    { x: 80,  y: 30 },   // 5 mid-right
    { x: 100, y: 70 },   // 6 bottom-right
    { x: 50,  y: 50 },   // 7 middle bottom (outcome)
  ];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '260px', margin: '0 auto' }}>
      {Array.from({ length: count }).map((_, i) => {
        const slot = slots[i] || { x: 50, y: 50 };
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CardSlot
              card={cards[i] || null}
              position={i}
              positionLabel={positions[i] || ''}
              index={i}
              onCardClick={onCardClick}
              baseUrl={baseUrl}
              revealDelay={i * 120}
            />
          </div>
        );
      })}
      {/* Arc decoration */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 420 260">
        <path d="M 30 200 Q 210 20 390 200" fill="none" stroke="rgba(229,193,88,0.08)" strokeWidth="1" strokeDasharray="4 6" />
      </svg>
    </div>
  );
}

/* ─── Cross-5 Layout ───────────────────────────────────────────────── */
function Cross5Layout({ cards, positions, onCardClick, baseUrl }) {
  const c = (i) => cards[i] || null;
  const p = (i) => positions[i] || '';
  return (
    <div style={{ position: 'relative', width: '200px', height: '240px', margin: '0 auto' }}>
      {/* Top */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <CardSlot card={c(4)} position={4} positionLabel={p(4)} index={4} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={200} />
      </div>
      {/* Left */}
      <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>
        <CardSlot card={c(0)} position={0} positionLabel={p(0)} index={0} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={0} />
      </div>
      {/* Center */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <CardSlot card={c(1)} position={1} positionLabel={p(1)} index={1} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={80} />
      </div>
      {/* Right */}
      <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)' }}>
        <CardSlot card={c(2)} position={2} positionLabel={p(2)} index={2} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={120} />
      </div>
      {/* Bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <CardSlot card={c(3)} position={3} positionLabel={p(3)} index={3} onCardClick={onCardClick} baseUrl={baseUrl} revealDelay={160} />
      </div>
    </div>
  );
}

/* ─── Row Layout ───────────────────────────────────────────────────── */
function RowLayout({ cards, positions, onCardClick, baseUrl }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      {positions.map((pos, i) => (
        <CardSlot
          key={i}
          card={cards[i] || null}
          position={i}
          positionLabel={pos}
          index={i}
          onCardClick={onCardClick}
          baseUrl={baseUrl}
          revealDelay={i * 150}
        />
      ))}
    </div>
  );
}

/* ─── Yes/No Layout ────────────────────────────────────────────────── */
function YesNoLayout({ cards, positions, onCardClick, baseUrl }) {
  const card = cards[0] || null;
  const isYes = card ? card.orientation === 'upright' : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <CardSlot
        card={card}
        position={0}
        positionLabel={positions[0] || 'Câu trả lời'}
        index={0}
        onCardClick={onCardClick}
        baseUrl={baseUrl}
        revealDelay={0}
      />
      {card && (
        <div style={{
          padding: '10px 28px',
          borderRadius: '30px',
          fontSize: '18px',
          fontWeight: 800,
          fontFamily: "'Cinzel', serif",
          letterSpacing: '2px',
          background: isYes
            ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))',
          border: `2px solid ${isYes ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
          color: isYes ? '#4ade80' : '#f87171',
          boxShadow: `0 0 30px ${isYes ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          animation: 'yesNoReveal 0.6s ease 0.5s both',
        }}>
          {isYes ? '✓ YES' : '✗ NO'}
        </div>
      )}
    </div>
  );
}

/* ─── Main Visualizer ──────────────────────────────────────────────── */
export default function SpreadLayoutVisualizer({ cards = [], spread, onCardClick }) {
  const baseUrl = import.meta.env.BASE_URL;
  const layout = spread?.layout || 'row';
  const positions = spread?.positions || cards.map((_, i) => `Vị trí ${i + 1}`);

  const renderLayout = () => {
    switch (layout) {
      case 'celtic-cross':
        return <CelticCrossLayout cards={cards} positions={positions} onCardClick={onCardClick} baseUrl={baseUrl} />;
      case 'horseshoe':
        return <HorseshoeLayout cards={cards} positions={positions} onCardClick={onCardClick} baseUrl={baseUrl} />;
      case 'cross-5':
        return <Cross5Layout cards={cards} positions={positions} onCardClick={onCardClick} baseUrl={baseUrl} />;
      case 'yes-no':
        return <YesNoLayout cards={cards} positions={positions} onCardClick={onCardClick} baseUrl={baseUrl} />;
      default:
        return <RowLayout cards={cards} positions={positions} onCardClick={onCardClick} baseUrl={baseUrl} />;
    }
  };

  return (
    <div className="spread-layout-visualizer" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 0 8px' }}>
      {renderLayout()}
    </div>
  );
}
