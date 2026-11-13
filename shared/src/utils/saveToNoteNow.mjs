import { getAppLink } from './appLinks.mjs';
import { ssoFetch } from './ssoConfig.mjs';

export const NOTENOW_HANDOFF_QUEUE_KEY = 'notenow_incoming_drafts';
export const NOTENOW_IMPORTED_IDS_KEY = 'notenow_imported_draft_ids';
export const NOTENOW_HASH_PARAM = 'nn_import';
const MAX_HASH_CHARS = 12000;
const MAX_QUEUED_DRAFTS = 25;

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeNoteTag(rawTag) {
  if (!rawTag) return '';
  const cleaned = String(rawTag)
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 32);
  return cleaned;
}

export function normalizeNoteTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of tags) {
    const tag = normalizeNoteTag(raw);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
      if (result.length >= 12) break;
    }
  }
  return result;
}

export function buildReadingNoteHtml({
  sourceAppLabel = 'SpiritNow',
  timestampLabel = '',
  question = '',
  summaryLines = [],
  checklistItems = [],
  sourceUrl = '',
  tags = [],
} = {}) {
  const parts = [];
  const stamp =
    timestampLabel ||
    new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  parts.push(
    `<p><strong>Nguồn:</strong> ${escapeHtml(sourceAppLabel)} · <strong>Lưu lúc:</strong> ${escapeHtml(stamp)}</p>`,
  );

  if (question && String(question).trim()) {
    parts.push(`<blockquote><p><strong>Câu hỏi / Chủ đề:</strong> ${escapeHtml(String(question).trim())}</p></blockquote>`);
  }

  const cleanSummary = (Array.isArray(summaryLines) ? summaryLines : [])
    .map((line) => String(line ?? '').trim())
    .filter(Boolean);
  if (cleanSummary.length > 0) {
    parts.push('<h3>Tóm tắt cốt lõi</h3>');
    parts.push(
      `<ul>${cleanSummary.map((line) => `<li><p>${escapeHtml(line)}</p></li>`).join('')}</ul>`,
    );
  }

  const cleanChecklist = (Array.isArray(checklistItems) ? checklistItems : [])
    .map((item) => {
      if (typeof item === 'string') {
        return { text: item.trim(), checked: false };
      }
      return {
        text: String(item?.text ?? '').trim(),
        checked: Boolean(item?.checked),
      };
    })
    .filter((item) => item.text.length > 0);

  if (cleanChecklist.length > 0) {
    parts.push('<h3>Việc cần làm &amp; Nghiệm lý</h3>');
    parts.push(
      `<ul data-type="taskList">${cleanChecklist
        .map(
          (item) =>
            `<li data-type="taskItem" data-checked="${item.checked ? 'true' : 'false'}"><label><input type="checkbox"${item.checked ? ' checked="checked"' : ''}></label><div><p>${escapeHtml(item.text)}</p></div></li>`,
        )
        .join('')}</ul>`,
    );
  }

  if (sourceUrl && /^https?:\/\//i.test(String(sourceUrl))) {
    parts.push(`<p><a href="${escapeHtml(sourceUrl)}">Mở lại ứng dụng gốc</a></p>`);
  }

  const normalizedTags = normalizeNoteTags(tags);
  if (normalizedTags.length > 0) {
    parts.push(`<p>${normalizedTags.map((t) => `#${escapeHtml(t)}`).join(' ')}</p>`);
  }

  return parts.join('');
}

function toBase64UrlUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64UrlUtf8(encoded) {
  const padded = String(encoded)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(String(encoded).length / 4) * 4, '=');
  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function encodeNoteHandoffHash(draft) {
  if (!draft || typeof draft !== 'object') return '';
  const payload = {
    clientDraftId: String(draft.clientDraftId || ''),
    title: draft.title ? String(draft.title).slice(0, 200) : null,
    content: String(draft.content || ''),
    bgColor: String(draft.bgColor || 'default'),
    tags: normalizeNoteTags(draft.tags || []),
    createdAt: draft.createdAt || new Date().toISOString(),
  };
  const encoded = toBase64UrlUtf8(JSON.stringify(payload));
  if (encoded.length > MAX_HASH_CHARS) return '';
  return `#${NOTENOW_HASH_PARAM}=${encoded}`;
}

export function decodeNoteHandoffHash(hashString) {
  if (!hashString || typeof hashString !== 'string') return null;
  const rawHash = hashString.startsWith('#') ? hashString.slice(1) : hashString;
  const params = new URLSearchParams(rawHash);
  const encoded = params.get(NOTENOW_HASH_PARAM);
  if (!encoded || encoded.length > MAX_HASH_CHARS) return null;
  try {
    const parsed = JSON.parse(fromBase64UrlUtf8(encoded));
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      clientDraftId: String(parsed.clientDraftId || `hash_${Date.now()}`),
      title: parsed.title ? String(parsed.title).slice(0, 200) : null,
      content: String(parsed.content || ''),
      bgColor: String(parsed.bgColor || 'default'),
      bgPattern: 'none',
      tags: normalizeNoteTags(parsed.tags || []),
      createdAt: parsed.createdAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function enqueueIncomingNoteDraft(draft, storage = globalThis.localStorage) {
  if (!storage || !draft) return false;
  try {
    const raw = storage.getItem(NOTENOW_HANDOFF_QUEUE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(existing) ? existing : [];
    const filtered = list.filter((item) => item?.clientDraftId !== draft.clientDraftId);
    const next = [draft, ...filtered].slice(0, MAX_QUEUED_DRAFTS);
    storage.setItem(NOTENOW_HANDOFF_QUEUE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function consumeIncomingNoteDrafts({
  storage = globalThis.localStorage,
  location = globalThis.location,
  history = globalThis.history,
} = {}) {
  const collected = [];
  let importedIds = new Set();

  if (storage) {
    try {
      const rawIds = storage.getItem(NOTENOW_IMPORTED_IDS_KEY);
      const parsedIds = rawIds ? JSON.parse(rawIds) : [];
      if (Array.isArray(parsedIds)) importedIds = new Set(parsedIds);
    } catch {}

    try {
      const rawQueue = storage.getItem(NOTENOW_HANDOFF_QUEUE_KEY);
      if (rawQueue) {
        storage.removeItem(NOTENOW_HANDOFF_QUEUE_KEY);
        const parsedQueue = JSON.parse(rawQueue);
        if (Array.isArray(parsedQueue)) {
          for (const item of parsedQueue) {
            if (item && typeof item === 'object') collected.push(item);
          }
        }
      }
    } catch {}
  }

  if (location?.hash && location.hash.includes(`${NOTENOW_HASH_PARAM}=`)) {
    const fromHash = decodeNoteHandoffHash(location.hash);
    if (fromHash) {
      collected.push(fromHash);
    }
    try {
      const cleanUrl = `${location.pathname || ''}${location.search || ''}`;
      history?.replaceState?.(history.state ?? null, '', cleanUrl);
    } catch {}
  }

  const deduped = [];
  for (const item of collected) {
    const id = String(item.clientDraftId || '');
    if (id && importedIds.has(id)) continue;
    if (id) importedIds.add(id);
    deduped.push({
      clientDraftId: id || `draft_${Date.now()}`,
      title: item.title ? String(item.title).slice(0, 200) : null,
      content: String(item.content || ''),
      bgColor: String(item.bgColor || 'default'),
      bgPattern: String(item.bgPattern || 'none'),
      tags: normalizeNoteTags(item.tags || []),
      createdAt: item.createdAt || new Date().toISOString(),
    });
  }

  if (storage && deduped.length > 0) {
    try {
      const recentIds = Array.from(importedIds).slice(-100);
      storage.setItem(NOTENOW_IMPORTED_IDS_KEY, JSON.stringify(recentIds));
    } catch {}
  }

  return deduped;
}

export async function saveReadingToNoteNow({
  title,
  contentHtml,
  sourceAppLabel,
  question,
  summaryLines,
  checklistItems,
  sourceUrl,
  tags = [],
  bgColor = 'default',
  isAuthenticated = false,
  ssoBase = '',
  env = {},
  location = globalThis.location,
  fetchImpl = ssoFetch,
  storage = globalThis.localStorage,
} = {}) {
  const normalizedTags = normalizeNoteTags(tags);
  const html =
    contentHtml ||
    buildReadingNoteHtml({
      sourceAppLabel,
      question,
      summaryLines,
      checklistItems,
      sourceUrl: sourceUrl || location?.href || '',
      tags: normalizedTags,
    });

  const cleanTitle = String(title || question || `${sourceAppLabel || 'SpiritNow'} — Ghi chú nghiệm lý`)
    .trim()
    .slice(0, 200);

  const baseNoteNowUrl = getAppLink('/note/', env, location);
  const clientDraftId = `nn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (isAuthenticated && typeof fetchImpl === 'function') {
    try {
      const res = await fetchImpl(`${ssoBase}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          content: html,
          bgColor,
          bgPattern: 'none',
          tags: normalizedTags,
        }),
      });
      if (res.ok) {
        const savedNote = await res.json();
        return {
          ok: true,
          mode: 'cloud',
          note: savedNote,
          openUrl: baseNoteNowUrl,
        };
      }
    } catch {
      // Fall back cleanly to local handoff queue + hash fragment below
    }
  }

  const draft = {
    clientDraftId,
    title: cleanTitle,
    content: html,
    bgColor,
    bgPattern: 'none',
    tags: normalizedTags,
    createdAt: new Date().toISOString(),
  };

  enqueueIncomingNoteDraft(draft, storage);
  const hashSuffix = encodeNoteHandoffHash(draft);
  const openUrl = hashSuffix ? `${baseNoteNowUrl}${hashSuffix}` : baseNoteNowUrl;

  return {
    ok: true,
    mode: 'handoff',
    draft,
    openUrl,
  };
}
