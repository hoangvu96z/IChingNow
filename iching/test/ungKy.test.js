import test from 'node:test';
import assert from 'node:assert/strict';
import { computeUngKy } from '../src/logic/ungKy.js';
import { getCanChiFromDate } from '../src/logic/solarLunar.js';
import { buildHexagram } from '../src/logic/buildHexagram.js';
import { analyzeLucHao } from '../src/logic/lucHaoAnalysis.js';

const START_DATE = '2026-03-15';

test('computeUngKy: 7 quy tắc cổ pháp Tăng San Bốc Dịch trả về đúng ruleCode, chi mục tiêu & ngày Dương lịch/Can Chi', () => {
  // 1. Dụng Thần Tuần Không -> Xuất Không / Xung Không
  const startCc = getCanChiFromDate(START_DATE, '12:00');
  const voidChi = startCc.khongVong[0]; // Chi đang Tuần Không tại ngày bắt đầu
  const r1 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: voidChi,
        element: 'Kim',
        lucThan: 'Thê Tài',
        isTuanKhong: true,
        isMoving: false,
      },
      score: 2,
      verdict: 'cat',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r1.ruleCode, 'tuan-khong');
  assert.ok(r1.targetBranches.includes(voidChi));
  assert.ok(r1.candidateDates.length >= 4);
  for (const cand of r1.candidateDates) {
    const checkCc = getCanChiFromDate(cand.isoDate, '12:00');
    assert.equal(`${checkCc.ngayCan} ${checkCc.ngayChi}`, cand.canChiDay);
    assert.ok(r1.targetBranches.includes(checkCc.ngayChi));
  }
  assert.ok(r1.candidateDates.some((d) => d.matchReasonVi.includes('Xuất Không')));

  // 2. Dụng Thần Hợp Trụ -> Xung Hợp (Mão hợp Tuất -> xung bằng Dậu hoặc Thìn)
  const r2 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: 'Mão',
        element: 'Mộc',
        lucThan: 'Thê Tài',
        isHopTru: true,
        hopPartnerChi: 'Tuất',
        hopSource: 'Nhật thần',
      },
      score: 1.5,
      verdict: 'cat',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r2.ruleCode, 'hop-tru');
  assert.deepEqual(r2.targetBranches, ['Dậu', 'Thìn']);
  assert.ok(r2.candidateDates.every((d) => ['Dậu', 'Thìn'].includes(d.branch)));

  // 3. Dụng Thần Nhập Mộ -> Xung Mộ (Hỏa nhập mộ Tuất -> Thìn xung Mộ)
  const r3 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: 'Ngọ',
        element: 'Hỏa',
        lucThan: 'Quan Quỷ',
        tombChi: 'Tuất',
        isNhapNhatMo: true,
      },
      score: 0.5,
      verdict: 'binh',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r3.ruleCode, 'nhap-mo');
  assert.ok(r3.targetBranches.includes('Thìn'));
  assert.ok(r3.candidateDates.some((d) => d.branch === 'Thìn' && d.priority === 1));

  // 4. Dụng Thần Phục Tàng -> Trị Nhật (Mão) hoặc Xung Phi Thần (Phi Thân -> Dần xung Phi)
  const r4 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: 'Mão',
        element: 'Mộc',
        lucThan: 'Thê Tài',
        isPhucThan: true,
        phiChi: 'Thân',
      },
      score: 0,
      verdict: 'binh',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r4.ruleCode, 'phuc-tang');
  assert.ok(r4.targetBranches.includes('Mão'));
  assert.ok(r4.targetBranches.includes('Dần'));
  assert.ok(r4.candidateDates.some((d) => d.branch === 'Dần' && d.matchReasonVi.includes('Xung Phi')));

  // 5. Dụng Thần Vượng Tĩnh -> Xung Động (Tý -> Ngọ) hoặc Trị Nhật (Tý)
  const r5 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: 'Tý',
        element: 'Thủy',
        lucThan: 'Phụ Mẫu',
        isMoving: false,
        isWeak: false,
      },
      score: 3,
      verdict: 'cat',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r5.ruleCode, 'vuong-tinh');
  assert.deepEqual(r5.targetBranches, ['Ngọ', 'Tý']);
  assert.ok(r5.candidateDates.every((d) => ['Ngọ', 'Tý'].includes(d.branch)));

  // 6. Dụng Thần Động -> Hợp Nhật (Dần hợp Hợi), Trị Nhật (Dần), hoặc Lâm Chi biến (Mão)
  const r6 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: 'Dần',
        element: 'Mộc',
        lucThan: 'Thê Tài',
        isMoving: true,
        changedChi: 'Mão',
        isWeak: false,
      },
      score: 3.5,
      verdict: 'cat',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r6.ruleCode, 'hao-dong');
  assert.deepEqual(r6.targetBranches, ['Hợi', 'Dần', 'Mão']);
  assert.ok(r6.candidateDates.some((d) => d.branch === 'Hợi'));

  // 7. Dụng Thần Suy Nhược / Nhật Phá -> Sinh Phù / Đế Vượng / Hợp Phá + Cảnh báo khi verdict = hung
  const r7 = computeUngKy(
    { castDate: START_DATE },
    {
      primaryDT: {
        chi: 'Mão',
        element: 'Mộc',
        lucThan: 'Thê Tài',
        isWeak: true,
        isNhatPha: true,
        vuongSuy: 'Tử',
      },
      score: -4,
      verdict: 'hung',
    },
    { startDate: START_DATE, scanDays: 60 }
  );
  assert.equal(r7.ruleCode, 'suy-nhuoc');
  assert.equal(r7.isUnfavorableWarning, true);
  assert.ok(r7.cautionVi.includes('phòng bị'));
  assert.ok(r7.targetBranches.includes('Tuất')); // Hợp Phá cứu Mão
  assert.ok(r7.targetBranches.includes('Hợi'));  // Trường Sinh / Nguyên Thần Thủy
});

test('computeUngKy tích hợp trực tiếp với buildHexagram + analyzeLucHao hoàn toàn tất định', () => {
  const hex = buildHexagram([7, 9, 8, 7, 6, 8], '2026-10-31T20:02');
  const a1 = analyzeLucHao(hex, 'cong-viec');
  const a2 = analyzeLucHao(hex, 'cong-viec');
  assert.deepEqual(a1.ungKy, a2.ungKy);
  assert.ok(a1.ungKy.primaryRuleVi.length > 0);
  assert.ok(a1.ungKy.candidateDates.length > 0);
  // Các ngày ứng viên phải được sắp xếp tăng dần theo thời gian
  for (let i = 1; i < a1.ungKy.candidateDates.length; i += 1) {
    assert.ok(a1.ungKy.candidateDates[i].daysAhead >= a1.ungKy.candidateDates[i - 1].daysAhead);
  }
});
