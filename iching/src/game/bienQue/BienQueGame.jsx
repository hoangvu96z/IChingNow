import React, { useState, useMemo, useCallback, useRef } from 'react';
import './bienQue.css';
import { soundEngine } from '../../utils/soundEffects.js';
import {
  CHAPTERS, SKILLS, ALL_LINES, applyMove, solve, hexInfo, glyph,
  levelPuzzle, dailyPuzzle, starsFor, shareText, loadStore, saveStore,
  recordLevel, recordDaily, isLevelUnlocked, totalStars, MAX_STARS, levelKey,
} from './bienQueLogic.js';
import { todayStr, BADGES } from '../progress.js';

const sfx = (fn) => { try { fn(); } catch { /* không có audio */ } };

// ── Primitives ─────────────────────────────────────────────────────────────
function MiniHex({ bin, light, lg }) {
  return (
    <div className={`bq-mini${light ? ' light' : ''}${lg ? ' lg' : ''}`} aria-label={hexInfo(bin)?.nameVi}>
      {bin.split('').map((b, i) => (
        <div key={i} className="bq-mini-line">
          {b === '1' ? <span /> : <><span /><span /></>}
        </div>
      ))}
    </div>
  );
}

function Stars({ n, sm }) {
  return (
    <div className={`bq-stars${sm ? ' sm' : ''}`} aria-label={`${n} sao`}>
      {[1, 2, 3].map((i) => <span key={i} className={`bq-star${i <= n ? ' on' : ''}`}>⭐</span>)}
    </div>
  );
}

function Mountains() {
  return (
    <svg className="bq-mountains" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 140 L40 95 L70 120 L120 60 L160 110 L200 80 L250 130 L300 70 L350 115 L400 90 L400 200 L0 200Z" fill="#1a1e52" />
      <path d="M0 170 L60 130 L110 160 L170 120 L230 165 L290 125 L340 160 L400 135 L400 200 L0 200Z" fill="#11143a" />
    </svg>
  );
}

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  const r = 40 + (i % 3) * 18;
  return { '--dx': `${Math.cos(a) * r}px`, '--dy': `${Math.sin(a) * r * 0.6}px` };
});

