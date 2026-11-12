import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import {
  COMPATIBILITY_VERSION,
  WEIGHTS,
  ROMANCE_STARS,
  buildCompatibility,
  createCompatibilityPerson,
  evaluateCompatibility,
  computeYearlyCompatibilityForecast,
  upgradeRestoredCompatibilityPair,
  compatibilityEvidence,
  compatibilityText,
  compatibilityPrompt,
} from '../src/utils/compatibility.js';
import { classifyCompatibilityTier } from '../src/utils/hopHonEngine.js';

const baseChong = {
  hoTen: 'Nguyễn Minh Quân',
  ngay: 6,
  thang: 4,
  nam: 1996, // Bính Tý - Giản Hạ Thủy
  gio: 6,
  gioiTinh: 'Nam',
};

const baseVo = {
  hoTen: 'Trần Thanh Hà',
  ngay: 24,
  thang: 7,
  nam: 2001, // Tân Tỵ - Bạch Lạp Kim
  gio: 7,
  gioiTinh: 'Nữ',
};

test('1. Four-pillar v2 structure, weights summing to 1.0, non-provisional cards, factors & tier math', () => {
  assert.equal(COMPATIBILITY_VERSION, 'tuvi-hophon-v2');
  assert.deepEqual(WEIGHTS, {
    tamHop: 0.35,
    phiTinh: 0.30,
    tinhCach: 0.20,
    nguHanhDaoHoa: 0.15,
  });

  const weightSum = Object.values(WEIGHTS).reduce((acc, w) => acc + w, 0);
  assert.equal(Number(weightSum.toFixed(4)), 1.0);
  assert.ok(Array.isArray(ROMANCE_STARS) && ROMANCE_STARS.includes('Hồng Loan'));

  const pair = buildCompatibility({ chong: baseChong, vo: baseVo });
  const { assessment } = pair;

  assert.equal(assessment.version, 'tuvi-hophon-v2');
  assert.equal(assessment.husbandName, baseChong.hoTen);
  assert.equal(assessment.wifeName, baseVo.hoTen);
  assert.ok(assessment.ratingSummary.length > 20);
  assert.ok(Array.isArray(assessment.strengths) && assessment.strengths.length > 0);
  assert.ok(Array.isArray(assessment.challenges) && assessment.challenges.length > 0);
  assert.ok(assessment.challenges.every((c) => typeof c.issue === 'string' && typeof c.remedy === 'string'));

  for (const key of ['tamHop', 'phiTinh', 'tinhCach', 'nguHanhDaoHoa']) {
    const card = assessment.cards[key];
    assert.ok(card, `missing card ${key}`);
    assert.equal(card.provisional, false);
    assert.equal(card.weight, WEIGHTS[key]);
    assert.ok(card.score >= 25 && card.score <= 98, `${key} score out of bounds: ${card.score}`);
    assert.ok(typeof card.title === 'string' && card.title.length > 0);
    assert.ok(typeof card.shortTitle === 'string' && card.shortTitle.length > 0);
    assert.ok(Array.isArray(card.factors) && card.factors.length > 0);
    for (const f of card.factors) {
      assert.equal(typeof f.label, 'string');
      assert.equal(typeof f.delta, 'number');
      assert.ok(['good', 'warn', 'neutral'].includes(f.kind));
    }
  }

  const expectedRaw = Number(
    (
      assessment.cards.tamHop.score * WEIGHTS.tamHop +
      assessment.cards.phiTinh.score * WEIGHTS.phiTinh +
      assessment.cards.tinhCach.score * WEIGHTS.tinhCach +
      assessment.cards.nguHanhDaoHoa.score * WEIGHTS.nguHanhDaoHoa
    ).toFixed(2)
  );
  assert.equal(assessment.rawScore, expectedRaw);
  assert.equal(assessment.totalScore, Math.round(expectedRaw));

  // Verify 4-tier classification boundaries
  assert.deepEqual(classifyCompatibilityTier(85), {
    tier: 'thuong_dang',
    ratingText: 'Thượng Đẳng Hợp Hôn · Duyên Khởi Tương Đắc',
  });
  assert.deepEqual(classifyCompatibilityTier(72), {
    tier: 'trung_thuong',
    ratingText: 'Trung Thượng Hợp Hôn · Tương Hợp & Bổ Khuyết Tốt',
  });
  assert.deepEqual(classifyCompatibilityTier(60), {
    tier: 'trung_binh',
    ratingText: 'Trung Bình Hòa Hợp · Cần Thấu Hiểu & Dung Hòa',
  });
  assert.deepEqual(classifyCompatibilityTier(48), {
    tier: 'can_hoa_giai',
    ratingText: 'Nhiều Điểm Đối Khắc · Cần Chủ Động Hóa Giải',
  });
});

