import { sanitizeNoteContent } from '../safeNoteContent.js';
import { escapeHtml, normalizeNoteTags } from '../../../shared/src/utils/saveToNoteNow.mjs';

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function parseAttributes(attrText) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(attrText || '')) !== null) {
    attrs[m[1].toLowerCase()] = decodeHtmlEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function parseSimpleDomTree(html) {
  const root = { type: 'root', children: [] };
  const stack = [root];
  const voidTags = new Set(['br', 'hr', 'img', 'input']);
  const tokenRe = /(<\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\s[^>]*)?\/?>)|([^<]+)/g;
  let match;

  while ((match = tokenRe.exec(html || '')) !== null) {
    if (match[2] !== undefined) {
      stack[stack.length - 1].children.push({
        type: 'text',
        value: decodeHtmlEntities(match[2]),
      });
      continue;
    }

    const rawTag = match[1];
    const tagMatch = rawTag.match(/^<\/?([a-zA-Z][a-zA-Z0-9:-]*)(\s[\s\S]*?)?\/?>$/);
    if (!tagMatch) continue;
    const tag = tagMatch[1].toLowerCase();
    const isClosing = rawTag.startsWith('</');
    const isSelfClosing = rawTag.endsWith('/>') || voidTags.has(tag);

    if (isClosing) {
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node = {
      type: 'element',
      tag,
      attrs: parseAttributes(tagMatch[2] || ''),
      children: [],
    };
    stack[stack.length - 1].children.push(node);
    if (!isSelfClosing) {
      stack.push(node);
    }
  }

  return root;
}

function findDescendantInputChecked(node) {
  for (const child of node.children || []) {
    if (child.type === 'element') {
      if (child.tag === 'input' && child.attrs.type === 'checkbox') {
        return 'checked' in child.attrs && child.attrs.checked !== 'false';
      }
      if (child.tag === 'label') {
        const inside = findDescendantInputChecked(child);
        if (inside !== null) return inside;
      }
    }
  }
  return null;
}

function serializeNodesToMarkdown(nodes, ctx = { indent: '', inPre: false, inlineOnly: false }) {
  let out = '';

  for (const node of nodes || []) {
    if (node.type === 'text') {
      if (ctx.inPre) {
        out += node.value;
      } else {
        out += node.value.replace(/\s+/g, ' ');
      }
      continue;
    }

    if (node.type !== 'element') continue;
    const { tag, attrs, children } = node;

    if (tag === 'label' || tag === 'input') {
      // TaskItem checkbox UI wrapper — handled at <li data-type="taskItem"> level
      continue;
    }

    if (tag === 'br') {
      out += ctx.inlineOnly ? ' ' : '\n';
      continue;
    }

    if (tag === 'hr') {
      out += '\n\n---\n\n';
      continue;
    }

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
      const level = Number(tag.slice(1));
      const text = serializeNodesToMarkdown(children, { ...ctx, inlineOnly: true }).trim();
      if (text) out += `\n\n${'#'.repeat(level)} ${text}\n\n`;
      continue;
    }

    if (tag === 'strong' || tag === 'b') {
      const inner = serializeNodesToMarkdown(children, { ...ctx, inlineOnly: true }).trim();
      if (inner) out += `**${inner}**`;
      continue;
    }

    if (tag === 'em' || tag === 'i') {
      const inner = serializeNodesToMarkdown(children, { ...ctx, inlineOnly: true }).trim();
      if (inner) out += `*${inner}*`;
      continue;
    }

    if (tag === 's' || tag === 'del' || tag === 'strike') {
      const inner = serializeNodesToMarkdown(children, { ...ctx, inlineOnly: true }).trim();
      if (inner) out += `~~${inner}~~`;
      continue;
    }

    if (tag === 'code' && !ctx.inPre) {
      const inner = serializeNodesToMarkdown(children, { ...ctx, inPre: true, inlineOnly: true });
      if (inner) out += `\`${inner.replace(/`/g, '\\`')}\``;
      continue;
    }

    if (tag === 'pre') {
      const codeEl = children.find((c) => c.type === 'element' && c.tag === 'code');
      const rawCode = serializeNodesToMarkdown(
        codeEl ? codeEl.children : children,
        { ...ctx, inPre: true },
      ).replace(/\n+$/, '');
      out += `\n\n\`\`\`\n${rawCode}\n\`\`\`\n\n`;
      continue;
    }

    if (tag === 'a') {
      const label = serializeNodesToMarkdown(children, { ...ctx, inlineOnly: true }).trim();
      const href = attrs.href || '';
      out += href ? `[${label || href}](${href})` : label;
      continue;
    }

    if (tag === 'img') {
      const src = attrs.src || '';
      const alt = attrs.alt || '';
      if (src) out += `![${alt}](${src})`;
      continue;
    }

    if (tag === 'blockquote') {
      const inner = serializeNodesToMarkdown(children, ctx).trim();
      if (inner) {
        const quoted = inner
          .split('\n')
          .map((line) => (line.trim() ? `> ${line}` : '>'))
          .join('\n');
        out += `\n\n${quoted}\n\n`;
      }
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const isTaskList = tag === 'ul' && attrs['data-type'] === 'taskList';
      const items = children.filter((c) => c.type === 'element' && c.tag === 'li');
      const renderedItems = [];

      items.forEach((li, index) => {
        const isTaskItem = isTaskList || li.attrs['data-type'] === 'taskItem';
        let prefix = `${ctx.indent}- `;
        if (isTaskItem) {
          let checked = false;
          if (li.attrs['data-checked'] === 'true') {
            checked = true;
          } else if (li.attrs['data-checked'] === 'false') {
            checked = false;
          } else {
            checked = Boolean(findDescendantInputChecked(li));
          }
          prefix = `${ctx.indent}- [${checked ? 'x' : ' '}] `;
        } else if (tag === 'ol') {
          prefix = `${ctx.indent}${index + 1}. `;
        }

        // Separate inline/paragraph children from nested lists
        const nestedLists = [];
        const mainParts = [];

        const collectItemParts = (itemChildren) => {
          for (const child of itemChildren) {
            if (child.type === 'element' && (child.tag === 'ul' || child.tag === 'ol')) {
              nestedLists.push(child);
            } else if (child.type === 'element' && child.tag === 'div') {
              collectItemParts(child.children || []);
            } else if (child.type === 'element' && child.tag === 'p') {
              const pText = serializeNodesToMarkdown(child.children, { ...ctx, inlineOnly: true }).trim();
              if (pText) mainParts.push(pText);
            } else if (child.type === 'element' && (child.tag === 'label' || child.tag === 'input')) {
              // skip checkbox wrapper
            } else {
              const part = serializeNodesToMarkdown([child], { ...ctx, inlineOnly: true }).trim();
              if (part) mainParts.push(part);
            }
          }
        };

        collectItemParts(li.children || []);
        let itemLine = `${prefix}${mainParts.join(' ')}`.trimEnd();
        if (nestedLists.length > 0) {
          const nestedMd = serializeNodesToMarkdown(nestedLists, {
            ...ctx,
            indent: `${ctx.indent}  `,
          }).trim();
          if (nestedMd) {
            itemLine += `\n${nestedMd}`;
          }
        }
        renderedItems.push(itemLine);
      });

      if (renderedItems.length > 0) {
        out += ctx.indent
          ? `\n${renderedItems.join('\n')}`
          : `\n\n${renderedItems.join('\n')}\n\n`;
      }
      continue;
    }

    if (tag === 'p') {
      if (ctx.inlineOnly) {
        out += serializeNodesToMarkdown(children, ctx);
      } else {
        const inner = serializeNodesToMarkdown(children, { ...ctx, inlineOnly: true }).trim();
        if (inner) out += `\n\n${inner}\n\n`;
      }
      continue;
    }

    // div, span, mark, u, etc.
    out += serializeNodesToMarkdown(children, ctx);
  }

  return out;
}

