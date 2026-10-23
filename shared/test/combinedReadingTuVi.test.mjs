import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { calculateChartFromBirthInfo } from '../src/utils/tuViCalculator.js';
import {
  NAP_AM_MAP,
  getBirthCanChiAndMenh,
  resolveEffectiveBirthInfo,
  resolveCurrentDaiHan,
  buildCombinedPrompt,
  summarizeRelevantPalaces,
} from '../src/components/CombinedReading/combinedReadingModel.js';
import { solarToLunar } from '../src/utils/lunarConverter.js';

test('NAP_AM_MAP in CombinedReading matches canonical tuViEngineV11 across all 60 Can-Chi pairs', () => {
  for (let i = 0; i < 60; i++) {
    const yearCanIndex = i % 10;
    const yearChiIndex = i % 12;
    const chart = anLaSoTuVi({
      yearCanIndex,
      yearChiIndex,
      lunarMonth: 1,
      lunarDay: 1,
      lunarHourIndex: 0,
      gender: 1,
    });
    assert.equal(
      NAP_AM_MAP[chart.canChiNam],
      chart.banMenhNapAm,
      `Mismatch for ${chart.canChiNam}`,
    );
  }
});

test('solar 2024-02-05 (pre-Tết) resolves to Lunar 2023 / Quý Mão / Kim Bạc Kim across Combined Reading & Calculator', () => {
  const info = getBirthCanChiAndMenh(2024, 2, 5);
  assert.deepEqual(info, {
    yearCan: 'Quý',
    yearChi: 'Mão',
    canChi: 'Quý Mão',
    menh: 'Kim Bạc Kim',
    lunarYear: 2023,
    lunarMonth: 12,
    lunarDay: 26,
  });

  const chart = calculateChartFromBirthInfo({
    day: 5,
    month: 2,
    year: 2024,
    hourIndex: 3,
    gender: 'nam',
    name: 'Test Pre-Tet',
  });
  assert.ok(chart);
  assert.equal(chart.canChiNam, 'Quý Mão');
  assert.equal(chart.banMenhNapAm, 'Kim Bạc Kim');
});

test('lunar-mode input is not double-converted as solar and preserves Can-Chi in Combined Reading', () => {
  // Lunar 2023-12-26 (which corresponds to Solar 2024-02-05)
  const tuviLunarInput = {
    name: 'Người Âm Lịch',
    lunarYear: 2023,
    lunarMonth: 12,
    lunarDay: 26,
    yearCanIndex: 9,
    yearChiIndex: 3,
    lunarHourIndex: 3,
    gender: 1,
    isLunar: true,
    solarInput: null,
  };
  const directChart = anLaSoTuVi(tuviLunarInput);
  const effective = resolveEffectiveBirthInfo({
    inputData: tuviLunarInput,
    chartResult: directChart,
  });

  assert.equal(effective.isLunar, true);
  assert.equal(effective.solarInput, null);
  assert.equal(effective.day, '');
  assert.equal(effective.lunarDay, 26);
  assert.equal(effective.lunarMonth, 12);
  assert.equal(effective.lunarYear, 2023);
  assert.equal(effective.canChi, 'Quý Mão');
  assert.equal(effective.menh, 'Kim Bạc Kim');

  const calcFromLunar = calculateChartFromBirthInfo(effective);
  assert.ok(calcFromLunar);
  assert.equal(calcFromLunar.canChiNam, directChart.canChiNam);
  assert.equal(calcFromLunar.banMenhNapAm, directChart.banMenhNapAm);
  assert.equal(calcFromLunar.menhCung, directChart.menhCung);
  assert.equal(calcFromLunar.thanCung, directChart.thanCung);
  assert.equal(calcFromLunar.cucName, directChart.cucName);

  // Also check Solar inputData from TuViNow (which sets yearCanName / yearChiName)
  const tuviSolarInput = {
    ...solarToLunar(2024, 2, 5),
    name: 'Người Dương Lịch',
    lunarHourIndex: 3,
    gender: 1,
    isLunar: false,
    solarInput: { day: 5, month: 2, year: 2024 },
  };
  const effectiveSolar = resolveEffectiveBirthInfo({
    inputData: tuviSolarInput,
    chartResult: directChart,
  });
  assert.equal(effectiveSolar.canChi, 'Quý Mão');
  assert.equal(effectiveSolar.menh, 'Kim Bạc Kim');
  assert.equal(effectiveSolar.day, 5);
  assert.equal(effectiveSolar.month, 2);
  assert.equal(effectiveSolar.year, 2024);
});

test('calculateChartFromBirthInfo does not return null when birth lunarYear is after current year', () => {
  const futureYear = new Date().getFullYear() + 1;
  const chart = calculateChartFromBirthInfo({
    day: 15,
    month: 6,
    year: futureYear,
    hourIndex: 3,
    gender: 'nam',
    name: 'Future Birth',
  });
  assert.ok(chart);
  assert.equal(chart.palates.length, 12);
  assert.equal(chart.tuoiAm, 1);
});

test('buildCombinedPrompt includes current Đại Hạn extracted from chartResult.palates', () => {
  const chart = calculateChartFromBirthInfo({
    day: 15,
    month: 6,
    year: 1996,
    hourIndex: 3,
    gender: 'nam',
    name: 'Nguyễn Văn A',
  });
  assert.ok(chart);
  const daiHan = resolveCurrentDaiHan(chart);
  assert.ok(daiHan.length > 0);

  const relevantPalaces = summarizeRelevantPalaces(chart, 'career');
  const prompt = buildCombinedPrompt({
    topic: 'career',
    question: 'Sự nghiệp năm nay thế nào?',
    birthInfo: {
      name: 'Nguyễn Văn A',
      day: 15,
      month: 6,
      year: 1996,
      canChi: chart.canChiNam,
      menh: chart.banMenhNapAm,
      gender: 'nam',
    },
    relevantPalaces,
    hexResult: null,
    language: 'vi',
    chartResult: chart,
  });

  assert.ok(prompt.includes('- Đại hạn hiện tại:'));
  assert.ok(prompt.includes(daiHan));
});

