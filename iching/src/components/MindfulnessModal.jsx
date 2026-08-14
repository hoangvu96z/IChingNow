import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { soundEngine } from '../utils/soundEffects.js';

const MINDFUL_QUOTES = {
  vi: [
    { title: 'Tâm Thành Quẻ Ứng', desc: 'Dịch lý là cầu nối giữa trực giác của bạn và quy luật biến chuyển của trời đất. Tâm càng tịnh, quẻ càng sáng tỏ.' },
    { title: 'Quán Tưởng Câu Hỏi', desc: 'Hãy hướng toàn bộ sự chú tâm vào điều bạn đang mong muốn thấu hiểu. Giữ tâm trí không vướng bận tạp niệm.' },
    { title: 'Thuận Theo Tự Nhiên', desc: 'Vạn sự đều có thời điểm. Hãy đón nhận quẻ tượng với lòng bình an và cởi mở.' }
  ],
  en: [
    { title: 'Mindful Connection', desc: 'The I Ching reflects the stillness of your inner consciousness. The calmer your mind, the clearer the guidance.' },
    { title: 'Focus on Intent', desc: 'Direct your mindful attention toward your core question. Let go of distractions and racing thoughts.' },
    { title: 'Flowing with Wisdom', desc: 'Trust the natural rhythms of life and receive the hexagram with an open, peaceful heart.' }
  ]
};

