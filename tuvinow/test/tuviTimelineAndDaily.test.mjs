import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { buildTuViPrompt } from '../src/utils/buildTuViPrompt.js';
import {
  TIMELINE_SERIES,
  buildTenYearTimelineModel,
  buildDailyLiuShiHours,
  buildThirtyDayLiuRiCalendar,
  buildTuViNoteNowPayload,
} from '../src/utils/tuviTimelineModel.js';
import { buildTuViNoteNowPayload as buildNoteNowFromPayloadModule } from '../src/utils/noteNowPayload.js';

const TUVI_ROOT = path.resolve(import.meta.dirname, '..');
const REACT_EXTERNAL_PLUGIN = {
  name: 'tuvi-ssr-shared-jsx',
  enforce: 'pre',
  resolveId(source) {
    if (source.endsWith('shared/src/components/SaveToNoteNowButton.jsx')) {
      return path.resolve(TUVI_ROOT, 'src/components/__ssr_SaveToNoteNowButton.jsx');
    }
    return null;
  },
  load(id) {
    if (id.endsWith('__ssr_SaveToNoteNowButton.jsx')) {
      const realPath = path.resolve(TUVI_ROOT, '../shared/src/components/SaveToNoteNowButton.jsx');
      return fs.readFileSync(realPath, 'utf8').replaceAll("'../utils/", "'../../../shared/src/utils/");
    }
    return null;
  },
};
const VITE_RESOLVE = {
  alias: {
    '@shared': path.resolve(TUVI_ROOT, '../shared/src'),
    '@iching': path.resolve(TUVI_ROOT, '../iching/src'),
  },
};

const SAMPLE_INPUT_A = {
  name: 'Đặng Minh Quân',
  lunarYear: 1992,
  lunarMonth: 7,
  lunarDay: 16,
  lunarHourIndex: 4, // Thìn
  yearCanIndex: 8, // Nhâm
  yearChiIndex: 8, // Thân
  gender: 1,
  isLunar: false,
  solarInput: { day: 14, month: 8, year: 1992 },
};

const SAMPLE_INPUT_B = {
  name: 'Lê Thu Trang',
  lunarYear: 1997,
  lunarMonth: 3,
  lunarDay: 9,
  lunarHourIndex: 9, // Dậu
  yearCanIndex: 3, // Đinh
  yearChiIndex: 1, // Sửu
  gender: 0,
  isLunar: false,
  solarInput: { day: 15, month: 4, year: 1997 },
};

test('tuviTimelineModel: buildTenYearTimelineModel computes 10-year ratings, peak/defensive years, and pinned lifeEvents', () => {
  assert.equal(TIMELINE_SERIES.length, 5);
  const chart = anLaSoTuVi(SAMPLE_INPUT_A);
  const lifeEvents = [
    { id: 'ev1', year: 2024, eventType: 'career_up', label: 'Thăng tiến', note: 'Nhận dự án lớn' },
    { id: 'ev2', year: 2026, eventType: 'relocation_travel', label: 'Dịch chuyển', note: 'Đi công tác nước ngoài' },
  ];

  const rolling = buildTenYearTimelineModel(chart, SAMPLE_INPUT_A, {
    windowMode: 'rolling',
    referenceYear: 2026,
    lifeEvents,
  });

  assert.ok(rolling);
  assert.equal(rolling.years.length, 10);
  assert.equal(rolling.years[0].year, 2024);
  assert.equal(rolling.years[9].year, 2033);
  assert.ok(rolling.peakYear);
  assert.ok(rolling.defensiveYear);
  assert.ok(rolling.peakYear.ratings.overall >= rolling.defensiveYear.ratings.overall);

  for (const yr of rolling.years) {
    for (const serie of TIMELINE_SERIES) {
      assert.ok(yr.ratings[serie.id] >= 1 && yr.ratings[serie.id] <= 5);
      assert.ok(yr.scores100[serie.id] >= 20 && yr.scores100[serie.id] <= 100);
    }
    assert.ok(yr.sihua.Loc.star);
    assert.ok(yr.sihua.Ky.star);
  }

  const y2024 = rolling.years.find((y) => y.year === 2024);
  assert.equal(y2024.pinnedEvents.length, 1);
  assert.equal(y2024.pinnedEvents[0].note, 'Nhận dự án lớn');

  const daxianModel = buildTenYearTimelineModel(chart, SAMPLE_INPUT_A, {
    windowMode: 'daxian',
    referenceYear: 2026,
    lifeEvents,
  });
  assert.equal(daxianModel.years.length, 10);
  assert.ok(daxianModel.activeDaXian);
});

