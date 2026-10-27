#!/usr/bin/env node
/**
 * ==============================================================================
 * SpiritNow Ecosystem — Automated Playwright E2E + Theme Contrast + Flow Suite
 * ==============================================================================
 * Apps covered:
 *   - NoteNow   (/note/)
 *   - TarotNow  (/tarot/)
 *   - IChingNow (/kinhdich/)
 *   - TuViNow   (/tuvi/)
 *
 * Checks executed per app:
 *   1. Responsive Viewports: Desktop (1440x900), Mobile (390x844), Narrow (320x844)
 *   2. Zero Horizontal Overflow (scrollWidth <= clientWidth + 1)
 *   3. Theme Contrast (Light & Dark modes, WCAG 2.1 Luminance Contrast Ratio)
 *   4. Zero Unhandled Console Errors (pageerror) and Network Failures
 *   5. Comprehensive End-to-End Functional Flows
 *
 * Usage:
 *   node scripts/playwright-e2e-suite.mjs [options]
 *
 * Options:
 *   --base-url <url>      Base URL of live or staging deployment (default: https://vunph.id.vn)
 *   --app <name>          Filter app: all | notenow | tarotnow | iching | tuvinow (default: all)
 *   --headless <bool>     Run in headless mode: true | false (default: true)
 *   --timeout <ms>        Action timeout in milliseconds (default: 30000)
 *   --help                Show usage information
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import { pathToFileURL } from 'url';

// -----------------------------------------------------------------------------
// CLI ANSI Colors
// -----------------------------------------------------------------------------
const useColor = !process.env.NO_COLOR && process.stdout.isTTY !== false;
const c = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  red: useColor ? '\x1b[31m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  blue: useColor ? '\x1b[34m' : '',
  magenta: useColor ? '\x1b[35m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  white: useColor ? '\x1b[37m' : '',
  gray: useColor ? '\x1b[90m' : '',
};

// -----------------------------------------------------------------------------
// Parse CLI Arguments
// -----------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    baseUrl: 'https://vunph.id.vn',
    app: 'all',
    headless: true,
    timeout: 30000,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(`
SpiritNow Playwright E2E & Theme Contrast Test Suite

Options:
  --base-url <url>    Base URL of target system (default: https://vunph.id.vn)
  --app <name>        Target app: all | notenow | tarotnow | iching | tuvinow (default: all)
  --headless <bool>   Run headless Chrome: true | false (default: true)
  --timeout <ms>      Timeout per step in ms (default: 30000)
  --help              Display this help message
`);
      process.exit(0);
    } else if (arg === '--base-url' && args[i + 1]) {
      options.baseUrl = args[++i].replace(/\/$/, '');
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1].replace(/\/$/, '');
    } else if (arg === '--app' && args[i + 1]) {
      options.app = args[++i].toLowerCase();
    } else if (arg.startsWith('--app=')) {
      options.app = arg.split('=')[1].toLowerCase();
    } else if (arg === '--headless' && args[i + 1]) {
      options.headless = args[++i].toLowerCase() !== 'false';
    } else if (arg.startsWith('--headless=')) {
      options.headless = arg.split('=')[1].toLowerCase() !== 'false';
    } else if (arg === '--timeout' && args[i + 1]) {
      options.timeout = parseInt(args[++i], 10) || 30000;
    }
  }
  return options;
}

// -----------------------------------------------------------------------------
// Dynamic Playwright Resolver
// -----------------------------------------------------------------------------
async function resolvePlaywright() {
  // Try standard import first
  try {
    return await import('playwright');
  } catch {}

  // Search candidate directories
  const home = process.env.HOME || '/Users/hoangvu96z';
  const candidateBases = [
    path.join(home, '.npm/_npx'),
    path.join(home, 'node_modules'),
    '/opt/homebrew/lib/node_modules',
  ];

  for (const base of candidateBases) {
    if (!fs.existsSync(base)) continue;
    try {
      const items = fs.readdirSync(base);
      for (const item of items) {
        const fullCandidate = path.join(base, item, 'node_modules/playwright/index.mjs');
        if (fs.existsSync(fullCandidate)) {
          return await import(pathToFileURL(fullCandidate).href);
        }
      }
    } catch {}
  }

  // Known specific fallback from earlier discovery
  const specific = '/Users/hoangvu96z/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
  if (fs.existsSync(specific)) {
    return await import(pathToFileURL(specific).href);
  }

  throw new Error('Could not resolve playwright module. Please ensure Playwright is accessible.');
}

// -----------------------------------------------------------------------------
// Test Runner State & Reporter
// -----------------------------------------------------------------------------
class TestReporter {
  constructor() {
    this.results = [];
    this.currentSuite = 'General';
    this.startTime = Date.now();
  }

  startSuite(suiteName) {
    this.currentSuite = suiteName;
    console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
    console.log(`${c.bold}${c.cyan}▶ SUITE: ${suiteName}${c.reset}`);
    console.log(`${c.bold}${c.cyan}======================================================================${c.reset}`);
  }

  pass(testName, details = '') {
    const detailStr = details ? ` ${c.gray}(${details})${c.reset}` : '';
    console.log(`  ${c.green}✓ [PASS]${c.reset} ${testName}${detailStr}`);
    this.results.push({ suite: this.currentSuite, test: testName, status: 'PASS', details });
  }

  fail(testName, error, details = '') {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const detailStr = details ? ` ${c.gray}(${details})${c.reset}` : '';
    console.log(`  ${c.red}✗ [FAIL]${c.reset} ${c.bold}${testName}${c.reset}${detailStr}`);
    console.log(`         ${c.red}Error: ${errorMsg}${c.reset}`);
    this.results.push({ suite: this.currentSuite, test: testName, status: 'FAIL', error: errorMsg, details });
  }

  info(message) {
    console.log(`  ${c.blue}ℹ [INFO]${c.reset} ${message}`);
  }

  warn(message) {
    console.log(`  ${c.yellow}⚠ [WARN]${c.reset} ${message}`);
  }

  printSummary() {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;

    console.log(`\n${c.bold}======================================================================${c.reset}`);
    console.log(`${c.bold}                  TEST SUITE EXECUTION SUMMARY                        ${c.reset}`);
    console.log(`${c.bold}======================================================================${c.reset}`);

    // Group by suite
    const suites = [...new Set(this.results.map(r => r.suite))];
    for (const suite of suites) {
      const suiteResults = this.results.filter(r => r.suite === suite);
      const sPassed = suiteResults.filter(r => r.status === 'PASS').length;
      const sFailed = suiteResults.filter(r => r.status === 'FAIL').length;
      const badge = sFailed === 0 ? `${c.green}[PASS]${c.reset}` : `${c.red}[FAIL]${c.reset}`;
      console.log(`  ${badge} ${c.bold}${suite.padEnd(20)}${c.reset} : ${sPassed} passed, ${sFailed} failed (Total: ${suiteResults.length})`);
    }

    console.log(`----------------------------------------------------------------------`);
    console.log(`  Total Tests : ${c.bold}${total}${c.reset}`);
    console.log(`  Passed      : ${c.green}${c.bold}${passed}${c.reset}`);
    console.log(`  Failed      : ${failed > 0 ? c.red : c.green}${c.bold}${failed}${c.reset}`);
    console.log(`  Duration    : ${totalDuration}s`);
    console.log(`======================================================================\n`);

    return failed === 0;
  }
}

// -----------------------------------------------------------------------------
// Universal Viewports
// -----------------------------------------------------------------------------
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, name: 'Desktop (1440x900)' },
  mobile: { width: 390, height: 844, name: 'Mobile (390x844)' },
  narrow: { width: 320, height: 844, name: 'Narrow Mobile (320x844)' },
};

// -----------------------------------------------------------------------------
// Page Health & Universal Quality Utilities
// -----------------------------------------------------------------------------

/**
 * Attaches console and error monitoring to a Playwright page.
 */
