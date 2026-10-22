import { getSsoApiBase } from './ssoConfig.mjs';
/**
 * Shared Traffic & Visitor Analytics Tracker
 * Reports lightweight page visit pings to vInfiSSO
 */

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });

export function trackPageVisit(appId) {
  if (typeof window === 'undefined') return;

  // Prevent duplicate pings on rapid re-renders or hot reloads within 15 seconds
  const sessionPingKey = `v_ping_${appId}`;
  try {
    const lastPing = sessionStorage.getItem(sessionPingKey);
    const now = Date.now();
    if (lastPing && now - Number(lastPing) < 15000) {
      return;
    }
    sessionStorage.setItem(sessionPingKey, String(now));
  } catch {}

  const screenWidth = window.screen?.width || 0;
  const screenHeight = window.screen?.height || 0;
  const dpr = window.devicePixelRatio || 1;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

  const payload = {
    app: appId,
    path: window.location.pathname + (window.location.hash || ''),
    referrer: document.referrer || '',
    screen: screenWidth ? `${screenWidth}x${screenHeight} (DPR ${dpr})` : undefined,
    isMobile,
  };

  const url = `${SSO_BASE}/analytics/visit`;

  try {
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
