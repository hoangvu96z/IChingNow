import React from 'react';

/**
 * AncientCoin3D — 3D Ancient Chinese/Vietnamese Bronze Divination Coin
 * Features:
 * - Round coin with square center hole (Thiên Viên Địa Phương)
 * - Front Face (Ngửa / Heads / Dương = 3 điểm): 乾 隆 通 寶 (Càn Long Thông Bảo)
 * - Back Face (Sấp / Tails / Âm = 2 điểm): Manchu dragon symbols & ancient patina
 * - 3D Edge thickness & specular reflections
 * - Physics-like toss, spin, bounce, and settled states
 * - Interactive flipping on click
 */
export default function AncientCoin3D({
  face = 'ngua', // 'ngua' (heads, 3) | 'sap' (tails, 2)
  isTossing = false,
  size = 64, // diameter in px
  delay = 0, // animation delay in seconds
  onClick = null,
  showLabel = true,
  disabled = false
}) {
  const isHeads = face === 'ngua';

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: !disabled && onClick ? 'pointer' : 'default',
        userSelect: 'none',
        perspective: 900,
        WebkitPerspective: 900,
      }}
    >
      {/* 3D Coin Container */}
      <div
        className={`ancient-coin-3d-wrapper ${isTossing ? 'is-tossing' : ''}`}
        style={{
          width: size,
          height: size,
          position: 'relative',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          animationDelay: `${delay}s`,
          transition: isTossing ? 'none' : 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isTossing ? undefined : `rotateY(${isHeads ? 0 : 180}deg)`,
        }}
      >
        {/* FRONT FACE (Ngửa / Dương - 3 Điểm: 乾 隆 通 寶) */}
        <div
          className="coin-face coin-face-front"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg) translateZ(2px)',
            background: 'radial-gradient(circle at 35% 30%, #f6d365 0%, #d4af37 40%, #aa7c11 75%, #5a3806 100%)',
            border: `${Math.max(2, Math.round(size * 0.045))}px solid #f9e295`,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.55), 0 4px 12px rgba(44,24,16,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Inner embossed circular border */}
          <div style={{
            position: 'absolute',
            inset: Math.round(size * 0.08),
            borderRadius: '50%',
            border: '1px solid rgba(255,235,160,0.4)',
            pointerEvents: 'none'
          }} />

          {/* 4 Ancient Calligraphy Characters: 乾 隆 通 寶 */}
          <span style={{ position: 'absolute', top: size * 0.06, fontSize: size * 0.22, fontWeight: 900, color: '#2d1805', textShadow: '0 1px 0 rgba(255,255,255,0.4)', fontFamily: "'Noto Serif', serif", lineHeight: 1 }}>乾</span>
          <span style={{ position: 'absolute', bottom: size * 0.06, fontSize: size * 0.22, fontWeight: 900, color: '#2d1805', textShadow: '0 1px 0 rgba(255,255,255,0.4)', fontFamily: "'Noto Serif', serif", lineHeight: 1 }}>隆</span>
          <span style={{ position: 'absolute', right: size * 0.08, fontSize: size * 0.22, fontWeight: 900, color: '#2d1805', textShadow: '0 1px 0 rgba(255,255,255,0.4)', fontFamily: "'Noto Serif', serif", lineHeight: 1 }}>通</span>
          <span style={{ position: 'absolute', left: size * 0.08, fontSize: size * 0.22, fontWeight: 900, color: '#2d1805', textShadow: '0 1px 0 rgba(255,255,255,0.4)', fontFamily: "'Noto Serif', serif", lineHeight: 1 }}>寶</span>

          {/* Square Hole in Center (Thiên Viên Địa Phương) */}
          <div style={{
            width: size * 0.28,
            height: size * 0.28,
            background: 'var(--color-paper, #faf3e0)',
            border: '1.5px solid #6b4c10',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(255,255,255,0.4)',
            position: 'relative',
            zIndex: 2
          }} />

          {/* Specular sheen reflection */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 45%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }} />
        </div>

        {/* BACK FACE (Sấp / Âm - 2 Điểm: Ký tự cổ / Manchu Pattern) */}
        <div
          className="coin-face coin-face-back"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(2px)',
            background: 'radial-gradient(circle at 35% 30%, #a88d65 0%, #7d5f38 45%, #4e361b 80%, #281a0b 100%)',
            border: `${Math.max(2, Math.round(size * 0.045))}px solid #cbb28b`,
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.65), 0 4px 12px rgba(44,24,16,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Inner embossed circular border */}
          <div style={{
            position: 'absolute',
            inset: Math.round(size * 0.08),
            borderRadius: '50%',
            border: '1px solid rgba(255,225,180,0.25)',
            pointerEvents: 'none'
          }} />

          {/* Ancient Manchu symbols: Boo Ciowan (Bảo Tuyền Cục) */}
          <span style={{ position: 'absolute', left: size * 0.09, fontSize: size * 0.28, color: '#e8cca4', textShadow: '0 1px 0 rgba(0,0,0,0.6)', fontFamily: "'Noto Serif', serif", fontWeight: 700, lineHeight: 1 }}>ᠪᠣᠣ</span>
          <span style={{ position: 'absolute', right: size * 0.09, fontSize: size * 0.28, color: '#e8cca4', textShadow: '0 1px 0 rgba(0,0,0,0.6)', fontFamily: "'Noto Serif', serif", fontWeight: 700, lineHeight: 1 }}>ᠴᡳᠣᠠᠨ</span>

          {/* Square Hole in Center */}
          <div style={{
            width: size * 0.28,
            height: size * 0.28,
            background: 'var(--color-paper, #faf3e0)',
            border: '1.5px solid #4a3013',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.85), 0 0 2px rgba(255,255,255,0.3)',
            position: 'relative',
            zIndex: 2
          }} />

          {/* Darker antique patina sheen */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 45%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }} />
        </div>

        {/* 3D Coin Edge Rim (Middle Depth layer) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          transform: 'translateZ(0px)',
          boxShadow: '0 0 0 2px #8a5e1b',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Label under coin */}
      {showLabel && !isTossing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isHeads ? '#b8860b' : 'var(--color-ink-muted)',
          background: isHeads ? 'rgba(184,134,11,0.12)' : 'rgba(44,24,16,0.06)',
          padding: '2px 8px',
          borderRadius: 10,
          border: `1px solid ${isHeads ? 'rgba(184,134,11,0.3)' : 'rgba(44,24,16,0.15)'}`,
          transition: 'all 0.2s ease'
        }}>
          <span>{isHeads ? 'Ngửa' : 'Sấp'}</span>
          <span style={{ opacity: 0.75 }}>({isHeads ? '+3' : '+2'})</span>
        </div>
      )}

      {/* Global CSS for 3D toss animation */}
      <style>{`
        @keyframes toss3dSpin {
          0% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(1);
          }
          30% {
            transform: translateY(-90px) rotateX(720deg) rotateY(540deg) scale(1.18);
          }
          60% {
            transform: translateY(-110px) rotateX(1440deg) rotateY(1080deg) scale(1.22);
          }
          85% {
            transform: translateY(4px) rotateX(2160deg) rotateY(${isHeads ? 2160 : 2340}deg) scale(0.96);
          }
          92% {
            transform: translateY(-12px) rotateX(2160deg) rotateY(${isHeads ? 2160 : 2340}deg) scale(1.04);
          }
          100% {
            transform: translateY(0) rotateX(2160deg) rotateY(${isHeads ? 2160 : 2340}deg) scale(1);
          }
        }

        .ancient-coin-3d-wrapper.is-tossing {
          animation: toss3dSpin 0.95s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
}
