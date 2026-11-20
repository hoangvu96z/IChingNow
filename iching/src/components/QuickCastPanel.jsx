import React, { useState, useEffect, useRef } from 'react';
import { castAllLines, castOneLine, LINE_TYPE_LABELS } from '../logic/castLines.js';
import { useLanguage } from '../context/useLanguage.js';
import AncientCoin3D from './AncientCoin3D.jsx';
import HexagramDisplay from './HexagramDisplay.jsx';
import MindfulnessModal from './MindfulnessModal.jsx';
import MouseEntropyCaster from './MouseEntropyCaster.jsx';
import { soundEngine } from '../utils/soundEffects.js';

/**
 * QuickCastPanel — Gieo Nhanh 6 Hào với 3 chế độ:
 *   1. sequential  — Tự động 6 hào kế tiếp (animation từng hào)
 *   2. instant     — 1 chạm gieo hết 6 hào cùng lúc
 *   3. mouse       — Di chuột tích lũy entropy thật cho từng hào (6 lần)
 */
export default function QuickCastPanel({ onResult, disabled, algorithm = 'three-coin', question = '' }) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [isCasting, setIsCasting] = useState(false);
  // 'sequential' | 'instant' | 'mouse'
  const [castMode, setCastMode] = useState('sequential');
  const [currentStep, setCurrentStep] = useState(0); // 0..6
  const [accumulatedLines, setAccumulatedLines] = useState([]);
  const [currentCoins, setCurrentCoins] = useState(['ngua', 'ngua', 'ngua']);
  const [isTossing, setIsTossing] = useState(false);
  const [soundOn, setSoundOn] = useState(soundEngine.isSoundEnabled());

  // Mouse entropy mode: accumulate 6 hào one by one
  const [mouseLines, setMouseLines] = useState([]);

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

  // Reset mouse mode when switching away
  useEffect(() => {
    setMouseLines([]);
    setAccumulatedLines([]);
  }, [castMode]);

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
    if (isCasting || disabled || castMode === 'mouse') return;

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
    if (castMode === 'sequential') {
      handleSequentialCast();
    } else {
      handleInstantCast();
    }
  }

  // ─── Gieo 6 hào tự động tuần tự với Animation & Âm thanh từng hào ───
  async function handleSequentialCast() {
    if (isCasting || disabled) return;
    setIsCasting(true);
    isCastingRef.current = true;
    setAccumulatedLines([]);
    setCurrentStep(0);

    const generatedLines = [];

    for (let i = 1; i <= 6; i++) {
      if (!isCastingRef.current) break;
      setCurrentStep(i);

      setIsTossing(true);
      soundEngine.playCoinToss();

      const lineData = { index: i, ...castOneLine(algorithm) };
      generatedLines.push(lineData);

      await new Promise(r => setTimeout(r, 650));
      if (!isCastingRef.current) break;

      setCurrentCoins(lineData.coins);
      soundEngine.playCoinClink();
      setIsTossing(false);

      setAccumulatedLines([...generatedLines]);

      await new Promise(r => setTimeout(r, 600));
    }

    if (isCastingRef.current && generatedLines.length === 6) {
      soundEngine.playHexagramComplete();
      await new Promise(r => setTimeout(r, 500));
      setIsCasting(false);
      isCastingRef.current = false;
      onResult(generatedLines);
    }
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

  // ─── Mouse Entropy: Nhận từng hào từ MouseEntropyCaster ───
  function handleMouseLineReady(lineData) {
    const next = [...mouseLines, lineData];
    setMouseLines(next);
    setAccumulatedLines(next);

    if (next.length === 6) {
      soundEngine.playHexagramComplete?.();
      // Nhỏ delay để người dùng thấy hào 6 trước khi kết quả hiện
      setTimeout(() => {
        onResult(next);
      }, 800);
    }
  }

  const mouseStep = mouseLines.length; // 0..5 (index của hào đang gieo)
  const mouseIsDone = mouseLines.length === 6;
  const latestLine = accumulatedLines.length > 0 ? accumulatedLines[accumulatedLines.length - 1] : null;

  const YAO_NAMES_VI = ['Hào Sơ (1)', 'Hào Nhị (2)', 'Hào Tam (3)', 'Hào Tứ (4)', 'Hào Ngũ (5)', 'Hào Thượng (6)'];
  const YAO_NAMES_EN = ['1st Line', '2nd Line', '3rd Line', '4th Line', '5th Line', '6th Line'];
  const yaoNames = isEn ? YAO_NAMES_EN : YAO_NAMES_VI;

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
            {castMode !== 'mouse' && (
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

          {/* Cast Mode Selector — 3 tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--color-paper)',
            borderRadius: 20,
            padding: 2,
            border: '1px solid rgba(184,134,11,0.2)',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            {[
              { key: 'sequential', label: isEn ? '6-step' : 'Tuần tự' },
              { key: 'instant',    label: isEn ? '1-click' : '1 Chạm' },
              { key: 'mouse',      label: isEn ? '🖱️ Entropy' : '🖱️ Di chuột' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => !isCasting && setCastMode(key)}
                disabled={isCasting}
                style={{
                  background: castMode === key
                    ? (key === 'mouse' ? 'var(--color-jade)' : 'var(--color-gold)')
                    : 'transparent',
                  color: castMode === key ? '#fff' : 'var(--color-ink-muted)',
                  border: 'none',
                  borderRadius: 16,
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: isCasting ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Mouse Entropy Mode ─── */}
        {castMode === 'mouse' ? (
          <div style={{ width: '100%' }}>
            {/* Progress stepper for mouse mode */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '0 4px', marginBottom: 16, width: '100%' }}>
              {Array.from({ length: 6 }).map((_, idx) => {
                const done   = idx < mouseLines.length;
                const active = idx === mouseStep && !mouseIsDone;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {idx < 5 && (
                      <div style={{
                        position: 'absolute',
                        top: 15,
                        left: '50%',
                        right: '-50%',
                        height: 2,
                        background: done ? 'var(--color-jade)' : 'rgba(184,134,11,0.2)',
                        transition: 'background 0.4s',
                        zIndex: 0,
                      }} />
                    )}
                    <div className={`stepper-dot ${active ? 'active' : done ? 'done' : ''}`} style={{ zIndex: 1, width: 30, height: 30, fontSize: '0.8rem' }}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span style={{
                      fontSize: '0.63rem',
                      marginTop: 3,
                      color: active ? 'var(--color-vermillion)' : done ? 'var(--color-jade)' : 'var(--color-ink-muted)',
                      fontWeight: active || done ? 700 : 500,
                      textAlign: 'center',
                    }}>
                      {t('result.col_yao', 'Hào')} {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {!mouseIsDone ? (
              <MouseEntropyCaster
                key={mouseStep}
                onLineReady={handleMouseLineReady}
                currentStep={mouseStep}
                disabled={disabled}
                isDone={mouseIsDone}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px 10px',
                color: 'var(--color-jade)',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}>
                ✅ {isEn ? 'All 6 lines cast! Loading result...' : 'Đã gieo đủ 6 hào! Đang tải kết quả...'}
              </div>
            )}

            {/* Show completed lines summary */}
            {mouseLines.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {mouseLines.map((line) => (
                  <div key={line.index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px',
                    borderRadius: 10,
                    background: 'rgba(26,107,74,0.07)',
                    border: '1px solid rgba(26,107,74,0.2)',
                    fontSize: '0.75rem',
                  }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-jade)', minWidth: 20 }}>✓</span>
                    <span style={{ color: 'var(--color-vermillion)', fontWeight: 700 }}>{yaoNames[line.index - 1]}:</span>
                    <span style={{ color: 'var(--color-gold)', fontFamily: 'monospace' }}>
                      {line.coins.map(c => c === 'ngua' ? '3' : '2').join('+')} = {line.total}
                    </span>
                    <span style={{ color: line.moving ? 'var(--color-vermillion)' : 'var(--color-ink-muted)', fontWeight: 600 }}>
                      {LINE_TYPE_LABELS[line.type] || line.type}
                      {line.moving && ' ⚡'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
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

            {/* Live Status indicator during sequential cast */}
            {isCasting && castMode === 'sequential' && (
              <div className="animate-in" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--color-vermillion)'
              }}>
                <div className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(192,57,43,0.2)', borderTop: '2px solid var(--color-vermillion)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>{isEn ? `Casting Line ${currentStep} / 6...` : `Đang gieo Hào ${currentStep} / 6...`}</span>
              </div>
            )}

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

            {/* Progressive Hexagram Preview if in sequential casting */}
            {accumulatedLines.length > 0 && accumulatedLines.length < 6 && (
              <div style={{ marginTop: 14, width: '100%', maxWidth: 200 }}>
                <HexagramDisplay lines={accumulatedLines} size="sm" showIndex />
              </div>
            )}
          </>
        )}
      </div>

      {/* Main CTA Button — only for button/instant modes */}
      {castMode !== 'mouse' && (
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

      {castMode !== 'mouse' && (
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

      {castMode === 'mouse' && !disabled && (
        <p style={{
          fontSize: '0.78rem',
          color: 'var(--color-ink-muted)',
          textAlign: 'center',
          margin: 0,
          maxWidth: 340,
          lineHeight: 1.6,
        }}>
          🔬 {isEn
            ? 'Each line uses true physical randomness from your hand movement — no algorithms involved.'
            : 'Mỗi hào được sinh từ chuyển động tay thật của bạn — không dùng thuật toán ngẫu nhiên.'}
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
