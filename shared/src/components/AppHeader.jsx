import React, { useState, useEffect, useRef } from 'react';
import SharedAuthUserBadge from './AuthUserBadge.jsx';

/**
 * ============================================================
 * Shared AppHeader — used by IChingNow, TarotNow, TuViNow
 * ============================================================
 *
 * Props:
 *   appId: 'iching' | 'tarot' | 'tuvi'
 *     Identifies which app is currently active (highlights it in the apps dropdown).
 *
 *   colors: {
 *     bg, accent, accentSoft, accentHover, text, textMuted, border, drawerBg, titleFont
 *   }
 *   Import from shared/src/themes/iching|tarot|tuvi.js
 *
 *   logo: ReactNode       — logo element on the left
 *   title: string         — app name
 *   subtitle: string      — tagline shown under title
 *   onLogoClick: fn       — click brand → reset/home
 *
 *   useAuthHook: fn       — pass useAuth from app's AuthContext.jsx
 *
 *   primaryAction: ReactNode
 *     e.g. "Lập quẻ mới" / "Rút bài mới" / "Lập lá số mới" button
 *
 *   onLanguageToggle: fn  — optional
 *   languageLabel: string — optional
 *
 *   themeToggle: ReactNode — optional, e.g. TuViNow's light/dark switch
 */

// ─── Apps registry ─────────────────────────────────────────────────────────
const APPS = [
  {
    id: 'iching',
    icon: '☯️',
    name: 'IChingNow',
    tagline: 'Lập Quẻ Kinh Dịch',
    url: '/kinhdich/',
    color: '#d4a017',
  },
  {
    id: 'tarot',
    icon: '🃏',
    name: 'TarotNow',
    tagline: 'Trải Bài Tarot & AI',
    url: '/tarot/',
    color: '#e5c158',
  },
  {
    id: 'tuvi',
    icon: '🔮',
    name: 'TuViNow',
    tagline: 'Tử Vi Đẩu Số',
    url: '/tuvi/',
    color: '#6dd5b0',
  },
];