export default function MindfulnessModal({
  isOpen,
  question = '',
  onComplete,
  onClose,
}) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [timeLeft, setTimeLeft] = useState(10);
  const [mindfulnessEnabled, setMindfulnessEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('iching_mindfulness_enabled');
      return saved === null ? true : saved === 'true';
    } catch (e) {
      return true;
    }
  });

  const quotes = isEn ? MINDFUL_QUOTES.en : MINDFUL_QUOTES.vi;
  const [quoteIndex, setQuoteIndex] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      completedRef.current = false;
      return;
    }

    completedRef.current = false;
    setTimeLeft(10);
    setQuoteIndex(Math.floor(Math.random() * quotes.length));

    // Play serene meditation singing bowl sound
    soundEngine.playMeditationBell();

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!completedRef.current) {
            completedRef.current = true;
            setTimeout(() => {
              onComplete();
            }, 350);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen]);

  function handleToggleMindfulness() {
    const nextVal = !mindfulnessEnabled;
    setMindfulnessEnabled(nextVal);
    try {
      localStorage.setItem('iching_mindfulness_enabled', String(nextVal));
    } catch (e) {}
  }

  function handleSkip() {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }

  if (!isOpen) return null;

  const currentQuote = quotes[quoteIndex] || quotes[0];

  // Circular progress calculation
  const totalSeconds = 10;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Dynamic breathing stage instruction
  let breathStage = isEn ? 'Inhale deeply...' : 'Hít vào thật sâu...';
  if (timeLeft <= 3) {
    breathStage = isEn ? 'Exhale gently & focus...' : 'Thở ra nhẹ nhàng, tâm an tĩnh...';
  } else if (timeLeft <= 7) {
    breathStage = isEn ? 'Hold gently & visualize...' : 'Giữ tâm thanh tịnh, quán tưởng...';
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(28, 16, 10, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      animation: 'fadeInModal 0.3s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'linear-gradient(180deg, #fbf7ec 0%, #f4ebd2 100%)',
        borderRadius: 24,
        border: '2px solid rgba(184,134,11,0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35), 0 0 30px rgba(184,134,11,0.15)',
        padding: '28px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Oriental corner ornaments */}
        <div style={{ position: 'absolute', top: 10, left: 12, fontSize: '1rem', opacity: 0.3, color: 'var(--color-gold)' }}>✦</div>
        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: '1rem', opacity: 0.3, color: 'var(--color-gold)' }}>✦</div>

        {/* Close / Cancel button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            padding: 4,
            lineHeight: 1,
            zIndex: 10
          }}
          title={isEn ? 'Cancel' : 'Đóng'}
        >
          ✕
        </button>

        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4
        }}>
          <span style={{ fontSize: '1.4rem' }}>🧘</span>
          <h3 style={{
            margin: 0,
            fontFamily: "'Noto Serif', serif",
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-ink)'
          }}>
            {isEn ? 'Mindful Focus Before Casting' : 'Tịnh Tâm Quán Tưởng'}
          </h3>
        </div>

        <p style={{
          margin: '0 0 16px',
          fontSize: '0.82rem',
          color: 'var(--color-ink-muted)',
          textAlign: 'center'
        }}>
          {isEn ? 'Dwell in calmness for 10 seconds to align your inner frequency' : 'Dành 10 giây lắng đọng tâm tư để quẻ tượng kết nối trọn vẹn'}
        </p>

        {/* ─── Circular 10s Countdown with Breathing Ring ─── */}
        <div style={{
          position: 'relative',
          width: 140,
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '8px 0 16px'
        }}>
          {/* Pulsing Breathing Aura */}
          <div style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(184,134,11,0.2) 0%, rgba(26,107,74,0.05) 70%, transparent 100%)',
            animation: 'mindfulPulse 4s ease-in-out infinite',
            pointerEvents: 'none'
          }} />

          {/* SVG Progress Ring */}
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="rgba(184,134,11,0.15)"
              strokeWidth="6"
            />
            {/* Active Progress Stroke */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="url(#mindfulGoldGrad)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.95s linear' }}
            />
            <defs>
              <linearGradient id="mindfulGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset="100%" stopColor="#c0392b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Counter & Yin Yang */}
          <div style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              fontFamily: "'Noto Serif', serif",
              color: 'var(--color-ink)',
              lineHeight: 1
            }}>
              {timeLeft}
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--color-gold)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginTop: 2
            }}>
              {isEn ? 'SECONDS' : 'GIÂY'}
            </span>
          </div>
        </div>

        {/* Breathing Stage Indicator */}
        <div style={{
          padding: '4px 14px',
          borderRadius: 20,
          background: 'rgba(26,107,74,0.1)',
          border: '1px solid rgba(26,107,74,0.25)',
          color: 'var(--color-jade)',
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: 12,
          animation: 'fadeIn 0.4s ease'
        }}>
          🌿 {breathStage}
        </div>

        {/* Question in focus (if provided) */}
        {question && (
          <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.6)',
            border: '1px dashed rgba(184,134,11,0.3)',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {isEn ? 'Your Question in mind:' : 'Việc bạn đang quán tưởng:'}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', fontStyle: 'italic', wordBreak: 'break-word' }}>
              "{question}"
            </div>
          </div>
        )}

        {/* Mindful quote */}
        <div style={{
          textAlign: 'center',
          padding: '0 8px',
          marginBottom: 18
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold)', fontFamily: "'Noto Serif', serif", marginBottom: 2 }}>
            {currentQuote.title}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', lineHeight: 1.45 }}>
            {currentQuote.desc}
          </div>
        </div>

        {/* Primary CTA: Skip / Start Cast immediately */}
        <button
          type="button"
          onClick={handleSkip}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '0.95rem',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(184,134,11,0.25)'
          }}
        >
          <span>✨</span>
          <span>{isEn ? 'Ready! Cast Now ➔' : 'Đã tịnh tâm, gieo quẻ ngay ➔'}</span>
        </button>

        {/* ─── Footer Switch: Toggle 10s Mindfulness Feature On/Off ─── */}
        <div style={{
          width: '100%',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px dashed rgba(184,134,11,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
            {isEn ? 'Show 10s mindfulness before casting' : 'Bật nhắc tịnh tâm 10s trước khi gieo'}
          </span>
          <button
            type="button"
            onClick={handleToggleMindfulness}
            style={{
              width: 38,
              height: 20,
              borderRadius: 10,
              border: 'none',
              background: mindfulnessEnabled ? 'var(--color-jade)' : 'rgba(44,24,16,0.2)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0
            }}
            title={mindfulnessEnabled ? 'Đang bật' : 'Đã tắt'}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: mindfulnessEnabled ? 20 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s'
            }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes mindfulPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
