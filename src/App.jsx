import React, { useState, useEffect } from 'react';
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
import DescriptionPanel from './components/DescriptionPanel.jsx';
import HistoryList from './components/HistoryList.jsx';
import { buildResult } from './logic/buildHexagram.js';
import { buildMaiHoaPlainText } from './logic/buildPlainText.js';
import { copyToClipboard, downloadTxt, downloadJson } from './logic/clipboard.js';
import { useLanguage } from './context/LanguageContext.jsx';
import { vi } from './data/translations/vi.js';
import { en } from './data/translations/en.js';

function CanChiInfoBar({ canChi }) {
  const { t, language } = useLanguage();
  if (!canChi) return null;

  const getCanChiLabel = (can, chi) => {
    if (!can || !chi) return '';
    return `${t(`stem.${can}`, can)} ${t(`branch.${chi}`, chi)}`;
  };

  const items = [
    { label: t('canchi.bar_hour', 'Giờ'),   value: getCanChiLabel(canChi.gioCan, canChi.gioChi) },
    { label: t('canchi.bar_day', 'Ngày'),  value: getCanChiLabel(canChi.ngayCan, canChi.ngayChi) },
    { label: t('canchi.bar_month', 'Tháng'), value: getCanChiLabel(canChi.thangCan, canChi.thangChi) },
    { label: t('canchi.bar_year', 'Năm'),   value: getCanChiLabel(canChi.namCan, canChi.namChi) },
  ].filter(i => i.value && !i.value.includes('?'));

  let lunarTrans = canChi.lunarDate || '';
  if (language === 'en' && lunarTrans) {
    lunarTrans = lunarTrans
      .replace('Ngày', 'Day')
      .replace('Tháng', 'Month')
      .replace('Năm', 'Year')
      .replace('tháng', 'month')
      .replace('ngày', 'day')
      .replace('năm', 'year')
      .replace('(Nhuận)', '(Leap)');
    // Translate Vietnamese stems/branches to English PinYin
    Object.keys(vi).forEach(key => {
      if (key.startsWith('stem.') || key.startsWith('branch.')) {
        const viVal = vi[key];
        const enVal = en[key];
        lunarTrans = lunarTrans.replace(new RegExp(`\\b${viVal}\\b`, 'g'), enVal);
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {t('canchi.bar_title', 'Can Chi')}
      </span>
      {items.map(({ label, value }) => (
        <span key={label} style={{ fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-ink-muted)', marginRight: 3 }}>{label}:</span>
          <span style={{ fontWeight: 600, fontFamily: "'Noto Serif', serif" }}>{value}</span>
        </span>
      ))}
      {canChi.khongVong?.length > 0 && (
        <span style={{ fontSize: '0.8125rem', marginLeft: 4 }}>
          <span style={{ color: 'var(--color-ink-muted)', marginRight: 3 }}>{t('canchi.bar_tuan_khong', 'Tuần Không')}:</span>
          <span style={{ fontWeight: 700, color: '#b8860b', fontFamily: "'Noto Serif', serif" }}>
            {canChi.khongVong.map(v => t(`branch.${v}`, v)).join(', ')}
          </span>
        </span>
      )}
      {lunarTrans && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginLeft: 'auto' }}>
          {t('canchi.bar_lunar', 'Âm lịch')}: {lunarTrans}
        </span>
      )}
    </div>
  );
}

function getDefaultForm() {
  const _now = new Date();
  // Lấy thời gian UTC+7 (Việt Nam)
  const vnNow = new Date(_now.getTime() + (_now.getTimezoneOffset() * 60000) + (3600000 * 7));
  const pad = n => String(n).padStart(2, '0');
  return {
    question:      '',
    caster:        '',
    castDate:      `${vnNow.getFullYear()}-${pad(vnNow.getMonth()+1)}-${pad(vnNow.getDate())}`,
    castTime:      `${pad(vnNow.getHours())}:${pad(vnNow.getMinutes())}`,
    useSolarTerm:  false,
    solarTermId:   '',
    solarTerm:     null,
    movingMindDate:'',
    movingMindTime:{ enabled: false, hourBranch: '' },
    lucHaoAlgorithm: 'three-coin',
  };
}

/** Card xuất kết quả cho Mai Hoa — giống PlainTextExportCard nhưng dùng buildMaiHoaPlainText */
function MaiHoaExportCard({ result }) {
  const { t, language } = useLanguage();
  const [copied,  setCopied]  = useState(false);
  const [copiedJ, setCopiedJ] = useState(false);

  const hasResult = !!result;
  const text      = hasResult ? buildMaiHoaPlainText(result, language) : '';

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
            {t('export.header', 'plaintext — kết quả lập quẻ')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: copied  ? t('export.copied_text', '✓ Đã copy') : t('export.copy_text', '⎘ Copy text'), onClick: handleCopyText,  bg: copied  ? '#27c93f' : 'rgba(246,201,14,0.15)', color: copied  ? 'white' : 'var(--color-terminal-accent)' },
            { label: t('export.download_txt', '↓ .txt'),                               onClick: handleDownloadTxt, bg: 'transparent', color: '#718096', border: '1px solid rgba(113,128,150,0.4)' },
            { label: copiedJ ? t('export.copied_json', '✓ JSON')    : t('export.copy_json', '⎘ JSON'),      onClick: handleCopyJson,   bg: copiedJ ? '#27c93f' : 'rgba(39,201,63,0.1)',   color: copiedJ ? 'white' : '#27c93f' },
            { label: t('export.download_json', '↓ .json'),                              onClick: handleDownloadJson, bg: 'transparent', color: '#27c93f', border: '1px solid rgba(39,201,63,0.3)' },
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
          <span style={{ color: 'var(--color-terminal-text)', whiteSpace: 'pre' }}>{text}</span>
        ) : (
          <span style={{ color: '#4a5568', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            {t('export.empty_result', '// Chưa có kết quả.\n// Hãy gieo quẻ để xem kết quả ở đây.')}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Render kết quả cho cả 2 loại phương pháp (coin cast + Mai Hoa)
 */
function ResultSection({ mode, result, maiHoaResult }) {
  if (mode.startsWith('mai-hoa')) {
    return <MaiHoaResultSection result={maiHoaResult} />;
  }
  return <CoinCastResultSection result={result} />;
}

function CoinCastResultSection({ result }) {
  const { t } = useLanguage();
  if (!result) return null;
  return (
    <>
      {/* Quẻ Preview */}
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>{t('result.hex_title', 'Kết quả quẻ')}</div>
        <div className="animate-in">
          <HexagramPreview result={result} />
        </div>
      </section>

      {/* Bảng Lục Hào đầy đủ */}
      <section className="card animate-in" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>{t('result.hex_table', 'Bảng Lục Hào')}</div>
        <LucHaoTable result={result} />
      </section>

      {/* Luận giải cơ bản quẻ Lục Hào */}
      {(result.primaryHexagram || result.changedHexagram) && (
        <section className="card animate-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-title">{t('result.basic_interpretation', 'Luận giải cơ bản')}</div>
          <DescriptionPanel hexagram={result.primaryHexagram} color="var(--color-vermillion)" />
          {result.changedHexagram && (
            <DescriptionPanel hexagram={result.changedHexagram} color="var(--color-jade)" />
          )}
        </section>
      )}

      {/* Can Chi Info */}
      {result.canChi && (
        <section className="card animate-in" style={{ padding: '14px 20px' }}>
          <CanChiInfoBar canChi={result.canChi} />
        </section>
      )}

      {/* Metadata */}
      <section className="card animate-in" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>{t('result.metadata_title', 'Thông tin lần lập quẻ')}</div>
        <ResultMetadata result={result} />
      </section>

      {/* Plaintext Export */}
      <section className="animate-in">
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('result.export_title', '📋 Xuất kết quả')}
        </div>
        <PlainTextExportCard result={result} />
      </section>
    </>
  );
}

function MaiHoaResultSection({ result }) {
  const { t, language } = useLanguage();
  if (!result) return null;

  const getSubModeLabel = () => {
    if (result.subMode === 'time') {
      return t('maihoa.time_title', 'Ngày giờ động tâm').replace('🕐 ', '');
    } else {
      return t('maihoa.serial_title', 'Số seri tiền').replace('💵 ', '');
    }
  };

  return (
    <>
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          {t('maihoa.result_card_title', 'Kết quả quẻ Mai Hoa')}
        </div>
        <div className="animate-in">
          <MaiHoaResultCard result={result} />
        </div>
      </section>

      {/* Câu hỏi + thời gian */}
      <section className="card animate-in" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>{t('result.metadata_title', 'Thông tin lần lập quẻ')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {result.question && (
            <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid rgba(184,134,11,0.1)' }}>
              <span style={{ minWidth: 110, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>
                {t('meta.question', 'Việc cần xem')}
              </span>
              <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif" }}>{result.question}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, padding: '5px 0', borderBottom: '1px solid rgba(184,134,11,0.1)' }}>
            <span style={{ minWidth: 110, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>
              {t('meta.method', 'Phương pháp')}
            </span>
            <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif" }}>
              {getSubModeLabel()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '5px 0' }}>
            <span style={{ minWidth: 110, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)', flexShrink: 0 }}>
              {t('meta.cast_time', 'Thời gian lập')}
            </span>
            <span style={{ fontSize: '0.875rem', fontFamily: "'Noto Serif', serif" }}>
              {language === 'en' ? new Date(result.createdAt).toLocaleString('en-US') : new Date(result.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </section>

      {/* Xuất kết quả Mai Hoa */}
      <section className="animate-in">
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('result.export_title', '📋 Xuất kết quả')}
        </div>
        <MaiHoaExportCard result={result} />
      </section>
    </>
  );
}

export default function App() {
  const { t, language, setLanguage } = useLanguage();
  const [formData,         setFormData]         = useState(getDefaultForm());
  const [mode,             setMode]             = useState('quick');
  const [lines,            setLines]            = useState([]);
  const [result,           setResult]           = useState(null);
  const [maiHoaResult,     setMaiHoaResult]     = useState(null);
  const [hasPickedMethod,  setHasPickedMethod]  = useState(false);

  // Lịch sử gieo quẻ
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('iching_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const hasResult = !!(result || maiHoaResult);

  // Tự động lưu Lục Hào vào lịch sử
  useEffect(() => {
    if (result) {
      saveToHistory(result, 'luc-hao');
    }
  }, [result]);

  // Tự động lưu Mai Hoa vào lịch sử
  useEffect(() => {
    if (maiHoaResult) {
      saveToHistory(maiHoaResult, 'mai-hoa');
    }
  }, [maiHoaResult]);

  const saveToHistory = (newResult, type) => {
    if (!newResult) return;

    setHistory(prev => {
      // Tránh trùng lặp nếu quẻ đã tồn tại trong lịch sử (check bằng createdAt)
      const exists = prev.some(item => item.data.createdAt === newResult.createdAt);
      if (exists) return prev;

      const title = type === 'luc-hao'
        ? `${newResult.primaryHexagram?.nameVi}${newResult.changedHexagram ? ' ➔ ' + newResult.changedHexagram.nameVi : ''}`
        : `${newResult.primaryHexagram?.nameVi} (Chủ) ➔ ${newResult.changedHexagram?.nameVi} (Biến)`;

      const newItem = {
        id: Date.now().toString(),
        timestamp: newResult.createdAt || new Date().toISOString(),
        question: newResult.question || '(Không có câu hỏi)',
        type,
        title,
        mode: newResult.mode || (type === 'mai-hoa' ? `mai-hoa-${newResult.subMode}` : 'quick'),
        data: newResult
      };

      const updated = [newItem, ...prev].slice(0, 10);
      localStorage.setItem('iching_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectHistoryItem = (item) => {
    if (item.type === 'luc-hao') {
      setResult(item.data);
      setMaiHoaResult(null);
    } else {
      setMaiHoaResult(item.data);
      setResult(null);
    }
    setMode(item.mode);
    setHasPickedMethod(true);

    // Phục hồi lại dữ liệu form
    if (item.data) {
      const dt = new Date(item.data.createdAt);
      const pad = n => String(n).padStart(2, '0');
      setFormData({
        question:      item.data.question || '',
        caster:        item.data.caster || '',
        castDate:      `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`,
        castTime:      `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
        useSolarTerm:  item.data.useSolarTerm || false,
        solarTermId:   item.data.solarTermId || '',
        solarTerm:     item.data.solarTerm || null,
        movingMindDate: item.data.movingMindDate || '',
        movingMindTime: item.data.movingMindTime || { enabled: false, hourBranch: '' },
      });
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('iching_history');
  };

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
                {t('app.subtitle', 'Lập Quẻ Kinh Dịch')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a 
              href="https://vunph.id.vn/tarot/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f5d78e'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'}
            >
              {t('nav.tarot', '🃏 Xem Tarot')}
            </a>

            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: 'white',
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>

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
                {t('nav.new_hexagram', '🔄 Lập quẻ mới')}
              </button>
            )}
          </div>
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
                {t('form.title', 'Thông tin lập quẻ')}
              </div>
              <CastingForm
                formData={formData}
                onChange={setFormData}
                showLucHaoOptions={hasPickedMethod && !mode.startsWith('mai-hoa')}
              />
            </section>

            {/* Lịch sử gieo quẻ */}
            <HistoryList
              history={history}
              onSelect={handleSelectHistoryItem}
              onClear={handleClearHistory}
              currentActiveData={result || maiHoaResult}
            />
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
                  {mode === 'quick'          && `⚡ ${t('picker.luc_hao', 'LỤC HÀO')}: ${t('method.quick.title', 'Gieo nhanh')}`}
                  {mode === 'manual-step'    && `🪙 ${t('picker.luc_hao', 'LỤC HÀO')}: ${t('method.manual.title', 'Gieo từng hào')}`}
                  {mode === 'mai-hoa-time'   && t('maihoa.time_title', '🕐 Mai Hoa — Ngày giờ động tâm')}
                  {mode === 'mai-hoa-serial' && t('maihoa.serial_title', '💵 Mai Hoa — Số seri tiền')}
                </div>

                {mode === 'quick' ? (
                  <QuickCastPanel
                    onResult={handleQuickResult}
                    disabled={!canCast}
                    algorithm={formData.lucHaoAlgorithm}
                  />
                ) : mode === 'manual-step' ? (
                  <ManualLineStepper
                    completedLines={lines}
                    onLineAdded={handleLineAdded}
                    onReset={handleReset}
                    disabled={!canCast}
                    algorithm={formData.lucHaoAlgorithm}
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
                    {t('panel.need_question_warning', '⚠ Hãy nhập việc cần xem ở cột bên trái trước khi gieo quẻ')}
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
                  alignSelf: 'center',
                }}
              >
                {t('nav.change_method', '← Đổi phương pháp gieo')}
              </button>
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
        {t('footer.text', '易 IChingNow — Công cụ lập quẻ Kinh Dịch  ·  Chỉ lập quẻ, không luận giải')}
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
