import React, { useMemo, useState, useEffect } from 'react';
import { analyzeLucHao } from '../logic/lucHaoAnalysis.js';
import { TOPICS } from '../data/lucHaoRules.js';
import { GLOSSARY } from '../data/glossary.js';

const VERDICT_LABEL = { cat: 'Cát', binh: 'Bình', hung: 'Hung' };
const VERDICT_COLOR = { cat: 'var(--color-jade)', binh: '#7b6f3a', hung: 'var(--color-vermillion)' };

const btn = (active) => ({
  background: active ? 'var(--color-gold, #b8860b)' : 'rgba(184,134,11,0.07)',
  color: active ? '#fff' : 'var(--color-ink, #2c2621)',
  border: '1px solid ' + (active ? 'var(--color-gold, #b8860b)' : 'rgba(184,134,11,0.3)'),
  padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
});

/**
 * Chế độ Học: stepper phân tích Lục Hào từng bước + "Đọc thử trước".
 * Props: result, onHighlight(indices[]), onLearn(termKey)
 */
export default function LearnPanel({ result, onHighlight, onLearn }) {
  const [topic, setTopic] = useState('general');
  const [stepIdx, setStepIdx] = useState(0);
  const [guess, setGuess] = useState(null); // null = chưa đoán
  const [started, setStarted] = useState(false);

  const analysis = useMemo(() => analyzeLucHao(result, topic), [result, topic]);

  // Reset khi đổi quẻ / chủ đề
  useEffect(() => { setStepIdx(0); setGuess(null); setStarted(false); }, [result, topic]);

  const step = analysis?.steps[stepIdx];
  useEffect(() => {
    onHighlight?.(started && step ? step.refs : []);
    return () => onHighlight?.([]);
  }, [step, started, onHighlight]);

  if (!analysis) return null;

  const last = stepIdx === analysis.steps.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label htmlFor="learn-topic" style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', display: 'block', marginBottom: 4 }}>
          Bạn hỏi về chủ đề gì?
        </label>
        <select
          id="learn-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(184,134,11,0.35)', fontSize: '0.9rem' }}
        >
          {Object.entries(TOPICS).map(([k, v]) => (
            <option key={k} value={k}>{v.label} → Dụng Thần: {v.dungThan}</option>
          ))}
        </select>
      </div>

      {/* Đọc thử trước */}
      {guess === null && !started && (
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(184,134,11,0.07)', border: '1px dashed rgba(184,134,11,0.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🎯 Đọc thử trước: theo bạn quẻ này Cát hay Hung?</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(VERDICT_LABEL).map(([k, label]) => (
              <button key={k} type="button" id={`learn-guess-${k}`} style={btn(false)} onClick={() => { setGuess(k); setStarted(true); }}>
                {label}
              </button>
            ))}
            <button type="button" id="learn-skip-guess" style={{ ...btn(false), fontWeight: 500 }} onClick={() => { setGuess('skip'); setStarted(true); }}>
              Bỏ qua, xem giải thích
            </button>
          </div>
        </div>
      )}

      {started && step && (
        <div className="animate-in" style={{ padding: 16, borderRadius: 10, border: '1px solid rgba(184,134,11,0.3)', background: '#fff8' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
            Bước {stepIdx + 1}/{analysis.steps.length}
          </div>
          <h4 style={{ margin: '0 0 8px', fontFamily: "'Noto Serif', serif", color: 'var(--color-vermillion)' }}>{step.title}</h4>

          {step.id === 'ket-luan' ? (
            <>
              <p style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: VERDICT_COLOR[analysis.verdict] }}>
                {step.finding}
              </p>
              {guess && guess !== 'skip' && (
                <p style={{ margin: '0 0 8px', fontWeight: 700 }}>
                  {guess === analysis.verdict
                    ? '✅ Chính xác! Bạn đoán đúng.'
                    : `❌ Bạn đoán ${VERDICT_LABEL[guess]}, phân tích cho ${VERDICT_LABEL[analysis.verdict]}. Xem lại các bước để hiểu vì sao.`}
                </p>
              )}
            </>
          ) : (
            <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{step.finding}</p>
          )}
          {step.why && <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>💭 {step.why}</p>}

          {step.glossary.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {step.glossary.filter((k) => GLOSSARY[k]).map((k) => (
                <button
                  key={k} type="button" onClick={() => onLearn?.(k)}
                  style={{ ...btn(false), padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  📖 {GLOSSARY[k].title}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button type="button" id="learn-prev" style={{ ...btn(false), opacity: stepIdx === 0 ? 0.4 : 1 }} disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)}>
              ← Trước
            </button>
            {!last ? (
              <button type="button" id="learn-next" style={btn(true)} onClick={() => setStepIdx((i) => i + 1)}>
                Tiếp →
              </button>
            ) : (
              <button type="button" id="learn-restart" style={btn(false)} onClick={() => { setStepIdx(0); setGuess(null); setStarted(false); }}>
                ↺ Học lại
              </button>
            )}
          </div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
        Đây là cách phân tích đơn giản để học. Thầy xem quẻ còn xét thêm nhiều yếu tố khác.
      </p>
    </div>
  );
}
