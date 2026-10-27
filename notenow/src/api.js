import {
  getSsoApiBase,
  getSsoLoginUrl,
  takeSsoCodeFromUrl,
  createSsoCodeExchangeCoordinator,
  fetchSsoSession,
  isSessionRejected,
  ssoFetch,
  clearSsoBearerToken,
} from '../../shared/src/utils/ssoConfig.mjs';
import { getNoteImageEndpoint } from './noteImages.mjs';
// NoteNow API utility

const SSO_BASE = getSsoApiBase({ DEV: import.meta.env.DEV, VITE_SSO_URL: import.meta.env.VITE_SSO_URL });

const GUEST_TOKEN_KEY = 'notenow_guest_token';
const ssoCodeExchange = createSsoCodeExchangeCoordinator();
let ssoAuthGeneration = 0;

// Safe localStorage wrapper (protect against Safari private browsing & cross-site restrictions)
export const safeStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, val) => {
    try { localStorage.setItem(key, val); } catch {}
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
};
// Remove bearer tokens left by older app versions; current bearer state is tab-scoped.
safeStorage.removeItem('sso_token');

/**
 * Extracts an OAuth code from the callback URL and cleans the address bar.
 */
export function extractSsoCodeFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    return takeSsoCodeFromUrl();
  } catch {}
  return null;
}