export function htmlToMarkdown(html, options = {}) {
  const { title = '', tags = [] } = options;
  const safeHtml = sanitizeNoteContent(html || '');
  const tree = parseSimpleDomTree(safeHtml);
  const bodyMd = serializeNodesToMarkdown(tree.children)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const sections = [];
  const cleanTitle = String(title || '').trim();
  if (cleanTitle) {
    sections.push(`# ${cleanTitle}`);
  }
  if (bodyMd) {
    sections.push(bodyMd);
  }

  const normalizedTags = normalizeNoteTags(tags);
  if (normalizedTags.length > 0) {
    const tagLine = normalizedTags.map((t) => `#${t}`).join(' ');
    if (!bodyMd.endsWith(tagLine)) {
      sections.push(tagLine);
    }
  }

  return sections.join('\n\n').trim();
}

function renderInlineMarkdownToHtml(text) {
  let escaped = escapeHtml(text);
  // Inline code
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links [label](url)
  escaped = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|\/[^\s)]*)\)/gi,
    '<a href="$2">$1</a>',
  );
  // Bold **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Strikethrough ~~text~~
  escaped = escaped.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  // Italic *text*
  escaped = escaped.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  return escaped;
}

export function markdownToHtml(markdown) {
  if (!markdown) return '';
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      htmlBlocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^(?:---|\*\*\*|___)\s*$/.test(line.trim())) {
      htmlBlocks.push('<hr>');
      i += 1;
      continue;
    }

    // Heading # .. ####
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      htmlBlocks.push(`<h${level}>${renderInlineMarkdownToHtml(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line.trim())) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      htmlBlocks.push(
        `<blockquote><p>${quoteLines.map(renderInlineMarkdownToHtml).join('<br>')}</p></blockquote>`,
      );
      continue;
    }

    // Task list - [ ] / - [x]
    if (/^\s*[-+*]\s+\[([ xX])\]\s+/.test(line)) {
      const taskItems = [];
      while (i < lines.length && /^\s*[-+*]\s+\[([ xX])\]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-+*]\s+\[([ xX])\]\s+(.*)$/);
        const checked = m[1].toLowerCase() === 'x';
        const text = renderInlineMarkdownToHtml(m[2].trim());
        taskItems.push(
          `<li data-type="taskItem" data-checked="${checked ? 'true' : 'false'}"><label><input type="checkbox"${checked ? ' checked="checked"' : ''}></label><div><p>${text}</p></div></li>`,
        );
        i += 1;
      }
      htmlBlocks.push(`<ul data-type="taskList">${taskItems.join('')}</ul>`);
      continue;
    }

    // Bullet list
    if (/^\s*[-+*]\s+/.test(line)) {
      const listItems = [];
      while (
        i < lines.length &&
        /^\s*[-+*]\s+/.test(lines[i]) &&
        !/^\s*[-+*]\s+\[([ xX])\]\s+/.test(lines[i])
      ) {
        const text = lines[i].replace(/^\s*[-+*]\s+/, '').trim();
        listItems.push(`<li><p>${renderInlineMarkdownToHtml(text)}</p></li>`);
        i += 1;
      }
      htmlBlocks.push(`<ul>${listItems.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\s*\d+\.\s+/, '').trim();
        listItems.push(`<li><p>${renderInlineMarkdownToHtml(text)}</p></li>`);
        i += 1;
      }
      htmlBlocks.push(`<ol>${listItems.join('')}</ol>`);
      continue;
    }

    // Paragraph
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(?:#{1,4}\s+|```|>\s?|---|\*\*\*|___|\s*[-+*]\s+|\s*\d+\.\s+)/.test(lines[i])
    ) {
      paraLines.push(renderInlineMarkdownToHtml(lines[i].trim()));
      i += 1;
    }
    if (paraLines.length > 0) {
      htmlBlocks.push(`<p>${paraLines.join('<br>')}</p>`);
    }
  }

  return sanitizeNoteContent(htmlBlocks.join(''));
}

export function htmlToPlainText(html, options = {}) {
  const md = htmlToMarkdown(html, options);
  if (!md) return '';
  return md
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1$2')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/^```\n?|\n?```$/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

export function buildExportFilename(title, ext = 'md') {
  const cleanExt = ext === 'txt' ? 'txt' : 'md';
  const slug = String(title || 'ghi-chu-notenow')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slug || 'ghi-chu-notenow'}-${stamp}.${cleanExt}`;
}

export function downloadNoteExport(note, format = 'md') {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return null;
  const isTxt = format === 'txt';
  const payload = isTxt
    ? htmlToPlainText(note?.content || '', { title: note?.title || '', tags: note?.tags || [] })
    : htmlToMarkdown(note?.content || '', { title: note?.title || '', tags: note?.tags || [] });
  const mimeType = isTxt ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8';
  const filename = buildExportFilename(note?.title, isTxt ? 'txt' : 'md');
  const blob = new Blob([payload], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return { filename, content: payload };
}
