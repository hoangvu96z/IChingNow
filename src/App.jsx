import React, { useState } from 'react';
import CastingForm from './components/CastingForm.jsx';
import MethodPicker from './components/MethodPicker.jsx';
import QuickCastPanel from './components/QuickCastPanel.jsx';
import ManualLineStepper from './components/ManualLineStepper.jsx';
import HexagramPreview from './components/HexagramPreview.jsx';
import LucHaoTable from './components/LucHaoTable.jsx';
import ResultMetadata from './components/ResultMetadata.jsx';
import PlainTextExportCard from './components/PlainTextExportCard.jsx';
import MaiHoaPanel from './components/MaiHoaPanel.jsx';
import MaiHoaResultCard from './components/MaiHoaResultCard.jsx';
import { buildResult } from './logic/buildHexagram.js';
import { buildMaiHoaPlainText } from './logic/buildPlainText.js';
import { copyToClipboard, downloadTxt, downloadJson } from './logic/clipboard.js';



function CanChiInfoBar({ canChi }) {
  if (!canChi) return null;
  const items = [
    { label: 'Giờ',   value: `${canChi.gioCan} ${canChi.gioChi}`   },
    { label: 'Ngày',  value: `${canChi.ngayCan} ${canChi.ngayChi}` },
    { label: 'Tháng', value: `${canChi.thangCan} ${canChi.thangChi}` },
    { label: 'Năm',   value: `${canChi.namCan} ${canChi.namChi}`   },
  ].filter(i => !i.value.includes('?'));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Can Chi
      </span>
      {items.map(({ label, value }) => (
        <span key={label} style={{ fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-ink-muted)', marginRight: 3 }}>{label}:</span>
          <span style={{ fontWeight: 600, fontFamily: "'Noto Serif', serif" }}>{value}</span>
        </span>
      ))}
      {canChi.khongVong?.length > 0 && (
        <span style={{ fontSize: '0.8125rem', marginLeft: 4 }}>
          <span style={{ color: 'var(--color-ink-muted)', marginRight: 3 }}>Tuần Không:</span>
          <span style={{ fontWeight: 700, color: '#b8860b', fontFamily: "'Noto Serif', serif" }}>
            {canChi.khongVong.join(', ')}
          </span>
        </span>
      )}
      {canChi.lunarDate && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
          Âm lịch: {canChi.lunarDate}
        </span>
      )}
    </div>
  );
}

function getDefaultForm() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    question:      '',
    caster:        '',
    castDate:      `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,
    castTime:      `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    useSolarTerm:  false,
    solarTermId:   '',
    solarTerm:     null,
    movingMindDate:'',
    movingMindTime:{ enabled: false, hourBranch: '' },
  };
}

