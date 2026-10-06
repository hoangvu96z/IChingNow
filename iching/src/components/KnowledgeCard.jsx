import React, { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

const TYPE_CONFIG = {
  concept: { emoji: '📚', label: 'Kiến thức', accent: '#c9963a', bg: 'linear-gradient(165deg, #1a1206 0%, #2d1f08 30%, #1a1206 100%)' },
  tip:     { emoji: '💡', label: 'Mẹo xem quẻ', accent: '#5ca067', bg: 'linear-gradient(165deg, #0a1a0d 0%, #13260f 30%, #0a1a0d 100%)' },
  quiz:    { emoji: '🎯', label: 'Mini Quiz', accent: '#6a7ec9', bg: 'linear-gradient(165deg, #0d0f1f 0%, #141a3a 30%, #0d0f1f 100%)' },
  hexOfDay:{ emoji: '☯',  label: 'Quẻ của ngày', accent: '#c25050', bg: 'linear-gradient(165deg, #1a0a0a 0%, #2d1010 30%, #1a0a0a 100%)' },
};

const TRIGRAM_EMOJI = { 1: '☰', 2: '☷', 3: '☵', 4: '☲', 5: '☳', 6: '☶', 7: '☴', 8: '☱' };

/**
 * Thẻ kiến thức đẹp — có thể xuất ảnh để chia sẻ.
 * Props: post (from knowledgePosts.js), compact (boolean, nếu true = nhỏ gọn cho feed)
 */
export default function KnowledgeCard({ post, compact = false, onQuizAnswer }) {
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [quizChosen, setQuizChosen] = useState(null);
  const [shared, setShared] = useState(false);

  const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.concept;

  const exportImage = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0e0a04',
        style: { borderRadius: '0' },
      });
      // Try Web Share API first
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `iching-${post.id}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: post.title, text: `${post.title} — IChingNow` });
          setShared(true);
          return;
        }
      }
      // Fallback: download
      const link = document.createElement('a');
      link.download = `iching-${post.id}.png`;
      link.href = dataUrl;
      link.click();
      setShared(true);
    } catch { /* user cancelled */ }
    finally { setSaving(false); }
  }, [post, saving]);

  const handleQuiz = (idx) => {
    if (quizChosen !== null) return;
    setQuizChosen(idx);
    onQuizAnswer?.(idx === post.quizAnswer);
  };

  const cardWidth = compact ? '100%' : 360;
  const cardPadding = compact ? '20px 18px' : '32px 28px';

  return (
    <div style={{ width: cardWidth, maxWidth: '100%' }}>
      {/* Exportable card */}
      <div
        ref={cardRef}
        style={{
          background: cfg.bg,
          borderRadius: 20,
          padding: cardPadding,
          color: '#ece6d2',
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${cfg.accent}30`,
          boxShadow: `0 8px 32px ${cfg.accent}15, 0 2px 8px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Background decorative element */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -20,
            top: -30,
            fontSize: compact ? '8rem' : '11rem',
            opacity: 0.04,
            fontFamily: "'Noto Serif', serif",
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          ☯
        </div>
        {/* Subtle grid pattern */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 1px 1px, ${cfg.accent}08 1px, transparent 0)`,
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* Top bar: type badge */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 14 : 20 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}40`,
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: cfg.accent,
            }}
          >
            {cfg.emoji} {cfg.label}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#8a7f6a' }}>
            {post.tag}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            position: 'relative',
            margin: '0 0 12px',
            fontFamily: "'Noto Serif', serif",
            fontSize: compact ? '1.15rem' : '1.4rem',
            fontWeight: 800,
            lineHeight: 1.35,
            color: '#ffe7a8',
            textShadow: `0 2px 12px ${cfg.accent}30`,
          }}
        >
          {post.title}
        </h3>

        {/* Divider */}
        <div
          style={{
            position: 'relative',
            height: 2,
            background: `linear-gradient(90deg, ${cfg.accent}60, transparent)`,
            borderRadius: 1,
            marginBottom: compact ? 12 : 18,
          }}
        />

        {/* Body */}
        <p
          style={{
            position: 'relative',
            margin: 0,
            fontSize: compact ? '0.88rem' : '0.95rem',
            lineHeight: 1.7,
            color: '#d4ccb8',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.body}
        </p>

        {/* Quiz options */}
        {post.type === 'quiz' && post.quizOptions && (
          <div style={{ position: 'relative', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {post.quizOptions.map((opt, i) => {
              const isAnswer = i === post.quizAnswer;
              const isChosen = i === quizChosen;
              const done = quizChosen !== null;
              let optBg = `${cfg.accent}12`;
              let optBorder = `${cfg.accent}30`;
              let optColor = '#d4ccb8';
              if (done && isAnswer) { optBg = 'rgba(26,107,74,0.25)'; optBorder = '#5ca067'; optColor = '#7ddb8d'; }
              else if (done && isChosen && !isAnswer) { optBg = 'rgba(192,57,43,0.2)'; optBorder = '#c25050'; optColor = '#e87070'; }
              else if (done) { optBg = 'transparent'; optBorder = '#3a3525'; optColor = '#6a6050'; }
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleQuiz(i)}
                  disabled={done}
                  style={{
                    background: optBg, border: `1px solid ${optBorder}`,
                    borderRadius: 10, padding: '10px 14px',
                    color: optColor, fontSize: '0.88rem', fontWeight: 600,
                    textAlign: 'left', cursor: done ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              );
            })}
            {quizChosen !== null && post.quizExplain && (
              <div
                className="animate-in"
                style={{
                  marginTop: 4, padding: '10px 14px', borderRadius: 10,
                  background: quizChosen === post.quizAnswer ? 'rgba(26,107,74,0.12)' : 'rgba(192,57,43,0.1)',
                  border: `1px solid ${quizChosen === post.quizAnswer ? '#5ca06740' : '#c2505040'}`,
                  fontSize: '0.82rem', lineHeight: 1.6, color: '#c4b898',
                }}
              >
                <strong style={{ color: quizChosen === post.quizAnswer ? '#7ddb8d' : '#e87070' }}>
                  {quizChosen === post.quizAnswer ? '✅ Chính xác!' : '❌ Chưa đúng'}
                </strong>
                <br />
                {post.quizExplain}
              </div>
            )}
          </div>
        )}

        {/* Footer: watermark */}
        <div
          style={{
            position: 'relative',
            marginTop: compact ? 18 : 24,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 12,
            borderTop: '1px solid #2a241a',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#5a5040', fontWeight: 700, letterSpacing: '0.12em' }}>
            ICHINGNOW.COM
          </span>
          <span style={{ fontSize: '0.65rem', color: '#4a4030' }}>
            Dịch Học mỗi ngày
          </span>
        </div>
      </div>

      {/* Actions (not exported in image) */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          type="button"
          id={`share-card-${post.id}`}
          onClick={exportImage}
          disabled={saving}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 14px', borderRadius: 12,
            background: saving ? '#3a3525' : `${cfg.accent}18`,
            border: `1px solid ${cfg.accent}40`,
            color: cfg.accent,
            fontSize: '0.85rem', fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {saving ? '⏳ Đang xuất...' : shared ? '✓ Đã chia sẻ' : '📤 Chia sẻ'}
        </button>
      </div>
    </div>
  );
}
