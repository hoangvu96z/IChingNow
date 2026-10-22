import { getSsoApiBase } from './ssoConfig.mjs';

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('sso_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export class AiProxyError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = 'AiProxyError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export async function requestAiChat({
  app,
  model,
  messages,
  stream = true,
  max_tokens,
  temperature,
  signal,
}) {
  const response = await fetch(`${SSO_BASE}/plans/ai`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app,
      model,
      messages,
      stream,
      ...(max_tokens === undefined ? {} : { max_tokens }),
      ...(temperature === undefined ? {} : { temperature }),
    }),
  });

  if (!response.ok) {
    const data = await response.clone().json().catch(() => ({}));
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || data.error || `AI request failed (${response.status})`;
    throw new AiProxyError(message, {
      status: response.status,
      code: data.code,
      data,
    });
  }

  return response;
}

export async function refreshAiQuota(app) {
  const quotaApp = {
    iching: 'ichingnow',
    tarot: 'tarotnow',
    tuvi: 'tuvinow',
  }[app];
  if (!quotaApp) return null;

  const response = await fetch(`${SSO_BASE}/plans/my-quota?app=${quotaApp}`, {
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}
