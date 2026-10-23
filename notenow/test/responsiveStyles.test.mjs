import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cssPath = path.resolve(import.meta.dirname, '../src/index.css');
const appJsxPath = path.resolve(import.meta.dirname, '../src/App.jsx');

test('NoteNow desktop board layout is centered with container constraints to prevent excessive right blank space', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // .nn-main must have max-width and margin: 0 auto to prevent unconstrained left-aligned layout
  const nnMainMatch = css.match(/\.nn-main\s*\{([^}]+)\}/);
  assert.ok(nnMainMatch, '.nn-main rule must exist');
  const nnMainStyles = nnMainMatch[1];
  assert.match(nnMainStyles, /max-width:\s*(?:1200px|1240px|1280px)/, 'nn-main must constrain max-width on desktop');
  assert.match(nnMainStyles, /margin:\s*0 auto/, 'nn-main must center with margin: 0 auto');
});

test('NoteNow mobile toolbar wraps formatting controls so alignment controls are not clipped', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Within @media (max-width: 640px), .nn-toolbar must use flex-wrap: wrap and not flex-wrap: nowrap
  const mobileMediaMatch = css.match(/@media\s*\(\s*max-width:\s*640px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobileMediaMatch, '@media (max-width: 640px) block must exist');
  const mobileCss = mobileMediaMatch[1];

  const toolbarMatch = mobileCss.match(/\.nn-toolbar\s*\{([^}]+)\}/);
  assert.ok(toolbarMatch, '.nn-toolbar rule must exist inside 640px media query');
  assert.match(toolbarMatch[1], /flex-wrap:\s*wrap/, 'mobile toolbar must wrap so right-side alignment buttons are reachable');
  assert.doesNotMatch(toolbarMatch[1], /flex-wrap:\s*nowrap/, 'mobile toolbar must not use nowrap which causes clipping');
});

test('NoteNow mobile layout provides bottom clearance so content can scroll clear of the FAB', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  const mobileMediaMatch = css.match(/@media\s*\(\s*max-width:\s*640px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobileMediaMatch, '@media (max-width: 640px) block must exist');
  const mobileCss = mobileMediaMatch[1];

  const mainMatch = mobileCss.match(/\.nn-main\s*\{([^}]+)\}/);
  assert.ok(mainMatch, '.nn-main rule must exist inside 640px media query');
  assert.match(mainMatch[1], /padding(?:-bottom)?:\s*[^;]*140px/, 'mobile .nn-main must have at least 140px bottom padding to clear the 56px FAB');
});

test('NoteNow header compacts auth text on mobile to keep logout reachable without horizontal overflow', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const appJsx = fs.readFileSync(appJsxPath, 'utf8');

  // Root & HTML must prevent page-wide horizontal overflow
  assert.match(css, /html\s*\{[^}]*overflow-x:\s*hidden/, 'html must have overflow-x: hidden');
  assert.match(css, /body\s*\{[^}]*overflow-x:\s*hidden/, 'body must have overflow-x: hidden');
  assert.match(css, /#root\s*\{[^}]*overflow-x:\s*hidden/, '#root must have overflow-x: hidden');

  // Auth text & name must be hidden on mobile/tablet to keep logout inside viewport
  assert.match(css, /\.nn-header-actions\s+\.nn-auth-text[\s\S]*?display:\s*none\s*!important/, 'auth text must be hidden on small screens');
  assert.match(css, /#btn-logout/, '#btn-logout must be targeted for responsive compact sizing');

  // App.jsx retains accessible logout attributes
  assert.match(appJsx, /id="btn-logout"/, 'logout button id must be btn-logout');
  assert.match(appJsx, /aria-label=\{t\('header\.logout'/, 'logout button must retain accessible label');
});

test('NoteNow mobile apps dropdown and footer stay constrained and pinned without detached bottom gap', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /#root\s*>\s*footer\s*\{[^}]*margin-top:\s*auto\s*!important/, 'footer must push to bottom of flex root');
  assert.match(css, /\.apps-dropdown-menu\s*\{[^}]*left:\s*8px\s*!important/, 'mobile apps dropdown must keep >= 8px left gutter');
  assert.match(css, /\.apps-dropdown-menu\s*\{[^}]*right:\s*8px\s*!important/, 'mobile apps dropdown must keep >= 8px right gutter');
});

test('NoteNow narrow mobile (320px) compacts editor toolbar and footer controls so all buttons fit without orphan wrap or right overflow', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  const narrowMediaMatch = css.match(/@media\s*\(\s*max-width:\s*360px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(narrowMediaMatch, '@media (max-width: 360px) block must exist');
  const narrowCss = narrowMediaMatch[1];

  assert.match(narrowCss, /\.nn-tb-btn\s*\{[^}]*width:\s*26px/, 'narrow toolbar buttons must compact to 26px so 10 icons fit on one row at 320px');
  assert.match(narrowCss, /\.nn-toolbar\s*\{[^}]*flex-wrap:\s*nowrap/, 'narrow toolbar must use nowrap to prevent orphan icons');
  assert.match(narrowCss, /\.nn-toolbar\s*\{[^}]*overflow-x:\s*auto/, 'narrow toolbar must allow horizontal scrolling when needed');
  assert.match(narrowCss, /\.nn-editor-footer > div:last-child\s*\{[^}]*flex-wrap:\s*nowrap\s*!important/, 'footer action container must not wrap controls');
  assert.match(narrowCss, /\.nn-editor-footer\s+\.btn:not\(\.btn-icon\)/, 'narrow editor footer action buttons must compact padding/font-size at 320px');
});
