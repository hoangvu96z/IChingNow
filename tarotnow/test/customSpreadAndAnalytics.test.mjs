import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  CUSTOM_SPREAD_STORAGE_KEY,
  STARTER_CUSTOM_SPREAD_PRESETS,
  resolveCustomSpreadPositions,
  validateCustomSpreadTemplate,
  loadCustomSpreadTemplates,
  saveCustomSpreadTemplate,
  deleteCustomSpreadTemplate,
} from '../src/utils/customSpreadUtils.js';
import {
  filterDeckCards,
  createEmptyPhysicalSlots,
  assignCardToPhysicalSlot,
  isCardPickedInAnotherSlot,
  togglePhysicalSlotOrientation,
  swapPhysicalSlots,
  clearPhysicalSlot,
  buildDrawnCardsFromPhysicalSlots,
} from '../src/utils/physicalDeckUtils.js';
import { computeTarotReadingInsights } from '../src/utils/tarotAnalytics.js';

const cardsPath = path.resolve(import.meta.dirname, '../public/data/cards.json');
const fullDeck = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('customSpreadUtils validates, persists, loads, deduplicates, and deletes custom spread templates under tarotnow_custom_spread_templates_v1', () => {
  assert.equal(CUSTOM_SPREAD_STORAGE_KEY, 'tarotnow_custom_spread_templates_v1');
  assert.ok(STARTER_CUSTOM_SPREAD_PRESETS.length >= 3);

  const storage = createMockStorage();

  // Reject missing name
  const missingName = validateCustomSpreadTemplate({
    name: '   ',
    count: 3,
    positions: ['Phương án A', 'Phương án B', 'Lời khuyên'],
  });
  assert.equal(missingName.valid, false);

  // Reject when all positions are blank
  const blankSlots = validateCustomSpreadTemplate({
    name: 'Sơ đồ trống',
    count: 3,
    positions: ['', '   ', ''],
  });
  assert.equal(blankSlots.valid, false);

  // Save valid template and auto-fill any unnamed trailing position with default label
  const saved = saveCustomSpreadTemplate(
    {
      name: 'So sánh việc A/B',
      count: 3,
      positions: ['Phương án A: Chuyển việc', 'Phương án B: Ở lại', ''],
    },
    storage,
    'vi'
  );
  assert.equal(saved.ok, true);
  assert.deepEqual(saved.template.positions, [
    'Phương án A: Chuyển việc',
    'Phương án B: Ở lại',
    'Vị trí 3',
  ]);

  const loaded = loadCustomSpreadTemplates(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].name, 'So sánh việc A/B');

  // Updating by same case-insensitive name replaces instead of duplicating
  const updated = saveCustomSpreadTemplate(
    {
      name: 'so sánh việc a/b',
      count: 3,
      positions: ['Hướng A', 'Hướng B', 'Lời khuyên chốt'],
    },
    storage,
    'vi'
  );
  assert.equal(updated.ok, true);
  assert.equal(updated.templates.length, 1);
  assert.equal(updated.templates[0].positions[2], 'Lời khuyên chốt');

  // Delete template
  const afterDelete = deleteCustomSpreadTemplate(updated.template.id, storage);
  assert.equal(afterDelete.length, 0);
  assert.deepEqual(
    resolveCustomSpreadPositions(['Vai trò 1', ''], 2, 'en'),
    ['Vai trò 1', 'Position 2']
  );
});

test('physicalDeckUtils searches 78 cards by Vietnamese/English names & numbers and prevents duplicate physical cards across slots', () => {
  // Search Vietnamese & English keywords
  const towerByVi = filterDeckCards(fullDeck, { query: 'Tháp' });
  assert.ok(towerByVi.some((c) => c.id === 'major-16'));

  const towerByEn = filterDeckCards(fullDeck, { query: 'Tower' });
  assert.ok(towerByEn.some((c) => c.id === 'major-16'));

  const threeSwordsVi = filterDeckCards(fullDeck, { query: '3 Kiếm' });
  assert.ok(threeSwordsVi.some((c) => c.id === 'swords-three'));

  const threeSwordsEn = filterDeckCards(fullDeck, { query: '3 of Swords' });
  assert.ok(threeSwordsEn.some((c) => c.id === 'swords-three'));

  const aceCups = filterDeckCards(fullDeck, { query: 'Ace of Cups' });
  assert.equal(aceCups[0].id, 'cups-ace');

  const queensInPentacles = filterDeckCards(fullDeck, {
    query: 'Queen',
    category: 'pentacles',
  });
  assert.equal(queensInPentacles.length, 1);
  assert.equal(queensInPentacles[0].id, 'pentacles-queen');

  // Duplicate physical card prevention across slots
  const tower = fullDeck.find((c) => c.id === 'major-16');
  const star = fullDeck.find((c) => c.id === 'major-17');
  const sun = fullDeck.find((c) => c.id === 'major-19');

  let slots = createEmptyPhysicalSlots(3);
  const step1 = assignCardToPhysicalSlot(slots, 0, tower, 'upright');
  assert.equal(step1.ok, true);
  slots = step1.slots;

  // Trying to put The Tower into slot 1 must fail
  assert.equal(isCardPickedInAnotherSlot(slots, tower.id, 1), true);
  assert.equal(isCardPickedInAnotherSlot(slots, tower.id, 0), false);
  const dupAttempt = assignCardToPhysicalSlot(slots, 1, tower, 'reversed');
  assert.equal(dupAttempt.ok, false);
  assert.equal(dupAttempt.duplicateSlotIndex, 0);

  //Incomplete spread cannot be submitted yet
  assert.equal(buildDrawnCardsFromPhysicalSlots(slots, 'vi').valid, false);

  // Fill remaining slots, toggle orientation, swap, clear & re-fill
  slots = assignCardToPhysicalSlot(slots, 1, star, 'reversed').slots;
  slots = assignCardToPhysicalSlot(slots, 2, sun, 'upright').slots;
  slots = togglePhysicalSlotOrientation(slots, 0); // Tower -> reversed
  slots = swapPhysicalSlots(slots, 0, 2);          // Sun at #1, Tower (reversed) at #3

  const built = buildDrawnCardsFromPhysicalSlots(slots, 'vi');
  assert.equal(built.valid, true);
  assert.equal(built.drawnCards.length, 3);
  assert.equal(built.drawnCards[0].id, 'major-19');
  assert.equal(built.drawnCards[0].orientation, 'upright');
  assert.equal(built.drawnCards[2].id, 'major-16');
  assert.equal(built.drawnCards[2].orientation, 'reversed');
  assert.equal(built.drawnCards[2].physicalLogged, true);

  const cleared = clearPhysicalSlot(slots, 1);
  assert.equal(cleared[1], null);
});

