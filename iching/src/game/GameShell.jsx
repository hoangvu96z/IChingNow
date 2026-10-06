import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStreak } from '@shared/utils/useStreak.js';
import {
  MODES, buildSession, dailySession, buildShareText,
} from './questionGenerators.js';
import {
  loadProgress, saveProgress, applyResult, rankFor, todayStr, BADGES, addReward,
} from './progress.js';
import BienQueGame from './bienQue/BienQueGame.jsx';
import { dailyPuzzle, loadStore as loadBQ, glyph } from './bienQue/bienQueLogic.js';

const gold = 'var(--color-gold, #b8860b)';

const btn = (active, extra = {}) => ({
  background: active ? gold : 'rgba(184,134,11,0.07)',
  color: active ? '#fff' : 'var(--color-ink, #2c2621)',
  border: '1px solid ' + (active ? gold : 'rgba(184,134,11,0.3)'),
  padding: '10px 16px', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700,
  cursor: 'pointer', transition: 'all 0.2s ease', ...extra,
});

/** Vẽ 6 hào, hào 1 ở dưới cùng. moving: danh sách hào động (hiện dấu ●). */
function HexLines({ binary, highlight, moving = [], highlightLabel }) {
  const bits = binary.split('');
  return (
    <div style={{
      display: 'flex', flexDirection: 'column-reverse', gap: 6, alignItems: 'center',
      margin: '10px 0 16px', padding: '14px 0', borderRadius: 12,
      background: 'linear-gradient(135deg, rgba(184,134,11,0.05), rgba(184,134,11,0.02))',
    }}>
      {bits.map((b, i) => {
        const hl = highlight === i + 1;
        const mv = moving.includes(i + 1);
        const lineColor = hl ? 'var(--color-vermillion)' : mv ? '#d4a017' : 'var(--color-ink, #2c2621)';
        return (
          <div
            key={i}
            className="animate-in"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              animationDelay: `${(5 - i) * 60}ms`,
            }}
          >
            <span style={{
              width: 44, textAlign: 'right', fontSize: '0.7rem', fontWeight: hl ? 800 : 400,
              color: hl ? 'var(--color-vermillion)' : mv ? '#d4a017' : 'var(--color-ink-muted)',
            }}>
              Hào {i + 1}
            </span>
            {b === '1' ? (
              <div style={{
                width: 120, height: 10, borderRadius: 3,
                background: lineColor,
                boxShadow: mv ? '0 0 8px rgba(212,160,23,0.4)' : 'none',
                transition: 'all 0.3s ease',
              }} />
            ) : (
              <div style={{ width: 120, display: 'flex', gap: 16 }}>
                <div style={{
                  flex: 1, height: 10, borderRadius: 3,
                  background: lineColor,
                  boxShadow: mv ? '0 0 8px rgba(212,160,23,0.4)' : 'none',
                }} />
                <div style={{
                  flex: 1, height: 10, borderRadius: 3,
                  background: lineColor,
                  boxShadow: mv ? '0 0 8px rgba(212,160,23,0.4)' : 'none',
                }} />
              </div>
            )}
            <span style={{ width: 80, fontSize: '0.7rem', fontWeight: 700 }}>
              {mv && <span title="Hào động" style={{ color: '#d4a017' }}>● động</span>}
              {hl && highlightLabel && <span style={{ display: 'block', color: 'var(--color-jade)', fontWeight: 800 }}>{highlightLabel}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Badge hiện loại mode đang chơi */
function ModeBadge({ type }) {
  const mode = MODES[type];
  if (!mode) return null;
  const colors = {
    1: { bg: 'rgba(184,134,11,0.15)', color: '#b8860b', border: 'rgba(184,134,11,0.3)' },
    2: { bg: 'rgba(192,57,43,0.1)', color: 'var(--color-vermillion)', border: 'rgba(192,57,43,0.3)' },
  };
  const c = colors[mode.stage] || colors[1];
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 8,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {mode.emoji} {mode.label}
    </span>
  );
}

/** Thanh tiến trình câu hỏi phía trên */
function ProgressBar({ current, total, results }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
      {Array.from({ length: total }, (_, i) => {
        let bg = 'rgba(184,134,11,0.15)';
        if (i < results.length) bg = results[i] ? 'var(--color-jade)' : 'var(--color-vermillion)';
        else if (i === current) bg = gold;
        return (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2, background: bg,
            transition: 'background 0.3s ease',
          }} />
        );
      })}
    </div>
  );
}

/** Hiệu ứng đếm XP khi kết thúc */
function AnimatedXP({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target <= 0) return;
    let frame;
    const start = performance.now();
    const dur = 800;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.round(p * target));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return <span>+{val} XP</span>;
}

