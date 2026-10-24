import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NoteBoard from './components/NoteBoard.jsx';
import InviteAcceptPage from './components/InviteAcceptPage.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import HelpModal from './components/HelpModal.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ssoApi, notesApi, safeStorage } from './api.js';
import { useLanguage } from './context/LanguageContext.jsx';
import { AppsDropdown } from '@shared/components/AppHeader.jsx';
import AppFooter from '@shared/components/AppFooter.jsx';
import { trackPageVisit } from '@shared/utils/analytics.js';
import {
  FileText, Search, Sun, Moon, LogIn, LogOut,
  Lock, AlertCircle, Share2, Plus,
  HelpCircle, Loader2, KeyRound,
} from 'lucide-react';

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

function SharePasswordGate({ shareToken, onUnlocked }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setVerifying(true);
    setError(null);
    try {
      const data = await notesApi.getByShareToken(shareToken, password.trim());
      onUnlocked(data);
    } catch {
      setError(t('share_gate.wrong_password', 'Mật khẩu không đúng. Vui lòng thử lại.'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        maxWidth: 380,
        width: '100%',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <Lock size={32} strokeWidth={2} />
          </div>
        </div>
        <h2 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>{t('share_gate.title', 'Ghi chú được bảo vệ')}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
          {t('share_gate.desc', 'Nhập mật khẩu để xem ghi chú này.')}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="nn-share-link-input"
            placeholder={t('share_gate.placeholder', 'Nhập mật khẩu…')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{ marginBottom: 12, textAlign: 'left' }}
            id="share-password-input"
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={verifying || !password.trim()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {verifying ? (
              <><Loader2 size={15} className="nn-spin" /> {t('share_gate.checking', 'Đang kiểm tra…')}</>
            ) : (
              <><KeyRound size={15} strokeWidth={2} /> {t('share_gate.unlock', 'Mở khoá')}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ShareViewPage({ shareToken, user }) {
  const { t } = useLanguage();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    notesApi.getByShareToken(shareToken).then((data) => {
      setNote(data);
      setLoading(false);
    }).catch((e) => {
      if (e.message && (
        e.message.toLowerCase().includes('password') ||
        e.message.includes('401') ||
        e.message.includes('403') ||
        e.message.toLowerCase().includes('protected') ||
        e.message.toLowerCase().includes('bảo vệ') ||
        e.message.toLowerCase().includes('mật khẩu')
      )) {
        setNeedsPassword(true);
        setLoading(false);
      } else {
        setError(e.message);
        setLoading(false);
      }
    });
  }, [shareToken]);

  const appBase = import.meta.env.BASE_URL || '/note/';

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)', gap: 8 }}>
          <Loader2 size={20} className="nn-spin" />
          <span>{t('share_view.loading', 'Đang tải…')}</span>
        </div>
      );
    }

    if (needsPassword) {
      return <SharePasswordGate shareToken={shareToken} onUnlocked={(data) => { setNote(data); setNeedsPassword(false); }} />;
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Lock size={44} color="#f87171" strokeWidth={1.8} />
          </div>
          <h2 style={{ marginBottom: 8 }}>{t('share_view.error_title', 'Không thể xem ghi chú')}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
          <a href={appBase} className="btn btn-ghost">{t('share_view.back_home', '← Về trang chính')}</a>
        </div>
      );
    }

    return (
      <>
        <div className="nn-share-banner">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Share2 size={15} strokeWidth={2.2} />
            {note?.canEdit
              ? t('share_view.banner_edit', 'Đây là ghi chú được chia sẻ. Bạn có thể chỉnh sửa ghi chú này.')
              : t('share_view.banner_view', 'Đây là ghi chú được chia sẻ. Bạn chỉ có thể xem.')}
          </span>
          <a href={appBase} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} /> {t('share_view.create_own', 'Tạo ghi chú của bạn')}
          </a>
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
  };

  return (
    <>
      {renderContent()}

      {/* FAB — Create own note */}
      <a
        href={appBase}
        className="nn-fab nn-fab-create-note"
        aria-label={t('share_view.create_own', 'Tạo ghi chú của bạn')}
        title={t('share_view.create_own', 'Tạo ghi chú của bạn')}
        id="btn-share-page-create-note"
        style={{ textDecoration: 'none' }}
      >
        <span className="nn-fab-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} strokeWidth={2.5} />
        </span>
        <span className="nn-fab-label">{t('share_view.fab_create', 'Tạo note')}</span>
      </a>
    </>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  const { t, language, setLanguage } = useLanguage();
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
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    trackPageVisit('notenow');
    if (route.page === 'board' && !localStorage.getItem('notenow_onboarded_v2')) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nn_theme_v2', theme);
  }, [theme]);

  const checkAuth = useCallback(async () => {
    try {
      const data = await ssoApi.getMe();
      const u = data?.user || null;
      setUser(u);
      setAuthLoading(false);
      if (u) {
        try {
          const guestToken = safeStorage.getItem('notenow_guest_token');
          if (guestToken) {
            await notesApi.claimGuestNotes();
            safeStorage.removeItem('notenow_guest_token');
          }
        } catch {}
      }
    } catch {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleStorage = (e) => {
      if (e.key === 'vInfiSSO-state' || e.key === 'sso_logged_out') {
        checkAuth();
      }
    };
    const handleFocus = () => {
      if (!safeStorage.getItem('sso_logged_out')) {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth]);

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
        <a href={import.meta.env.BASE_URL || '/note/'} className="nn-logo" aria-label={`${t('app.title', 'NoteNow')} — ${t('share_view.back_home', 'Về trang chính')}`}>
          <div className="nn-logo-icon" aria-hidden="true">
            <FileText size={20} strokeWidth={2.4} color="currentColor" />
          </div>
          <div>
            <div className="nn-logo-text">{t('app.title', 'NoteNow')}</div>
            <div className="nn-logo-sub">{t('app.subtitle', 'Ghi chú thông minh')}</div>
          </div>
        </a>

        {route.page === 'board' && (
          <div className="nn-header-search">
            <input
              className="nn-search-input"
              type="search"
              placeholder={t('header.search_placeholder', 'Tìm kiếm ghi chú…')}
              aria-label={t('header.search_placeholder', 'Tìm kiếm ghi chú…')}
              id="search-notes"
              onChange={(e) => {
                window.dispatchEvent(new CustomEvent('nn-search', { detail: e.target.value }));
              }}
            />
            <span className="nn-search-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
              <Search size={15} strokeWidth={2.2} />
            </span>
          </div>
        )}

        <div className="nn-header-actions">
          {/* Shared Apps Dropdown */}
          <AppsDropdown
            appId="notenow"
            colors={{
              accent: 'var(--accent, #10b981)',
              accentSoft: 'var(--accent-dim, rgba(16, 185, 129, 0.14))',
              border: 'var(--border, rgba(255, 255, 255, 0.18))',
              textMuted: 'var(--text-secondary, rgba(255, 255, 255, 0.65))',
              dropdownBg: 'var(--bg-card, #12121e)',
              dropdownBorder: 'var(--border, rgba(255, 255, 255, 0.15))',
              hoverBg: 'var(--bg-card-hover, rgba(255, 255, 255, 0.08))',
            }}
            label={t('header.apps', 'Ứng Dụng')}
            currentLabel={t('header.apps_current', 'ĐANG DÙNG')}
            chooseLabel={t('header.apps_choose', 'Chọn Ứng Dụng')}
          />

          {/* Language toggle — similar to IChingNow */}
          <button
            className="nn-theme-toggle"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            title={t('header.lang_title', 'Chuyển đổi ngôn ngữ (VI / EN)')}
            aria-label={t('header.lang_title', 'Chuyển đổi ngôn ngữ (VI / EN)')}
            type="button"
            id="btn-lang-toggle"
            style={{
              fontWeight: 700,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            {language === 'vi' ? 'VI' : 'EN'}
          </button>

          {/* Guide / Feature Intro */}
          <button
            className="nn-theme-toggle"
            onClick={() => setShowHelp(true)}
            title={t('header.help_title', 'Hướng dẫn & Tính năng')}
            aria-label={t('header.help_title', 'Hướng dẫn & Tính năng')}
            type="button"
            id="btn-help-guide"
          >
            <HelpCircle size={18} strokeWidth={2} />
          </button>

          {/* Theme toggle */}
          <button
            className="nn-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('header.theme_to_light', 'Chuyển sang sáng') : t('header.theme_to_dark', 'Chuyển sang tối')}
            aria-label={theme === 'dark' ? t('header.theme_to_light', 'Bật chế độ sáng') : t('header.theme_to_dark', 'Bật chế độ tối')}
            type="button"
            id="btn-theme-toggle"
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>

          {/* Auth */}
          {authLoading ? (
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)' }} className="nn-skeleton" />
          ) : user ? (
            <div className="nn-header-auth" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="nn-auth-btn" style={{ cursor: 'default' }} title={user.displayName || user.email}>
                <div className="nn-auth-avatar">{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
                <span className="nn-auth-name" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName || user.email}
                </span>
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                onClick={handleLogout}
                type="button"
                id="btn-logout"
                aria-label={t('header.logout', 'Đăng xuất')}
                title={t('header.logout', 'Đăng xuất')}
              >
                <LogOut className="nn-auth-icon-mobile" size={15} strokeWidth={2.2} aria-hidden="true" />
                <span className="nn-auth-text">{t('header.logout', 'Đăng xuất')}</span>
              </button>
            </div>
          ) : (
            <a
              href={ssoApi.getLoginUrl()}
              className="nn-auth-btn"
              id="btn-login"
              aria-label={t('header.login', 'Đăng nhập')}
              title={t('header.login', 'Đăng nhập')}
            >
              <LogIn size={15} strokeWidth={2.2} />
              <span className="nn-auth-text">{t('header.login', 'Đăng nhập')}</span>
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
          onAccepted={() => navigateTo(`${import.meta.env.BASE_URL || '/note/'}`)}
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

      {/* Repeatable Help / Guide Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Shared Footer — compact, distinct background, no app pills */}
      <AppFooter
        appId="notenow"
        showApps={false}
        compact={true}
        colors={{
          accent: '#10b981',
          accentSoft: 'rgba(16, 185, 129, 0.14)',
          footerBg: 'var(--bg-surface)',
          footerBorder: 'var(--border)',
          footerLink: 'var(--text-secondary)',
          footerText: 'var(--text-muted)',
        }}
        tagline={t('footer.tagline', 'NoteNow — Ghi chú nhanh, chia sẻ dễ dàng, hỗ trợ định dạng phong phú')}
        supportLabel={t('footer.support_label', 'Hỗ trợ & Góp ý:')}
        supportBtnText={t('footer.support_btn', 'Góp ý qua TalkWithMe')}
        copyrightText={t('footer.copyright', `© ${new Date().getFullYear()} vunph.id.vn · Made with ❤️ in Việt Nam`).replace('{year}', new Date().getFullYear())}
      />
    </>
  );
}
