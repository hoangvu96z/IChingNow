import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReflectionReport,
  filterJournalEntries,
  padJournalDateBounds,
} from '../src/utils/spiritualJournal.mjs';

const entries = [
  {
    id: 'a',
    createdAt: '2026-10-02T08:00:00.000Z',
    tags: ['career'],
    reflection: 'Tôi muốn thay đổi cách làm việc.',
    reading: { app: 'iching', type: 'luc-hao', question: 'must not be searched or exported' },
  },
  {
    id: 'b',
    createdAt: '2026-09-30T08:00:00.000Z',
    tags: ['love'],
    reflection: 'Mình cần lắng nghe nhiều hơn.',
    reading: { app: 'tarot', type: 'three-card' },
  },
  {
    id: 'c',
    createdAt: '2025-10-03T08:00:00.000Z',
    tags: ['career', 'growth'],
    reflection: 'Đặt lại mục tiêu cá nhân.',
    reading: { app: 'tuvi', type: 'tuvi-laso' },
  },
  {
    id: 'd',
    createdAt: '2026-10-03T08:00:00.000Z',
    tags: ['family'],
    reflection: 'Cùng nhìn lại kỳ vọng.',
    reading: { app: 'tuvi-hop-hon', type: 'tuvi-hop-hon' },
  },
];

test('filters journal entries by date, topic, app, and accent-insensitive reflection search', () => {
  const result = filterJournalEntries(entries, {
    from: '2026-10-01',
    to: '2026-10-31',
    tag: 'career',
    app: 'iching',
    query: 'thay doi',
  });

  assert.deepEqual(result.map((entry) => entry.id), ['a']);
  assert.deepEqual(
    filterJournalEntries(entries, { query: 'must not be searched or exported' }),
    [],
  );
  assert.deepEqual(filterJournalEntries(entries, { app: 'tuvi-hop-hon' }).map((entry) => entry.id), ['d']);
});

test('builds monthly and yearly reflection reports with topic patterns', () => {
  const monthly = buildReflectionReport(entries, { period: 'month', value: '2026-10' });
  assert.equal(monthly.count, 2);
  assert.match(monthly.markdown, /Nhật ký chiêm nghiệm — Tháng 2026-10/);
  assert.match(monthly.markdown, /Sự nghiệp \(1\)/);
  assert.match(monthly.markdown, /Tôi muốn thay đổi cách làm việc/);
  assert.doesNotMatch(monthly.markdown, /must not be searched or exported/);

  const yearly = buildReflectionReport(entries, { period: 'year', value: 2026 });
  assert.equal(yearly.count, 3);
  assert.match(yearly.markdown, /Năm 2026/);
  assert.match(yearly.markdown, /Tình cảm/);
});

test('pads server date bounds so local-time boundary entries are not omitted', () => {
  assert.deepEqual(padJournalDateBounds('2026-10-01', '2026-10-31'), {
    from: '2026-09-30',
    to: '2026-11-01',
  });
  assert.deepEqual(padJournalDateBounds('2026-10-01', undefined), {
    from: '2026-09-30',
    to: undefined,
  });
});