test('computeTarotReadingInsights calculates Stalker Cards, Elemental distribution, Major/Minor ratio, Reversal rate, and window filters', () => {
  const fixedNow = new Date('2026-11-13T12:00:00Z');

  // Empty / < 2 readings state
  const singleHistory = [
    {
      id: 'r1',
      createdAt: '2026-11-10T10:00:00Z',
      question: 'Công việc tuần này?',
      cards: [{ id: 'major-16', name: 'The Tower', orientation: 'reversed' }],
    },
  ];
  const emptyInsights = computeTarotReadingInsights(singleHistory, {
    windowDays: 30,
    deck: fullDeck,
    now: fixedNow,
  });
  assert.equal(emptyInsights.hasEnoughData, false);
  assert.equal(emptyInsights.totalReadings, 1);

  // Multi-reading history across 10 days, 45 days, and 120 days ago
  const sampleHistory = [
    {
      id: 'r-10d',
      createdAt: '2026-11-03T09:00:00Z', // 10 days ago
      question: 'Công việc chuyển hướng ra sao?',
      interpretationContext: 'career',
      cards: [
        { id: 'major-16', name: 'The Tower', orientation: 'reversed' },   // Fire, Major
        { id: 'wands-ace', name: 'Ace of Wands', orientation: 'upright' }, // Fire, Minor
        { id: 'swords-three', name: 'Three of Swords', orientation: 'reversed' }, // Air, Minor
      ],
    },
    {
      id: 'r-20d',
      createdAt: '2026-10-24T09:00:00Z', // 20 days ago
      question: 'Chuyện tình cảm tháng này?',
      interpretationContext: 'love',
      cards: [
        { id: 'major-16', name: 'The Tower', orientation: 'reversed' },   // Fire, Major
        { id: 'cups-two', name: 'Two of Cups', orientation: 'upright' },   // Water, Minor
        { id: 'pentacles-ten', name: 'Ten of Pentacles', orientation: 'upright' }, // Earth, Minor
      ],
    },
    {
      id: 'r-120d',
      createdAt: '2026-07-10T09:00:00Z', // > 90 days ago
      question: 'Tài chính cuối năm?',
      interpretationContext: 'money',
      cards: [
        { id: 'major-16', name: 'The Tower', orientation: 'upright' },    // Fire, Major
        { id: 'major-19', name: 'The Sun', orientation: 'upright' },      // Fire, Major
      ],
    },
  ];

  // 30-day window includes only r-10d & r-20d (6 cards total)
  const insights30 = computeTarotReadingInsights(sampleHistory, {
    windowDays: 30,
    deck: fullDeck,
    now: fixedNow,
    language: 'vi',
  });
  assert.equal(insights30.hasEnoughData, true);
  assert.equal(insights30.totalReadings, 2);
  assert.equal(insights30.totalCardsDrawn, 6);

  // Stalker card #1 is The Tower (2x, both reversed)
  assert.equal(insights30.stalkerCards[0].id, 'major-16');
  assert.equal(insights30.stalkerCards[0].count, 2);
  assert.equal(insights30.stalkerCards[0].reversedCount, 2);
  assert.equal(insights30.stalkerCards[0].uprightCount, 0);
  assert.ok(insights30.stalkerCards[0].reflectionPrompt.length > 20);

  // Elemental counts in 30d: Fire=3 (2x Tower + Ace of Wands), Water=1, Air=1, Earth=1
  assert.deepEqual(insights30.elementalDistribution.counts, {
    Fire: 3,
    Water: 1,
    Air: 1,
    Earth: 1,
  });
  assert.equal(insights30.elementalDistribution.percentages.Fire, 50);
  assert.equal(insights30.majorCount, 2);
  assert.equal(insights30.minorCount, 4);
  assert.equal(insights30.majorRatePercent, 33);
  assert.equal(insights30.reversedCount, 3);
  assert.equal(insights30.reversalRatePercent, 50);
  assert.equal(insights30.topicBreakdown.length, 2);

  // All-time window includes all 3 readings (8 cards, Tower count = 3)
  const insightsAll = computeTarotReadingInsights(sampleHistory, {
    windowDays: 'all',
    deck: fullDeck,
    now: fixedNow,
    language: 'en',
  });
  assert.equal(insightsAll.totalReadings, 3);
  assert.equal(insightsAll.totalCardsDrawn, 8);
  assert.equal(insightsAll.stalkerCards[0].count, 3);
  assert.equal(insightsAll.stalkerCards[0].uprightCount, 1);
  assert.equal(insightsAll.stalkerCards[0].reversedCount, 2);
});
