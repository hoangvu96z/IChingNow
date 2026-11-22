import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTourStepTarget, clampTooltipPosition } from '../src/components/guidedTourUtils.js';

test('resolveTourStepTarget selects first visible element from comma-separated selectors', () => {
  const hiddenEl = { getBoundingClientRect: () => ({ width: 0, height: 0 }) };
  const visibleEl = { getBoundingClientRect: () => ({ width: 200, height: 60, top: 40, left: 20 }) };

  const fakeDoc = {
    querySelectorAll(sel) {
      if (sel === '.missing') return [];
      if (sel === '#hidden') return [hiddenEl];
      if (sel === '#visible') return [visibleEl];
      return [];
    },
  };

  assert.equal(resolveTourStepTarget({ selector: '.missing, #hidden, #visible' }, fakeDoc), visibleEl);
  assert.equal(resolveTourStepTarget({ selector: '.missing, #hidden' }, fakeDoc), null);
  assert.equal(resolveTourStepTarget(null, fakeDoc), null);
});

test('clampTooltipPosition centers when targetRect is null and clamps within viewport otherwise', () => {
  const centered = clampTooltipPosition(null, { width: 1200, height: 800 }, { width: 380, height: 260 });
  assert.equal(centered.placement, 'center');
  assert.equal(centered.left, 410);
  assert.equal(centered.top, 270);

  // Target near bottom-right should flip above and clamp left inside viewport
  const flipped = clampTooltipPosition(
    { top: 600, bottom: 760, left: 1050, right: 1250, width: 200, height: 160 },
    { width: 1280, height: 800 },
    { width: 380, height: 260 },
    14
  );
  assert.equal(flipped.placement, 'top');
  assert.ok(flipped.left + flipped.width <= 1280 - 14);
  assert.ok(flipped.top >= 14 && flipped.top <= 600 - 260);

  // Target near top should place below
  const below = clampTooltipPosition(
    { top: 40, bottom: 120, left: 100, right: 400, width: 300, height: 80 },
    { width: 1280, height: 800 },
    { width: 380, height: 260 },
    14
  );
  assert.equal(below.placement, 'bottom');
  assert.equal(below.top, 134);
});
