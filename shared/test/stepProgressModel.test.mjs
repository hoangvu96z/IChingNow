import test from 'node:test';
import assert from 'node:assert/strict';
import { getStepProgressItems } from '../src/components/CombinedReading/stepProgressModel.js';

test('Tu Vi step labels map navigation steps without a birth-info step', () => {
  const items = getStepProgressItems({
    step: 3,
    hasChart: true,
    isVi: true,
    hasPrecastHex: false,
    maxStepReached: 3,
    hoveredStep: null,
    topic: 'career',
    localBirthInfo: null,
    aiResponse: '',
  });

  assert.deepEqual(items.map(({ label, actualStep }) => [label, actualStep]), [
    ['Chủ đề', 1],
    ['Hỏi & Gieo quẻ', 3],
    ['Luận giải AI', 4],
  ]);
  assert.equal(items[1].isActive, true);
  assert.equal(items[2].isClickable, false);
});

test('I Ching navigation unlocks birth info and uses the precast label', () => {
  const items = getStepProgressItems({
    step: 1,
    hasChart: false,
    isVi: false,
    hasPrecastHex: true,
    maxStepReached: 1,
    hoveredStep: null,
    topic: 'career',
    localBirthInfo: null,
    aiResponse: '',
  });

  assert.deepEqual(items.map(({ label, actualStep }) => [label, actualStep]), [
    ['Topic', 1],
    ['Birth Info', 2],
    ['Confirm & Hex', 3],
    ['AI Reading', 4],
  ]);
  assert.equal(items[1].isClickable, true);
  assert.equal(items[2].isClickable, false);

  const withBirthInfo = getStepProgressItems({
    step: 2,
    hasChart: false,
    isVi: false,
    hasPrecastHex: true,
    maxStepReached: 2,
    hoveredStep: null,
    topic: 'career',
    localBirthInfo: { year: 1990 },
    aiResponse: '',
  });
  assert.equal(withBirthInfo[2].isClickable, true);
});
