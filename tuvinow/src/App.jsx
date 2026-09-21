import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { anLaSoTuVi } from './utils/tuViEngine';
import BirthInputForm from './components/BirthInputForm.jsx';
import LasoChart from './components/LasoChart.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import TuViAiPanel from './components/TuViAiPanel.jsx';
import { useReadingsApi } from './hooks/useReadingsApi';
import AppHeader from '@shared/components/AppHeader.jsx';
import AppFooter from '@shared/components/AppFooter.jsx';
import { tuviTheme } from '@shared/themes/tuvi.js';

// Generate star particles for background
function StarParticles() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      size: `${1 + Math.random() * 2}px`,
    }));
  }, []);

  return (
    <div className="stars-container">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star-particle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            '--duration': s.duration,
            '--delay': s.delay,
          }}
        />
      ))}
    </div>
  );
}

// Theme toggle button component
function ThemeToggleButton({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={theme === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng'}
      aria-label="Toggle theme"
      type="button"
      id="theme-toggle-btn"
    >
      <span className={`theme-toggle-icon ${theme === 'dark' ? 'active' : ''}`}>
        {theme === 'light' ? '☀️' : '🌙'}
      </span>
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb" />
      </div>
      <span className="theme-toggle-label">
        {theme === 'light' ? 'Sáng' : 'Tối'}
      </span>
    </button>
  );
}

function ReadingSession({ result, inputData, reading, persistReading, onSaved }) {
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const savedId = useRef(reading?.id || null);
  const save = async (aiConversation) => {
    const id = await persistReading(savedId.current, { result, inputData, aiConversation });
    savedId.current = id;
    if (active.current) onSaved(id);
  };
  return <TuViAiPanel result={result} inputData={inputData} initialConversation={reading?.data?.aiConversation} onSave={save} />;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tuvinow_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tuvinow_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const { user, isAuthenticated } = useAuth();
  const { history, error: historyError, loading: historyLoading, loadHistory, persistReading, deleteReading } = useReadingsApi(isAuthenticated, user?.id);
  const [reading, setReading] = useState(null);
  const [sessionId, setSessionId] = useState(0);
  const [historyActionError, setHistoryActionError] = useState('');
  const [chartResult, setChartResult] = useState(null);
  const [inputData, setInputData] = useState(null);
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = useCallback((data) => {
    const { yearCanIndex, yearChiIndex, lunarMonth, lunarDay, lunarHourIndex, gender } = data;

    const result = anLaSoTuVi({
      yearCanIndex,
      yearChiIndex,
      lunarMonth,
      lunarDay: lunarDay,
      lunarHourIndex,
      gender,
    });

    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(result);
    setInputData(data);
    setShowForm(false);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewReading = useCallback(() => {
    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(null);
    setInputData(null);
    setShowForm(true);
  }, []);

  useEffect(() => { handleNewReading(); }, [user?.id, handleNewReading]);

  const openReading = (item) => {
    if (!item.data?.inputData || !Array.isArray(item.data?.result?.palates) || item.data.result.palates.length !== 12) {
      setHistoryActionError('Lá số này thiếu dữ liệu hoặc không giải mã được.');
      return;
    }
    setHistoryActionError('');
    setReading(item);
    setInputData(item.data.inputData);
    setChartResult(item.data.result);
    setShowForm(false);
    setSessionId(value => value + 1);
  };

  return (
    <>
      {/* Animated Background */}
      <div className="app-bg" />
      <StarParticles />

      {/* ===== HEADER ===== */}
      <AppHeader
        appId="tuvi"
        colors={tuviTheme}
        onLogoClick={handleNewReading}
        useAuthHook={useAuth}
        logo={
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🔮</span>
        }
        title="TuViNow"
        subtitle="Tử Vi Đẩu Số Online"
        themeToggle={
          <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
        }
        primaryAction={
          chartResult ? (
            <button
              className="btn-new-reading"
              onClick={handleNewReading}
              style={{
                background: 'rgba(109,213,176,0.12)',
                border: '1px solid rgba(109,213,176,0.4)',
                borderRadius: 8,
                color: '#6dd5b0',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              ✦ Lập lá số mới
            </button>
          ) : null
        }
      />

      {/* Main Content */}
      <main className="app-content">
        {showForm && !chartResult && (
          <BirthInputForm onSubmit={handleSubmit} />
        )}

        {chartResult && (
          <>
            <LasoChart result={chartResult} inputData={inputData} />
            <SummaryPanel result={chartResult} inputData={inputData} />
            <ReadingSession key={`${user?.id || 'guest'}-${sessionId}`} result={chartResult} inputData={inputData} reading={reading} persistReading={persistReading} onSaved={id => setReading(previous => ({ ...previous, id }))} />
          </>
        )}
        {isAuthenticated && <details className="summary-panel tuvi-history">
          <summary>Lịch sử lá số ({history.length})</summary>
          <button onClick={loadHistory} disabled={historyLoading}>{historyLoading ? 'Đang tải…' : 'Tải lại lịch sử'}</button>
          {(historyError || historyActionError) && <p role="alert">{historyError || historyActionError}</p>}
          {!historyLoading && !history.length && <p>Chưa có lá số đã lưu.</p>}
          {history.map(item => <div key={item.id} className="tuvi-history-row">
            <button onClick={() => openReading(item)}>{item.data?.inputData?.name || item.title} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}{item.data?.aiConversation ? ' · Có luận giải AI' : ''}</button>
            <button onClick={async () => {
              if (!window.confirm('Xóa lá số và hội thoại này khỏi lịch sử?')) return;
              try { await deleteReading(item.id); if (reading?.id === item.id) handleNewReading(); }
              catch (err) { setHistoryActionError(err.message); }
            }}>Xóa</button>
          </div>)}
        </details>}
      </main>

      {/* ===== FOOTER ===== */}
      <AppFooter
        appId="tuvi"
        colors={tuviTheme}
        tagline="Tử Vi Đẩu Số — Lập lá số, luận giải AI và lưu lịch sử khi đăng nhập"
      />
    </>
  );
}
