// In development, use relative paths (Vite proxy → sso.vunph.click) to avoid CORS issues.
// In production, VITE_SSO_URL should be set to the full SSO server URL.
const BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_SSO_URL || '').replace(/\/$/, '');

export async function ssoRequest(path, { method = 'GET', body, signal } = {}) {
  const token = localStorage.getItem('sso_token');
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
    method, signal, credentials: 'include',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || `Yêu cầu thất bại (${response.status})`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}
