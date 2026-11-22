function isElementVisible(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }
  }
  return true;
}

/**
 * Resolve the first visible DOM element matching a step's selector list.
 */
export function resolveTourStepTarget(step, doc = typeof document !== 'undefined' ? document : null) {
  if (!step || !step.selector || !doc || typeof doc.querySelectorAll !== 'function') {
    return null;
  }
  const parts = String(step.selector)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sel of parts) {
    try {
      const candidates = doc.querySelectorAll(sel);
      for (const el of candidates) {
        if (isElementVisible(el)) return el;
      }
    } catch {
      // Ignore invalid selector fragments
    }
  }
  return null;
}

/**
 * Clamp floating tooltip coordinates inside the viewport next to a spotlighted rect.
 */
export function clampTooltipPosition(
  targetRect,
  viewport = { width: 1280, height: 800 },
  cardSize = { width: 370, height: 260 },
  margin = 14
) {
  const vw = Math.max(300, Number(viewport?.width) || 1280);
  const vh = Math.max(360, Number(viewport?.height) || 800);
  const cw = Math.min(vw - margin * 2, Number(cardSize?.width) || 370);
  const ch = Math.min(vh - margin * 2, Number(cardSize?.height) || 260);

  if (!targetRect) {
    return {
      left: Math.max(margin, Math.round((vw - cw) / 2)),
      top: Math.max(margin, Math.round((vh - ch) / 2)),
      placement: 'center',
      width: cw,
    };
  }

  const centerX = targetRect.left + targetRect.width / 2;
  const left = Math.max(margin, Math.min(vw - cw - margin, Math.round(centerX - cw / 2)));

  const spaceBelow = vh - targetRect.bottom - margin;
  const spaceAbove = targetRect.top - margin;

  let top;
  let placement;
  if (spaceBelow >= ch || spaceBelow >= spaceAbove) {
    placement = 'bottom';
    top = Math.min(vh - ch - margin, Math.max(margin, Math.round(targetRect.bottom + 14)));
  } else {
    placement = 'top';
    top = Math.max(margin, Math.round(targetRect.top - ch - 14));
  }

  return { left, top, placement, width: cw };
}
