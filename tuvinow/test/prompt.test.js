import test from 'node:test';
import assert from 'node:assert/strict';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { buildTuViText, buildTuViPrompt, splitSuggestions } from '../src/utils/buildTuViPrompt.js';

const input = { name: 'Nguyễn An', lunarYear: 1996, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, yearCanIndex: 2, yearChiIndex: 0, gender: 1, isLunar: true };
const result = anLaSoTuVi(input);
test('exports all 12 palaces and every computed star without recalculation', () => {
  const text = buildTuViText(result, input);
  assert.equal(result.palates.length, 12);
  for (const palace of result.palates) {
    assert.ok(text.includes(`${palace.chucNang} — ${palace.canName} ${palace.chiName}`));
    for (const star of [...palace.chinhTinh, ...palace.phuTinh]) assert.ok(text.includes(star));
    assert.ok(text.includes(`${palace.daiHan}–${palace.daiHan + 9}`));
  }
  assert.ok(text.includes('12/4/1996'));
  assert.ok(text.includes('Giờ sinh: Mão'));
  assert.ok(text.includes('Không cung cấp (nhập âm lịch)'));
});
test('prompt embeds the same export and selected question', () => {
  const prompt = buildTuViPrompt(result, input, 'career', 'Có nên đổi việc?');
  assert.ok(prompt.includes(buildTuViText(result, input)));
  assert.ok(prompt.includes('Công việc & tài chính'));
  assert.ok(prompt.includes('Có nên đổi việc?'));
  assert.ok(prompt.includes('Chưa có tiểu hạn/lưu niên'));
});
test('solar birth and leap lunar month stay distinguished', () => {
  const text = buildTuViText(result, { ...input, isLunar: false, solarDateStr: '29/5/1996', isLeap: true });
  assert.ok(text.includes('29/5/1996'));
  assert.ok(text.includes('(tháng nhuận)'));
});
test('suggestions are optional and limited to three', () => {
  assert.deepEqual(splitSuggestions('Bài luận'), { answer: 'Bài luận', suggestions: [] });
  assert.deepEqual(splitSuggestions('Bài luận\n---SUGGESTED_QUESTIONS---\n1. A\n2. B\n- C\n4. D'), { answer: 'Bài luận', suggestions: ['A', 'B', 'C'] });
});
