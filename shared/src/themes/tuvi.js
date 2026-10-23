/**
 * TuViNow theme colors — adapts to light/dark mode via data-theme
 * Dark mode: deep indigo/teal celestial
 * Light mode: soft cream/jade scholarly
 *
 * Note: TuViNow has a light/dark toggle, so we expose two theme variants.
 * The AppHeader for TuViNow always uses the dark variant (header is always dark).
 */
export const tuviTheme = {
  // Header always uses dark variant
  bg: 'linear-gradient(135deg, #0d1b2a 0%, #1a2f4a 50%, #0d1b2a 100%)',
  accent: '#6dd5b0',
  accentSoft: 'rgba(109,213,176,0.18)',
  accentHover: 'rgba(109,213,176,0.28)',
  // Literal light values: header/drawer surfaces are always dark navy, so
  // page-level light-mode tokens (dark ink) must not leak in here.
  text: '#e2e8f0',
  textMuted: '#a8b5c7',
  border: 'var(--border-subtle, rgba(109,213,176,0.25))',
  drawerBg: '#0d1b2a',
  footerBorder: 'var(--border-subtle, rgba(109,213,176,0.25))',
  footerLink: '#e2e8f0',
  footerText: '#cbd5e1',
  footerDot: 'rgba(109,213,176,0.5)',
  titleFont: "'Be Vietnam Pro', sans-serif",
};