test('2. Full Ngũ Hành Nạp Âm matrix (Sinh, Tỷ Hòa, Khắc + Đắc Cách exceptions) & Can-Chi relations', () => {
  // Tương Sinh: Tân Tỵ (Bạch Lạp Kim) sinh Bính Tý (Giản Hạ Thủy) + Bính-Tân Ngũ Hợp + Tý-Tỵ
  const sinhRes = evaluateCompatibility(
    { hoTen: 'A', menh: 'Thuy', napAm: 'Giản Hạ Thủy', canNam: 'Bính', chiNam: 'Tý' },
    { hoTen: 'B', menh: 'Kim', napAm: 'Bạch Lạp Kim', canNam: 'Tân', chiNam: 'Sửu' }
  );
  assert.match(sinhRes.elements.interaction, /Kim sinh Thủy/);
  assert.match(sinhRes.elements.thienCanRelation, /Ngũ Hợp/);
  assert.match(sinhRes.elements.diaChiRelation, /Lục Hợp/);
  assert.ok(sinhRes.cards.nguHanhDaoHoa.score >= 90);

  // Tỷ Hòa: Lưỡng Thủy thành giang
  const tyHoaRes = evaluateCompatibility(
    { hoTen: 'A', menh: 'Thuy', napAm: 'Giản Hạ Thủy', canNam: 'Bính', chiNam: 'Tý' },
    { hoTen: 'B', menh: 'Thuy', napAm: 'Trường Lưu Thủy', canNam: 'Nhâm', chiNam: 'Thìn' }
  );
  assert.match(tyHoaRes.elements.interaction, /Tỷ hòa/);
  assert.match(tyHoaRes.elements.thienCanRelation, /Tương Xung/); // Bính - Nhâm
  assert.match(tyHoaRes.elements.diaChiRelation, /Tam Hợp/); // Tý - Thìn

  // Tương Khắc Đắc Cách: Kiếm Phong Kim (Nhâm Thân) gặp Lư Trung Hỏa (Đinh Mão) -> Hỏa luyện Chân Kim!
  const dacCachKhac = evaluateCompatibility(
    { hoTen: 'A', menh: 'Kim', napAm: 'Kiếm Phong Kim', canNam: 'Nhâm', chiNam: 'Thân' },
    { hoTen: 'B', menh: 'Hoa', napAm: 'Lư Trung Hỏa', canNam: 'Đinh', chiNam: 'Tỵ' }
  );
  assert.match(dacCachKhac.elements.interaction, /Đắc cách Hỏa luyện Chân Kim/);
  assert.doesNotMatch(dacCachKhac.cards.nguHanhDaoHoa.detail, /chưa xử lý tương khắc/i);

  // Tương Khắc Nặng (Harsh Khắc) + Thiên Can Xung (Đinh-Quý) + Địa Chi Lục Xung (Mão-Dậu):
  // Đại Hải Thủy (Quý Hợi) khắc Lư Trung Hỏa (Đinh Mão) vs Tỵ-Hợi xung
  const harshKhac = evaluateCompatibility(
    { hoTen: 'A', menh: 'Thuy', napAm: 'Đại Hải Thủy', canNam: 'Quý', chiNam: 'Hợi' },
    { hoTen: 'B', menh: 'Hoa', napAm: 'Phúc Đăng Hỏa', canNam: 'Đinh', chiNam: 'Tỵ' }
  );
  assert.equal(harshKhac.elements.interaction, 'Thủy khắc Hỏa');
  assert.match(harshKhac.elements.thienCanRelation, /Tương Xung/); // Đinh - Quý
  assert.match(harshKhac.elements.diaChiRelation, /Lục Xung/); // Hợi - Tỵ
  assert.ok(harshKhac.cards.nguHanhDaoHoa.score < dacCachKhac.cards.nguHanhDaoHoa.score);
  assert.ok(harshKhac.challenges.some((c) => c.issue.includes('Thủy khắc Hỏa')));
});

