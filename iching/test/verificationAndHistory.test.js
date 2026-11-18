import test from 'node:test';
import assert from 'node:assert/strict';
import { formatUniqueCreatedAt } from '../src/logic/buildHexagram.js';
import { mapLoadedIChingReading, buildIChingSaveReading } from '../src/logic/readingsMapping.js';
import { buildIChingNoteNowPayload } from '../src/utils/noteNowPayload.js';
import { normalizeVerification } from '../src/logic/verification.js';

test('formatUniqueCreatedAt prevents same-minute and same-second collisions', () => {
  const d = '2026-11-15';
  const t = '14:30';

  const first = formatUniqueCreatedAt(d, t);
  const second = formatUniqueCreatedAt(d, t);

  assert.ok(first.startsWith('2026-11-15 14:30:'));
  assert.ok(second.startsWith('2026-11-15 14:30:'));
  assert.notEqual(first, second, 'Two calls for the same minute/second must produce unique createdAt values');
});

test('buildIChingSaveReading generates unique createdAt and shouldSkipInsert distinguishes same-minute casts', () => {
  const r1 = {
    primaryHexagram: { nameVi: 'Thuần Càn' },
    changedHexagram: null,
    createdAt: formatUniqueCreatedAt('2026-11-15', '10:00'),
    question: 'Việc kinh doanh lần 1',
  };

  const r2 = {
    primaryHexagram: { nameVi: 'Thuần Khôn' },
    changedHexagram: null,
    createdAt: formatUniqueCreatedAt('2026-11-15', '10:00'),
    question: 'Việc kinh doanh lần 2',
  };

  const save1 = buildIChingSaveReading(r1, 'luc-hao');
  const save2 = buildIChingSaveReading(r2, 'luc-hao');

  assert.notEqual(save1.localItem.timestamp, save2.localItem.timestamp);

  const history = [save1.localItem];
  const shouldSkip = save2.shouldSkipInsert(history);
  assert.equal(shouldSkip, false, 'Second cast in same minute must not be skipped');
});

test('mapLoadedIChingReading hydrates verification onto both item and item.data', () => {
  const record = {
    id: 'reading-1234',
    type: 'luc-hao',
    title: 'Quẻ Lục Hào',
  };

  const dataObj = {
    mode: 'quick',
    createdAt: '2026-11-15 14:30:00',
    verification: {
      status: 'accurate',
      actualDate: '2026-11-20',
      note: 'Ứng chuẩn vào giờ Thân',
    },
  };

  const mapped = mapLoadedIChingReading(record, dataObj);

  assert.ok(mapped.verification, 'Mapped object must have top-level verification');
  assert.equal(mapped.verification.status, 'accurate');
  assert.equal(mapped.verification.actualDate, '2026-11-20');
  assert.equal(mapped.verification.note, 'Ứng chuẩn vào giờ Thân');

  assert.ok(dataObj.verification, 'dataObj must also have verification hydrated in sync');
  assert.equal(dataObj.verification.status, 'accurate');
});

test('buildIChingNoteNowPayload returns bgColor amber and formatted Nghiệm Lý details', () => {
  const mockResult = {
    method: 'luc-hao',
    primaryHexagram: { nameVi: 'Thuần Càn' },
    changedHexagram: { nameVi: 'Thiên Phong Cấu' },
    question: 'Dự đoán kết quả hợp đồng',
    verification: normalizeVerification({
      status: 'accurate',
      actualDate: '2026-12-01',
      note: 'Đối tác đã ký kết đúng hẹn',
    }),
  };

  const payload = buildIChingNoteNowPayload(mockResult);

  assert.equal(payload.bgColor, 'amber');
  assert.equal(payload.sourceAppLabel, 'IChingNow');
  assert.ok(payload.summaryLines.some((l) => l.includes('Nghiệm lý: Ứng nghiệm chuẩn')));
  assert.ok(payload.summaryLines.some((l) => l.includes('Ngày ứng nghiệm thực tế: 2026-12-01')));
  assert.ok(payload.summaryLines.some((l) => l.includes('Ghi chú nghiệm lý: Đối tác đã ký kết đúng hẹn')));
});

test('buildIChingNoteNowPayload handles different/partial verification statuses', () => {
  const partialResult = {
    method: 'mai-hoa',
    primaryHexagram: { nameVi: 'Thủy Hỏa Ký Tế' },
    question: 'Hỏi về việc chuyển nhà',
    verification: {
      status: 'partial',
      actualDate: '2026-11-18',
      note: 'Chuyển được nhưng muộn 2 ngày',
    },
  };

  const payloadPartial = buildIChingNoteNowPayload(partialResult);
  assert.equal(payloadPartial.bgColor, 'amber');
  assert.ok(payloadPartial.summaryLines.some((l) => l.includes('Nghiệm lý: Ứng một phần')));

  const differentResult = {
    method: 'luc-hao',
    primaryHexagram: { nameVi: 'Hỏa Lôi Phệ Hạp' },
    question: 'Hỏi về đầu tư',
    verification: {
      status: 'different',
      actualDate: '2026-11-19',
      note: 'Không thực hiện kế hoạch',
    },
  };

  const payloadDifferent = buildIChingNoteNowPayload(differentResult);
  assert.equal(payloadDifferent.bgColor, 'amber');
  assert.ok(payloadDifferent.summaryLines.some((l) => l.includes('Nghiệm lý: Khác dự đoán')));
});