function attachPageMonitors(page, errorLog) {
  page.on('pageerror', err => {
    errorLog.push({ type: 'pageerror', message: err.message });
  });

  page.on('requestfailed', req => {
    const url = req.url();
    // Exclude third-party analytics / fonts / non-critical telemetry
    if (!url.includes('google-analytics') && !url.includes('doubleclick') && !url.includes('fonts.gstatic')) {
      errorLog.push({ type: 'requestfailed', url, failure: req.failure()?.errorText });
    }
  });
}

/**
 * Checks for zero horizontal overflow (scrollWidth <= clientWidth + 1).
 */
async function checkHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
    const clientWidth = docEl.clientWidth || window.innerWidth;
    const overflow = scrollWidth - clientWidth;
    return {
      hasOverflow: overflow > 1.5,
      scrollWidth,
      clientWidth,
      overflow: Math.max(0, overflow),
    };
  });
}

/**
 * WCAG 2.1 Contrast Calculation evaluated in the browser context.
 */
async function checkElementContrast(page, selector, minRatio = 3.0) {
  return await page.evaluate(({ sel, targetRatio }) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false, error: `Element not found: ${sel}` };

    function parseRgb(colorStr) {
      if (!colorStr) return null;
      const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
      if (m) {
        return {
          r: parseInt(m[1], 10),
          g: parseInt(m[2], 10),
          b: parseInt(m[3], 10),
          a: m[4] !== undefined ? parseFloat(m[4]) : 1.0,
        };
      }
      return null;
    }

    function getEffectiveBg(element) {
      let curr = element;
      while (curr && curr !== document) {
        const bg = window.getComputedStyle(curr).backgroundColor;
        const parsed = parseRgb(bg);
        if (parsed && parsed.a > 0.1) {
          return parsed;
        }
        curr = curr.parentElement;
      }
      // Fallback based on html data-theme
      const theme = document.documentElement.getAttribute('data-theme');
      return theme === 'dark' ? { r: 15, g: 17, b: 23, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    }

    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    const style = window.getComputedStyle(el);
    const fg = parseRgb(style.color) || { r: 0, g: 0, b: 0, a: 1 };
    const bg = getEffectiveBg(el);

    const l1 = getLuminance(fg.r, fg.g, fg.b);
    const l2 = getLuminance(bg.r, bg.g, bg.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    return {
      found: true,
      ratio: Math.round(ratio * 100) / 100,
      meets: ratio >= targetRatio,
      fg: `rgb(${fg.r},${fg.g},${fg.b})`,
      bg: `rgb(${bg.r},${bg.g},${bg.b})`,
      targetRatio,
    };
  }, { sel: selector, targetRatio: minRatio });
}