/** Một câu hỏi: trả lời xong hiện đáp án + giải thích. */
function QuestionCard({ q, index, total, results, onAnswered }) {
  const [chosen, setChosen] = useState(null);
  const done = chosen !== null;

  const choose = (i) => {
    if (done) return;
    setChosen(i);
  };

  const correct = done && chosen === q.answerIndex;

  // Grid layout tùy số options
  const gridCols = (() => {
    const n = q.options.length;
    if (n <= 3) return `repeat(${n}, 1fr)`;
    if (n === 4) return 'repeat(2, 1fr)';
    if (n === 5) return 'repeat(3, 1fr)';
    if (n === 6) return 'repeat(3, 1fr)';
    return 'repeat(2, 1fr)';
  })();

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProgressBar current={index} total={total} results={results} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Câu {index + 1}/{total}</span>
        <ModeBadge type={q.type} />
      </div>
      <h3 style={{ margin: 0, fontFamily: "'Noto Serif', serif", fontSize: '1.05rem', lineHeight: 1.5 }}>{q.prompt}</h3>
      {q.binary && (
        <HexLines
          binary={q.binary}
          moving={q.moving}
          highlight={q.revealHighlight && !done ? undefined : q.highlight}
          highlightLabel={q.revealHighlight ? 'Dụng Thần' : undefined}
        />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10 }}>
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answerIndex;
          const isChosen = i === chosen;
          let style = btn(false, { textAlign: 'center', position: 'relative' });
          if (done && isAnswer) style = btn(false, {
            textAlign: 'center', position: 'relative',
            background: 'rgba(26,107,74,0.18)', borderColor: 'var(--color-jade)', color: 'var(--color-jade)',
            transform: 'scale(1.03)', boxShadow: '0 2px 12px rgba(26,107,74,0.15)',
          });
          else if (done && isChosen) style = btn(false, {
            textAlign: 'center', position: 'relative',
            background: 'rgba(192,57,43,0.15)', borderColor: 'var(--color-vermillion)', color: 'var(--color-vermillion)',
          });
          else if (done) style = btn(false, { textAlign: 'center', opacity: 0.4, cursor: 'default' });
          return (
            <button key={opt} type="button" id={`game-opt-${i}`} style={style} onClick={() => choose(i)} disabled={done}>
              {done && isAnswer && <span style={{ position: 'absolute', top: -8, right: -8, fontSize: '1.1rem' }}>✓</span>}
              {done && isChosen && !isAnswer && <span style={{ position: 'absolute', top: -8, right: -8, fontSize: '1.1rem' }}>✗</span>}
              {opt}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="animate-in" style={{
          padding: 14, borderRadius: 12,
          background: correct ? 'rgba(26,107,74,0.08)' : 'rgba(192,57,43,0.06)',
          border: `1px solid ${correct ? 'rgba(26,107,74,0.25)' : 'rgba(192,57,43,0.2)'}`,
        }}>
          <div style={{
            fontWeight: 800, marginBottom: 6, fontSize: '1rem',
            color: correct ? 'var(--color-jade)' : 'var(--color-vermillion)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: '1.3rem' }}>{correct ? '✅' : '❌'}</span>
            {correct ? 'Chính xác!' : 'Chưa đúng'}
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-line', color: 'var(--color-ink)' }}>{q.explain}</div>
          <button
            type="button" id="game-next"
            style={btn(true, { marginTop: 12, width: '100%', fontSize: '1rem', padding: '12px 16px' })}
            onClick={() => onAnswered(correct)}
          >
            {index + 1 === total ? '📊 Xem kết quả' : 'Câu tiếp →'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Game "Luyện Dịch" – lớp phủ toàn màn hình.
 * Props: onExit
 */
export default function GameShell({ onExit }) {
  const [progress, setProgress] = useState(loadProgress);
  const { streak, recordActivity } = useStreak('iching-game');
  const [screen, setScreen] = useState('menu'); // menu | play | summary
  const [session, setSession] = useState({ questions: [], mode: null, daily: false });
  const [qIdx, setQIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showBQ, setShowBQ] = useState(false);

  const reward = useCallback(({ xp, badges }) => {
    const out = addReward(progress, { xp, badges });
    setProgress(out.progress);
    saveProgress(out.progress);
    if (xp > 0) recordActivity();
    return out.newBadges;
  }, [progress, recordActivity]);

  const today = todayStr();
  const dailyDone = progress.daily[today];
  const rank = rankFor(progress.xp);
  const bqDaily = dailyPuzzle(today);
  const bqStore = loadBQ();
  const bqDone = bqStore.daily[today];

  const start = useCallback((mode, daily = false) => {
    const questions = daily ? dailySession(today) : buildSession(mode, MODES[mode]?.count || 10, Date.now() & 0xffffffff);
    setSession({ questions, mode, daily });
    setQIdx(0); setResults([]); setSummary(null); setCopied(false);
    setScreen('play');
  }, [today]);

  const onAnswered = (ok) => {
    const next = [...results, ok];
    if (qIdx + 1 < session.questions.length) {
      setResults(next); setQIdx(qIdx + 1);
      return;
    }
    const out = applyResult(progress, { results: next, daily: session.daily, date: today });
    setProgress(out.progress); saveProgress(out.progress);
    recordActivity();
    setResults(next);
    setSummary(out);
    setScreen('summary');
  };

  const share = async () => {
    const text = buildShareText(results, today, window.location.origin);
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch { /* người dùng huỷ */ }
  };

  const panel = { background: 'var(--color-paper, #fffaf0)', borderRadius: 16, padding: 20, border: '1px solid rgba(184,134,11,0.25)' };
  const correctCount = results.filter(Boolean).length;
  const pctCorrect = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Luyện Dịch"
      style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'rgba(20,14,6,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 14px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f5d78e' }}>
          <h2 style={{ margin: 0, fontFamily: "'Noto Serif', serif" }}>🎮 Luyện Dịch</h2>
          <button type="button" id="game-exit" onClick={onExit} style={btn(false, { background: 'rgba(255,255,255,0.12)', color: '#f5d78e', borderColor: 'rgba(245,215,142,0.4)', padding: '6px 14px' })}>
            ✕ Đóng
          </button>
        </div>

        {screen === 'menu' && (
          <>
            {/* ── Rank & Progress ── */}
            <div style={panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{rank.emoji} {rank.name}</div>
                <div style={{ fontSize: '0.9rem' }}>🔥 {streak} ngày</div>
              </div>
              <div style={{ height: 8, background: 'rgba(184,134,11,0.15)', borderRadius: 4, margin: '10px 0 4px', overflow: 'hidden' }}>
                <div style={{ width: `${rank.pct}%`, height: '100%', background: `linear-gradient(90deg, #b8860b, #d4a017)`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                {progress.xp} XP{rank.next ? ` · còn ${rank.next.min - progress.xp} XP lên ${rank.next.name}` : ' · cấp cao nhất'}
                {' · '}đúng {progress.correct}/{progress.answered} câu
              </div>
              {progress.badges.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {progress.badges.map((b) => (
                    <span key={b} title={BADGES[b]?.desc} style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 12, background: 'rgba(184,134,11,0.12)' }}>
                      {BADGES[b]?.emoji} {BADGES[b]?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Biến Quẻ ── */}
            <button
              type="button" id="game-open-bienque" onClick={() => setShowBQ(true)}
              style={{
                position: 'relative', overflow: 'hidden', textAlign: 'left', cursor: 'pointer',
                borderRadius: 20, padding: 20, color: '#ece6d2',
                border: '1px solid rgba(242,200,107,0.55)',
                background: 'radial-gradient(ellipse at 20% -10%, #3a40a0 0%, transparent 60%), linear-gradient(160deg, #1d2160, #0b0e2a)',
                boxShadow: '0 10px 40px rgba(11,14,42,0.6), 0 0 30px rgba(242,200,107,0.15)',
              }}
            >
              <span aria-hidden="true" style={{ position: 'absolute', right: 10, top: -18, fontSize: '7rem', color: 'rgba(242,200,107,0.1)', fontFamily: "'Noto Serif', serif" }}>
                {glyph(bqDaily.target)}
              </span>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f2c86b' }}>Game mới</span>
              <span style={{ display: 'block', fontFamily: "'Noto Serif', serif", fontSize: '1.6rem', fontWeight: 800, color: '#ffe7a8', margin: '2px 0 4px' }}>
                🌙 Biến Quẻ
              </span>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#a9a6c9', lineHeight: 1.5 }}>
                Biến quẻ này thành quẻ kia bằng Động hào, Thác, Tổng, Hỗ. Phá phong ấn, giành 3 sao, thuộc 64 quẻ lúc nào không hay.
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: '0.85rem' }}>
                <span style={{ fontSize: '1.5rem', color: '#f2c86b' }}>{glyph(bqDaily.start)} ➜ {glyph(bqDaily.target)}</span>
                <span>
                  Đề hôm nay #{bqDaily.number}
                  {bqDone ? ` · đã giải ${'⭐'.repeat(bqDone.stars)}` : ` · tối ưu ${bqDaily.optimal} nước`}
                </span>
              </span>
              <span style={{ display: 'inline-block', marginTop: 14, padding: '10px 18px', borderRadius: 12, fontWeight: 800, color: '#2a1b05', background: 'linear-gradient(180deg,#ffe7a8,#f2c86b 50%,#b9852a)' }}>
                Chơi ngay →
              </span>
            </button>

            {/* ── Ôn nền tảng (Stage 1) ── */}
            <div style={panel}>
              <div style={{ fontWeight: 800, marginBottom: 4, fontSize: '1.05rem' }}>📝 Ôn nền tảng</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: 10 }}>
                Trắc nghiệm 10 câu để ôn tên quẻ, Ngũ Hành, Nạp Giáp.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.values(MODES).filter((m) => m.stage === 1).map((m) => (
                  <button key={m.id} type="button" id={`game-mode-${m.id}`} style={btn(false, { textAlign: 'left' })} onClick={() => start(m.id)}>
                    <span style={{ fontSize: '1.1rem', marginRight: 8 }}>{m.emoji}</span>
                    {m.label}
                    <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 28 }}>{m.desc}</span>
                  </button>
                ))}
                <button type="button" id="game-daily" style={btn(false, { textAlign: 'left' })} onClick={() => start('mix', true)}>
                  <span style={{ fontSize: '1.1rem', marginRight: 8 }}>📅</span>
                  Ôn nhanh hôm nay (5 câu)
                  {dailyDone && <span style={{ fontWeight: 400 }}> · {dailyDone.score}/{dailyDone.total}</span>}
                </button>
              </div>
            </div>

            {/* ── Luyện Lục Hào (Stage 2) ── */}
            <div style={{
              ...panel,
              borderColor: 'rgba(192,57,43,0.35)',
              background: 'linear-gradient(180deg, rgba(192,57,43,0.06), var(--color-paper, #fffaf0))',
              position: 'relative', overflow: 'hidden',
            }}>
              <span aria-hidden="true" style={{
                position: 'absolute', right: -10, top: -30, fontSize: '8rem', opacity: 0.04,
                fontFamily: "'Noto Serif', serif", color: 'var(--color-vermillion)',
              }}>六</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>🎓 Luyện Lục Hào</span>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--color-vermillion), #c0392b)',
                  color: '#fff', letterSpacing: '0.05em',
                }}>MỚI</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: 12 }}>
                Từng bước để tự xem quẻ: gọi tên Lục Thân → chọn Dụng Thần → tự đoán Cát/Hung.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.values(MODES).filter((m) => m.stage === 2).map((m, i) => (
                  <button
                    key={m.id} type="button" id={`game-mode-${m.id}`}
                    style={btn(false, {
                      textAlign: 'left', position: 'relative',
                      borderLeft: `3px solid ${i === 0 ? 'var(--color-jade)' : i === 1 ? '#d4a017' : 'var(--color-vermillion)'}`,
                    })}
                    onClick={() => start(m.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1.1rem' }}>{m.emoji}</span>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 6,
                        background: i === 0 ? 'rgba(26,107,74,0.15)' : i === 1 ? 'rgba(212,160,23,0.15)' : 'rgba(192,57,43,0.15)',
                        color: i === 0 ? 'var(--color-jade)' : i === 1 ? '#b8860b' : 'var(--color-vermillion)',
                      }}>
                        Bước {i + 1}
                      </span>
                      <span style={{ fontWeight: 700 }}>{m.label}</span>
                      <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}> · {m.count} câu</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 28, marginTop: 2 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Playing Screen ── */}
        {screen === 'play' && (
          <div style={panel}>
            <QuestionCard
              key={qIdx} q={session.questions[qIdx]} index={qIdx} total={session.questions.length}
              results={results}
              onAnswered={onAnswered}
            />
          </div>
        )}

        {/* ── Summary Screen ── */}
        {screen === 'summary' && summary && (
          <div style={{ ...panel, textAlign: 'center', position: 'relative', overflow: 'hidden' }} className="animate-in">
            {/* Background decoration */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              background: 'radial-gradient(circle at 50% 30%, var(--color-gold, #b8860b), transparent 70%)',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '3rem', marginBottom: 4 }}>
                {results.every(Boolean) ? '🏆' : pctCorrect >= 80 ? '🌟' : pctCorrect >= 50 ? '🎉' : '💪'}
              </div>
              <h3 style={{ margin: '4px 0', fontFamily: "'Noto Serif', serif", fontSize: '1.4rem' }}>
                {correctCount}/{results.length} câu đúng
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: 8 }}>
                {results.every(Boolean) ? 'Hoàn hảo! 🔥' : pctCorrect >= 80 ? 'Xuất sắc!' : pctCorrect >= 50 ? 'Khá tốt, luyện thêm!' : 'Cần ôn lại nhé!'}
              </div>

              {/* Visual result squares */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '12px 0' }}>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="animate-in"
                    style={{
                      width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 800,
                      background: r ? 'rgba(26,107,74,0.15)' : 'rgba(192,57,43,0.12)',
                      color: r ? 'var(--color-jade)' : 'var(--color-vermillion)',
                      border: `1px solid ${r ? 'rgba(26,107,74,0.3)' : 'rgba(192,57,43,0.25)'}`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    {r ? '✓' : '✗'}
                  </div>
                ))}
              </div>

              <div style={{
                fontWeight: 800, fontSize: '1.2rem',
                color: gold,
                padding: '8px 0',
              }}>
                {summary.gainedXp > 0 ? <AnimatedXP target={summary.gainedXp} /> : <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>Chơi lại đề cũ: không cộng XP</span>}
              </div>
              {summary.newBadges.length > 0 && (
                <div className="animate-in" style={{
                  margin: '8px auto', padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.25)',
                  display: 'inline-flex', gap: 8, alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>🏅 Huy hiệu mới:</span>
                  {summary.newBadges.map((b) => (
                    <span key={b} style={{ fontSize: '0.8rem' }}>{BADGES[b].emoji} {BADGES[b].label}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {session.daily && (
                  <button type="button" id="game-share" style={btn(true, { fontSize: '1rem' })} onClick={share}>
                    {copied ? '✓ Đã sao chép' : '📤 Chia sẻ kết quả'}
                  </button>
                )}
                <button type="button" id="game-again" style={btn(false)} onClick={() => start(session.mode, session.daily)}>
                  ↺ Chơi lại
                </button>
                <button type="button" id="game-menu" style={btn(false)} onClick={() => setScreen('menu')}>
                  ← Về menu
                </button>
              </div>
            </div>
          </div>
        )}

        {showBQ && (
          <BienQueGame
            onExit={() => setShowBQ(false)}
            onReward={reward}
          />
        )}
      </div>
    </div>
  );
}