test('tuviTimelineModel: 30-day Lưu Nhật (getLiuRiSiHua) and 12-hour Lưu Thời (getLiuShiSiHua) personalize to user palaces', () => {
  const chartA = anLaSoTuVi(SAMPLE_INPUT_A);
  const chartB = anLaSoTuVi(SAMPLE_INPUT_B);
  const fixedStart = new Date(2026, 4, 10, 12, 0, 0); // 2026-05-10

  const calA = buildThirtyDayLiuRiCalendar(chartA, SAMPLE_INPUT_A, {
    startDate: fixedStart,
    daysCount: 30,
  });
  const calB = buildThirtyDayLiuRiCalendar(chartB, SAMPLE_INPUT_B, {
    startDate: fixedStart,
    daysCount: 30,
  });

  assert.equal(calA.days.length, 30);
  assert.equal(
    calA.summary.catCount + calA.summary.binhCount + calA.summary.cautionCount,
    30,
  );

  const day0A = calA.days[0];
  const day0B = calB.days[0];
  assert.equal(day0A.isoDate, '2026-05-10');
  assert.equal(day0A.dayCanChi, day0B.dayCanChi);
  assert.equal(day0A.sihua.Loc.star, day0B.sihua.Loc.star);
  // Hai lá số khác nhau có vị trí sao trên 12 cung khác nhau -> cung đón Lưu Nhật Hóa Lộc cá nhân hóa khác nhau
  assert.notEqual(
    `${day0A.sihua.Loc.palaceName}|${day0A.sihua.Ky.palaceName}`,
    `${day0B.sihua.Loc.palaceName}|${day0B.sihua.Ky.palaceName}`,
  );

  assert.ok(['cat', 'binh', 'can_trong'].includes(day0A.status));
  assert.ok(day0A.bestActivities.length >= 1);
  assert.ok(day0A.avoidActivities.length >= 1);
  assert.equal(day0A.hours.length, 12);

  const standaloneHours = buildDailyLiuShiHours(chartA, day0A.sihua.stemIndex);
  assert.equal(standaloneHours.length, 12);
  assert.equal(standaloneHours[0].branchName, 'Tý');
  assert.equal(standaloneHours[6].branchName, 'Ngọ');
});

test('buildTuViNoteNowPayload & buildTuViPrompt with pinned lifeEvents calibration', () => {
  const chart = anLaSoTuVi(SAMPLE_INPUT_A);
  const lifeEvents = [
    { id: 'ev-1', year: 2020, eventType: 'marriage', label: 'Kết hôn', note: 'Cưới tháng 12' },
  ];

  const payload = buildTuViNoteNowPayload({
    result: chart,
    inputData: SAMPLE_INPUT_A,
    yunxianState: { mode: 'liunian', viewYear: 2026 },
    lifeEvents,
  });
  const payloadFromReExport = buildNoteNowFromPayloadModule({
    result: chart,
    inputData: SAMPLE_INPUT_A,
    yunxianState: { mode: 'liunian', viewYear: 2026 },
    lifeEvents,
  });
  assert.equal(payload.bgColor, 'indigo');
  assert.equal(payloadFromReExport.bgColor, 'indigo');
  assert.deepEqual(payloadFromReExport, payload);
  assert.equal(payload.sourceAppLabel, 'TuViNow');
  assert.ok(payload.title.includes('Đặng Minh Quân'));
  assert.ok(payload.summaryLines.some((line) => line.includes('Kết hôn') || line.includes('2020')));
  assert.ok(Array.isArray(payload.checklistItems) && payload.checklistItems.length >= 3);
  assert.ok(Array.isArray(payload.tags) && payload.tags.includes('tu-vi'));

  const promptWithEvents = buildTuViPrompt(
    chart,
    SAMPLE_INPUT_A,
    'overview',
    'Nhờ luận năm 2026',
    false,
    null,
    { lifeEvents, includeLifeEvents: true },
  );
  assert.ok(promptWithEvents.includes('MỐC SỰ KIỆN THỰC TẾ'));
  assert.ok(promptWithEvents.includes('Năm 2020'));

  const promptWithoutEvents = buildTuViPrompt(
    chart,
    SAMPLE_INPUT_A,
    'overview',
    'Nhờ luận năm 2026',
    false,
    null,
    { lifeEvents, includeLifeEvents: false },
  );
  assert.ok(!promptWithoutEvents.includes('Năm 2020: Kết hôn'));
});

