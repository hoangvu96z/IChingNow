const BASE = (import.meta.env.VITE_SSO_URL || '').replace(/\/$/, '');
export async function ssoRequest(path, { method = 'GET', body, signal } = {}) {
  const token = localStorage.getItem('sso_token');
  const response = await fetch(`${BASE}${path}`, {
    method, signal, credentials: 'include',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || `Yêu cầu thất bại (${response.status})`);
  return data;
}
