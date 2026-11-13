import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLucHao } from '../src/logic/lucHaoAnalysis.js';
import { buildHexagram } from '../src/logic/buildHexagram.js';
import { buildLucHaoPromptContext } from '../src/utils/promptBuilder.js';
import { getTruongSinhStage } from '../src/data/lucYao.js';

function makeLine({
  index,
  chi,
  element,
  lucThan,
  moving = false,
  theUng = '',
  dayChi = 'Tý',
  monthChi = 'Dần',
  khongVong = [],
}) {
  return {
    index,
    chi,
    nguHanhHao: element,
    lucThan,
    moving,
    theUng,
    isKhongVong: khongVong.includes(chi),
    tsNgay: getTruongSinhStage(element, dayChi)?.name || '',
    tsThang: getTruongSinhStage(element, monthChi)?.name || '',
  };
}

function makeChart({
  palaceElement = 'Kim',
  monthChi = 'Mão',
  dayChi = 'Dậu',
  khongVong = [],
  castDate = '2026-03-15',
  lines,
  changedMap = {},
  phucThanMap = {},
}) {
  const theLine = lines.find((l) => l.theUng === 'Thế') || lines[0];
  const ungLine = lines.find((l) => l.theUng === 'Ứng') || lines[3];
  const movingLines = lines.filter((l) => l.moving).map((l) => l.index);
  const changedLines = lines.map((l) => {
    const ch = changedMap[l.index];
    return {
      index: l.index,
      chi: ch?.chi || l.chi,
      nguHanhHao: ch?.element || l.nguHanhHao,
      lucThan: ch?.lucThan || l.lucThan,
    };
  });

  return {
    castDate,
    palaceName: 'Càn',
    palaceElement,
    theHao: theLine.index,
    ungHao: ungLine.index,
    khongVong,
    movingLines,
    canChi: {
      thangChi: monthChi,
      ngayChi: dayChi,
      ngayCan: 'Giáp',
      thangCan: 'Ất',
      ngay: `Giáp ${dayChi}`,
      thang: `Ất ${monthChi}`,
    },
    lines,
    changedLines: movingLines.length ? changedLines : null,
    phucThanMap,
  };
}

test('Ám Động vs Nhật Phá vs Xung Tán vs Xung Khởi trên Dụng Thần bị Nhật xung', () => {
  const baseLines = (moving = false, monthChi = 'Mão', dayChi = 'Dậu') => [
    makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', monthChi, dayChi }),
    makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', moving, monthChi, dayChi }),
    makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi, dayChi }),
    makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi, dayChi }),
    makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', monthChi, dayChi }),
    makeLine({ index: 6, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Thế', monthChi, dayChi }),
  ];

  // 1. Hào tĩnh Mão (Mộc) đang Vượng tại tháng Mão, gặp ngày Dậu xung -> Ám Động (+1.5)
  const amDongChart = makeChart({
    monthChi: 'Mão',
    dayChi: 'Dậu',
    lines: baseLines(false, 'Mão', 'Dậu'),
  });
  const amDongRes = analyzeLucHao(amDongChart, 'tai-loc');
  assert.equal(amDongRes.primaryDT.isAmDong, true);
  assert.equal(amDongRes.primaryDT.isNhatPha, false);
  assert.ok(amDongRes.factors.some((f) => f.code === 'am-dong' && f.delta === 1.5));
  assert.equal(amDongRes.advancedDiagnostics.amDongLines.length, 1);

  // 2. Hào tĩnh Mão (Mộc) đang Tử tại tháng Thân, gặp ngày Dậu xung -> Nhật Phá (-2.5)
  const nhatPhaChart = makeChart({
    monthChi: 'Thân',
    dayChi: 'Dậu',
    lines: baseLines(false, 'Thân', 'Dậu'),
  });
  const nhatPhaRes = analyzeLucHao(nhatPhaChart, 'tai-loc');
  assert.equal(nhatPhaRes.primaryDT.isNhatPha, true);
  assert.equal(nhatPhaRes.primaryDT.isAmDong, false);
  assert.ok(nhatPhaRes.factors.some((f) => f.code === 'nhat-pha' && f.delta === -2.5));
  assert.equal(nhatPhaRes.advancedDiagnostics.nhatPhaLines.length, 1);

  // 3. Hào động Mão suy yếu (tháng Thân) gặp ngày Dậu xung -> Xung Tán (-2.5)
  const xungTanChart = makeChart({
    monthChi: 'Thân',
    dayChi: 'Dậu',
    lines: baseLines(true, 'Thân', 'Dậu'),
    changedMap: { 2: { chi: 'Thìn', element: 'Thổ' } },
  });
  const xungTanRes = analyzeLucHao(xungTanChart, 'tai-loc');
  assert.equal(xungTanRes.primaryDT.isXungTan, true);
  assert.ok(xungTanRes.factors.some((f) => f.code === 'xung-tan' && f.delta === -2.5));

  // 4. Hào động Mão vượng tướng (tháng Mão) gặp ngày Dậu xung -> Xung Khởi (-0.5)
  const xungKhoiChart = makeChart({
    monthChi: 'Mão',
    dayChi: 'Dậu',
    lines: baseLines(true, 'Mão', 'Dậu'),
    changedMap: { 2: { chi: 'Thìn', element: 'Thổ' } },
  });
  const xungKhoiRes = analyzeLucHao(xungKhoiChart, 'tai-loc');
  assert.equal(xungKhoiRes.primaryDT.isXungKhoi, true);
  assert.ok(xungKhoiRes.factors.some((f) => f.code === 'xung-khoi' && f.delta === -0.5));
});