/** Card xuất kết quả cho Mai Hoa — giống PlainTextExportCard nhưng dùng buildMaiHoaPlainText */
function MaiHoaExportCard({ result }) {
  const [copied,  setCopied]  = useState(false);
  const [copiedJ, setCopiedJ] = useState(false);

  const hasResult = !!result;
  const text      = hasResult ? buildMaiHoaPlainText(result) : '';

  async function handleCopyText() {
    if (!hasResult) return;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  async function handleCopyJson() {
    if (!hasResult) return;
    await copyToClipboard(JSON.stringify(result, null, 2));
    setCopiedJ(true);
    setTimeout(() => setCopiedJ(false), 2000);
  }
  function handleDownloadTxt() {
    if (!hasResult) return;
    const ts = new Date().toISOString().slice(0, 10);
    downloadTxt(text, `mai-hoa-${ts}.txt`);
  }
  function handleDownloadJson() {
    if (!hasResult) return;
    const ts = new Date().toISOString().slice(0, 10);
    downloadJson(result, `mai-hoa-${ts}.json`);
  }

  return (
    <div className="terminal-card">
      <div className="terminal-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="terminal-dot" style={{ background: '#ff5f56' }} />
          <div className="terminal-dot" style={{ background: '#ffbd2e' }} />
          <div className="terminal-dot" style={{ background: '#27c93f' }} />
          <span style={{ marginLeft: 8, color: '#718096', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
            plaintext — mai hoa dịch số
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: copied  ? '✓ Đã copy' : '⎘ Copy text', onClick: handleCopyText,  bg: copied  ? '#27c93f' : 'rgba(246,201,14,0.15)', color: copied  ? 'white' : 'var(--color-terminal-accent)' },
            { label: '↓ .txt',                               onClick: handleDownloadTxt, bg: 'transparent', color: '#718096', border: '1px solid rgba(113,128,150,0.4)' },
            { label: copiedJ ? '✓ JSON'    : '⎘ JSON',      onClick: handleCopyJson,   bg: copiedJ ? '#27c93f' : 'rgba(39,201,63,0.1)',   color: copiedJ ? 'white' : '#27c93f' },
            { label: '↓ .json',                              onClick: handleDownloadJson, bg: 'transparent', color: '#27c93f', border: '1px solid rgba(39,201,63,0.3)' },
          ].map(({ label, onClick, bg, color, border }) => (
            <button key={label} onClick={onClick} disabled={!hasResult} style={{
              padding: '5px 12px', borderRadius: 6, border: border || 'none',
              background: bg, color, fontSize: '0.8125rem', fontWeight: 600,
              cursor: hasResult ? 'pointer' : 'not-allowed', opacity: hasResult ? 1 : 0.4,
              transition: 'all 0.2s', fontFamily: 'monospace',
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="terminal-body">
        {hasResult ? (
          <span style={{ color: 'var(--color-terminal-text)' }}>{text}</span>
        ) : (
          <span style={{ color: '#4a5568', fontStyle: 'italic' }}>
            {`// Chưa có kết quả.\n// Hãy lập quẻ Mai Hoa để xem kết quả ở đây.`}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Render kết quả cho cả 2 loại phương pháp (coin cast + Mai Hoa)
 * Tách riêng để App.jsx gọn gàng, dễ đọc flow 3 trạng thái.
 */
function ResultSection({ mode, result, maiHoaResult, onChangeMethod }) {
  if (mode.startsWith('mai-hoa')) {
    return <MaiHoaResultSection result={maiHoaResult} />;
  }
  return <CoinCastResultSection result={result} />;
}

function CoinCastResultSection({ result }) {
  if (!result) return null;
  return (
    <>
      {/* Quẻ Preview */}
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Kết quả quẻ</div>
        <div className="animate-in">
          <HexagramPreview result={result} />
        </div>
      </section>

      {/* Bảng Lục Hào đầy đủ */}
      <section className="card animate-in" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Bảng Lục Hào</div>
        <LucHaoTable result={result} />
      </section>

      {/* Can Chi Info */}
      {result.canChi && (
        <section className="card animate-in" style={{ padding: '14px 20px' }}>
          <CanChiInfoBar canChi={result.canChi} />
        </section>
      )}

      {/* Metadata */}
      <section className="card animate-in" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Thông tin lần lập quẻ</div>
        <ResultMetadata result={result} />
      </section>

      {/* Plaintext Export */}
      <section className="animate-in">
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          📋 Xuất kết quả
        </div>
        <PlainTextExportCard result={result} />
      </section>
    </>
  );
}

function MaiHoaResultSection({ result }) {
  if (!result) return null;
  return (
    <>
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>🌸 Kết quả quẻ Mai Hoa</div>
        <div className="animate-in">
          <MaiHoaResultCard result={result} />
        </div>
      </section>

      {/* Câu hỏi + thời gian */}
      <section className="card animate-in" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Thông tin lần lập quẻ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.question && (
            <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid rgba(184,134,11,0.1)' }}>
              <span style={{ minWidth: 110, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>Việc cần xem</span>
              <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif" }}>{result.question}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid rgba(184,134,11,0.1)' }}>
            <span style={{ minWidth: 110, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>Phương pháp</span>
            <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif" }}>
              Mai Hoa — {result.subMode === 'time' ? 'Ngày giờ động tâm' : 'Theo số'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '5px 0' }}>
            <span style={{ minWidth: 110, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>Thời gian lập</span>
            <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif" }}>
              {new Date(result.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </section>

      {/* Xuất kết quả Mai Hoa */}
      <section className="animate-in">
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          📋 Xuất kết quả
        </div>
        <MaiHoaExportCard result={result} />
      </section>
    </>
  );
}

export default function App() {
  const [formData,         setFormData]         = useState(getDefaultForm());
  const [mode,             setMode]             = useState('quick');
  const [lines,            setLines]            = useState([]);
  const [result,           setResult]           = useState(null);
  const [maiHoaResult,     setMaiHoaResult]     = useState(null);
  const [hasPickedMethod,  setHasPickedMethod]  = useState(false);

  const hasResult = !!(result || maiHoaResult);

  // Mỗi khi lines thay đổi đủ 6, build result
  function computeResult(newLines, currentMode) {
    if (newLines.length < 6) { setResult(null); return; }
    const dt = new Date(`${formData.castDate}T${formData.castTime}`);
    const r = buildResult({
      formData: { ...formData, createdAt: dt.toISOString() },
      lines: newLines,
      mode: currentMode,
    });
    setResult(r);
  }

  // Quick cast callback
  function handleQuickResult(newLines) {
    setLines(newLines);
    computeResult(newLines, 'quick');
  }

  // Manual step: one line added
  function handleLineAdded(line) {
    const next = [...lines, line];
    setLines(next);
    computeResult(next, 'manual-step');
  }

  // Reset (chỉ xoá lines + result, giữ mode để user gieo lại)
  function handleReset() {
    setLines([]);
    setResult(null);
  }

  // Reset Mai Hoa
  function handleMaiHoaReset() {
    setMaiHoaResult(null);
  }

  // User chọn method từ MethodPicker → sang casting panel
  function handleMethodPick(newMode) {
    setMode(newMode);
    setLines([]);
    setResult(null);
    setMaiHoaResult(null);
    setHasPickedMethod(true);
  }

  // Quay lại màn hình chọn method (giữ form để đổi method khác không phải nhập lại)
  function handleChangeMethod() {
    setLines([]);
    setResult(null);
    setMaiHoaResult(null);
    setHasPickedMethod(false);
  }

  // Lập quẻ mới hoàn toàn: clear cả form lẫn state
  function handleFullReset() {
    setFormData(getDefaultForm());
    setLines([]);
    setResult(null);
    setMaiHoaResult(null);
    setHasPickedMethod(false);
  }

  const canCast = formData.question.trim().length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ===== HEADER ===== */}
      <header style={{
        background: 'linear-gradient(135deg, #1a0a06 0%, #3d1a10 50%, #1a0a06 100%)',
        padding: '0 24px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Trigram icon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[true, false, true].map((yang, i) => (
                yang
                  ? <div key={i} style={{ width: 28, height: 5, background: '#d4a017', borderRadius: 2 }} />
                  : <div key={i} style={{ display: 'flex', gap: 5 }}>
                      <div style={{ width: 11, height: 5, background: '#d4a017', borderRadius: 2 }} />
                      <div style={{ width: 11, height: 5, background: '#d4a017', borderRadius: 2 }} />
                    </div>
              ))}
            </div>
            <div>
              <div style={{
                fontFamily: "'Noto Serif', serif",
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#f5d78e',
                letterSpacing: '0.06em',
              }}>
                易 IChingNow
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(245,215,142,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Lập Quẻ Kinh Dịch
              </div>
            </div>
          </div>

          {(result || maiHoaResult) && (
            <button
              onClick={handleFullReset}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.8)',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              🔄 Lập quẻ mới
            </button>
          )}
        </div>
      </header>

      {/* ===== MAIN LAYOUT ===== */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 420px) minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
          className="main-grid"
        >
          {/* ===== LEFT COLUMN ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Form nhập liệu */}
            <section className="card" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>
                Thông tin lập quẻ
              </div>
              <CastingForm formData={formData} onChange={setFormData} />
            </section>

            {/* Nút "Đổi phương pháp" nếu đang ở state casting/result */}
            {(hasPickedMethod || hasResult) && (
              <button
                onClick={handleChangeMethod}
                className="btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  fontWeight: 600,
                }}
              >
                ← Đổi phương pháp gieo
              </button>
            )}
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ─── STATE 1: Chưa chọn phương pháp → MethodPicker ─── */}
            {!hasPickedMethod && !hasResult && (
              <section className="card" style={{ padding: 24 }}>
                <MethodPicker onPick={handleMethodPick} questionEmpty={!canCast} />
              </section>
            )}

            {/* ─── STATE 2: Đã chọn phương pháp nhưng chưa gieo → Casting Panel ─── */}
            {hasPickedMethod && !hasResult && (
              <section className="card animate-in" style={{ padding: 20 }}>
                <div className="section-title" style={{ marginBottom: 12 }}>
                  {mode === 'quick'          && '⚡ Gieo nhanh 6 hào'}
                  {mode === 'manual-step'    && '🪙 Gieo từng hào'}
                  {mode === 'mai-hoa-time'   && '🕐 Mai Hoa — Ngày giờ động tâm'}
                  {mode === 'mai-hoa-serial' && '💵 Mai Hoa — Số seri tiền'}
                </div>

                {mode === 'quick' ? (
                  <QuickCastPanel
                    onResult={handleQuickResult}
                    disabled={!canCast}
                  />
                ) : mode === 'manual-step' ? (
                  <ManualLineStepper
                    completedLines={lines}
                    onLineAdded={handleLineAdded}
                    onReset={handleReset}
                    disabled={!canCast}
                  />
                ) : (
                  /* mode === 'mai-hoa-time' | 'mai-hoa-serial' */
                  <MaiHoaPanel
                    mode={mode}
                    question={formData.question}
                    onResult={setMaiHoaResult}
                    onReset={handleMaiHoaReset}
                  />
                )}

                {!canCast && !mode.startsWith('mai-hoa') && (
                  <div style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    background: 'rgba(192,57,43,0.08)',
                    borderRadius: 6,
                    fontSize: '0.8125rem',
                    color: 'var(--color-vermillion)',
                    border: '1px solid rgba(192,57,43,0.2)',
                  }}>
                    ⚠ Hãy nhập việc cần xem ở cột bên trái trước khi gieo quẻ
                  </div>
                )}
              </section>
            )}

            {/* ─── STATE 3: Đã có kết quả ─── */}
            {hasResult && (
              <ResultSection
                mode={mode}
                result={result}
                maiHoaResult={maiHoaResult}
                onChangeMethod={handleChangeMethod}
              />
            )}
          </div>
        </div>
      </main>


      {/* ===== FOOTER ===== */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 16px',
        color: 'var(--color-ink-muted)',
        fontSize: '0.8125rem',
        borderTop: '1px solid rgba(184,134,11,0.15)',
        marginTop: 24,
      }}>
        <span style={{ fontFamily: "'Noto Serif', serif" }}>易</span> IChingNow — Công cụ lập quẻ Kinh Dịch &nbsp;·&nbsp;
        Chỉ lập quẻ, không luận giải
      </footer>

      {/* Responsive grid styles */}
      <style>{`
        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
