export const MAX_IMAGES_PER_NOTE = 10;
export const MAX_AUDIOS_PER_NOTE = 10;

export function getLocalNoteImageSource(image) {
  const url = image?.url;
  return typeof url === 'string' && (/^data:image\//i.test(url) || url.startsWith('blob:'))
    ? url
    : null;
}

export function getLocalNoteAudioSource(audio) {
  const url = audio?.url;
  return typeof url === 'string' &&
    (/^data:(?:audio|video|application)\//i.test(url) || url.startsWith('blob:'))
    ? url
    : null;
}

export function getNoteImageFilename(image) {
  const url = image?.url;
  if (typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:')) {
    try {
      const pathname = new URL(url, 'https://notenow.invalid').pathname;
      const parts = pathname.split('/').filter(Boolean);
      const isLegacyUpload = parts[0] === 'uploads' && parts[1] === 'notes' && parts.length >= 4;
      const isPrivateImageRoute = parts[0] === 'notes' && parts.length === 4 && parts[2] === 'images';
      const isShareImageRoute = parts[0] === 'notes' && parts[1] === 'share' && parts.length === 5 && parts[3] === 'images';
      if (isLegacyUpload || isPrivateImageRoute || isShareImageRoute) {
        return decodeURIComponent(parts.at(-1));
      }
    } catch {}
  }

  return typeof image?.filename === 'string' ? image.filename : null;
}

export function getNoteAudioFilename(audio) {
  const url = audio?.url;
  if (typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:')) {
    try {
      const pathname = new URL(url, 'https://notenow.invalid').pathname;
      const parts = pathname.split('/').filter(Boolean);
      const isLegacyUpload = parts[0] === 'uploads' && parts[1] === 'notes' && parts.length >= 4;
      const isPrivateAudioRoute = parts[0] === 'notes' && parts.length === 4 && parts[2] === 'audios';
      const isShareAudioRoute = parts[0] === 'notes' && parts[1] === 'share' && parts.length === 5 && parts[3] === 'audios';
      if (isLegacyUpload || isPrivateAudioRoute || isShareAudioRoute) {
        return decodeURIComponent(parts.at(-1));
      }
    } catch {}
  }

  return typeof audio?.filename === 'string' ? audio.filename : null;
}

export function getNoteImageEndpoint({ noteId, shareToken, image }) {
  const filename = getNoteImageFilename(image)?.trim();
  if (!filename || filename === '.' || filename === '..' || /[\\/\0]/.test(filename)) return null;

  if (shareToken) {
    return `/notes/share/${encodeURIComponent(shareToken)}/images/${encodeURIComponent(filename)}`;
  }
  if (noteId !== undefined && noteId !== null && String(noteId).length > 0) {
    return `/notes/${encodeURIComponent(noteId)}/images/${encodeURIComponent(filename)}`;
  }
  return null;
}

export function getNoteAudioEndpoint({ noteId, shareToken, audio }) {
  const filename = getNoteAudioFilename(audio)?.trim();
  if (!filename || filename === '.' || filename === '..' || /[\\/\0]/.test(filename)) return null;

  if (shareToken) {
    return `/notes/share/${encodeURIComponent(shareToken)}/audios/${encodeURIComponent(filename)}`;
  }
  if (noteId !== undefined && noteId !== null && String(noteId).length > 0) {
    return `/notes/${encodeURIComponent(noteId)}/audios/${encodeURIComponent(filename)}`;
  }
  return null;
}

export function getInlineImageOrphanIndices(inlineImages, attachmentImages) {
  const ownedFilenames = new Set(
    (Array.isArray(attachmentImages) ? attachmentImages : [])
      .map((image) => getNoteImageFilename(image)?.trim())
      .filter(Boolean),
  );

  return (Array.isArray(inlineImages) ? inlineImages : []).reduce((orphans, image, index) => {
    const filename = getNoteImageFilename(image)?.trim();
    if (!filename || !ownedFilenames.has(filename)) orphans.push(index);
    return orphans;
  }, []);
}

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i;
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|opus|m4a|mp4|aac|webm|flac|3gp|amr)$/i;

function getMediaExtension(file, isAudio = false) {
  const name = file.name || '';
  const match = name.includes('.') ? name.split('.').pop() : '';
  if (match && /^[a-z0-9]+$/i.test(match)) {
    return match.toLowerCase();
  }
  const type = file.type || '';
  if (type) {
    const sub = type.split('/')[1] || '';
    if (sub) {
      if (sub === 'jpeg') return 'jpg';
      if (sub === 'mpeg') return 'mp3';
      return sub.split('+')[0].split(';')[0].toLowerCase();
    }
  }
  return isAudio ? 'mp3' : 'png';
}

function isGenericMediaName(name) {
  if (!name || typeof name !== 'string') return true;
  const clean = name.trim();
  return !clean || /^blob$/i.test(clean) || /^image\.[a-z0-9]+$/i.test(clean) || /^audio\.[a-z0-9]+$/i.test(clean);
}

export function extractClipboardMediaFiles(clipboardData, now = Date.now()) {
  const rawFiles = [];
  if (clipboardData?.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item && item.kind === 'file') {
        const f = typeof item.getAsFile === 'function' ? item.getAsFile() : null;
        if (f) rawFiles.push(f);
      }
    }
  }

  if (rawFiles.length === 0 && clipboardData?.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const f = clipboardData.files[i];
      if (f) rawFiles.push(f);
    }
  }

  const imageFiles = [];
  const audioFiles = [];

  for (const file of rawFiles) {
    const type = file.type || '';
    const name = file.name || '';
    const isImage = type.startsWith('image/') || IMAGE_EXT_RE.test(name);
    const isAudio = type.startsWith('audio/') || AUDIO_EXT_RE.test(name);

    if (isImage) {
      const idx = imageFiles.length;
      if (isGenericMediaName(name)) {
        const ext = getMediaExtension(file, false);
        const uniqueName = `clipboard-image-${now}-${idx}.${ext}`;
        const wrapped = typeof File !== 'undefined'
          ? new File([file], uniqueName, { type: file.type || 'image/png', lastModified: now })
          : file;
        imageFiles.push(wrapped);
      } else {
        imageFiles.push(file);
      }
    } else if (isAudio) {
      const idx = audioFiles.length;
      if (isGenericMediaName(name)) {
        const ext = getMediaExtension(file, true);
        const uniqueName = `clipboard-audio-${now}-${idx}.${ext}`;
        const wrapped = typeof File !== 'undefined'
          ? new File([file], uniqueName, { type: file.type || 'audio/mpeg', lastModified: now })
          : file;
        audioFiles.push(wrapped);
      } else {
        audioFiles.push(file);
      }
    }
  }

  return { imageFiles, audioFiles };
}

