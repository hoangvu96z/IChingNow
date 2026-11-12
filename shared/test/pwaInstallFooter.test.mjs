import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PWA_APP_META,
  __setPwaInstallStateForTests,
  attachDialogLightDismiss,
  detectInstallPlatform,
  getInstallOnboardingSteps,
  getPwaAppMeta,
  getPwaInstallSnapshot,
  isStandaloneDisplay,
  triggerPwaInstall,
} from '../src/utils/pwaInstall.mjs';

test('getPwaAppMeta returns metadata only for the 4 PWA apps and null for non-PWA apps', () => {
  assert.deepEqual(Object.keys(PWA_APP_META).sort(), ['iching', 'notenow', 'tarot', 'tuvi']);

  assert.equal(getPwaAppMeta('iching')?.shortName, 'IChingNow');
  assert.equal(getPwaAppMeta('tarot')?.shortName, 'TarotNow');
  assert.equal(getPwaAppMeta('tuvi')?.shortName, 'TuViNow');
  assert.equal(getPwaAppMeta('notenow')?.shortName, 'NoteNow');

  // Non-PWA apps and edge cases must return null
  assert.equal(getPwaAppMeta('talkwithme'), null);
  assert.equal(getPwaAppMeta('spiritnow'), null);
  assert.equal(getPwaAppMeta(undefined), null);
  assert.equal(getPwaAppMeta(''), null);
  assert.equal(getPwaAppMeta('toString'), null);
});

test('PWA_APP_META aligns with actual manifest.webmanifest files of the 4 PWA apps', () => {
  const repoRoot = path.resolve(import.meta.dirname, '../..');
  const appDirs = {
    iching: 'iching',
    tarot: 'tarotnow',
    tuvi: 'tuvinow',
    notenow: 'notenow',
  };

  for (const [appId, dirName] of Object.entries(appDirs)) {
    const meta = getPwaAppMeta(appId);
    const manifestPath = path.join(repoRoot, dirName, 'public', 'manifest.webmanifest');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.equal(manifest.id, meta.manifestId);
    assert.equal(manifest.short_name, meta.shortName);
    assert.ok(
      manifest.icons.some((icon) => icon.src === meta.icon),
      `Expected ${dirName} manifest icons to include ${meta.icon}`,
    );
  }
});

test('isStandaloneDisplay detects standalone media queries and iOS navigator.standalone', () => {
  assert.equal(isStandaloneDisplay(null, null), false);
  assert.equal(isStandaloneDisplay({}, { standalone: true }), true);

  const standaloneWin = {
    matchMedia: (q) => ({ matches: q === '(display-mode: standalone)' }),
  };
  assert.equal(isStandaloneDisplay(standaloneWin, {}), true);

  const browserTabWin = {
    matchMedia: () => ({ matches: false }),
  };
  assert.equal(isStandaloneDisplay(browserTabWin, { standalone: false }), false);
});

test('detectInstallPlatform and getInstallOnboardingSteps cover iOS, macOS Safari, Firefox, and Chromium', () => {
  assert.equal(
    detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile/15E148 Safari/604.1',
      maxTouchPoints: 5,
    }),
    'ios',
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.2 Safari/605.1.15',
      maxTouchPoints: 5, // iPadOS desktop-class UA
    }),
    'ios',
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      maxTouchPoints: 0,
    }),
    'macos-safari',
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36',
      maxTouchPoints: 0,
    }),
    'chromium-or-other',
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:138.0) Gecko/20100101 Firefox/138.0',
      maxTouchPoints: 0,
    }),
    'firefox',
  );

  for (const platform of ['ios', 'macos-safari', 'firefox', 'chromium-or-other']) {
    const steps = getInstallOnboardingSteps(platform, 'TuViNow');
    assert.equal(steps.length, 2);
    assert.ok(steps.some((step) => step.includes('TuViNow')));
  }
});

