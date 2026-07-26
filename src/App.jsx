import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useReadingsApi } from './hooks/useReadingsApi.js';
import CastingForm from './components/CastingForm.jsx';
import MethodPicker from './components/MethodPicker.jsx';
import QuickCastPanel from './components/QuickCastPanel.jsx';
import ManualLineStepper from './components/ManualLineStepper.jsx';
import HexagramPreview from './components/HexagramPreview.jsx';
import LucHaoCombinedTabCard from './components/LucHaoCombinedTabCard.jsx';
import ResultMetadata from './components/ResultMetadata.jsx';
import PlainTextExportCard from './components/PlainTextExportCard.jsx';
import MaiHoaPanel from './components/MaiHoaPanel.jsx';
import MaiHoaResultCard from './components/MaiHoaResultCard.jsx';
import DescriptionPanel from './components/DescriptionPanel.jsx';
import HistoryList from './components/HistoryList.jsx';
import HistoryManagementModal from './components/HistoryManagementModal.jsx';
import AiInterpretationPanel from './components/AiInterpretationPanel.jsx';
import AppHeader from './components/AppHeader.jsx';
import { buildResult } from './logic/buildHexagram.js';
import { buildMaiHoaPlainText, buildPlainTextResult } from './logic/buildPlainText.js';
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
  const { isAuthenticated, login } = useAuth();
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

  if (!isAuthenticated) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px dashed rgba(184, 134, 11, 0.3)',
          borderRadius: 12,
          padding: '24px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: '1.8rem' }}>🔒</span>
        <p
          style={{
            margin: 0,
            fontSize: '0.88rem',
            color: 'var(--color-ink-muted, #718096)',
            lineHeight: 1.5,
            maxWidth: 640,
          }}
        >
          {t('export.guest_notice', 'Bạn cần đăng nhập để sử dụng tính năng xuất kết quả quẻ Kinh Dịch.')}
        </p>
        <button
          type="button"
          onClick={login}
          style={{
            padding: '8px 20px',
            background: 'linear-gradient(135deg, #7c5cfc, #a78bfa)',
            border: 'none',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124,92,252,0.4)',
          }}
        >
          🔑 {t('auth.login_now', 'Đăng nhập ngay')}
        </button>
      </div>
    );
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
          <span style={{ color: 'var(--color-terminal-text)', whiteSpace: 'pre-wrap' }}>{text}</span>
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
function ResultSection({ mode, result, maiHoaResult, onChangeMethod, activeReadingId, updateReadingData }) {
  if (mode.startsWith('mai-hoa')) {
    return <MaiHoaResultSection result={maiHoaResult} onChangeMethod={onChangeMethod} activeReadingId={activeReadingId} updateReadingData={updateReadingData} />;
  }
  return <CoinCastResultSection result={result} onChangeMethod={onChangeMethod} activeReadingId={activeReadingId} updateReadingData={updateReadingData} />;
}