test('3. Real 2-way Phi Tinh Tứ Hóa varies dynamically across charts and is never hardcoded 55', () => {
  const samplePairs = [
    {
      chong: { hoTen: 'Nam 1992', ngay: 15, thang: 8, nam: 1992, gio: 8, gioiTinh: 'Nam' },
      vo: { hoTen: 'Nữ 1995', ngay: 20, thang: 10, nam: 1995, gio: 14, gioiTinh: 'Nữ' },
    },
    {
      chong: { hoTen: 'Nam 1990', ngay: 12, thang: 3, nam: 1990, gio: 4, gioiTinh: 'Nam' },
      vo: { hoTen: 'Nữ 1993', ngay: 5, thang: 11, nam: 1993, gio: 20, gioiTinh: 'Nữ' },
    },
    {
      chong: { hoTen: 'Nam 1988', ngay: 22, thang: 6, nam: 1988, gio: 12, gioiTinh: 'Nam' },
      vo: { hoTen: 'Nữ 1991', ngay: 9, thang: 2, nam: 1991, gio: 2, gioiTinh: 'Nữ' },
    },
    {
      chong: baseChong,
      vo: baseVo,
    },
  ];

  const phiTinhScores = [];
  for (const p of samplePairs) {
    const built = buildCompatibility(p);
    const phi = built.assessment.cards.phiTinh;
    const detail = built.assessment.phiTinhDetail;
    assert.equal(phi.provisional, false);
    assert.ok(Array.isArray(detail.aToBFlights));
    assert.ok(Array.isArray(detail.bToAFlights));
    assert.ok(detail.aToBFlights.length + detail.bToAFlights.length > 0);
    assert.ok(Array.isArray(detail.internalFlows.personA));
    assert.ok(Array.isArray(detail.internalFlows.personB));
    assert.ok(typeof detail.whoSupportsWhom === 'string' && detail.whoSupportsWhom.length > 10);
    phiTinhScores.push(phi.score);
  }

  // Scores across distinct chart pairs must genuinely vary rather than being fixed at 55
  assert.ok(new Set(phiTinhScores).size >= 2, `Expected varied phiTinh scores, got ${phiTinhScores}`);
});

test('4. Dương Dịch Đức PP1 (2-way Mệnh ⇄ Phu Thê + VCD borrowing) & PP3 (Cương-Nhu + 5 traits) + individual profiles', () => {
  // Scan hours to ensure we also exercise at least one Vô Chính Diệu Mệnh or Phu Thê chart
  let foundVcd = false;
  for (let gio = 0; gio < 24; gio += 2) {
    const p = createCompatibilityPerson({ ...baseChong, gio });
    const { menh, phuThe } = p.person.palaceSummary;
    if (menh.isVoChinhDieu || phuThe.isVoChinhDieu) {
      foundVcd = true;
      const vcdPal = menh.isVoChinhDieu ? menh : phuThe;
      assert.equal(vcdPal.borrowedStars.isVoChinhDieu, true);
      assert.equal(vcdPal.borrowedStars.strengthRatio, 0.7);
      assert.ok(vcdPal.effectiveChinhTinhNames.length > 0);
      assert.ok(typeof vcdPal.tuanTrietNote === 'string' && vcdPal.tuanTrietNote.length > 0);
    }

    const temp = p.person.temperament;
    assert.ok(['Cuong', 'Nhu', 'CanBang'].includes(temp.mode));
    assert.equal(temp.yangScore + temp.yinScore, 100);
    for (const tKey of ['nongNay', 'hayGhen', 'tuAiCao', 'apDat', 'khacKhau']) {
      assert.ok(temp.traits[tKey] >= 10 && temp.traits[tKey] <= 95);
    }

    const love = p.person.individualLoveProfile;
    assert.ok(love.archetypeTitle.length > 5);
    assert.ok(love.spousePortrait.length > 20);
    assert.ok(love.phuTheAnalysis.length > 20);
    assert.ok(love.phucDucAnalysis.length > 20);
    assert.ok(Array.isArray(love.activeMarriageDecades) && love.activeMarriageDecades.length >= 2);
    assert.ok(Array.isArray(love.strengths) && love.strengths.length >= 2);
    assert.ok(Array.isArray(love.cautions) && love.cautions.length >= 2);
  }
  assert.equal(foundVcd, true, 'Expected at least one hour to have Vô Chính Diệu in Mệnh or Phu Thê');

  const pair = buildCompatibility({ chong: baseChong, vo: baseVo });
  assert.ok(pair.assessment.tamHopDetail.aMenhToBPhuThe.summary.length > 10);
  assert.ok(pair.assessment.tamHopDetail.bMenhToAPhuThe.summary.length > 10);
  assert.ok(pair.assessment.tinhCachDetail.complementarityType.length > 5);
  assert.equal(pair.individualProfiles.chong, pair.chong.person.individualLoveProfile);
  assert.equal(pair.individualProfiles.vo, pair.vo.person.individualLoveProfile);
});

