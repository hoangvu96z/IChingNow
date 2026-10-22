import DOMPurify from 'dompurify';

export function sanitizeNoteContent(html) {
  return DOMPurify.sanitize(html || '', { FORBID_ATTR: ['target'] });
}

function parseSafeContent(html) {
  const template = document.createElement('template');
  template.innerHTML = sanitizeNoteContent(html);
  return template;
}

export function getInlineNoteImages(html) {
  const template = parseSafeContent(html);
  return Array.from(template.content.querySelectorAll('img')).map((image) => ({
    url: image.getAttribute('src') || '',
    alt: image.getAttribute('alt') || '',
    markup: image.outerHTML,
  }));
}

export function contentWithInlineImagePlaceholders(html) {
  const template = parseSafeContent(html);
  const images = Array.from(template.content.querySelectorAll('img')).map((image, index) => {
    const record = {
      url: image.getAttribute('src') || '',
      alt: image.getAttribute('alt') || '',
      markup: image.outerHTML,
    };
    const placeholder = document.createElement('span');
    placeholder.setAttribute('data-note-inline-image', String(index));
    placeholder.textContent = `Ảnh nội tuyến ${index + 1}`;
    image.replaceWith(placeholder);
    return record;
  });
  return { content: template.innerHTML, images };
}

export function replaceInlineImagePlaceholders(html, images) {
  return html.replace(
    /<span\b[^>]*\bdata-note-inline-image=["']?(\d+)["']?[^>]*>[\s\S]*?<\/span>/gi,
    (placeholder, indexText) => images[Number(indexText)]?.markup || placeholder,
  );
}

export function hasInlineImagePlaceholder(html, index) {
  const safeIndex = Number(index);
  return Number.isInteger(safeIndex)
    && new RegExp(`\\bdata-note-inline-image=["']?${safeIndex}["']?(?=\\s|>)`, 'i').test(html || '');
}

export function contentWithPreservedInlineImages(html, images) {
  return sanitizeNoteContent(replaceInlineImagePlaceholders(sanitizeNoteContent(html), images));
}

export function contentWithProtectedImageSources(html, imageSources, sourceOffset = 0, loading = false) {
  const template = parseSafeContent(html);
  const inlineImages = template.content.querySelectorAll('img');
  inlineImages.forEach((image, index) => {
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    const source = imageSources[sourceOffset + index];
    if (source) {
      image.setAttribute('src', source);
      return;
    }

    const status = document.createElement('span');
    status.className = 'nn-note-inline-image-status';
    status.setAttribute('role', 'status');
    status.textContent = loading ? 'Đang tải ảnh…' : 'Không tải được ảnh';
    image.replaceWith(status);
  });
  return template.innerHTML;
}
