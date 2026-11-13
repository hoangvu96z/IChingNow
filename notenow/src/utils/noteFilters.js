import { extractChecklistProgress } from '../safeNoteContent.js';
import { normalizeNoteTag, normalizeNoteTags } from '../../../shared/src/utils/saveToNoteNow.mjs';

export const SUGGESTED_NOTE_TAGS = [
  'cong-viec',
  'tai-chinh',
  'hoc-tap',
  'nghiem-ly',
  'ca-nhan',
];

function stripTagsToPlainText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-4]|\/blockquote)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

export function extractInlineHashtags(html) {
  const plain = stripTagsToPlainText(html);
  if (!plain) return [];
  const matches = [];
  const hashtagRegex = /(?:^|\s)#([\p{L}][\p{L}\p{N}_-]{1,31})(?=$|\s|[.,!?;:)\]])/gu;
  let m;
  while ((m = hashtagRegex.exec(plain)) !== null) {
    const normalized = normalizeNoteTag(m[1]);
    if (normalized) matches.push(normalized);
  }
  return normalizeNoteTags(matches);
}

export function collectBoardTags(notes = [], unlockedNoteIds = {}) {
  const seen = new Set();
  const ordered = [];
  for (const note of notes || []) {
    if (!note) continue;
    const isLocked = Boolean(note.hasPassword) && !unlockedNoteIds[note.id];
    if (isLocked) continue;
    for (const tag of normalizeNoteTags(note.tags || [])) {
      if (!seen.has(tag)) {
        seen.add(tag);
        ordered.push(tag);
      }
    }
  }
  return ordered;
}

export function collectBoardColors(notes = []) {
  const seen = new Set();
  const colors = [];
  for (const note of notes || []) {
    const bg = note?.bgColor || 'default';
    if (!seen.has(bg)) {
      seen.add(bg);
      colors.push(bg);
    }
  }
  return colors.length > 1 ? colors : [];
}

export function noteHasImages(note) {
  if (Array.isArray(note?.images) && note.images.length > 0) return true;
  return /<img\b/i.test(note?.content || '');
}

export function noteHasAudios(note) {
  return Array.isArray(note?.audios) && note.audios.length > 0;
}

export function noteHasChecklist(note) {
  return extractChecklistProgress(note?.content || '').total > 0;
}

export function filterBoardNotes(
  notes = [],
  {
    search = '',
    tag = '',
    type = 'all',
    color = '',
    unlockedNoteIds = {},
  } = {},
) {
  const normalizedTagFilter = tag ? normalizeNoteTag(tag) : '';
  const query = String(search || '').trim().toLowerCase();
  const tagQuery = query.replace(/^#+/, '');

  return (notes || []).filter((note) => {
    if (!note) return false;
    const isLocked = Boolean(note.hasPassword) && !unlockedNoteIds[note.id];

    // 1. Color filter
    if (color && (note.bgColor || 'default') !== color) {
      return false;
    }

    // 2. Type filter
    if (type === 'checklist') {
      if (isLocked || !noteHasChecklist(note)) return false;
    } else if (type === 'image') {
      if (isLocked || !noteHasImages(note)) return false;
    } else if (type === 'audio') {
      if (isLocked || !noteHasAudios(note)) return false;
    } else if (type === 'locked') {
      if (!note.hasPassword) return false;
    }

    // 3. Tag filter (do not leak tags of locked notes)
    const noteTags = isLocked ? [] : normalizeNoteTags(note.tags || []);
    if (normalizedTagFilter && !noteTags.includes(normalizedTagFilter)) {
      return false;
    }

    // 4. Search query (never leak body/tags of locked notes)
    if (query) {
      const titleMatches = (note.title || '').toLowerCase().includes(query);
      if (isLocked) {
        return titleMatches;
      }
      const bodyMatches = stripTagsToPlainText(note.content || '').toLowerCase().includes(query);
      const tagMatches = Boolean(tagQuery) && noteTags.some((t) => t.includes(tagQuery));
      return titleMatches || bodyMatches || tagMatches;
    }

    return true;
  });
}