test('5. Strict Order Symmetry: swapping Person A and Person B yields identical totalScore and pillar scores', () => {
  const testPairs = [
    [baseChong, baseVo],
    [
      { hoTen: 'Lê Hoàng Nam', ngay: 18, thang: 9, nam: 1992, gio: 9, gioiTinh: 'Nam' },
      { hoTen: 'Phạm Ngọc Lan', ngay: 10, thang: 5, nam: 1994, gio: 15, gioiTinh: 'Nữ' },
    ],
    [
      { hoTen: 'Vũ Đức Anh', ngay: 3, thang: 12, nam: 1989, gio: 23, gioiTinh: 'Nam' },
      { hoTen: 'Đặng Thu Trang', ngay: 27, thang: 2, nam: 1993, gio: 3, gioiTinh: 'Nữ' },
    ],
    [
      { hoTen: 'Trịnh Quốc Bảo', ngay: 14, thang: 6, nam: 1983, gio: 11, gioiTinh: 'Nam' },
      { hoTen: 'Hoàng Mai Anh', ngay: 8, thang: 11, nam: 1987, gio: 19, gioiTinh: 'Nữ' },
    ],
  ];

  for (const [personA, personB] of testPairs) {
    const ab = buildCompatibility({ chong: personA, vo: personB });
    const ba = buildCompatibility({ chong: personB, vo: personA });

    assert.equal(ab.assessment.cards.tamHop.score, ba.assessment.cards.tamHop.score);
    assert.equal(ab.assessment.cards.phiTinh.score, ba.assessment.cards.phiTinh.score);
    assert.equal(ab.assessment.cards.tinhCach.score, ba.assessment.cards.tinhCach.score);
    assert.equal(ab.assessment.cards.nguHanhDaoHoa.score, ba.assessment.cards.nguHanhDaoHoa.score);
    assert.equal(ab.assessment.rawScore, ba.assessment.rawScore);
    assert.equal(ab.assessment.totalScore, ba.assessment.totalScore);
    assert.equal(ab.assessment.tier, ba.assessment.tier);
  }
});

