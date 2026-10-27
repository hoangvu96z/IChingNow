import { useEffect, useState } from 'react';

// ─── Danh sách lời động viên / nhắc nhở vui nhộn & huyền bí theo chủ đề Kinh Dịch ───
const ICHING_WAIT_QUOTES = {
  vi: [
    { icon: '☯️', title: 'Âm Dương giao hòa', desc: 'Bát quái đang xoay vần, âm dương tương giao định càn khôn...' },
    { icon: '📜', title: 'Thỉnh giáo Tiền nhân', desc: 'Đang kết nối hào tượng ngàn năm của Văn Vương và Chu Công...' },
    { icon: '⚡', title: 'Hào biến chuyển dịch', desc: 'Các hào động đang phân định thể dụng, giải mã thiên cơ...' },
    { icon: '☕', title: 'Người quân tử kiên nhẫn', desc: 'Trà ngon cần ủ, quẻ quý cần thời gian — AI đang trau chuốt lời khuyên sâu sắc nhất...' },
    { icon: '🌊', title: 'Thuận theo tự nhiên', desc: 'Thủy hỏa tương sinh, vạn vật chuyển dời, câu trả lời chuẩn xác đang hội tụ...' },
    { icon: '🎋', title: 'Sắp lộ quẻ tường tận', desc: 'Chỉ còn vài giây nữa, bản luận giải trọn vẹn và chỉnh chu nhất sẽ hiện ra!' },
    { icon: '✨', title: 'Tâm tĩnh trí sáng', desc: 'Hít sâu một hơi, giữ tâm thanh tịnh để đón nhận lời chỉ dẫn cát tường...' },
    { icon: '🔮', title: 'Đúc kết Dịch lý', desc: 'Đang tổng hợp 6 hào và biến quẻ thành 3 lời khuyên thực tế cho bạn...' }
  ],
  en: [
    { icon: '☯️', title: 'Yin & Yang in Harmony', desc: 'The Bagua is turning, cosmic energies aligning destiny...' },
    { icon: '📜', title: 'Consulting Ancient Sages', desc: 'Seeking timeless wisdom from King Wen and the Duke of Zhou...' },
    { icon: '⚡', title: 'Shifting Moving Lines', desc: 'Analyzing primary and changed hexagrams for clear direction...' },
    { icon: '☕', title: 'Patience of the Wise', desc: 'Profound insights take a moment to brew — crafting your complete guidance...' },
    { icon: '🌊', title: 'Flowing with Nature', desc: 'Water flows, heaven shifts; deep answers are crystallizing...' },
    { icon: '🎋', title: 'Almost Ready', desc: 'Just a few seconds! Your comprehensive reading will be revealed all at once.' },
    { icon: '✨', title: 'Mindful Presence', desc: 'Take a deep breath and prepare to receive auspicious wisdom...' }
  ]
};

function getProgressiveStatus(elapsedSeconds = 0, isEn = false) {
  if (isEn) {
    if (elapsedSeconds < 4) return 'Contemplating question & hexagram signs...';
    if (elapsedSeconds < 8) return 'Analyzing Subject-Object & changing lines...';
    if (elapsedSeconds < 13) return 'Correlating Useful God & actionable advice...';
    return 'Finalizing comprehensive interpretation...';
  }
  if (elapsedSeconds < 4) return 'Đang thấu suốt câu hỏi & tượng quẻ...';
  if (elapsedSeconds < 8) return 'Đang phân tích tương quan Thể - Dụng & hào động...';
  if (elapsedSeconds < 13) return 'Đang đối chiếu Dụng Thần & đúc kết lời khuyên hành động...';
  return 'Đang hoàn tất văn bản luận giải chi tiết...';
}

// ─── Component Animation Đợi Luận Giải Kinh Dịch ───
function IChingWaitingAnimation({ isEn, retryInfo, elapsedSeconds }) {
  const quotes = isEn ? ICHING_WAIT_QUOTES.en : ICHING_WAIT_QUOTES.vi;
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
      padding: '28px 16px',
      background: 'linear-gradient(180deg, rgba(184,134,11,0.06) 0%, rgba(26,107,74,0.04) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(184,134,11,0.25)',
      boxShadow: '0 8px 32px rgba(44,24,16,0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Bagua Trigram Watermarks */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '11rem',
        opacity: 0.04,
        color: 'var(--color-gold)',
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: 1
      }}>
        ☯
      </div>

      {/* Spinning Bagua / Tai Chi Visual */}
      <div style={{ position: 'relative', width: 84, height: 84, marginBottom: 18 }}>
        {/* Outer rotating trigram orbit ring */}
        <div className="iching-orbit-ring" style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px dashed rgba(184,134,11,0.45)',
          animation: 'spin 12s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ position: 'absolute', top: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☰</span>
          <span style={{ position: 'absolute', right: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☲</span>
          <span style={{ position: 'absolute', bottom: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☷</span>
          <span style={{ position: 'absolute', left: -8, fontSize: '0.9rem', color: 'var(--color-gold)' }}>☵</span>
        </div>

        {/* Center glowing Yin Yang */}
        <div style={{
          position: 'absolute',
          inset: 10,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(240,230,200,0.8) 100%)',
          boxShadow: '0 0 20px rgba(184,134,11,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulseGlow 2.4s ease-in-out infinite'
        }}>
          <span style={{
            fontSize: '2.2rem',
            animation: 'spinReverse 6s linear infinite',
            display: 'inline-block',
            color: 'var(--color-ink)',
            filter: 'drop-shadow(0 2px 4px rgba(44,24,16,0.2))'
          }}>
            ☯
          </span>
        </div>
      </div>

      {/* Rotating Quote Card */}
      <div style={{
        maxWidth: 520,
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
          color: 'var(--color-gold)',
          fontFamily: "'Noto Serif', serif",
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{currentQuote.icon}</span>
          <span>{currentQuote.title}</span>
        </div>
        <div style={{
          fontSize: '0.84rem',
          color: 'var(--color-ink)',
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
          background: 'rgba(192,57,43,0.1)',
          border: '1px solid rgba(192,57,43,0.3)',
          color: 'var(--color-vermillion)',
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
          background: 'rgba(184,134,11,0.15)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(90deg, var(--color-gold), var(--color-vermillion))',
            borderRadius: 4,
            animation: 'shimmerSlide 1.8s ease-in-out infinite'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: '0.72rem',
          color: 'var(--color-ink-muted)',
          fontWeight: 500
        }}>
          <span>{getProgressiveStatus(elapsedSeconds, isEn)}</span>
          <span>{elapsedSeconds}s</span>
        </div>
      </div>
    </div>
  );
}

export default IChingWaitingAnimation;