test('Chuỗi Tham Sinh Vong Khắc (+2.5) và Cừu Thần động khắc Nguyên sinh Kỵ (-2)', () => {
  // Dụng Thần: Thê Tài Mão (Mộc). Nguyên Thần: Tử Tôn Tý (Thủy). Kỵ Thần: Huynh Đệ Thân (Kim). Cừu Thần: Phụ Mẫu Thìn (Thổ).
  // Cả Huynh Đệ Thân (Kim) và Tử Tôn Tý (Thủy) cùng động, không bị Phá/Hợp Trụ -> Kim sinh Thủy, Thủy sinh Mộc!
  const tsvkChart = makeChart({
    monthChi: 'Thìn',
    dayChi: 'Mùi',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', moving: true, monthChi: 'Thìn', dayChi: 'Mùi' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Thìn', dayChi: 'Mùi' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi: 'Thìn', dayChi: 'Mùi' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Thìn', dayChi: 'Mùi' }),
      makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', moving: true, monthChi: 'Thìn', dayChi: 'Mùi' }),
      makeLine({ index: 6, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Thế', monthChi: 'Thìn', dayChi: 'Mùi' }),
    ],
    changedMap: {
      1: { chi: 'Thân', element: 'Kim' },
      5: { chi: 'Dậu', element: 'Kim' },
    },
  });

  const tsvkRes = analyzeLucHao(tsvkChart, 'wealth');
  assert.equal(tsvkRes.advancedDiagnostics.chainSummary.isThamSinhVongKhac, true);
  assert.equal(
    tsvkRes.advancedDiagnostics.chainSummary.summaryVi,
    'Tham sinh vong khắc: Kỵ Thần động sinh Nguyên Thần, Nguyên Thần tiếp tục sinh Dụng Thần — chuyển hung thành cát!'
  );
  assert.ok(tsvkRes.factors.some((f) => f.code === 'tham-sinh-vong-khac' && f.delta === 2.5));
  assert.ok(!tsvkRes.factors.some((f) => f.code === 'ky-than-khac'));

  // Khi Nguyên Thần (Tý) tĩnh, còn Cừu Thần (Thìn - Thổ) và Kỵ Thần (Thân - Kim) cùng động -> Cừu Thần chain (-1.5 thêm ngoài Kỵ Thần -2)
  const cuuChart = makeChart({
    monthChi: 'Thân',
    dayChi: 'Mão',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', moving: false, monthChi: 'Thân', dayChi: 'Mão' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Thân', dayChi: 'Mão' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', moving: true, theUng: 'Ứng', monthChi: 'Thân', dayChi: 'Mão' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Thân', dayChi: 'Mão' }),
      makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', moving: true, monthChi: 'Thân', dayChi: 'Mão' }),
      makeLine({ index: 6, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Thế', monthChi: 'Thân', dayChi: 'Mão' }),
    ],
    changedMap: {
      3: { chi: 'Mùi', element: 'Thổ' },
      5: { chi: 'Dậu', element: 'Kim' },
    },
  });

  const cuuRes = analyzeLucHao(cuuChart, 'wealth');
  assert.equal(cuuRes.advancedDiagnostics.chainSummary.isCuuThanChain, true);
  assert.ok(cuuRes.factors.some((f) => f.code === 'cuu-than-chain' && f.delta === -1.5));
});