// ─── Apps Dropdown ──────────────────────────────────────────────────────────
function AppsDropdown({ appId, colors }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="apps-dropdown-btn"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: open ? colors.accentSoft : 'transparent',
          border: `1px solid ${open ? colors.accent : colors.border}`,
          borderRadius: 8,
          color: open ? colors.accent : colors.textMuted,
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          fontWeight: 600,
          fontFamily: 'inherit',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.color = colors.accent;
            e.currentTarget.style.borderColor = colors.accent;
            e.currentTarget.style.background = colors.accentSoft;
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.color = colors.textMuted;
            e.currentTarget.style.borderColor = colors.border;
            e.currentTarget.style.background = 'transparent';
          }
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Ứng Dụng
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#12121e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 8,
          minWidth: 240,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          zIndex: 2000,
        }}>
          <div style={{
            padding: '6px 12px 8px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Chọn Ứng Dụng
          </div>

          {APPS.map(app => {
            const isActive = app.id === appId;
            return isActive ? (
              <div
                key={app.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: `rgba(${hexToRgb(app.color)}, 0.12)`,
                  border: `1px solid rgba(${hexToRgb(app.color)}, 0.3)`,
                  marginBottom: 4,
                  cursor: 'default',
                }}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{app.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.875rem', fontWeight: 700, color: app.color,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {app.name}
                    <span style={{
                      fontSize: '0.6rem', background: app.color, color: '#000',
                      padding: '1px 6px', borderRadius: 20, fontWeight: 800, lineHeight: 1.6,
                    }}>ĐANG DÙNG</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                    {app.tagline}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={app.id}
                href={app.url}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 4,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{app.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                    {app.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                    {app.tagline}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper: hex color "#rrggbb" → "r,g,b"
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '255,255,255';
}

// ─── Mobile Apps List (in drawer) ──────────────────────────────────────────
function MobileAppsList({ appId, colors }) {
  return (
    <div>
      <div style={{
        fontSize: '0.7rem', fontWeight: 700, color: colors.textMuted,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        padding: '4px 0 8px',
      }}>
        Ứng Dụng
      </div>
      {APPS.map(app => {
        const isActive = app.id === appId;
        return isActive ? (
          <div key={app.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <span style={{ fontSize: '1.1rem' }}>{app.icon}</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: app.color }}>
              {app.name}
            </span>
            <span style={{
              fontSize: '0.6rem', background: app.color, color: '#000',
              padding: '1px 5px', borderRadius: 20, fontWeight: 800, marginLeft: 'auto', lineHeight: 1.6,
            }}>ĐANG DÙNG</span>
          </div>
        ) : (
          <a key={app.id} href={app.url} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: `1px solid ${colors.border}`,
            textDecoration: 'none', color: colors.text, fontSize: '0.9375rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{app.icon}</span>
            {app.name}
          </a>
        );
      })}
    </div>
  );
}

// ─── Main AppHeader ─────────────────────────────────────────────────────────
export default function AppHeader({
  appId = 'iching',
  colors,
  logo,
  title,
  subtitle,
  onLogoClick,
  useAuthHook,
  primaryAction,
  onLanguageToggle,
  languageLabel,
  themeToggle,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  // Close drawer on outside click
  useEffect(() => {
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [drawerOpen]);

  // Close drawer on ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const hamburgerStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px', display: 'flex', flexDirection: 'column', gap: 5,
    borderRadius: 6, transition: 'background 0.2s',
  };

  const barStyle = (open, i) => ({
    width: 22, height: 2,
    background: colors.accent, borderRadius: 2,
    transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
    transformOrigin: 'center',
    transform: open
      ? i === 0 ? 'translateY(7px) rotate(45deg)'
      : i === 1 ? 'scaleX(0)'
      : 'translateY(-7px) rotate(-45deg)'
      : 'none',
    opacity: open && i === 1 ? 0 : 1,
  });

  return (
    <>
      <header style={{
        background: colors.bg,
        padding: '0 24px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>
          {/* ── Logo / Brand ── */}
          <div
            onClick={() => { if (onLogoClick) { setDrawerOpen(false); onLogoClick(); } }}
            role={onLogoClick ? 'button' : undefined}
            tabIndex={onLogoClick ? 0 : undefined}
            onKeyDown={onLogoClick ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerOpen(false); onLogoClick(); }
            } : undefined}
            className={onLogoClick ? 'app-header-brand' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: onLogoClick ? 'pointer' : 'default',
              userSelect: 'none',
            }}
            title={title}
          >
            {logo}
            <div>
              <div style={{
                fontFamily: colors.titleFont || "'Be Vietnam Pro', sans-serif",
                fontSize: '1.125rem', fontWeight: 700,
                color: colors.accent,
                letterSpacing: '0.04em', lineHeight: 1.2,
              }}>{title}</div>
              <div style={{
                fontSize: '0.625rem', color: colors.textMuted,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>{subtitle}</div>
            </div>
          </div>

          {/* ── Desktop Nav ── */}
          <div className="app-header-desktop-nav" style={{
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* Apps dropdown */}
            <AppsDropdown appId={appId} colors={colors} />

            {/* Language toggle */}
            {onLanguageToggle && (
              <button
                onClick={onLanguageToggle}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  padding: '6px 10px',
                  transition: 'all 0.2s',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = colors.accent; e.currentTarget.style.borderColor = colors.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.borderColor = colors.border; }}
              >{languageLabel}</button>
            )}

            {/* Theme toggle (optional, e.g. TuViNow) */}
            {themeToggle}

            {/* User badge */}
            {useAuthHook && <SharedAuthUserBadge useAuthHook={useAuthHook} accentColor={colors.accent} />}

            {/* Primary action */}
            {primaryAction}
          </div>

          {/* ── Hamburger (Mobile) ── */}
          <button
            className="app-header-hamburger"
            style={hamburgerStyle}
            onClick={() => setDrawerOpen(o => !o)}
            aria-label="Toggle navigation"
            aria-expanded={drawerOpen}
            onMouseEnter={e => e.currentTarget.style.background = colors.accentSoft}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span style={barStyle(drawerOpen, 0)} />
            <span style={barStyle(drawerOpen, 1)} />
            <span style={barStyle(drawerOpen, 2)} />
          </button>
        </div>
      </header>

      {/* ── Backdrop (Mobile) ── */}
      {drawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
        }} onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Mobile Drawer ── */}
      <div
        ref={drawerRef}
        className="app-header-drawer"
        style={{
          position: 'fixed', top: 56, left: 0, right: 0, zIndex: 199,
          background: colors.drawerBg,
          borderBottom: `1px solid ${colors.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(-110%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          padding: '16px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 56px)',
        }}
      >
        {/* User info */}
        {useAuthHook && (
          <div style={{ paddingBottom: 12, borderBottom: `1px solid ${colors.border}` }}>
            <SharedAuthUserBadge useAuthHook={useAuthHook} accentColor={colors.accent} />
          </div>
        )}

        {/* Apps list */}
        <MobileAppsList appId={appId} colors={colors} />

        {/* Language toggle */}
        {onLanguageToggle && (
          <button onClick={() => { onLanguageToggle(); setDrawerOpen(false); }} style={{
            background: colors.accentSoft,
            border: `1px solid ${colors.border}`,
            borderRadius: 8, color: colors.accent,
            padding: '12px 16px', cursor: 'pointer',
            fontSize: '0.9375rem', fontWeight: 600, textAlign: 'center',
            fontFamily: 'inherit',
          }}>{languageLabel}</button>
        )}

        {/* Theme toggle */}
        {themeToggle && (
          <div onClick={() => setDrawerOpen(false)}>{themeToggle}</div>
        )}

        {/* Primary action */}
        {primaryAction && (
          <div onClick={() => setDrawerOpen(false)}>{primaryAction}</div>
        )}
      </div>

      {/* ── Responsive CSS ── */}
      <style>{`
        .app-header-brand {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .app-header-brand:hover { opacity: 0.85; }
        .app-header-brand:active { transform: scale(0.98); }
        .app-header-desktop-nav { display: flex !important; }
        .app-header-hamburger { display: none !important; }
        .app-header-drawer { display: flex !important; }
        @media (max-width: 768px) {
          .app-header-desktop-nav { display: none !important; }
          .app-header-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