test('triggerPwaInstall handles navigator.install, single-use beforeinstallprompt, and AbortError', async () => {
  // 1. Web Install API (`navigator.install()`)
  let webInstallCalled = 0;
  const webRes = await triggerPwaInstall({
    isolated: true,
    supportsWebInstall: true,
    nav: {
      install: async () => {
        webInstallCalled += 1;
      },
    },
  });
  assert.equal(webInstallCalled, 1);
  assert.equal(webRes.outcome, 'accepted');

  // 2. AbortError during navigator.install keeps retry semantics graceful
  const abortRes = await triggerPwaInstall({
    isolated: true,
    supportsWebInstall: true,
    nav: {
      install: async () => {
        const err = new Error('User canceled');
        err.name = 'AbortError';
        throw err;
      },
    },
  });
  assert.equal(abortRes.outcome, 'aborted');

  // 3. Single-use `beforeinstallprompt` clears stored prompt BEFORE awaiting userChoice
  const callOrder = [];
  const fakePrompt = {
    prompt: async () => {
      callOrder.push('prompt');
    },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  };

  __setPwaInstallStateForTests({ deferredPrompt: fakePrompt, installed: false });
  const snapWithPrompt = getPwaInstallSnapshot();
  assert.equal(snapWithPrompt.canDirectInstall, true);
  // Referential stability is mandatory for React 19 `useSyncExternalStore`
  assert.equal(getPwaInstallSnapshot(), snapWithPrompt);

  const bipRes = await triggerPwaInstall({ nav: {} });
  assert.equal(bipRes.outcome, 'accepted');
  assert.deepEqual(callOrder, ['prompt']);
  const snapAfterInstall = getPwaInstallSnapshot();
  assert.notEqual(snapAfterInstall, snapWithPrompt);
  assert.equal(snapAfterInstall.hasDeferredPrompt, false);
  assert.equal(snapAfterInstall.isStandalone, true);
  assert.equal(getPwaInstallSnapshot(), snapAfterInstall);

  __setPwaInstallStateForTests({ deferredPrompt: undefined, installed: false });
  assert.equal(getPwaInstallSnapshot(), getPwaInstallSnapshot());
});

test('attachDialogLightDismiss enforces bounding-rect press+release outside when closedBy is missing', () => {
  const handlers = {};
  let closeCount = 0;
  const attrs = new Map();

  const fakeDialog = {
    hasAttribute: (k) => attrs.has(k),
    setAttribute: (k, v) => attrs.set(k, v),
    getBoundingClientRect: () => ({ left: 100, right: 300, top: 100, bottom: 250 }),
    addEventListener: (type, fn) => {
      handlers[type] = fn;
    },
    removeEventListener: (type, fn) => {
      if (handlers[type] === fn) delete handlers[type];
    },
    close: () => {
      closeCount += 1;
    },
  };

  // Native closedBy present -> no manual pointer listeners attached
  const noopCleanup = attachDialogLightDismiss(fakeDialog, { closedBy: 'any' });
  assert.equal(attrs.get('closedby'), 'any');
  assert.equal(handlers.pointerdown, undefined);
  noopCleanup();

  // Native closedBy missing -> pointerdown + pointerup fallback attached
  const cleanup = attachDialogLightDismiss(fakeDialog, {});
  assert.equal(typeof handlers.pointerdown, 'function');
  assert.equal(typeof handlers.pointerup, 'function');

  // Click inside dialog padding -> does NOT close
  handlers.pointerdown({ clientX: 150, clientY: 150 });
  handlers.pointerup({ clientX: 150, clientY: 150 });
  assert.equal(closeCount, 0);

  // Drag starting inside and ending outside -> does NOT close
  handlers.pointerdown({ clientX: 150, clientY: 150 });
  handlers.pointerup({ clientX: 20, clientY: 20 });
  assert.equal(closeCount, 0);

  // Press AND release outside -> closes dialog
  handlers.pointerdown({ clientX: 20, clientY: 20 });
  handlers.pointerup({ clientX: 25, clientY: 25 });
  assert.equal(closeCount, 1);

  cleanup();
  assert.equal(handlers.pointerdown, undefined);
  assert.equal(handlers.pointerup, undefined);
});
