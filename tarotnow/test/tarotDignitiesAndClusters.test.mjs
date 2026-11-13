import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  MAJOR_ARCANA_ELEMENTS,
  resolveCardElement,
  classifyElementalDignity,
  computeElementalDignities,
  computeArchetypeClusters,
  composeSpreadSummary,
} from '../src/utils/tarotLogic.js';
import { buildTarotPromptText } from '../src/utils/buildTarotPromptText.mjs';

const cardsPath = path.resolve(import.meta.dirname, '../public/data/cards.json');
const fullDeck = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

function pickById(id, orientation = 'upright') {
  const found = fullDeck.find((c) => c.id === id);
  assert.ok(found, `Expected card "${id}" in cards.json`);
  return { ...found, orientation };
}

const EXPECTED_GOLDEN_DAWN_MAJORS = {
  0: 'Air',      // Fool
  1: 'Air',      // Magician
  2: 'Water',    // High Priestess
  3: 'Earth',    // Empress
  4: 'Fire',     // Emperor
  5: 'Earth',    // Hierophant
  6: 'Air',      // Lovers
  7: 'Water',    // Chariot
  8: 'Fire',     // Strength
  9: 'Earth',    // Hermit
  10: 'Fire',    // Wheel of Fortune
  11: 'Air',     // Justice
  12: 'Water',   // Hanged Man
  13: 'Water',   // Death
  14: 'Fire',    // Temperance
  15: 'Earth',   // Devil
  16: 'Fire',    // Tower
  17: 'Air',     // Star
  18: 'Water',   // Moon
  19: 'Fire',    // Sun
  20: 'Fire',    // Judgement
  21: 'Earth',   // World
};

test('resolveCardElement accurately maps all 78 cards (22 Golden Dawn Majors + 56 Minors) and minimal history records', () => {
  assert.equal(fullDeck.length, 78);
  assert.deepEqual(MAJOR_ARCANA_ELEMENTS, EXPECTED_GOLDEN_DAWN_MAJORS);

  const majors = fullDeck.filter((c) => c.arcana === 'Major');
  assert.equal(majors.length, 22);
  for (const card of majors) {
    const elem = resolveCardElement(card);
    assert.equal(
      elem,
      EXPECTED_GOLDEN_DAWN_MAJORS[card.number],
      `Major #${card.number} (${card.name}) should map to ${EXPECTED_GOLDEN_DAWN_MAJORS[card.number]}`
    );
    // Minimal history record fallback (id/name only, no arcana/suit)
    assert.equal(
      resolveCardElement({ id: card.id, name: card.name }),
      EXPECTED_GOLDEN_DAWN_MAJORS[card.number]
    );
  }

  const minors = fullDeck.filter((c) => c.arcana === 'Minor');
  assert.equal(minors.length, 56);
  const expectedSuitMap = {
    Wands: 'Fire',
    Cups: 'Water',
    Swords: 'Air',
    Pentacles: 'Earth',
  };

  for (const card of minors) {
    const expected = expectedSuitMap[card.suit];
    assert.equal(resolveCardElement(card), expected, `${card.name} should map to ${expected}`);
    assert.equal(resolveCardElement({ id: card.id, name: card.name }), expected);
  }
});

test('classifyElementalDignity distinguishes Identical, Friendly (Fire+Air / Water+Earth), Contrary (Fire+Water / Air+Earth), and Neutral', () => {
  // Identical
  assert.equal(classifyElementalDignity('Fire', 'Fire', 'vi').type, 'identical');
  assert.equal(classifyElementalDignity('Water', 'Water', 'en').type, 'identical');

  // Friendly / Active Reinforcing
  assert.equal(classifyElementalDignity('Fire', 'Air', 'vi').type, 'friendly');
  assert.equal(classifyElementalDignity('Air', 'Fire', 'en').type, 'friendly');
  assert.equal(classifyElementalDignity('Water', 'Earth', 'vi').type, 'friendly');
  assert.equal(classifyElementalDignity('Earth', 'Water', 'en').type, 'friendly');

  // Contrary / Weakening
  assert.equal(classifyElementalDignity('Fire', 'Water', 'vi').type, 'contrary');
  assert.equal(classifyElementalDignity('Water', 'Fire', 'en').type, 'contrary');
  assert.equal(classifyElementalDignity('Air', 'Earth', 'vi').type, 'contrary');
  assert.equal(classifyElementalDignity('Earth', 'Air', 'en').type, 'contrary');

  // Neutral / Mediated
  assert.equal(classifyElementalDignity('Fire', 'Earth', 'vi').type, 'neutral');
  assert.equal(classifyElementalDignity('Water', 'Air', 'en').type, 'neutral');
});

