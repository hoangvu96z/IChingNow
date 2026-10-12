// NoteNow API utility

const SSO_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_SSO_URL || 'https://sso.vunph.click').replace(/\/$/, '');

const GUEST_TOKEN_KEY = 'notenow_guest_token';

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

/**
 * Extracts and stores sso_token from URL query string if just redirected from SSO.
 * Automatically cleans the address bar without page reload.
 */
export function extractSsoTokenFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('sso_token');
    if (tokenFromUrl) {
      safeStorage.setItem('sso_token', tokenFromUrl);
      safeStorage.removeItem('sso_logged_out');
      urlParams.delete('sso_token');
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      return tokenFromUrl;
    }
  } catch {}
  return safeStorage.getItem('sso_token');
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
  const ssoToken = safeStorage.getItem('sso_token');
  if (ssoToken) {
    headers['Authorization'] = `Bearer ${ssoToken}`;
  }
  return headers;
}

async function apiFetch(path, options = {}) {
  const url = `${SSO_BASE}${path}`;
  const res = await fetch(url, {
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

  getByShareToken: async (shareToken) => {
    try {
      return await apiFetch(`/notes/share/${shareToken}`);
    } catch {
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
      const ssoToken = safeStorage.getItem('sso_token');
      const formData = new FormData();
      formData.append('image', file);
      const headers = { 'x-guest-token': guestToken };
      if (ssoToken) {
        headers['Authorization'] = `Bearer ${ssoToken}`;
      }
      const res = await fetch(`${SSO_BASE}/notes/${noteId}/images`, {
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
      const ssoToken = safeStorage.getItem('sso_token');
      const headers = { 'x-guest-token': guestToken };
      if (ssoToken) {
        headers['Authorization'] = `Bearer ${ssoToken}`;
      }
      const res = await fetch(`${SSO_BASE}/notes/share/${shareToken}/images`, {
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
    const ssoBase = (import.meta.env.VITE_SSO_URL || 'https://sso.vunph.click').replace(/\/$/, '');
    let returnUrl = 'https://vunph.id.vn/note/';
    if (typeof window !== 'undefined') {
      const url = new URL(customRedirect || window.location.href);
      url.searchParams.delete('sso_token');
      returnUrl = url.toString();
    }
    return `${ssoBase}/ui/sso?redirect=${encodeURIComponent(returnUrl)}`;
  },

  getMe: async () => {
    extractSsoTokenFromUrl();
    const token = safeStorage.getItem('sso_token');
    const loggedOut = safeStorage.getItem('sso_logged_out');
    if (loggedOut && !token) return null;

    try {
      const data = await apiFetch('/sso/me');
      if (data?.user) {
        safeStorage.removeItem('sso_logged_out');
        if (data.token) {
          safeStorage.setItem('sso_token', data.token);
        }
        return data;
      } else {
        if (token) {
          safeStorage.removeItem('sso_token');
        }
        return null;
      }
    } catch {
      return null;
    }
  },

  logout: async () => {
    try {
      await apiFetch('/sso/logout', { method: 'POST', body: '{}' });
    } catch {}
    safeStorage.removeItem('sso_token');
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
