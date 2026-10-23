import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cssPath = path.resolve(import.meta.dirname, '../src/index.css');

test('Tarot three-card spread scales up on desktop and mobile while keeping compact sizing for non-row spreads', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Desktop 3-card grid layout and featured card sizing
  assert.match(css, /\.spread-row-layout\.spread-row-count-3\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*210px\)\)/, 'desktop 3-card spread must use 3-column grid');
  assert.match(css, /\.spread-card-slot--featured\s+\.spread-card-visual\s*\{[^}]*width:\s*146px/, 'featured card visual must scale up on desktop');
  assert.match(css, /\.spread-card-slot--featured\s+\.spread-card-pos-label\s*\{[^}]*font-size:\s*12\.5px/, 'featured position label must scale up on desktop');

  // Compact non-row spreads retain compact sizing
  assert.match(css, /\.spread-card-slot--compact\s+\.spread-card-visual\s*\{[^}]*width:\s*52px/, 'non-row compact spreads must keep 52px width');
  assert.match(css, /\.spread-card-slot--compact\s+\.spread-card-pos-label\s*\{[^}]*font-size:\s*9px/, 'non-row compact spreads must keep 9px label');

  // Mobile 3-card scaling
  const mobile640Match = css.match(/@media\s*\(\s*max-width:\s*640px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobile640Match, '@media (max-width: 640px) block must exist');
  const mobile640Css = mobile640Match[1];
  assert.match(mobile640Css, /\.spread-row-layout\.spread-row-count-3\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/, 'mobile 3-card spread must fit 3 columns in one row');
  assert.match(mobile640Css, /\.spread-card-slot--featured\s+\.spread-card-visual\s*\{[^}]*max-width:\s*96px/, 'mobile featured card visual must scale to 96px');

  // 320px / 380px narrow mobile scaling without overflow
  const mobile380Match = css.match(/@media\s*\(\s*max-width:\s*380px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobile380Match, '@media (max-width: 380px) block must exist');
  const mobile380Css = mobile380Match[1];
  assert.match(mobile380Css, /\.spread-card-slot--featured\s+\.spread-card-visual\s*\{[^}]*max-width:\s*82px/, 'narrow mobile featured card visual must fit within 82px');
  assert.match(mobile380Css, /\.spread-card-slot--featured\s+\.spread-card-pos-label\s*\{[^}]*font-size:\s*10\.5px/, 'narrow mobile position label must be readable at 10.5px');
});

test('Tarot AI interpretation panel at <=380px gives full row to title and forms usable row for quota/settings without narrow wrapping', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  const mobile380Match = css.match(/@media\s*\(\s*max-width:\s*380px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobile380Match, '@media (max-width: 380px) block must exist');
  const mobile380Css = mobile380Match[1];

  assert.match(mobile380Css, /\.ai-panel-header\s*\{[^}]*flex-direction:\s*column\s*!important/, 'ai-panel-header must stack vertically into title and controls rows');
  assert.match(mobile380Css, /\.ai-panel-title-group\s*\{[^}]*width:\s*100%\s*!important/, 'ai title group must take full row');
  assert.match(mobile380Css, /\.ai-panel-controls\s*\{[^}]*flex-wrap:\s*nowrap\s*!important/, 'ai controls must not wrap into narrow columns');
  assert.match(mobile380Css, /\.ai-panel-controls\s*\{[^}]*justify-content:\s*space-between\s*!important/, 'ai controls must form a usable spaced row');
  assert.match(mobile380Css, /\.ai-quota-badge\s*\{[^}]*white-space:\s*nowrap\s*!important/, 'quota badge must remain unbroken on narrow screens');
});

test('Tarot detailed per-card explanation at <=390px reflows name, position descriptor, and badge consistently', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Desktop default
  assert.match(css, /\.card-detail-header\s*\{[^}]*display:\s*flex/, 'card detail header has flex layout by default');

  // Mobile <=390px consistent grid reflow
  const mobile390Match = css.match(/@media\s*\(\s*max-width:\s*390px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobile390Match, '@media (max-width: 390px) block must exist');
  const mobile390Css = mobile390Match[1];

  assert.match(mobile390Css, /\.card-detail-header\s*\{[^}]*display:\s*grid/i, 'card detail header must use grid at <=390px');
  assert.match(mobile390Css, /\.card-detail-header\s*\{[^}]*grid-template-areas:[^}]*"name badge"[^}]*"pos pos"/i, 'grid areas must place name and badge on line 1 and position on line 2');
  assert.match(mobile390Css, /\.card-detail-name\s*\{[^}]*grid-area:\s*name/i, 'card name maps to name grid area');
  assert.match(mobile390Css, /\.card-detail-badge\s*\{[^}]*grid-area:\s*badge/i, 'orientation badge maps to badge grid area');
  assert.match(mobile390Css, /\.card-detail-pos\s*\{[^}]*grid-area:\s*pos/i, 'position label maps to pos grid area');
});

test('Tarot AI action button does not include low-contrast decorative sparkle icon', () => {
  const aiPanelPath = path.resolve(import.meta.dirname, '../src/components/AiInterpretationPanel.jsx');
  const source = fs.readFileSync(aiPanelPath, 'utf8');
  assert.doesNotMatch(source, /<span>✨<\/span>\s*\{t\('ai\.button_cast_tarot'/, 'AI action button must not have decorative sparkle icon');
});
