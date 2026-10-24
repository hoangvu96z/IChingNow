import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ssoApi } from '../api.js';
import { getAppLink } from '@shared/utils/appLinks.mjs';
import {
  HelpCircle, Sun, Moon, LogIn, LogOut,
} from 'lucide-react';

const APPS = [
  {
    id: 'spiritnow',
    icon: '✨',
    name: 'SpiritNow',
    tagline: 'Tổng quan hệ sinh thái',
    taglineEn: 'Ecosystem Overview',
    url: '/spiritnow/',
    color: '#38bdf8',
  },
  {
    id: 'iching',
    icon: '☯️',
    name: 'IChingNow',
    tagline: 'Lập Quẻ Kinh Dịch',
    taglineEn: 'I Ching Divination',
    url: '/kinhdich/',
    color: '#d4a017',
  },
  {
    id: 'tarot',
    icon: '🃏',
    name: 'TarotNow',
    tagline: 'Trải Bài Tarot & AI',
    taglineEn: 'Tarot Reading & AI',
    url: '/tarot/',
    color: '#e5c158',
  },
  {
    id: 'tuvi',
    icon: '🔮',
    name: 'TuViNow',
    tagline: 'Tử Vi Đẩu Số',
    taglineEn: 'Horoscope & Astrology',
    url: '/tuvi/',
    color: '#6dd5b0',
  },
  {
    id: 'talkwithme',
    icon: '💬',
    name: 'TalkWithMe',
    tagline: 'Liên Hệ & Góp Ý',
    taglineEn: 'Contact & Support',
    url: '/talk/',
    color: '#38bdf8',
  },
  {
    id: 'notenow',
    icon: '📝',
    name: 'NoteNow',
    tagline: 'Ghi Chú Đa Năng',
    taglineEn: 'Smart Notes',
    url: '/note/',
    color: '#10b981',
  },
];

export default function NoteNavDrawer({
  isOpen,
  onClose,
  user,
  authLoading,
  onLogout,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  onOpenHelp,
}) {
  const { t } = useLanguage();
  const drawerRef = useRef(null);

  // Keyboard listeners: Escape to close and Tab/Shift+Tab modal focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const drawer = drawerRef.current;
        if (!drawer) return;

        const focusables = Array.from(
          drawer.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        // If focus is on drawer container itself or outside: cycle to ends
        if (!drawer.contains(active) || active === drawer) {
          e.preventDefault();
          if (e.shiftKey) {
            last.focus();
          } else {
            first.focus();
          }
          return;
        }

        // Cycle at the ends
        if (e.shiftKey) {
          if (active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close drawer if window is resized to desktop width (> 768px)
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.innerWidth > 768) {
        onClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  // Focus drawer on open for keyboard accessibility
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="nn-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        id="nn-mobile-drawer"
        className="nn-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('header.menu', 'Menu')}
        tabIndex={-1}
      >
        {/* User Info / Auth */}
        {authLoading ? (
          <div style={{ padding: '4px 0 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 120, height: 28, borderRadius: 'var(--radius-sm)' }} className="nn-skeleton" />
          </div>
        ) : user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 14,
            borderBottom: '1px solid var(--border)',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className="nn-auth-avatar" style={{ width: 34, height: 34, fontSize: '0.9rem', flexShrink: 0 }}>
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.displayName || user.email}
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => {
                onClose();
                onLogout();
              }}
              type="button"
              id="btn-drawer-logout"
              aria-label={t('header.logout', 'Đăng xuất')}
              title={t('header.logout', 'Đăng xuất')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>{t('header.logout', 'Đăng xuất')}</span>
            </button>
          </div>
        ) : (
          <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <a
              href={ssoApi.getLoginUrl()}
              onClick={onClose}
              className="btn btn-primary"
              id="btn-drawer-login"
              aria-label={t('header.login', 'Đăng nhập')}
              title={t('header.login', 'Đăng nhập')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 16px',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              <LogIn size={16} strokeWidth={2.2} />
              <span>{t('header.login', 'Đăng nhập')}</span>
            </a>
          </div>
        )}

        {/* Apps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '2px 0 4px',
          }}>
            {t('header.apps', 'Ứng dụng')}
          </div>
          {APPS.map((app) => {
            const isActive = app.id === 'notenow';
            const tagline = language === 'en' ? app.taglineEn : app.tagline;
            return isActive ? (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{app.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {app.name}
                    <span style={{
                      fontSize: '0.6rem',
                      background: 'var(--accent)',
                      color: '#000',
                      padding: '1px 6px',
                      borderRadius: 20,
                      fontWeight: 800,
                      lineHeight: 1.6,
                    }}>
                      {t('header.apps_current', 'ĐANG DÙNG')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {tagline}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={app.id}
                href={getAppLink(app.url, { DEV: import.meta.env.DEV }, typeof window !== 'undefined' ? window.location : null)}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{app.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {app.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {tagline}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Action Controls: Help, Theme, Language */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
        }}>
          {/* Help / Guide */}
          <button
            type="button"
            id="btn-drawer-help"
            className="nn-drawer-action-btn"
            onClick={() => {
              onClose();
              onOpenHelp();
            }}
          >
            <HelpCircle size={18} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>{t('header.help_title', 'Hướng dẫn & Tính năng')}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            id="btn-drawer-theme"
            className="nn-drawer-action-btn"
            onClick={() => {
              onClose();
              onToggleTheme();
            }}
          >
            {theme === 'dark' ? (
              <Sun size={18} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            ) : (
              <Moon size={18} strokeWidth={2} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            )}
            <span>
              {theme === 'dark'
                ? t('header.theme_to_light', 'Chuyển sang sáng')
                : t('header.theme_to_dark', 'Chuyển sang tối')}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            id="btn-drawer-lang"
            className="nn-drawer-action-btn"
            onClick={() => {
              onClose();
              onToggleLanguage();
            }}
          >
            <span style={{
              width: 18,
              fontWeight: 700,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              color: 'var(--accent)',
              textAlign: 'center',
              flexShrink: 0,
            }}>
              {language === 'vi' ? 'EN' : 'VI'}
            </span>
            <span>
              {language === 'vi' ? 'Chuyển sang English' : 'Chuyển sang Tiếng Việt'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
