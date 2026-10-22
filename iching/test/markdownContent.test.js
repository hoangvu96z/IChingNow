import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MarkdownContent from '../src/components/MarkdownContent.mjs';

test('renders common Markdown structure and keeps raw HTML and unsafe links inert', () => {
  const html = renderToStaticMarkup(React.createElement(MarkdownContent, {
  }, '# Luận giải\n\n- **Căn cứ** quan trọng\n\n[xem thêm](javascript:alert(1))\n\n<script>alert(1)</script>'));

  assert.match(html, /<h2[^>]*>Luận giải<\/h2>/);
  assert.match(html, /<ul[^>]*>[\s\S]*<li[^>]*>[\s\S]*<strong[^>]*>Căn cứ<\/strong>/);
  assert.doesNotMatch(html, /<script|href="javascript:/i);
});

test('returns an empty Markdown view for non-string input', () => {
  const html = renderToStaticMarkup(React.createElement(MarkdownContent, {
  }, { unexpected: 'object' }));

  assert.equal(html, '');
});
