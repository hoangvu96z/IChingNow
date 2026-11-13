import DOMPurify from 'dompurify';

export const ALLOWED_NOTE_ELEMENTS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'mark',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'img',
  'pre',
  'code',
  'hr',
  'a',
  'div',
  'span',
  'label',
  'input',
];

const ALLOWED_NOTE_ELEMENT_SET = new Set(ALLOWED_NOTE_ELEMENTS);
const VOID_ELEMENTS = new Set(['br', 'hr', 'img', 'input']);
const DROP_WITH_CONTENT_ELEMENTS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'noscript',
  'template',
  'textarea',
  'title',
  'head',
]);
const TEXT_ALIGN_ELEMENTS = new Set(['p', 'h1', 'h2', 'h3', 'h4']);

const ALLOWED_NOTE_ATTRIBUTES = [
  'href',
  'name',
  'rel',
  'src',
  'alt',
  'width',
  'height',
  'data-type',
  'data-checked',
  'data-note-inline-image',
  'type',
  'checked',
  'disabled',
  'style',
];

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isSafeLinkHref(href) {
  if (!href) return false;
  const trimmed = String(href).trim();
  if (!trimmed) return false;
  // Strip control characters & whitespace when checking protocol
  // eslint-disable-next-line no-control-regex
  const compact = trimmed.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (
    compact.startsWith('javascript:') ||
    compact.startsWith('vbscript:') ||
    compact.startsWith('data:')
  ) {
    return false;
  }
  return /^(?:https?:\/\/|mailto:|\/|#)/i.test(trimmed);
}

function isSafeImageSrc(src) {
  if (!src) return false;
  const trimmed = String(src).trim();
  if (!trimmed) return false;
  // eslint-disable-next-line no-control-regex
  const compact = trimmed.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
  if (compact.startsWith('javascript:') || compact.startsWith('vbscript:')) {
    return false;
  }
  if (compact.startsWith('data:')) {
    return /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(trimmed);
  }
  return /^(?:https?:\/\/|blob:|\/)/i.test(trimmed);
}

function normalizeSafeStyle(tag, rawStyle) {
  if (!TEXT_ALIGN_ELEMENTS.has(tag) || !rawStyle) return '';
  const match = String(rawStyle).match(/(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i);
  return match ? `text-align: ${match[1].toLowerCase()}` : '';
}

function sanitizeElementAttributesMap(tag, rawAttrs) {
  if (tag === 'input') {
    const inputType = String(rawAttrs.type ?? '').trim().toLowerCase();
    if (inputType !== 'checkbox') return null; // Drop non-checkbox <input> elements completely
    const out = { type: 'checkbox' };
    if ('checked' in rawAttrs && String(rawAttrs.checked).toLowerCase() !== 'false') {
      out.checked = 'checked';
    }
    if ('disabled' in rawAttrs && String(rawAttrs.disabled).toLowerCase() !== 'false') {
      out.disabled = 'disabled';
    }
    return out;
  }

  if (tag === 'ul') {
    const out = {};
    if (rawAttrs['data-type'] === 'taskList') {
      out['data-type'] = 'taskList';
    }
    return out;
  }

  if (tag === 'li') {
    const out = {};
    if (rawAttrs['data-type'] === 'taskItem') {
      out['data-type'] = 'taskItem';
    }
    if (rawAttrs['data-checked'] === 'true' || rawAttrs['data-checked'] === 'false') {
      out['data-checked'] = rawAttrs['data-checked'];
    }
    return out;
  }

  if (tag === 'span') {
    const out = {};
    const inlineIdx = rawAttrs['data-note-inline-image'];
    if (inlineIdx !== undefined && /^\d+$/.test(String(inlineIdx))) {
      out['data-note-inline-image'] = String(inlineIdx);
    }
    return out;
  }

  if (tag === 'a') {
    const out = {};
    if (isSafeLinkHref(rawAttrs.href)) {
      out.href = String(rawAttrs.href).trim();
    }
    if (rawAttrs.name) {
      out.name = String(rawAttrs.name).slice(0, 120);
    }
    if (rawAttrs.rel) {
      out.rel = String(rawAttrs.rel).slice(0, 80);
    }
    return out;
  }

  if (tag === 'img') {
    if (!isSafeImageSrc(rawAttrs.src)) return null;
    const out = { src: String(rawAttrs.src).trim() };
    if (rawAttrs.alt !== undefined && rawAttrs.alt !== '') {
      out.alt = String(rawAttrs.alt);
    }
    if (/^\d{1,4}$/.test(String(rawAttrs.width ?? ''))) {
      out.width = String(rawAttrs.width);
    }
    if (/^\d{1,4}$/.test(String(rawAttrs.height ?? ''))) {
      out.height = String(rawAttrs.height);
    }
    return out;
  }

  if (TEXT_ALIGN_ELEMENTS.has(tag)) {
    const out = {};
    const safeStyle = normalizeSafeStyle(tag, rawAttrs.style);
    if (safeStyle) out.style = safeStyle;
    return out;
  }

  // div, label, formatting tags, lists, code, blockquote, etc.: zero attributes
  return {};
}

function normalizeDomFragment(fragment) {
  const elements = Array.from(fragment.querySelectorAll('*'));
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_NOTE_ELEMENT_SET.has(tag)) {
      el.remove();
      continue;
    }
    const rawAttrs = {};
    for (const attr of Array.from(el.attributes)) {
      rawAttrs[attr.name.toLowerCase()] = attr.value;
    }
    const cleanAttrs = sanitizeElementAttributesMap(tag, rawAttrs);
    if (cleanAttrs === null) {
      el.remove();
      continue;
    }
    for (const attr of Array.from(el.attributes)) {
      el.removeAttribute(attr.name);
    }
    for (const [key, value] of Object.entries(cleanAttrs)) {
      el.setAttribute(key, value);
    }
  }
}