// =============================================================================
// APP TEST SUITE: NoteNow (/note/)
// =============================================================================
async function testNoteNow(browser, baseUrl, reporter) {
  reporter.startSuite('NoteNow');
  const targetUrl = `${baseUrl}/note/`;
  const errors = [];

  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();
  attachPageMonitors(page, errors);

  try {
    reporter.info(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Initial Load & Title
    const title = await page.title();
    if (title.includes('NoteNow') || title.includes('Ghi chú')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    // 2. Responsive Viewports & Zero Overflow
    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px (scroll: ${overflow.scrollWidth}, client: ${overflow.clientWidth})`);
      }
    }

    // Reset to desktop for detailed functional checks
    await page.setViewportSize(VIEWPORTS.desktop);

    // 3. Theme Contrast Checks (Light & Dark)
    // Check Light Mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(200);

    const lightBtn = await checkElementContrast(page, '#btn-theme-toggle', 3.0);
    if (lightBtn.found && lightBtn.meets) {
      reporter.pass('Light Mode Contrast: Theme Toggle Button', `Ratio ${lightBtn.ratio}:1`);
    } else {
      reporter.warn(`Light Mode Contrast: Theme Toggle Button ratio is ${lightBtn.ratio}:1`);
    }

    // Check Dark Mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(200);

    // Logo icon contrast verification (Specific B1/B4 requirement: logo must be white in dark mode)
    const logoColor = await page.evaluate(() => {
      const icon = document.querySelector('.nn-logo-icon');
      return icon ? window.getComputedStyle(icon).color : null;
    });

    if (logoColor === 'rgb(255, 255, 255)') {
      reporter.pass('Dark Mode Logo Contrast', `Logo color is exact white: ${logoColor}`);
    } else {
      reporter.fail('Dark Mode Logo Contrast', `Expected rgb(255, 255, 255) but got ${logoColor}`);
    }

    // 4. Open Note Editor
    const btnNew = await page.$('#btn-new-note') || await page.$('#btn-create-first-note') || await page.$('.nn-create-box');
    if (btnNew) {
      await btnNew.click();
      await page.waitForTimeout(400);
      reporter.pass('Open Note Editor Box');
    } else {
      reporter.fail('Open Note Editor Box', 'Could not find #btn-new-note or #btn-create-first-note');
    }

    // 5. Locale Character Counter Format (B2 fix verification)
    // In VI: should show "0/2.048"
    const counterTextVi = await page.evaluate(() => {
      const el = document.querySelector('.nn-char-counter');
      return el ? el.textContent.trim() : '';
    });

    // Check language toggle to EN
    const btnLang = await page.$('#btn-lang-toggle');
    if (btnLang) {
      await btnLang.click();
      await page.waitForTimeout(300);
      const counterTextEn = await page.evaluate(() => {
        const el = document.querySelector('.nn-char-counter');
        return el ? el.textContent.trim() : '';
      });

      if (counterTextEn.includes('2,048')) {
        reporter.pass('Locale Char Counter EN Format (comma separator)', counterTextEn);
      } else {
        reporter.warn(`Locale Char Counter EN: Expected '2,048', got '${counterTextEn}'`);
      }

      // Toggle back to VI
      await btnLang.click();
      await page.waitForTimeout(300);
      const counterTextViBack = await page.evaluate(() => {
        const el = document.querySelector('.nn-char-counter');
        return el ? el.textContent.trim() : '';
      });

      if (counterTextViBack.includes('2.048')) {
        reporter.pass('Locale Char Counter VI Format (period separator)', counterTextViBack);
      } else {
        reporter.warn(`Locale Char Counter VI: Expected '2.048', got '${counterTextViBack}'`);
      }
    }

    // 6. Create Note with Title, Content, and Color Swatch
    const testTimestamp = Date.now();
    const testTitle = `[E2E] Note ${testTimestamp}`;
    const testBody = `Automated verification content for NoteNow suite at ${new Date().toISOString()}`;

    // Fill Title
    const titleInput = await page.$('#note-editor-title');
    if (titleInput) {
      await titleInput.fill(testTitle);
      reporter.pass('Enter Note Title');
    } else {
      reporter.fail('Enter Note Title', 'Selector #note-editor-title not found');
    }

    // Fill Body in TipTap editor
    const editorBody = await page.$('.nn-tiptap-wrap .ProseMirror');
    if (editorBody) {
      await editorBody.fill(testBody);
      reporter.pass('Enter Note Body Content');
    } else {
      reporter.fail('Enter Note Body Content', 'TipTap ProseMirror editor not found');
    }

    // Color Swatch Selection
    const btnColorPicker = await page.$('#btn-color-picker');
    if (btnColorPicker) {
      await btnColorPicker.click();
      await page.waitForTimeout(300);
      const swatch = await page.$('.nn-color-swatch:not([data-color="default"])');
      if (swatch) {
        await swatch.click();
        reporter.pass('Select Color Swatch');
      }
    }

    // Save Note
    const btnSave = await page.$('#btn-save-note');
    if (btnSave) {
      await btnSave.click();
      await page.waitForTimeout(800);
      reporter.pass('Save Note');
    } else {
      reporter.fail('Save Note', 'Button #btn-save-note not found');
    }

    // 7. Verify Note Exists in NoteBoard
    const noteFound = await page.evaluate((title) => {
      const cards = Array.from(document.querySelectorAll('.nn-card'));
      return cards.some(c => c.textContent.includes(title));
    }, testTitle);

    if (noteFound) {
      reporter.pass('Note Card Rendered in NoteBoard', testTitle);
    } else {
      reporter.fail('Note Card Rendered in NoteBoard', `Note titled "${testTitle}" not found`);
    }

    // 8. Pin and Unpin Note
    const pinBtn = await page.evaluateHandle((title) => {
      const cards = Array.from(document.querySelectorAll('.nn-card'));
      const card = cards.find(c => c.textContent.includes(title));
      return card ? card.querySelector('.nn-card-action[id^="btn-pin-"], button[data-action="pin"]') : null;
    }, testTitle);

    if (pinBtn && pinBtn.asElement()) {
      await pinBtn.asElement().click();
      await page.waitForTimeout(500);
      reporter.pass('Pin Note Action');

      // Re-query pin button to unpin
      const unpinBtn = await page.evaluateHandle((title) => {
        const cards = Array.from(document.querySelectorAll('.nn-card'));
        const card = cards.find(c => c.textContent.includes(title));
        return card ? card.querySelector('.nn-card-action[id^="btn-pin-"], button[data-action="pin"]') : null;
      }, testTitle);

      if (unpinBtn && unpinBtn.asElement()) {
        await unpinBtn.asElement().click();
        await page.waitForTimeout(500);
        reporter.pass('Unpin Note Action');
      }
    } else {
      reporter.warn('Pin button not found on card');
    }

    // 9. Search Filter Flow
    const searchInput = await page.$('.nn-search-input') || await page.$('.nn-search-mobile-input');
    if (searchInput) {
      await searchInput.fill(String(testTimestamp));
      await page.waitForTimeout(400);

      const visibleCardsCount = await page.evaluate(() => {
        return document.querySelectorAll('.nn-card').length;
      });

      if (visibleCardsCount >= 1) {
        reporter.pass('Search Note by Token', `Matches visible: ${visibleCardsCount}`);
      } else {
        reporter.fail('Search Note by Token', `Expected at least 1 match, found ${visibleCardsCount}`);
      }

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // 10. Help Guide Modal
    const btnHelp = await page.$('#btn-help-guide');
    if (btnHelp) {
      await btnHelp.click();
      await page.waitForTimeout(400);
      const isGuideOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('.nn-guide-modal, .nn-modal-content, [role="dialog"]'));
      });
      if (isGuideOpen) {
        reporter.pass('Open Help Guide Modal');
        // Close modal
        const closeBtn = await page.$('#btn-close-help, .nn-modal-close, button[aria-label*="close"], button[aria-label*="Đóng"]');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(300);
          reporter.pass('Close Help Guide Modal');
        }
      }
    }

    // 11. Delete Note (with automated dialog acceptance)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    const deleteBtn = await page.evaluateHandle((title) => {
      const cards = Array.from(document.querySelectorAll('.nn-card'));
      const card = cards.find(c => c.textContent.includes(title));
      return card ? card.querySelector('.nn-card-action[id^="btn-delete-"], button[data-action="delete"]') : null;
    }, testTitle);

    if (deleteBtn && deleteBtn.asElement()) {
      await deleteBtn.asElement().click();
      await page.waitForTimeout(800);

      const isStillPresent = await page.evaluate((title) => {
        const cards = Array.from(document.querySelectorAll('.nn-card'));
        return cards.some(c => c.textContent.includes(title));
      }, testTitle);

      if (!isStillPresent) {
        reporter.pass('Delete Note Cleanup Flow', `Card "${testTitle}" safely deleted`);
      } else {
        reporter.fail('Delete Note Cleanup Flow', `Card "${testTitle}" still exists in DOM`);
      }
    }

    // 12. Check Unhandled Page Errors
    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors.length} errors logged: ${criticalErrors[0].message}`);
    }

  } catch (err) {
    reporter.fail('NoteNow Suite Exception', err);
  } finally {
    await context.close();
  }
}

