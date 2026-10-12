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
  return `${getSsoWebBase(env)}/ui/sso?redirect=${encodeURIComponent(target.toString())}`;
}

export async function fetchSsoSession(base, token, fetchImpl = fetch) {
  const response = await fetchImpl(`${base}/sso/me`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