function CoinCastResultSection({ result, onChangeMethod, activeReadingId, updateReadingData }) {
  const { t, language } = useLanguage();
  if (!result) return null;
  const plainText = buildPlainTextResult(result, language);

  return (
    <>
      {/* Quẻ Preview */}
      <section className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>{t('result.hex_title', 'Kết quả quẻ')}</div>
        <div className="animate-in">
          <HexagramPreview result={result} />
        </div>
      </section>

      {/* Combined Tabbed Section: Bảng Lục Hào & Luận Giải Cơ Bản (2 Tabs, Default: Bảng Lục Hào) */}
      <LucHaoCombinedTabCard result={result} />

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

      {/* Nút Đổi phương pháp gieo (Nằm ngay dưới Thông tin lần lập quẻ) */}
      {onChangeMethod && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 10px' }}>
          <button
            type="button"
            onClick={onChangeMethod}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 24,
              background: 'rgba(184, 134, 11, 0.12)',
              border: '1.5px solid var(--color-gold, #b8860b)',
              color: 'var(--color-gold, #b8860b)',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(184, 134, 11, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            {t('nav.change_method', '← Đổi phương pháp gieo')}
          </button>
        </div>
      )}

      {/* Luận giải bằng AI (Ưu tiên đưa lên trên xuất kết quả) */}
      <AiInterpretationPanel result={result} mode="coin" plainTextResult={plainText} readingId={activeReadingId} onSaveAiConversation={updateReadingData} />

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

function MaiHoaResultSection({ result, onChangeMethod, activeReadingId, updateReadingData }) {
  const { t, language } = useLanguage();
  if (!result) return null;
  const plainText = buildMaiHoaPlainText(result, language);

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

      {/* Nút Đổi phương pháp gieo (Nằm ngay dưới Thông tin lần lập quẻ) */}
      {onChangeMethod && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 10px' }}>
          <button
            type="button"
            onClick={onChangeMethod}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 24,
              background: 'rgba(184, 134, 11, 0.12)',
              border: '1.5px solid var(--color-gold, #b8860b)',
              color: 'var(--color-gold, #b8860b)',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(184, 134, 11, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            {t('nav.change_method', '← Đổi phương pháp gieo')}
          </button>
        </div>
      )}

      {/* Luận giải bằng AI (Ưu tiên đưa lên trên xuất kết quả) */}
      <AiInterpretationPanel result={result} mode={result.subMode} plainTextResult={plainText} readingId={activeReadingId} onSaveAiConversation={updateReadingData} />

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
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // ─── Auth + Readings API ──────────────────────────────────────────────────
  const { isAuthenticated } = useAuth();
  const {
    history,
    historyLoaded,
    loadHistory,
    saveReading,
    deleteMultipleReadings,
    clearHistory: handleClearHistory,
    updateReadingData,
  } = useReadingsApi(isAuthenticated);

  // Track reading ID đang active (để lưu AI conversation)
  const [activeReadingId, setActiveReadingId] = useState(null);

  // Tải lịch sử khi mount hoặc khi auth state thay đổi
  useEffect(() => {
    loadHistory();
  }, [loadHistory, isAuthenticated]);

  const hasResult = !!(result || maiHoaResult);

  // Tự động lưu Lục Hào vào lịch sử (Chỉ khi quẻ mới được lập, chưa có activeReadingId)
  useEffect(() => {
    if (result && !activeReadingId) {
      saveReading(result, 'luc-hao').then((saved) => {
        if (saved?.id) {
          setActiveReadingId(saved.id);
          const url = new URL(window.location.href);
          url.searchParams.set('id', saved.id);
          window.history.pushState({ id: saved.id }, '', url.toString());
        }
      }).catch(() => {});
    }
  }, [result, activeReadingId, saveReading]);

  // Tự động lưu Mai Hoa vào lịch sử (Chỉ khi quẻ mới được lập, chưa có activeReadingId)
  useEffect(() => {
    if (maiHoaResult && !activeReadingId) {
      saveReading(maiHoaResult, 'mai-hoa').then((saved) => {
        if (saved?.id) {
          setActiveReadingId(saved.id);
          const url = new URL(window.location.href);
          url.searchParams.set('id', saved.id);
          window.history.pushState({ id: saved.id }, '', url.toString());
        }
      }).catch(() => {});
    }
  }, [maiHoaResult, activeReadingId, saveReading]);

  const handleSelectHistoryItem = useCallback((item) => {
    if (!item) return;

    if (item.type === 'luc-hao') {
      setResult(item.data);
      setMaiHoaResult(null);
    } else {
      setMaiHoaResult(item.data);
      setResult(null);
    }
    setMode(item.mode);
    setHasPickedMethod(true);
    
    const targetId = item._remoteId || item.id || null;
    setActiveReadingId(targetId);

    if (targetId) {
      const url = new URL(window.location.href);
      url.searchParams.set('id', targetId);
      window.history.pushState({ id: targetId }, '', url.toString());
    }

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

    setTimeout(() => {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }, 100);
  }, []);

  // Tự động load quẻ khi có ?id=xxx trên URL
  useEffect(() => {
    if (!history || history.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    if (urlId) {
      const found = history.find(h => String(h.id) === String(urlId) || String(h._remoteId) === String(urlId));
      if (found) {
        handleSelectHistoryItem(found);
      }
    }
  }, [history, handleSelectHistoryItem]);

  // handleClearHistory đã được cung cấp từ useReadingsApi hook ở trên

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
    setActiveReadingId(null);
    setLines(newLines);
    computeResult(newLines, 'quick');
  }

  // Manual step: one line added
  function handleLineAdded(line) {
    if (lines.length === 0) setActiveReadingId(null);
    const next = [...lines, line];
    setLines(next);
    computeResult(next, 'manual-step');
  }

  // Reset (chỉ xoá lines + result, giữ mode để user gieo lại)
  function handleReset() {
    setActiveReadingId(null);
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
      <AppHeader
        theme="iching"
        logo={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[true, false, true].map((yang, i) => (
              yang
                ? <div key={i} style={{ width: 22, height: 4, background: '#d4a017', borderRadius: 2 }} />
                : <div key={i} style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 9, height: 4, background: '#d4a017', borderRadius: 2 }} />
                    <div style={{ width: 9, height: 4, background: '#d4a017', borderRadius: 2 }} />
                  </div>
            ))}
          </div>
        }
        title="易 IChingNow"
        subtitle={t('app.subtitle', 'Lập Quẻ Kinh Dịch')}
        navItems={[
          {
            label: t('nav.tarot', '🃏 Xem Tarot'),
            href: 'https://vunph.id.vn/tarot/',
            external: true,
          },
        ]}
        onLanguageToggle={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
        languageLabel={language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
        primaryAction={
          (result || maiHoaResult) ? (
            <button
              onClick={handleFullReset}
              style={{
                background: 'rgba(212,160,23,0.12)',
                border: '1px solid rgba(212,160,23,0.4)',
                borderRadius: 8,
                color: '#f5d78e',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              {t('nav.new_hexagram', '🔄 Lập quẻ mới')}
            </button>
          ) : null
        }
      />

      {/* ===== MAIN LAYOUT ===== */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* 1. Form nhập liệu (Ở TRÊN CÙNG / GIỮA) */}
          <section className="card" style={{ padding: 24 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>
              {t('form.title', 'Thông tin lập quẻ')}
            </div>
            <CastingForm
              formData={formData}
              onChange={setFormData}
              showLucHaoOptions={hasPickedMethod && !mode.startsWith('mai-hoa')}
            />
          </section>

          {/* 2. Chọn phương pháp / Bảng gieo / Kết quả */}
          {/* ─── STATE 1: Chưa chọn phương pháp → MethodPicker ─── */}
          {!hasPickedMethod && !hasResult && (
            <section className="card" style={{ padding: 24 }}>
              <MethodPicker onPick={handleMethodPick} questionEmpty={!canCast} />
            </section>
          )}

          {/* ─── STATE 2: Đã chọn phương pháp nhưng chưa gieo → Casting Panel ─── */}
          {hasPickedMethod && !hasResult && (
            <section className="card animate-in" style={{ padding: 24 }}>
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
                  onResult={(res) => {
                    setActiveReadingId(null);
                    setMaiHoaResult(res);
                  }}
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
                  {t('panel.need_question_warning', '⚠ Hãy nhập việc cần xem ở bên trên trước khi gieo quẻ')}
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
              activeReadingId={activeReadingId}
              updateReadingData={updateReadingData}
            />
          )}

          {/* Nút "Đổi phương pháp" nếu đang ở state casting trước khi có kết quả */}
          {hasPickedMethod && !hasResult && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <button
                type="button"
                onClick={handleChangeMethod}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 24,
                  background: 'rgba(184, 134, 11, 0.12)',
                  border: '1.5px solid var(--color-gold, #b8860b)',
                  color: 'var(--color-gold, #b8860b)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(184, 134, 11, 0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('nav.change_method', '← Đổi phương pháp gieo')}
              </button>
            </div>
          )}

          {/* 3. Lịch sử gieo quẻ (Ở CUỐI CÙNG) */}
          <HistoryList
            history={history}
            onSelect={handleSelectHistoryItem}
            onOpenManageModal={() => setIsManageModalOpen(true)}
            currentActiveData={result || maiHoaResult}
          />

          {/* Modal Quản lý lịch sử */}
          <HistoryManagementModal
            isOpen={isManageModalOpen}
            onClose={() => setIsManageModalOpen(false)}
            history={history}
            onSelect={handleSelectHistoryItem}
            onDeleteMultiple={deleteMultipleReadings}
            onClearAll={handleClearHistory}
          />
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