function parseTagAttributesPure(attrSource) {
  const attrs = {};
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRegex.exec(attrSource)) !== null) {
    const name = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[name] = val
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&');
  }
  return attrs;
}

function sanitizeNoteHtmlPure(rawHtml) {
  let input = String(rawHtml || '');
  // Remove HTML comments
  input = input.replace(/<!--[\s\S]*?-->/g, '');
  // Remove dangerous elements together with their content
  for (const blocked of DROP_WITH_CONTENT_ELEMENTS) {
    const blockRe = new RegExp(`<${blocked}\\b[^>]*>[\\s\\S]*?<\\/${blocked}\\s*>`, 'gi');
    input = input.replace(blockRe, '');
  }

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)(\s[^>]*)?\/?>/g;
  const out = [];
  const openStack = [];
  let skipDepth = 0;
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(input)) !== null) {
    const textChunk = input.slice(lastIndex, match.index);
    if (textChunk && skipDepth === 0) {
      out.push(textChunk.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    }
    lastIndex = tagRegex.lastIndex;

    const fullTag = match[0];
    const tag = match[1].toLowerCase();
    const isClosing = fullTag.startsWith('</');
    const isSelfClosing = fullTag.endsWith('/>') || VOID_ELEMENTS.has(tag);

    if (!ALLOWED_NOTE_ELEMENT_SET.has(tag)) {
      if (!VOID_ELEMENTS.has(tag) && !fullTag.endsWith('/>')) {
        if (!isClosing) {
          skipDepth += 1;
        } else if (skipDepth > 0) {
          skipDepth -= 1;
        }
      }
      continue;
    }

    if (skipDepth > 0) continue;

    if (isClosing) {
      if (VOID_ELEMENTS.has(tag)) continue;
      const stackIdx = openStack.lastIndexOf(tag);
      if (stackIdx !== -1) {
        while (openStack.length > stackIdx) {
          const popped = openStack.pop();
          out.push(`</${popped}>`);
        }
      }
      continue;
    }

    const rawAttrs = parseTagAttributesPure(match[2] || '');
    const cleanAttrs = sanitizeElementAttributesMap(tag, rawAttrs);
    if (cleanAttrs === null) {
      continue;
    }

    const attrParts = Object.entries(cleanAttrs).map(
      ([k, v]) => ` ${k}="${escapeAttr(v)}"`,
    );
    out.push(`<${tag}${attrParts.join('')}>`);
    if (!isSelfClosing && !VOID_ELEMENTS.has(tag)) {
      openStack.push(tag);
    }
  }

  const tail = input.slice(lastIndex);
  if (tail && skipDepth === 0) {
    out.push(tail.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  }

  while (openStack.length > 0) {
    out.push(`</${openStack.pop()}>`);
  }

  return out.join('');
}

export function sanitizeNoteContent(html) {
  if (!html) return '';
  if (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof DOMPurify?.sanitize === 'function'
  ) {
    const purified = DOMPurify.sanitize(String(html), {
      ALLOWED_TAGS: [...ALLOWED_NOTE_ELEMENTS, '#text'],
      ALLOWED_ATTR: ALLOWED_NOTE_ATTRIBUTES,
      ALLOW_ARIA_ATTR: false,
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: false,
      FORBID_ATTR: ['target'],
    });
    const template = document.createElement('template');
    template.innerHTML = purified;
    normalizeDomFragment(template.content);
    return template.innerHTML;
  }
  return sanitizeNoteHtmlPure(html);
}

export function extractChecklistProgress(html) {
  if (!html) return { total: 0, completed: 0 };
  const safe = sanitizeNoteContent(html);
  if (!safe) return { total: 0, completed: 0 };

  let total = 0;
  let completed = 0;
  const taskItemRegex = /<li\b([^>]*)>/gi;
  let match;

  while ((match = taskItemRegex.exec(safe)) !== null) {
    const attrs = parseTagAttributesPure(match[1] || '');
    if (attrs['data-type'] !== 'taskItem') continue;
    total += 1;
    if (attrs['data-checked'] === 'true') {
      completed += 1;
    } else if (attrs['data-checked'] === 'false') {
      // Explicitly unchecked
    } else {
      const afterTag = safe.slice(match.index + match[0].length, match.index + match[0].length + 260);
      const labelCheckboxMatch = afterTag.match(/^\s*<label\b[^>]*>\s*<input\b([^>]*)>/i);
      if (labelCheckboxMatch) {
        const inputAttrs = parseTagAttributesPure(labelCheckboxMatch[1] || '');
        if ('checked' in inputAttrs && inputAttrs.checked !== 'false') {
          completed += 1;
        }
      }
    }
  }

  return { total, completed };
}

function parseSafeContent(html) {
  const template = document.createElement('template');
  template.innerHTML = sanitizeNoteContent(html);
  return template;
}

export function getInlineNoteImages(html) {
  if (typeof document === 'undefined') {
    const safe = sanitizeNoteContent(html);
    const results = [];
    const imgRe = /<img\b([^>]*)>/gi;
    let m;
    while ((m = imgRe.exec(safe)) !== null) {
      const attrs = parseTagAttributesPure(m[1] || '');
      results.push({
        url: attrs.src || '',
        alt: attrs.alt || '',
        markup: m[0],
      });
    }
    return results;
  }
  const template = parseSafeContent(html);
  return Array.from(template.content.querySelectorAll('img')).map((image) => ({
    url: image.getAttribute('src') || '',
    alt: image.getAttribute('alt') || '',
    markup: image.outerHTML,
  }));
}

export function contentWithInlineImagePlaceholders(html) {
  if (typeof document === 'undefined') {
    const safe = sanitizeNoteContent(html);
    const images = [];
    const content = safe.replace(/<img\b([^>]*)>/gi, (markup, attrStr) => {
      const attrs = parseTagAttributesPure(attrStr || '');
      const index = images.length;
      images.push({
        url: attrs.src || '',
        alt: attrs.alt || '',
        markup,
      });
      return `<span data-note-inline-image="${index}">Ảnh nội tuyến ${index + 1}</span>`;
    });
    return { content, images };
  }
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
  return (html || '').replace(
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
  if (typeof document === 'undefined') {
    return sanitizeNoteContent(html).replace(
      /<input type="checkbox"([^>]*)>/gi,
      (full, rest) => (/\bdisabled=/.test(rest) ? full : `<input type="checkbox"${rest} disabled="disabled">`),
    );
  }
  const template = parseSafeContent(html);
  // Mark card preview checkboxes disabled so clicking card opens editor cleanly
  template.content.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.setAttribute('disabled', 'disabled');
    checkbox.setAttribute('tabindex', '-1');
  });
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
