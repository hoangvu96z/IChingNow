export const DEFAULT_SSO_URL = 'https://sso.vunph.click';

// API requests use the local Vite proxy; browser navigation uses the SSO origin.
export function getSsoWebBase(env = {}) {
  return (env.VITE_SSO_URL || DEFAULT_SSO_URL).replace(/\/+$/, '');
}

export function getSsoApiBase(env = {}) {
  return env.DEV ? '' : getSsoWebBase(env);
}

export function getSsoLoginUrl(env, returnUrl) {
  const target = new URL(returnUrl);
  target.searchParams.delete('sso_token');
  target.searchParams.delete('sso_code');
  return `${getSsoWebBase(env)}/ui/sso?redirect=${encodeURIComponent(target.toString())}`;
}

/**
 * Read a one-time OAuth code from the callback URL and remove both it and any
 * legacy raw token from the visible URL before making a network request.
 */
export function takeSsoCodeFromUrl({
  location = window.location,
  history = window.history,
  title = document.title,
} = {}) {
  const params = new URLSearchParams(location.search);
  const code = params.get('sso_code');
  const hadSensitiveQuery = params.has('sso_code') || params.has('sso_token');
  if (!hadSensitiveQuery) return null;

  params.delete('sso_code');
  params.delete('sso_token');
  const search = params.toString();
  const cleanUrl = location.pathname + (search ? `?${search}` : '') + location.hash;
  history.replaceState(history.state, title, cleanUrl);
  return code || null;
}

/** Exchange a short-lived OAuth callback code for an HttpOnly cookie session. */
export async function exchangeSsoCode(base, code, fetchImpl = fetch) {
  if (!code) throw new Error('Thiếu mã đăng nhập SSO');
  const response = await fetchImpl(`${base}/sso/exchange`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || `Không đổi được mã đăng nhập (${response.status})`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  if (data.success !== true || !data.user) {
    throw new Error('Máy chủ SSO trả về phiên đăng nhập không hợp lệ');
  }
  return data;
}

/** Share one callback-code exchange between the initial load and focus/storage refreshes. */
export function createSsoCodeExchangeCoordinator(exchange = exchangeSsoCode) {
  let inFlight = null;
  let pendingResult = null;
  return {
    getOrStart(base, code) {
      if (pendingResult) return Promise.resolve(pendingResult);
      if (inFlight) return inFlight;
      if (!code) return null;
      inFlight = Promise.resolve().then(() => exchange(base, code)).then((result) => {
        pendingResult = result;
        return result;
      });
      return inFlight;
    },
    finish(promise) {
      if (inFlight === promise) inFlight = null;
    },
    complete() {
      pendingResult = null;
      inFlight = null;
    },
    cancel() {
      pendingResult = null;
      inFlight = null;
    },
  };
}

export async function fetchSsoSession(base, fetchImpl = fetch) {
  const response = await fetchImpl(`${base}/sso/me`, {
    credentials: 'include',
  });
  if (!response.ok) {
    const error = new Error(`Không kiểm tra được phiên đăng nhập (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function isSessionRejected(error) {
  return error?.status === 401 || error?.status === 403;
}
