/**
 * PWA installation metadata, browser capability detection, single-use prompt
 * capture (`beforeinstallprompt` + Web Install API `navigator.install()`),
 * and `<dialog closedby="any">` light-dismiss fallback for the 4 PWA apps.
 */

export const PWA_APP_META = Object.freeze({
  iching: Object.freeze({
    appId: 'iching',
    shortName: 'IChingNow',
    name: 'IChingNow — Kinh Dịch',
    manifest: '/kinhdich/manifest.webmanifest',
    manifestId: '/kinhdich/',
    icon: '/kinhdich/icon-192.png',
  }),
  tarot: Object.freeze({
    appId: 'tarot',
    shortName: 'TarotNow',
    name: 'TarotNow',
    manifest: '/tarot/manifest.webmanifest',
    manifestId: '/tarot/',
    icon: '/tarot/icon-192.png',
  }),
  tuvi: Object.freeze({
    appId: 'tuvi',
    shortName: 'TuViNow',
    name: 'TuViNow — Tử Vi Đẩu Số',
    manifest: '/tuvi/manifest.webmanifest',
    manifestId: '/tuvi/',
    icon: '/tuvi/icon-192.png',
  }),
  notenow: Object.freeze({
    appId: 'notenow',
    shortName: 'NoteNow',
    name: 'NoteNow — Ghi chú',
    manifest: '/note/manifest.webmanifest',
    manifestId: '/note/',
    icon: '/note/icon-192.png',
  }),
});

export function getPwaAppMeta(appId) {
  if (!appId || !Object.hasOwn(PWA_APP_META, appId)) {
    return null;
  }
  return PWA_APP_META[appId];
}

export function supportsWebInstallApi(
  navProto = typeof Navigator !== 'undefined' ? Navigator.prototype : null,
) {
  return typeof navProto?.install === 'function';
}

export function isStandaloneDisplay(
  win = typeof window !== 'undefined' ? window : null,
  nav = typeof navigator !== 'undefined' ? navigator : null,
) {
  if (!win && !nav) return false;
  if (nav?.standalone === true) return true;
  if (typeof win?.matchMedia === 'function') {
    if (win.matchMedia('(display-mode: standalone)')?.matches) return true;
    if (win.matchMedia('(display-mode: window-controls-overlay)')?.matches) return true;
  }
  return false;
}

export function detectInstallPlatform(
  nav = typeof navigator !== 'undefined' ? navigator : null,
) {
  const ua = String(nav?.userAgent || '');
  const maxTouchPoints = Number(nav?.maxTouchPoints || 0);

  if (/iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Firefox\//i.test(ua)) {
    return 'firefox';
  }
  if (
    /Macintosh/i.test(ua) &&
    /Safari\//i.test(ua) &&
    !/Chrom(e|ium)|Edg|OPR|Brave|Vivaldi|Arc/i.test(ua)
  ) {
    return 'macos-safari';
  }
  return 'chromium-or-other';
}

export function getInstallOnboardingSteps(platform, shortName = 'ứng dụng') {
  switch (platform) {
    case 'ios':
      return [
        'Nhấn biểu tượng Chia sẻ (↑) trên thanh địa chỉ / công cụ Safari.',
        `Chọn "Thêm vào MH chính" (Add to Home Screen) → nhấn "Thêm" để cài ${shortName}.`,
      ];
    case 'macos-safari':
      return [
        'Trên thanh menu Safari, mở Tệp (File) hoặc nhấn biểu tượng Chia sẻ (↑).',
        `Chọn "Thêm vào Dock…" (Add to Dock…) → nhấn "Thêm" để cài ${shortName}.`,
      ];
    case 'firefox':
      return [
        `Trên máy tính: mở trang bằng Chrome, Edge hoặc Safari (macOS) để cài ${shortName} như ứng dụng riêng.`,
        'Trên điện thoại Android: mở menu trình duyệt (⋮) → chọn "Cài đặt" hoặc "Thêm ứng dụng vào màn hình chính".',
      ];
    default:
      return [
        'Nhấn biểu tượng Cài đặt (⊕ / màn hình có mũi tên xuống) ở góc phải thanh địa chỉ trình duyệt.',
        `Hoặc mở menu trình duyệt (⋮ / ⋯) → chọn "Cài đặt ${shortName}" / "Thêm vào màn hình chính".`,
      ];
  }
}

