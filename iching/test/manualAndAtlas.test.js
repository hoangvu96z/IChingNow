import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import {
  lineValueToLine,
  trigramsToLineValues,
  lineValuesToTrigrams,
  buildHexagram,
} from '../src/logic/buildHexagram.js';
import {
  getHexagramUnicode,
  getHoQuai,
  getThacQuai,
  getDaoQuai,
  getAtlasHexagramDetail,
  getTrigramMatrix,
  searchHexagramAtlas,
} from '../src/logic/hexagramAtlas.js';
import { normalizeVerification } from '../src/logic/verification.js';
import { buildIChingNoteNowPayload } from '../src/utils/noteNowPayload.js';

test('Nhập Quẻ Thực Tế (6/7/8/9 <-> Thượng×Hạ Quái) & buildHexagram theo ngày giờ tùy chọn', () => {
  assert.equal(lineValueToLine(6, 1).yinYang, 'yin');
  assert.equal(lineValueToLine(6, 1).moving, true);
  assert.equal(lineValueToLine(7, 2).yinYang, 'yang');
  assert.equal(lineValueToLine(7, 2).moving, false);
  assert.equal(lineValueToLine(8, 3).yinYang, 'yin');
  assert.equal(lineValueToLine(8, 3).moving, false);
  assert.equal(lineValueToLine(9, 4).yinYang, 'yang');
  assert.equal(lineValueToLine(9, 4).moving, true);
  assert.throws(() => lineValueToLine(5, 1), /Invalid line value/);

  // Đồng bộ 2 chiều: Thượng Khôn (000) + Hạ Càn (111) = Địa Thiên Thái (#11), động hào 1 & 6
  const vals = trigramsToLineValues('000', '111', [1, 6]);
  assert.deepEqual(vals, [9, 7, 7, 8, 8, 6]);
  const synced = lineValuesToTrigrams(vals);
  assert.deepEqual(synced, {
    lowerBits: '111',
    upperBits: '000',
    movingIndices: [1, 6],
  });

  // Lập bàn Lục Hào từ số tay 6 hào [9, 7, 9, 7, 7, 9] vào 2026-10-31 20:02 (Thuần Càn -> Trạch Thủy Khốn)
  const chart = buildHexagram(
    [9, 7, 9, 7, 7, 9],
    { castDate: '2026-10-31', castTime: '20:02', question: 'Kiểm chứng sổ tay đồng xu' }
  );
  assert.equal(chart.primaryHexagram.nameVi, 'Thuần Càn');
  assert.equal(chart.changedHexagram.nameVi, 'Trạch Thủy Khốn');
  assert.deepEqual(chart.movingLines, [1, 3, 6]);
  assert.equal(chart.canChi.ngayCan, 'Mậu');
  assert.equal(chart.canChi.ngayChi, 'Dần');
  assert.equal(chart.canChi.thangChi, 'Tuất');
});

test('Từ điển 64 Quẻ (Atlas): đầy đủ 64 quẻ, ma trận 8×8, Hỗ / Thác / Đảo Quái & tìm kiếm không dấu', () => {
  assert.equal(getHexagramUnicode(1), '䷀');
  assert.equal(getHexagramUnicode(64), '䷿');

  // Kiểm tra toàn bộ 64 quẻ
  for (let id = 1; id <= 64; id += 1) {
    const detail = getAtlasHexagramDetail(id);
    assert.ok(detail, `Thiếu dữ liệu Atlas cho quẻ #${id}`);
    assert.equal(detail.id, id);
    assert.ok(detail.nameVi.length > 0);
    assert.ok(detail.thoanTu.summaryVi.length > 0);
    assert.ok(detail.daiTuong.hanViet.length > 0);
    assert.ok(detail.daiTuong.vi.length > 0);
    assert.equal(detail.haoDetails.length, 6);
    assert.equal(detail.haoDetails.filter((h) => h.isThe).length, 1);
    assert.equal(detail.haoDetails.filter((h) => h.isUng).length, 1);
    assert.ok(detail.relations.hoQuai?.id >= 1 && detail.relations.hoQuai?.id <= 64);
    assert.ok(detail.relations.thacQuai?.id >= 1 && detail.relations.thacQuai?.id <= 64);
    assert.ok(detail.relations.daoQuai?.id >= 1 && detail.relations.daoQuai?.id <= 64);
  }

  // Các cặp Hỗ / Thác / Đảo kinh điển
  assert.equal(getThacQuai(1).id, 2); // Thuần Càn <-> Thuần Khôn
  assert.equal(getThacQuai(11).id, 12); // Địa Thiên Thái <-> Thiên Địa Bĩ
  assert.equal(getDaoQuai(11).id, 12);
  assert.equal(getDaoQuai(3).id, 4); // Thủy Lôi Truân <-> Sơn Thủy Mông
  assert.equal(getThacQuai(63).id, 64); // Thủy Hỏa Ký Tế <-> Hỏa Thủy Vị Tế
  assert.equal(getDaoQuai(63).id, 64);
  assert.equal(getHoQuai(63).id, 64); // Hỗ của Ký Tế là Vị Tế!

  // Ma trận 8×8 Thượng × Hạ Quái bao phủ trọn vẹn 64 quẻ duy nhất
  const matrix = getTrigramMatrix();
  assert.equal(matrix.rows.length, 8);
  const seenIds = new Set();
  for (const row of matrix.rows) {
    assert.equal(row.cells.length, 8);
    for (const cell of row.cells) {
      seenIds.add(cell.id);
    }
  }
  assert.equal(seenIds.size, 64);

  // Tìm kiếm theo số, tên không dấu, từ khóa
  assert.equal(searchHexagramAtlas('11')[0].id, 11);
  assert.ok(searchHexagramAtlas('dia thien thai').some((h) => h.id === 11));
  assert.ok(searchHexagramAtlas('tai loc').length > 0);
});