test('computeElementalDignities evaluates adjacent pairs, Golden Dawn 3-card flanking triads, and missing elements', () => {
  // Strongly-dignified triad: Wands (Fire) + Fool (Air) + Tower (Fire) -> Fool (Air) flanked by friendly Fire on both sides
  const friendlySpread = [
    pickById('wands-ace'),    // Fire
    pickById('major-0'),      // Air (Fool)
    pickById('major-16'),     // Fire (Tower)
  ];
  const resFriendly = computeElementalDignities(
    friendlySpread,
    ['Quá khứ', 'Hiện tại', 'Tương lai'],
    { language: 'vi', perspective: 'career' }
  );

  assert.equal(resFriendly.pairs.length, 2);
  assert.equal(resFriendly.pairs[0].type, 'friendly');
  assert.equal(resFriendly.pairs[1].type, 'friendly');
  assert.equal(resFriendly.triads.length, 1);
  assert.equal(resFriendly.triads[0].status, 'strongly-dignified');
  assert.ok(resFriendly.missingElements.includes('Earth'));
  assert.ok(resFriendly.missingElements.includes('Water'));
  // Career reading with 0 Earth highlights execution plan caution
  assert.ok(
    resFriendly.missingInsights.some((m) => m.element === 'Earth' && /kế hoạch|thực thi/i.test(m.message))
  );

  // Ill-dignified triad: Cups (Water) + Sun (Fire) + Moon (Water) -> Fire boxed in by contrary Water on both sides
  const contrarySpread = [
    pickById('cups-two'),     // Water
    pickById('major-19'),     // Fire (Sun)
    pickById('major-18'),     // Water (Moon)
  ];
  const resContrary = computeElementalDignities(
    contrarySpread,
    ['Suy nghĩ', 'Trọng tâm', 'Kết quả'],
    { language: 'en', perspective: 'love' }
  );

  assert.equal(resContrary.pairs[0].type, 'contrary');
  assert.equal(resContrary.pairs[1].type, 'contrary');
  assert.equal(resContrary.triads[0].status, 'ill-dignified');
  assert.equal(resContrary.overallHarmony, 'tense');
});

test('computeArchetypeClusters detects repeated Pip numbers, ascending/descending progressions, Court density, and Major Arcana ratio', () => {
  // 1. Repeated Aces + Ascending progression (Ace -> Two -> Three)
  const pipCards = [
    pickById('wands-ace'),
    pickById('cups-ace'),
    pickById('swords-two'),
    pickById('pentacles-three'),
  ];
  const pipClusters = computeArchetypeClusters(pipCards, 'vi');
  assert.equal(pipClusters.repeatedRanks.length, 1);
  assert.equal(pipClusters.repeatedRanks[0].number, 1);
  assert.equal(pipClusters.repeatedRanks[0].count, 2);
  assert.equal(pipClusters.progression.direction, 'ascending');
  assert.deepEqual(pipClusters.progression.sequence, [1, 1, 2, 3]);

  // 2. Descending progression (Ten -> Six -> Two)
  const descCards = [
    pickById('swords-ten'),
    pickById('cups-six'),
    pickById('pentacles-two'),
  ];
  const descClusters = computeArchetypeClusters(descCards, 'en');
  assert.equal(descClusters.progression.direction, 'descending');
  assert.deepEqual(descClusters.progression.sequence, [10, 6, 2]);

  // 3. Court Card density (>= 2) + Karmic Major Arcana ratio (>= 50% in >= 3 cards)
  const heavySpread = [
    pickById('major-10'),       // Wheel
    pickById('major-11'),       // Justice
    pickById('swords-queen'),   // Court
    pickById('pentacles-king'), // Court
  ];
  const heavyClusters = computeArchetypeClusters(heavySpread, 'vi');
  assert.equal(heavyClusters.courtCards.isCluster, true);
  assert.equal(heavyClusters.courtCards.count, 2);
  assert.equal(heavyClusters.majorArcana.isKarmicTurningPoint, true);
  assert.equal(heavyClusters.majorArcana.ratio, 0.5);
});

test('composeSpreadSummary and buildTarotPromptText propagate custom position names and Elemental Dignities digest', () => {
  const sampleCards = [
    pickById('wands-three', 'upright'),
    pickById('swords-ace', 'upright'),
    pickById('pentacles-eight', 'reversed'),
  ];
  const customPositions = [
    'Phương án A: Chuyển việc',
    'Phương án B: Ở lại',
    'Lời khuyên cốt lõi',
  ];

  const summary = composeSpreadSummary(
    sampleCards,
    'custom',
    'career',
    'vi',
    'Tôi nên chọn hướng nào trong quý tới?',
    42,
    customPositions
  );

  assert.deepEqual(
    summary.positions.map((p) => p.position),
    customPositions
  );
  assert.ok(summary.dignities?.summaryText.length > 10);
  assert.ok(Array.isArray(summary.clusters?.highlights));

  const promptText = buildTarotPromptText({
    language: 'vi',
    question: 'Tôi nên chọn hướng nào trong quý tới?',
    drawnCards: sampleCards,
    spreadName: 'So sánh A/B',
    spreadPositions: customPositions,
    interpretationContext: 'Công việc (Career)',
    interpretationSummary: summary.coreMessage,
    getCardMeaning: () => 'Ý nghĩa thử nghiệm',
  });

  assert.match(promptText, /Phương án A: Chuyển việc/);
  assert.match(promptText, /Phương án B: Ở lại/);
  assert.match(promptText, /Tương tác Nguyên tố & Cấu trúc Trải bài/i);
  assert.match(promptText, /Tương trợ đắc lực/);
});
