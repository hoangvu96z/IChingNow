import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { anLaSoTuVi } from './utils/tuViEngine';
import BirthInputForm from './components/BirthInputForm.jsx';
import LasoChart from './components/LasoChart.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';
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
          </>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <AppFooter
        appId="tuvi"
        colors={tuviTheme}
        tagline="Tử Vi Đẩu Số — Lập lá số trực tuyến, không lưu dữ liệu cá nhân"
      />
    </>
  );
}