test('Nghiệm Lý (normalizeVerification) & SaveToNoteNow payload (buildIChingNoteNowPayload)', () => {
  const v = normalizeVerification({
    status: 'accurate',
    actualDate: '2026-04-02',
    note: 'Ứng đúng ngày Thìn như dự báo Xung Mộ!',
  });
  assert.equal(v.status, 'accurate');
  assert.equal(v.actualDate, '2026-04-02');
  assert.ok(v.note.includes('Xung Mộ'));

  const fallback = normalizeVerification({ status: 'unknown-status', actualDate: 'bad-date' });
  assert.equal(fallback.status, 'pending');
  assert.equal(fallback.actualDate, '');

  const chart = buildHexagram(
    [9, 7, 8, 6, 7, 8],
    { castDate: '2026-03-15', castTime: '09:15', question: 'Xin việc mới tháng tới' }
  );
  const notePayload = buildIChingNoteNowPayload(chart);
  assert.equal(notePayload.sourceAppLabel, 'IChingNow');
  assert.equal(notePayload.bgColor, 'amber');
  assert.ok(notePayload.title.includes(chart.primaryHexagram.nameVi));
  assert.ok(notePayload.summaryLines.some((s) => s.includes('Chẩn đoán Lục Hào v2')));
  assert.ok(notePayload.checklistItems.length >= 2);

  const verifiedChart = {
    ...chart,
    verification: {
      status: 'accurate',
      actualDate: '2026-04-02',
      note: 'Nhận được offer đúng ngày Thìn',
    },
  };
  const verifiedPayload = buildIChingNoteNowPayload(verifiedChart);
  assert.equal(verifiedPayload.bgColor, 'amber');
  assert.ok(verifiedPayload.summaryLines.some((s) => s.includes('Nghiệm lý: Ứng nghiệm chuẩn')));
  assert.ok(verifiedPayload.summaryLines.some((s) => s.includes('2026-04-02')));
  assert.ok(verifiedPayload.summaryLines.some((s) => s.includes('Nhận được offer đúng ngày Thìn')));
});

test('SSR kiểm tra chuẩn Native <dialog closedby="any"> của HexagramAtlasModal, ManualHexagramInput & OutcomeVerificationCard', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [react()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { default: HexagramAtlasModal } = await server.ssrLoadModule('/src/components/HexagramAtlasModal.jsx');
    const { default: ManualHexagramInput } = await server.ssrLoadModule('/src/components/ManualHexagramInput.jsx');
    const { default: OutcomeVerificationCard } = await server.ssrLoadModule('/src/components/OutcomeVerificationCard.jsx');

    const atlasHtml = renderToStaticMarkup(
      React.createElement(HexagramAtlasModal, {
        isOpen: true,
        onClose: () => {},
        initialHexId: 11,
        defaultBrowseMode: 'matrix',
        onCastHexagram: () => {},
      })
    );
    assert.ok(atlasHtml.startsWith('<dialog'));
    assert.ok(atlasHtml.includes('closedby="any"'));
    assert.ok(atlasHtml.includes('aria-labelledby="hexagram-atlas-title"'));
    assert.ok(!atlasHtml.includes('role="dialog"'));
    assert.ok(!atlasHtml.includes('aria-modal='));
    assert.ok(atlasHtml.includes('tabindex="0"'));
    assert.ok(atlasHtml.includes('Lập bàn Lục Hào với quẻ này'));

    const manualHtml = renderToStaticMarkup(
      React.createElement(ManualHexagramInput, {
        formData: { castDate: '2026-03-15', castTime: '10:30' },
        onComplete: () => {},
      })
    );
    assert.ok(manualHtml.includes('role="tablist"'));
    assert.ok(manualHtml.includes('Nhập Quẻ Thực Tế / Sổ Tay'));

    const chart = buildHexagram([7, 8, 9, 7, 8, 6], '2026-03-15T10:30');
    const verHtml = renderToStaticMarkup(
      React.createElement(OutcomeVerificationCard, {
        readingId: 'reading-123',
        result: chart,
        onSaveVerification: async () => {},
      })
    );
    assert.ok(verHtml.includes('Nhật Ký Nghiệm Lý'));
    assert.ok(verHtml.includes('Lưu Nghiệm Lý'));
  } finally {
    await server.close();
  }
});
