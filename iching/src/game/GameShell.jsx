import React, { useState, useCallback } from 'react';
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

/** Vẽ 6 hào, hào 1 ở dưới cùng. */
function HexLines({ binary, highlight }) {
  const bits = binary.split('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 8, alignItems: 'center', margin: '8px 0 16px' }}>
      {bits.map((b, i) => {
        const hl = highlight === i + 1;
        const bg = hl ? 'var(--color-vermillion)' : 'var(--color-ink, #2c2621)';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 44, textAlign: 'right', fontSize: '0.7rem', color: hl ? 'var(--color-vermillion)' : 'var(--color-ink-muted)', fontWeight: hl ? 800 : 400 }}>
              Hào {i + 1}
            </span>
            {b === '1' ? (
              <div style={{ width: 120, height: 10, background: bg, borderRadius: 3 }} />
            ) : (
              <div style={{ width: 120, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, height: 10, background: bg, borderRadius: 3 }} />
                <div style={{ flex: 1, height: 10, background: bg, borderRadius: 3 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Một câu hỏi: trả lời xong hiện đáp án + giải thích. */
function QuestionCard({ q, index, total, onAnswered }) {
  const [chosen, setChosen] = useState(null);
  const done = chosen !== null;

  const choose = (i) => {
    if (done) return;
    setChosen(i);
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Câu {index + 1}/{total}</div>
      <h3 style={{ margin: 0, fontFamily: "'Noto Serif', serif" }}>{q.prompt}</h3>
      {q.binary && <HexLines binary={q.binary} highlight={q.highlight} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answerIndex;
          const isChosen = i === chosen;
          let style = btn(false, { textAlign: 'center' });
          if (done && isAnswer) style = btn(false, { background: 'rgba(26,107,74,0.18)', borderColor: 'var(--color-jade)', color: 'var(--color-jade)' });
          else if (done && isChosen) style = btn(false, { background: 'rgba(192,57,43,0.15)', borderColor: 'var(--color-vermillion)', color: 'var(--color-vermillion)' });
          else if (done) style = btn(false, { opacity: 0.5, cursor: 'default' });
          return (
            <button key={opt} type="button" id={`game-opt-${i}`} style={style} onClick={() => choose(i)} disabled={done}>
              {opt}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="animate-in" style={{ padding: 12, borderRadius: 10, background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.25)' }}>
          <div style={{ fontWeight: 800, marginBottom: 4, color: chosen === q.answerIndex ? 'var(--color-jade)' : 'var(--color-vermillion)' }}>
            {chosen === q.answerIndex ? '✅ Chính xác!' : '❌ Chưa đúng'}
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{q.explain}</div>
          <button
            type="button" id="game-next" style={btn(true, { marginTop: 10, width: '100%' })}
            onClick={() => onAnswered(chosen === q.answerIndex)}
          >
            {index + 1 === total ? 'Xem kết quả' : 'Câu tiếp →'}
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

  const start = useCallback((mode, daily = false) => {
    const questions = daily ? dailySession(today) : buildSession(mode, 10, Date.now() & 0xffffffff);
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
            <div style={panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{rank.emoji} {rank.name}</div>
                <div style={{ fontSize: '0.9rem' }}>🔥 {streak} ngày</div>
              </div>
              <div style={{ height: 8, background: 'rgba(184,134,11,0.15)', borderRadius: 4, margin: '10px 0 4px', overflow: 'hidden' }}>
                <div style={{ width: `${rank.pct}%`, height: '100%', background: gold, transition: 'width 0.5s ease' }} />
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

            <div style={panel}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>📝 Ôn nhanh</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginBottom: 10 }}>
                Trắc nghiệm 10 câu để ôn tên quẻ, Ngũ Hành, Nạp Giáp.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.values(MODES).map((m) => (
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
          </>
        )}

        {screen === 'play' && (
          <div style={panel}>
            <QuestionCard
              key={qIdx} q={session.questions[qIdx]} index={qIdx} total={session.questions.length}
              onAnswered={onAnswered}
            />
          </div>
        )}

        {screen === 'summary' && summary && (
          <div style={{ ...panel, textAlign: 'center' }} className="animate-in">
            <div style={{ fontSize: '2.5rem' }}>{results.every(Boolean) ? '🏆' : '🎉'}</div>
            <h3 style={{ margin: '4px 0', fontFamily: "'Noto Serif', serif" }}>
              {results.filter(Boolean).length}/{results.length} câu đúng
            </h3>
            <div style={{ fontSize: '1.4rem', letterSpacing: 4, margin: '8px 0' }}>
              {results.map((r) => (r ? '🟩' : '🟥')).join('')}
            </div>
            <div style={{ fontWeight: 700, color: gold }}>
              {summary.gainedXp > 0 ? `+${summary.gainedXp} XP` : 'Chơi lại đề cũ: không cộng XP'}
            </div>
            {summary.newBadges.length > 0 && (
              <div style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                Huy hiệu mới: {summary.newBadges.map((b) => `${BADGES[b].emoji} ${BADGES[b].label}`).join(', ')}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {session.daily && (
                <button type="button" id="game-share" style={btn(true)} onClick={share}>
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
        )}
      </div>
    </div>
  );
}
