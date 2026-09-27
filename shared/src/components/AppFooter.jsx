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
  { id: 'talkwithme', icon: '💬', name: 'TalkWithMe', url: '/talkwithme/' },
];

export default function AppFooter({ colors = {}, appId, tagline }) {
  const year = new Date().getFullYear();

  const borderColor = colors.footerBorder || 'var(--border-subtle, rgba(255,255,255,0.1))';
  const linkColor = colors.footerLink || 'var(--text-secondary, var(--color-ink-muted, rgba(255,255,255,0.6)))';
  const textColor = colors.footerText || 'var(--text-muted, var(--color-ink-muted, rgba(255,255,255,0.4)))';
  const dotColor = colors.footerDot || 'var(--border-subtle, rgba(255,255,255,0.2))';

  return (
    <footer style={{
      borderTop: `1px solid ${borderColor}`,
      marginTop: 40,
      padding: '28px 24px',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        {/* App links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {APPS.map((app, i) => (
            <React.Fragment key={app.id}>
              {i > 0 && (
                <span style={{ color: dotColor, fontSize: '0.875rem' }}>·</span>
              )}
              {app.id === appId ? (
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: colors.accent,
                }}>
                  {app.icon} {app.name}
                </span>
              ) : (
                <a
                  href={app.url}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: linkColor,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = colors.accent}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  {app.icon} {app.name}
                </a>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Contact CTA row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          padding: '6px 14px',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.18)',
          borderRadius: 24,
        }}>
          <span style={{ fontSize: '0.8125rem', color: textColor }}>
            Hỗ trợ & Góp ý:
          </span>
          {appId === 'talkwithme' ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: colors.accent || '#38bdf8',
            }}>
              💬 Hòm thư liên hệ TalkWithMe
            </span>
          ) : (
            <a
              href="/talkwithme/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#38bdf8',
                textDecoration: 'none',
                padding: '2px 8px',
                borderRadius: 12,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.24)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>💬</span>
              <span>Liên hệ qua TalkWithMe</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>→</span>
            </a>
          )}
        </div>

        {/* Tagline */}
        {tagline && (
          <p style={{
            margin: 0,
            fontSize: '0.8125rem',
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
          opacity: 0.8,
          textAlign: 'center',
        }}>
          © {year} vunph.id.vn · Made with ❤️ in Việt Nam
        </p>
      </div>
    </footer>
  );
}
