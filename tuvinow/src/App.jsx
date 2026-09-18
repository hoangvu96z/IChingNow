import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { anLaSoTuVi } from './utils/tuViEngine';
import BirthInputForm from './components/BirthInputForm.jsx';
import LasoChart from './components/LasoChart.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
import AuthUserBadge from './components/AuthUserBadge.jsx';

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

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuth();
  
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

    setChartResult(result);
    setInputData(data);
    setShowForm(false);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNewReading = useCallback(() => {
    setChartResult(null);
    setInputData(null);
    setShowForm(true);
  }, []);

  return (
    <>
      {/* Animated Background */}
      <div className="app-bg" />
      <StarParticles />

      {/* Header */}
      <header className="app-header">
        <div className="header-brand" onClick={handleNewReading}>
          <span className="header-logo">🔮</span>
          <div>
            <div className="header-title">TuVi Now</div>
            <div className="header-subtitle">Tử Vi Đẩu Số Online</div>
          </div>
        </div>
        <div className="header-actions">
          {chartResult && (
            <button className="btn-new-reading" onClick={handleNewReading}>
              ✦ Lập lá số mới
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
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
          <AuthUserBadge />
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {showForm && !chartResult && (
          <BirthInputForm onSubmit={handleSubmit} />
        )}

        {chartResult && (
          <>
            <LasoChart result={chartResult} inputData={inputData} />
            <SummaryPanel result={chartResult} inputData={inputData} />
          </>
        )}
      </main>
    </>
  );
}
