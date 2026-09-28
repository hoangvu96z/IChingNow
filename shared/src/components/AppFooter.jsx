import React from 'react';

/**
 * Shared AppFooter — used by IChingNow, TarotNow, TuViNow, TalkWithMe
 *
 * Props:
 *   colors: ColorTheme (from shared/src/themes/*.js)
 *   appId: 'iching' | 'tarot' | 'tuvi' | 'talkwithme'
 *   tagline: string — optional custom tagline
 */

const APPS = [
  { id: 'iching', icon: '☯️', name: 'IChingNow', url: '/kinhdich/' },
  { id: 'tarot',  icon: '🃏', name: 'TarotNow',  url: '/tarot/' },
  { id: 'tuvi',   icon: '🔮', name: 'TuViNow',   url: '/tuvi/' },
  { id: 'talkwithme', icon: '💬', name: 'TalkWithMe', url: '/talk/' },
];

export default function AppFooter({ colors = {}, appId, tagline }) {
  const year = new Date().getFullYear();

  const accentColor = colors.accent || '#38bdf8';
  const accentSoft = colors.accentSoft || 'rgba(56, 189, 248, 0.14)';
  const borderColor = colors.footerBorder || 'var(--border-subtle, rgba(255, 255, 255, 0.12))';
  const textColor = colors.footerText || 'var(--text-muted, var(--color-ink-muted, rgba(255, 255, 255, 0.65)))';
  const linkColor = colors.footerLink || 'var(--text-primary, var(--color-ink, rgba(255, 255, 255, 0.9)))';

  return (
    <footer style={{
      position: 'relative',
      zIndex: 10,
      width: '100%',
      marginTop: 48,
      padding: '36px 20px 48px',
      borderTop: `1px solid ${borderColor}`,
      background: 'transparent',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}>
        {/* App Switcher Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {APPS.map((app) => {
            const isActive = app.id === appId;
            if (isActive) {
              return (
                <div
                  key={app.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 18px',
                    borderRadius: 24,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: accentColor,
                    background: accentSoft,
                    border: `1.5px solid ${accentColor}`,
                    boxShadow: `0 0 16px ${accentSoft}`,
                    letterSpacing: '0.01em',
                  }}
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>{app.icon}</span>
                  <span>{app.name}</span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: accentColor,
                      boxShadow: `0 0 6px ${accentColor}`,
                      display: 'inline-block',
                      marginLeft: 2,
                    }}
                    title="Đang xem"
                  />
                </div>
              );
            }

            return (
              <a
                key={app.id}
                href={app.url}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 24,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: linkColor,
                  textDecoration: 'none',
                  background: 'var(--bg-glass, var(--bg-card, rgba(255, 255, 255, 0.05)))',
                  border: `1px solid ${borderColor}`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.color = accentColor;
                  e.currentTarget.style.background = accentSoft;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 16px ${accentSoft}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = borderColor;
                  e.currentTarget.style.color = linkColor;
                  e.currentTarget.style.background = 'var(--bg-glass, var(--bg-card, rgba(255, 255, 255, 0.05)))';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{app.icon}</span>
                <span>{app.name}</span>
              </a>
            );
          })}
        </div>

        {/* Contact CTA Row */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '8px 18px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(14, 165, 233, 0.12) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 28,
          boxShadow: '0 2px 10px rgba(6, 182, 212, 0.08)',
        }}>
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: textColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span>✨</span>
            <span>Hỗ trợ & Góp ý:</span>
          </span>

          {appId === 'talkwithme' ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: accentColor,
              padding: '4px 12px',
              borderRadius: 16,
              background: accentSoft,
              border: `1px solid ${accentColor}`,
            }}>
              💬 Hòm thư liên hệ TalkWithMe
            </span>
          ) : (
            <a
              href="/talk/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#ffffff',
                textDecoration: 'none',
                padding: '5px 14px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0369a1 0%, #075985 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.35)';
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>💬</span>
              <span>Liên hệ qua TalkWithMe</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>→</span>
            </a>
          )}
        </div>

        {/* Tagline */}
        {tagline && (
          <p style={{
            margin: 0,
            maxWidth: 680,
            fontSize: '0.8125rem',
            lineHeight: 1.6,
            color: textColor,
            textAlign: 'center',
          }}>
            {tagline}
          </p>
        )}

        {/* Copyright */}
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          color: textColor,
          opacity: 0.85,
          textAlign: 'center',
        }}>
          © {year} vunph.id.vn · Made with ❤️ in Việt Nam
        </p>
      </div>
    </footer>
  );
}
