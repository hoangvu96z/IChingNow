import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSession, dailySession, buildShareText, seedFromString, mulberry32,
} from '../src/game/questionGenerators.js';
import { applyResult, emptyProgress, rankFor } from '../src/game/progress.js';

test('rng cùng seed → cùng dãy', () => {
  const a = mulberry32(42); const b = mulberry32(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

for (const mode of ['hex', 'wuxing', 'napgiap', 'mix'])
  test(`session ${mode}: câu hỏi hợp lệ`, () => {
    for (let seed = 1; seed <= 60; seed++) {
      const qs = buildSession(mode, 10, seed);
      assert.equal(qs.length, 10);
      for (const q of qs) {
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options).size, 4, 'đáp án trùng nhau');
        assert.ok(q.answerIndex >= 0 && q.answerIndex < 4);
        assert.ok(q.prompt && q.explain);
        if (q.binary) assert.match(q.binary, /^[01]{6}$/);
      }
    }
  });

test('wuxing: đáp án đúng theo sinh khắc', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const [q] = buildSession('wuxing', 1, seed);
    const ans = q.options[q.answerIndex];
    const sinh = ['Mộc Hỏa', 'Hỏa Thổ', 'Thổ Kim', 'Kim Thủy', 'Thủy Mộc'];
    const khac = ['Mộc Thổ', 'Thổ Thủy', 'Thủy Hỏa', 'Hỏa Kim', 'Kim Mộc'];
    const [x, verb, y] = ans.split(' ');
    const pair = `${x} ${y}`;
    assert.ok(verb === 'sinh' ? sinh.includes(pair) : khac.includes(pair), ans);
  }
});

test('napgiap: đáp án là Địa Chi và hào hợp lệ', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const [q] = buildSession('napgiap', 1, seed);
    assert.ok(q.highlight >= 1 && q.highlight <= 6);
    assert.ok(q.explain.includes(q.options[q.answerIndex]));
  }
});

test('daily: cùng ngày cùng đề, khác ngày khác đề', () => {
  const a = dailySession('2026-10-05');
  const b = dailySession('2026-10-05');
  const c = dailySession('2026-10-06');
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.equal(a.length, 5);
  assert.notEqual(seedFromString('a'), seedFromString('b'));
});

test('share text kiểu Wordle', () => {
  const t = buildShareText([true, false, true, true, true], '2026-10-05', 'https://x');
  assert.match(t, /🟩🟥🟩🟩🟩 4\/5/);
  assert.match(t, /https:\/\/x/);
});

test('progress: XP, huy hiệu, perfect', () => {
  const r = applyResult(emptyProgress(), { results: [true, true, true, true, true], date: '2026-10-05' });
  assert.equal(r.gainedXp, 60); // 5*10 + 10 perfect
  assert.deepEqual(r.newBadges.sort(), ['first-game', 'perfect']);
});

test('progress: daily chỉ cộng XP lần đầu trong ngày', () => {
  const res = [true, false, true, true, false];
  const first = applyResult(emptyProgress(), { results: res, daily: true, date: 'D1' });
  assert.equal(first.gainedXp, 30 + 20);
  assert.ok(first.newBadges.includes('daily'));
  const again = applyResult(first.progress, { results: res, daily: true, date: 'D1' });
  assert.equal(again.gainedXp, 0);
  assert.equal(again.progress.xp, first.progress.xp);
});

test('rankFor', () => {
  assert.equal(rankFor(0).name, 'Sơ học');
  assert.equal(rankFor(100).name, 'Học trò');
  assert.equal(rankFor(5000).pct, 100);
  assert.equal(rankFor(5000).next, null);
});
