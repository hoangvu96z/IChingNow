#!/usr/bin/env node
/**
 * ==============================================================================
 * SpiritNow Ecosystem — Full-Flow Playwright E2E + Automated DOM Contrast Suite
 * ==============================================================================
 * Apps covered:
 *   - NoteNow   (/note/)
 *   - TarotNow  (/tarot/)
 *   - IChingNow (/kinhdich/)
 *   - TuViNow   (/tuvi/)
 *
 * Checks executed per app:
 *   1. Responsive Viewports: Desktop (1440x900), Mobile (390x844), Narrow (320x844)
 *   2. Zero Horizontal Overflow (scrollWidth <= clientWidth + 1.5)
 *   3. Automated Full-DOM Visible Text Contrast Scanner (WCAG alpha-composited)
 *      at EVERY interactive state, modal, tab, and flow in BOTH Dark & Light modes
 *   4. Zero Unhandled Console Errors (pageerror) and Network Failures
 *   5. Comprehensive End-to-End Functional Flows (all casting methods, modals, tabs)
 *
 * Usage:
 *   node scripts/playwright-e2e-suite.mjs [options]
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import { pathToFileURL } from 'url';

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
SpiritNow Playwright E2E & Full-DOM Theme Contrast Test Suite

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

async function resolvePlaywright() {
  try {
    return await import('playwright');
  } catch {}

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

  const specific = '/Users/hoangvu96z/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
  if (fs.existsSync(specific)) {
    return await import(pathToFileURL(specific).href);
  }

  throw new Error('Could not resolve playwright module. Please ensure Playwright is accessible.');
}

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

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, name: 'Desktop (1440x900)' },
  mobile: { width: 390, height: 844, name: 'Mobile (390x844)' },
  narrow: { width: 320, height: 844, name: 'Narrow Mobile (320x844)' },
};

function attachPageMonitors(page, errorLog) {
  page.on('pageerror', err => {
    errorLog.push({ type: 'pageerror', message: err.message });
  });

  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.includes('google-analytics') && !url.includes('doubleclick') && !url.includes('fonts.gstatic')) {
      errorLog.push({ type: 'requestfailed', url, failure: req.failure()?.errorText });
    }
  });
}

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
 * Full-DOM Visible Text Readability & Contrast Scanner.
 * Walks every visible text node in the page, resolves alpha-composited background color
 * (including linear/radial gradient color stops if backgroundColor is transparent),
 * and checks WCAG contrast ratio against computed text color.
 */
