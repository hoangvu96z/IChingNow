import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';

test('answer and actual palace components render evidence and legacy text', async () => {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: Provider } = await server.ssrLoadModule('/src/components/TuViEvidenceProvider.jsx');
    const { default: Answer } = await server.ssrLoadModule('/src/components/TuViEvidenceAnswer.jsx');
    const { default: LocalReport } = await server.ssrLoadModule('/src/components/TuViLocalReport.jsx');
    const { default: Palace } = await server.ssrLoadModule('/src/components/PalateCard.jsx');
    const { default: Summary } = await server.ssrLoadModule('/src/components/SummaryPanel.jsx');
    const annual = anLaSoTuVi({ lunarYear: 1996, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, yearCanIndex: 2, yearChiIndex: 0, gender: 0, viewYear: 2026, viewYearCanIndex: 2, viewYearChiIndex: 6 });
    const annualHtml = renderToStaticMarkup(React.createElement(Provider, { result: annual },
      React.createElement(Summary, { result: annual }),
      ...annual.palates.map(p => React.createElement(Palace, { palace: p, key: p.chiIndex }))));
    assert.ok(annualHtml.includes(annual.canLuongStr));
    assert.ok(annualHtml.includes('31 tuổi'));
    assert.equal((annualHtml.match(/class="palace-tieuhan"/g) || []).length, 1);
    for (const p of annual.palates) assert.ok(annualHtml.includes(p.luuNienChucNang));
    const result = anLaSoTuVi({ lunarYear: 1996, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, yearCanIndex: 2, yearChiIndex: 0, gender: 1 });
    const localHtml = renderToStaticMarkup(React.createElement(LocalReport, { result }));
    assert.equal((localHtml.match(/<details/g) || []).length, 6);
    assert.ok(localHtml.includes('Miễn phí'));
    assert.ok(localHtml.includes('Bạn chưa chọn năm xem hạn'));
    assert.ok(localHtml.includes('&lt;THÂN&gt;'));
    assert.ok(!localHtml.includes('viewYearCanIndex'));
    const invalidHtml = renderToStaticMarkup(React.createElement(LocalReport, { result: {} }));
    assert.ok(invalidHtml.includes('chưa đủ dữ liệu'));
    assert.ok(!invalidHtml.includes('<details'));
    const render = text => renderToStaticMarkup(React.createElement(Provider, { result },
      React.createElement(Answer, { text }), ...result.palates.map(p => React.createElement(Palace, { palace: p, key: p.chiIndex }))));
    const html = render(JSON.stringify({ version: 1, sections: [{ title: 'Tổng quan', text: 'Luận giải có **căn cứ**', references: ['palace.0', 'palace.99'] }] }));
    assert.ok(html.includes('<strong>căn cứ</strong>'));
    assert.ok(html.includes('Xem căn cứ · 1'));
    assert.ok(html.includes('id="tuvi-palace.0"'));
    assert.ok(!html.includes('id="tuvi-palace.99"'));
    assert.ok(render('Luận giải cũ').includes('Luận giải cũ'));
    assert.ok(render('---SUGGESTED_QUESTIONS---\n1. Hỏi tiếp?').includes('AI chưa trả về nội dung luận giải'));

    const { buildBirthInputPayload } = await server.ssrLoadModule('/src/components/BirthInputForm.jsx');
    const { default: LasoChart } = await server.ssrLoadModule('/src/components/LasoChart.jsx');

    // Solar 2024-02-05 (pre-Tết) => Lunar 2023-12-26 Quý Mão, accepts viewYear=2023
    const solarPreTet = buildBirthInputPayload({
      name: 'Nguyễn Quý Mão',
      day: 5,
      month: 2,
      year: 2024,
      hourIndex: 3,
      gender: 1,
      isLunar: false,
      viewYear: 2023,
    });
    assert.equal(solarPreTet.lunarYear, 2023);
    assert.equal(solarPreTet.lunarMonth, 12);
    assert.equal(solarPreTet.lunarDay, 26);
    assert.equal(solarPreTet.yearCanName, 'Quý');
    assert.equal(solarPreTet.yearChiName, 'Mão');
    assert.equal(solarPreTet.viewYear, 2023);
    const solarPreTetChart = anLaSoTuVi(solarPreTet);
    assert.equal(solarPreTetChart.canChiNam, 'Quý Mão');
    assert.equal(solarPreTetChart.banMenhNapAm, 'Kim Bạc Kim');
    assert.equal(solarPreTetChart.tuoiAm, 1);

    // Rejects viewYear before lunarYear (2022 < 2023)
    assert.throws(() => buildBirthInputPayload({
      name: 'Nguyễn Quý Mão',
      day: 5,
      month: 2,
      year: 2024,
      hourIndex: 3,
      gender: 1,
      isLunar: false,
      viewYear: 2022,
    }), /năm sinh âm lịch/i);

    // Lunar mode does not populate solarInput with lunar numbers or render lunar date as solar
    const lunarInput = buildBirthInputPayload({
      name: 'Nguyễn Âm Lịch',
      day: 26,
      month: 12,
      year: 2023,
      hourIndex: 3,
      gender: 1,
      isLunar: true,
    });
    assert.equal(lunarInput.solarInput, null);
    assert.equal(lunarInput.yearCanName, 'Quý');
    assert.equal(lunarInput.yearChiName, 'Mão');
    const chartHtml = renderToStaticMarkup(React.createElement(LasoChart, { result: solarPreTetChart, inputData: lunarInput }));
    assert.ok(chartHtml.includes('(Nhập âm lịch)'));
    assert.ok(chartHtml.includes('26/12/2023'));
  } finally { await server.close(); }
});