export function getOrCreateGuestToken() {
  try {
    let token = safeStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      token = 'g_' + crypto.randomUUID().replace(/-/g, '');
      safeStorage.setItem(GUEST_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'g_' + crypto.randomUUID().replace(/-/g, '');
  }
}

function getHeaders(extraHeaders = {}) {
  const guestToken = getOrCreateGuestToken();
  const headers = {
    'Content-Type': 'application/json',
    'x-guest-token': guestToken,
    ...extraHeaders,
  };
  return headers;
}

async function apiFetch(path, options = {}) {
  const url = `${SSO_BASE}${path}`;
  const res = await ssoFetch(url, {
    credentials: 'include',
    headers: getHeaders(options.headers),
    ...options,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      msg = json.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Local Fallback Storage (Seamless preview & offline sync) ─
const LOCAL_STORAGE_KEY = 'notenow_local_notes';

function getLocalNotes() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const notes = JSON.parse(raw);
      // Clean up any legacy demo notes if present
      const cleaned = notes.filter((n) => n.id !== 'demo-welcome' && n.id !== 'demo-features');
      if (cleaned.length !== notes.length) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch {}
  return [];
}

function saveLocalNotes(notes) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

// ─── Notes API ────────────────────────────────────────────────

export const notesApi = {
  list: async () => {
    try {
      const data = await apiFetch('/notes');
      return data;
    } catch {
      return { notes: getLocalNotes(), sharedNotes: [] };
    }
  },

  getById: async (id) => {
    try {
      return await apiFetch(`/notes/${id}`);
    } catch {
      const found = getLocalNotes().find((n) => n.id === id);
      if (found) return found;
      throw new Error('Không tìm thấy ghi chú');
    }
  },

  getByShareToken: async (shareToken, accessPassword) => {
    try {
      const headers = {};
      if (accessPassword) headers['x-share-password'] = accessPassword;
      return await apiFetch(`/notes/share/${shareToken}`, { headers });
    } catch (e) {
      if (e.message && (e.message.includes('password') || e.message.includes('401') || e.message.includes('403'))) {
        throw e;
      }
      const found = getLocalNotes().find((n) => n.shareToken === shareToken);
      if (found) return { ...found, canEdit: found.shareMode === 'edit' };
      throw new Error('Link chia sẻ không hợp lệ hoặc đã hết hạn');
    }
  },

  create: async (dto) => {
    try {
      return await apiFetch('/notes', { method: 'POST', body: JSON.stringify(dto) });
    } catch {
      const newNote = {
        id: 'local-' + Date.now(),
        title: dto.title || null,
        content: dto.content || '',
        bgColor: dto.bgColor || 'default',
        bgPattern: dto.bgPattern || 'none',
        images: [],
        isPinned: false,
        shareMode: 'none',
        shareToken: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const notes = [newNote, ...getLocalNotes()];
      saveLocalNotes(notes);
      return newNote;
    }
  },

  update: async (id, dto) => {
    if (String(id).startsWith('local-')) {
      const notes = getLocalNotes();
      const idx = notes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        notes[idx] = { ...notes[idx], ...dto, updatedAt: new Date().toISOString() };
        saveLocalNotes(notes);
        return notes[idx];
      }
      throw new Error('Ghi chú không tồn tại');
    }
    try {
      return await apiFetch(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
    } catch {
      const notes = getLocalNotes();
      const idx = notes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        notes[idx] = { ...notes[idx], ...dto, updatedAt: new Date().toISOString() };
        saveLocalNotes(notes);
        return notes[idx];
      }
      throw new Error('Ghi chú không tồn tại');
    }
  },

  updateByShareToken: async (shareToken, dto) => {
    try {
      return await apiFetch(`/notes/share/${shareToken}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch {
      const notes = getLocalNotes();
      const idx = notes.findIndex((n) => n.shareToken === shareToken);
      if (idx !== -1) {
        notes[idx] = { ...notes[idx], ...dto, updatedAt: new Date().toISOString() };
        saveLocalNotes(notes);
        return { ...notes[idx], canEdit: true };
      }
      throw new Error('Không tìm thấy ghi chú');
    }
  },

  fetchImage: async ({ noteId, shareToken, image, guestOwned = false }) => {
    const endpoint = getNoteImageEndpoint({ noteId, shareToken, image });
    if (!endpoint) throw new Error('Không xác định được ảnh cần tải.');

    const headers = {};
    if (!shareToken) {
      if (guestOwned) {
        headers['x-guest-token'] = getOrCreateGuestToken();
      }
    }

    const response = await ssoFetch(`${SSO_BASE}${endpoint}`, { credentials: 'include', headers });
    if (!response.ok) {
      throw new Error(`Không tải được ảnh đính kèm (HTTP ${response.status}).`);
    }
    return response.blob();
  },

  delete: async (id) => {
    if (String(id).startsWith('local-')) {
      const notes = getLocalNotes().filter((n) => n.id !== id);
      saveLocalNotes(notes);
      return { success: true };
    }
    try {
      return await apiFetch(`/notes/${id}`, { method: 'DELETE' });
    } catch {
      const notes = getLocalNotes().filter((n) => n.id !== id);
      saveLocalNotes(notes);
      return { success: true };
    }
  },

  updateShare: async (id, shareMode) => {
    if (String(id).startsWith('local-')) {
      const notes = getLocalNotes();
      const idx = notes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        const shareToken = shareMode !== 'none'
          ? (notes[idx].shareToken || 's_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16))
          : null;
        notes[idx] = { ...notes[idx], shareMode, shareToken };
        saveLocalNotes(notes);
        return { shareToken };
      }
      throw new Error('Không tìm thấy ghi chú');
    }
    try {
      return await apiFetch(`/notes/${id}/share`, {
        method: 'POST',
        body: JSON.stringify({ shareMode }),
      });
    } catch {
      const notes = getLocalNotes();
      const idx = notes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        const shareToken = shareMode !== 'none'
          ? (notes[idx].shareToken || 's_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16))
          : null;
        notes[idx] = { ...notes[idx], shareMode, shareToken };
        saveLocalNotes(notes);
        return { shareToken };
      }
      throw new Error('Không tìm thấy ghi chú');
    }
  },

  sendInvite: (id, email, permission = 'view') =>
    apiFetch(`/notes/${id}/share/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),

  acceptInvite: (token) =>
    apiFetch(`/notes/invite/accept/${token}`, { method: 'POST', body: '{}' }),

  removeSharedUser: (noteId, targetUserId) =>
    apiFetch(`/notes/${noteId}/share/user/${targetUserId}`, { method: 'DELETE' }),

  reorderNotes: async (orderedIds) => {
    try {
      return await apiFetch('/notes/reorder', {
        method: 'POST',
        body: JSON.stringify({ order: orderedIds }),
      });
    } catch {
      // Store order locally if API unavailable
      try { localStorage.setItem('notenow_sort_order', JSON.stringify(orderedIds)); } catch {}
      return { success: true };
    }
  },

  setSharePassword: async (id, password) => {
    try {
      return await apiFetch(`/notes/${id}/share/password`, {
        method: 'POST',
        body: JSON.stringify({ password: password || null }),
      });
    } catch (e) {
      // Fallback: store locally
      const notes = getLocalNotes();
      const idx = notes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        notes[idx] = { ...notes[idx], sharePassword: password || null };
        saveLocalNotes(notes);
        return { success: true };
      }
      throw e;
    }
  },

  verifySharePassword: async (shareToken, password) => {
    return await apiFetch(`/notes/share/${shareToken}/verify-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  claimGuestNotes: async () => {
    try {
      const res = await apiFetch('/notes/claim', { method: 'POST', body: '{}' });
      // Also upload any local draft notes created offline or before login
      const localNotes = getLocalNotes().filter((n) => String(n.id).startsWith('local-'));
      for (const local of localNotes) {
        try {
          await apiFetch('/notes', {
            method: 'POST',
            body: JSON.stringify({
              title: local.title,
              content: local.content,
              bgColor: local.bgColor,
              bgPattern: local.bgPattern,
            }),
          });
        } catch {}
      }
      if (localNotes.length > 0) {
        saveLocalNotes([]);
      }
      return res;
    } catch {
      return { claimed: 0 };
    }
  },

  uploadImage: async (noteId, file) => {
    try {
      const guestToken = getOrCreateGuestToken();
      const formData = new FormData();
      formData.append('image', file);
      const headers = { 'x-guest-token': guestToken };
      const res = await ssoFetch(`${SSO_BASE}/notes/${noteId}/images`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch {}
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imgObj = { url: reader.result, filename: file.name, width: 800, height: 600 };
        const notes = getLocalNotes();
        const n = notes.find((item) => item.id === noteId);
        if (n) {
          n.images = [...(n.images || []), imgObj];
          saveLocalNotes(notes);
        }
        resolve({ image: imgObj });
      };
      reader.readAsDataURL(file);
    });
  },

  deleteImage: async (noteId, index) => {
    try {
      return await apiFetch(`/notes/${noteId}/images/${index}`, { method: 'DELETE' });
    } catch {
      const notes = getLocalNotes();
      const n = notes.find((item) => item.id === noteId);
      if (n && n.images) {
        n.images.splice(index, 1);
        saveLocalNotes(notes);
      }
      return { success: true };
    }
  },

  uploadImageByShareToken: async (shareToken, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const guestToken = getOrCreateGuestToken();
      const headers = { 'x-guest-token': guestToken };
      const res = await ssoFetch(`${SSO_BASE}/notes/share/${shareToken}/images`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch {}
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imgObj = { url: reader.result, filename: file.name, width: 800, height: 600 };
        const notes = getLocalNotes();
        const n = notes.find((item) => item.shareToken === shareToken);
        if (n) {
          n.images = [...(n.images || []), imgObj];
          saveLocalNotes(notes);
        }
        resolve({ image: imgObj });
      };
      reader.readAsDataURL(file);
    });
  },

  deleteImageByShareToken: async (shareToken, index) => {
    try {
      return await apiFetch(`/notes/share/${shareToken}/images/${index}`, { method: 'DELETE' });
    } catch {
      const notes = getLocalNotes();
      const n = notes.find((item) => item.shareToken === shareToken);
      if (n && n.images) {
        n.images.splice(index, 1);
        saveLocalNotes(notes);
      }
      return { success: true };
    }
  },
};

// ─── SSO Auth ─────────────────────────────────────────────────

export const ssoApi = {
  getLoginUrl: (customRedirect) => {
    const returnUrl = customRedirect || (typeof window !== 'undefined' ? window.location.href : 'https://vunph.id.vn/note/');
    return getSsoLoginUrl({ VITE_SSO_URL: import.meta.env.VITE_SSO_URL }, returnUrl);
  },

  getMe: async () => {
    const generation = ++ssoAuthGeneration;
    const code = extractSsoCodeFromUrl();
    const exchangePromise = ssoCodeExchange.getOrStart(SSO_BASE, code);
    if (exchangePromise) {
      try {
        await exchangePromise;
        if (generation !== ssoAuthGeneration) return null;
        safeStorage.removeItem('sso_logged_out');
        ssoCodeExchange.complete();
        const session = await fetchSsoSession(SSO_BASE);
        if (generation !== ssoAuthGeneration) return null;
        return session?.user ? session : null;
      } finally {
        ssoCodeExchange.finish(exchangePromise);
      }
    }
    const loggedOut = safeStorage.getItem('sso_logged_out');
    if (loggedOut) return null;

    try {
      const data = await fetchSsoSession(SSO_BASE);
      if (data?.user) {
        safeStorage.removeItem('sso_logged_out');
        return data;
      }
      return null;
    } catch (error) {
      if (isSessionRejected(error)) {
        return null;
      }
      throw error;
    }
  },

  logout: async () => {
    ++ssoAuthGeneration;
    ssoCodeExchange.cancel();
    try {
      await apiFetch('/sso/logout', { method: 'POST', body: '{}' });
    } catch {}
    clearSsoBearerToken();
    safeStorage.setItem('sso_logged_out', '1');
    safeStorage.setItem('vInfiSSO-state', JSON.stringify({ type: 'logout', t: Date.now() }));
  },
};

// ─── Image compression (client-side preview before upload) ────

export async function compressImageTo720p(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Cannot load image ${file.name}`));
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const isLandscape = w >= h;
        const [maxLong, maxShort] = [1280, 720];
        let tw = w, th = h;
        if (isLandscape) {
          if (tw > maxLong) { th = Math.round(th * maxLong / tw); tw = maxLong; }
          if (th > maxShort) { tw = Math.round(tw * maxShort / th); th = maxShort; }
        } else {
          if (th > maxLong) { tw = Math.round(tw * maxLong / th); th = maxLong; }
          if (tw > maxShort) { th = Math.round(th * maxShort / tw); tw = maxShort; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = tw;
        canvas.height = th;
        canvas.getContext('2d').drawImage(img, 0, 0, tw, th);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'));
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.82,
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Helpers ──────────────────────────────────────────────────

export function getDaysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export function charCount(html) {
  return stripHtml(html).length;
}
