import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppFooter from '@shared/components/AppFooter.jsx';
import TalkWithMePage from './components/TalkWithMePage.jsx';

function StarParticles() {
  const stars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
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

function ThemeToggleButton({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={theme === 'light' ? 'Chuyển sang chế độ Tối' : 'Chuyển sang chế độ Sáng'}
      aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
      type="button"
    >
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
    </button>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('twm_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('twm_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <>
      <div className="app-bg" />
      <StarParticles />

      {/* Simple Header */}
      <header className="twm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>💬</span>
          <div>
            <div style={{ font: '600 1.05rem var(--font-display)', color: 'var(--accent-cyan)' }}>TalkWithMe</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>LIÊN HỆ NHANH</div>
          </div>
        </div>
        <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
      </header>

      <main className="app-content">
        <TalkWithMePage />
      </main>

      <AppFooter
        appId="talkwithme"
        colors={{
          accent: '#38bdf8',
          footerBorder: 'rgba(56, 189, 248, 0.18)',
          footerLink: 'var(--text-secondary, rgba(255,255,255,0.65))',
          footerText: 'var(--text-muted, rgba(255,255,255,0.45))',
          footerDot: 'rgba(56, 189, 248, 0.3)',
        }}
        tagline="TalkWithMe — Hòm thư trực tuyến, kết nối và gửi phản hồi ẩn danh hoặc định danh"
      />
    </>
  );
}
