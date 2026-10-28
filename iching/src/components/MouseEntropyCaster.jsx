import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MouseEntropyPool } from '../utils/mouseEntropy.js';
import { coinsToLine } from '../logic/castLines.js';
import { createLineCommitGate } from '../logic/lineCommitGate.js';
import AncientCoin3D from './AncientCoin3D.jsx';
import { soundEngine } from '../utils/soundEffects.js';
import { useLanguage } from '../context/useLanguage.js';

const ENTROPY_NEEDED = 100;
const CANVAS_W = 340;
const CANVAS_H = 175;

/**
 * MouseEntropyCaster
 * ------------------
 * Vùng tương tác thu thập entropy vật lý thật từ chuyển động chuột hoặc vuốt ngón tay.
 * 
 * ĐẶC ĐIỂM:
 * - 100% không dùng Math.random() — đồng xu được sinh từ vi gia tốc, góc rẽ, thời gian tay người di chuyển.
 * - Hiệu ứng vệt sáng thư pháp (golden ink trail) chuyển dần sang màu ngọc bích (jade) khi tích đủ năng lượng.
 * - Hạt bụi kim ngân bồng bềnh (golden particles).
 * - Tự động tung 3 đồng xu 3D với âm thanh leng keng khi đạt 100% năng lượng.
 */
