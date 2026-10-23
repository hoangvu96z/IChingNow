import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SPREAD_ID,
  SPREADS,
  analyzeSpreadPatterns,
  composeSpreadSummary,
  computePatternMetrics,
  getCardMeaning,
  getDailyTarotCard,
  getMeaningField,
  getSavedDailyTarotCard,
  normalizeSpreadId,
  pickMainTension,
} from '../src/utils/tarotLogic.js';

function createCards(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Card ${index + 1}`,
    arcana: 'Minor',
    suit: 'Cups',
    rank: 'Ace',
    orientation: 'upright',
    meanings: { general_upright: 'A useful reminder.' },
  }));
}

test('getCardMeaning prefers the requested context and falls back to upright context meaning', () => {
  const card = {
    meanings: {
      career_upright: 'career guidance',
      general_upright: 'general guidance',
      general_reversed: 'general reversed guidance',
    },
  };

  assert.equal(getCardMeaning(card, 'career', 'upright'), 'career guidance');
  assert.equal(getCardMeaning(card, 'career', 'reversed'), 'career guidance');
  assert.equal(getCardMeaning(card, 'unknown', 'reversed'), 'general reversed guidance');
});

test('getCardMeaning falls back to the general upright meaning when a variant is missing', () => {
  const card = { meanings: { general_upright: 'general guidance' } };

  assert.equal(getCardMeaning(card, 'unknown', 'reversed'), 'general guidance');
});

test('default and legacy spread IDs resolve to registered presets', () => {
  assert.equal(DEFAULT_SPREAD_ID, 'ppf');
  assert.ok(SPREADS.some((spread) => spread.id === DEFAULT_SPREAD_ID));
  assert.equal(normalizeSpreadId('past-present-future'), 'ppf');
  assert.equal(normalizeSpreadId('1-card'), 'single');
  assert.equal(normalizeSpreadId('unknown-spread'), DEFAULT_SPREAD_ID);
});

test('summary positions match the selected five, seven, and ten-card presets', () => {
  const career = composeSpreadSummary(createCards(5), 'career-5', 'career', 'en', '', 123);
  const horseshoe = composeSpreadSummary(createCards(7), 'horseshoe', 'general', 'en', '', 123);
  const relationship = composeSpreadSummary(createCards(7), 'relationship-7', 'love', 'en', '', 123);
  const celticCross = composeSpreadSummary(createCards(10), 'celtic-cross', 'general', 'en', '', 123);

  assert.equal(career.positions[3].position, 'Skill or decision to prioritize');
  assert.equal(horseshoe.positions[3].position, 'Near future');
  assert.equal(relationship.positions[1].position, 'How your partner sees the relationship');
  assert.equal(celticCross.positions[3].position, 'Short-term direction ahead');
  assert.equal(celticCross.positions[9].position, 'Outcome if current rhythm is kept');
});

test('summary templates stay stable for the same reading inputs', () => {
  const cards = createCards(3);
  const first = composeSpreadSummary(cards, 'ppf', 'general', 'en', 'same question');
  const second = composeSpreadSummary(cards, 'ppf', 'general', 'en', 'same question');
  const explicitlySeededFirst = composeSpreadSummary(cards, 'ppf', 'general', 'en', 'same question', 123);
  const explicitlySeededSecond = composeSpreadSummary(cards, 'ppf', 'general', 'en', 'same question', 123);

  assert.equal(first.intro, second.intro);
  assert.equal(first.advice, second.advice);
  assert.equal(explicitlySeededFirst.intro, explicitlySeededSecond.intro);
  assert.equal(explicitlySeededFirst.advice, explicitlySeededSecond.advice);
});

test('getMeaningField and getCardMeaning return safe empty string for null and undefined card', () => {
  assert.equal(getMeaningField(null, 'general', 'upright'), '');
  assert.equal(getMeaningField(undefined, 'love', 'reversed'), '');
  assert.equal(getCardMeaning(null, 'career', 'upright'), '');
  assert.equal(getCardMeaning(undefined, 'action', 'reversed'), '');
  assert.equal(getCardMeaning(null), '');
});

test('yes-no spread provides its explicit answer position label in Vietnamese and English', () => {
  const cardVi = composeSpreadSummary(createCards(1), 'yes-no', 'general', 'vi', '', 123);
  assert.equal(cardVi.positions.length, 1);
  assert.equal(cardVi.positions[0].position, 'Câu trả lời');

  const cardEn = composeSpreadSummary(createCards(1), 'yes-no', 'general', 'en', '', 123);
  assert.equal(cardEn.positions.length, 1);
  assert.equal(cardEn.positions[0].position, 'Answer');

  // Verify it does not fall back to the 3-card spread positions
  assert.notEqual(cardVi.positions[0].position, 'Điều đang nâng đỡ bạn');
  assert.notEqual(cardEn.positions[0].position, 'What is supporting you');
});

test('computePatternMetrics handles empty and non-array inputs without NaN', () => {
  const emptyMetrics = computePatternMetrics([]);
  assert.equal(emptyMetrics.total, 0);
  assert.equal(emptyMetrics.majorRatio, 0);
  assert.equal(emptyMetrics.reversedRatio, 0);
  assert.equal(emptyMetrics.dominantSuit, null);
  assert.equal(emptyMetrics.dominantSuitRatio, 0);
  assert.equal(emptyMetrics.courtRatio, 0);
  assert.ok(!Number.isNaN(emptyMetrics.majorRatio));
  assert.ok(!Number.isNaN(emptyMetrics.dominantSuitRatio));

  const nullMetrics = computePatternMetrics(null);
  assert.equal(nullMetrics.total, 0);
  assert.equal(nullMetrics.dominantSuit, null);
  assert.ok(!Number.isNaN(nullMetrics.majorRatio));

  const undefinedMetrics = computePatternMetrics(undefined);
  assert.equal(undefinedMetrics.total, 0);
  assert.equal(undefinedMetrics.dominantSuit, null);

  const objectMetrics = computePatternMetrics({});
  assert.equal(objectMetrics.total, 0);
  assert.equal(objectMetrics.dominantSuit, null);
});

test('computePatternMetrics and its callers safely handle the no-dominant-suit case', () => {
  const majorCards = [
    { id: 1, name: 'The Fool', arcana: 'Major', number: 0, orientation: 'upright' },
    { id: 2, name: 'The Magician', arcana: 'Major', number: 1, orientation: 'upright' },
  ];

  const metrics = computePatternMetrics(majorCards);
  assert.equal(metrics.total, 2);
  assert.equal(metrics.dominantSuit, null);
  assert.equal(metrics.dominantSuitRatio, 0);
  assert.equal(metrics.majorRatio, 1);

  // analyzeSpreadPatterns handles no-dominant-suit without throwing
  const patternsVi = analyzeSpreadPatterns(majorCards, 'vi');
  assert.deepEqual(patternsVi.tone, []);
  assert.equal(patternsVi.majorCount, 2);

  const patternsEn = analyzeSpreadPatterns(majorCards, 'en');
  assert.deepEqual(patternsEn.tone, []);

  // analyzeSpreadPatterns handles empty/null gracefully
  assert.deepEqual(analyzeSpreadPatterns([]).tone, []);
  assert.deepEqual(analyzeSpreadPatterns(null).tone, []);

  // pickMainTension handles no-dominant-suit gracefully
  const tension = pickMainTension(majorCards, metrics, 'general', 'vi');
  assert.ok(typeof tension === 'string' && tension.length > 0);

  // pickMainTension handles null metrics fallback
  const tensionFallback = pickMainTension(majorCards, null, 'general', 'vi');
  assert.equal(tension, tensionFallback);
});

test('composeSpreadSummary normalizes legacy spread IDs before selecting position roles', () => {
  const singleLegacy = composeSpreadSummary(createCards(1), '1-card', 'general', 'en', '', 123);
  assert.equal(singleLegacy.positions.length, 1);
  assert.equal(singleLegacy.positions[0].position, 'What you need to know right now');

  const ppfLegacy = composeSpreadSummary(createCards(3), 'past-present-future', 'general', 'en', '', 123);
  assert.equal(ppfLegacy.positions.length, 3);
  assert.equal(ppfLegacy.positions[0].position, 'What is supporting you');
  assert.equal(ppfLegacy.positions[1].position, 'What is keeping you stuck');
  assert.equal(ppfLegacy.positions[2].position, 'Paths that can open up');
});

test('getSavedDailyTarotCard reproduces exact orientation of getDailyTarotCard for same date and card', () => {
  const cards = [
    { id: 'c1', name: 'Card 1' },
    { id: 'c2', name: 'Card 2' },
    { id: 'c3', name: 'Card 3' },
  ];
  for (let day = 1; day <= 30; day++) {
    const date = new Date(2026, 9, day, 12);
    const daily = getDailyTarotCard(cards, date);
    const saved = getSavedDailyTarotCard(cards, daily.id, date);
    assert.equal(saved.id, daily.id);
    assert.equal(saved.orientation, daily.orientation);
  }
});
