import test from 'node:test';
import assert from 'node:assert/strict';
import { HEXAGRAMS } from '../src/data/hexagrams.js';
import judgementRows from '../src/data/classicalChineseJudgements.js';
import { buildIChingShareCardModel } from '../src/utils/ichingShareCard.js';

const judgementById = new Map(judgementRows.map((entry) => [entry.id, entry]));

test('classical judgment source covers all 64 app hexagrams with provenance', () => {
  assert.equal(judgementRows.length, 64);
  assert.equal(new Set(judgementRows.map((entry) => entry.id)).size, 64);

  for (const hexagram of HEXAGRAMS) {
    const source = judgementById.get(hexagram.id);
    assert.ok(source, `Missing source entry for hexagram ${hexagram.id}`);
    assert.equal(source.appName, hexagram.nameVi, `Wrong mapping for hexagram ${hexagram.id}`);
    assert.ok(source.classicalChineseJudgement.trim(), `Missing judgment for ${hexagram.id}`);
    assert.match(source.sourceUrl, /^https:\/\/zh\.wikisource\.org\/wiki\/周易\//u);
    assert.match(source.attributionLicenseNote, /Wikisource/u);
    assert.match(source.attributionLicenseNote, /CC BY-SA 4\.0/u);
    assert.match(source.attributionLicenseNote, /share-alike/u);
    assert.doesNotMatch(source.classicalChineseJudgement, /彖傳|彖传/u);
  }
});

test('buildIChingShareCardModel includes source judgments, both hexagrams, classic line order and separate overview', () => {
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
  assert.equal(model.primary.classicalChineseJudgement, judgementById.get(3).classicalChineseJudgement);
  assert.equal(model.primary.sourceUrl, judgementById.get(3).sourceUrl);
  assert.equal(model.primary.attributionLicenseNote, judgementById.get(3).attributionLicenseNote);
  assert.equal(model.changed.classicalChineseJudgement, judgementById.get(8).classicalChineseJudgement);
  assert.notEqual(model.primary.classicalChineseJudgement, model.primary.overview);
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
  assert.equal(buildIChingShareCardModel({ primaryHexagram: { id: 999, binary: '111111' } }), null);
  assert.equal(buildIChingShareCardModel({
    primaryHexagram: { id: 1, binary: '111111' },
    changedHexagram: { id: 999, binary: '000000' },
    movingLines: [1],
  }), null);
});
