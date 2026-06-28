import React, { useState } from 'react';
import { castOneLine, coinsToLine, COIN_LABELS, LINE_TYPE_LABELS } from '../logic/castLines.js';
import HexagramDisplay from './HexagramDisplay.jsx';

const STEP_LABELS = ['Hào 1', 'Hào 2', 'Hào 3', 'Hào 4', 'Hào 5', 'Hào 6'];

/**
 * Stepper gieo từng hào 6 bước
 * completedLines: mảng các hào đã gieo [{index, yinYang, moving, type, coins, total}]
 * onLineAdded: callback(line)
 * onReset: callback
 */
export default function ManualLineStepper({ completedLines, onLineAdded, onReset, disabled }) {
  const currentStep = completedLines.length; // 0..5
  const isDone      = completedLines.length === 6;

  const [isAnimating, setIsAnimating]   = useState(false);
  const [manualCoins, setManualCoins]   = useState(['', '', '']);
  const [manualMode, setManualMode]     = useState(false);
  const [lastLine, setLastLine]         = useState(null);

  async function handleToss() {
    if (isAnimating || isDone) return;
    setIsAnimating(true);
    setLastLine(null);
    await new Promise(r => setTimeout(r, 700));
    const line = { index: currentStep + 1, ...castOneLine() };
    setLastLine(line);
    setIsAnimating(false);
    setTimeout(() => {
      onLineAdded(line);
      setLastLine(null);
      setManualCoins(['', '', '']);
    }, 1200);
  }

  function handleManualSubmit() {
    if (manualCoins.some(c => !c)) return;
    const line = { index: currentStep + 1, ...coinsToLine(manualCoins) };
    onLineAdded(line);
    setManualCoins(['', '', '']);
    setManualMode(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stepper header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {STEP_LABELS.map((label, idx) => {
          const done   = idx < completedLines.length;
          const active = idx === currentStep && !isDone;
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
              <div className={`stepper-dot ${active ? 'active' : done ? 'done' : ''}`} style={{ zIndex: 1 }}>
                {done ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.65rem',
                marginTop: 4,
                color: active ? 'var(--color-vermillion)' : done ? 'var(--color-jade)' : 'var(--color-ink-muted)',
                fontWeight: active || done ? 700 : 400,
                textAlign: 'center',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Đã gieo — preview mini */}
      {completedLines.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(26,107,74,0.06)', borderRadius: 8, border: '1px solid rgba(26,107,74,0.15)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-jade)', fontWeight: 700, marginBottom: 6 }}>
            Đã gieo ({completedLines.length}/6):
          </div>
          <HexagramDisplay lines={completedLines.map((l, i) => ({ ...l, index: i+1 }))} size="sm" showIndex />
        </div>
      )}

      {/* Kết quả hào vừa tung */}
      {lastLine && (
        <div className="animate-in" style={{
          padding: '12px 16px',
          background: 'rgba(192,57,43,0.08)',
          borderRadius: 8,
          border: '1px solid rgba(192,57,43,0.2)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '1.5rem' }}>
            {lastLine.yinYang === 'yang' ? '—' : '══'}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-vermillion)' }}>
              Hào {lastLine.index}: {LINE_TYPE_LABELS[lastLine.type]}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
              {lastLine.coins?.map(c => COIN_LABELS[c]).join(' + ')} = {lastLine.total}
              {lastLine.moving && ' — Hào động!'}
            </div>
          </div>
        </div>
      )}

      {/* Chặn gieo khi chưa nhập việc cần xem */}
      {disabled && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(192,57,43,0.08)',
          borderRadius: 8,
          border: '1px solid rgba(192,57,43,0.2)',
          fontSize: '0.8125rem',
          color: 'var(--color-vermillion)',
          textAlign: 'center',
        }}>
          ⚠ Hãy nhập việc cần xem trước khi gieo quẻ
        </div>
      )}

      {/* Controls */}
      {!isDone && !disabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--color-ink-muted)',
            textAlign: 'center',
          }}>
            Đang gieo: Hào {currentStep + 1}
          </div>

          {!manualMode ? (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleToss}
                disabled={isAnimating}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {isAnimating ? '🪙 Đang tung...' : '🪙 Tung xu'}
              </button>
              <button
                className="btn-ghost"
                onClick={() => setManualMode(true)}
              >
                ✍ Nhập tay
              </button>
            </div>
          ) : (
            <ManualInput
              coins={manualCoins}
              onChange={setManualCoins}
              onSubmit={handleManualSubmit}
              onCancel={() => setManualMode(false)}
            />
          )}
        </div>
      )}

      {isDone && (
        <div className="animate-in" style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>✅ Đã gieo đủ 6 hào!</div>
          <button className="btn-ghost" onClick={onReset} style={{ fontSize: '0.875rem' }}>
            🔄 Gieo lại
          </button>
        </div>
      )}

      {/* Reset mid-way */}
      {!isDone && completedLines.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <button className="btn-ghost" onClick={onReset} style={{ fontSize: '0.8125rem' }}>
            ↺ Bắt đầu lại
          </button>
        </div>
      )}
    </div>
  );
}

function ManualInput({ coins, onChange, onSubmit, onCancel }) {
  const options = ['ngua', 'sap'];
  function setCoin(i, v) {
    const next = [...coins];
    next[i] = v;
    onChange(next);
  }

  return (
    <div style={{ padding: '14px 16px', background: 'rgba(184,134,11,0.07)', borderRadius: 8, border: '1px solid rgba(184,134,11,0.2)' }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', marginBottom: 10 }}>
        Nhập kết quả 3 đồng xu:
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, justifyContent: 'center' }}>
        {coins.map((c, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Xu {i+1}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setCoin(i, opt)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: c === opt ? '2px solid var(--color-gold)' : '2px solid transparent',
                    cursor: 'pointer',
                    background: opt === 'ngua'
                      ? 'radial-gradient(circle at 35% 35%, #f5d78e, #b8860b)'
                      : 'radial-gradient(circle at 35% 35%, #aaa, #555)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    transition: 'all 0.15s',
                    transform: c === opt ? 'scale(1.12)' : 'scale(1)',
                    boxShadow: c === opt ? '0 0 0 3px rgba(184,134,11,0.3)' : 'none',
                  }}
                >
                  {opt === 'ngua' ? 'N' : 'S'}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-muted)' }}>
              {c ? (c === 'ngua' ? 'Ngửa(3)' : 'Sấp(2)') : '—'}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '0.875rem', padding: '8px 20px' }}
          onClick={onSubmit}
          disabled={coins.some(c => !c)}
        >
          Xác nhận hào này
        </button>
        <button className="btn-ghost" style={{ fontSize: '0.875rem' }} onClick={onCancel}>
          Huỷ
        </button>
      </div>
    </div>
  );
}
