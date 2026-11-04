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

test('v6 interpretation engine covers Cân Lượng, full 2-word palace names, VCD, Tam Hợp Cách Cục, Lưu Đại Hạn and L.Khôi/L.Việt', () => {
  // Ngô Thị Tâm chart: Tân Tỵ (2001), lunar 4/6, hour Thìn (4), gender Nữ (0), viewYear 2027 (Đinh Mùi)
  const chart = anLaSoTuVi({
    lunarYear: 2001,
    lunarMonth: 6,
    lunarDay: 4,
    lunarHourIndex: 4,
    yearCanIndex: 7,
    yearChiIndex: 5,
    gender: 0,
    viewYear: 2027,
    viewYearCanIndex: 3,
    viewYearChiIndex: 7,
  });
  const report = buildTuViInterpretation(chart);
  const { sections } = report;

  // Step 1: Cân Xương Đoán Số
  assert.ok(sections.step1_ThienBan.includes('Cân Xương Đoán Số (Viên Thiên Cương)'));
  assert.ok(sections.step1_ThienBan.includes(chart.canLuongStr));

  // Step 2 & Step 3: Thiên Tướng độc tọa (Hãm Địa) - Hội Tử Vũ Liêm & Sát Phá Tham
  assert.ok(sections.step2_MenhThan.includes('Thiên Tướng (H)'));
  assert.ok(sections.step3_TamHop.includes('Cách Cục Thiên Tướng Độc Tọa (Hãm Địa) - Hội Tử Vũ Liêm & Sát Phá Tham'));

  // Step 4: Full 2-word palace names (no truncation like "Cung Phụ" or "Cung Điền") + Sát Tinh & Cát Tinh
  assert.ok(sections.step4_SatTinhTuHoa.includes('Cung Phụ Mẫu'));
  assert.ok(sections.step4_SatTinhTuHoa.includes('Cung Điền Trạch'));
  assert.ok(sections.step4_SatTinhTuHoa.includes('Cung Huynh Đệ'));
  assert.ok(sections.step4_SatTinhTuHoa.includes('Cung Nô Bộc'));
  assert.ok(sections.step4_SatTinhTuHoa.includes('CẢNH BÁO QUAN TRỌNG'));

  // Step 5: Priority Phụ Tinh (Hóa Kỵ in Điền Trạch is preserved even though it's the 13th star) + Đại Hạn Đương Thời
  assert.ok(sections.step5_12CungAndVanHan.includes('Hóa Kỵ'));
  assert.ok(sections.step5_12CungAndVanHan.includes('[ĐẠI HẠN HIỆN TẠI: 23 - 32 tuổi]'));
  assert.ok(sections.step5_12CungAndVanHan.includes('Đại Hạn Đương Thời (27 tuổi âm)'));

  // Step 6: Gốc Đại Hạn, Cung Lưu Đại Hạn, Cung Tiểu Hạn, LN.Mệnh, L.Thiên Khôi / L.Thiên Việt
  assert.ok(sections.step6_LuuNien.includes('Gốc Đại Hạn 10 Năm (23-32 tuổi)'));
  assert.ok(sections.step6_LuuNien.includes('Cung Lưu Đại Hạn'));
  assert.ok(sections.step6_LuuNien.includes('Cung Tiểu Hạn (1 Năm)'));
  assert.ok(sections.step6_LuuNien.includes('Cung Lưu Niên Mệnh (LN.Mệnh / Thái Tuế Lưu Niên)'));
  assert.ok(sections.step6_LuuNien.includes('L.Thiên Khôi'));
  assert.ok(sections.step6_LuuNien.includes('L.Thiên Việt'));
});