test('6. Validates Solar & Lunar dates (including leap months), leap year Feb 29, and all 24 clock hours', () => {
  // Invalid Gregorian dates & inputs
  for (const patch of [
    { ngay: 31, thang: 4 },
    { ngay: 29, thang: 2, nam: 2001 },
    { gio: 24 },
    { gio: -1 },
    { gio: '' },
    { hoTen: '' },
    { gioiTinh: 'Khác' },
  ]) {
    assert.throws(() => createCompatibilityPerson({ ...baseChong, ...patch }));
  }

  // Valid Gregorian leap day Feb 29, 2000
  assert.doesNotThrow(() => createCompatibilityPerson({ ...baseChong, nam: 2000, thang: 2, ngay: 29 }));

  // All 24 clock hours 0..23
  for (let gio = 0; gio < 24; gio++) {
    const built = createCompatibilityPerson({ ...baseChong, gio });
    assert.equal(built.inputData.lunarHourIndex, Math.floor((gio + 1) / 2) % 12);
    assert.equal(built.result.palates.length, 12);
  }

  // Direct lunarHourIndex support when gio is omitted
  const byBranchHour = createCompatibilityPerson({
    hoTen: 'Theo Giờ Chi',
    ngay: 6,
    thang: 4,
    nam: 1996,
    lunarHourIndex: 3,
    gioiTinh: 'Nam',
  });
  assert.equal(byBranchHour.inputData.lunarHourIndex, 3);

  // Solar vs equivalent Lunar input must produce identical natal chart!
  const fromSolar = createCompatibilityPerson(baseChong);
  const fromLunar = createCompatibilityPerson({
    hoTen: baseChong.hoTen,
    ngay: fromSolar.inputData.lunarDay,
    thang: fromSolar.inputData.lunarMonth,
    nam: fromSolar.inputData.lunarYear,
    isLunar: true,
    isLeap: fromSolar.inputData.isLeap,
    gio: baseChong.gio,
    gioiTinh: baseChong.gioiTinh,
  });
  assert.equal(fromLunar.inputData.isLunar, true);
  assert.equal(fromLunar.result.canChiNam, fromSolar.result.canChiNam);
  assert.equal(fromLunar.result.banMenhNapAm, fromSolar.result.banMenhNapAm);
  assert.equal(fromLunar.result.menhCung, fromSolar.result.menhCung);
  assert.deepEqual(fromLunar.person.phuTheStars, fromSolar.person.phuTheStars);

  // Valid Lunar leap month (2023 had leap month 2 Âm lịch)
  assert.doesNotThrow(() =>
    createCompatibilityPerson({
      hoTen: 'Sinh Tháng Nhuận',
      ngay: 15,
      thang: 2,
      nam: 2023,
      gio: 8,
      gioiTinh: 'Nữ',
      isLunar: true,
      isLeap: true,
    })
  );

  // Invalid Lunar leap month (2023 did NOT have leap month 5) & invalid Lunar day 31
  assert.throws(() =>
    createCompatibilityPerson({
      hoTen: 'Sai Nhuận',
      ngay: 10,
      thang: 5,
      nam: 2023,
      gio: 8,
      gioiTinh: 'Nữ',
      isLunar: true,
      isLeap: true,
    })
  );
  assert.throws(() =>
    createCompatibilityPerson({
      hoTen: 'Sai Ngày Âm',
      ngay: 31,
      thang: 1,
      nam: 2020,
      gio: 8,
      gioiTinh: 'Nam',
      isLunar: true,
    })
  );
});

test('7. Multi-year forecast supports 1, 3, 5, 10 years and both calling signatures', () => {
  const pair = buildCompatibility({ chong: baseChong, vo: baseVo }, { startYear: 2026, yearsCount: 5 });
  assert.equal(pair.initialForecast.years.length, 5);
  assert.equal(pair.initialForecast.startYear, 2026);
  assert.equal(pair.initialForecast.endYear, 2030);

  for (const count of [1, 3, 5, 10]) {
    const fc = computeYearlyCompatibilityForecast(pair, { startYear: 2026, yearsCount: count });
    assert.equal(fc.years.length, count);
    assert.equal(fc.yearsCount, count);
    assert.ok(Array.isArray(fc.sharedHighlightYears));

    fc.years.forEach((yr, idx) => {
      assert.equal(yr.year, 2026 + idx);
      assert.ok(yr.canChiYear.length >= 4);
      assert.ok(yr.combinedScore >= 25 && yr.combinedScore <= 98);
      assert.ok(['hy_tin', 'thuan_loi', 'binh_on', 'can_luu_y'].includes(yr.status));
      assert.equal(yr.personA.age, 2026 + idx - pair.chong.inputData.lunarYear + 1);
      assert.equal(yr.personB.age, 2026 + idx - pair.vo.inputData.lunarYear + 1);
      assert.ok(Array.isArray(yr.personA.signals));
      assert.ok(Array.isArray(yr.personB.signals));
      assert.ok(yr.advice.length > 20);
    });
  }

  // Second calling signature: (chongObj, voObj, options)
  const directFc = computeYearlyCompatibilityForecast(pair.chong, pair.vo, { startYear: 2026, yearsCount: 3 });
  const pairFc = computeYearlyCompatibilityForecast(pair, { startYear: 2026, yearsCount: 3 });
  assert.deepEqual(directFc, pairFc);
});

