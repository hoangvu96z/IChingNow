import { getSsoApiBase, ssoFetch } from '../../shared/src/utils/ssoConfig.mjs';

function resolveDefaultEnv() {
  try {
    return {
      DEV: Boolean(import.meta.env.DEV),
      VITE_SSO_URL: import.meta.env.VITE_SSO_URL,
    };
  } catch {
    return { DEV: false, VITE_SSO_URL: undefined };
  }
}

const APP_ENV = resolveDefaultEnv();
const SSO_BASE = getSsoApiBase({
  DEV: APP_ENV.DEV,
  VITE_SSO_URL: APP_ENV.VITE_SSO_URL,
});

export async function fetchMeOverview({
  signal,
  apiBase = SSO_BASE,
  fetchImpl = ssoFetch,
} = {}) {
  const response = await fetchImpl(`${apiBase}/me/overview`, {
    credentials: 'include',
    signal,
  });
  if (!response.ok) {
    const error = new Error(`Không tải được tổng quan (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function tarotCardsUrl(location, dev = APP_ENV.DEV) {
  const base = new URL('/tarot/', location.origin);
  if (dev) base.port = '5174';
  return new URL('data/cards.json', base);
}

export async function fetchTarotCards(fetchImpl = fetch, location = window.location, options = {}) {
  const response = await fetchImpl(tarotCardsUrl(location, options.dev), { signal: options.signal });
  if (!response.ok) throw new Error('Không tải được bộ bài Tarot');
  const cards = await response.json();
  if (!Array.isArray(cards)) throw new Error('Dữ liệu bộ bài Tarot không hợp lệ');
  return cards;
}
