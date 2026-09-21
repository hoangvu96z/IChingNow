import React from 'react';

/**
 * Shared AppFooter — used by IChingNow, TarotNow, TuViNow
 *
 * Props:
 *   colors: ColorTheme (from shared/src/themes/*.js)
 *   appId: 'iching' | 'tarot' | 'tuvi'
 *   tagline: string — optional custom tagline
 */

const APPS = [
  { id: 'iching', icon: '☯️', name: 'IChingNow', url: '/kinhdich/' },
  { id: 'tarot',  icon: '🃏', name: 'TarotNow',  url: '/tarot/' },
  { id: 'tuvi',   icon: '🔮', name: 'TuViNow',   url: '/tuvi/' },
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