// --- Module-level browser prompt state so early `beforeinstallprompt` events are captured ---
let deferredInstallPrompt;
let installedInSession = false;
const listeners = new Set();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = undefined;
    installedInSession = true;
    notifyListeners();
  });

  const standaloneMql = window.matchMedia?.('(display-mode: standalone)');
  standaloneMql?.addEventListener?.('change', notifyListeners);
}

let cachedSnapshot = null;

export function getPwaInstallSnapshot() {
  const webInstall = supportsWebInstallApi();
  const hasDeferredPrompt = Boolean(deferredInstallPrompt);
  const standalone = installedInSession || isStandaloneDisplay();
  const canDirectInstall = webInstall || hasDeferredPrompt;

  if (
    cachedSnapshot &&
    cachedSnapshot.isStandalone === standalone &&
    cachedSnapshot.supportsWebInstall === webInstall &&
    cachedSnapshot.hasDeferredPrompt === hasDeferredPrompt &&
    cachedSnapshot.canDirectInstall === canDirectInstall
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = Object.freeze({
    isStandalone: standalone,
    supportsWebInstall: webInstall,
    hasDeferredPrompt,
    canDirectInstall,
  });
  return cachedSnapshot;
}

export function subscribePwaInstall(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Invoke directly from a click handler to preserve transient user activation.
 */
export async function triggerPwaInstall(env = {}) {
  const nav = env.nav ?? (typeof navigator !== 'undefined' ? navigator : null);
  const webInstallSupported =
    env.supportsWebInstall ??
    (typeof nav?.install === 'function' && supportsWebInstallApi());

  try {
    if (webInstallSupported && typeof nav?.install === 'function') {
      // MANDATORY: Call during the click handler; delayed calls lose user activation.
      await nav.install();
      if (!env.isolated) {
        installedInSession = true;
        notifyListeners();
      }
      return { outcome: 'accepted', message: 'Đã cài đặt hoặc mở ứng dụng.' };
    }

    const promptEvent = env.isolated ? env.deferredPrompt : deferredInstallPrompt;
    if (promptEvent) {
      // Save and clear the single-use event before awaiting the user's choice.
      if (env.isolated) {
        env.onClearDeferredPrompt?.();
      } else {
        deferredInstallPrompt = undefined;
        notifyListeners();
      }

      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      const accepted = choice?.outcome === 'accepted';
      if (accepted && !env.isolated) {
        installedInSession = true;
        notifyListeners();
      }
      return {
        outcome: accepted ? 'accepted' : 'dismissed',
        message: accepted ? 'Đã cài đặt ứng dụng.' : 'Đã hủy cài đặt.',
      };
    }

    return { outcome: 'unavailable', message: '' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      // Cancellation is an expected user choice; keep the button available to retry.
      return { outcome: 'aborted', message: 'Đã hủy cài đặt ứng dụng.' };
    }
    console.error(error);
    return { outcome: 'error', message: 'Không thể khởi chạy cài đặt.' };
  }
}

/**
 * Light-dismiss fallback for `<dialog closedby="any">` in browsers lacking native `closedBy` (e.g. Safari).
 */
export function attachDialogLightDismiss(
  dialog,
  DialogProto = typeof HTMLDialogElement !== 'undefined' ? HTMLDialogElement.prototype : null,
) {
  if (!dialog) return () => {};
  if (!dialog.hasAttribute?.('closedby')) {
    dialog.setAttribute?.('closedby', 'any');
  }
  if (DialogProto && 'closedBy' in DialogProto) {
    return () => {};
  }

  // Test the pointer position, not event.target: the <dialog> is also the target for its own
  // padding and the gaps between its children, so a target check would close on those clicks.
  const outside = (e) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  let pressedOutside = false;
  const onPointerDown = (e) => {
    pressedOutside = outside(e);
  };
  // Require the press and the release outside, so a text-selection drag that ends on the backdrop does not dismiss.
  const onPointerUp = (e) => {
    if (pressedOutside && outside(e)) {
      dialog.close();
    }
    pressedOutside = false;
  };

  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('pointerup', onPointerUp);
  return () => {
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('pointerup', onPointerUp);
  };
}

export function __setPwaInstallStateForTests({ deferredPrompt, installed = false } = {}) {
  deferredInstallPrompt = deferredPrompt;
  installedInSession = installed;
  notifyListeners();
}
