import TuViEvidenceProvider from './components/TuViEvidenceProvider';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { anLaSoTuVi } from './utils/tuViEngine';
import BirthInputForm from './components/BirthInputForm.jsx';
import LasoChart from './components/LasoChart.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [manualSaveStatus, setManualSaveStatus] = useState('');

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
    setManualSaveStatus('');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewReading = useCallback(() => {
    setReading(null);
    setSessionId(value => value + 1);
    setChartResult(null);
    setInputData(null);
    setShowForm(true);
    setManualSaveStatus('');
  }, []);

  useEffect(() => { handleNewReading(); }, [user?.id, handleNewReading]);

  // Auto-save newly calculated chart to history when user is authenticated
  useEffect(() => {
    if (chartResult && inputData && isAuthenticated && user?.id && !reading?.id) {
      persistReading(null, { result: chartResult, inputData })
        .then((savedId) => {
          if (savedId) {
            setReading({ id: savedId, data: { result: chartResult, inputData } });
            setManualSaveStatus('Đã lưu');
          }
        })
        .catch((err) => {
          console.warn('Auto-save reading error:', err);
        });
    }
  }, [chartResult, inputData, isAuthenticated, user?.id, reading?.id, persistReading]);

  const handleManualSave = async () => {
    if (!isAuthenticated) return;
    try {
      setManualSaveStatus('Đang lưu...');
      const savedId = await persistReading(reading?.id || null, { result: chartResult, inputData, aiConversation: reading?.data?.aiConversation });
      if (savedId) {
        setReading(prev => ({ ...(prev || {}), id: savedId, data: { ...(prev?.data || {}), result: chartResult, inputData } }));
        setManualSaveStatus('Đã lưu ✓');
      }
    } catch (err) {
      setManualSaveStatus('Lỗi lưu');
      alert(`Chưa lưu được: ${err.message}`);
    }
  };

  const openReading = (item) => {
    if (!item.data?.inputData) {
      setHistoryActionError('Lá số này thiếu dữ liệu đầu vào.');
      return;
    }
    setHistoryActionError('');
    let result = item.data.result;
    if (!result || !Array.isArray(result.palates) || result.palates.length !== 12) {
      try {
        result = anLaSoTuVi(item.data.inputData);
      } catch {
        setHistoryActionError('Không thể lập lại lá số từ dữ liệu.');
        return;
      }
    }
    setReading(item);
    setInputData(item.data.inputData);
    setChartResult(result);
    setShowForm(false);
    setShowHistoryModal(false);
    setSessionId(value => value + 1);
    setManualSaveStatus('Đã lưu');
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
        primaryAction={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthenticated && (
              <button
                className="btn-history"
                onClick={() => setShowHistoryModal(true)}
                title="Xem lịch sử lá số"
                style={{
                  background: 'rgba(155, 89, 182, 0.15)',
                  border: '1px solid rgba(155, 89, 182, 0.4)',
                  borderRadius: '8px',
                  color: '#d8b4fe',
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                📜 Lịch sử {history.length > 0 ? `(${history.length})` : ''}
              </button>
            )}
            {chartResult && (
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
                }}
              >
                ✦ Lập lá số mới
              </button>
            )}
          </div>
        }
      />

      {/* Main Content */}
      <main className="app-content">
        {showForm && !chartResult && (
          <>
            <BirthInputForm onSubmit={handleSubmit} />
            {isAuthenticated && history.length > 0 && (
              <div
                style={{
                  maxWidth: '860px',
                  margin: '24px auto 0',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(155, 89, 182, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem' }}>📜</span>
                  <div>
                    <strong style={{ color: '#ffd700', fontSize: '0.95rem' }}>
                      Lịch sử lá số của bạn ({history.length})
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                      Xem lại các lá số và luận giải AI bạn đã lập trước đây.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #7c5cfc 0%, #9b59b6 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 10px rgba(124, 92, 252, 0.3)',
                  }}
                >
                  Mở lịch sử
                </button>
              </div>
            )}
          </>
        )}

        {chartResult && (
          <>
            {/* Quick Actions Bar */}
            <div
              style={{
                maxWidth: '1200px',
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '0 4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleNewReading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  ← Lập lá số khác
                </button>
                {isAuthenticated && (
                  <button
                    onClick={handleManualSave}
                    style={{
                      background: manualSaveStatus === 'Đã lưu ✓' || manualSaveStatus === 'Đã lưu'
                        ? 'rgba(109, 213, 176, 0.15)'
                        : 'rgba(255, 255, 255, 0.06)',
                      border: manualSaveStatus === 'Đã lưu ✓' || manualSaveStatus === 'Đã lưu'
                        ? '1px solid rgba(109, 213, 176, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: manualSaveStatus === 'Đã lưu ✓' || manualSaveStatus === 'Đã lưu'
                        ? '#6dd5b0'
                        : '#cbd5e1',
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    💾 {manualSaveStatus || 'Lưu vào lịch sử'}
                  </button>
                )}
              </div>
              {isAuthenticated && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  style={{
                    background: 'rgba(155, 89, 182, 0.15)',
                    border: '1px solid rgba(155, 89, 182, 0.3)',
                    borderRadius: '8px',
                    color: '#d8b4fe',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📜 Lịch sử ({history.length})
                </button>
              )}
            </div>

            <TuViEvidenceProvider key={`${user?.id || 'guest'}-${sessionId}`} result={chartResult}>
            <LasoChart result={chartResult} inputData={inputData} />
            <SummaryPanel result={chartResult} inputData={inputData} />
            <ReadingSession key={`${user?.id || 'guest'}-${sessionId}`} result={chartResult} inputData={inputData} reading={reading} persistReading={persistReading} onSaved={id => { setReading(previous => ({ ...previous, id })); setManualSaveStatus('Đã lưu ✓'); }} />
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
