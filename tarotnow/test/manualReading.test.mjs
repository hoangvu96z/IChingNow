import test from 'node:test';
import assert from 'node:assert/strict';
import { createManualReadingEntry } from '../src/utils/manualReading.mjs';

test('manual pick reading persists question, spread metadata, and drawn card data', () => {
  const drawnCards = [
    { id: 'the-fool', name: 'The Fool', orientation: 'upright', drawPosition: 1 },
    { id: 'the-star', name: 'The Star', orientation: 'reversed', drawPosition: 2 },
  ];
  const createdAt = new Date('2026-10-22T10:00:00.000Z');

  const reading = createManualReadingEntry({
    question: '  Should I accept this opportunity?  ',
    drawnCards,
    pickCount: 2,
    language: 'en',
    createdAt,
  });

  assert.equal(reading.id, String(createdAt.getTime()));
  assert.equal(reading.timestamp, createdAt.toISOString());
  assert.equal(reading.question, 'Should I accept this opportunity?');
  assert.equal(reading.spread, 'custom');
  assert.equal(reading.spreadId, 'custom');
  assert.equal(reading.spreadName, 'Manual Pick (2 cards)');
  assert.equal(reading.title, 'Manual Pick (2 cards)');
  assert.equal(reading.manualPick, true);
  assert.deepEqual(reading.cards, [
    { id: 'the-fool', name: 'The Fool', orientation: 'upright' },
    { id: 'the-star', name: 'The Star', orientation: 'reversed' },
  ]);
  assert.deepEqual(reading.drawnCards, drawnCards);
});
