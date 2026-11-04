import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';

test('answer and actual palace components render evidence and legacy text', async () => {
  const server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
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
    assert.ok(chartHtml.includes('tuvi-tap-to-learn-banner'));
    assert.ok(chartHtml.includes('chart-export-wrapper'));
    assert.equal((chartHtml.match(/class="palace-card /g) || []).length, 12);
    assert.ok(chartHtml.includes('class="chart-center"'));

    // Mobile responsive CSS keeps center info first and stacks 12 palaces below 480px while preserving 4x4 export capture
    const css = fs.readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
    assert.match(css, /\.chart-export-wrapper\.is-exporting\s*\{[\s\S]*?min-width:\s*1024px/);
    assert.match(css, /\.chart-export-wrapper\.is-exporting\s+\.center-name\s*\{[\s\S]*?white-space:\s*nowrap/);
    assert.match(css, /\.chart-export-wrapper\.is-exporting\s+\.center-info-row\s*\{[\s\S]*?flex-wrap:\s*nowrap/);
    assert.match(css, /@media\s*\(max-width:\s*480px\)[\s\S]*?\.chart-export-wrapper:not\(\.is-exporting\)\s+\.chart-grid\s*\{[\s\S]*?flex-direction:\s*column[\s\S]*?min-width:\s*0/);
    assert.match(css, /@media\s*\(max-width:\s*480px\)[\s\S]*?\.chart-export-wrapper:not\(\.is-exporting\)\s+\.chart-center\s*\{[\s\S]*?order:\s*-1/);
  } finally { await server.close(); }
});

test('comprehensive SSR rendering of TuViPatternsPanel, LasoChart TimeNav, BirthInputForm, and TuViGlossaryModal', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [react()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });

  try {
    const { default: TuViPatternsPanel } = await server.ssrLoadModule('/src/components/TuViPatternsPanel.jsx');
    const { default: LasoChart } = await server.ssrLoadModule('/src/components/LasoChart.jsx');
    const { default: BirthInputForm } = await server.ssrLoadModule('/src/components/BirthInputForm.jsx');
    const { default: TuViGlossaryModal } = await server.ssrLoadModule('/src/components/TuViGlossaryModal.jsx');
    const { getStarDetail, FAMOUS_CHARTS } = await server.ssrLoadModule('/src/utils/tuViZiweiModule.js');

    const sampleChart = anLaSoTuVi({
      lunarYear: 1996,
      lunarMonth: 4,
      lunarDay: 12,
      lunarHourIndex: 3,
      yearCanIndex: 2,
      yearChiIndex: 0,
      gender: 1,
      viewYear: 2026,
      viewYearCanIndex: 2,
      viewYearChiIndex: 6,
    });
    const sampleInput = {
      name: 'Người Mẫu',
      day: 12,
      month: 4,
      year: 1996,
      hourIndex: 3,
      gender: 1,
      isLunar: true,
      viewYear: 2026,
    };

    // 1. TuViPatternsPanel SSR Rendering (all 4 tabs)
    // Tab 1: Cách Cục Đẩu Số
    const patternsHtml = renderToStaticMarkup(
      React.createElement(TuViPatternsPanel, { result: sampleChart, inputData: sampleInput, initialTab: 'patterns' })
    );
    assert.ok(patternsHtml.includes('Phân Tích Chuyên Sâu Đẩu Số'));
    assert.ok(patternsHtml.includes('Cách Cục Đẩu Số'));
    assert.ok(patternsHtml.includes('Thượng Cách'));
    assert.ok(patternsHtml.includes('Cát Cách'));
    assert.ok(patternsHtml.includes('Bình Hòa'));
    assert.ok(patternsHtml.includes('Hung Cách / Lưu Ý'));
    assert.ok(patternsHtml.includes('patterns-tabs-nav'));

    // Tab 2: Lai Nhân Cung & Phi Tinh Tứ Hóa
    const sihuaHtml = renderToStaticMarkup(
      React.createElement(TuViPatternsPanel, { result: sampleChart, inputData: sampleInput, initialTab: 'sihua' })
    );
    assert.ok(sihuaHtml.includes('LAI NHÂN CUNG'));
    assert.ok(sihuaHtml.includes('flying-sihua-table'));
    assert.ok(sihuaHtml.includes('Hóa Lộc'));
    assert.ok(sihuaHtml.includes('Hóa Quyền'));
    assert.ok(sihuaHtml.includes('Hóa Khoa'));
    assert.ok(sihuaHtml.includes('Hóa Kỵ'));
    assert.ok(sihuaHtml.includes('Tự Hóa'));

    // Tab 3: Thơ Cân Xương Đoán Số
    const canLuongHtml = renderToStaticMarkup(
      React.createElement(TuViPatternsPanel, { result: sampleChart, inputData: sampleInput, initialTab: 'canLuong' })
    );
    assert.ok(canLuongHtml.includes('CÂN XƯƠNG ĐOÁN SỐ'));
    assert.ok(canLuongHtml.includes('Bài Thơ Hán Việt'));
    assert.ok(canLuongHtml.includes('Luận Giải Chi Tiết Vận Mệnh'));
    assert.ok(canLuongHtml.includes(sampleChart.canLuongStr));

    // Also verify poemDichNghia rendering when supplied via ziweiMeta
    const customPoemChart = {
      ...sampleChart,
      ziweiMeta: {
        canLuongPoem: {
          canLuongStr: '5 lượng 2 chỉ',
          title: 'Phú Quý Song Toàn',
          poemHanViet: 'Nhất thế hanh thông...',
          poemDichNghia: 'Một đời thông suốt muôn sự thành...',
          interpretation: 'Tài năng toàn diện...',
        },
      },
    };
    const customPoemHtml = renderToStaticMarkup(
      React.createElement(TuViPatternsPanel, { result: customPoemChart, inputData: sampleInput, initialTab: 'canLuong' })
    );
    assert.ok(customPoemHtml.includes('Thơ Dịch Nghĩa'));
    assert.ok(customPoemHtml.includes('Một đời thông suốt muôn sự thành...'));

    // Tab 4: Thư Viện Cổ Thư & Thiên Kỷ
    const classicsHtml = renderToStaticMarkup(
      React.createElement(TuViPatternsPanel, { result: sampleChart, inputData: sampleInput, initialTab: 'classics' })
    );
    assert.ok(classicsHtml.includes('classics-search-input'));
    assert.ok(classicsHtml.includes('classics-book-tabs'));
    assert.ok(classicsHtml.includes('Tử Vi Đẩu Số Toàn Thư'));
    assert.ok(classicsHtml.includes('Đẩu Số Cốt Tủy Phú'));
    assert.ok(classicsHtml.includes('Thiên Kỷ Nghê Hải Hạ'));
    assert.ok(classicsHtml.includes('classic-passage-card'));
    assert.ok(classicsHtml.includes('Cổ Quyết / Hán Việt:'));
    assert.ok(classicsHtml.includes('Dịch Nghĩa &amp; Luận Giải:') || classicsHtml.includes('Dịch Nghĩa & Luận Giải:'));

    // 2. LasoChart with TimeNav (Bản Mệnh, Đại Hạn, Lưu Niên, Lưu Nguyệt)
    const mingpanChartHtml = renderToStaticMarkup(
      React.createElement(LasoChart, { result: sampleChart, inputData: sampleInput, initialYunxianMode: 'mingpan' })
    );
    assert.ok(mingpanChartHtml.includes('tuvi-timenav'));
    assert.ok(mingpanChartHtml.includes('Bản Mệnh'));
    assert.ok(mingpanChartHtml.includes('Đại Hạn (10 Năm)'));
    assert.ok(mingpanChartHtml.includes('Lưu Niên (1 Năm)'));
    assert.ok(mingpanChartHtml.includes('Lưu Nguyệt (Tháng)'));

    const daxianChartHtml = renderToStaticMarkup(
      React.createElement(LasoChart, { result: sampleChart, inputData: sampleInput, initialYunxianMode: 'daxian' })
    );
    assert.ok(daxianChartHtml.includes('daxian-subnav'));
    assert.ok(daxianChartHtml.includes('Chọn Kỳ Đại Hạn:'));
    assert.ok(daxianChartHtml.includes('daxian-chip'));

    const liunianChartHtml = renderToStaticMarkup(
      React.createElement(LasoChart, { result: sampleChart, inputData: sampleInput, initialYunxianMode: 'liunian' })
    );
    assert.ok(liunianChartHtml.includes('liunian-subnav'));
    assert.ok(liunianChartHtml.includes('year-stepper'));

    const liuyueChartHtml = renderToStaticMarkup(
      React.createElement(LasoChart, { result: sampleChart, inputData: sampleInput, initialYunxianMode: 'liuyue' })
    );
    assert.ok(liuyueChartHtml.includes('liuyue-subnav'));
    assert.ok(liuyueChartHtml.includes('liuyue-chip'));

    // 3. BirthInputForm with FAMOUS_CHARTS, Chân Thái Dương Thời, and Cấu Hình Trường Phái
    const birthFormHtml = renderToStaticMarkup(
      React.createElement(BirthInputForm, {
        onSubmit: () => {},
        initialShowTrueSolar: true,
        initialShowSchoolConfig: true,
      })
    );
    assert.ok(birthFormHtml.includes('Chọn Nhanh Lá Số Mẫu / Danh Nhân'));
    assert.ok(birthFormHtml.includes('famous-charts-strip'));
    for (const famous of FAMOUS_CHARTS.slice(0, 5)) {
      assert.ok(birthFormHtml.includes(famous.name), `FAMOUS_CHARTS should contain ${famous.name}`);
    }
    // Chân Thái Dương Thời section & controls
    assert.ok(birthFormHtml.includes('Hiệu Chỉnh Giờ Mặt Trời Thật (Chân Thái Dương Thời)'));
    assert.ok(birthFormHtml.includes('Tỉnh / Thành phố nơi sinh'));
    assert.ok(birthFormHtml.includes('Kinh độ (°E)'));
    assert.ok(birthFormHtml.includes('Chân Thái Dương'));

    // Cấu Hình Trường Phái & Lịch Pháp section & controls
    assert.ok(birthFormHtml.includes('Cấu Hình Trường Phái &amp; Lịch Pháp') || birthFormHtml.includes('Cấu Hình Trường Phái & Lịch Pháp'));
    assert.ok(birthFormHtml.includes('Phân Đoạn Giờ Tý Sớm / Muộn (23:00–00:00)'));
    assert.ok(birthFormHtml.includes('Chính Sách Tháng Nhuận'));
    assert.ok(birthFormHtml.includes('Trường Phái Độ Sáng Sao (Miếu / Vượng / Đắc / Hãm)'));
    assert.ok(birthFormHtml.includes('Trường Phái Tứ Hóa Can Canh'));

    // 4. TuViGlossaryModal rendering deep star details
    const starDetail = getStarDetail('Tử Vi');
    assert.ok(starDetail, 'getStarDetail("Tử Vi") must return detail');
    assert.equal(starDetail.name, 'Tử Vi');
    assert.ok(starDetail.classicQuote, 'classicQuote must exist');
    assert.ok(starDetail.niHaixiaQuote, 'niHaixiaQuote must exist');
    assert.ok(starDetail.career, 'career must exist');
    assert.ok(starDetail.health, 'health must exist');

    const glossaryModalHtml = renderToStaticMarkup(
      React.createElement(TuViGlossaryModal, { term: 'Tử Vi', onClose: () => {} })
    );
    assert.ok(glossaryModalHtml.includes('Tử Vi'));
    assert.ok(glossaryModalHtml.includes('Chính Tinh'));
    assert.ok(glossaryModalHtml.includes('Điển Tích &amp; Cổ Quyết Đẩu Số') || glossaryModalHtml.includes('Điển Tích & Cổ Quyết Đẩu Số'));
    assert.ok(glossaryModalHtml.includes(starDetail.classicQuote.replace(/"/g, '&quot;')));
    assert.ok(glossaryModalHtml.includes('Nghê Hải Hạ Tiên Sinh Giảng Trong 《Thiên Kỷ》'));
    assert.ok(glossaryModalHtml.includes(starDetail.niHaixiaQuote.replace(/"/g, '&quot;')));
    assert.ok(glossaryModalHtml.includes('Công danh &amp; Sự nghiệp') || glossaryModalHtml.includes('Công danh & Sự nghiệp'));
    assert.ok(glossaryModalHtml.includes(starDetail.career));
    assert.ok(glossaryModalHtml.includes('Sức khỏe &amp; Đông Y Nhân Kỷ') || glossaryModalHtml.includes('Sức khỏe & Đông Y Nhân Kỷ'));
    assert.ok(glossaryModalHtml.includes(starDetail.health));

    // 5. TuViSelfGuidePanel SSR Rendering (all 6 beginner steps)
    const { default: TuViSelfGuidePanel } = await server.ssrLoadModule('/src/components/TuViSelfGuidePanel.jsx');
    const { default: ShareCard } = await server.ssrLoadModule('/src/components/ShareCard.jsx');

    const guideHtml = renderToStaticMarkup(
      React.createElement(TuViSelfGuidePanel, { result: sampleChart, inputData: sampleInput })
    );
    assert.ok(guideHtml.includes('Hướng Dẫn Tự Đọc Lá Số Của Bạn (6 Bước Dễ Hiểu)'));
    assert.ok(guideHtml.includes('Dành cho người mới'));
    assert.ok(guideHtml.includes('Nền Tảng Bản Mệnh &amp; Cục') || guideHtml.includes('Nền Tảng Bản Mệnh & Cục'));
    assert.ok(guideHtml.includes('Cung Mệnh &amp; Cung Thân') || guideHtml.includes('Cung Mệnh & Cung Thân'));
    assert.ok(guideHtml.includes('Tam Phương Tứ Chính'));
    assert.ok(guideHtml.includes('Tứ Hóa &amp; Phi Tinh') || guideHtml.includes('Tứ Hóa & Phi Tinh'));
    assert.ok(guideHtml.includes('Cách Xem Vận Hạn'));
    assert.ok(guideHtml.includes('Cách Cục, Cổ Thư &amp; AI') || guideHtml.includes('Cách Cục, Cổ Thư & AI'));
    assert.ok(guideHtml.includes(sampleChart.amDuongNamNu));
    assert.ok(guideHtml.includes(sampleChart.banMenhNapAm));
    assert.ok(guideHtml.includes(sampleChart.cucName));

    // 6. LasoChart Export Wrapper includes .chart-export-yunxian-banner reflecting Đại Hạn / Lưu Niên / Lưu Nguyệt
    const daxianChartExportHtml = renderToStaticMarkup(
      React.createElement(LasoChart, {
        result: sampleChart,
        inputData: sampleInput,
        yunxianState: { mode: 'daxian', daXianChiIndex: 2, viewYear: 2026, lunarMonth: 1 },
      })
    );
    assert.ok(daxianChartExportHtml.includes('chart-export-yunxian-banner'));
    assert.ok(daxianChartExportHtml.includes('Đại Hạn:'));
    assert.ok(daxianChartExportHtml.includes('ĐH.Lộc:'));
    assert.ok(daxianChartExportHtml.includes('ĐH.Quyền:'));

    const liunianChartExportHtml = renderToStaticMarkup(
      React.createElement(LasoChart, {
        result: sampleChart,
        inputData: sampleInput,
        yunxianState: { mode: 'liunian', viewYear: 2028, lunarMonth: 1 },
      })
    );
    assert.ok(liunianChartExportHtml.includes('chart-export-yunxian-banner'));
    assert.ok(liunianChartExportHtml.includes('Lưu Niên: Năm 2028'));
    assert.ok(liunianChartExportHtml.includes('LN.Lộc:'));
    assert.ok(liunianChartExportHtml.includes('LN.Kỵ:'));

    const liuyueChartExportHtml = renderToStaticMarkup(
      React.createElement(LasoChart, {
        result: sampleChart,
        inputData: sampleInput,
        yunxianState: { mode: 'liuyue', viewYear: 2026, lunarMonth: 7 },
      })
    );
    assert.ok(liuyueChartExportHtml.includes('chart-export-yunxian-banner'));
    assert.ok(liuyueChartExportHtml.includes('Lưu Nguyệt: Tháng 7 Âm Lịch'));
    assert.ok(liuyueChartExportHtml.includes('LNg.Lộc:'));

    // 7. ShareCard with yunxianState
    const shareCardHtml = renderToStaticMarkup(
      React.createElement(ShareCard, {
        result: sampleChart,
        inputData: sampleInput,
        yunxianState: { mode: 'liunian', viewYear: 2026, lunarMonth: 1 },
      })
    );
    assert.ok(shareCardHtml.includes('share-card-wrapper'));
    assert.ok(shareCardHtml.includes('Chia sẻ lá số lên mạng xã hội'));
  } finally {
    await server.close();
  }
});
