export const DEFAULT_SSO_URL = 'https://sso.vunph.click';
export const SSO_BEARER_STORAGE_KEY = 'vInfiSSO.sessionBearer';
export const SSO_ROTATION_HEADER = 'x-sso-session-token';
export const SSO_TAB_SYNC_CHANNEL = 'vInfiSSO.tabSessionSync';

const CHANNEL_NAME = SSO_TAB_SYNC_CHANNEL;

// Retire the old URL/localStorage token transport before app code starts.
try {
  globalThis.localStorage?.removeItem('sso_token');
} catch {}

function browserSessionStorage() {
  try {
    if (typeof window !== 'undefined' && window?.sessionStorage) {
      return window.sessionStorage;
    }
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function isValidBearerToken(token) {
  return (
    typeof token === 'string' &&
    token.trim().length > 0 &&
    token.length <= 4096 &&
    !/\s/.test(token)
  );
}

function readRawTokenFromStorage(storage) {
  try {
    const raw = storage?.getItem?.(SSO_BEARER_STORAGE_KEY) ?? null;
    return isValidBearerToken(raw) ? raw : null;
  } catch {
    return null;
  }
}

let activeTabSync = null;
let defaultAuthInternal = null;

/**
 * Attach a BroadcastChannel listener for same-origin cross-tab sessionStorage sync.
 * Never persists bearer tokens to localStorage.
 */
export function attachSsoTabSync({
  storage,
  BroadcastChannelImpl = globalThis.BroadcastChannel,
  onSyncToken,
  onClearToken,
} = {}) {
  if (typeof BroadcastChannelImpl !== 'function') {
    return { channel: null, postMessage: () => {}, close: () => {} };
  }

  let channel = null;
  try {
    channel = new BroadcastChannelImpl(CHANNEL_NAME);
    channel.unref?.();
  } catch {
    return { channel: null, postMessage: () => {}, close: () => {} };
  }

  const getTargetStorage = () =>
    storage !== undefined ? storage : browserSessionStorage();

  const handleMessage = (event) => {
    const msg = event?.data;
    if (!msg || typeof msg !== 'object') return;

    const targetStorage = getTargetStorage();

    if (msg.type === 'request-bearer') {
      const token =
        storage !== undefined
          ? readRawTokenFromStorage(targetStorage)
          : defaultAuthInternal?.getToken?.() ?? readRawTokenFromStorage(targetStorage);
      if (isValidBearerToken(token)) {
        try {
          channel.postMessage({
            type: 'provide-bearer',
            requestId: msg.requestId ?? null,
            token,
          });
        } catch {}
      }
      return;
    }

    if (msg.type === 'provide-bearer' || msg.type === 'sync-bearer') {
      if (!isValidBearerToken(msg.token)) return;
      const current =
        storage !== undefined
          ? readRawTokenFromStorage(targetStorage)
          : defaultAuthInternal?.getToken?.() ?? readRawTokenFromStorage(targetStorage);
      if (current === msg.token) return;
      if (typeof onSyncToken === 'function') {
        onSyncToken(msg.token);
      } else {
        try {
          targetStorage?.setItem?.(SSO_BEARER_STORAGE_KEY, msg.token);
        } catch {}
      }
      return;
    }

    if (msg.type === 'clear-bearer') {
      if (typeof onClearToken === 'function') {
        onClearToken();
      } else {
        try {
          targetStorage?.removeItem?.(SSO_BEARER_STORAGE_KEY);
        } catch {}
      }
    }
  };

  if (typeof channel.addEventListener === 'function') {
    channel.addEventListener('message', handleMessage);
  } else {
    channel.onmessage = handleMessage;
  }

  return {
    channel,
    postMessage(payload) {
      try {
        channel?.postMessage?.(payload);
      } catch {}
    },
    close() {
      try {
        if (typeof channel?.removeEventListener === 'function') {
          channel.removeEventListener('message', handleMessage);
        } else if (channel) {
          channel.onmessage = null;
        }
        channel?.close?.();
      } catch {}
      channel = null;
    },
  };
}

export function closeSsoTabSyncListener() {
  if (activeTabSync) {
    activeTabSync.close();
    activeTabSync = null;
  }
}

function ensureTabSyncListener() {
  if (typeof window === 'undefined' || typeof BroadcastChannel !== 'function') {
    if (activeTabSync) closeSsoTabSyncListener();
    return null;
  }

  const currentStorage = browserSessionStorage();
  if (
    activeTabSync &&
    activeTabSync.windowRef === window &&
    activeTabSync.storageRef === currentStorage &&
    activeTabSync.channelCtor === BroadcastChannel
  ) {
    return activeTabSync;
  }

  if (activeTabSync) {
    closeSsoTabSyncListener();
  }

  const bridge = attachSsoTabSync({
    BroadcastChannelImpl: BroadcastChannel,
    onSyncToken: (token) => {
      defaultAuthInternal?.setTokenSilent?.(token);
    },
    onClearToken: () => {
      defaultAuthInternal?.clearTokenSilent?.();
    },
  });

  activeTabSync = {
    ...bridge,
    windowRef: window,
    storageRef: currentStorage,
    channelCtor: BroadcastChannel,
  };
  return activeTabSync;
}

/** Create an authenticated transport with a per-tab bearer and rotation support. */
export function createSsoAuthFetch(
  fetchImpl = (...args) => globalThis.fetch(...args),
  getStorage = browserSessionStorage,
  { broadcastDefaultStorage = false } = {},
) {
  let volatileToken = null;

  const getToken = () => {
    try {
      const storage = getStorage();
      if (storage) {
        const stored = readRawTokenFromStorage(storage);
        if (stored) return stored;
        return volatileToken;
      }
    } catch {}
    return volatileToken;
  };

  const writeToken = (token, { broadcast = broadcastDefaultStorage } = {}) => {
    if (!isValidBearerToken(token)) {
      return false;
    }
    let persisted = false;
    let storage = null;
    try {
      storage = getStorage();
      if (storage) {
        storage.setItem(SSO_BEARER_STORAGE_KEY, token);
        persisted = true;
      }
    } catch {}
    volatileToken = persisted ? null : token;

    if (broadcast && persisted && storage === browserSessionStorage()) {
      const listener = ensureTabSyncListener();
      listener?.postMessage({ type: 'sync-bearer', token });
    }
    return true;
  };

  const removeToken = ({ broadcast = broadcastDefaultStorage } = {}) => {
    volatileToken = null;
    let storage = null;
    try {
      storage = getStorage();
      storage?.removeItem(SSO_BEARER_STORAGE_KEY);
    } catch {}

    if (broadcast && storage && storage === browserSessionStorage()) {
      const listener = ensureTabSyncListener();
      listener?.postMessage({ type: 'clear-bearer' });
    }
  };

  const setToken = (token) => writeToken(token, { broadcast: broadcastDefaultStorage });
  const clearToken = () => removeToken({ broadcast: broadcastDefaultStorage });

  const request = async (input, init = {}) => {
    if (broadcastDefaultStorage) {
      ensureTabSyncListener();
    }
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

  return {
    fetch: request,
    getToken,
    setToken,
    clearToken,
    setTokenSilent: (token) => writeToken(token, { broadcast: false }),
    clearTokenSilent: () => removeToken({ broadcast: false }),
  };
}

const ssoAuth = createSsoAuthFetch(
  (...args) => globalThis.fetch(...args),
  browserSessionStorage,
  { broadcastDefaultStorage: true },
);
defaultAuthInternal = ssoAuth;

export function readSsoBearerToken(storage) {
  const defaultStorage = browserSessionStorage();
  if (storage !== undefined && storage !== defaultStorage) {
    return readRawTokenFromStorage(storage);
  }
  ensureTabSyncListener();
  return ssoAuth.getToken();
}

export function storeSsoBearerToken(token, storage) {
  if (!isValidBearerToken(token)) return false;
  const defaultStorage = browserSessionStorage();
  if (storage !== undefined && storage !== defaultStorage) {
    try {
      storage?.setItem?.(SSO_BEARER_STORAGE_KEY, token);
      return true;
    } catch {
      return false;
    }
  }
  ensureTabSyncListener();
  return ssoAuth.setToken(token);
}

export function clearSsoBearerToken(storage) {
  const defaultStorage = browserSessionStorage();
  if (storage !== undefined && storage !== defaultStorage) {
    try {
      storage?.removeItem?.(SSO_BEARER_STORAGE_KEY);
    } catch {}
    return;
  }
  ensureTabSyncListener();
  ssoAuth.clearToken();
}

export const ssoFetch = (input, init) => ssoAuth.fetch(input, init);
export const setSsoBearerToken = (token, storage) => storeSsoBearerToken(token, storage);

/**
 * Request an active session bearer from sibling same-origin tabs via BroadcastChannel
 * when this tab's sessionStorage starts empty (e.g. target="_blank" rel="noopener").
 */
export async function syncBearerFromSiblingTabs({
  timeoutMs = 80,
  storage,
  enableBroadcastSync = false,
} = {}) {
  const existing = readSsoBearerToken(storage);
  if (existing) return existing;

  if (typeof window === 'undefined' || typeof BroadcastChannel !== 'function') {
    return null;
  }

  const defaultStorage = browserSessionStorage();
  const isCustomStorage = storage !== undefined && storage !== defaultStorage;
  if (isCustomStorage && !enableBroadcastSync) {
    return null;
  }

  const targetStorage = isCustomStorage ? storage : defaultStorage;
  if (!isCustomStorage) {
    ensureTabSyncListener();
  }

  return new Promise((resolve) => {
    let settled = false;
    let channel = null;
    let timer = null;
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    const finish = (token) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      try {
        if (typeof channel?.removeEventListener === 'function') {
          channel.removeEventListener('message', handleMessage);
        } else if (channel) {
          channel.onmessage = null;
        }
        channel?.close?.();
      } catch {}
      resolve(token || null);
    };

    const handleMessage = (event) => {
      const msg = event?.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type !== 'provide-bearer' && msg.type !== 'sync-bearer') return;
      if (msg.type === 'provide-bearer' && msg.requestId && msg.requestId !== requestId) {
        return;
      }
      if (!isValidBearerToken(msg.token)) return;

      if (!isCustomStorage) {
        ssoAuth.setTokenSilent(msg.token);
      } else {
        try {
          targetStorage?.setItem?.(SSO_BEARER_STORAGE_KEY, msg.token);
        } catch {}
      }
      finish(msg.token);
    };

    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.unref?.();
    } catch {
      finish(null);
      return;
    }

    if (typeof channel.addEventListener === 'function') {
      channel.addEventListener('message', handleMessage);
    } else {
      channel.onmessage = handleMessage;
    }

    const waitMs = Number.isFinite(timeoutMs) && timeoutMs >= 0 ? timeoutMs : 80;
    timer = setTimeout(() => {
      finish(readSsoBearerToken(storage));
    }, waitMs);
    timer?.unref?.();

    try {
      channel.postMessage({ type: 'request-bearer', requestId });
    } catch {
      finish(null);
    }
  });
}

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

export async function fetchSsoSession(base, fetchImpl = ssoFetch, options = {}) {
  const isStorageArg =
    options &&
    typeof options === 'object' &&
    typeof options.getItem === 'function';
  const storage = isStorageArg ? options : options?.storage;
  const timeoutMs = isStorageArg ? 80 : options?.timeoutMs ?? 80;
  const enableBroadcastSync = isStorageArg ? false : options?.enableBroadcastSync;

  if (!readSsoBearerToken(storage)) {
    await syncBearerFromSiblingTabs({ timeoutMs, storage, enableBroadcastSync });
  }
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
