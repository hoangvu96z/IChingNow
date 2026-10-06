import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMove, bfs, solve, generatePuzzle, levelPuzzle, dailyPuzzle, dailyNumber,
  starsFor, shareText, recordLevel, recordDaily, emptyStore, isLevelUnlocked,
  CHAPTERS, ALL_SKILLS, HEX_BY_BIN, hexInfo, glyph, MAX_STARS,
} from '../src/game/bienQue/bienQueLogic.js';
import { mulberry32 } from '../src/game/questionGenerators.js';

test('applyMove: các chiêu cơ bản', () => {
  assert.equal(applyMove('111111', { type: 'flip', line: 1 }), '011111');
  assert.equal(applyMove('111111', { type: 'flip', line: 6 }), '111110');
  assert.equal(applyMove('101100', { type: 'thac' }), '010011');
  assert.equal(applyMove('100010', { type: 'tong' }), '010001'); // Truân ⇅ Mông
  assert.equal(applyMove('111111', { type: 'ho' }), '111111');
  // Hỗ quái của Thủy Lôi Truân (100010) là Sơn Địa Bác (000001)
  assert.equal(applyMove('100010', { type: 'ho' }), '000001');
  assert.equal(HEX_BY_BIN['000001'].nameVi, 'Sơn Địa Bác');
});

test('mọi kết quả chiêu đều là quẻ hợp lệ', () => {
  for (const bin of Object.keys(HEX_BY_BIN))
    for (const type of ['thac', 'tong', 'ho'])
      assert.ok(HEX_BY_BIN[applyMove(bin, { type })]);
});

test('flip-only: khoảng cách = số hào khác nhau', () => {
  const { dist } = bfs('111111', ['flip']);
  assert.equal(dist['000000'], 6);
  assert.equal(dist['101010'], 3);
  assert.equal(Object.keys(dist).length, 64);
});

test('solve trả về lời giải tối ưu và đúng', () => {
  const path = solve('111111', '000000', ['flip', 'thac']);
  assert.equal(path.length, 1);
  const p2 = solve('100010', '001101', ALL_SKILLS);
  let b = '100010';
  for (const m of p2) b = applyMove(b, m);
  assert.equal(b, '001101');
  assert.equal(solve('111111', '111111', ['flip']).length, 0);
});

test('generatePuzzle: optimal khớp BFS và trong khoảng', () => {
  for (let s = 1; s <= 40; s++) {
    const p = generatePuzzle(mulberry32(s), { skills: ALL_SKILLS, minDist: 3, maxDist: 4 });
    assert.notEqual(p.start, p.target);
    assert.equal(solve(p.start, p.target, p.skills).length, p.optimal);
    assert.ok(p.optimal >= 3 && p.optimal <= 4);
    assert.equal(p.maxMoves, p.optimal + 3);
  }
});

test('hành trình: mọi màn sinh được, tất định, chiêu chương cần thiết', () => {
  CHAPTERS.forEach((ch, ci) => {
    ch.levels.forEach(({ d, lines }, li) => {
      const p = levelPuzzle(ci, li);
      assert.deepEqual(p, levelPuzzle(ci, li));
      assert.deepEqual(p.lines, lines);
      assert.equal(solve(p.start, p.target, ch.skills, lines).length, p.optimal);
      assert.equal(p.optimal, d, `${ch.id}-${li} optimal=${p.optimal}, mong đợi ${d}`);
      if (ch.require) {
        const without = solve(p.start, p.target, ch.skills.filter((s) => s !== ch.require), lines);
        assert.ok(without === null || without.length > p.optimal, `${ch.id}-${li} chiêu ${ch.require} không cần thiết`);
      }
    });
  });
});

test('phong ấn: không được động hào bị khóa', () => {
  const path = solve('111111', '111101', ['flip'], [1, 2]);
  assert.equal(path, null); // hào 5 bị phong ấn
  const p2 = solve('111111', '111101', ['flip', 'tong'], [1, 2]);
  assert.ok(p2.every((m) => m.type !== 'flip' || [1, 2].includes(m.line)));
});

test('đề ngày: tất định theo ngày, số thứ tự đúng', () => {
  assert.deepEqual(dailyPuzzle('2026-10-06'), dailyPuzzle('2026-10-06'));
  assert.notDeepEqual(dailyPuzzle('2026-10-06'), dailyPuzzle('2026-10-07'));
  assert.equal(dailyNumber('2026-10-01'), 1);
  assert.equal(dailyNumber('2026-10-06'), 6);
  const p = dailyPuzzle('2026-10-06');
  assert.ok(p.optimal >= 5 && p.optimal <= 6, `optimal=${p.optimal}`);
  for (let i = 1; i <= 30; i++) {
    const day = `2026-11-${String(i).padStart(2, '0')}`;
    const q = dailyPuzzle(day);
    assert.ok(q.optimal >= 5, `${day} optimal=${q.optimal}`);
    assert.equal(solve(q.start, q.target, q.skills, q.lines).length, q.optimal);
  }
});

test('starsFor', () => {
  assert.equal(starsFor(3, 3), 3);
  assert.equal(starsFor(4, 3), 2);
  assert.equal(starsFor(6, 3), 1);
  assert.equal(starsFor(3, 3, true), 2);
});

test('shareText', () => {
  const puzzle = { start: '111111', target: '111000', number: 6 };
  const t = shareText({ puzzle, moves: [{ type: 'flip', line: 4 }, { type: 'thac' }], stars: 3, url: 'https://x' });
  assert.match(t, /Biến Quẻ #6/);
  assert.match(t, /䷀ → ䷊ · 2 nước ⭐⭐⭐/);
  assert.match(t, /🔸☯️/);
});

test('recordLevel chỉ thưởng sao tăng thêm; recordDaily chỉ lần đầu', () => {
  let r = recordLevel(emptyStore(), 'c1-0', 2);
  assert.equal(r.xp, 20);
  r = recordLevel(r.store, 'c1-0', 1);
  assert.equal(r.xp, 0);
  assert.equal(r.store.stars['c1-0'], 2);
  r = recordLevel(r.store, 'c1-0', 3);
  assert.equal(r.xp, 10);
  const d1 = recordDaily(emptyStore(), 'D', 4, 3);
  assert.equal(d1.xp, 50);
  assert.equal(recordDaily(d1.store, 'D', 4, 3).xp, 0);
});

test('mở khóa màn', () => {
  const s = emptyStore();
  assert.ok(isLevelUnlocked(s, 0, 0));
  assert.ok(!isLevelUnlocked(s, 0, 1));
  assert.ok(!isLevelUnlocked(s, 1, 0));
  s.stars['c1-5'] = 1;
  assert.ok(isLevelUnlocked(s, 1, 0));
});

test('hexInfo / glyph', () => {
  assert.equal(glyph('111111'), '䷀');
  assert.equal(glyph('000000'), '䷁');
  const info = hexInfo('111111');
  assert.equal(info.nameVi, 'Thuần Càn');
  assert.ok(info.summary.length > 5);
  assert.equal(MAX_STARS, 72);
});
