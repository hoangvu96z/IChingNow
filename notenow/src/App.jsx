import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NoteBoard from './components/NoteBoard.jsx';
import InviteAcceptPage from './components/InviteAcceptPage.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ssoApi, notesApi } from './api.js';
import AppFooter from '@shared/components/AppFooter.jsx';

import { trackPageVisit } from '@shared/utils/analytics.js';

const SSO_LOGIN_URL = (import.meta.env.VITE_SSO_URL || 'https://sso.vunph.click') +
  `/ui/sso?redirect=${encodeURIComponent(
    typeof window !== 'undefined'
      ? window.location.href
      : 'https://vunph.id.vn/note/'
  )}`;

// ─── Ambient stars ─────────────────────────────────────────────────────────

function StarParticles() {
  const stars = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${3 + Math.random() * 5}s`,
      delay: `${Math.random() * 6}s`,
      size: `${1 + Math.random() * 1.5}px`,
    })),
  []);

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            animation: `twinkle ${s.duration} ${s.delay} ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          from { opacity: 0.1; transform: scale(1); }
          to   { opacity: 0.7; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ─── Simple client router ──────────────────────────────────────────────────

function getRoute() {
  const path = window.location.pathname.replace(/\/note\/?/, '') || '/';
  if (path.startsWith('invite/')) {
    return { page: 'invite', token: path.replace('invite/', '') };
  }
  if (path.startsWith('s/')) {
    return { page: 'share', shareToken: path.replace('s/', '') };
  }
  return { page: 'board' };
}

// ─── Share View Page ───────────────────────────────────────────────────────

function ShareViewPage({ shareToken, user }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    notesApi.getByShareToken(shareToken).then((data) => {
      setNote(data);
      setLoading(false);
    }).catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [shareToken]);

  const appBase = import.meta.env.BASE_URL || '/note/';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <span>Đang tải…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
        <h2 style={{ marginBottom: 8 }}>Không thể xem ghi chú</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
        <a href={appBase} className="btn btn-ghost">← Về trang chính</a>
      </div>
    );
  }

  return (
    <>
      <div className="nn-share-banner">
        📋 Đây là ghi chú được chia sẻ. {note?.canEdit ? 'Bạn có thể chỉnh sửa ghi chú này.' : 'Bạn chỉ có thể xem.'}
        <a href={appBase}>✏️ Tạo ghi chú của bạn</a>
      </div>

      {note && (
        <ErrorBoundary>
          <NoteEditor
            note={note}
            isNew={false}
            isReadOnly={!note.canEdit}
            userIsLoggedIn={!!user}
            shareToken={shareToken}
            onSave={async (dto) => {
              if (!note.canEdit) return;
              const res = await notesApi.updateByShareToken(shareToken, dto);
              setNote(res);
              return res;
            }}
            onClose={() => { window.location.href = appBase; }}
          />
        </ErrorBoundary>
      )}
    </>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('nn_theme_v2');
    if (saved) return saved;
    localStorage.setItem('nn_theme_v2', 'light');
    localStorage.removeItem('nn_theme');
    return 'light';
  });
  const [route, setRoute] = useState(getRoute);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    trackPageVisit('notenow');
    if (!localStorage.getItem('notenow_onboarded_v2')) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nn_theme_v2', theme);
  }, [theme]);

  useEffect(() => {
    ssoApi.getMe().then(async (data) => {
      const u = data?.user || null;
      setUser(u);
      setAuthLoading(false);
      if (u) {
        try {
          const guestToken = localStorage.getItem('notenow_guest_token');
          if (guestToken) {
            await notesApi.claimGuestNotes();
            localStorage.removeItem('notenow_guest_token');
          }
        } catch {}
      }
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await ssoApi.logout();
    setUser(null);
    window.location.reload();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const navigateTo = useCallback((path) => {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
  }, []);

  return (
    <>
      {/* Ambient Background */}
      <div className="app-bg" aria-hidden="true" />
      <StarParticles />

      {/* Header */}
      <header className="nn-header">
        <a href={import.meta.env.BASE_URL || '/note/'} className="nn-logo" aria-label="NoteNow — Về trang chính">
          <div className="nn-logo-icon" aria-hidden="true">📝</div>
          <div>
            <div className="nn-logo-text">NoteNow</div>
            <div className="nn-logo-sub">Ghi chú thông minh</div>
          </div>
        </a>

        {route.page === 'board' && (
          <div className="nn-header-search">
            <input
              className="nn-search-input"
              type="search"
              placeholder="Tìm kiếm ghi chú…"
              aria-label="Tìm kiếm ghi chú"
              id="search-notes"
              onChange={(e) => {
                // Communicate to NoteBoard via a custom event
                window.dispatchEvent(new CustomEvent('nn-search', { detail: e.target.value }));
              }}
            />
            <span className="nn-search-icon" aria-hidden="true">🔍</span>
          </div>
        )}

        <div className="nn-header-actions">
          {/* Guide / Feature Intro */}
          <button
            className="nn-theme-toggle"
            onClick={() => setShowOnboarding(true)}
            title="Hướng dẫn & Tính năng"
            aria-label="Xem hướng dẫn và tính năng"
            type="button"
            id="btn-help-guide"
          >
            💡
          </button>

          {/* Theme toggle */}
          <button
            className="nn-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            aria-label={theme === 'dark' ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
            type="button"
            id="btn-theme-toggle"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Auth */}
          {authLoading ? (
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)' }} className="nn-skeleton" />
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="nn-auth-btn" style={{ cursor: 'default' }}>
                <div className="nn-auth-avatar">{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName || user.email}
                </span>
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                onClick={handleLogout}
                type="button"
                id="btn-logout"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <a
              href={SSO_LOGIN_URL}
              className="nn-auth-btn"
              id="btn-login"
            >
              <span>🔐</span>
              <span className="nn-auth-text">Đăng nhập</span>
            </a>
          )}
        </div>
      </header>

      {/* Content routing */}
      {route.page === 'board' && (
        <NoteBoard user={user} />
      )}

      {route.page === 'share' && (
        <ShareViewPage shareToken={route.shareToken} user={user} />
      )}

      {route.page === 'invite' && (
        <InviteAcceptPage
          token={route.token}
          user={user}
          onAccepted={(noteId) => navigateTo(`${import.meta.env.BASE_URL || '/note/'}`)}
        />
      )}

      {/* Onboarding Flash Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          localStorage.setItem('notenow_onboarded_v2', 'true');
          setShowOnboarding(false);
        }}
      />

      {/* Footer */}
      <AppFooter
        appId="notenow"
        colors={{
          accent: '#34d399',
          footerBorder: 'rgba(52,211,153,0.18)',
          footerLink: 'var(--text-secondary)',
          footerText: 'var(--text-muted)',
          footerDot: 'rgba(52,211,153,0.3)',
        }}
        tagline="NoteNow — Ghi chú nhanh, chia sẻ dễ dàng, hỗ trợ định dạng phong phú"
      />
    </>
  );
}
