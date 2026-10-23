export const DEFAULT_SSO_URL = 'https://sso.vunph.click';
export const SSO_BEARER_STORAGE_KEY = 'vInfiSSO.sessionBearer';
export const SSO_ROTATION_HEADER = 'x-sso-session-token';

// Retire the old URL/localStorage token transport before app code starts.
try {
  globalThis.localStorage?.removeItem('sso_token');
} catch {}

function browserSessionStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

/** Create an authenticated transport with a per-tab bearer and rotation support. */
export function createSsoAuthFetch(
  fetchImpl = (...args) => globalThis.fetch(...args),
  getStorage = browserSessionStorage,
) {
  let volatileToken = null;

  const getToken = () => {
    try {
      const storage = getStorage();
      if (storage) {
        volatileToken = storage.getItem(SSO_BEARER_STORAGE_KEY) || volatileToken;
        return volatileToken;
      }
    } catch {}
    return volatileToken;
  };

  const setToken = (token) => {
    if (typeof token !== 'string' || !token.trim() || token.length > 4096) {
      return false;
    }
    volatileToken = token;
    try {
      getStorage()?.setItem(SSO_BEARER_STORAGE_KEY, token);
    } catch {}
    return true;
  };

  const clearToken = () => {
    volatileToken = null;
    try {
      getStorage()?.removeItem(SSO_BEARER_STORAGE_KEY);
    } catch {}
  };

  const request = async (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    const token = getToken();
    if (token && !headers.has('authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Do not catch fetch errors here: an outage must not discard the session.
    const response = await fetchImpl(input, { ...init, headers });
    const rotatedToken = response.headers?.get?.(SSO_ROTATION_HEADER);
    if (rotatedToken) setToken(rotatedToken);
    if (response.status === 401 || response.status === 403) clearToken();
    return response;
  };

  return { fetch: request, getToken, setToken, clearToken };
}

const ssoAuth = createSsoAuthFetch();

export const ssoFetch = (input, init) => ssoAuth.fetch(input, init);
export const setSsoBearerToken = (token) => ssoAuth.setToken(token);
export const clearSsoBearerToken = () => ssoAuth.clearToken();

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

/** Exchange a short-lived code for a tab-scoped bearer and first-party cookie session. */
export async function exchangeSsoCode(
  base,
  code,
  fetchImpl = fetch,
  saveToken = setSsoBearerToken,
) {
  if (!code) throw new Error('Thiếu mã đăng nhập SSO');
  const response = await fetchImpl(`${base}/sso/exchange`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearSsoBearerToken();
    }
    const error = new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || `Không đổi được mã đăng nhập (${response.status})`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  if (
    data.success !== true ||
    !data.user ||
    typeof data.token !== 'string' ||
    !saveToken(data.token)
  ) {
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

export async function fetchSsoSession(base, fetchImpl = ssoFetch) {
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
