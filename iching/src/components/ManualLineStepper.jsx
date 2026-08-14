import React, { useState } from 'react';
import { castOneLine, coinsToLine, COIN_LABELS, LINE_TYPE_LABELS } from '../logic/castLines.js';
import HexagramDisplay from './HexagramDisplay.jsx';
import AncientCoin3D from './AncientCoin3D.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { soundEngine } from '../utils/soundEffects.js';

const YAO_NAMES_VI = ['Hào Sơ (1)', 'Hào Nhị (2)', 'Hào Tam (3)', 'Hào Tứ (4)', 'Hào Ngũ (5)', 'Hào Thượng (6)'];
const YAO_NAMES_EN = ['1st Line (Initial)', '2nd Line', '3rd Line', '4th Line', '5th Line (Ruler)', '6th Line (Top)'];

/**
 * Stepper gieo từng hào 6 bước với 3D Coins và Âm thanh đồng tiền
 */
export default function ManualLineStepper({ completedLines, onLineAdded, onReset, disabled, algorithm = 'three-coin' }) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const currentStep = completedLines.length; // 0..5
  const isDone      = completedLines.length === 6;

  const [isTossing, setIsTossing]       = useState(false);
  const [currentCoins, setCurrentCoins] = useState(['ngua', 'ngua', 'ngua']);
  const [manualCoins, setManualCoins]   = useState(['ngua', 'sap', 'ngua']);
  const [manualMode, setManualMode]     = useState(false);
  const [lastLine, setLastLine]         = useState(null);
  const [soundOn, setSoundOn]           = useState(soundEngine.isSoundEnabled());

  function handleToggleSound() {
    const next = soundEngine.toggleSound();
    setSoundOn(next);
  }

  async function handleToss() {
    if (isTossing || isDone || disabled) return;
    setIsTossing(true);
    setLastLine(null);

    // 1. Phát âm thanh tung xu lên không trung
    soundEngine.playCoinToss();

    // 2. Tính kết quả hào
    const line = { index: currentStep + 1, ...castOneLine(algorithm) };

    // Chờ xu bay trong không gian 3D
    await new Promise(r => setTimeout(r, 680));

    // 3. Xu rơi chạm đĩa -> phát tiếng kim loại leng keng & đổi mặt
    setCurrentCoins(line.coins);
    soundEngine.playCoinClink();
    setIsTossing(false);
    setLastLine(line);

    // Nếu là hào thứ 6 (hào cuối cùng) -> phát chuông khánh ngân vang
    if (currentStep === 5) {
      setTimeout(() => {
        soundEngine.playHexagramComplete();
      }, 500);
    }

    setTimeout(() => {
      onLineAdded(line);
      setLastLine(null);
    }, 1100);
  }

  function handleManualSubmit() {
    if (manualCoins.some(c => !c)) return;
    const line = { index: currentStep + 1, ...coinsToLine(manualCoins) };
    soundEngine.playCoinClink(1.1);

    if (currentStep === 5) {
      setTimeout(() => {
        soundEngine.playHexagramComplete();
      }, 300);
    }

    onLineAdded(line);
    setManualCoins(['ngua', 'sap', 'ngua']);
    setManualMode(false);
  }

  function toggleManualCoin(index) {
    const next = [...manualCoins];
    next[index] = next[index] === 'ngua' ? 'sap' : 'ngua';
    setManualCoins(next);
    soundEngine.playSingleCoinLand(0, 1.2, 0.25);
  }

  const yaoNames = isEn ? YAO_NAMES_EN : YAO_NAMES_VI;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

      {/* ─── Stepper 6 Hào ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '0 4px' }}>
        {Array.from({ length: 6 }).map((_, idx) => {
          const done   = idx < completedLines.length;
          const active = idx === currentStep && !isDone;
          const stepLabel = `${t('result.col_yao', 'Hào')} ${idx + 1}`;
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* Connector line */}
              {idx < 5 && (
                <div style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  right: '-50%',
                  height: 2,
                  background: done ? 'var(--color-jade)' : 'rgba(184,134,11,0.2)',
                  transition: 'background 0.4s',
                  zIndex: 0,
                }} />
              )}
              {/* Dot */}
              <div className={`stepper-dot ${active ? 'active' : done ? 'done' : ''}`} style={{ zIndex: 1, width: 32, height: 32, fontSize: '0.85rem' }}>
                {done ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.68rem',
                marginTop: 4,
                color: active ? 'var(--color-vermillion)' : done ? 'var(--color-jade)' : 'var(--color-ink-muted)',
                fontWeight: active || done ? 700 : 500,
                textAlign: 'center',
              }}>
                {stepLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Đĩa Gieo 3 Đồng Xu 3D Tương Tác ─── */}
      {!isDone && (
        <div style={{
          width: '100%',
          maxWidth: 460,
          margin: '0 auto',
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
          {/* Header trong đĩa: Sound toggle & chế độ */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <button
              type="button"
              onClick={handleToggleSound}
              className="btn-ghost"
              style={{
                padding: '3px 9px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 16,
                background: soundOn ? 'rgba(26,107,74,0.1)' : 'rgba(44,24,16,0.06)',
                color: soundOn ? 'var(--color-jade)' : 'var(--color-ink-muted)',
                border: `1px solid ${soundOn ? 'rgba(26,107,74,0.3)' : 'rgba(44,24,16,0.15)'}`
              }}
            >
              <span>{soundOn ? '🔊' : '🔇'}</span>
              <span>{soundOn ? (isEn ? 'Sound on' : 'Bật tiếng') : (isEn ? 'Muted' : 'Tắt tiếng')}</span>
            </button>

            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-vermillion)',
              background: 'rgba(192,57,43,0.08)',
              padding: '3px 10px',
              borderRadius: 12,
              border: '1px solid rgba(192,57,43,0.2)'
            }}>
              🪙 {yaoNames[currentStep] || `Hào ${currentStep + 1}`}
            </div>
          </div>

          {/* 3 Đồng Xu 3D */}
          {!manualMode ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
              padding: '16px 10px',
              minHeight: 110,
              position: 'relative'
            }}>
              {currentCoins.map((coinFace, idx) => (
                <AncientCoin3D
                  key={idx}
                  face={coinFace}
                  isTossing={isTossing}
                  size={68}
                  delay={idx * 0.08}
                  showLabel={!isTossing}
                  disabled={isTossing}
                />
              ))}
            </div>
          ) : (
            /* Chế độ nhập tay: Bấm trực tiếp vào đồng tiền 3D để lật mặt */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              width: '100%'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                {isEn ? '👉 Tap coins to flip Heads (3) / Tails (2):' : '👉 Chạm vào từng đồng xu để lật Ngửa (3) / Sấp (2):'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                {manualCoins.map((coinFace, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <AncientCoin3D
                      face={coinFace}
                      size={64}
                      onClick={() => toggleManualCoin(idx)}
                      showLabel={true}
                    />
                  </div>
                ))}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--color-ink)',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.7)',
                padding: '4px 14px',
                borderRadius: 14,
                border: '1px solid rgba(184,134,11,0.2)'
              }}>
                {isEn ? 'Total Points:' : 'Tổng điểm:'} {manualCoins.reduce((s, c) => s + (c === 'ngua' ? 3 : 2), 0)} (
                {t('lineType.' + coinsToLine(manualCoins).type, LINE_TYPE_LABELS[coinsToLine(manualCoins).type])})
              </div>
            </div>
          )}

          {/* Hào vừa gieo xong */}
          {lastLine && !isTossing && (
            <div className="animate-in" style={{
              marginTop: 10,
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 20,
              border: '1px solid rgba(192,57,43,0.3)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-vermillion)' }}>
                {lastLine.yinYang === 'yang' ? '—' : '══'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink)', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-vermillion)' }}>{yaoNames[lastLine.index - 1]}: </span>
                <span>{t('lineType.' + lastLine.type, LINE_TYPE_LABELS[lastLine.type])}</span>
                <span style={{ color: 'var(--color-gold)', marginLeft: 6 }}>
                  ({lastLine.coins?.map(c => c === 'ngua' ? '3' : '2').join('+')} = {lastLine.total})
                </span>
                {lastLine.moving && <span style={{ color: 'var(--color-vermillion)', fontWeight: 700 }}> (Động!)</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tiến trình 6 vạch quẻ hiện tại */}
      {completedLines.length > 0 && (
        <div style={{
          padding: '14px 20px',
          background: 'rgba(26,107,74,0.04)',
          borderRadius: 12,
          border: '1px solid rgba(26,107,74,0.18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 380,
          margin: '0 auto',
          width: '100%',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 240, marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-jade)', fontWeight: 700 }}>
              {t('stepper.cast_so_far', 'Đã gieo')} ({completedLines.length}/6):
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
              {yaoNames[completedLines.length - 1]}
            </span>
          </div>
          <div style={{ width: '100%', maxWidth: 240 }}>
            <HexagramDisplay lines={completedLines.map((l, i) => ({ ...l, index: l.index || i+1 }))} size="md" showIndex />
          </div>
        </div>
      )}

      {/* Cảnh báo khi chưa nhập việc cần xem */}
      {disabled && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(192,57,43,0.08)',
          borderRadius: 8,
          border: '1px solid rgba(192,57,43,0.2)',
          fontSize: '0.8125rem',
          color: 'var(--color-vermillion)',
          textAlign: 'center',
          fontWeight: 600
        }}>
          {t('panel.need_question_warning', '⚠ Hãy nhập việc cần xem trước khi gieo quẻ')}
        </div>
      )}

      {/* Nút hành động */}
      {!isDone && !disabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {!manualMode ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleToss}
                disabled={isTossing}
                className="btn-primary btn-cta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '1.05rem',
                  padding: '14px 32px',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(184,134,11,0.25)',
                  cursor: isTossing ? 'not-allowed' : 'pointer'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🪙</span>
                <span>
                  {isTossing
                    ? t('stepper.toss_active', 'Đang tung xu...')
                    : (isEn ? `Toss 3 Coins (${yaoNames[currentStep]})` : `Tung 3 Đồng Xu (${yaoNames[currentStep]})`)}
                </span>
              </button>
              <button
                className="btn-ghost"
                onClick={() => setManualMode(true)}
                style={{ padding: '12px 18px', fontSize: '0.875rem' }}
              >
                {t('stepper.manual_btn', '✍ Chọn mặt tay')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                className="btn-primary"
                style={{ fontSize: '0.9rem', padding: '10px 24px', borderRadius: 10 }}
                onClick={handleManualSubmit}
              >
                {t('manual_input.submit', 'Xác nhận Hào')}
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: '0.9rem', padding: '10px 18px' }}
                onClick={() => setManualMode(false)}
              >
                {t('manual_input.cancel', 'Huỷ')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hoàn tất 6 hào */}
      {isDone && (
        <div className="animate-in" style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: 8, fontWeight: 700, color: 'var(--color-jade)' }}>
            {t('stepper.done', '✅ Đã gieo đủ 6 hào!')}
          </div>
          <button className="btn-ghost" onClick={onReset} style={{ fontSize: '0.875rem' }}>
            {t('stepper.recast', '🔄 Gieo lại')}
          </button>
        </div>
      )}

      {/* Nút Bắt đầu lại giữa chừng */}
      {!isDone && completedLines.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <button className="btn-ghost" onClick={onReset} style={{ fontSize: '0.8125rem' }}>
            {t('stepper.restart', '↺ Bắt đầu lại')}
          </button>
        </div>
      )}
    </div>
  );
}
