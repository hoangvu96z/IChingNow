import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TarotMarkdown from '../src/components/TarotMarkdown.mjs';

function renderMarkdown(markdown, props = {}) {
  return renderToStaticMarkup(
    React.createElement(TarotMarkdown, props, markdown),
  );
}

test('Tarot Markdown renders common headings, emphasis, paragraphs and lists', () => {
  const html = renderMarkdown('# Reading\n\nA **clear** answer.\n\n- First step\n- Second step');

  assert.match(html, /<h1>Reading<\/h1>/);
  assert.match(html, /A <strong>clear<\/strong> answer\./);
  assert.match(html, /<ul>[\s\S]*<li>First step<\/li>[\s\S]*<li>Second step<\/li>[\s\S]*<\/ul>/);
  assert.match(html, /class="tarot-markdown"/);
});

test('Tarot Markdown skips raw HTML and rejects unsafe link protocols', () => {
  const html = renderMarkdown('<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert%281%29)');

  assert.doesNotMatch(html, /<img\b|onerror=/i);
  assert.doesNotMatch(html, /href="javascript:/i);
});
