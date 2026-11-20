import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MouseEntropyPool } from '../utils/mouseEntropy.js';
import { coinsToLine } from '../logic/castLines.js';
import { createLineCommitGate } from '../logic/lineCommitGate.js';
import AncientCoin3D from './AncientCoin3D.jsx';
import { soundEngine } from '../utils/soundEffects.js';
import { useLanguage } from '../context/useLanguage.js';

const ENTROPY_NEEDED = 100;

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
 * - FIX: Kết quả 3 đồng xu hiển thị ngay lập tức, khớp chính xác với hào được ghi nhận.
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

  // phase: 'idle' | 'collecting' | 'reveal' | 'done'
  const [phase, setPhase] = useState('idle');
  const [entropyPct, setEntropyPct] = useState(0);
  // lineResult holds the finalized { coins, total, yinYang, moving, type, index } for display
  const [lineResult, setLineResult] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  // Brief flash overlay state for the "entropy locked" moment
  const [isFlashing, setIsFlashing] = useState(false);

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
    if (isFlashing) {
      ctx.fillStyle = 'rgba(26, 107, 74, 0.18)';
      ctx.fillRect(0, 0, W, H);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [hasInteracted, phase, isFlashing]);

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
    setLineResult(null);
    setHasInteracted(false);
    setIsFlashing(false);
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
    if (disabled || isDone || phase === 'reveal' || phase === 'done') return;
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
    if (phase === 'reveal' || phase === 'done') return;

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
  // FIX: Trích xuất kết quả NGAY LẬP TỨC khi entropy đủ,
  //      rồi hiển thị 3 đồng xu đúng với hào được ghi nhận, không delay ẩn.
  async function triggerToss() {
    isCollecting.current = false;
    const commitToken = lineCommitGate.begin();
    if (commitToken === null) return;

    // ── Bước 1: Trích xuất kết quả NGAY từ entropy người dùng ──────
    const coins = poolRef.current.drain3Coins();
    const lineData = { index: currentStep + 1, ...coinsToLine(coins) };
    // lineData.coins === coins (cùng mảng tham chiếu từ coinsToLine)

    // ── Bước 2: Flash ngắn 200ms, hiển thị kết quả coin ngay ───────
    setIsFlashing(true);
    soundEngine.playCoinToss?.();
    // Hiển thị lineResult ngay để coin đúng thấy được trong lúc flash
    setLineResult(lineData);
    setPhase('reveal');
    setEntropyPct(100);

    await new Promise(r => setTimeout(r, 220));
    setIsFlashing(false);
    if (!lineCommitGate.isCurrent(commitToken)) return;

    // ── Bước 3: Coin settle + tiếng kim loại ───────────────────────
    soundEngine.playCoinClink?.();

    // Nếu là hào 6 (hào cuối cùng) -> chuông ngân vang
    if (currentStep === 5) {
      setTimeout(() => {
        if (lineCommitGate.isCurrent(commitToken)) soundEngine.playHexagramComplete?.();
      }, 500);
    }

    // ── Bước 4: Ghi nhận hào sau 1.1s cho người dùng thấy kết quả ──
    lineCommitGate.schedule(commitToken, () => {
      onLineReady(lineData);
      setPhase('done');
      setLineResult(null);
    }, 1100);
  }

  const yaoNames = isEn
    ? ['1st Line (Initial)', '2nd Line', '3rd Line', '4th Line', '5th Line (Ruler)', '6th Line (Top)']
    : ['Hào Sơ (1)', 'Hào Nhị (2)', 'Hào Tam (3)', 'Hào Tứ (4)', 'Hào Ngũ (5)', 'Hào Thượng (6)'];

  const lineTypeLabel = {
    'lao-am':      isEn ? 'Old Yin (Moving)' : 'Lão Âm ✦',
    'thieu-duong': isEn ? 'Young Yang' : 'Thiếu Dương',
    'thieu-am':    isEn ? 'Young Yin' : 'Thiếu Âm',
    'lao-duong':   isEn ? 'Old Yang (Moving)' : 'Lão Dương ✦',
  };

  const isRevealing = phase === 'reveal';
  const showCoins = isRevealing && lineResult;
  const showResult = isRevealing && lineResult && !isFlashing;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>

      {/* ── Canvas di chuột ──────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        border: `2px solid ${
          isFlashing
            ? 'var(--color-jade, #1a6b4a)'
            : phase === 'collecting'
            ? 'rgba(184, 134, 11, 0.65)'
            : phase === 'reveal'
            ? 'var(--color-jade, #1a6b4a)'
            : 'rgba(184, 134, 11, 0.22)'
        }`,
        boxShadow: phase === 'collecting'
          ? '0 0 28px rgba(184, 134, 11, 0.18)'
          : phase === 'reveal'
          ? '0 0 24px rgba(26, 107, 74, 0.2)'
          : 'inset 0 2px 8px rgba(44, 24, 16, 0.04)',
        cursor: disabled || isDone || isRevealing ? 'default' : 'crosshair',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        userSelect: 'none',
        touchAction: 'none',
        background: 'var(--color-paper, #faf3e0)',
        // Responsive height via aspect-ratio
        aspectRatio: '2 / 1',
        minHeight: 120,
        maxHeight: 220,
      }}>
        <canvas
          ref={canvasRef}
          width={680}
          height={340}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
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

        {/* Overlay hướng dẫn tương tác */}
        {!disabled && !isDone && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}>
            {phase === 'idle' && (
              <>
                <div style={{ fontSize: '2rem', opacity: 0.45, animation: 'float 2s ease-in-out infinite' }}>
                  🖱️
                </div>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  color: 'var(--color-ink, #2c1810)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '6px 18px',
                  borderRadius: 24,
                  boxShadow: '0 2px 8px rgba(44, 24, 16, 0.1)',
                  backdropFilter: 'blur(4px)',
                }}>
                  {isEn
                    ? `Rê chuột để gieo ${yaoNames[currentStep]}`
                    : `Di chuyển chuột để gieo ${yaoNames[currentStep]}`}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-ink-muted)',
                  background: 'rgba(255,255,255,0.75)',
                  padding: '3px 12px',
                  borderRadius: 14,
                  backdropFilter: 'blur(3px)',
                }}>
                  🔬 {isEn ? 'Real physical randomness from your hand' : 'Ngẫu nhiên vật lý thật từ chuyển động tay bạn'}
                </div>
              </>
            )}

            {phase === 'collecting' && (
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: entropyPct >= 80
                  ? 'var(--color-jade, #1a6b4a)'
                  : 'var(--color-gold, #b8860b)',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '6px 18px',
                borderRadius: 24,
                border: `1.5px solid ${entropyPct >= 80 ? 'rgba(26,107,74,0.5)' : 'rgba(184, 134, 11, 0.4)'}`,
                boxShadow: `0 3px 10px ${entropyPct >= 80 ? 'rgba(26,107,74,0.15)' : 'rgba(184,134,11,0.12)'}`,
                transition: 'all 0.3s',
              }}>
                {entropyPct >= 80
                  ? (isEn ? `⚡ Almost there! ${entropyPct}%` : `⚡ Sắp đủ! ${entropyPct}%`)
                  : (isEn ? `🌀 Keep moving... ${entropyPct}%` : `🌀 Tiếp tục di chuột... ${entropyPct}%`)}
              </div>
            )}

            {isFlashing && (
              <div style={{
                fontSize: '0.9rem',
                fontWeight: 900,
                color: 'var(--color-jade, #1a6b4a)',
                background: 'rgba(255, 255, 255, 0.98)',
                padding: '7px 20px',
                borderRadius: 24,
                border: '2px solid var(--color-jade, #1a6b4a)',
                boxShadow: '0 6px 18px rgba(26, 107, 74, 0.25)',
                animation: 'pulse 0.2s ease-out',
              }}>
                ✨ {isEn ? 'Entropy locked — Revealing!' : 'Đã hội tụ — Hiển thị kết quả!'}
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
            background: 'rgba(250, 243, 224, 0.82)',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '0.82rem',
              color: 'var(--color-vermillion, #c0392b)',
              fontWeight: 700,
              textAlign: 'center',
              padding: '0 20px',
            }}>
              ⚠ {isEn ? 'Please enter your inquiry question above' : 'Hãy nhập việc cần xem trước'}
            </div>
          </div>
        )}
      </div>

      {/* ── Thanh năng lượng Entropy ──────────────────────────────── */}
      {!isDone && phase !== 'done' && (
        <div style={{ width: '100%' }}>
          {/* Bar track */}
          <div style={{
            height: 10,
            borderRadius: 6,
            background: 'rgba(184, 134, 11, 0.1)',
            overflow: 'hidden',
            border: '1px solid rgba(184, 134, 11, 0.2)',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${entropyPct}%`,
              borderRadius: 6,
              background: entropyPct >= 100
                ? 'linear-gradient(90deg, #1a6b4a 0%, #27c93f 100%)'
                : entropyPct >= 80
                ? 'linear-gradient(90deg, #b8860b 0%, #27c93f 100%)'
                : 'linear-gradient(90deg, #b8860b 0%, #d4a017 100%)',
              transition: 'width 0.08s ease, background 0.4s',
              boxShadow: entropyPct >= 100 ? '0 0 10px rgba(39,201,63,0.5)' : 'none',
            }} />
          </div>

          {/* Bar label */}
          <div style={{
            marginTop: 6,
            fontSize: '0.72rem',
            color: entropyPct >= 100 ? 'var(--color-jade, #1a6b4a)' : 'var(--color-ink-muted, #6b4c3b)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>
              {phase === 'idle' && (isEn
                ? '🖱️ Rê chuột vào ô để tạo nguồn ngẫu nhiên thật'
                : '🖱️ Rê chuột vào ô để tạo nguồn ngẫu nhiên thật')}
              {phase === 'collecting' && (isEn
                ? `🌀 Keep moving freely... (${entropyPct}%)`
                : `🌀 Tiếp tục di chuột tự do... (${entropyPct}%)`)}
              {phase === 'reveal' && (isEn
                ? '✅ Entropy complete — Result locked!'
                : '✅ Đủ entropy — Kết quả đã xác định!')}
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{entropyPct}%</span>
          </div>
        </div>
      )}

      {/* ── 3 Đồng Xu Kết Quả — Hiển thị NGAY khi entropy đủ ──────── */}
      {showCoins && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          {/* Coin row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 20,
            padding: '8px 0 4px',
          }}>
            {lineResult.coins.map((coinFace, idx) => (
              <AncientCoin3D
                key={`${currentStep}-${idx}`}
                face={coinFace}
                isTossing={isFlashing}
                size={68}
                delay={isFlashing ? idx * 0.07 : 0}
                showLabel={!isFlashing}
                disabled={true}
              />
            ))}
          </div>

          {/* Line result card — hiện ngay sau flash */}
          {showResult && (
            <div className="animate-in" style={{
              padding: '10px 20px',
              background: 'var(--color-paper, #faf3e0)',
              borderRadius: 20,
              border: `1.5px solid ${lineResult.moving ? 'rgba(192,57,43,0.5)' : 'rgba(26,107,74,0.4)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 4px 14px ${lineResult.moving ? 'rgba(192,57,43,0.1)' : 'rgba(26,107,74,0.1)'}`,
              width: '100%',
              maxWidth: 340,
            }}>
              {/* Yao glyph + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: lineResult.yinYang === 'yang'
                    ? 'var(--color-gold, #b8860b)'
                    : 'var(--color-vermillion, #c0392b)',
                  letterSpacing: lineResult.yinYang === 'yin' ? 4 : 0,
                }}>
                  {lineResult.yinYang === 'yang' ? '—' : '══'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                    <span style={{ color: 'var(--color-vermillion)' }}>{yaoNames[lineResult.index - 1]}: </span>
                    <span style={{ color: lineResult.moving ? 'var(--color-vermillion)' : 'var(--color-jade)' }}>
                      {lineTypeLabel[lineResult.type] || lineResult.type}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.73rem',
                    color: 'var(--color-gold)',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}>
                    {lineResult.coins.map(c => c === 'ngua' ? '3' : '2').join(' + ')} = {lineResult.total}
                    {lineResult.moving && (
                      <span style={{ color: 'var(--color-vermillion)', marginLeft: 6 }}>
                        {isEn ? '⚡ Moving!' : '⚡ Hào động!'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Next line hint */}
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--color-ink-muted)',
                borderTop: '1px dashed rgba(184,134,11,0.25)',
                paddingTop: 6,
                width: '100%',
                textAlign: 'center',
              }}>
                {currentStep < 5
                  ? (isEn ? '↓ Continue to next line...' : '↓ Tiếp tục gieo hào tiếp theo...')
                  : (isEn ? '🎉 All 6 lines complete!' : '🎉 Đã gieo đủ 6 hào!')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Gợi ý Mobile ───────────────────────────────────────────── */}
      {phase === 'idle' && !disabled && (
        <div style={{
          fontSize: '0.68rem',
          color: 'var(--color-ink-muted)',
          textAlign: 'center',
          lineHeight: 1.5,
          opacity: 0.8,
        }}>
          📱 {isEn
            ? 'Mobile: Swipe your finger across the canvas'
            : 'Màn hình cảm ứng: Vuốt ngón tay qua lại trong ô'}
        </div>
      )}

      {/* Global CSS */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