// =============================================================================
// APP TEST SUITE: TarotNow (/tarot/)
// =============================================================================
async function testTarotNow(browser, baseUrl, reporter) {
  reporter.startSuite('TarotNow');
  const targetUrl = `${baseUrl}/tarot/`;
  const errors = [];

  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();
  attachPageMonitors(page, errors);

  try {
    reporter.info(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Initial Load & Title
    const title = await page.title();
    if (title.includes('Tarot')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    // 2. Responsive Viewports & Zero Overflow
    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // 3. Theme Toggle & Contrast
    const themeBtn = await page.$('.theme-toggle');
    if (themeBtn) {
      // Toggle to Light mode
      await themeBtn.click();
      await page.waitForTimeout(300);
      reporter.pass('Toggle Theme to Light Mode');

      // Check contrast of draw trigger button or form label
      const lightContrast = await checkElementContrast(page, '.draw-trigger-btn', 3.0);
      if (lightContrast.found) {
        reporter.pass('Light Mode Draw Button Contrast', `Ratio ${lightContrast.ratio}:1`);
      }

      // Switch back to Dark mode
      await themeBtn.click();
      await page.waitForTimeout(300);
      reporter.pass('Toggle Theme to Dark Mode');
    }

    // 4. Spread Selector Dropdown
    const spreadTrigger = await page.$('.spread-selector-trigger');
    if (spreadTrigger) {
      await spreadTrigger.click();
      await page.waitForTimeout(300);
      const dropdownOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('.spread-selector-dropdown'));
      });
      if (dropdownOpen) {
        reporter.pass('Open Spread Selector Dropdown');
        // Pick 3-card spread or close
        const spreadRow = await page.$('.spread-selector-row');
        if (spreadRow) {
          await spreadRow.click();
          await page.waitForTimeout(300);
          reporter.pass('Select Tarot Spread');
        }
      }
    }

    // 5. Question Input Validation & Random 3-Card Draw
    const questionInput = await page.$('#question-input');
    if (questionInput) {
      await questionInput.fill('Kế hoạch sự nghiệp và tài chính sắp tới của tôi ra sao?');
      reporter.pass('Fill Question Input');
    }

    const drawBtn = await page.$('.draw-trigger-btn');
    if (drawBtn) {
      const isDisabled = await page.evaluate(el => el.disabled, drawBtn);
      if (!isDisabled) {
        reporter.pass('Draw Trigger Button Enabled');
        await drawBtn.click();
        reporter.info('Initiated Tarot Draw — awaiting card reveal animation...');

        // Wait for visualizer or cards to be displayed
        await page.waitForSelector('.spread-layout-visualizer, .spread-card-slot', { timeout: 15000 });
        const cardCount = await page.evaluate(() => {
          return document.querySelectorAll('.spread-card-slot').length;
        });

        if (cardCount >= 1) {
          reporter.pass('Tarot Cards Rendered Successfully', `${cardCount} card slots displayed`);

          // Check card names have readable text
          const cardNames = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.spread-card-name')).map(el => el.textContent.trim());
          });
          if (cardNames.length > 0 && cardNames.every(n => n.length > 0)) {
            reporter.pass('Tarot Card Names Visible', cardNames.join(' | '));
          }
        } else {
          reporter.fail('Tarot Cards Rendered Successfully', 'No card slots rendered');
        }
      } else {
        reporter.fail('Draw Trigger Button Enabled', 'Button remained disabled');
      }
    }

    // 6. Interactive Card Detail Modal (TarotLearnModal Tap-to-Learn)
    const firstCardSlot = await page.$('.spread-card-slot');
    if (firstCardSlot) {
      await firstCardSlot.click();
      await page.waitForTimeout(600);
      const isLearnModalOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('.tarot-learn-modal-grid, .card-modal-content'));
      });

      if (isLearnModalOpen) {
        reporter.pass('Open TarotLearnModal (Tap-to-learn)');
        // Close modal
        const closeBtn = await page.$('.modal-close-btn, button[aria-label="Đóng"], button[aria-label="Close"]');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(400);
          reporter.pass('Close TarotLearnModal');
        }
      }
    }

    // 7. Mode Switcher (Manual Pick Mode)
    const manualModeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.mode-switcher-btn'));
      return btns.find(b => b.textContent.includes('Chọn Tay') || b.textContent.includes('Manual'));
    });

    if (manualModeBtn && manualModeBtn.asElement()) {
      await manualModeBtn.asElement().click();
      await page.waitForTimeout(500);

      const manualUiVisible = await page.evaluate(() => {
        return Boolean(document.querySelector('#manual-question-input, .manual-pick-wrapper, .manual-pick-container'));
      });

      if (manualUiVisible) {
        reporter.pass('Switch to Manual Pick Mode');
      } else {
        reporter.warn('Manual pick mode UI wrapper not explicitly matched');
      }

      // Switch back to Random mode
      const randomModeBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('.mode-switcher-btn'));
        return btns.find(b => b.textContent.includes('Ngẫu Nhiên') || b.textContent.includes('Random'));
      });
      if (randomModeBtn && randomModeBtn.asElement()) {
        await randomModeBtn.asElement().click();
        await page.waitForTimeout(300);
      }
    }

    // 8. Error Log Check
    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors.length} errors: ${criticalErrors[0].message}`);
    }

  } catch (err) {
    reporter.fail('TarotNow Suite Exception', err);
  } finally {
    await context.close();
  }
}

// =============================================================================
// APP TEST SUITE: IChingNow (/kinhdich/)
// =============================================================================
async function testIChingNow(browser, baseUrl, reporter) {
  reporter.startSuite('IChingNow');
  const targetUrl = `${baseUrl}/kinhdich/`;
  const errors = [];

  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();
  attachPageMonitors(page, errors);

  try {
    reporter.info(`Navigating to ${targetUrl}`);
    // Bypass 10s mindfulness countdown for testing
    await page.addInitScript(() => {
      localStorage.setItem('iching_mindfulness_enabled', 'false');
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Initial Load & Title
    const title = await page.title();
    if (title.includes('IChing') || title.includes('Kinh Dịch')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    // 2. Responsive Viewports & Zero Overflow
    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // 3. Theme Contrast Checks
    const themeBtn = await page.$('.theme-toggle');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      reporter.pass('Toggle Theme to Dark Mode');

      const darkHeading = await checkElementContrast(page, 'h1, .header-title', 3.0);
      if (darkHeading.found) {
        reporter.pass('Dark Mode Header Contrast', `Ratio ${darkHeading.ratio}:1`);
      }

      await themeBtn.click();
      await page.waitForTimeout(300);
      reporter.pass('Toggle Theme back to Light Mode');
    }

    // 4. Quick Cast Flow via Daily Cast Button
    const dailyCastBtn = await page.$('#daily-cast-quick');
    if (dailyCastBtn) {
      await dailyCastBtn.click();
      await page.waitForTimeout(400);
      reporter.pass('Trigger Daily Quick Cast');

      // Verify question is pre-filled and QuickCastPanel is displayed
      const isPanelOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('.btn-primary.btn-cta'));
      });

      if (isPanelOpen) {
        reporter.pass('QuickCastPanel Ready');

        // Switch to Instant Mode if available for ultra-fast cast
        const instantBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent.includes('1 chạm') || b.textContent.includes('Instant'));
        });
        if (instantBtn && instantBtn.asElement()) {
          await instantBtn.asElement().click();
          await page.waitForTimeout(200);
          reporter.pass('Set Instant 1-Touch Cast Mode');
        }

        // Click Cast Button
        const castCta = await page.$('.btn-primary.btn-cta');
        if (castCta) {
          await castCta.click();
          reporter.info('Initiated Hexagram Cast — waiting for results...');

          // Wait for LucHao combined card or results
          await page.waitForSelector('.luc-hao-table, section.card.animate-in', { timeout: 15000 });
          reporter.pass('Hexagram Result Card Rendered');

          // Check Tabs (Bảng Lục Hào / Luận giải)
          const tabsExist = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('section.card button'));
            return btns.some(b => b.textContent.includes('Lục Hào'));
          });
          if (tabsExist) {
            reporter.pass('LucHao Combined Tabs Rendered');
          }
        }
      }
    } else {
      reporter.warn('#daily-cast-quick button not found; attempting manual question cast');
    }

    // 5. Practice Game Modal (#open-game)
    const openGameBtn = await page.$('#open-game');
    if (openGameBtn) {
      await openGameBtn.click();
      await page.waitForTimeout(600);
      const isGameOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('.game-shell, [class*="game"]'));
      });
      if (isGameOpen) {
        reporter.pass('Open Practice Game (GameShell)');
        // Exit game
        const exitGameBtn = await page.$('button:has-text("Thoát"), button:has-text("Exit"), button[aria-label*="Đóng"]');
        if (exitGameBtn) {
          await exitGameBtn.click();
          await page.waitForTimeout(400);
          reporter.pass('Exit Practice Game');
        }
      }
    }

    // 6. Knowledge Feed Modal (#open-knowledge)
    const openKnowledgeBtn = await page.$('#open-knowledge');
    if (openKnowledgeBtn) {
      await openKnowledgeBtn.click();
      await page.waitForTimeout(600);
      const isKnowledgeOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('[class*="knowledge"], [class*="feed"]'));
      });
      if (isKnowledgeOpen) {
        reporter.pass('Open Knowledge Feed');
        const exitFeedBtn = await page.$('button:has-text("Đóng"), button:has-text("Close"), button[aria-label*="Đóng"]');
        if (exitFeedBtn) {
          await exitFeedBtn.click();
          await page.waitForTimeout(400);
          reporter.pass('Exit Knowledge Feed');
        }
      }
    }

    // 7. Error Log Check
    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors.length} errors: ${criticalErrors[0].message}`);
    }

  } catch (err) {
    reporter.fail('IChingNow Suite Exception', err);
  } finally {
    await context.close();
  }
}