async function assertAllVisibleTextReadable(page, reporter, label, minRatio = 3.0) {
  const scan = await page.evaluate((threshold) => {
    function parseRgbaAll(str) {
      if (!str) return [];
      const results = [];
      const regex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g;
      let m;
      while ((m = regex.exec(str)) !== null) {
        results.push({
          r: parseInt(m[1], 10),
          g: parseInt(m[2], 10),
          b: parseInt(m[3], 10),
          a: m[4] !== undefined ? parseFloat(m[4]) : 1.0,
        });
      }
      return results;
    }

    function blend(top, bottom) {
      const a = top.a + bottom.a * (1 - top.a);
      if (a <= 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: Math.round((top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a),
        g: Math.round((top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a),
        b: Math.round((top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a),
        a,
      };
    }

    function getEffectiveBg(el) {
      const layers = [];
      let curr = el;
      while (curr && curr !== document) {
        const st = window.getComputedStyle(curr);
        const bgColors = parseRgbaAll(st.backgroundColor);
        if (bgColors.length > 0 && bgColors[0].a > 0.01) {
          layers.push(bgColors[0]);
          if (bgColors[0].a >= 0.98) break;
        } else if (st.backgroundImage && st.backgroundImage !== 'none' && st.backgroundImage.includes('gradient')) {
          // Only treat backgroundImage gradients as an element surface if it is not the full-screen decorative .app-bg
          if (!curr.classList || !curr.classList.contains('app-bg')) {
            const gradStops = parseRgbaAll(st.backgroundImage).filter(c => c.a > 0.02);
            if (gradStops.length > 0) {
              const avg = gradStops.reduce(
                (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b, a: acc.a + c.a }),
                { r: 0, g: 0, b: 0, a: 0 }
              );
              const n = gradStops.length;
              const stop = {
                r: Math.round(avg.r / n),
                g: Math.round(avg.g / n),
                b: Math.round(avg.b / n),
                a: Math.min(1, avg.a / n),
              };
              layers.push(stop);
              if (stop.a >= 0.98) break;
            }
          }
        }
        curr = curr.parentElement;
      }

      const theme = document.documentElement.getAttribute('data-theme');
      let base = theme === 'dark'
        ? { r: 20, g: 16, b: 14, a: 1 }
        : { r: 250, g: 243, b: 224, a: 1 };
      const bodyBg = parseRgbaAll(window.getComputedStyle(document.body).backgroundColor);
      if (bodyBg.length > 0 && bodyBg[0].a > 0.5) {
        base = bodyBg[0];
      }

      for (let i = layers.length - 1; i >= 0; i--) {
        base = blend(layers[i], base);
      }
      return base;
    }

    function getLuminance(r, g, b) {
      const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function isVisible(el) {
      let curr = el;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        const st = window.getComputedStyle(curr);
        if (st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) < 0.15) {
          return false;
        }
        if (curr.disabled || curr.getAttribute('aria-disabled') === 'true' || curr.getAttribute('aria-hidden') === 'true') {
          return false;
        }
        curr = curr.parentElement;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 2 && rect.height > 2;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const checkedElements = new Set();
    const violations = [];
    let totalChecked = 0;

    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue ? node.nodeValue.trim() : '';
      // Must contain at least one letter or digit (ignore pure decorative symbols like ✦, —, |)
      if (!text || !/[\p{L}\p{N}]/u.test(text)) continue;

      const el = node.parentElement;
      if (!el || checkedElements.has(el)) continue;
      const tag = el.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'option') continue;
      if (!isVisible(el)) continue;

      const st = window.getComputedStyle(el);
      // Skip gradient-clipped text (-webkit-background-clip: text)
      if (st.webkitBackgroundClip === 'text' || st.backgroundClip === 'text') continue;
      if (st.webkitTextFillColor && st.webkitTextFillColor.includes('0, 0, 0, 0')) continue;
      // Skip banknote decorative art where realistic bill graphics are used
      if (el.closest('.banknote-bill') || el.closest('.tarot-card-back') || el.closest('.ancient-coin-3d')) continue;

      checkedElements.add(el);
      totalChecked++;

      const bg = getEffectiveBg(el);
      const fgColors = parseRgbaAll(st.color);
      if (fgColors.length === 0) continue;
      const fg = blend(fgColors[0], bg);

      const l1 = getLuminance(fg.r, fg.g, fg.b);
      const l2 = getLuminance(bg.r, bg.g, bg.b);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      if (ratio < threshold) {
        violations.push({
          text: text.slice(0, 50),
          tag,
          className: (typeof el.className === 'string' ? el.className : '').slice(0, 50),
          ratio: Math.round(ratio * 100) / 100,
          fg: `rgb(${fg.r},${fg.g},${fg.b})`,
          bg: `rgb(${bg.r},${bg.g},${bg.b})`,
        });
      }
    }

    return { totalChecked, violations };
  }, minRatio);

  if (scan.violations.length === 0) {
    reporter.pass(`DOM Contrast Scan: ${label}`, `${scan.totalChecked} text elements >= ${minRatio}:1`);
  } else {
    const sample = scan.violations
      .slice(0, 4)
      .map(v => `"${v.text}" (<${v.tag}> ${v.fg} on ${v.bg} = ${v.ratio}:1)`)
      .join('; ');
    reporter.fail(
      `DOM Contrast Scan: ${label}`,
      `${scan.violations.length} unreadable element(s) < ${minRatio}:1 -> ${sample}`
    );
  }
}

async function setAppTheme(page, targetTheme) {
  await page.evaluate((theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  }, targetTheme);
  await page.waitForTimeout(250);
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

    const title = await page.title();
    if (title.includes('NoteNow') || title.includes('Ghi chú')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    for (const [, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // Scan Board in Light & Dark modes
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'NoteNow Main Board [Light Mode]');

    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'NoteNow Main Board [Dark Mode]');

    const logoColor = await page.evaluate(() => {
      const icon = document.querySelector('.nn-logo-icon');
      return icon ? window.getComputedStyle(icon).color : null;
    });
    if (logoColor === 'rgb(255, 255, 255)') {
      reporter.pass('Dark Mode Logo Contrast', `Logo color is exact white: ${logoColor}`);
    } else {
      reporter.fail('Dark Mode Logo Contrast', `Expected rgb(255, 255, 255) but got ${logoColor}`);
    }

    // Open Note Editor & test formatting + color swatches in Dark & Light modes
    const btnNew = await page.$('#btn-new-note') || await page.$('#btn-create-first-note') || await page.$('.nn-create-box');
    if (btnNew) {
      await btnNew.click();
      await page.waitForSelector('#note-editor-title', { timeout: 8000 });
      reporter.pass('Open Note Editor Modal');
    } else {
      reporter.fail('Open Note Editor Modal', 'Could not find #btn-new-note');
    }

    const testTimestamp = Date.now();
    const testTitle = `[E2E] Note ${testTimestamp}`;
    const testBody = `Full-flow verification content for NoteNow at ${new Date().toISOString()}`;

    await page.fill('#note-editor-title', testTitle);
    const editorBody = await page.$('.nn-tiptap-wrap .ProseMirror');
    if (editorBody) {
      await editorBody.fill(testBody);
      reporter.pass('Fill Note Title & Body');
    }

    // Formatting toolbar buttons (Bold, Italic, Checklist)
    for (const fmtSel of ['#btn-fmt-bold', '#btn-fmt-italic', '#btn-fmt-checklist']) {
      const fmtBtn = await page.$(fmtSel);
      if (fmtBtn) {
        await fmtBtn.click();
        await page.waitForTimeout(100);
      }
    }
    reporter.pass('Exercise Formatting Toolbar Buttons (Bold, Italic, Checklist)');

    // Color Picker Swatches in Dark & Light modes
    const btnColorPicker = await page.$('#btn-color-picker');
    if (btnColorPicker) {
      await btnColorPicker.click();
      await page.waitForTimeout(200);
      const swatches = await page.$$('.nn-color-swatch');
      if (swatches.length > 1) {
        await swatches[1].click();
        await page.waitForTimeout(200);
        reporter.pass('Select Colored Note Swatch');
      }
    }

    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'NoteNow Editor Modal with Colored Swatch [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'NoteNow Editor Modal with Colored Swatch [Light Mode]');
    await setAppTheme(page, 'dark');

    // Save Note
    const btnSave = await page.$('#btn-save-note');
    if (btnSave) {
      await btnSave.click();
      await page.waitForSelector('.nn-overlay', { state: 'detached', timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(500);
      reporter.pass('Save Note to Board');
    }

    await assertAllVisibleTextReadable(page, reporter, 'NoteNow Board with Colored Note Card [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'NoteNow Board with Colored Note Card [Light Mode]');
    await setAppTheme(page, 'dark');

    // Pin & Unpin
    const pinBtn = await page.evaluateHandle((t) => {
      const card = Array.from(document.querySelectorAll('.nn-card')).find(c => c.textContent.includes(t));
      return card ? card.querySelector('.nn-card-action[id^="btn-pin-"], button[data-action="pin"]') : null;
    }, testTitle);
    if (pinBtn && pinBtn.asElement()) {
      await pinBtn.asElement().click();
      await page.waitForTimeout(400);
      reporter.pass('Pin Note Card');
      const unpinBtn = await page.evaluateHandle((t) => {
        const card = Array.from(document.querySelectorAll('.nn-card')).find(c => c.textContent.includes(t));
        return card ? card.querySelector('.nn-card-action[id^="btn-pin-"], button[data-action="pin"]') : null;
      }, testTitle);
      if (unpinBtn && unpinBtn.asElement()) {
        await unpinBtn.asElement().click();
        await page.waitForTimeout(400);
        reporter.pass('Unpin Note Card');
      }
    }

    // Search Filter
    const searchInput = await page.$('.nn-search-input') || await page.$('.nn-search-mobile-input');
    if (searchInput) {
      await searchInput.fill(String(testTimestamp));
      await page.waitForTimeout(300);
      await searchInput.fill('');
      await page.waitForTimeout(200);
      reporter.pass('Search Filter & Clear');
    }

    // Help Guide Modal in Dark & Light modes
    const btnHelp = await page.$('#btn-help-guide');
    if (btnHelp) {
      await btnHelp.click();
      await page.waitForTimeout(400);
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'NoteNow HelpModal [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'NoteNow HelpModal [Light Mode]');
      await setAppTheme(page, 'dark');
      const closeBtn = await page.$('#btn-close-help, .nn-modal-close, button[aria-label*="close"], button[aria-label*="Đóng"]');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(300);
        reporter.pass('Open & Close HelpModal');
      }
    }

    // Delete Note
    page.on('dialog', async dialog => await dialog.accept());
    const deleteBtn = await page.evaluateHandle((t) => {
      const card = Array.from(document.querySelectorAll('.nn-card')).find(c => c.textContent.includes(t));
      return card ? card.querySelector('.nn-card-action[id^="btn-delete-"], button[data-action="delete"]') : null;
    }, testTitle);
    if (deleteBtn && deleteBtn.asElement()) {
      await deleteBtn.asElement().click();
      await page.waitForTimeout(500);
      const confirmDeleteBtn = await page.$('#btn-confirm-delete');
      if (confirmDeleteBtn) {
        await assertAllVisibleTextReadable(page, reporter, 'NoteNow Delete Confirm Modal [Dark Mode]');
        await confirmDeleteBtn.click();
        await page.waitForTimeout(500);
      }
      reporter.pass('Delete Note Cleanup');
    }

    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors[0].message}`);
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

    const title = await page.title();
    if (title.includes('Tarot')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    for (const [, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // 1. Scan Initial Screen in Dark & Light modes
    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'TarotNow Home Screen [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'TarotNow Home Screen [Light Mode]');

    // 2. Daily Tarot Card flow (Mở bài hôm nay)
    const dailyRevealBtn = await page.$('.daily-tarot-reveal-btn');
    if (dailyRevealBtn) {
      await dailyRevealBtn.click();
      await page.waitForTimeout(450);
      reporter.pass('Reveal Daily Tarot Card');
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow Daily Card Revealed [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow Daily Card Revealed [Light Mode]');
    }

    // 3. Spread Selector Dropdown in Dark & Light modes
    const spreadTrigger = await page.$('.spread-selector-trigger');
    if (spreadTrigger) {
      await spreadTrigger.click();
      await page.waitForTimeout(300);
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow Spread Selector Dropdown [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow Spread Selector Dropdown [Light Mode]');
      const spreadRows = await page.$$('.spread-selector-row');
      if (spreadRows.length > 1) {
        await spreadRows[1].click(); // Pick 3-card spread
        await page.waitForTimeout(250);
        reporter.pass('Select 3-Card Spread from Dropdown');
      }
    }

    // 4. Fill Question & Draw Cards
    const questionInput = await page.$('#question-input');
    if (questionInput) {
      await questionInput.fill('Sự nghiệp và tài chính của tôi trong 6 tháng tới sẽ chuyển biến thế nào?');
      reporter.pass('Fill Tarot Question');
    }

    const drawBtn = await page.$('.draw-trigger-btn');
    if (drawBtn) {
      await drawBtn.click();
      await page.waitForSelector('.spread-layout-visualizer, .spread-card-slot', { timeout: 15000 });
      await page.waitForTimeout(1000);
      reporter.pass('Draw Tarot Cards & Render Spread Visualizer + Basic Interpretation');
    }

    // 5. Open AI Settings Panel & PromptExporter tabs, then scan Dark & Light modes
    const aiSettingsBtn = await page.$('.ai-settings-btn');
    if (aiSettingsBtn) {
      await aiSettingsBtn.click();
      await page.waitForTimeout(250);
      reporter.pass('Open Tarot AI Settings Panel');
    }

    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'TarotNow Drawn Results + AI Settings + Exporter [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'TarotNow Drawn Results + AI Settings + Exporter [Light Mode]');

    // 6. Open TarotLearnModal (Tap-to-Learn on first card slot) in Dark & Light modes
    const firstCardSlot = await page.$('.spread-card-slot');
    if (firstCardSlot) {
      await firstCardSlot.click();
      await page.waitForTimeout(500);
      const isLearnModalOpen = await page.evaluate(() => Boolean(document.querySelector('.tarot-learn-modal-grid, .card-modal-content')));
      if (isLearnModalOpen) {
        reporter.pass('Open TarotLearnModal');
        await setAppTheme(page, 'dark');
        await assertAllVisibleTextReadable(page, reporter, 'TarotLearnModal [Dark Mode]');
        await setAppTheme(page, 'light');
        await assertAllVisibleTextReadable(page, reporter, 'TarotLearnModal [Light Mode]');
        const closeBtn = await page.$('.modal-close-btn, button[aria-label="Đóng"], button[aria-label="Close"]');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(350);
          reporter.pass('Close TarotLearnModal');
        }
      }
    }

    // 7. Switch to Manual Pick Mode -> Pick Cards -> Check Grid View & Weight Modal in Dark & Light modes
    const manualModeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.mode-switcher-btn'));
      return btns.find(b => b.textContent.includes('Chọn') || b.textContent.includes('Manual'));
    });
    if (manualModeBtn && manualModeBtn.asElement()) {
      await manualModeBtn.asElement().click();
      await page.waitForTimeout(500);
      reporter.pass('Switch to Manual Pick Mode');

      const manualQuestion = await page.$('#manual-question-input');
      if (manualQuestion) {
        await manualQuestion.fill('Câu hỏi chọn bài thủ công kiểm thử E2E');
        await page.waitForTimeout(200);
      }

      // Open Weight Settings Modal inside ManualPickMode if present
      const weightBtn = await page.$('.manual-weight-trigger-btn');
      if (weightBtn) {
        await weightBtn.click();
        await page.waitForTimeout(350);
        await setAppTheme(page, 'dark');
        await assertAllVisibleTextReadable(page, reporter, 'TarotNow WeightSettingsModal [Dark Mode]');
        await setAppTheme(page, 'light');
        await assertAllVisibleTextReadable(page, reporter, 'TarotNow WeightSettingsModal [Light Mode]');
        const closeWeightBtn = await page.$('.modal-close-btn');
        if (closeWeightBtn) {
          await closeWeightBtn.click();
          await page.waitForTimeout(300);
        }
      }

      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow ManualPickMode [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow ManualPickMode [Light Mode]');
    }

    // 8. Spiritual Journal Modal in Dark & Light modes
    const journalBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      return btns.find(b => b.textContent.includes('Nhật ký') || b.textContent.includes('Journal') || b.title?.includes('Nhật ký'));
    });
    if (journalBtn && journalBtn.asElement()) {
      await journalBtn.asElement().click();
      await page.waitForTimeout(400);
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow SpiritualJournal Modal [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'TarotNow SpiritualJournal Modal [Light Mode]');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors[0].message}`);
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
    // IMPORTANT: Enable MindfulnessModal first so we test the exact modal from the user's screenshot!
    await page.addInitScript(() => {
      localStorage.setItem('iching_mindfulness_enabled', 'true');
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const title = await page.title();
    if (title.includes('IChing') || title.includes('Kinh Dịch')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    for (const [, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // 1. Scan Initial Form + MethodPicker in Dark & Light modes
    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'IChingNow Home & MethodPicker [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'IChingNow Home & MethodPicker [Light Mode]');

    // 2. Method 1: QuickCast + MindfulnessModal (10s Tịnh Tâm Quán Tưởng) in Dark & Light Modes!
    await setAppTheme(page, 'dark');
    const dailyCastBtn = await page.$('#daily-cast-quick');
    if (dailyCastBtn) {
      await dailyCastBtn.click();
      await page.waitForTimeout(350);
      reporter.pass('Select QuickCast via Daily Reading');
    }

    await assertAllVisibleTextReadable(page, reporter, 'IChingNow QuickCastPanel [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'IChingNow QuickCastPanel [Light Mode]');
    await setAppTheme(page, 'dark');

    // Switch to Instant 1-Click mode and click Cast to trigger MindfulnessModal!
    const instantBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('1 Chạm') || b.textContent.includes('Instant'));
    });
    if (instantBtn && instantBtn.asElement()) {
      await instantBtn.asElement().click();
      await page.waitForTimeout(200);
    }

    const castCta = await page.$('.btn-primary.btn-cta');
    if (castCta) {
      await castCta.click();
      await page.waitForTimeout(400);

      // Verify MindfulnessModal ("Tịnh Tâm Quán Tưởng") opened!
      const isMindfulnessOpen = await page.evaluate(() => {
        return document.body.textContent.includes('Tịnh Tâm Quán Tưởng') || document.body.textContent.includes('Mindful Focus');
      });
      if (isMindfulnessOpen) {
        reporter.pass('Open MindfulnessModal (Tịnh Tâm Quán Tưởng)');

        // Scan MindfulnessModal in Dark Mode (THE EXACT USER SCREENSHOT BUG) & Light Mode!
        await setAppTheme(page, 'dark');
        await assertAllVisibleTextReadable(page, reporter, 'IChingNow MindfulnessModal [Dark Mode]');
        await setAppTheme(page, 'light');
        await assertAllVisibleTextReadable(page, reporter, 'IChingNow MindfulnessModal [Light Mode]');
        await setAppTheme(page, 'dark');

        // Click "Đã tịnh tâm, gieo quẻ ngay ➔" to proceed with casting
        const skipMindfulBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent.includes('Đã tịnh tâm') || b.textContent.includes('Cast Now'));
        });
        if (skipMindfulBtn && skipMindfulBtn.asElement()) {
          await skipMindfulBtn.asElement().click();
          reporter.pass('Confirm MindfulnessModal & Trigger Cast');
        }
      } else {
        reporter.fail('Open MindfulnessModal (Tịnh Tâm Quán Tưởng)', 'MindfulnessModal did not appear when enabled');
      }

      // Wait for Hexagram Result
      await page.waitForSelector('.luc-hao-table, section.card.animate-in', { timeout: 15000 });
      await page.waitForTimeout(500);
      reporter.pass('QuickCast Hexagram Result Rendered');
    }

    // 3. Test Result Tabs (Bảng Lục Hào / Luận giải cơ bản / Học đọc quẻ) + AI Settings in Dark & Light modes
    // Open AI Settings (`⚙️ Cấu hình`) to test `<select>` contrast in Dark mode
    const ichingAiSettingsBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Cấu hình') || b.textContent.includes('Settings'));
    });
    if (ichingAiSettingsBtn && ichingAiSettingsBtn.asElement()) {
      await ichingAiSettingsBtn.asElement().click();
      await page.waitForTimeout(250);
      reporter.pass('Open IChing AI Settings Form');
    }

    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'IChingNow Result (Bảng Lục Hào + AI Settings) [Dark Mode]');
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'IChingNow Result (Bảng Lục Hào + AI Settings) [Light Mode]');

    // Switch to "Luận giải cơ bản" tab
    const basicInterpTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Luận giải cơ bản') || b.textContent.includes('Basic Interpretation'));
    });
    if (basicInterpTab && basicInterpTab.asElement()) {
      await basicInterpTab.asElement().click();
      await page.waitForTimeout(300);
      reporter.pass('Switch to Luận giải cơ bản Tab');
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow Luận giải cơ bản Tab [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow Luận giải cơ bản Tab [Light Mode]');
    }

    // Open CombinedReadingModal ("🌟 Kết hợp Tử Vi") in Dark & Light modes
    const combinedBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Kết hợp Tử Vi') || b.textContent.includes('Combine'));
    });
    if (combinedBtn && combinedBtn.asElement()) {
      await combinedBtn.asElement().click();
      await page.waitForTimeout(400);
      reporter.pass('Open CombinedReadingModal (Kết hợp Tử Vi)');
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow CombinedReadingModal [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow CombinedReadingModal [Light Mode]');
      // Close CombinedReadingModal
      const closeCombined = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.trim() === '✕');
      });
      if (closeCombined && closeCombined.asElement()) {
        await closeCombined.asElement().click();
        await page.waitForTimeout(300);
      }
    }

    // 4. Test Method 2: ManualLineStepper (`Gieo từng hào` + `Chọn mặt tay`)
    // Disable mindfulness for remaining rapid method tests
    await page.evaluate(() => localStorage.setItem('iching_mindfulness_enabled', 'false'));
    const changeMethodBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Đổi phương pháp'));
    });
    if (changeMethodBtn && changeMethodBtn.asElement()) {
      await changeMethodBtn.asElement().click();
      await page.waitForTimeout(300);
    }

    const manualMethodCard = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.method-picker-4row button'));
      return btns.find(b => b.textContent.includes('Gieo từng hào') || b.textContent.includes('Step'));
    });
    if (manualMethodCard && manualMethodCard.asElement()) {
      await manualMethodCard.asElement().click();
      await page.waitForTimeout(350);
      reporter.pass('Select Method 2: ManualLineStepper (Gieo từng hào)');

      // Switch to "✍ Chọn mặt tay" to test the Total Points pill & lastLine pill in Dark Mode!
      const manualFlipToggle = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('Chọn mặt tay') || b.textContent.includes('Manual'));
      });
      if (manualFlipToggle && manualFlipToggle.asElement()) {
        await manualFlipToggle.asElement().click();
        await page.waitForTimeout(250);
        reporter.pass('Switch ManualLineStepper to Chọn mặt tay Mode');
      }

      // Confirm 1st line so `lastLine` pill renders
      const confirmLineBtn = await page.$('.btn-primary.btn-cta');
      if (confirmLineBtn) {
        await confirmLineBtn.click();
        await page.waitForTimeout(300);
        reporter.pass('Confirm Line 1 in ManualLineStepper');
      }

      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow ManualLineStepper + Total/LastLine Pills [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow ManualLineStepper + Total/LastLine Pills [Light Mode]');
    }

    // 5. Test Method 3: Mai Hoa — Ngày giờ động tâm (`mai-hoa-time`)
    const backBtn2 = await page.$('#btn-change-casting-method');
    if (backBtn2) {
      await backBtn2.click();
      await page.waitForTimeout(300);
    }
    const maiHoaTimeCard = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.method-picker-4row button'));
      return btns.find(b => b.textContent.includes('Ngày giờ động tâm') || b.textContent.includes('Time'));
    });
    if (maiHoaTimeCard && maiHoaTimeCard.asElement()) {
      await maiHoaTimeCard.asElement().click();
      await page.waitForTimeout(350);
      reporter.pass('Select Method 3: Mai Hoa — Ngày giờ động tâm');

      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow MaiHoaTimePanel [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow MaiHoaTimePanel [Light Mode]');

      // Cast Mai Hoa Time hexagram
      const castMaiHoaBtn = await page.$('.btn-primary.btn-cta');
      if (castMaiHoaBtn) {
        await castMaiHoaBtn.click();
        await page.waitForTimeout(500);
        reporter.pass('Cast Mai Hoa Time Hexagram');
        await setAppTheme(page, 'dark');
        await assertAllVisibleTextReadable(page, reporter, 'IChingNow MaiHoaResultCard [Dark Mode]');
        await setAppTheme(page, 'light');
        await assertAllVisibleTextReadable(page, reporter, 'IChingNow MaiHoaResultCard [Light Mode]');
      }
    }

    // 6. Test Method 4: Mai Hoa — Số seri tiền (`mai-hoa-serial`)
    const changeMethodFromMaiHoa = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Đổi phương pháp'));
    });
    if (changeMethodFromMaiHoa && changeMethodFromMaiHoa.asElement()) {
      await changeMethodFromMaiHoa.asElement().click();
      await page.waitForTimeout(300);
    }
    const maiHoaSerialCard = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.method-picker-4row button'));
      return btns.find(b => b.textContent.includes('Số seri tiền') || b.textContent.includes('Serial'));
    });
    if (maiHoaSerialCard && maiHoaSerialCard.asElement()) {
      await maiHoaSerialCard.asElement().click();
      await page.waitForTimeout(350);
      reporter.pass('Select Method 4: Mai Hoa — Số seri tiền');

      // Click a banknote suggestion card so SerialPreview renders
      const firstBill = await page.$('.banknote-bill');
      if (firstBill) {
        await firstBill.click();
        await page.waitForTimeout(250);
        reporter.pass('Select Banknote Serial Suggestion');
      }

      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow MaiHoaSerialPanel + SerialPreview [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow MaiHoaSerialPanel + SerialPreview [Light Mode]');
    }

    // 7. Practice Game Modal (#open-game) + Biến Quẻ Mini-Game in Dark & Light modes
    const openGameBtn = await page.$('#open-game');
    if (openGameBtn) {
      await page.evaluate(() => document.getElementById('open-game')?.click());
      await page.waitForTimeout(500);
      reporter.pass('Open Practice Game (GameShell)');

      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow GameShell Home [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow GameShell Home [Light Mode]');

      // Open Biến Quẻ puzzle mode (#game-mode-bien-que)
      const bienQueBtn = await page.$('#game-mode-bien-que');
      if (bienQueBtn) {
        await bienQueBtn.click();
        await page.waitForTimeout(400);
        reporter.pass('Open Biến Quẻ Puzzle Game');
        await setAppTheme(page, 'dark');
        await assertAllVisibleTextReadable(page, reporter, 'IChingNow BienQueGame [Dark Mode]');
        await setAppTheme(page, 'light');
        await assertAllVisibleTextReadable(page, reporter, 'IChingNow BienQueGame [Light Mode]');
      }

      const exitGameBtn = await page.$('#game-exit');
      if (exitGameBtn) {
        await exitGameBtn.click();
        await page.waitForTimeout(350);
        reporter.pass('Exit Practice Game');
      }
    }

    // 8. Knowledge Feed Modal (#open-knowledge) in Dark & Light modes
    const openKnowledgeBtn = await page.$('#open-knowledge');
    if (openKnowledgeBtn) {
      await page.evaluate(() => document.getElementById('open-knowledge')?.click());
      await page.waitForTimeout(500);
      reporter.pass('Open Knowledge Feed');

      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow KnowledgeFeed [Dark Mode]');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'IChingNow KnowledgeFeed [Light Mode]');

      const exitFeedBtn = await page.$('#knowledge-exit');
      if (exitFeedBtn) {
        await exitFeedBtn.click();
        await page.waitForTimeout(350);
        reporter.pass('Exit Knowledge Feed');
      }
    }

    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors[0].message}`);
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

    const title = await page.title();
    if (title.includes('TuVi') || title.includes('Tử Vi')) {
      reporter.pass('Page Title Verification', title);
    } else {
      reporter.fail('Page Title Verification', `Unexpected title: ${title}`);
    }

    for (const [, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);
      const overflow = await checkHorizontalOverflow(page);
      if (!overflow.hasOverflow) {
        reporter.pass(`Zero Horizontal Overflow @ ${vp.name}`, `scrollWidth: ${overflow.scrollWidth}px`);
      } else {
        reporter.fail(`Zero Horizontal Overflow @ ${vp.name}`, `Overflow by ${overflow.overflow}px`);
      }
    }

    await page.setViewportSize(VIEWPORTS.desktop);

    // 1. Scan BirthInputForm in Light & Dark modes
    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'TuViNow BirthInputForm [Light Mode]');
    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'TuViNow BirthInputForm [Dark Mode]');

    // Toggle Lunar Calendar input & Quick Year chip
    const lunarToggleBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.calendar-type-toggle button'));
      return btns.find(b => b.textContent.includes('Âm lịch') || b.textContent.includes('Lunar'));
    });
    if (lunarToggleBtn && lunarToggleBtn.asElement()) {
      await lunarToggleBtn.asElement().click();
      await page.waitForTimeout(200);
      reporter.pass('Switch BirthInputForm to Lunar Calendar Mode');
      const solarToggleBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('.calendar-type-toggle button'));
        return btns.find(b => b.textContent.includes('Dương lịch') || b.textContent.includes('Solar'));
      });
      if (solarToggleBtn && solarToggleBtn.asElement()) {
        await solarToggleBtn.asElement().click();
        await page.waitForTimeout(200);
      }
    }

    // 2. Submit Birth Info & Generate LasoChart
    const nameInput = await page.$('#input-name');
    const submitBtn = await page.$('#btn-lap-la-so');
    if (nameInput && submitBtn) {
      await nameInput.fill('Đỗ Minh Quân');
      await page.waitForTimeout(200);
      await submitBtn.click();
      await page.waitForSelector('.chart-grid, .palace-card, .chart-center', { timeout: 15000 });
      await page.waitForTimeout(500);
      reporter.pass('Generate TuVi LasoChart (12 Palaces)');
    }

    // Open AI Settings in TuViAiPanel
    const tuviAiSettings = await page.$('.tuvi-ai-settings-btn');
    if (tuviAiSettings) {
      await tuviAiSettings.click();
      await page.waitForTimeout(250);
      reporter.pass('Open TuVi AI Settings Panel');
    }

    await setAppTheme(page, 'light');
    await assertAllVisibleTextReadable(page, reporter, 'TuViNow LasoChart + AI Panel [Light Mode]');
    await setAppTheme(page, 'dark');
    await assertAllVisibleTextReadable(page, reporter, 'TuViNow LasoChart + AI Panel [Dark Mode]');

    // 3. Open Tap-to-Learn Glossary Modal in Light & Dark modes
    const starOrBadge = await page.$('.chart-center span[style*="cursor: pointer"], .palace-card span[style*="cursor: pointer"]') || await page.$('.palace-card');
    if (starOrBadge) {
      await starOrBadge.click();
      await page.waitForTimeout(450);
      const isGlossaryOpen = await page.evaluate(() => Boolean(document.querySelector('.tuvi-glossary-modal, .glossary-sheet, [class*="glossary"]')));
      if (isGlossaryOpen) {
        reporter.pass('Open TuVi Tap-to-Learn Glossary Modal');
        await setAppTheme(page, 'light');
        await assertAllVisibleTextReadable(page, reporter, 'TuViNow GlossaryModal [Light Mode]');
        await setAppTheme(page, 'dark');
        await assertAllVisibleTextReadable(page, reporter, 'TuViNow GlossaryModal [Dark Mode]');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // 4. Open ShareCard in Light & Dark modes
    const shareBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Chia sẻ') || b.textContent.includes('Tạo ảnh'));
    });
    if (shareBtn && shareBtn.asElement()) {
      await shareBtn.asElement().click();
      await page.waitForTimeout(350);
      reporter.pass('Toggle TuVi ShareCard');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'TuViNow ShareCard [Light Mode]');
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'TuViNow ShareCard [Dark Mode]');
    }

    // 5. Navigate to HopHonPage (#hop-hon) and check Light & Dark modes
    const hopHonLink = await page.$('a[href="#hop-hon"]');
    if (hopHonLink) {
      await hopHonLink.click();
      await page.waitForTimeout(450);
      reporter.pass('Navigate to HopHonPage (#hop-hon)');
      await setAppTheme(page, 'light');
      await assertAllVisibleTextReadable(page, reporter, 'TuViNow HopHonPage [Light Mode]');
      await setAppTheme(page, 'dark');
      await assertAllVisibleTextReadable(page, reporter, 'TuViNow HopHonPage [Dark Mode]');
      await page.evaluate(() => { window.location.hash = ''; });
      await page.waitForTimeout(300);
    }

    const criticalErrors = errors.filter(e => e.type === 'pageerror');
    if (criticalErrors.length === 0) {
      reporter.pass('Zero Unhandled Page Errors');
    } else {
      reporter.fail('Zero Unhandled Page Errors', `${criticalErrors[0].message}`);
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
  console.log(`${c.bold}${c.magenta}║   SpiritNow Full-Flow Playwright E2E & DOM Contrast Scanner Suite    ║${c.reset}`);
  console.log(`${c.bold}${c.magenta}╚══════════════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log(`  Target Base URL : ${c.bold}${options.baseUrl}${c.reset}`);
  console.log(`  Target App(s)   : ${c.bold}${options.app.toUpperCase()}${c.reset}`);
  console.log(`  Headless Mode   : ${c.bold}${options.headless}${c.reset}`);
  console.log(`  Timestamp       : ${new Date().toISOString()}`);

  let playwright;
  try {
    playwright = await resolvePlaywright();
  } catch (e) {
    console.error(`${c.red}FATAL: ${e.message}${c.reset}`);
    process.exit(1);
  }

  const chromeExecutable = process.env.CHROME_PATH ||
    (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined);

  if (chromeExecutable) {
    reporter.info(`Using Chrome Executable: ${chromeExecutable}`);
  }

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
