import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatReadingTimestamp,
  parseReadingTimestampMs,
  computeTarotInsights,
} from '../src/utils/tarotAnalytics.js';
import { mapLoadedTarotReading } from '../src/utils/readingMapping.js';
import { buildTarotNoteNowPayload } from '../src/utils/noteNowPayload.js';
import { createManualReadingEntry } from '../src/utils/manualReading.mjs';

test('formatReadingTimestamp formats ISO string into local time and preserves human-formatted strings', () => {
  // ISO-8601 string formatted for Vietnamese
  const isoUtc = '2026-11-14T14:30:00.000Z';
  const formattedVi = formatReadingTimestamp(isoUtc, 'vi');
  assert.match(formattedVi, /^\d{2}:\d{2}\s+\d{2}\/\d{2}\/2026$/);

  // ISO-8601 string formatted for English
  const formattedEn = formatReadingTimestamp(isoUtc, 'en');
  assert.ok(formattedEn.includes('2026'));

  // Pre-formatted string returned as-is
  const humanStringVi = '14:30 14/11/2026';
  assert.equal(formatReadingTimestamp(humanStringVi, 'vi'), humanStringVi);

  const humanStringWithDash = '14:30 - 14/11/2026';
  assert.equal(formatReadingTimestamp(humanStringWithDash, 'vi'), humanStringWithDash);

  // Numeric epoch timestamp ms formatted cleanly
  const fixedEpoch = new Date(2026, 10, 14, 15, 45).getTime();
  const formattedEpoch = formatReadingTimestamp(fixedEpoch, 'vi');
  assert.equal(formattedEpoch, '15:45 14/11/2026');

  // Falsy values
  assert.equal(formatReadingTimestamp(null), '');
  assert.equal(formatReadingTimestamp(undefined), '');
  assert.equal(formatReadingTimestamp(''), '');
});

test('parseReadingTimestampMs prioritizes createdAt and parses DD/MM/YYYY without swapping day/month', () => {
  // Prioritizes createdAt over legacy timestamp
  const itemWithBoth = {
    createdAt: '2026-11-05T08:00:00.000Z',
    timestamp: '14:30 10/11/2026',
  };
  const parsedMs = parseReadingTimestampMs(itemWithBoth);
  assert.equal(parsedMs, Date.parse('2026-11-05T08:00:00.000Z'));

  // DD/MM/YYYY explicit parsing: 05/11/2026 must be Nov 5, NOT May 11
  const localizedItem = {
    timestamp: '14:30 - 05/11/2026',
  };
  const parsedLocalMs = parseReadingTimestampMs(localizedItem);
  const parsedDate = new Date(parsedLocalMs);
  assert.equal(parsedDate.getDate(), 5);
  assert.equal(parsedDate.getMonth(), 10); // November (0-indexed: 10)
  assert.equal(parsedDate.getFullYear(), 2026);
  assert.equal(parsedDate.getHours(), 14);
  assert.equal(parsedDate.getMinutes(), 30);
});

test('createManualReadingEntry includes createdAt ISO timestamp and manualPick flag', () => {
  const fixedDate = new Date('2026-11-14T10:00:00Z');
  const entry = createManualReadingEntry({
    question: 'Kế hoạch phát triển tuần tới?',
    drawnCards: [
      { id: 'major-0', name: 'The Fool', orientation: 'upright' },
      { id: 'major-1', name: 'The Magician', orientation: 'reversed' },
    ],
    pickCount: 2,
    language: 'vi',
    createdAt: fixedDate,
  });

  assert.equal(entry.createdAt, '2026-11-14T10:00:00.000Z');
  assert.equal(entry.manualPick, true);
  assert.equal(entry.cards.length, 2);
  assert.equal(entry.cards[0].name, 'The Fool');
  assert.equal(entry.cards[1].orientation, 'reversed');
});

test('mapLoadedTarotReading preserves createdAt, manualPick, physicalDeck, and reflection fields', () => {
  const serverRecord = {
    id: 'uuid-1234',
    type: '3-card',
    title: 'Trải bài 3 lá',
    createdAt: '2026-11-14T12:00:00.000Z',
  };

  const dataObj = {
    cards: [{ id: 'major-17', name: 'The Star', orientation: 'upright' }],
    manualPick: true,
    physicalDeck: false,
    reflectionNote: 'Trải bài ứng nghiệm rõ rệt trong buổi họp chiều nay.',
    verificationStatus: 'accurate',
    reflectionUpdatedAt: '2026-11-14T16:00:00.000Z',
  };

  const mapped = mapLoadedTarotReading(serverRecord, dataObj);
  assert.equal(mapped.createdAt, '2026-11-14T12:00:00.000Z');
  assert.equal(mapped.manualPick, true);
  assert.equal(mapped.physicalDeck, false);
  assert.equal(mapped.reflectionNote, 'Trải bài ứng nghiệm rõ rệt trong buổi họp chiều nay.');
  assert.equal(mapped.verificationStatus, 'accurate');
  assert.equal(mapped.reflectionUpdatedAt, '2026-11-14T16:00:00.000Z');
});

