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
  accentSoft: 'rgba(109,213,176,0.12)',
  accentHover: 'rgba(109,213,176,0.22)',
  text: 'rgba(255,255,255,0.85)',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(109,213,176,0.25)',
  drawerBg: '#0d1b2a',
  footerBorder: 'rgba(109,213,176,0.18)',
  titleFont: "'Be Vietnam Pro', sans-serif",
};
