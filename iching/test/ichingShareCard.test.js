import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIChingShareCardModel } from '../src/utils/ichingShareCard.js';

test('buildIChingShareCardModel includes both hexagrams, classic line order and existing overview only', () => {
  const model = buildIChingShareCardModel({
    question: 'private question',
    caster: 'private name',
    primaryBinary: '100010',
    changedBinary: '000010',
    movingLines: [1],
    primaryHexagram: {
      id: 3,
      nameVi: 'Thủy Lôi Truân',
      nameZh: '屯',
      description: { tong_quat: 'Existing overview.' },
    },
    changedHexagram: { id: 8, nameVi: 'Thủy Địa Tỷ', nameZh: '比' },
    lines: [
      { index: 1, yinYang: 'yang', moving: true },
      { index: 2, yinYang: 'yin', moving: false },
      { index: 3, yinYang: 'yin', moving: false },
      { index: 4, yinYang: 'yang', moving: false },
      { index: 5, yinYang: 'yin', moving: false },
      { index: 6, yinYang: 'yin', moving: false },
    ],
  });

  assert.equal(model.primary.name, 'Thủy Lôi Truân');
  assert.equal(model.primary.chinese, '屯');
  assert.deepEqual(model.primary.lines.map((line) => line.yinYang), ['yang', 'yin', 'yin', 'yin', 'yang', 'yin']);
  assert.equal(model.primary.lines[0].moving, true);
  assert.equal(model.changed.name, 'Thủy Địa Tỷ');
  assert.equal(model.primary.overview, 'Existing overview.');
  assert.equal('question' in model, false);
  assert.equal('caster' in model, false);
});

test('buildIChingShareCardModel omits the changed hexagram when no line moved', () => {
  const model = buildIChingShareCardModel({
    primaryHexagram: { id: 1, nameVi: 'Thuần Càn', binary: '111111' },
    changedHexagram: { id: 2, nameVi: 'Thuần Khôn', binary: '000000' },
    movingLines: [],
  });

  assert.equal(model.primary.name, 'Thuần Càn');
  assert.equal(model.changed, null);
});

test('buildIChingShareCardModel ignores invalid or incomplete results', () => {
  assert.equal(buildIChingShareCardModel(null), null);
  assert.equal(buildIChingShareCardModel({ primaryHexagram: { id: 1, nameVi: 'Thuần Càn' } }), null);
});
