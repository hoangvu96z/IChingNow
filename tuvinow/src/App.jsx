import TuViEvidenceProvider from './components/TuViEvidenceProvider';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { anLaSoTuVi } from './utils/tuViEngine';
import BirthInputForm from './components/BirthInputForm.jsx';
import LasoChart from './components/LasoChart.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import TuViLocalReport from './components/TuViLocalReport.jsx';
import TuViAiPanel from './components/TuViAiPanel.jsx';
import { useReadingsApi } from './hooks/useReadingsApi';
import TuViHistoryModal from './components/TuViHistoryModal.jsx';
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
      aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
      type="button"
      id="theme-toggle-btn"
    >
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
    </button>
  );
}

function ReadingSession({ result, inputData, reading, persistReading, ensureChartSaved, onSaved }) {
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const savedId = useRef(reading?.id || null);
  const save = async (aiConversation) => {
    if (!savedId.current) savedId.current = await ensureChartSaved();
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [retrySave, setRetrySave] = useState(0);
  const chartSaveRef = useRef(null);

  useEffect(() => {
    const retry = () => setRetrySave(value => value + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, []);

  const handleSubmit = useCallback((data) => {
    const result = anLaSoTuVi(data);

    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(result);
    setInputData(data);
    setShowForm(false);
    chartSaveRef.current = null;
    setSaveStatus('');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewReading = useCallback(() => {
    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(null);
    setInputData(null);
    setShowForm(true);
    chartSaveRef.current = null;
    setSaveStatus('');
  }, []);

  useEffect(() => { handleNewReading(); }, [user?.id, handleNewReading]);

  // Initial chart save and AI save share one in-flight creation request.
  const ensureChartSaved = useCallback(() => {
    if (chartSaveRef.current) return chartSaveRef.current;
    setSaveStatus('Đang tự lưu lá số…');
    const pending = persistReading(null, { result: chartResult, inputData });
    chartSaveRef.current = pending;
    pending.then(id => {
      if (chartSaveRef.current !== pending) return;
      setReading({ id, data: { result: chartResult, inputData } });
      setSaveStatus('Đã tự lưu lá số');
    }).catch(() => {
      if (chartSaveRef.current !== pending) return;
      chartSaveRef.current = null;
      setSaveStatus('Chưa lưu được lá số. Sẽ thử lại khi kết nối phục hồi.');
    });
    return pending;
  }, [persistReading, chartResult, inputData]);

  useEffect(() => {
    if (chartResult && inputData && isAuthenticated && user?.id && !reading?.id) {
      ensureChartSaved().catch(() => {});
    }
  }, [chartResult, inputData, isAuthenticated, user?.id, reading?.id, ensureChartSaved, retrySave]);

  const openReading = (item) => {
    if (!item.data?.inputData) {
      setHistoryActionError('Lá số này thiếu dữ liệu đầu vào.');
      return;
    }
    setHistoryActionError('');
    let result = item.data.result;
    let restoredReading = item;
    if (!result || !Array.isArray(result.palates) || result.palates.length !== 12) {
      try {
        result = anLaSoTuVi(item.data.inputData);
        // Old AI text must not be paired with a newly calculated chart.
        restoredReading = { ...item, data: { ...item.data, result, aiConversation: null } };
      } catch {
        setHistoryActionError('Không thể lập lại lá số từ dữ liệu.');
        return;
      }
    }
    setReading(restoredReading);
    chartSaveRef.current = null;
    setInputData(item.data.inputData);
    setChartResult(result);
    setShowForm(false);
    setShowHistoryModal(false);
    setSessionId(value => value + 1);
    setSaveStatus('Đã lưu trong lịch sử');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        primaryAction={chartResult && (
          <button
            type="button"
            className="tuvi-header-new"
            onClick={handleNewReading}
            title="Lập lá số mới"
            aria-label="Lập lá số mới"
          >
            <span aria-hidden="true">✦</span>
          </button>
        )}
      />

      {/* Main Content */}
      <main className="app-content">
        {showForm && !chartResult && (
          <>
            <BirthInputForm onSubmit={handleSubmit} />
            {isAuthenticated && history.length > 0 && (
              <div className="tuvi-form-history">
                <div>
                  <strong>Lịch sử lá số ({history.length})</strong>
                  <p>Xem lại lá số và luận giải đã tự lưu.</p>
                </div>
                <button className="tuvi-history-link" type="button" onClick={() => setShowHistoryModal(true)}>
                  Mở lịch sử
                </button>
              </div>
            )}
          </>
        )}

        {chartResult && (
          <>
            {isAuthenticated && (
              <div className="tuvi-chart-toolbar">
                <span className="tuvi-auto-save-status" role="status">{saveStatus}</span>
                <button className="tuvi-history-link" type="button" onClick={() => setShowHistoryModal(true)}>
                  <span aria-hidden="true">📜</span> Lịch sử ({history.length})
                </button>
              </div>
            )}

            <TuViEvidenceProvider key={`${user?.id || 'guest'}-${sessionId}`} result={chartResult}>
            <LasoChart result={chartResult} inputData={inputData} />
            <SummaryPanel result={chartResult} inputData={inputData} />
            <TuViLocalReport result={chartResult} />
            <ReadingSession key={`${user?.id || 'guest'}-${sessionId}`} result={chartResult} inputData={inputData} reading={reading} persistReading={persistReading} ensureChartSaved={ensureChartSaved} onSaved={id => { setReading(previous => ({ ...previous, id })); setSaveStatus('Đã tự lưu lá số và hội thoại'); }} />
            </TuViEvidenceProvider>
          </>
        )}
      </main>

      {/* History Modal */}
      <TuViHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        loading={historyLoading}
        onSelect={openReading}
        onDelete={deleteReading}
        onRefresh={loadHistory}
      />

      {/* ===== FOOTER ===== */}
      <AppFooter
        appId="tuvi"
        colors={tuviTheme}
        tagline="Tử Vi Đẩu Số — Lập lá số, luận giải AI và lưu lịch sử khi đăng nhập"
      />
    </>
  );
}
