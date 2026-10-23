import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyTarotCard,
  getSavedDailyTarotCard,
} from '../src/utils/tarotLogic.js';

const cards = [
  { id: 'one', meanings: { general_upright: 'one meaning' } },
  { id: 'two', meanings: { general_upright: 'two meaning' } },
  { id: 'three', meanings: { general_upright: 'three meaning' } },
];

test('daily Tarot selection is stable for one local date and follows the date seed', () => {
  const day = new Date(2026, 9, 23, 12);
  const sameDay = new Date(2026, 9, 23, 21);
  const differentSeed = new Date(2030, 0, 1, 12);

  assert.deepEqual(getDailyTarotCard(cards, day), getDailyTarotCard(cards, sameDay));
  assert.equal(getDailyTarotCard(cards, day)?.id, 'two');
  assert.equal(getDailyTarotCard(cards, differentSeed)?.id, 'three');
  assert.equal(getDailyTarotCard([], day), null);
});

test('saved daily card is restored by ID with TarotNow’s current orientation rule', () => {
  const day = new Date(2026, 9, 23, 12);
  const saved = getSavedDailyTarotCard(cards, 'three', day);

  assert.equal(saved?.id, 'three');
  assert.equal(saved?.orientation, 'upright');
  assert.equal(getSavedDailyTarotCard(cards, 'missing', day), null);
});
