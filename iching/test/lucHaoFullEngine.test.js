import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLucHaoResult, findPalaceInfo } from '../src/logic/buildHexagram.js';
import { HEXAGRAMS } from '../src/data/hexagrams.js';
import { computeNapGiap } from '../src/logic/napGiap.js';
import { getHexagramTrait } from '../src/data/lucYao.js';

test('buildLucHaoResult matches Minh Viet reference chart (2026-10-31 20:02, Thuan Can -> Trach Thuy Khon)', () => {
  const lines = [
    { index: 1, yinYang: 'yang', moving: true },
    { index: 2, yinYang: 'yang', moving: false },
    { index: 3, yinYang: 'yang', moving: true },
    { index: 4, yinYang: 'yang', moving: false },
    { index: 5, yinYang: 'yang', moving: false },
    { index: 6, yinYang: 'yang', moving: true },
  ];

  const res = buildLucHaoResult({
    formData: { castDate: '2026-10-31', castTime: '20:02', question: 'test' },
    lines,
    mode: 'manual',
  });

  // 1. Thời gian & Tứ Trụ Can Chi
  assert.equal(res.canChi.gioCan, 'Nhâm');
  assert.equal(res.canChi.gioChi, 'Tuất');
  assert.equal(res.canChi.ngayCan, 'Mậu');
  assert.equal(res.canChi.ngayChi, 'Dần');
  assert.equal(res.canChi.thangCan, 'Mậu');
  assert.equal(res.canChi.thangChi, 'Tuất');
  assert.equal(res.canChi.namCan, 'Bính');
  assert.equal(res.canChi.namChi, 'Ngọ');
  assert.equal(res.canChi.lunarDate, '2026/9/22');
  assert.equal(res.canChi.tietKhi, 'Sương Giáng');
  assert.equal(res.canChi.nhatThan, 'Dần-Mộc');
  assert.equal(res.canChi.nguyetLenh, 'Tuất-Thổ');
  assert.deepEqual(res.khongVong, ['Thân', 'Dậu']);

  // 2. Quẻ Chủ, Quẻ Hỗ, Quẻ Biến & Đặc tính (Lục Xung / Lục Hợp)
  assert.equal(res.primaryHexagram.nameVi, 'Thuần Càn');
  assert.equal(res.palaceName, 'Càn');
  assert.equal(res.palaceElement, 'Kim');
  assert.equal(res.theHao, 6);
  assert.equal(res.ungHao, 3);
  assert.equal(res.primaryTrait.code, 'luc-xung');
  assert.equal(res.primaryTrait.labelVi, 'Lục Xung');

  assert.equal(res.queHo.hexagram.nameVi, 'Thuần Càn');
  assert.equal(res.queHo.palaceName, 'Càn');
  assert.equal(res.queHo.trait.code, 'luc-xung');

  assert.equal(res.changedHexagram.nameVi, 'Trạch Thủy Khốn');
  assert.equal(res.changedPalaceName, 'Đoài');
  assert.equal(res.changedTheHao, 1);
  assert.equal(res.changedUngHao, 4);
  assert.equal(res.changedTrait.code, 'luc-hop');
  assert.equal(res.changedTrait.labelVi, 'Lục Hợp');

  // 3. Chi tiết 6 hào Quẻ Chủ (từ Hào 6 xuống Hào 1 như bảng mẫu)
  const primaryFromTop = [...res.lines].sort((a, b) => b.index - a.index);
  assert.deepEqual(
    primaryFromTop.map(l => ({
      idx: l.index,
      theUng: l.theUng,
      lucThan: l.lucThan,
      canChi: l.displayLabel,
      nh: l.nguHanhHao,
      kv: l.isKhongVong,
      qt: l.quaiThanLabel,
      tsNgay: l.tsNgay,
      tsThang: l.tsThang,
      loc: l.locLabel,
      ma: l.maLabel,
      dao: l.daoHoaLabel,
    })),
    [
      { idx: 6, theUng: 'Thế', lucThan: 'Phụ Mẫu',  canChi: 'Nhâm Tuất', nh: 'Thổ',  kv: false, qt: '-', tsNgay: 'Bệnh',   tsThang: 'Q.Đới', loc: '-', ma: '-', dao: '-' },
      { idx: 5, theUng: '',    lucThan: 'Huynh Đệ', canChi: 'Nhâm Thân', nh: 'Kim',  kv: true,  qt: '-', tsNgay: 'Tuyệt',  tsThang: 'Suy',   loc: '-', ma: 'M', dao: '-' },
      { idx: 4, theUng: '',    lucThan: 'Quan Quỷ', canChi: 'Nhâm Ngọ',  nh: 'Hỏa',  kv: false, qt: '-', tsNgay: 'T.Sinh', tsThang: 'Mộ',    loc: '-', ma: '-', dao: '-' },
      { idx: 3, theUng: 'Ứng', lucThan: 'Phụ Mẫu',  canChi: 'Giáp Thìn', nh: 'Thổ',  kv: false, qt: '-', tsNgay: 'Bệnh',   tsThang: 'Q.Đới', loc: '-', ma: '-', dao: '-' },
      { idx: 2, theUng: '',    lucThan: 'Thê Tài',  canChi: 'Giáp Dần',  nh: 'Mộc',  kv: false, qt: '-', tsNgay: 'L.Quan', tsThang: 'Dưỡng', loc: '-', ma: '-', dao: '-' },
      { idx: 1, theUng: '',    lucThan: 'Tử Tôn',   canChi: 'Giáp Tý',   nh: 'Thủy', kv: false, qt: '-', tsNgay: 'Bệnh',   tsThang: 'Q.Đới', loc: '-', ma: '-', dao: '-' },
    ]
  );

  // 4. Chi tiết 6 hào Quẻ Biến (từ Hào 6 xuống Hào 1 như bảng mẫu)
  const changedFromTop = [...res.changedLines].sort((a, b) => b.index - a.index);
  assert.deepEqual(
    changedFromTop.map(l => ({
      idx: l.index,
      theUng: l.theUng,
      lucThan: l.lucThan,
      canChi: l.displayLabel,
      nh: l.nguHanhHao,
      kv: l.isKhongVong,
      lucThu: l.lucThu,
      qt: l.quaiThanLabel,
      tsNgay: l.tsNgay,
      tsThang: l.tsThang,
      loc: l.locLabel,
      ma: l.maLabel,
      dao: l.daoHoaLabel,
    })),
    [
      { idx: 6, theUng: '',    lucThan: 'Phụ Mẫu',  canChi: 'Đinh Mùi', nh: 'Thổ',  kv: false, lucThu: 'Chu Tước',   qt: '-',  tsNgay: 'Bệnh',   tsThang: 'Q.Đới', loc: '-', ma: '-', dao: '-' },
      { idx: 5, theUng: '',    lucThan: 'Huynh Đệ', canChi: 'Đinh Dậu', nh: 'Kim',  kv: true,  lucThu: 'Thanh Long', qt: '-',  tsNgay: 'Tuyệt',  tsThang: 'Suy',   loc: '-', ma: '-', dao: '-' },
      { idx: 4, theUng: 'Ứng', lucThan: 'Tử Tôn',   canChi: 'Đinh Hợi', nh: 'Thủy', kv: false, lucThu: 'Huyền Vũ',   qt: '-',  tsNgay: 'Bệnh',   tsThang: 'Q.Đới', loc: '-', ma: '-', dao: '-' },
      { idx: 3, theUng: '',    lucThan: 'Quan Quỷ', canChi: 'Mậu Ngọ',  nh: 'Hỏa',  kv: false, lucThu: 'Bạch Hổ',    qt: 'QT', tsNgay: 'T.Sinh', tsThang: 'Mộ',    loc: '-', ma: '-', dao: '-' },
      { idx: 2, theUng: '',    lucThan: 'Phụ Mẫu',  canChi: 'Mậu Thìn', nh: 'Thổ',  kv: false, lucThu: 'Đằng Xà',    qt: '-',  tsNgay: 'Bệnh',   tsThang: 'Q.Đới', loc: '-', ma: '-', dao: '-' },
      { idx: 1, theUng: 'Thế', lucThan: 'Thê Tài',  canChi: 'Mậu Dần',  nh: 'Mộc',  kv: false, lucThu: 'Câu Trận',   qt: '-',  tsNgay: 'L.Quan', tsThang: 'Dưỡng', loc: '-', ma: '-', dao: '-' },
    ]
  );
});

test('64 hexagrams classify exact 10 Lục Xung and 8 Lục Hợp hexagrams', () => {
  const lucXungNames = [];
  const lucHopNames = [];

  for (const hex of HEXAGRAMS) {
    const lines = hex.binary.split('').map((b, i) => ({ index: i + 1, yinYang: b === '1' ? 'yang' : 'yin' }));
    const pInfo = findPalaceInfo(lines);
    const ng = computeNapGiap(hex.binary);
    const trait = getHexagramTrait(ng.map(l => l.chi), pInfo.queType);
    if (trait.code === 'luc-xung') lucXungNames.push(hex.nameVi);
    if (trait.code === 'luc-hop') lucHopNames.push(hex.nameVi);
  }

  assert.equal(lucXungNames.length, 10);
  assert.equal(lucHopNames.length, 8);
  assert.ok(lucXungNames.includes('Thuần Càn'));
  assert.ok(lucXungNames.includes('Thiên Lôi Vô Vọng'));
  assert.ok(lucXungNames.includes('Lôi Thiên Đại Tráng'));
  assert.ok(lucHopNames.includes('Trạch Thủy Khốn'));
  assert.ok(lucHopNames.includes('Hỏa Sơn Lữ'));
});
