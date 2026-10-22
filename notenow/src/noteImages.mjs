export function getLocalNoteImageSource(image) {
  const url = image?.url;
  return typeof url === 'string' && (/^data:image\//i.test(url) || url.startsWith('blob:'))
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
