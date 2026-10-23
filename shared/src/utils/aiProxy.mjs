import { getSsoApiBase, ssoFetch } from './ssoConfig.mjs';

function resolveDefaultSsoBase() {
  try {
    return getSsoApiBase({
      DEV: import.meta.env.DEV,
      VITE_SSO_URL: import.meta.env.VITE_SSO_URL,
    });
  } catch {
    return getSsoApiBase({});
  }
}

const SSO_BASE = resolveDefaultSsoBase();

export const DEFAULT_AI_MODEL = 'combo1';

export const PREDEFINED_AI_MODELS = [
  { value: 'combo1', label: 'combo1 (Combo)' },
  { value: 'openrouter/tencent/hy3:free', label: 'hy3:free' },
  { value: 'openrouter/openai/gpt-oss-20b:free', label: 'gpt-oss-20b:free' },
  { value: 'openrouter/poolside/laguna-xs-2.1:free', label: 'laguna-xs-2.1:free' },
  { value: 'openrouter/google/gemma-4-26b-a4b-it:free', label: 'gemma-4-26b-a4b-it:free' },
];

const QUOTA_APP_BUCKETS = {
  iching: 'ichingnow',
  ichingnow: 'ichingnow',
  tarot: 'tarotnow',
  tarotnow: 'tarotnow',
  tuvi: 'tuvinow',
  tuvinow: 'tuvinow',
};

export function resolveAllowedAiModel(model, models = PREDEFINED_AI_MODELS) {
  if (
    typeof model === 'string' &&
    models.some((entry) => (typeof entry === 'string' ? entry === model : entry?.value === model))
  ) {
    return model;
  }
  const first = models[0];
  return (typeof first === 'string' ? first : first?.value) || DEFAULT_AI_MODEL;
}

export function loadSanitizedAiSettings(
  storageKey,
  storage = globalThis.localStorage,
  models = PREDEFINED_AI_MODELS,
) {
  let model = DEFAULT_AI_MODEL;
  try {
    const raw = storage?.getItem?.(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      model = resolveAllowedAiModel(parsed?.model, models);
    }
  } catch {}
  const sanitized = { model };
  try {
    storage?.setItem?.(storageKey, JSON.stringify(sanitized));
  } catch {}
  return sanitized;
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

export async function requestAiChat(
  {
    app,
    model = DEFAULT_AI_MODEL,
    messages,
    stream = true,
    max_tokens,
    temperature,
    signal,
    ssoBase: inlineSsoBase,
    fetchImpl: inlineFetchImpl,
  },
  {
    ssoBase = inlineSsoBase ?? SSO_BASE,
    fetchImpl = inlineFetchImpl ?? ssoFetch,
  } = {},
) {
  const response = await fetchImpl(`${ssoBase}/plans/ai`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app,
      model: model || DEFAULT_AI_MODEL,
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

export async function refreshAiQuota(app, { ssoBase = SSO_BASE, fetchImpl = ssoFetch } = {}) {
  const normalized = typeof app === 'string' ? app.trim().toLowerCase() : '';
  const quotaApp = QUOTA_APP_BUCKETS[normalized];
  if (!quotaApp) return null;

  const response = await fetchImpl(`${ssoBase}/plans/my-quota?app=${quotaApp}`, {
    credentials: 'include',
  });
  if (!response.ok) return null;
  return response.json().catch(() => null);
}
