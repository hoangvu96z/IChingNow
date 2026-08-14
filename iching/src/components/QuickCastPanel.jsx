import React, { useState, useEffect, useRef } from 'react';
import { castAllLines, castOneLine, COIN_LABELS, LINE_TYPE_LABELS } from '../logic/castLines.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import AncientCoin3D from './AncientCoin3D.jsx';
import HexagramDisplay from './HexagramDisplay.jsx';
import MindfulnessModal from './MindfulnessModal.jsx';
import { soundEngine } from '../utils/soundEffects.js';

/**
 * QuickCastPanel — Gieo Nhanh 6 Hào với 3D Coins, Âm Thanh Đồng Tiền, và Chế Độ Tịnh Tâm 10s
 */
export default function QuickCastPanel({ onResult, disabled, algorithm = 'three-coin', question = '' }) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [isCasting, setIsCasting] = useState(false);
  const [castMode, setCastMode] = useState('sequential'); // 'sequential' (tự động 6 hào) | 'instant' (1 chạm)
  const [currentStep, setCurrentStep] = useState(0); // 0..6
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
    } catch (e) {
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
    } catch (e) {}
  }

  // Pre-cast trigger (check if mindfulness is enabled first)
  function handleInitiateCast() {
    if (isCasting || disabled) return;

    // Check localStorage in case changed
    let isMindful = mindfulnessOn;
    try {
      const saved = localStorage.getItem('iching_mindfulness_enabled');
      if (saved !== null) isMindful = saved === 'true';
    } catch (e) {}

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

      // 1. Tung 3 đồng xu 3D & phát âm thanh bay
      setIsTossing(true);
      soundEngine.playCoinToss();

      // Tạo kết quả hào này
      const lineData = { index: i, ...castOneLine(algorithm) };
      generatedLines.push(lineData);

      // Chờ đồng xu bay trên không trung
      await new Promise(r => setTimeout(r, 650));
      if (!isCastingRef.current) break;

      // 2. Đồng xu chạm đĩa sứ/mặt bàn -> đổi mặt hiển thị & phát tiếng leng keng
      setCurrentCoins(lineData.coins);
      soundEngine.playCoinClink();
      setIsTossing(false);

      // Cập nhật tháp quẻ đã gieo
      setAccumulatedLines([...generatedLines]);

      // Chờ xem kết quả hào hiện tại một nhịp
      await new Promise(r => setTimeout(r, 600));
    }

    if (isCastingRef.current && generatedLines.length === 6) {
      // 3. Chuông ngân vang hoàn tất quẻ
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

    // Tung 3 đồng xu 3D
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
        maxWidth: 460,
        background: 'linear-gradient(145deg, rgba(44,24,16,0.06) 0%, rgba(184,134,11,0.08) 100%)',
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
                background: soundOn ? 'rgba(26,107,74,0.1)' : 'rgba(44,24,16,0.06)',
                color: soundOn ? 'var(--color-jade)' : 'var(--color-ink-muted)',
                border: `1px solid ${soundOn ? 'rgba(26,107,74,0.3)' : 'rgba(44,24,16,0.15)'}`
              }}
              title={soundOn ? (isEn ? 'Sound on' : 'Đang bật âm thanh') : (isEn ? 'Muted' : 'Đã tắt âm thanh')}
            >
              <span>{soundOn ? '🔊' : '🔇'}</span>
            </button>

            {/* Mindfulness Toggle */}
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
                background: mindfulnessOn ? 'rgba(184,134,11,0.12)' : 'rgba(44,24,16,0.06)',
                color: mindfulnessOn ? 'var(--color-gold)' : 'var(--color-ink-muted)',
                border: `1px solid ${mindfulnessOn ? 'rgba(184,134,11,0.35)' : 'rgba(44,24,16,0.15)'}`,
                fontWeight: mindfulnessOn ? 700 : 500
              }}
              title={mindfulnessOn ? (isEn ? '10s Mindful countdown enabled' : 'Đang bật tịnh tâm 10s') : (isEn ? 'Mindfulness skipped' : 'Đã tắt tịnh tâm')}
            >
              <span>🧘</span>
              <span>{mindfulnessOn ? (isEn ? 'Mindful 10s: ON' : 'Tịnh tâm 10s: Bật') : (isEn ? 'Mindful 10s: OFF' : 'Tịnh tâm: Tắt')}</span>
            </button>
          </div>

          {/* Cast Mode Selector */}
          <div style={{
            display: 'flex',
            background: 'rgba(44,24,16,0.06)',
            borderRadius: 20,
            padding: 2,
            border: '1px solid rgba(184,134,11,0.2)'
          }}>
            <button
              type="button"
              onClick={() => !isCasting && setCastMode('sequential')}
              disabled={isCasting}
              style={{
                background: castMode === 'sequential' ? 'var(--color-gold)' : 'transparent',
                color: castMode === 'sequential' ? '#fff' : 'var(--color-ink-muted)',
                border: 'none',
                borderRadius: 16,
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: isCasting ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isEn ? 'Step-by-step (6 lines)' : 'Tuần tự 6 hào'}
            </button>
            <button
              type="button"
              onClick={() => !isCasting && setCastMode('instant')}
              disabled={isCasting}
              style={{
                background: castMode === 'instant' ? 'var(--color-gold)' : 'transparent',
                color: castMode === 'instant' ? '#fff' : 'var(--color-ink-muted)',
                border: 'none',
                borderRadius: 16,
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: isCasting ? 'default' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isEn ? 'Instant 1-Click' : '1 Chạm nhanh'}
            </button>
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
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(184,134,11,0.25)',
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
      </div>

      {/* Main CTA Button */}
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

      {disabled && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-vermillion)', textAlign: 'center', margin: 0, fontWeight: 600 }}>
          {t('panel.need_question_warning', '⚠ Vui lòng nhập việc cần xem trước khi gieo quẻ')}
        </p>
      )}

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