test('SSR & Web Platform compliance: native <dialog closedby="any">, no role="dialog"/aria-modal, no html/body overflow lock', async () => {
  const indexCss = fs.readFileSync(path.resolve(TUVI_ROOT, 'src/index.css'), 'utf8');
  assert.ok(indexCss.includes('dialog.tv-native-dialog:modal'));
  assert.ok(indexCss.includes('max-block-size: 90dvh'));
  assert.ok(indexCss.includes('dialog.tv-native-dialog[open]'));
  assert.ok(indexCss.includes('dialog.tv-native-dialog::backdrop'));
  // Không khóa cuộn trên html/body và không đặt display vô điều kiện trên dialog.tv-native-dialog
  assert.ok(!/html\s*,\s*body\s*\{[^}]*overflow\s*:\s*hidden/i.test(indexCss));

  const server = await createServer({
    configFile: false,
    root: TUVI_ROOT,
    resolve: VITE_RESOLVE,
    plugins: [REACT_EXTERNAL_PLUGIN, react()],
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });

  try {
    const { default: BirthHourRectifierModal } = await server.ssrLoadModule(
      '/src/components/BirthHourRectifierModal.jsx',
    );
    const { default: SavedProfilesBar } = await server.ssrLoadModule(
      '/src/components/SavedProfilesBar.jsx',
    );
    const { default: TuViTimelineAndDailyPanel } = await server.ssrLoadModule(
      '/src/components/TuViTimelineAndDailyPanel.jsx',
    );
    const { default: BirthInputForm, buildBirthInputPayload } = await server.ssrLoadModule(
      '/src/components/BirthInputForm.jsx',
    );

    // Bug 4.1: buildBirthInputPayload preserves lunar leap month (isLeap: true)
    const leapPayload = buildBirthInputPayload({
      name: 'Trần Minh Quân',
      day: 30,
      month: 6,
      year: 2017, // Năm 2017 có tháng 6 nhuận đủ 30 ngày
      hourIndex: 4,
      gender: 1,
      calendarType: 'lunar',
      isLeapMonth: true,
    });
    assert.equal(leapPayload.calendarType, 'lunar');
    assert.equal(leapPayload.isLunar, true);
    assert.equal(leapPayload.isLeap, true);
    assert.equal(leapPayload.isLeapMonth, true);
    assert.ok(leapPayload.lunarDateStr.includes('Nhuận'));

    // Solar input ignores isLeapMonth toggle
    const solarPayload = buildBirthInputPayload({
      name: 'Trần Minh Quân',
      day: 14,
      month: 8,
      year: 1992,
      hourIndex: 4,
      gender: 1,
      calendarType: 'solar',
      isLeapMonth: true,
    });
    assert.equal(solarPayload.calendarType, 'solar');
    assert.equal(solarPayload.isLunar, false);
    assert.equal(solarPayload.isLeap, false);
    assert.equal(solarPayload.isLeapMonth, false);

    // Leap month vs regular month chart calculation
    const leap2025 = buildBirthInputPayload({
      name: 'Đương số nhuận',
      day: 20,
      month: 6,
      year: 2025,
      hourIndex: 6,
      gender: 0,
      calendarType: 'lunar',
      isLeapMonth: true,
    });
    const reg2025 = buildBirthInputPayload({
      name: 'Đương số thường',
      day: 20,
      month: 6,
      year: 2025,
      hourIndex: 6,
      gender: 0,
      calendarType: 'lunar',
      isLeapMonth: false,
    });
    const chartLeap = anLaSoTuVi(leap2025);
    const chartReg = anLaSoTuVi(reg2025);
    assert.equal(chartLeap.palates.length, 12);
    assert.notEqual(chartLeap.menhCung, chartReg.menhCung);

    const chart = anLaSoTuVi(SAMPLE_INPUT_A);

    const rectifierHtml = renderToStaticMarkup(
      React.createElement(BirthHourRectifierModal, {
        isOpen: false,
        baseInput: { name: 'Đặng Minh Quân', day: 14, month: 8, year: 1992, gender: 1, isLunar: false, hourIndex: 4 },
      }),
    );
    assert.ok(rectifierHtml.includes('<dialog'));
    assert.ok(rectifierHtml.includes('closedby="any"'));
    assert.ok(!rectifierHtml.includes('role="dialog"'));
    assert.ok(!rectifierHtml.includes('aria-modal'));

    const profilesHtml = renderToStaticMarkup(
      React.createElement(SavedProfilesBar, {
        profiles: [
          {
            id: 'p1',
            name: 'Đặng Minh Quân',
            relation: 'self',
            gender: 1,
            calendarType: 'solar',
            day: 14,
            month: 8,
            year: 1992,
            hourValue: 4,
            hourBranch: 'Thìn',
            isDefaultSelf: true,
            lifeEvents: [],
          },
          {
            id: 'p2',
            name: 'Lê Thu Trang',
            relation: 'spouse',
            gender: 0,
            calendarType: 'solar',
            day: 15,
            month: 4,
            year: 1997,
            hourValue: 9,
            hourBranch: 'Dậu',
            isDefaultSelf: false,
            lifeEvents: [],
          },
        ],
        onSelectProfile: () => {},
      }),
    );
    assert.ok(profilesHtml.includes('Lá số mặc định của tôi: Đặng Minh Quân'));
    assert.ok(profilesHtml.includes('Đưa 2 hồ sơ sang Hợp Hôn'));
    assert.ok(!profilesHtml.includes('role="dialog"'));
    assert.ok(!profilesHtml.includes('aria-modal'));

    const timelineHtml = renderToStaticMarkup(
      React.createElement(TuViTimelineAndDailyPanel, {
        result: chart,
        inputData: SAMPLE_INPUT_A,
        yunxianState: { mode: 'liunian', viewYear: 2026 },
        lifeEvents: [{ id: 'ev1', year: 2026, eventType: 'career_up', label: 'Thăng tiến', note: 'Thăng cấp' }],
        onUpsertLifeEvent: () => {},
        onDeleteLifeEvent: () => {},
      }),
    );
    assert.ok(timelineHtml.includes('Quỹ Đạo 10 Năm Lưu Niên'));
    assert.ok(timelineHtml.includes('Lịch 30 Ngày Lưu Nhật'));
    assert.ok(timelineHtml.includes('12 Canh Giờ Lưu Thời'));
    assert.ok(!timelineHtml.includes('role="dialog"'));

    const formHtml = renderToStaticMarkup(
      React.createElement(BirthInputForm, { onSubmit: () => {} }),
    );
    assert.ok(formHtml.includes('Không chắc giờ sinh? Khảo &amp; Định giờ chuẩn'));
    assert.ok(!formHtml.includes('id="input-leap-month"'));

    const lunarFormHtml = renderToStaticMarkup(
      React.createElement(BirthInputForm, {
        onSubmit: () => {},
        initialValues: {
          name: 'Trần Minh Quân',
          calendarType: 'lunar',
          day: 20,
          month: 6,
          year: 2025,
          hourIndex: 4,
          gender: 1,
          isLeapMonth: true,
        },
      }),
    );
    assert.ok(lunarFormHtml.includes('id="input-leap-month"'));
    assert.ok(lunarFormHtml.includes('Tháng nhuận (Âm lịch)'));
    assert.ok(lunarFormHtml.includes('checked=""'));

    // Bug 4.4: SavedProfilesBar highlights ONLY the leap-month profile when viewing a leap-month chart
    const leapBarHtml = renderToStaticMarkup(
      React.createElement(SavedProfilesBar, {
        profiles: [
          {
            id: 'p-reg',
            name: 'Đương số nhuận',
            relation: 'self',
            gender: 0,
            calendarType: 'lunar',
            day: 20,
            month: 6,
            year: 2025,
            isLeapMonth: false,
            hourValue: 6,
            hourBranch: 'Ngọ',
            isDefaultSelf: false,
            lifeEvents: [],
          },
          {
            id: 'p-leap',
            name: 'Đương số nhuận',
            relation: 'other',
            gender: 0,
            calendarType: 'lunar',
            day: 20,
            month: 6,
            year: 2025,
            isLeapMonth: true,
            hourValue: 6,
            hourBranch: 'Ngọ',
            isDefaultSelf: false,
            lifeEvents: [],
          },
        ],
        activeInputData: leap2025,
        onSelectProfile: () => {},
      }),
    );
    const activeChipCount = (leapBarHtml.match(/tv-profile-chip-card is-current/g) || []).length;
    assert.equal(activeChipCount, 1);
    assert.ok(leapBarHtml.includes('20/6N/2025'));
  } finally {
    await server.close();
  }
});