test('resolveCurrentDaiHan returns empty string and omits current-period claim when chart has decade data but no current-age basis or LN.Mệnh', () => {
  const chartWithoutAgeOrLnMệnh = {
    palates: [
      { chucNang: 'Mệnh', chiName: 'Tý', daiHan: 2, chinhTinh: ['Tử Vi'] },
      { chucNang: 'Phụ Mẫu', chiName: 'Sửu', daiHan: 12, chinhTinh: ['Thiên Phủ'] },
      { chucNang: 'Phúc Đức', chiName: 'Dần', daiHan: 22, chinhTinh: ['Thái Dương'] },
    ],
  };

  // 1. Without age basis or LN.Mệnh, resolveCurrentDaiHan returns ''
  assert.equal(resolveCurrentDaiHan(chartWithoutAgeOrLnMệnh), '');
  assert.equal(resolveCurrentDaiHan(chartWithoutAgeOrLnMệnh, { name: 'Người hỏi' }), '');

  // 2. buildCombinedPrompt omits the current-period claim in Vietnamese and English
  const promptVi = buildCombinedPrompt({
    topic: 'career',
    question: 'Sự nghiệp sắp tới thế nào?',
    birthInfo: { name: 'Người hỏi' },
    relevantPalaces: [{ name: 'Quan Lộc', chi: 'Thìn', stars: 'Thái Dương' }],
    hexResult: null,
    language: 'vi',
    chartResult: chartWithoutAgeOrLnMệnh,
  });
  assert.equal(promptVi.includes('- Đại hạn hiện tại:'), false);

  const promptEn = buildCombinedPrompt({
    topic: 'career',
    question: 'How is my career?',
    birthInfo: { name: 'User' },
    relevantPalaces: [{ name: 'Career', chi: 'Chen', stars: 'Sun' }],
    hexResult: null,
    language: 'en',
    chartResult: chartWithoutAgeOrLnMệnh,
  });
  assert.equal(promptEn.includes('- Current Major Period (Đại hạn):'), false);

  // 3. Preserved behavior: explicit chartResult.daiHan
  assert.equal(
    resolveCurrentDaiHan({ ...chartWithoutAgeOrLnMệnh, daiHan: 'Cung Thân (Ngọ), 32–41 tuổi' }),
    'Cung Thân (Ngọ), 32–41 tuổi'
  );

  // 4. Preserved behavior: chartResult.tuoiAm
  assert.equal(
    resolveCurrentDaiHan({ ...chartWithoutAgeOrLnMệnh, tuoiAm: 15 }),
    'Cung Phụ Mẫu (Sửu), 12–21 tuổi (tuổi âm: 15; Chính tinh: Thiên Phủ)'
  );

  // 5. Preserved behavior: birthInfo-derived age
  const currentYear = new Date().getFullYear();
  const birthInfo = { year: currentYear - 25, isLunar: true }; // tuoiAm = 26 -> falls in 22-31
  assert.equal(
    resolveCurrentDaiHan(chartWithoutAgeOrLnMệnh, birthInfo),
    'Cung Phúc Đức (Dần), 22–31 tuổi (tuổi âm: 26; Chính tinh: Thái Dương)'
  );

  // 6. Preserved behavior: valid LN.Mệnh
  const chartWithLnMenh = {
    palates: [
      { chucNang: 'Mệnh', chiName: 'Tý', daiHan: 2, chinhTinh: ['Tử Vi'] },
      { chucNang: 'Phụ Mẫu', chiName: 'Sửu', daiHan: 12, luuNienChucNang: 'LN.Mệnh' },
    ],
  };
  assert.equal(
    resolveCurrentDaiHan(chartWithLnMenh),
    'Cung Phụ Mẫu (Sửu), 12–21 tuổi'
  );
});

test('shared package manifest and CI workflow declare isolated dependency install for lunar-javascript', () => {
  const sharedPkgPath = new URL('../package.json', import.meta.url);
  const sharedPkg = JSON.parse(fs.readFileSync(sharedPkgPath, 'utf8'));
  assert.ok(
    sharedPkg.dependencies && sharedPkg.dependencies['lunar-javascript'],
    'shared/package.json must declare lunar-javascript dependency so clean CI installs resolve it'
  );

  const sharedLockPath = new URL('../package-lock.json', import.meta.url);
  assert.ok(
    fs.existsSync(sharedLockPath),
    'shared/package-lock.json must exist for npm ci --prefix shared'
  );

  const ciWorkflowPath = new URL('../../.github/workflows/frontend-ci.yml', import.meta.url);
  const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');
  assert.match(
    ciWorkflow,
    /npm ci --prefix shared/,
    'frontend-ci.yml must install shared dependencies prior to running shared tests'
  );

  const rootPkgPath = new URL('../../package.json', import.meta.url);
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  assert.ok(
    rootPkg.scripts && rootPkg.scripts['install:shared'],
    'root package.json should define install:shared'
  );
  assert.match(
    rootPkg.scripts['install:all'],
    /npm install --prefix shared/,
    'root package.json install:all must include shared'
  );
});
