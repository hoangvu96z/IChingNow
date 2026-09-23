import test from 'node:test';
import assert from 'node:assert/strict';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { buildTuViPrompt } from '../src/utils/buildTuViPrompt.js';
import { buildTuViEvidence, parseTuViAnswer, tuViAnswerText, tuViEvidencePrompt } from '../src/utils/tuViEvidence.js';
const input = { lunarYear: 1996, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, yearCanIndex: 2, yearChiIndex: 0, gender: 1, isLunar: true };
const result = anLaSoTuVi(input);
const catalog = buildTuViEvidence(result);
test('catalog matches engine palaces, stars, flags and decades', () => {
  assert.equal(catalog.length, 12);
  assert.equal(new Set(catalog.map(c => c.id)).size, 12);
  for (const palace of result.palates) {
    const entry = catalog.find(c => c.id === `palace.${palace.chiIndex}`);
    const facts = Object.fromEntries(entry.facts);
    assert.equal(facts['Chính tinh'], palace.chinhTinh.join(', ') || 'Vô chính diệu');
    assert.equal(facts['Phụ tinh'], palace.phuTinh.join(', ') || 'Không có');
    assert.equal(facts['Tuần'], palace.isTuan ? 'Có' : 'Không');
    assert.equal(facts['Triệt'], palace.isTriet ? 'Có' : 'Không');
    assert.equal(facts['Đại hạn'], `${palace.daiHan}–${palace.daiHan + 9} tuổi`);
  }
});
test('validates references and renders readable copy text', () => {
  const raw = JSON.stringify({ version: 1, sections: [{ title: 'Mệnh', text: 'Luận giải đầy đủ', references: ['palace.0', 'palace.0', 'palace.99'] }], questions: ['Nên làm gì?'] });
  for (const text of [raw, `\`\`\`json\n${raw}\n\`\`\``, `Kết quả:\n${raw}`]) {
    const parsed = parseTuViAnswer(text, catalog);
    assert.deepEqual(parsed.sections[0].references, ['palace.0']);
    assert.equal(parsed.sections[0].omittedReferences, true);
    assert.deepEqual(parsed.questions, ['Nên làm gì?']);
    assert.equal(tuViAnswerText(text), 'Mệnh\nLuận giải đầy đủ');
  }
});
test('legacy, truncated and empty answers never gain invented links', () => {
  assert.equal(parseTuViAnswer('Luận cũ\n---SUGGESTED_QUESTIONS---\n1. Hỏi tiếp?', catalog).fallback, 'Luận cũ');
  assert.equal(parseTuViAnswer('{"sections":[{"text":"Nội dung khôi phục",', catalog).fallback, 'Nội dung khôi phục');
  assert.equal(parseTuViAnswer('---SUGGESTED_QUESTIONS---\n1. Hỏi tiếp?', catalog).fallback, '');
  assert.equal(parseTuViAnswer('{"version":1,"sections":[],"questions":["Hỏi tiếp?"]}', catalog).fallback, '');
  assert.deepEqual(parseTuViAnswer('{"version":99,"sections":[{"text":"Luận giải","references":["palace.0"]}]}', catalog).sections[0].references, []);
});
test('API prompt has one output format while export keeps Markdown', () => {
  const api = buildTuViPrompt(result, input, 'career', '', true) + tuViEvidencePrompt(catalog);
  assert.ok(!api.includes('Kết thúc bằng dòng ---SUGGESTED_QUESTIONS---'));
  assert.ok(api.includes('palace.0'));
  assert.ok(buildTuViPrompt(result, input).includes('Kết thúc bằng dòng ---SUGGESTED_QUESTIONS---'));
});