test('computeTarotInsights skips _decryptionError entries and computes reflectionStats', () => {
  const history = [
    {
      id: 'r1',
      createdAt: '2026-11-10T09:00:00Z',
      question: 'Kế hoạch công việc',
      cards: [{ id: 'wands-ace', name: 'Ace of Wands', orientation: 'upright' }],
      verificationStatus: 'accurate',
      reflectionNote: 'Dự án đã được duyệt đúng như thông điệp tích cực của lá bài.',
    },
    {
      id: 'r2',
      createdAt: '2026-11-11T10:00:00Z',
      question: 'Mối quan hệ',
      cards: [{ id: 'cups-two', name: 'Two of Cups', orientation: 'upright' }],
      verificationStatus: 'partial',
      reflectionNote: 'Có tiến triển nhưng diễn tiến chậm hơn.',
    },
    {
      id: 'r3',
      createdAt: '2026-11-12T11:00:00Z',
      question: 'Đầu tư tài chính',
      cards: [{ id: 'pentacles-five', name: 'Five of Pentacles', orientation: 'reversed' }],
      verificationStatus: 'diverged',
      reflectionNote: 'Không phát sinh rủi ro tài chính như lo ngại.',
    },
    {
      id: 'r4-undecryptable',
      createdAt: '2026-11-12T12:00:00Z',
      _decryptionError: true,
      question: '(Khóa không khớp)',
      cards: [{ id: 'major-16', name: 'The Tower', orientation: 'upright' }],
      verificationStatus: 'diverged',
    },
  ];

  const insights = computeTarotInsights(history, { windowDays: 'all', language: 'vi' });

  // Undecryptable item must be skipped from totalReadings!
  assert.equal(insights.totalReadings, 3);

  // Reflection stats must be computed
  assert.ok(insights.reflectionStats);
  assert.equal(insights.reflectionStats.reflectedCount, 3);
  assert.equal(insights.reflectionStats.accurateCount, 1);
  assert.equal(insights.reflectionStats.partialCount, 1);
  assert.equal(insights.reflectionStats.divergedCount, 1);

  // Recent reflections list capped at 5 and sorted
  assert.equal(insights.reflectionStats.recentReflections.length, 3);
  assert.equal(insights.reflectionStats.recentReflections[0].id, 'r3');
  assert.ok(insights.reflectionStats.recentReflections[0].noteSnippet.includes('Không phát sinh'));
});

test('buildTarotNoteNowPayload returns signature purple bgColor and preserves reflectionNote and verificationStatus', () => {
  const payload = buildTarotNoteNowPayload({
    drawnCards: [
      { id: 'major-0', name: 'The Fool', orientation: 'upright' },
      { id: 'major-17', name: 'The Star', orientation: 'upright' },
    ],
    spreadPositions: ['Hiện tại', 'Hy vọng'],
    activeSpread: '2-card',
    resolvedSpreadDisplayName: 'Trải bài 2 lá',
    question: 'Có nên bắt đầu dự án mới?',
    interpretationContext: 'career',
    reflectionNote: 'Đã triển khai và đạt kết quả bước đầu rất suôn sẻ.',
    verificationStatus: 'accurate',
    language: 'vi',
  });

  assert.equal(payload.sourceAppLabel, 'TarotNow');
  assert.equal(payload.bgColor, 'purple');
  assert.equal(payload.verificationStatus, 'accurate');
  assert.equal(payload.reflectionNote, 'Đã triển khai và đạt kết quả bước đầu rất suôn sẻ.');
  assert.ok(payload.tags.includes('tarotnow'));
  assert.ok(payload.tags.includes('nghiem-ly'));

  // Summary lines include both cards and outcome verification info
  assert.ok(payload.summaryLines.some((l) => l.includes('Trạng thái Nghiệm lý: Ứng nghiệm sát thực tế')));
  assert.ok(payload.summaryLines.some((l) => l.includes('Đã triển khai và đạt kết quả')));

  // Checklist items include reflection reminders
  assert.ok(payload.checklistItems.some((c) => c.includes('sau 7 ngày')));
});
