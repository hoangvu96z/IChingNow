/**
 * Shared Traffic & Visitor Analytics Tracker
 * Reports lightweight page visit pings to vInfiSSO
 */

const SSO_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? ''
  : 'https://sso.vunph.click';

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

  let userId = undefined;
  try {
    const token = localStorage.getItem('sso_token');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        userId = payloadJson.sub || payloadJson.id || payloadJson.userId || undefined;
      }
    }
  } catch {}

  const payload = {
    app: appId,
    path: window.location.pathname + (window.location.hash || ''),
    referrer: document.referrer || '',
    screen: screenWidth ? `${screenWidth}x${screenHeight} (DPR ${dpr})` : undefined,
    isMobile,
    userId,
  };

  const url = `${SSO_BASE}/analytics/visit`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}