test('Tam Hợp Cục (3 cách thành cục + loại trừ Hóa Thoái) & Hợp Trụ', () => {
  // (a) 3 hào động Thân – Tý – Thìn hợp Thủy cục sinh Dụng Thần Thê Tài Mão (Mộc) -> +2.5
  const threeMovingChart = makeChart({
    monthChi: 'Hợi',
    dayChi: 'Mùi',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', moving: true, monthChi: 'Hợi', dayChi: 'Mùi' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Hợi', dayChi: 'Mùi' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', moving: true, theUng: 'Ứng', monthChi: 'Hợi', dayChi: 'Mùi' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Hợi', dayChi: 'Mùi' }),
      makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', moving: true, monthChi: 'Hợi', dayChi: 'Mùi' }),
      makeLine({ index: 6, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Thế', monthChi: 'Hợi', dayChi: 'Mùi' }),
    ],
    changedMap: {
      1: { chi: 'Sửu', element: 'Thổ' },
      3: { chi: 'Dậu', element: 'Kim' },
      5: { chi: 'Dậu', element: 'Kim' },
    },
  });
  const threeMovingRes = analyzeLucHao(threeMovingChart, 'wealth');
  const thuyCuc = threeMovingRes.advancedDiagnostics.tamHopCucs.find((c) => c.id === 'thuy');
  assert.ok(thuyCuc);
  assert.equal(thuyCuc.formationType, 'three-moving');
  assert.equal(thuyCuc.delta, 2.5);

  // Nếu 1 trong 3 hào bị Hóa Thoái (Thìn -> Sửu là Hóa Thoái vì TIEN_THAN['Sửu'] === 'Thìn')?
  // Kiểm tra Hóa Thoái Dậu -> Thân trong Kim cục Tỵ – Dậu – Sửu: bị loại trừ không thành cục!
  const hoaThoaiDisqualified = makeChart({
    monthChi: 'Thân',
    dayChi: 'Tý',
    lines: [
      makeLine({ index: 1, chi: 'Tỵ', element: 'Hỏa', lucThan: 'Quan Quỷ', moving: true, monthChi: 'Thân', dayChi: 'Tý' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Thân', dayChi: 'Tý' }),
      makeLine({ index: 3, chi: 'Sửu', element: 'Thổ', lucThan: 'Phụ Mẫu', moving: true, theUng: 'Ứng', monthChi: 'Thân', dayChi: 'Tý' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Thân', dayChi: 'Tý' }),
      makeLine({ index: 5, chi: 'Dậu', element: 'Kim', lucThan: 'Huynh Đệ', moving: true, monthChi: 'Thân', dayChi: 'Tý' }),
      makeLine({ index: 6, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Thế', monthChi: 'Thân', dayChi: 'Tý' }),
    ],
    changedMap: {
      1: { chi: 'Mùi', element: 'Thổ' },
      3: { chi: 'Thìn', element: 'Thổ' },
      5: { chi: 'Thân', element: 'Kim' }, // Dậu -> Thân = Hóa Thoái!
    },
  });
  const disqRes = analyzeLucHao(hoaThoaiDisqualified, 'wealth');
  assert.equal(disqRes.advancedDiagnostics.tamHopCucs.find((c) => c.id === 'kim'), undefined);

  // (b) 2 hào động Dần + Ngọ + Nhật thần Tuất -> Tam Hợp Hỏa cục khắc Dụng Thần Huynh Đệ Thân (Kim) (-2.5)
  const twoPlusDayChart = makeChart({
    monthChi: 'Ngọ',
    dayChi: 'Tuất',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', monthChi: 'Ngọ', dayChi: 'Tuất' }),
      makeLine({ index: 2, chi: 'Dần', element: 'Mộc', lucThan: 'Thê Tài', moving: true, monthChi: 'Ngọ', dayChi: 'Tuất' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi: 'Ngọ', dayChi: 'Tuất' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', moving: true, monthChi: 'Ngọ', dayChi: 'Tuất' }),
      makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', monthChi: 'Ngọ', dayChi: 'Tuất' }),
      makeLine({ index: 6, chi: 'Hợi', element: 'Thủy', lucThan: 'Tử Tôn', theUng: 'Thế', monthChi: 'Ngọ', dayChi: 'Tuất' }),
    ],
    changedMap: {
      2: { chi: 'Mão', element: 'Mộc' },
      4: { chi: 'Mùi', element: 'Thổ' },
    },
  });
  const twoPlusDayRes = analyzeLucHao(twoPlusDayChart, 'siblings');
  const hoaCuc = twoPlusDayRes.advancedDiagnostics.tamHopCucs.find((c) => c.id === 'hoa');
  assert.ok(hoaCuc);
  assert.equal(hoaCuc.formationType, 'two-moving-plus-stem-branch');
  assert.equal(hoaCuc.delta, -2.5);

  // (c) Nội quái hào 1 & 3 động + chi biến + Nguyệt kiến -> Hợi – Mão – Mùi Mộc cục tỷ hòa Dụng Thần Mộc (+2)
  const innerChangeChart = makeChart({
    monthChi: 'Hợi',
    dayChi: 'Thìn',
    lines: [
      makeLine({ index: 1, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', moving: true, monthChi: 'Hợi', dayChi: 'Thìn' }),
      makeLine({ index: 2, chi: 'Tỵ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Hợi', dayChi: 'Thìn' }),
      makeLine({ index: 3, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', moving: true, theUng: 'Ứng', monthChi: 'Hợi', dayChi: 'Thìn' }),
      makeLine({ index: 4, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', monthChi: 'Hợi', dayChi: 'Thìn' }),
      makeLine({ index: 5, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', monthChi: 'Hợi', dayChi: 'Thìn' }),
      makeLine({ index: 6, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', theUng: 'Thế', monthChi: 'Hợi', dayChi: 'Thìn' }),
    ],
    changedMap: {
      1: { chi: 'Dần', element: 'Mộc' }, // chú ý Mão->Dần là Hóa Thoái, đổi sang Mão->Tý hoặc Mùi
      3: { chi: 'Mùi', element: 'Thổ' },
    },
  });
  // Chỉnh hào 1 biến sang Mùi để tránh Hóa Thoái: hào 1 Hợi -> Mùi, hào 3 Tý -> Mão, tháng Hợi
  innerChangeChart.lines[0].chi = 'Hợi';
  innerChangeChart.lines[0].nguHanhHao = 'Thủy';
  innerChangeChart.lines[0].lucThan = 'Tử Tôn';
  innerChangeChart.lines[1].chi = 'Dần';
  innerChangeChart.lines[1].nguHanhHao = 'Mộc';
  innerChangeChart.lines[1].lucThan = 'Thê Tài';
  innerChangeChart.changedLines[0] = { index: 1, chi: 'Mùi', nguHanhHao: 'Thổ', lucThan: 'Phụ Mẫu' };
  innerChangeChart.changedLines[2] = { index: 3, chi: 'Mão', nguHanhHao: 'Mộc', lucThan: 'Thê Tài' };

  const innerRes = analyzeLucHao(innerChangeChart, 'wealth');
  const mocCuc = innerRes.advancedDiagnostics.tamHopCucs.find((c) => c.id === 'moc');
  assert.ok(mocCuc);
  assert.equal(mocCuc.formationType, 'inner-outer-change');
  assert.equal(mocCuc.delta, 2);

  // Hợp Trụ: Dụng Thần Mão động gặp ngày Tuất Lục Hợp (Mão – Tuất hợp) -> isHopTru = true
  const hopTruChart = makeChart({
    monthChi: 'Dần',
    dayChi: 'Tuất',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', monthChi: 'Dần', dayChi: 'Tuất' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', moving: true, monthChi: 'Dần', dayChi: 'Tuất' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi: 'Dần', dayChi: 'Tuất' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Dần', dayChi: 'Tuất' }),
      makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', moving: true, monthChi: 'Dần', dayChi: 'Tuất' }),
      makeLine({ index: 6, chi: 'Hợi', element: 'Thủy', lucThan: 'Tử Tôn', theUng: 'Thế', monthChi: 'Dần', dayChi: 'Tuất' }),
    ],
    changedMap: {
      2: { chi: 'Tý', element: 'Thủy' },
      5: { chi: 'Dậu', element: 'Kim' },
    },
  });
  // Ngày Tỵ Lục Hợp với Kỵ Thần Thân (Thân – Tỵ hợp), đồng thời Nguyệt kiến Tuất Lục Hợp với Dụng Thần Mão!
  hopTruChart.canChi.ngayChi = 'Tỵ';
  hopTruChart.canChi.thangChi = 'Tuất';
  const hopTruRes = analyzeLucHao(hopTruChart, 'wealth');
  assert.equal(hopTruRes.primaryDT.isHopTru, true);
  assert.ok(hopTruRes.advancedDiagnostics.hopTruLines.some((h) => h.index === 2));
  assert.ok(hopTruRes.advancedDiagnostics.hopTruLines.some((h) => h.index === 5 && h.isKyThanBound));
});

test('Nhập Mộ (Nhật Mộ, Hóa Mộ, Động Mộ) và Hóa Tuyệt (trừ Thổ biến Tỵ Tuyệt xứ phùng sinh)', () => {
  // 1. Hỏa Dụng Thần (Quan Quỷ Ngọ) gặp ngày Tuất (Mộ của Hỏa) + hào 5 biến sang Tuất (Hóa Mộ)
  const nhapMoChart = makeChart({
    monthChi: 'Thân',
    dayChi: 'Tuất',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', monthChi: 'Thân', dayChi: 'Tuất' }),
      makeLine({ index: 2, chi: 'Dần', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Thân', dayChi: 'Tuất' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi: 'Thân', dayChi: 'Tuất' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', moving: true, monthChi: 'Thân', dayChi: 'Tuất' }),
      makeLine({ index: 5, chi: 'Dậu', element: 'Kim', lucThan: 'Huynh Đệ', monthChi: 'Thân', dayChi: 'Tuất' }),
      makeLine({ index: 6, chi: 'Hợi', element: 'Thủy', lucThan: 'Tử Tôn', theUng: 'Thế', monthChi: 'Thân', dayChi: 'Tuất' }),
    ],
    changedMap: {
      4: { chi: 'Tuất', element: 'Thổ' },
    },
  });
  const nhapMoRes = analyzeLucHao(nhapMoChart, 'cong-viec');
  assert.equal(nhapMoRes.advancedDiagnostics.moDiagnostics.isNhapNhatMo, true);
  assert.equal(nhapMoRes.advancedDiagnostics.moDiagnostics.isHoaMo, true);
  assert.equal(nhapMoRes.ungKy.ruleCode, 'nhap-mo');

  // 2. Nhập Động Mộ: Dụng Thần Mộc (Mão) tĩnh, hào 6 Mùi (kho của Mộc) phát động
  const dongMoChart = makeChart({
    monthChi: 'Hợi',
    dayChi: 'Tý',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', monthChi: 'Hợi', dayChi: 'Tý' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Hợi', dayChi: 'Tý' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi: 'Hợi', dayChi: 'Tý' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Hợi', dayChi: 'Tý' }),
      makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', monthChi: 'Hợi', dayChi: 'Tý' }),
      makeLine({ index: 6, chi: 'Mùi', element: 'Thổ', lucThan: 'Phụ Mẫu', moving: true, theUng: 'Thế', monthChi: 'Hợi', dayChi: 'Tý' }),
    ],
    changedMap: {
      6: { chi: 'Sửu', element: 'Thổ' },
    },
  });
  const dongMoRes = analyzeLucHao(dongMoChart, 'wealth');
  assert.equal(dongMoRes.advancedDiagnostics.moDiagnostics.isNhapDongMo, true);
  assert.ok(dongMoRes.factors.some((f) => f.code === 'nhap-dong-mo'));

  // 3. Hóa Tuyệt: Thủy (Tử Tôn Tý) biến Tỵ (đất Tuyệt của Thủy) -> isHoaTuyet = true;
  // ngược lại Thổ (Phụ Mẫu Thìn) biến Tỵ (Hỏa sinh Thổ) -> isHoiDauSinh = true, isHoaTuyet = false!
  const hoaTuyetChart = makeChart({
    monthChi: 'Thân',
    dayChi: 'Dần',
    lines: [
      makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', moving: true, monthChi: 'Thân', dayChi: 'Dần' }),
      makeLine({ index: 2, chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài', monthChi: 'Thân', dayChi: 'Dần' }),
      makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', moving: true, theUng: 'Ứng', monthChi: 'Thân', dayChi: 'Dần' }),
      makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Thân', dayChi: 'Dần' }),
      makeLine({ index: 5, chi: 'Dậu', element: 'Kim', lucThan: 'Huynh Đệ', monthChi: 'Thân', dayChi: 'Dần' }),
      makeLine({ index: 6, chi: 'Hợi', element: 'Thủy', lucThan: 'Tử Tôn', theUng: 'Thế', monthChi: 'Thân', dayChi: 'Dần' }),
    ],
    changedMap: {
      1: { chi: 'Tỵ', element: 'Hỏa' },
      3: { chi: 'Tỵ', element: 'Hỏa' },
    },
  });
  // Chọn chủ đề study (Phụ Mẫu Thìn biến Tỵ): không bị Hóa Tuyệt!
  const thoToTyRes = analyzeLucHao(hoaTuyetChart, 'thi-cu');
  const h3 = thoToTyRes.enrichedLines.find((l) => l.index === 3);
  assert.equal(h3.isHoiDauSinh, true);
  assert.equal(h3.isHoaTuyet, false);
  // Kiểm tra hào 1 (Tý -> Tỵ) có isHoaTuyet = true
  const h1 = thoToTyRes.enrichedLines.find((l) => l.index === 1);
  assert.equal(h1.isHoaTuyet, true);
});

test('Phi Thần – Phục Thần: Phi sinh Phục, Phi khắc Phục bị đè nén, và Nhật/Nguyệt xung Phi giải cứu Phục Thần', () => {
  // Quẻ thiếu Thê Tài (Mộc), Thê Tài Dần (Mộc) phục dưới hào 5 Huynh Đệ Thân (Kim) -> Phi khắc Phục!
  const buildHiddenWealthChart = (dayChi) =>
    makeChart({
      monthChi: 'Thìn',
      dayChi,
      lines: [
        makeLine({ index: 1, chi: 'Tý', element: 'Thủy', lucThan: 'Tử Tôn', monthChi: 'Thìn', dayChi }),
        makeLine({ index: 2, chi: 'Sửu', element: 'Thổ', lucThan: 'Phụ Mẫu', monthChi: 'Thìn', dayChi }),
        makeLine({ index: 3, chi: 'Thìn', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Ứng', monthChi: 'Thìn', dayChi }),
        makeLine({ index: 4, chi: 'Ngọ', element: 'Hỏa', lucThan: 'Quan Quỷ', monthChi: 'Thìn', dayChi }),
        makeLine({ index: 5, chi: 'Thân', element: 'Kim', lucThan: 'Huynh Đệ', monthChi: 'Thìn', dayChi }),
        makeLine({ index: 6, chi: 'Tuất', element: 'Thổ', lucThan: 'Phụ Mẫu', theUng: 'Thế', monthChi: 'Thìn', dayChi }),
      ],
      phucThanMap: {
        5: { chi: 'Mão', element: 'Mộc', lucThan: 'Thê Tài' },
      },
    });

  // Ngày Thìn (không xung không khắc Phi Thần Thân) -> Phi khắc Phục không có cứu (-2)
  const suppressedRes = analyzeLucHao(buildHiddenWealthChart('Thìn'), 'wealth');
  assert.equal(suppressedRes.primaryDT.isPhucThan, true);
  assert.equal(suppressedRes.advancedDiagnostics.phucPhiDetail.relationType, 'khacHao');
  assert.equal(suppressedRes.advancedDiagnostics.phucPhiDetail.isRescuedByDayMonth, false);
  assert.ok(suppressedRes.factors.some((f) => f.code === 'phuc-phi-khacHao' && f.delta === -2));

  // Ngày Dần xung thẳng Phi Thần Thân (Dần – Thân tương xung) -> Giải cứu Phục Thần lộ diện (+0.5)!
  const rescuedRes = analyzeLucHao(buildHiddenWealthChart('Dần'), 'wealth');
  assert.equal(rescuedRes.advancedDiagnostics.phucPhiDetail.isRescuedByDayMonth, true);
  assert.ok(rescuedRes.advancedDiagnostics.phucPhiDetail.summaryVi.includes('giải cứu Phục Thần'));
  assert.ok(rescuedRes.factors.some((f) => f.code === 'phuc-phi-khacHao' && f.delta === 0.5));
});

test('Thế – Ứng theo chủ đề kiện tụng / tình cảm & tích hợp buildLucHaoPromptContext', () => {
  const realHex = buildHexagram(
    [9, 7, 8, 6, 7, 8],
    { castDate: '2026-03-15', castTime: '10:30', question: 'Hỏi về hợp đồng kinh doanh và tài lộc quý tới' }
  );
  const res = analyzeLucHao(realHex, 'kien-tung');
  assert.equal(res.resolvedTopic, 'lawsuit');
  assert.ok(res.dungThanName);
  assert.ok(Array.isArray(res.dungThanLines));
  assert.ok(res.primaryDT);
  assert.equal(typeof res.score, 'number');
  assert.ok(['cat', 'binh', 'hung'].includes(res.verdict));
  assert.ok(res.verdictColor.startsWith('#'));
  assert.ok(Array.isArray(res.factors));
  assert.ok(Array.isArray(res.movingInteractions));
  assert.equal(typeof res.advice, 'string');
  assert.ok(res.advancedDiagnostics.theUngRelation);
  assert.ok(res.ungKy?.candidateDates?.length > 0);

  const promptBlock = buildLucHaoPromptContext(realHex, false);
  assert.ok(promptBlock.includes('Chẩn đoán Tăng San Bốc Dịch v2'));
  assert.ok(promptBlock.includes('Dự báo Ứng Kỳ'));
});