test('8. Legacy saved reading (`user-reference-1`) upgrades cleanly via upgradeRestoredCompatibilityPair', () => {
  const chong = createCompatibilityPerson(baseChong);
  const vo = createCompatibilityPerson(baseVo);

  // Simulate a JSON-persisted legacy `user-reference-1` reading from database
  const legacySavedPair = JSON.parse(
    JSON.stringify({
      payload: { chong: baseChong, vo: baseVo },
      chong: {
        inputData: chong.inputData,
        result: chong.result,
        person: {
          hoTen: chong.person.hoTen,
          menh: chong.person.menh,
          phuTheStars: chong.person.phuTheStars,
          canPhuThe: chong.person.canPhuThe,
          daoHoaStars: chong.person.daoHoaStars,
        },
      },
      vo: {
        inputData: vo.inputData,
        result: vo.result,
        person: {
          hoTen: vo.person.hoTen,
          menh: vo.person.menh,
          phuTheStars: vo.person.phuTheStars,
          canPhuThe: vo.person.canPhuThe,
          daoHoaStars: vo.person.daoHoaStars,
        },
      },
      assessment: {
        version: 'user-reference-1',
        totalScore: 71,
        rawScore: 71.2,
        ratingText: 'Hợp, hài hoà',
        husbandName: baseChong.hoTen,
        wifeName: baseVo.hoTen,
        elements: { husbandElement: 'Thủy', wifeElement: 'Kim', interaction: 'Kim sinh Thủy' },
        cards: {
          nguHanh: { title: 'Ngũ hành tương hợp', score: 85, detail: 'Cũ' },
          phuThe: { title: 'Cung Phu Thê', score: 70, detail: 'Cũ' },
          tuHoa: { title: 'Tứ Hóa chéo', score: 55, detail: 'Placeholder', provisional: true },
          daoHoa: { title: 'Đào hoa', score: 75, detail: 'Cũ' },
        },
      },
    })
  );

  const upgraded = upgradeRestoredCompatibilityPair(legacySavedPair);
  assert.equal(upgraded.assessment.version, 'tuvi-hophon-v2');
  assert.ok(upgraded.assessment.cards.tamHop);
  assert.ok(upgraded.assessment.cards.phiTinh);
  assert.equal(upgraded.assessment.cards.phiTinh.provisional, false);
  assert.ok(upgraded.assessment.tamHopDetail);
  assert.ok(upgraded.assessment.phiTinhDetail);
  assert.ok(upgraded.assessment.tinhCachDetail);
  assert.ok(upgraded.individualProfiles.chong.archetypeTitle);
  assert.ok(upgraded.individualProfiles.vo.archetypeTitle);
  assert.equal(upgraded.initialForecast.years.length, 5);
  assert.deepEqual(upgraded.payload, { chong: baseChong, vo: baseVo });
});

test('9. Preserves 24 namespaced evidence entries and builds rich v2 AI prompt under 60,000 chars', () => {
  const pair = buildCompatibility({ chong: baseChong, vo: baseVo });
  const evidence = compatibilityEvidence(pair);

  assert.equal(evidence.length, 24);
  assert.equal(new Set(evidence.map((e) => e.id)).size, 24);
  assert.ok(evidence.every((e) => /^(chong|vo)\.palace\.\d+$/.test(e.id)));

  for (const key of ['chong', 'vo']) {
    assert.equal(pair[key].result.engineVersion, 'user-v11');
    const actualPhuThe = pair[key].result.palates.find((p) => p.chucNang.startsWith('Phu Thê'));
    assert.equal(
      pair[key].person.phuTheStars.length,
      actualPhuThe.chinhTinh.length + actualPhuThe.phuTinh.length
    );
  }

  const text = compatibilityText(pair);
  assert.ok(text.includes('NGƯỜI A — CHỒNG'));
  assert.ok(text.includes('NGƯỜI B — VỢ'));
  assert.ok(text.includes('PHI TINH TỨ HÓA TƯƠNG THAM 2 CHIỀU'));

  const prompt = compatibilityPrompt(pair, 'love', 'Làm sao để vợ chồng giao tiếp thấu hiểu nhau hơn?');
  assert.ok(prompt.includes('NGƯỜI A — CHỒNG'));
  assert.ok(prompt.includes('NGƯỜI B — VỢ'));
  assert.ok(prompt.includes('Làm sao để vợ chồng giao tiếp thấu hiểu nhau hơn?'));
  assert.ok(!prompt.includes('Điểm Tứ Hóa 55 là placeholder chưa tính'));
  assert.ok(prompt.length < 60000, `Prompt length ${prompt.length} exceeded 60000`);
});

