import React, { useState, useEffect } from 'react';

const TAROT_WAIT_QUOTES = {
  vi: [
    { icon: '🔮', title: 'Kết nối Trực giác', desc: 'Đang lắng nghe trực giác và kết nối năng lượng sâu thẳm của các lá bài...' },
    { icon: '🎴', title: 'Thông điệp Ẩn số', desc: 'Các lá bài đang thì thầm, đan cài những bức tranh định mệnh sống động...' },
    { icon: '✨', title: 'Tín hiệu Vũ trụ', desc: 'Vũ trụ đang gửi tín hiệu, chuẩn bị đón nhận thông điệp sáng tỏ nhất nhé...' },
    { icon: '🪐', title: 'Hành tinh thuận hành', desc: 'Sao Thủy không hề nghịch hành, kiên nhẫn một tẹo là thông điệp xuất lộ ngay!' },
    { icon: '☕', title: 'Thanh lọc Năng lượng', desc: 'Thả lỏng vai, thở nhẹ một nhịp để đón nhận nguồn năng lượng thuần khiết...' },
    { icon: '🌟', title: 'Chiếu rọi Ánh sáng', desc: 'The Star và The Sun đang lan tỏa ánh sáng may mắn vào trải bài này...' },
    { icon: '🎯', title: 'Sắp hoàn tất rồi!', desc: 'Chỉ còn vài giây nữa, toàn bộ bức tranh sẽ hiển thị rạng ngời và tròn vẹn ngay đây!' }
  ],
  en: [
    { icon: '🔮', title: 'Intuitive Connection', desc: 'Tuning into cosmic frequencies and channeling your cards...' },
    { icon: '🎴', title: 'Unfolding Archetypes', desc: 'The archetypes are whispering, weaving their deep divine narrative...' },
    { icon: '✨', title: 'Cosmic Transmission', desc: 'The Universe is broadcasting clarity and wisdom for your question...' },
    { icon: '🪐', title: 'Planetary Harmony', desc: 'No Mercury retrograde here, divine magic takes just a moment to brew!' },
    { icon: '☕', title: 'Mindful Aura', desc: 'Take a gentle breath and relax your aura while the cards reveal...' },
    { icon: '🌟', title: 'Celestial Blessings', desc: 'Channeling the radiant blessings of The Star and The Sun...' },
    { icon: '🎯', title: 'Almost Complete!', desc: 'Synthesizing your full, crystal-clear reading right now...' }
  ]
};

// ─── Component Animation Đợi Luận Giải Tarot Vũ Trụ ───
export default function TarotWaitingAnimation({ isEn, retryInfo, elapsedSeconds }) {
  const quotes = isEn ? TAROT_WAIT_QUOTES.en : TAROT_WAIT_QUOTES.vi;
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 300);
    }, 3200);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const currentQuote = quotes[quoteIndex] || quotes[0];

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '30px 16px',
      background: 'var(--bg-panel)',
      borderRadius: '16px',
      border: '1px solid var(--border-gold)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 0 20px rgba(167,139,250,0.06)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background celestial glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Floating Glowing Tarot Card Visual */}
      <div style={{ position: 'relative', width: 80, height: 110, marginBottom: 20 }}>
        {/* Mystic Orbit Halo */}
        <div style={{
          position: 'absolute',
          top: -12,
          left: -12,
          right: -12,
          bottom: -12,
          borderRadius: '50%',
          border: '1px dashed rgba(229,193,88,0.4)',
          animation: 'spin 14s linear infinite'
        }}>
          <span style={{ position: 'absolute', top: -6, left: '45%', fontSize: '0.8rem' }}>✨</span>
          <span style={{ position: 'absolute', bottom: -6, left: '45%', fontSize: '0.8rem' }}>🌙</span>
          <span style={{ position: 'absolute', left: -6, top: '45%', fontSize: '0.8rem' }}>⭐</span>
          <span style={{ position: 'absolute', right: -6, top: '45%', fontSize: '0.8rem' }}>🔮</span>
        </div>

        {/* 3D Holographic Card */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #2d1b4e 0%, #150f28 100%)',
          border: '1.5px solid rgba(229,193,88,0.6)',
          boxShadow: '0 0 24px rgba(229,193,88,0.3), 0 8px 16px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'cardHover 3s ease-in-out infinite',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Card inner border */}
          <div style={{
            position: 'absolute',
            inset: 4,
            border: '1px solid rgba(229,193,88,0.25)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '2rem',
              animation: 'starPulse 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 8px rgba(229,193,88,0.8))'
            }}>
              🎴
            </span>
          </div>

          {/* Shimmer sweep */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
            transform: 'skewX(-25deg)',
            animation: 'cardShimmer 2.4s infinite'
          }} />
        </div>
      </div>

      {/* Rotating Quote Card */}
      <div style={{
        maxWidth: 500,
        textAlign: 'center',
        opacity: fade ? 1 : 0,
        transform: fade ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        minHeight: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
      }}>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--gold-color)',
          fontFamily: 'var(--font-heading, serif)',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{currentQuote.icon}</span>
          <span>{currentQuote.title}</span>
        </div>
        <div style={{
          fontSize: '0.84rem',
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          fontStyle: 'italic',
          padding: '0 12px'
        }}>
          "{currentQuote.desc}"
        </div>
      </div>

      {/* Auto Retry indicator if triggered */}
      {retryInfo && (
        <div style={{
          marginTop: 12,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'rgba(235,94,85,0.12)',
          border: '1px solid rgba(235,94,85,0.3)',
          color: '#eb5e55',
          fontSize: '0.78rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          animation: 'fadeIn 0.3s ease'
        }}>
          <span>🔄</span>
          <span>{retryInfo}</span>
        </div>
      )}

      {/* Progress Bar & Timer */}
      <div style={{ width: '80%', maxWidth: 360, marginTop: 16 }}>
        <div style={{
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(90deg, #a78bfa, #e5c158)',
            borderRadius: 4,
            animation: 'shimmerSlide 1.8s ease-in-out infinite'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: '0.72rem',
          color: 'var(--text-muted, #a69fbf)',
          fontWeight: 500
        }}>
          <span>{isEn ? 'Synthesizing complete reading...' : 'Đang kết tinh trọn vẹn thông điệp...'}</span>
          <span>{elapsedSeconds}s</span>
        </div>
      </div>
    </div>
  );
}
