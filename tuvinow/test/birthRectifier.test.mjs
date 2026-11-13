import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHICHEN_LABELS,
  RECTIFIER_EVENT_TYPES,
  buildRectifierCandidateSpecs,
  resolveCandidateBirthInput,
  extractEmpiricalTraits,
  scoreCandidateWithPastEvents,
  evaluateBirthRectification,
} from '../src/utils/birthRectifier.js';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';

test('birthRectifier: buildRectifierCandidateSpecs supports adjacent, zi_boundary, and custom shichen', () => {
  assert.equal(SHICHEN_LABELS.length, 12);
  assert.ok(RECTIFIER_EVENT_TYPES.length >= 8);

  const adjSpecs = buildRectifierCandidateSpecs({ preset: 'adjacent', currentHourIndex: 4 });
  assert.equal(adjSpecs.length, 3);
  assert.deepEqual(
    adjSpecs.map((s) => s.hourIndex),
    [3, 4, 5], // Mão, Thìn, Tỵ
  );

  const ziSpecs = buildRectifierCandidateSpecs({ preset: 'zi_boundary', currentHourIndex: 0 });
  assert.equal(ziSpecs.length, 4);
  const earlyZi = ziSpecs.find((s) => s.id === 'zi_early_same_day');
  const lateZiNext = ziSpecs.find((s) => s.id === 'zi_late_next_day');
  assert.ok(earlyZi);
  assert.ok(lateZiNext);
  assert.equal(earlyZi.dayOffset, 0);
  assert.equal(lateZiNext.dayOffset, 1);

  const customSpecs = buildRectifierCandidateSpecs({
    preset: 'custom',
    customHourIndices: [0, 3, 4],
    includeLateZiNextDay: true,
  });
  assert.equal(customSpecs.length, 4);
  assert.ok(customSpecs.some((s) => s.dayOffset === 1));
});

test('birthRectifier: Early Zi (00:00-00:59) vs Late Zi next-day (23:00-23:59) shifts lunar day and chart structure', () => {
  const baseInput = {
    name: 'Trần Nghiệm Lý',
    day: 18,
    month: 8,
    year: 1994,
    gender: 1,
    isLunar: false,
    hourIndex: 0,
  };

  const earlySpec = { id: 'early_zi', hourIndex: 0, dayOffset: 0 };
  const lateNextSpec = { id: 'late_zi_next_day', hourIndex: 0, dayOffset: 1 };

  const earlyResolved = resolveCandidateBirthInput(baseInput, earlySpec);
  const lateResolved = resolveCandidateBirthInput(baseInput, lateNextSpec);

  assert.notEqual(
    `${earlyResolved.engineInput.lunarMonth}-${earlyResolved.engineInput.lunarDay}`,
    `${lateResolved.engineInput.lunarMonth}-${lateResolved.engineInput.lunarDay}`,
  );

  const earlyChart = anLaSoTuVi(earlyResolved.engineInput);
  const lateChart = anLaSoTuVi(lateResolved.engineInput);
  assert.equal(earlyChart.palates.length, 12);
  assert.equal(lateChart.palates.length, 12);

  // Cùng giờ Tý nhưng khác ngày Âm lịch nên vị trí Tử Vi / các sao an theo ngày bắt buộc khác nhau
  const findTuViChi = (chart) =>
    chart.palates.find((p) => (p.chinhTinh || []).some((s) => String(s).startsWith('Tử Vi')))?.chiIndex;
  assert.notEqual(findTuViChi(earlyChart), findTuViChi(lateChart));
});

test('birthRectifier: extractEmpiricalTraits produces verifiable Mệnh/Thân/Tật and Phụ Mẫu/Huynh Đệ traits', () => {
  const baseInput = {
    name: 'Lê Minh Khoa',
    day: 12,
    month: 5,
    year: 1992,
    gender: 0,
    isLunar: false,
    hourIndex: 3,
  };
  const resolved = resolveCandidateBirthInput(baseInput, { id: 'h3', hourIndex: 3, dayOffset: 0 });
  const chart = anLaSoTuVi(resolved.engineInput);
  const traits = extractEmpiricalTraits(chart);

  assert.ok(traits.menhPalaceName.length > 0);
  assert.ok(traits.menhThanTat.length >= 1);
  assert.ok(traits.family.length >= 2);
  for (const t of [...traits.menhThanTat, ...traits.family]) {
    assert.ok(t.id);
    assert.ok(t.title.length > 5);
    assert.ok(t.description.length > 10);
    assert.ok(t.evidence.length > 3);
  }
});

test('birthRectifier: evaluateBirthRectification ranks candidates transparently using traits and past life events', () => {
  const baseInput = {
    name: 'Nguyễn Hoàng Nam',
    day: 20,
    month: 10,
    year: 1990,
    gender: 1,
    isLunar: false,
    hourIndex: 4,
  };

  const baseline = evaluateBirthRectification({
    baseInput,
    preset: 'adjacent',
    selectedTraitIds: [],
    pastEvents: [],
  });
  assert.equal(baseline.candidates.length, 3);
  assert.equal(baseline.hasUserSignals, false);

  // Chọn toàn bộ đặc điểm của ứng viên số 2 (Giờ Thìn) + thêm các mốc sự kiện thực tế
  const targetCand = baseline.candidates.find((c) => c.hourIndex === 4);
  assert.ok(targetCand);
  const targetTraitIds = [
    ...targetCand.traits.menhThanTat.map((t) => t.id),
    ...targetCand.traits.family.map((t) => t.id),
  ];

  const pastEvents = [
    { id: 'ev1', year: 2018, eventType: 'career_up', note: 'Thăng chức trưởng nhóm' },
    { id: 'ev2', year: 2020, eventType: 'marriage', note: 'Kết hôn cuối năm' },
    { id: 'ev3', year: 2022, eventType: 'wealth_gain', note: 'Mua nhà đầu tiên' },
  ];

  const bt = scoreCandidateWithPastEvents(
    { chart: targetCand.chart, engineInput: targetCand.engineInput },
    pastEvents,
  );
  assert.equal(bt.eventCount, 3);
  assert.equal(bt.eventBreakdown.length, 3);
  assert.ok(bt.eventScore >= 0 && bt.eventScore <= 100);
  for (const d of bt.eventBreakdown) {
    assert.ok(d.reasons.length >= 1);
    assert.ok(d.reasons[0].includes(String(d.year)) || d.reasons.join(' ').length > 10);
  }

  const evaluated = evaluateBirthRectification({
    baseInput,
    preset: 'adjacent',
    selectedTraitIds: targetTraitIds,
    pastEvents,
  });

  assert.equal(evaluated.hasUserSignals, true);
  assert.equal(evaluated.topCandidate.id, targetCand.id);
  assert.ok(evaluated.topCandidate.matchScore >= evaluated.ranked[1].matchScore);
  assert.ok(evaluated.topCandidate.evidenceBullets.length >= 3);
});
