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

test('saved daily card is restored by ID and reproduces exactly the orientation chosen by getDailyTarotCard', () => {
  const uprightDay = new Date(2026, 9, 23, 12);
  const dailyUpright = getDailyTarotCard(cards, uprightDay);
  const savedUpright = getSavedDailyTarotCard(cards, dailyUpright.id, uprightDay);

  assert.equal(savedUpright?.id, dailyUpright.id);
  assert.equal(savedUpright?.orientation, dailyUpright.orientation);
  assert.equal(savedUpright?.orientation, 'upright');

  // October 5, 2026 selects reversed orientation
  const reversedDay = new Date(2026, 9, 5, 12);
  const dailyReversed = getDailyTarotCard(cards, reversedDay);
  const savedReversed = getSavedDailyTarotCard(cards, dailyReversed.id, reversedDay);

  assert.equal(dailyReversed.orientation, 'reversed');
  assert.equal(savedReversed?.id, dailyReversed.id);
  assert.equal(savedReversed?.orientation, dailyReversed.orientation);
  assert.equal(savedReversed?.orientation, 'reversed');

  assert.equal(getSavedDailyTarotCard(cards, 'missing', uprightDay), null);
  assert.equal(getSavedDailyTarotCard([], 'two', uprightDay), null);
  assert.equal(getSavedDailyTarotCard(cards, null, uprightDay), null);
  assert.equal(getSavedDailyTarotCard(cards, undefined, uprightDay), null);
});