export default function MouseEntropyCaster({
  onLineReady,
  currentStep = 0,
  disabled = false,
  isDone = false,
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const canvasRef = useRef(null);
  const poolRef = useRef(new MouseEntropyPool());
  const rafRef = useRef(null);
  const trailRef = useRef([]); // [{x, y, age, r, g, b}]
  const particlesRef = useRef([]); // [{x, y, vx, vy, life, maxLife}]
  const isCollecting = useRef(false);
  const [lineCommitGate] = useState(() => createLineCommitGate());

  const [phase, setPhase] = useState('idle'); // 'idle' | 'collecting' | 'flashing' | 'tossing' | 'done'
  const [entropyPct, setEntropyPct] = useState(0);
  const [resultCoins, setResultCoins] = useState(null);
  const [lastLine, setLastLine] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Dọn dẹp gate khi unmount
  useEffect(() => () => lineCommitGate.cancel(), [lineCommitGate]);

  // ─── Canvas render loop ────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Nền bát quái nhẹ
    const bg = ctx.createRadialGradient(W / 2, H / 2, 12, W / 2, H / 2, W * 0.7);
    bg.addColorStop(0, 'rgba(44, 24, 16, 0.03)');
    bg.addColorStop(1, 'rgba(184, 134, 11, 0.08)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Gợn sóng huyền vi khi đang chờ tương tác (idle ripples)
    if (!hasInteracted && phase === 'idle') {
      const now = Date.now() / 1000;
      for (let i = 1; i <= 3; i++) {
        const r = 28 + i * 26 + Math.sin(now * 1.5 + i) * 6;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(184, 134, 11, ${0.09 - i * 0.02})`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Vẽ vệt sáng thư pháp (trail)
    const trail = trailRef.current;
    for (let i = 1; i < trail.length; i++) {
      const p = trail[i - 1];
      const c = trail[i];
      const t = 1 - c.age / 55;
      if (t <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(c.x, c.y);
      ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${t * 0.88})`;
      ctx.lineWidth = Math.max(1, t * 4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Vẽ hạt bụi kim ngân (particles)
    for (const p of particlesRef.current) {
      const t = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, t * 3.2), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 160, 23, ${t * 0.75})`;
      ctx.fill();
    }

    // Hiệu ứng loé sáng khi đầy năng lượng
    if (phase === 'flashing') {
      ctx.fillStyle = 'rgba(26, 107, 74, 0.16)';
      ctx.fillRect(0, 0, W, H);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [hasInteracted, phase]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // Di chuyển hạt và làm mờ vệt sáng theo chu kỳ
  useEffect(() => {
    const tick = setInterval(() => {
      trailRef.current = trailRef.current
        .map(p => ({ ...p, age: p.age + 1 }))
        .filter(p => p.age < 55);

      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.04,
          life: p.life - 1,
        }))
        .filter(p => p.life > 0);
    }, 16);
    return () => clearInterval(tick);
  }, []);

  // Reset entropy khi bước sang Hào mới
  useEffect(() => {
    lineCommitGate.cancel();
    poolRef.current.reset();
    setPhase('idle');
    setEntropyPct(0);
    setResultCoins(null);
    setLastLine(null);
    setHasInteracted(false);
    trailRef.current = [];
    particlesRef.current = [];
    isCollecting.current = false;
  }, [currentStep, lineCommitGate]);

  // ─── Tọa độ & Xử lý sự kiện ──────────────────────────────────────
  function getCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }

  function handlePointerEnter(e) {
    if (disabled || isDone || phase === 'tossing' || phase === 'flashing' || phase === 'done') return;
    isCollecting.current = true;
    setPhase('collecting');
    setHasInteracted(true);

    if (canvasRef.current) {
      const pos = getCanvasPos(e, canvasRef.current);
      poolRef.current.feed(pos.x, pos.y);
    }
  }

  function handlePointerMove(e) {
    if (!isCollecting.current || disabled || isDone) return;
    if (phase === 'tossing' || phase === 'flashing' || phase === 'done') return;

    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(e, canvas);

    poolRef.current.feed(x, y);
    const pct = poolRef.current.entropyPercent;
    setEntropyPct(pct);

    // Chuyển màu vệt vẽ: Vàng đồng (184,134,11) -> Ngọc bích (26,107,74)
    const prog = pct / 100;
    const r = Math.round(184 + (26 - 184) * prog);
    const g = Math.round(134 + (107 - 134) * prog);
    const b = Math.round(11 + (74 - 11) * prog);
    trailRef.current.push({ x, y, age: 0, r, g, b });

    // Sinh hạt bụi kim ngân theo nhịp di chuyển
    if (Math.random() < 0.3) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -(Math.random() * 1.8 + 0.4),
        life: 22 + Math.random() * 18,
        maxLife: 40,
      });
    }

    // Khi năng lượng đạt 100% -> Tự động kích hoạt gieo
    if (pct >= ENTROPY_NEEDED && phase === 'collecting') {
      triggerToss();
    }
  }

  function handlePointerLeave() {
    if (phase === 'collecting') {
      isCollecting.current = false;
    }
  }

  // ─── Kích hoạt gieo 3 đồng xu từ entropy ─────────────────────────
  async function triggerToss() {
    isCollecting.current = false;
    const commitToken = lineCommitGate.begin();
    if (commitToken === null) return;

    setPhase('flashing');
    await new Promise(r => setTimeout(r, 280));
    if (!lineCommitGate.isCurrent(commitToken)) return;

    setPhase('tossing');

    // Trích xuất 3 đồng xu ngẫu nhiên thật từ entropy di chuyển chuột
    const coins = poolRef.current.drain3Coins();
    setResultCoins(coins);
    soundEngine.playCoinToss?.();

    await new Promise(r => setTimeout(r, 680));
    if (!lineCommitGate.isCurrent(commitToken)) return;

    soundEngine.playCoinClink?.();
    const lineData = { index: currentStep + 1, ...coinsToLine(coins) };
    setLastLine(lineData);

    // Nếu là hào 6 (hào cuối cùng) -> chuông ngân vang
    if (currentStep === 5) {
      setTimeout(() => {
        if (lineCommitGate.isCurrent(commitToken)) soundEngine.playHexagramComplete?.();
      }, 500);
    }

    lineCommitGate.schedule(commitToken, () => {
      onLineReady(lineData);
      setLastLine(null);
      setPhase('done');
    }, 1100);
  }

  const isTossing = phase === 'tossing' || phase === 'flashing';
  const yaoNames = isEn
    ? ['1st Line (Initial)', '2nd Line', '3rd Line', '4th Line', '5th Line (Ruler)', '6th Line (Top)']
    : ['Hào Sơ (1)', 'Hào Nhị (2)', 'Hào Tam (3)', 'Hào Tứ (4)', 'Hào Ngũ (5)', 'Hào Thượng (6)'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>

      {/* Vùng Canvas di chuột */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: CANVAS_W,
        borderRadius: 16,
        overflow: 'hidden',
        border: `2px solid ${
          phase === 'flashing'
            ? 'var(--color-jade, #1a6b4a)'
            : phase === 'collecting'
            ? 'rgba(184, 134, 11, 0.55)'
            : 'rgba(184, 134, 11, 0.22)'
        }`,
        boxShadow: phase === 'collecting'
          ? '0 0 22px rgba(184, 134, 11, 0.16)'
          : 'inset 0 2px 8px rgba(44, 24, 16, 0.04)',
        cursor: disabled || isDone || isTossing ? 'default' : 'crosshair',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        userSelect: 'none',
        touchAction: 'none',
        background: 'var(--color-paper, #faf3e0)',
      }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          onMouseEnter={handlePointerEnter}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          onTouchStart={e => {
            if (e.cancelable) e.preventDefault();
            handlePointerEnter(e);
          }}
          onTouchMove={e => {
            if (e.cancelable) e.preventDefault();
            handlePointerMove(e);
          }}
          onTouchEnd={handlePointerLeave}
        />

        {/* Overlay văn bản chỉ dẫn tương tác */}
        {!disabled && !isDone && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            pointerEvents: 'none',
          }}>
            {phase === 'idle' && (
              <>
                <div style={{ fontSize: '1.75rem', opacity: 0.5, animation: 'float 2s ease-in-out infinite' }}>
                  🖱️
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  color: 'var(--color-ink, #2c1810)',
                  background: 'rgba(255, 255, 255, 0.85)',
                  padding: '5px 14px',
                  borderRadius: 20,
                  boxShadow: '0 2px 6px rgba(44, 24, 16, 0.08)',
                  backdropFilter: 'blur(3px)',
                }}>
                  {isEn
                    ? `Move mouse freely to cast ${yaoNames[currentStep]}`
                    : `Di chuyển chuột để gieo ${yaoNames[currentStep]}`}
                </div>
              </>
            )}

            {phase === 'collecting' && (
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-gold, #b8860b)',
                background: 'rgba(255, 255, 255, 0.92)',
                padding: '4px 14px',
                borderRadius: 20,
                border: '1px solid rgba(184, 134, 11, 0.35)',
                boxShadow: '0 2px 8px rgba(184, 134, 11, 0.12)',
              }}>
                {isEn ? `Collecting entropy... ${entropyPct}%` : `Đang thu nhận khí... ${entropyPct}%`}
              </div>
            )}

            {phase === 'flashing' && (
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--color-jade, #1a6b4a)',
                background: 'rgba(255, 255, 255, 0.96)',
                padding: '5px 16px',
                borderRadius: 20,
                border: '1.5px solid var(--color-jade, #1a6b4a)',
                boxShadow: '0 4px 12px rgba(26, 107, 74, 0.2)',
              }}>
                ✨ {isEn ? 'Entropy locked — Casting!' : 'Đã hội tụ — Khởi gieo!'}
              </div>
            )}

            {phase === 'tossing' && (
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--color-ink-muted, #6b4c3b)',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.88)',
                padding: '3px 12px',
                borderRadius: 14,
              }}>
                {isEn ? '3 Coins in the air...' : '3 Đồng xu đang bay...'}
              </div>
            )}
          </div>
        )}

        {/* Khóa khi chưa nhập câu hỏi */}
        {disabled && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(250, 243, 224, 0.8)',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--color-vermillion, #c0392b)',
              fontWeight: 600,
              textAlign: 'center',
              padding: '0 16px',
            }}>
              ⚠ {isEn ? 'Please enter your inquiry question above' : 'Hãy nhập việc cần xem trước'}
            </div>
          </div>
        )}
      </div>

      {/* Thanh năng lượng Entropy */}
      {!isDone && phase !== 'done' && (
        <div style={{ width: '100%', maxWidth: CANVAS_W }}>
          <div style={{
            height: 7,
            borderRadius: 4,
            background: 'rgba(184, 134, 11, 0.12)',
            overflow: 'hidden',
            border: '1px solid rgba(184, 134, 11, 0.22)',
          }}>
            <div style={{
              height: '100%',
              width: `${entropyPct}%`,
              borderRadius: 4,
              background: entropyPct >= 100
                ? 'linear-gradient(90deg, #1a6b4a 0%, #27c93f 100%)'
                : 'linear-gradient(90deg, #b8860b 0%, #d4a017 100%)',
              transition: 'width 0.08s ease, background 0.3s',
            }} />
          </div>

          <div style={{
            marginTop: 5,
            fontSize: '0.72rem',
            color: entropyPct >= 100 ? 'var(--color-jade, #1a6b4a)' : 'var(--color-ink-muted, #6b4c3b)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>
              {phase === 'idle' && (isEn
                ? '🖱️ Move cursor over canvas to generate true randomness'
                : '🖱️ Rê chuột trong ô để tạo quẻ từ tay bạn')}
              {phase === 'collecting' && (isEn
                ? `🌀 Keep moving your hand... (${entropyPct}%)`
                : `🌀 Tiếp tục di chuột tự do... (${entropyPct}%)`)}
              {phase === 'flashing' && (isEn
                ? '✅ 100% Entropy — Tossing 3 coins!'
                : '✅ Đủ 100% Năng lượng — Đang gieo!')}
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{entropyPct}%</span>
          </div>
        </div>
      )}

      {/* Hiển thị 3 Đồng Xu 3D kết quả */}
      {(isTossing || (lastLine && phase !== 'idle')) && resultCoins && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          padding: '10px 0',
          minHeight: 96,
        }}>
          {resultCoins.map((coinFace, idx) => (
            <AncientCoin3D
              key={idx}
              face={coinFace}
              isTossing={isTossing}
              size={64}
              delay={idx * 0.07}
              showLabel={!isTossing}
              disabled={true}
            />
          ))}
        </div>
      )}

      {/* Hào vừa gieo xong */}
      {lastLine && !isTossing && (
        <div className="animate-in" style={{
          padding: '8px 18px',
          background: 'var(--color-paper, #faf3e0)',
          borderRadius: 20,
          border: '1.5px solid rgba(192, 57, 43, 0.35)',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(44, 24, 16, 0.06)',
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-vermillion)' }}>
            {lastLine.yinYang === 'yang' ? '—' : '══'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-ink)', fontWeight: 600 }}>
            <span style={{ color: 'var(--color-vermillion)' }}>{yaoNames[lastLine.index - 1]}: </span>
            <span style={{ color: 'var(--color-gold)', marginLeft: 4 }}>
              ({lastLine.coins?.map(c => c === 'ngua' ? '3' : '2').join('+')} = {lastLine.total})
            </span>
            {lastLine.moving && (
              <span style={{ color: 'var(--color-vermillion)', fontWeight: 700, marginLeft: 4 }}> (Động!)</span>
            )}
          </div>
        </div>
      )}

      {/* Gợi ý cho Mobile / Touch */}
      {phase === 'idle' && !disabled && (
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--color-ink-muted)',
          textAlign: 'center',
          lineHeight: 1.4,
          opacity: 0.75,
        }}>
          📱 {isEn
            ? 'Touch screen: Swipe your finger across the area'
            : 'Màn hình cảm ứng: Vuốt ngón tay qua lại trong ô'}
        </div>
      )}
    </div>
  );
}
