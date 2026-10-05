import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLucHaoResult } from '../src/logic/buildHexagram.js';
import { analyzeLucHao, relation } from '../src/logic/lucHaoAnalysis.js';
import { TOPICS } from '../src/data/lucHaoRules.js';
import { GLOSSARY } from '../src/data/glossary.js';

const make = (pattern, moving = [], castDate = '2026-09-22') =>
  buildLucHaoResult({
    formData: { castDate, castTime: '10:00', question: 'test' },
    mode: 'quick',
    lines: pattern.split('').map((c, i) => ({
      index: i + 1,
      yinYang: c === '1' ? 'yang' : 'yin',
      moving: moving.includes(i + 1),
    })),
  });

test('relation: sinh/khắc cơ bản', () => {
  assert.equal(relation('Mộc', 'Mộc'), 'same');
  assert.equal(relation('Hỏa', 'Mộc'), 'sinhHao');
  assert.equal(relation('Mộc', 'Hỏa'), 'haoSinh');
  assert.equal(relation('Mộc', 'Thổ'), 'haoKhac');
  assert.equal(relation('Mộc', 'Kim'), 'khacHao');
});

for (const topic of Object.keys(TOPICS))
  for (const [pat, mv] of [['111111', []], ['101010', [2]], ['010101', [1, 4, 6]], ['100100', [3]]])
    test(`analyze ${topic} ${pat} mv=${mv}`, () => {
      const a = analyzeLucHao(make(pat, mv), topic);
      assert.ok(a);
      assert.equal(a.steps.length, 6);
      assert.ok(['cat', 'binh', 'hung'].includes(a.verdict));
      assert.ok(Number.isFinite(a.score));
      for (const s of a.steps) {
        assert.ok(s.title && s.finding);
        for (const k of s.glossary) assert.ok(GLOSSARY[k], `thiếu glossary: ${k}`);
        for (const r of s.refs) assert.ok(r >= 1 && r <= 6);
      }
    });

test('null khi thiếu dữ liệu', () => {
  assert.equal(analyzeLucHao(null), null);
  assert.equal(analyzeLucHao({ lines: [] }), null);
});

test('chủ đề Thế chọn đúng hào Thế', () => {
  const r = make('111111');
  const a = analyzeLucHao(r, 'general');
  assert.equal(a.dungLineIndex, r.theHao);
});
