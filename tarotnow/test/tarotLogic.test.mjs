import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SPREAD_ID,
  SPREADS,
  composeSpreadSummary,
  getCardMeaning,
  normalizeSpreadId,
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