// ── Màn chơi ───────────────────────────────────────────────────────────────
function Play({ puzzle, title, lesson, showGuides, onWin, onBack, onNext, onReplay, shareable }) {
  const [bin, setBin] = useState(puzzle.start);
  const [history, setHistory] = useState([]);
  const [usedHint, setUsedHint] = useState(false);
  const [hint, setHint] = useState(null);
  const [anim, setAnim] = useState(null);
  const [bursts, setBursts] = useState([]);
  const [deny, setDeny] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [result, setResult] = useState(null);
  const [showLesson, setShowLesson] = useState(Boolean(lesson));
  const [toast, setToast] = useState('');
  const animKey = useRef(0);

  const { target, skills, lines } = puzzle;
  const sealed = skills.includes('flip') ? ALL_LINES.filter((l) => !lines.includes(l)) : [];
  const movesLeft = puzzle.maxMoves - history.length;
  const solved = bin === target;
  const lost = !solved && movesLeft <= 0;
  const cur = hexInfo(bin);
  const tgt = hexInfo(target);
  const last = history[history.length - 1];

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1600); };

  const doMove = (move) => {
    if (result || lost || showLesson || solved) return;
    if (move.type === 'flip' && !lines.includes(move.line)) {
      setDeny(move.line); setTimeout(() => setDeny(null), 400);
      flash(`🔒 Hào ${move.line} bị phong ấn`);
      return;
    }
    const next = applyMove(bin, move);
    if (next === bin) { flash(`${SKILLS[move.type].label} không làm quẻ này thay đổi`); return; }

    sfx(() => soundEngine.playCoinClink(move.type === 'flip' ? 0.9 + move.line * 0.08 : 0.6, 0.35));
    const h = [...history, { from: bin, to: next, move }];
    setHistory(h);
    setBin(next);
    setHint(null);
    animKey.current += 1;
    setAnim({ type: move.type, line: move.line, key: animKey.current });
    if (move.type === 'flip') {
      const id = animKey.current;
      setBursts((b) => [...b, { id, line: move.line }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 750);
    }
    if (next === target) {
      setTimeout(() => {
        sfx(() => soundEngine.playHexagramComplete());
        const info = onWin({ moves: h.map((x) => x.move), usedHint });
        setResult({ ...info, history: h });
      }, 700);
    }
  };

  const undo = () => {
    if (!history.length || result) return;
    setHistory(history.slice(0, -1));
    setBin(last.from);
    setAnim(null);
    setHint(null);
  };

  const reset = () => {
    if (result) return;
    setHistory([]); setBin(puzzle.start); setAnim(null); setHint(null);
  };

  const askHint = () => {
    if (result || solved) return;
    const path = solve(bin, target, skills, lines);
    if (!path?.length) return;
    setHint(path[0]);
    if (!usedHint) flash('💡 Dùng gợi ý: tối đa 2 sao');
    setUsedHint(true);
  };

  const pressSkill = (s) => {
    if (s === 'flip') {
      setPulse(true); setTimeout(() => setPulse(false), 900);
      flash('Chạm vào một hào để động');
      return;
    }
    doMove({ type: s });
  };

  const share = async () => {
    const text = shareText({
      puzzle, moves: result.history.map((x) => x.move), stars: result.stars,
      url: `${window.location.origin}${window.location.pathname}`,
    });
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); flash('✓ Đã sao chép kết quả'); }
    } catch { /* người dùng huỷ */ }
  };

  const hexClass = [
    'bq-hex',
    anim && anim.type !== 'flip' ? `bq-anim-${anim.type}` : '',
    solved ? 'won' : '',
    pulse ? 'pulse' : '',
  ].join(' ');

  return (
    <div className="bq-wrap">
      <div className="bq-topbar">
        <button type="button" id="bq-back" className="bq-iconbtn" onClick={onBack} aria-label="Quay lại">←</button>
        <div style={{ textAlign: 'center' }}>
          <h2 className="bq-title" style={{ fontSize: '1.5rem' }}>Biến Quẻ</h2>
          <div className="bq-subtitle" style={{ marginTop: 0 }}>{title}</div>
        </div>
        <span className="bq-pill" title="Số nước tối ưu">🎯 {puzzle.optimal}</span>
      </div>

      <div className="bq-goal">
        <div>
          <div className="bq-goal-label">Quẻ đích</div>
          <div className="bq-goal-name">{tgt.glyph} {tgt.nameVi}</div>
        </div>
        <div className={`bq-target${solved ? ' solved' : ''}`}><MiniHex bin={target} /></div>
      </div>

      {sealed.length > 0 && (
        <div className="bq-banner">🔒 Hào {sealed.join(', ')} bị phong ấn, hãy dùng chiêu khác để biến hóa</div>
      )}

      <div className="bq-stage">
        <div className={hexClass} key={anim && anim.type !== 'flip' ? anim.key : 'hex'}>
          {bin.split('').map((b, i) => {
            const line = i + 1;
            const isSealed = sealed.includes(line);
            const isFlip = anim?.type === 'flip' && anim.line === line;
            const isHint = hint?.type === 'flip' && hint.line === line;
            return (
              <div className="bq-row" key={line}>
                <span className="bq-row-label">Hào {line}</span>
                <button
                  type="button"
                  id={`bq-line-${line}`}
                  key={isFlip ? `f${anim.key}` : 'l'}
                  className={`bq-line ${b === '1' ? 'yang' : 'yin'}${isSealed ? ' sealed' : ''}${isFlip ? ' flip' : ''}${isHint ? ' hint' : ''}${deny === line ? ' deny' : ''}`}
                  onClick={() => doMove({ type: 'flip', line })}
                  aria-label={`Hào ${line}, ${b === '1' ? 'dương' : 'âm'}${isSealed ? ', bị phong ấn' : ''}`}
                  aria-disabled={isSealed}
                >
                  {b === '1' ? <span className="bar" /> : <><span className="bar" /><span className="bar" /></>}
                  {bursts.filter((x) => x.line === line).map((x) => (
                    <React.Fragment key={x.id}>
                      {SPARKS.map((st, k) => <span key={k} className="bq-spark" style={st} />)}
                    </React.Fragment>
                  ))}
                </button>
                <span className="bq-mark">
                  {isSealed ? <span className="bq-seal">封</span>
                    : showGuides ? (
                      <span className={b === target[i] ? 'ok' : 'no'}>{b === target[i] ? '✓' : '•'}</span>
                    ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bq-now" key={bin}>
        <div className="bq-now-name"><span className="bq-now-glyph">{cur.glyph}</span>{cur.nameVi}</div>
        <div className="bq-now-sum">{cur.summary}</div>
        {last && (
          <div className="bq-lastmove">
            {SKILLS[last.move.type].icon} {SKILLS[last.move.type].label}
            {last.move.line ? ` hào ${last.move.line}` : ''}: {hexInfo(last.from).nameVi} → {hexInfo(last.to).nameVi}
          </div>
        )}
      </div>

      <div className="bq-trail" aria-label="Đường biến hóa">
        <span className="bq-chip" title={hexInfo(puzzle.start).nameVi}>{glyph(puzzle.start)}</span>
        {history.map((h, i) => (
          <React.Fragment key={i}>
            <span className="bq-arrow">{SKILLS[h.move.type].icon}</span>
            <span className={`bq-chip${i === history.length - 1 ? ' current' : ''}`} title={hexInfo(h.to).nameVi}>{glyph(h.to)}</span>
          </React.Fragment>
        ))}
        {!solved && <><span className="bq-arrow">⋯</span><span className="bq-chip goal" title={tgt.nameVi}>{tgt.glyph}</span></>}
      </div>

      <div className={`bq-moves${movesLeft <= 1 ? ' low' : ''}`}>
        {Array.from({ length: puzzle.maxMoves }, (_, i) => (
          <span key={i} className={`bq-dot${i < history.length ? ' used' : ''}`} />
        ))}
        <span>Còn <strong>{movesLeft}</strong> nước</span>
      </div>

      <div className="bq-skills">
        {skills.map((s) => (
          <button
            key={s} type="button" id={`bq-skill-${s}`} data-skill={s}
            className={`bq-skill${hint && hint.type === s && s !== 'flip' ? ' hint' : ''}`}
            onClick={() => pressSkill(s)} title={SKILLS[s].desc}
          >
            <span className="bq-medal">{SKILLS[s].icon}</span>
            {SKILLS[s].label}
          </button>
        ))}
      </div>

      <div className="bq-controls">
        <button type="button" id="bq-undo" className="bq-iconbtn" onClick={undo} disabled={!history.length}>↶ Hoàn tác</button>
        <button type="button" id="bq-reset" className="bq-iconbtn" onClick={reset}>⟲ Làm lại</button>
        <button type="button" id="bq-hint" className="bq-iconbtn" onClick={askHint}>💡 Gợi ý</button>
      </div>

      {toast && (
        <div className="bq-pill" role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 970, background: 'rgba(20,22,60,0.95)' }}>
          {toast}
        </div>
      )}

      {showLesson && lesson && (
        <div className="bq-overlay">
          <div className="bq-modal">
            <div className="bq-skills" style={{ marginBottom: 8 }}>
              <span className="bq-skill" data-skill={lesson.skill}><span className="bq-medal">{SKILLS[lesson.skill].icon}</span></span>
            </div>
            <h3>Chiêu mới: {SKILLS[lesson.skill].label}</h3>
            <p>{lesson.text}</p>
            <div className="bq-lesson-demo">
              <div><MiniHex bin={lesson.example[0]} light lg /><div className="name">{hexInfo(lesson.example[0]).nameVi}</div></div>
              <span className="arrow">{SKILLS[lesson.skill].icon}</span>
              <div><MiniHex bin={lesson.example[1]} light lg /><div className="name">{hexInfo(lesson.example[1]).nameVi}</div></div>
            </div>
            <div className="bq-actions">
              <button type="button" id="bq-lesson-start" className="bq-btn" onClick={() => setShowLesson(false)}>Bắt đầu</button>
            </div>
          </div>
        </div>
      )}

      {lost && !result && (
        <div className="bq-overlay">
          <div className="bq-modal">
            <h3>Hết nước!</h3>
            <p>Bạn đang ở <strong style={{ color: 'var(--bq-gold-hi)' }}>{cur.nameVi}</strong>, chưa tới {tgt.nameVi}. Thử lùi lại vài bước hoặc dùng gợi ý.</p>
            <div className="bq-actions">
              <button type="button" id="bq-lost-undo" className="bq-btn" onClick={undo}>↶ Lùi một nước</button>
              <button type="button" id="bq-lost-reset" className="bq-btn ghost" onClick={reset}>⟲ Làm lại từ đầu</button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bq-overlay">
          <div className="bq-modal">
            <h3>Đã thành quẻ!</h3>
            <Stars n={result.stars} />
            <p>
              {result.history.length} nước · tối ưu {puzzle.optimal}
              {usedHint ? ' · có dùng gợi ý' : ''}
            </p>
            <div className="bq-recap" aria-label="Con đường biến hóa">
              <div className="bq-recap-row"><span className="g">{glyph(puzzle.start)}</span>{hexInfo(puzzle.start).nameVi}<span className="m">xuất phát</span></div>
              {result.history.map((h, i) => (
                <div className="bq-recap-row" key={i}>
                  <span className="g">{glyph(h.to)}</span>{hexInfo(h.to).nameVi}
                  <span className="m">{SKILLS[h.move.type].icon} {SKILLS[h.move.type].label}{h.move.line ? ` ${h.move.line}` : ''}</span>
                </div>
              ))}
            </div>
            <div className="bq-xp">{result.xp > 0 ? `+${result.xp} XP` : result.alreadyDone ? 'Đã tính điểm đề hôm nay' : 'Không có sao mới'}</div>
            {result.newBadges?.length > 0 && (
              <p>🏅 Huy hiệu mới: {result.newBadges.map((b) => `${BADGES[b]?.emoji} ${BADGES[b]?.label}`).join(', ')}</p>
            )}
            <div className="bq-actions">
              {shareable && <button type="button" id="bq-share" className="bq-btn" onClick={share}>📤 Chia sẻ kết quả</button>}
              {onNext && <button type="button" id="bq-next" className="bq-btn" onClick={onNext}>Màn tiếp →</button>}
              <button type="button" id="bq-replay" className="bq-btn ghost" onClick={onReplay}>↺ Chơi lại</button>
              <button type="button" id="bq-to-map" className="bq-btn ghost" onClick={onBack}>Về bản đồ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bản đồ ─────────────────────────────────────────────────────────────────
function MapScreen({ store, daily, today, onOpenLevel, onOpenDaily, onExit }) {
  const done = store.daily[today];
  const s = hexInfo(daily.start);
  const t = hexInfo(daily.target);
  return (
    <div className="bq-wrap">
      <div className="bq-topbar">
        <button type="button" id="bq-exit" className="bq-iconbtn" onClick={onExit} aria-label="Về Luyện Dịch">←</button>
        <h2 className="bq-title">Biến Quẻ</h2>
        <span className="bq-pill">⭐ {totalStars(store)}/{MAX_STARS}</span>
      </div>
      <div className="bq-subtitle">Biến hóa quẻ bằng Động hào, Thác, Tổng, Hỗ</div>

      <section className="bq-daily">
        <div className="bq-daily-head">
          <span className="bq-daily-title">📜 Đề hôm nay</span>
          <span className="bq-pill">#{daily.number}</span>
        </div>
        <div className="bq-daily-vs">
          <div><MiniHex bin={daily.start} light lg /><div className="name">{s.nameVi}</div></div>
          <span className="arrow">➜</span>
          <div><MiniHex bin={daily.target} light lg /><div className="name">{t.nameVi}</div></div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--bq-muted)', margin: '0 0 12px' }}>
          {done ? `Đã giải: ${done.moves} nước ${'⭐'.repeat(done.stars)}` : `Lời giải tối ưu: ${daily.optimal} nước · cả nước chơi chung một đề`}
        </p>
        <button type="button" id="bq-open-daily" className="bq-btn" style={{ width: '100%' }} onClick={onOpenDaily}>
          {done ? 'Chơi lại đề hôm nay' : 'Giải đề hôm nay'}
        </button>
      </section>

      {CHAPTERS.map((ch, ci) => {
        const chapterOpen = isLevelUnlocked(store, ci, 0);
        return (
          <section key={ch.id} className={`bq-card bq-chapter${chapterOpen ? '' : ' locked'}`}>
            <div className="bq-ch-head">
              <span className="bq-ch-seal">{ch.roman}</span>
              <div>
                <div className="bq-ch-title">{ch.title}</div>
                <div className="bq-ch-skills">
                  {ch.skills.map((k) => `${SKILLS[k].icon} ${SKILLS[k].label}`).join(' · ')}
                  {!chapterOpen && ' · 🔒 hoàn thành chương trước'}
                </div>
              </div>
            </div>
            <div className="bq-nodes">
              {ch.levels.map((_, li) => {
                const key = levelKey(ci, li);
                const stars = store.stars[key] || 0;
                const open = isLevelUnlocked(store, ci, li);
                return (
                  <div className="bq-node-wrap" key={key}>
                    <button
                      type="button" id={`bq-node-${key}`}
                      className={`bq-node${stars ? ' done' : open ? ' open' : ''}`}
                      disabled={!open}
                      onClick={() => onOpenLevel(ci, li)}
                      aria-label={`Màn ${li + 1}${stars ? `, ${stars} sao` : open ? '' : ', khóa'}`}
                    >
                      {open ? li + 1 : '🔒'}
                    </button>
                    {stars > 0 && <Stars n={stars} sm />}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Gốc ────────────────────────────────────────────────────────────────────
/**
 * Props: onExit(), onReward({xp, badges}) → newBadges[]
 */
export default function BienQueGame({ onExit, onReward }) {
  const [store, setStore] = useState(loadStore);
  const [game, setGame] = useState(null); // { puzzle, kind, ci, li, attempt }
  const today = todayStr();
  const daily = useMemo(() => dailyPuzzle(today), [today]);

  const openLevel = (ci, li) => setGame({ puzzle: levelPuzzle(ci, li), kind: 'level', ci, li, attempt: 0 });
  const openDaily = () => setGame({ puzzle: daily, kind: 'daily', attempt: 0 });

  const handleWin = useCallback(({ moves, usedHint }) => {
    const stars = starsFor(moves.length, game.puzzle.optimal, usedHint);
    const badges = ['bq-first'];
    if (stars === 3) badges.push('bq-perfect');
    let res;
    if (game.kind === 'daily') {
      res = recordDaily(store, today, moves.length, stars);
      if (res.first) badges.push('bq-daily');
    } else {
      res = recordLevel(store, levelKey(game.ci, game.li), stars);
      const lastCh = CHAPTERS.length - 1;
      if (game.ci === lastCh && game.li === CHAPTERS[lastCh].levels.length - 1) badges.push('bq-master');
    }
    setStore(res.store);
    saveStore(res.store);
    const newBadges = onReward?.({ xp: res.xp, badges }) || [];
    return { stars, xp: res.xp, newBadges, alreadyDone: game.kind === 'daily' && !res.first };
  }, [game, store, today, onReward]);

  let content;
  if (!game) {
    content = <MapScreen store={store} daily={daily} today={today} onOpenLevel={openLevel} onOpenDaily={openDaily} onExit={onExit} />;
  } else {
    const isLevel = game.kind === 'level';
    const ch = isLevel ? CHAPTERS[game.ci] : null;
    let onNext = null;
    if (isLevel) {
      if (game.li + 1 < ch.levels.length) onNext = () => openLevel(game.ci, game.li + 1);
      else if (game.ci + 1 < CHAPTERS.length) onNext = () => openLevel(game.ci + 1, 0);
    }
    const firstTime = isLevel && game.li === 0 && !store.stars[levelKey(game.ci, 0)] && game.attempt === 0;
    content = (
      <Play
        key={`${game.puzzle.id}-${game.attempt}`}
        puzzle={game.puzzle}
        title={isLevel ? `Chương ${ch.roman} · ${ch.title} · Màn ${game.li + 1}` : `Đề hôm nay #${game.puzzle.number}`}
        lesson={firstTime ? ch.lesson : null}
        showGuides={isLevel && game.ci === 0}
        shareable={!isLevel}
        onWin={handleWin}
        onBack={() => setGame(null)}
        onNext={onNext}
        onReplay={() => setGame({ ...game, attempt: game.attempt + 1 })}
      />
    );
  }

  return (
    <div className="bq-root" role="dialog" aria-modal="true" aria-label="Biến Quẻ">
      <Mountains />
      {content}
    </div>
  );
}