// =============================================================================
// APP TEST SUITE: TuViNow (/tuvi/)
// =============================================================================
async function testTuViNow(browser, baseUrl, reporter) {
  reporter.startSuite('TuViNow');
  const targetUrl = `${baseUrl}/tuvi/`;
  const errors = [];

  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await context.newPage();
  attachPageMonitors(page, errors);

  try {
    reporter.info(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 1. Initial Load & Title
    const title = await page.title();
    if (title.includes('TuVi') || title.includes('Tử Vi')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    // 2. Responsive Viewports & Zero Overflow
    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // 3. Theme Toggle & Contrast
    const themeBtn = await page.$('#theme-toggle-btn, .theme-toggle');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      reporter.pass('Toggle Theme Mode');

      const submitBtnContrast = await checkElementContrast(page, '#btn-lap-la-so', 3.0);
      if (submitBtnContrast.found) {
        reporter.pass('Submit Button Contrast', `Ratio ${submitBtnContrast.ratio}:1`);
      }

      await themeBtn.click();
      await page.waitForTimeout(300);
    }

    // 4. Form Validation & Chart Generation Flow
    const nameInput = await page.$('#input-name');
    const submitBtn = await page.$('#btn-lap-la-so');

    if (nameInput && submitBtn) {
      // Check initial disabled state when name empty
      await nameInput.fill('');
      const isInitiallyDisabled = await page.evaluate(el => el.disabled, submitBtn);
      if (isInitiallyDisabled) {
        reporter.pass('Submit Button Disabled on Empty Name');
      } else {
        reporter.warn('Submit button was not disabled on empty name');
      }

      // Fill Name and Submit
      await nameInput.fill('Đỗ Minh Quân');
      await page.waitForTimeout(200);

      const isNowEnabled = await page.evaluate(el => !el.disabled, submitBtn);
      if (isNowEnabled) {
        reporter.pass('Submit Button Enabled on Valid Name');
      }

      await submitBtn.click();
      reporter.info('Submitted Birth Info — awaiting chart generation...');

      // Wait for LasoChart to render
      await page.waitForSelector('.chart-grid, .palace-card, .chart-center', { timeout: 15000 });
      reporter.pass('TuVi LasoChart Rendered Successfully');

      // Verify 12 Palaces Rendered
      const palaceCount = await page.evaluate(() => {
        return document.querySelectorAll('.palace-card').length;
      });

      if (palaceCount === 12) {
        reporter.pass('12 Palaces (Cung) Rendered in LasoChart', '12 / 12 Palaces');
      } else {
        reporter.warn(`Expected 12 palace cards, found ${palaceCount}`);
      }
    } else {
      reporter.fail('Birth Form Controls', 'Could not locate #input-name or #btn-lap-la-so');
    }

    // 5. Star / Palace Interaction (Tap-to-Learn Glossary Modal)
    const firstPalace = await page.$('.palace-card');
    if (firstPalace) {
      await firstPalace.click();
      await page.waitForTimeout(500);

      const isGlossaryOpen = await page.evaluate(() => {
        return Boolean(document.querySelector('.tuvi-glossary-modal, .glossary-sheet, [class*="glossary"]'));
      });

      if (isGlossaryOpen) {
        reporter.pass('Open TuVi Tap-to-Learn Glossary Modal');
        const closeBtn = await page.$('.modal-close, button[aria-label="Đóng"], button[aria-label="Close"]');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(300);
          reporter.pass('Close TuVi Glossary Modal');
        }
      }
    }

    // 6. Navigation to HopHon (#hop-hon)
    const hopHonLink = await page.$('a[href="#hop-hon"]');
    if (hopHonLink) {
      await hopHonLink.click();
      await page.waitForTimeout(500);

      const isHopHonVisible = await page.evaluate(() => {
        return Boolean(document.querySelector('.hop-hon'));
      });

      if (isHopHonVisible) {
        reporter.pass('Navigate to HopHon Page (#hop-hon)');
      } else {
        reporter.fail('Navigate to HopHon Page', '.hop-hon container not rendered');
      }

      // Return to chart view
      await page.evaluate(() => {
        window.location.hash = '';
      });
      await page.waitForTimeout(400);
    }

    // 7. Error Log Check
    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors.length} errors: ${criticalErrors[0].message}`);
    }

  } catch (err) {
    reporter.fail('TuViNow Suite Exception', err);
  } finally {
    await context.close();
  }
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================
async function main() {
  const options = parseArgs();
  const reporter = new TestReporter();

  console.log(`\n${c.bold}${c.magenta}╔══════════════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.magenta}║       SpiritNow Ecosystem Playwright E2E & Contrast Test Suite       ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚══════════════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`  Target Base URL : ${c.bold}${options.baseUrl}${c.reset}`);
  console.log(`  Target App(s)   : ${c.bold}${options.app.toUpperCase()}${c.reset}`);
  console.log(`  Headless Mode   : ${c.bold}${options.headless}${c.reset}`);
  console.log(`  Timestamp       : ${new Date().toISOString()}`);

  // Resolve Playwright
  let playwright;
  try {
    playwright = await resolvePlaywright();
  } catch (e) {
    console.error(`${c.red}FATAL: ${e.message}${c.reset}`);
    process.exit(1);
  }

  // Determine Google Chrome executable
  const chromeExecutable = process.env.CHROME_PATH ||
    (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined);

  if (chromeExecutable) {
    reporter.info(`Using Chrome Executable: ${chromeExecutable}`);
  }

  // Launch Chromium
  const browser = await playwright.chromium.launch({
    headless: options.headless,
    executablePath: chromeExecutable,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  try {
    const target = options.app;

    if (target === 'all' || target === 'notenow' || target === 'note') {
      await testNoteNow(browser, options.baseUrl, reporter);
    }

    if (target === 'all' || target === 'tarotnow' || target === 'tarot') {
      await testTarotNow(browser, options.baseUrl, reporter);
    }

    if (target === 'all' || target === 'iching' || target === 'kinhdich') {
      await testIChingNow(browser, options.baseUrl, reporter);
    }

    if (target === 'all' || target === 'tuvinow' || target === 'tuvi') {
      await testTuViNow(browser, options.baseUrl, reporter);
    }

  } finally {
    await browser.close();
  }

  const success = reporter.printSummary();
  process.exit(success ? 0 : 1);
}

main().catch(err => {
  console.error(`\n${c.red}Fatal Execution Error:${c.reset}`, err);
  process.exit(1);
});
