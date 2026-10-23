import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { vi } from '../src/data/translations/vi.js';
import { en } from '../src/data/translations/en.js';

function relativeLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const [rL, gL, bL] = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

test('IChing placeholder styling uses lighter muted brown with >=4.5:1 contrast against input background', () => {
  const cssPath = path.resolve(import.meta.dirname, '../src/index.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const placeholderMatch = css.match(/\.form-input::placeholder[\s\S]+?color:\s*(#[0-9a-fA-F]{6})/);
  assert.ok(placeholderMatch, 'Placeholder color rule must exist');

  const placeholderHex = placeholderMatch[1].toLowerCase();
  assert.notEqual(placeholderHex, '#615042', 'Must replace #615042 with a lighter muted brown');

  // Input background inside .card over parchment: #fefdfb (or #ffffff on pure white surface)
  const actualInputBg = '#fefdfb';
  const contrast = contrastRatio(placeholderHex, actualInputBg);
  assert.ok(contrast >= 4.5, `Contrast against input background (${contrast.toFixed(2)}:1) must be >= 4.5:1`);

  // Visually distinct from entered text #2c1810
  const typedTextColor = '#2c1810';
  const typedTextLuminance = relativeLuminance(typedTextColor);
  const placeholderLuminance = relativeLuminance(placeholderHex);
  assert.ok(
    placeholderLuminance > typedTextLuminance * 3,
    `Placeholder luminance (${placeholderLuminance}) must be noticeably lighter than typed text (${typedTextLuminance})`
  );
});

test('IChing footer tagline does not start any wrapped line with a separator and preserves clean punctuation', () => {
  for (const [lang, dict] of [['vi', vi], ['en', en]]) {
    const text = dict['footer.text'];
    assert.doesNotMatch(text, /·/, `footer.text in ${lang} must not use middle dot separator`);
    assert.doesNotMatch(text, /(?:^|\n)\s*[·•\-–—]\s*/, `No line should begin with a separator in ${lang}`);
    assert.match(text, /\.\s+/, `Sentences in ${lang} should be separated cleanly by punctuation`);
  }
});
