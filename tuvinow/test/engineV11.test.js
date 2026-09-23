import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { buildTuViText, buildTuViPrompt } from '../src/utils/buildTuViPrompt.js';
const original = createRequire(import.meta.url)('./fixtures/tuvi-v11-user.cjs');

test('v11 age, annual palaces and weight match source across age boundaries and both genders', () => {
  for (let year = 1984; year < 2044; year++) for (const gender of [0, 1])
    for (const age of [1, 2, 3, 4, 5, 6, 12, 13, 30, 60, 120, 130]) {
      const namXem = year + age - 1;
      const input = { yearCanIndex: (year - 4) % 10, yearChiIndex: (year - 4) % 12,
        gender, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3,
        lunarYear: year, viewYear: namXem, viewYearCanIndex: (namXem - 4) % 10, viewYearChiIndex: (namXem - 4) % 12 };
      const expected = original.anLaSoTuVi({ ...input, namSinh: year, namXem });
      const actual = anLaSoTuVi(input);
      assert.equal(actual.tuoiAm, age);
      for (const key of ['canLuongStr', 'tieuHanCung', 'viewYearStr']) assert.equal(actual[key], expected[key]);
      actual.palates.forEach((p, i) => {
        for (const key of Object.keys(expected.palates[i])) assert.deepEqual(p[key], expected.palates[i][key]);
      });
      assert.equal(actual.palates.filter(p => p.isTieuHan).length, 1);
      assert.ok(buildTuViText(actual, input).includes(`Cân lượng: ${expected.canLuongStr}`));
    }
});

test('missing annual year never invokes wall-clock fallback and pre-birth years are rejected', () => {
  const input = { yearCanIndex: 2, yearChiIndex: 0, gender: 1, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, lunarYear: 1996 };
  for (const extra of [{}, { viewYearCanIndex: 2, viewYearChiIndex: 6 }]) {
    const result = anLaSoTuVi({ ...input, ...extra });
    assert.equal(result.tuoiAm, null);
    assert.equal(result.tieuHanCung, null);
    assert.ok(result.palates.every(p => !p.isTieuHan && !p.luuNienChucNang));
  }
  assert.throws(() => anLaSoTuVi({ ...input, viewYear: 1995 }), /Năm xem/);
});

function compare(input) {
  const expected = original.anLaSoTuVi(input);
  const actual = anLaSoTuVi(input);
  for (const key of Object.keys(expected)) {
    if (key === 'palates') {
      for (let i = 0; i < 12; i++) {
        for (const field of Object.keys(expected.palates[i])) {
          assert.deepEqual(actual.palates[i][field], expected.palates[i][field], `${i}:${field} ${JSON.stringify(input)}`);
        }
      }
    } else assert.deepEqual(actual[key], expected[key]);
  }
  assert.equal(actual.engineVersion, 'user-v11');
  assert.deepEqual(actual.tuanCung, expected.palates.filter(p => p.isTuan).map(p => p.chiName));
  assert.deepEqual(actual.trietCung, expected.palates.filter(p => p.isTriet).map(p => p.chiName));
  assert.equal(actual.palates.filter(p => p.isMenh).length, 1);
  assert.equal(actual.palates.find(p => p.isMenh).chiName, expected.menhCung);
  assert.equal(actual.palates.find(p => p.isThan).chiName, expected.thanCung);
}

test('calculation body is identical to the supplied v11 source', () => {
  const source = readFileSync(new URL('./fixtures/tuvi-v11-user.cjs', import.meta.url), 'utf8');
  const core = readFileSync(new URL('../src/utils/tuViEngineV11.js', import.meta.url), 'utf8');
  assert.equal(core.split('// ESM exports')[0], source.split("if (typeof module !== 'undefined'")[0]);
});

test('matches original for 5,400 charts across all 60 birth years and both directions', () => {
  for (let year = 0; year < 60; year++)
    for (const gender of [0, 1])
      for (const lunarMonth of [1, 6, 12])
        for (const lunarDay of [1, 2, 15, 29, 30])
          for (const lunarHourIndex of [0, 5, 11])
            compare({ yearCanIndex: year % 10, yearChiIndex: year % 12, gender, lunarMonth, lunarDay, lunarHourIndex });
});

test('all 60 annual years match original; omitted year adds no annual stars', () => {
  const birth = { yearCanIndex: 2, yearChiIndex: 0, gender: 1, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3 };
  assert.equal(anLaSoTuVi(birth).palates.flatMap(p => p.phuTinh).filter(s => s.startsWith('L.')).length, 0);
  for (let year = 0; year < 60; year++) {
    const input = { ...birth, viewYearCanIndex: year % 10, viewYearChiIndex: year % 12 };
    compare(input);
    assert.ok(anLaSoTuVi(input).palates.flatMap(p => p.phuTinh).filter(s => s.startsWith('L.')).length >= 9);
  }
  const input = { ...birth, viewYear: 2026, viewYearCanIndex: 2, viewYearChiIndex: 6 };
  const result = anLaSoTuVi(input);
  const text = buildTuViText(result, input);
  assert.ok(text.includes('2026 Bính Ngọ'));
  for (const star of ['L.Lộc Tồn', 'L.Kình Dương', 'L.Đà La', 'L.Thái Tuế', 'L.Thiên Mã']) assert.ok(text.includes(star));
  assert.ok(!buildTuViPrompt(result, input).includes('Chưa có tiểu hạn/lưu niên'));
});

test('partial annual input and invalid days are rejected rather than invented', () => {
  const input = { yearCanIndex: 2, yearChiIndex: 0, gender: 1, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3 };
  assert.throws(() => anLaSoTuVi({ ...input, viewYearCanIndex: 2 }));
  assert.throws(() => anLaSoTuVi({ ...input, lunarDay: 31 }));
  const result = anLaSoTuVi(input);
  assert.deepEqual(result.tuanCung, ['Thân', 'Dậu']);
  assert.equal(result.chuThan, 'Linh Tinh');
  assert.equal(result.palates.flatMap(p => p.phuTinh).filter(s => s.startsWith('Hóa ')).length, 4);
});


test('v11 places Thien Phuc exactly as supplied for all ten heavenly stems', () => {
  const expected = ['Dậu', 'Thân', 'Tý', 'Hợi', 'Mão', 'Dần', 'Ngọ', 'Tỵ', 'Ngọ', 'Tỵ'];
  for (let yearCanIndex = 0; yearCanIndex < 10; yearCanIndex++) {
    const result = anLaSoTuVi({ yearCanIndex, yearChiIndex: yearCanIndex, gender: 1, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3 });
    const palaces = result.palates.filter(p => p.phuTinh.includes('Thiên Phúc'));
    assert.equal(palaces.length, 1);
    assert.equal(palaces[0].chiName, expected[yearCanIndex]);
    assert.ok(buildTuViText(result, {}).includes('Thiên Phúc'));
  }
});
