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

test('NoteNow mobile navigation <= 768px hides desktop action icons and provides an accessible hamburger button', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  const appJsx = fs.readFileSync(appJsxPath, 'utf8');

  // Within @media (max-width: 768px), desktop action icons are hidden and hamburger is shown
  const mobileMediaMatch = css.match(/@media\s*\(\s*max-width:\s*768px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobileMediaMatch, '@media (max-width: 768px) block must exist');
  const mobileCss = mobileMediaMatch[1];

  assert.match(mobileCss, /\.nn-desktop-actions\s*\{[^}]*display:\s*none\s*!important/, 'desktop actions must be hidden on mobile <= 768px');
  assert.match(mobileCss, /\.nn-mobile-hamburger\s*\{[^}]*display:\s*inline-flex\s*!important/, 'hamburger button must be displayed on mobile <= 768px');

  // App.jsx retains accessible hamburger button attributes
  assert.match(appJsx, /id="btn-mobile-menu"/, 'hamburger button id must be btn-mobile-menu');
  assert.match(appJsx, /aria-expanded=\{drawerOpen\}/, 'hamburger button must reflect drawerOpen state');
  assert.match(appJsx, /aria-controls="nn-mobile-drawer"/, 'hamburger button must point to drawer container');
  assert.match(appJsx, /<NoteNavDrawer\s+isOpen=\{drawerOpen\}/, 'App.jsx must render NoteNavDrawer with drawerOpen');
});

test('NoteNow preserves readable wordmark at narrow mobile widths (320px-390px)', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Narrow mobile media queries must NOT hide the NoteNow wordmark container
  assert.doesNotMatch(css, /\.nn-logo\s*>\s*div:last-child\s*\{[^}]*display:\s*none/, 'narrow mobile must not hide the NoteNow wordmark');

  // .nn-logo-text must remain styled and visible
  const narrowMediaMatch = css.match(/@media\s*\(\s*max-width:\s*340px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(narrowMediaMatch, '@media (max-width: 340px) block must exist');
  assert.match(narrowMediaMatch[1], /\.nn-logo-text\s*\{[^}]*display:\s*block\s*!important/, 'logo text must be forced visible at 320px-340px');
});

test('NoteNow NoteNavDrawer component provides app picker, language, help, theme, and login/logout with dismissal', () => {
  const drawerPath = path.resolve(import.meta.dirname, '../src/components/NoteNavDrawer.jsx');
  const drawerCode = fs.readFileSync(drawerPath, 'utf8');

  // Must provide app picker with ecosystem apps
  assert.match(drawerCode, /APPS\.map/, 'drawer must render list of ecosystem apps');
  assert.match(drawerCode, /id:\s*'spiritnow'/, 'apps list includes SpiritNow');
  assert.match(drawerCode, /id:\s*'notenow'/, 'apps list includes NoteNow');

  // Must provide auth / login / logout
  assert.match(drawerCode, /ssoApi\.getLoginUrl\(\)/, 'drawer must provide login URL');
  assert.match(drawerCode, /id="btn-drawer-logout"/, 'drawer must have logout action');

  // Must provide help, theme, and language
  assert.match(drawerCode, /id="btn-drawer-help"/, 'drawer must have help action');
  assert.match(drawerCode, /id="btn-drawer-theme"/, 'drawer must have theme toggle action');
  assert.match(drawerCode, /id="btn-drawer-lang"/, 'drawer must have language toggle action');

  // Must close on Escape and backdrop
  assert.match(drawerCode, /e\.key\s*===\s*'Escape'/, 'drawer must listen for Escape key');
  assert.match(drawerCode, /className="nn-drawer-backdrop"[\s\S]*?onClick=\{onClose\}/, 'backdrop must trigger onClose');

  // Must have accessible dialog semantics
  assert.match(drawerCode, /role="dialog"/, 'drawer container must have role="dialog"');
  assert.match(drawerCode, /aria-modal="true"/, 'drawer container must have aria-modal="true"');
});

test('NoteNow mobile drawer aligns exactly under header at 320px, 390px, 641px, and 768px without overlap or gap', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Baseline mobile drawer top must be 60px to align under 60px header at 641px - 768px
  assert.match(css, /\.nn-mobile-drawer\s*\{[^}]*top:\s*60px/, 'drawer base top must be 60px matching 60px header');

  // Mobile media query (<= 640px) must adjust drawer top to 52px matching 52px header at 320px - 390px
  const mobileMediaMatch = css.match(/@media\s*\(\s*max-width:\s*640px\s*\)\s*\{([\s\S]+?)\n\}/);
  assert.ok(mobileMediaMatch, '@media (max-width: 640px) block must exist');
  const mobileCss = mobileMediaMatch[1];
  assert.match(mobileCss, /\.nn-mobile-drawer\s*\{[^}]*top:\s*52px/, 'drawer top must be 52px at <= 640px matching mobile header');
});

test('NoteNow mobile drawer traps Tab and Shift+Tab focus inside dialog and cycles at ends and from container', () => {
  const drawerPath = path.resolve(import.meta.dirname, '../src/components/NoteNavDrawer.jsx');
  const drawerCode = fs.readFileSync(drawerPath, 'utf8');

  // Must trap Tab key
  assert.match(drawerCode, /e\.key\s*===\s*'Tab'/, 'drawer must handle Tab keydown');
  assert.match(drawerCode, /drawer\.querySelectorAll/, 'drawer must query focusable elements inside');

  // Must cycle focus when focus is on container itself
  assert.match(drawerCode, /active\s*===\s*drawer/, 'drawer must handle focus on container itself');

  // Must cycle at the ends
  assert.match(drawerCode, /active\s*===\s*first/, 'drawer must cycle to last when Shift+Tab on first');
  assert.match(drawerCode, /active\s*===\s*last/, 'drawer must cycle to first when Tab on last');
});

test('NoteNow navigation stacking order: header and hamburger remain above drawer backdrop', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Extract z-index values
  const headerMatch = css.match(/\.nn-header\s*\{[^}]*z-index:\s*(\d+)/);
  const backdropMatch = css.match(/\.nn-drawer-backdrop\s*\{[^}]*z-index:\s*(\d+)/);
  const drawerMatch = css.match(/\.nn-mobile-drawer\s*\{[^}]*z-index:\s*(\d+)/);

  assert.ok(headerMatch, '.nn-header must specify z-index');
  assert.ok(backdropMatch, '.nn-drawer-backdrop must specify z-index');
  assert.ok(drawerMatch, '.nn-mobile-drawer must specify z-index');

  const headerZIndex = parseInt(headerMatch[1], 10);
  const backdropZIndex = parseInt(backdropMatch[1], 10);
  const drawerZIndex = parseInt(drawerMatch[1], 10);

  // Header must be above backdrop so hamburger and brand remain directly clickable and clear
  assert.ok(
    headerZIndex > backdropZIndex,
    `header z-index (${headerZIndex}) must be higher than drawer backdrop z-index (${backdropZIndex})`
  );
  // Drawer sits above backdrop
  assert.ok(
    drawerZIndex > backdropZIndex,
    `drawer z-index (${drawerZIndex}) must be higher than backdrop z-index (${backdropZIndex})`
  );
});
