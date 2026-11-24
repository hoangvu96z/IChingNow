import React, { useState, useEffect, useRef } from 'react';
import { castAllLines, LINE_TYPE_LABELS } from '../logic/castLines.js';
import { useLanguage } from '../context/useLanguage.js';
import AncientCoin3D from './AncientCoin3D.jsx';
import MindfulnessModal from './MindfulnessModal.jsx';
import { soundEngine } from '../utils/soundEffects.js';

export default function QuickCastPanel({ onResult, disabled, algorithm = 'three-coin', question = '' }) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [isCasting, setIsCasting] = useState(false);
  const [accumulatedLines, setAccumulatedLines] = useState([]);
  const [currentCoins, setCurrentCoins] = useState(['ngua', 'ngua', 'ngua']);
  const [isTossing, setIsTossing] = useState(false);
  const [soundOn, setSoundOn] = useState(soundEngine.isSoundEnabled());

  // Mindfulness 10s state (persisted to localStorage)
  const [showMindfulnessModal, setShowMindfulnessModal] = useState(false);
  const [mindfulnessOn, setMindfulnessOn] = useState(() => {
    try {
      const saved = localStorage.getItem('iching_mindfulness_enabled');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const isCastingRef = useRef(false);

  useEffect(() => {
    return () => {
      isCastingRef.current = false;
    };
  }, []);

  function handleToggleSound() {
    const nextState = soundEngine.toggleSound();
    setSoundOn(nextState);
  }

  function handleToggleMindfulness() {
    const next = !mindfulnessOn;
    setMindfulnessOn(next);
    try {
      localStorage.setItem('iching_mindfulness_enabled', String(next));
    } catch {}
  }

  // Pre-cast trigger (check if mindfulness is enabled first)
  function handleInitiateCast() {
    if (isCasting || disabled) return;

    let isMindful = mindfulnessOn;
    try {
      const saved = localStorage.getItem('iching_mindfulness_enabled');
      if (saved !== null) isMindful = saved === 'true';
    } catch {}

    if (isMindful) {
      setShowMindfulnessModal(true);
    } else {
      executeCast();
    }
  }

  function handleMindfulnessComplete() {
    setShowMindfulnessModal(false);
    executeCast();
  }

  function executeCast() {
    handleInstantCast();
  }

  // ─── Gieo nhanh 1 chạm (Instant) ───
  async function handleInstantCast() {
    if (isCasting || disabled) return;
    setIsCasting(true);
    isCastingRef.current = true;

    setIsTossing(true);
    soundEngine.playCoinToss();

    const allLines = castAllLines(algorithm);
    const lastLine = allLines[5];

    await new Promise(r => setTimeout(r, 700));
    if (!isCastingRef.current) return;

    setCurrentCoins(lastLine.coins);
    soundEngine.playCoinClink();
    setIsTossing(false);
    setAccumulatedLines(allLines);

    soundEngine.playHexagramComplete();
    await new Promise(r => setTimeout(r, 400));
    setIsCasting(false);
    isCastingRef.current = false;
    onResult(allLines);
  }

  const latestLine = accumulatedLines.length > 0 ? accumulatedLines[accumulatedLines.length - 1] : null;

  return (
    <>
    {/* 10s Mindfulness Modal */}
    <MindfulnessModal
      isOpen={showMindfulnessModal}
      question={question}
      onComplete={handleMindfulnessComplete}
      onClose={() => setShowMindfulnessModal(false)}
    />

    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '16px 0',
      width: '100%'
    }}>
      {/* ─── Đĩa Gieo Quẻ Bát Quái Phong Thủy 3D ─── */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--color-paper-dark)',
        borderRadius: '20px',
        border: '1.5px solid rgba(184,134,11,0.3)',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.04), 0 8px 24px rgba(44,24,16,0.08)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        {/* Top controls: Mute/Unmute, Mindfulness Toggle & Mode selector */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16
        }}>
          {/* Left: Sound & Mindfulness toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className="btn-ghost"
              style={{
                padding: '4px 9px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 20,
                background: soundOn ? 'rgba(26,107,74,0.12)' : 'var(--color-paper)',
                color: soundOn ? 'var(--color-jade)' : 'var(--color-ink-muted)',
                border: `1px solid ${soundOn ? 'rgba(26,107,74,0.35)' : 'rgba(184,134,11,0.25)'}`
              }}
              title={soundOn ? (isEn ? 'Sound on' : 'Đang bật âm thanh') : (isEn ? 'Muted' : 'Đã tắt âm thanh')}
            >
              <span>{soundOn ? '🔊' : '🔇'}</span>
            </button>

            {/* Mindfulness Toggle — only for button/instant modes */}
            {true && (
              <button
                type="button"
                onClick={handleToggleMindfulness}
                className="btn-ghost"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 20,
                  background: mindfulnessOn ? 'rgba(184,134,11,0.14)' : 'var(--color-paper)',
                  color: mindfulnessOn ? 'var(--color-gold)' : 'var(--color-ink-muted)',
                  border: `1px solid ${mindfulnessOn ? 'rgba(184,134,11,0.35)' : 'rgba(184,134,11,0.25)'}`,
                  fontWeight: mindfulnessOn ? 700 : 500
                }}
                title={mindfulnessOn ? (isEn ? '10s Mindful countdown enabled' : 'Đang bật tịnh tâm 10s') : (isEn ? 'Mindfulness skipped' : 'Đã tắt tịnh tâm')}
              >
                <span>🧘</span>
                <span>{mindfulnessOn ? (isEn ? 'Mindful: ON' : 'Tịnh tâm: Bật') : (isEn ? 'Mindful: OFF' : 'Tịnh tâm: Tắt')}</span>
              </button>
            )}
          </div>

        </div>

            {/* Central Tray: 3 Bronze Coins 3D */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
              padding: '20px 10px',
              minHeight: 120,
              position: 'relative'
            }}>
              {/* Subtle Yin-Yang center glow */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(184,134,11,0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {currentCoins.map((coinFace, idx) => (
                <AncientCoin3D
                  key={idx}
                  face={coinFace}
                  isTossing={isTossing}
                  size={68}
                  delay={idx * 0.08}
                  showLabel={!isTossing}
                  disabled={isCasting}
                />
              ))}
            </div>

            {/* Last Tossed Result preview */}
            {latestLine && !isTossing && (
              <div className="animate-in" style={{
                marginTop: 10,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'var(--color-paper)',
                border: '1px solid rgba(184,134,11,0.3)',
                fontSize: '0.78rem',
                color: 'var(--color-ink)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontWeight: 700, color: 'var(--color-vermillion)' }}>
                  {isEn ? `Line ${latestLine.index}:` : `Hào ${latestLine.index}:`}
                </span>
                <span>
                  {latestLine.coins?.map(c => c === 'ngua' ? (isEn ? 'H(+3)' : 'Ngửa(+3)') : (isEn ? 'T(+2)' : 'Sấp(+2)')).join(' + ')} = {latestLine.total}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-gold)' }}>
                  ({t('lineType.' + latestLine.type, LINE_TYPE_LABELS[latestLine.type])})
                </span>
              </div>
            )}

      </div>

      {/* Main CTA Button — only for button/instant modes */}
      {true && (
        <button
          onClick={handleInitiateCast}
          disabled={isCasting || disabled}
          className="btn-primary btn-cta"
          style={{
            fontSize: '1.125rem',
            padding: '16px 44px',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 16px rgba(184,134,11,0.3)',
            cursor: (isCasting || disabled) ? 'not-allowed' : 'pointer'
          }}
        >
          {isCasting ? (
            <>
              <SpinIcon />
              <span>{isEn ? 'Casting Hexagram...' : 'Đang gieo quẻ 3D...'}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.25rem' }}>🪙</span>
              <span>{t('panel.cast_quick_btn', 'Gieo quẻ 6 hào')}</span>
            </>
          )}
        </button>
      )}

      {disabled && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-vermillion)', textAlign: 'center', margin: 0, fontWeight: 600 }}>
          {t('panel.need_question_warning', '⚠ Vui lòng nhập việc cần xem trước khi gieo quẻ')}
        </p>
      )}

      {true && (
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--color-ink-muted)',
          textAlign: 'center',
          margin: 0,
          maxWidth: 320,
          lineHeight: 1.5,
        }}>
          {algorithm === 'yarrow-stalks'
            ? t('panel.alg_desc_yarrow', 'Hệ thống sẽ mô phỏng chia 49 cọng Cỏ Thi × 6 lần theo phương pháp cổ xưa của Chu Dịch.')
            : algorithm === 'equal-prob'
            ? t('panel.alg_desc_equal', 'Hệ thống sẽ gieo ngẫu nhiên 6 hào với cơ hội xuất hiện mỗi hào bằng nhau (25%).')
            : t('panel.alg_desc_three_coin', 'Hệ thống sẽ mô phỏng tung 3 đồng xu 3D × 6 lần theo phương pháp kinh điển.')}
        </p>
      )}

    </div>
    </>
  );
}

function SpinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
      <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round"/>
    </svg>
  );
}