test('10. HopHonPage UI contract alignment across all 5 report tabs', () => {
  const pair = buildCompatibility({ chong: baseChong, vo: baseVo });
  const { tamHopDetail, phiTinhDetail } = pair.assessment;

  // Tab 3: Tam Hợp bridge fields
  assert.ok(typeof tamHopDetail.aMenhToBPhuThe.matchLevel === 'string');
  assert.ok(typeof tamHopDetail.aMenhToBPhuThe.score === 'number');
  assert.ok(typeof tamHopDetail.aMenhToBPhuThe.aMenhGroup === 'string');
  assert.ok(typeof tamHopDetail.aMenhToBPhuThe.bPhuTheGroup === 'string');
  assert.ok(typeof tamHopDetail.bMenhToAPhuThe.bMenhGroup === 'string');
  assert.ok(typeof tamHopDetail.bMenhToAPhuThe.aPhuTheGroup === 'string');
  assert.ok(Array.isArray(tamHopDetail.phuTheComparison.aCatTinh));
  assert.ok(Array.isArray(tamHopDetail.phuTheComparison.bSatTinh));
  assert.ok(typeof tamHopDetail.phucDucFoundation.score === 'number');

  // Tab 4: Phi Tinh flight meaning & internal flow object items
  for (const f of [...phiTinhDetail.aToBFlights, ...phiTinhDetail.bToAFlights]) {
    assert.ok(typeof f.meaning === 'string' && f.meaning.length > 0);
  }
  for (const flow of [...phiTinhDetail.internalFlows.personA, ...phiTinhDetail.internalFlows.personB]) {
    assert.equal(typeof flow.type, 'string');
    assert.equal(typeof flow.label, 'string');
    assert.equal(typeof flow.isAuspicious, 'boolean');
    assert.equal(typeof flow.detail, 'string');
  }

  // Tab 5: Forecast year canChi field
  assert.ok(pair.initialForecast.years.every((yr) => typeof yr.canChi === 'string' && yr.canChi.length >= 4));
});

test('11. SSR renders HopHonPage PairSession across all 5 tabs + Dual LasoChart + legacy reading without error', async () => {
  const tuviRoot = path.resolve(import.meta.dirname, '..');
  const authShim = {
    name: 'hop-hon-ssr-shim',
    enforce: 'pre',
    load(id) {
      if (id.endsWith('/src/context/AuthContext.jsx')) {
        return `export function useAuth() { return { isAuthenticated: false, isLoading: false, user: null, login: () => {}, logout: () => {} }; }
export function AuthProvider({ children }) { return children; }`;
      }
      if (id.endsWith('/src/hooks/usePlan.js')) {
        return `export function usePlan() { return { remaining: 5, planLabel: 'Pro', canBonus: false, fetchQuota: async () => {}, requestBonus: async () => {}, applyCoupon: async () => {} }; }`;
      }
      return null;
    },
  };

  const server = await createServer({
    root: tuviRoot,
    configFile: false,
    plugins: [authShim, react()],
    resolve: {
      alias: {
        '@shared': path.resolve(tuviRoot, '../shared/src'),
        '@iching': path.resolve(tuviRoot, '../iching/src'),
      },
    },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });

  try {
    const { default: HopHonPage, PairSession } = await server.ssrLoadModule('/src/components/HopHonPage.jsx');

    // Gate view renders cleanly when unauthenticated
    const gateHtml = renderToStaticMarkup(React.createElement(HopHonPage));
    assert.ok(gateHtml.includes('Hợp Hôn · Tử Vi Đẩu Số'));

    // Full PairSession in 'all' mode renders all 5 tabs simultaneously + both 12-palace LasoChart instances
    const pair = buildCompatibility({ chong: baseChong, vo: baseVo }, { startYear: 2026, yearsCount: 5 });
    const fullHtml = renderToStaticMarkup(
      React.createElement(PairSession, {
        initial: { id: 'saved-1', pair, conversation: null },
        onStored: () => {},
        initialActiveTab: 'all',
      })
    );

    assert.ok(fullHtml.includes('Nguyễn Minh Quân'));
    assert.ok(fullHtml.includes('Trần Thanh Hà'));
    assert.ok(fullHtml.includes('Bảng Đối Chiếu 10 Trục Cốt Lõi Hai Lá Số'));
    assert.ok(fullHtml.includes('Hợp Bàn Tam Hợp · Đối Chiếu Thái Cực Mệnh ⇄ Phu Thê'));
    assert.ok(fullHtml.includes('Phi Tinh Tứ Hóa 2 Chiều'));
    assert.ok(fullHtml.includes('Dự Báo Diễn Biến Tình Duyên Theo Lưu Niên'));
    assert.ok(!fullHtml.includes('tuổi tuổi'), 'Should never duplicate "tuổi" suffix');
  } finally {
    await server.close();
  }
});
