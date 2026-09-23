import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { renderToStaticMarkup } from 'react-dom/server';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { buildTuViInterpretation, prepareInterpretationInput, interpretationMarkdown } from '../src/utils/tuViInterpretation.js';
const original = createRequire(import.meta.url)('./fixtures/tuvi-interpretation-v5-user.cjs');
const birth = { yearCanIndex: 2, yearChiIndex: 0, gender: 1, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3 };

test('interpretation source is unchanged apart from ESM exports', () => {
  const raw = readFileSync(new URL('./fixtures/tuvi-interpretation-v5-user.cjs', import.meta.url), 'utf8');
  const core = readFileSync(new URL('../src/utils/tuViInterpretationV5.js', import.meta.url), 'utf8');
  assert.equal(core.split('// ESM exports')[0], raw.split("if (typeof module !== 'undefined'")[0]);
});

test('all six interpretations match original over 1,440 charts including annual years', () => {
  for (let year = 0; year < 60; year++) for (const gender of [0, 1]) for (let hour = 0; hour < 12; hour++) {
    const result = anLaSoTuVi({ ...birth, yearCanIndex: year % 10, yearChiIndex: year % 12, gender,
      lunarHourIndex: hour, lunarMonth: hour + 1,
      ...(hour % 2 ? { viewYear: 1984 + year, viewYearCanIndex: year % 10, viewYearChiIndex: year % 12 } : {}) });
    const expectedInput = { ...result };
    const before = structuredClone(result);
    const report = buildTuViInterpretation(result);
    assert.deepEqual(report.sections, original.luanSoTuViToanDien(expectedInput));
    assert.equal(report.hasViewYear, Boolean(hour % 2));
    assert.deepEqual(result, before);
    assert.equal(Object.keys(report.sections).length, 6);
    assert.ok(Object.values(report.sections).every(s => !s.includes('undefined')));
  }
});

test('historical Thân labels are adapted without changing stars or saved chart', () => {
  const chart = anLaSoTuVi(birth);
  const expected = buildTuViInterpretation(chart);
  chart.palates.forEach(p => { p.chucNang = p.chucNang.replace(' <THÂN>', ''); });
  const before = structuredClone(chart);
  assert.deepEqual(buildTuViInterpretation(chart), expected);
  assert.deepEqual(chart, before);
});

test('incomplete historical charts are rejected instead of inventing missing data', () => {
  const chart = anLaSoTuVi(birth);
  for (const field of ['banMenhNapAm', 'chuMenh', 'cucNumber', 'menhCung']) {
    const broken = { ...chart, [field]: undefined };
    assert.throws(() => prepareInterpretationInput(broken), /chưa đủ dữ liệu/);
  }
  assert.throws(() => prepareInterpretationInput({ ...chart, banMenhNapAm: 'Không rõ' }));
  const broken = structuredClone(chart);
  broken.palates[0] = broken.palates[1];
  assert.throws(() => prepareInterpretationInput(broken));
});

test('Markdown shows literal Thân, Tuần, Triệt markers and real list items safely', () => {
  const html = renderToStaticMarkup(React.createElement(ReactMarkdown, null,
    interpretationMarkdown('• **Mệnh <THÂN>** <TUẦN> <TRIỆT>\n  - Chính tinh\n<script>alert(1)</script>')));
  for (const marker of ['THÂN', 'TUẦN', 'TRIỆT']) assert.ok(html.includes(`&lt;${marker}&gt;`));
  assert.ok(html.includes('<li>'));
  assert.ok(!html.includes('<script>'));
});
