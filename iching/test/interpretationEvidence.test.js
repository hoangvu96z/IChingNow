import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLucHaoResult } from '../src/logic/buildHexagram.js';
import { buildMaiHoaResult } from '../src/logic/maiHoa.js';
import {
  buildEvidenceCatalog,
  evidencePrompt,
  parseEvidenceResponse,
  evidencePlainText,
} from '../src/logic/interpretationEvidence.js';

const coinResult = (moving) =>
  buildLucHaoResult({
    formData: {
      castDate: '2026-09-22',
      castTime: '10:00',
      question: 'Công việc?',
    },
    mode: 'quick',
    lines: Array.from({ length: 6 }, (_, i) => ({
      index: i + 1,
      yinYang: i % 2 ? 'yin' : 'yang',
      moving: moving.includes(i + 1),
    })),
  });
for (const moving of [[], [3], [1, 3, 6]])
  test(`coin catalog: ${moving.length} moving lines`, () => {
    const result = coinResult(moving);
    const catalog = buildEvidenceCatalog(result);
    assert.equal(
      catalog.filter((item) => item.id.startsWith('line.primary')).length,
      6,
    );
    assert.equal(
      catalog.some((item) => item.id === 'hex.changed'),
      moving.length > 0,
    );
    assert.equal(
      catalog.filter((item) => item.id.startsWith('line.changed')).length,
      moving.length ? 6 : 0,
    );
    assert.ok(!catalog.some((item) => item.id === 'maihoa.the-dung'));
    for (const line of result.lines) {
      const item = catalog.find(
        (item) => item.id === `line.primary.${line.index}`,
      );
      assert.ok(
        item.facts.some(
          ([label, value]) => label === 'Lục Thân' && value === line.lucThan,
        ),
      );
      assert.ok(
        item.facts.some(
          ([label, value]) => label === 'Lục Thú' && value === line.lucThu,
        ),
      );
      if (line.theUng)
        assert.ok(
          item.facts.some(
            ([label, value]) => label === 'Thế / Ứng' && value === line.theUng,
          ),
        );
      if (line.phucThan)
        assert.ok(item.facts.some(([label]) => label === 'Phục Thần'));
    }
  });
for (const subMode of ['time', 'serial'])
  test(`Mai Hoa catalog: ${subMode}`, () => {
    const result = buildMaiHoaResult({
      subMode,
      dateStr: '2026-09-22',
      timeStr: '10:00',
      serial: '12345678',
    });
    const catalog = buildEvidenceCatalog(result);
    for (const id of [
      'hex.primary',
      'hex.mutual',
      'hex.changed',
      'maihoa.the-dung',
    ])
      assert.ok(catalog.some((item) => item.id === id));
    const facts = catalog.find((item) => item.id === 'maihoa.the-dung').facts;
    assert.ok(
      facts.some(
        ([label, value]) =>
          label === 'Hào động' && value === String(result.movingLine),
      ),
    );
    assert.ok(evidencePrompt(catalog).includes('maihoa.the-dung'));
  });
const catalog = buildEvidenceCatalog(coinResult([3]));
test('validates and deduplicates references; ignores invented IDs', () => {
  const parsed = parseEvidenceResponse(
    JSON.stringify({
      version: 1,
      sections: [
        {
          title: 'Nhận định',
          text: 'Nội dung',
          references: [
            'line.primary.3',
            'line.primary.3',
            'line.primary.9',
            '__proto__',
            { id: 'hex.primary' },
          ],
        },
      ],
      questions: ['Hỏi tiếp?', null],
    }),
    catalog,
  );
  assert.deepEqual(parsed.sections[0].references, ['line.primary.3']);
  assert.equal(parsed.sections[0].omittedReferences, true);
  assert.deepEqual(parsed.questions, ['Hỏi tiếp?']);
});
test('legacy Markdown stays unchanged', () => {
  const text = '## Quẻ cũ\nNội dung vẫn đọc được.';
  assert.equal(parseEvidenceResponse(text, catalog).fallback, text);
  assert.equal(evidencePlainText(text), text);
});
test('unknown schema renders prose but no active references', () => {
  const raw = JSON.stringify({
    version: 99,
    sections: [{ text: 'Nội dung', references: ['hex.primary'] }],
  });
  assert.deepEqual(
    parseEvidenceResponse(raw, catalog).sections[0].references,
    [],
  );
  assert.equal(evidencePlainText(raw), 'Nội dung');
});
test('truncated JSON recovers text and never generates evidence links', () => {
  const parsed = parseEvidenceResponse(
    '{"version":1,"sections":[{"title":"Tổng quan","text":"Vẫn đọc được","references":[',
    catalog,
  );
  assert.equal(parsed.structured, false);
  assert.ok(parsed.fallback.includes('Vẫn đọc được'));
  assert.equal(parsed.sections.length, 0);
});
test('fenced JSON is accepted and history preview is readable', () => {
  const raw =
    '```json\n' +
    JSON.stringify({
      version: 1,
      sections: [
        { title: 'Tổng quan', text: 'Luận giải', references: ['hex.primary'] },
      ],
    }) +
    '\n```';
  assert.equal(evidencePlainText(raw), 'Tổng quan\nLuận giải');
  assert.deepEqual(parseEvidenceResponse(raw, catalog).sections[0].references, [
    'hex.primary',
  ]);
});
test('older Mai Hoa without a companion table only links visible hexagrams', () => {
  const result = buildMaiHoaResult({
    subMode: 'serial',
    serial: '12345678',
    dateStr: '2026-09-22',
    timeStr: '10:00',
  });
  delete result.lucHaoResult;
  assert.ok(
    !buildEvidenceCatalog(result).some((item) => item.id.startsWith('line.')),
  );
});

test('one parsed result keeps both the interpretation and questions', async () => {
  const { parseInterpretationResponse } = await import('../src/logic/interpretationEvidence.js');
  const raw = JSON.stringify({ version: 1, sections: [{ title: 'Tổng quan', text: 'Nội dung luận giải đầy đủ', references: ['hex.primary'] }], questions: ['Nên làm gì tiếp?'] });
  for (const response of [raw, `\`\`\`json\n${raw}\n\`\`\``, `Dưới đây là luận giải:\n${raw}\n---SUGGESTED_QUESTIONS---\n1. Nên làm gì tiếp?`]) {
    const parsed = parseInterpretationResponse(response, catalog);
    assert.equal(parsed.sections[0].text, 'Nội dung luận giải đầy đủ');
    assert.deepEqual(parsed.questions, ['Nên làm gì tiếp?']);
    assert.deepEqual(parsed.sections[0].references, ['hex.primary']);
  }
});

test('legacy questions do not remove the preceding interpretation', async () => {
  const { parseInterpretationResponse } = await import('../src/logic/interpretationEvidence.js');
  const parsed = parseInterpretationResponse('## Tổng quan\nLuận giải cũ.\n---SUGGESTED_QUESTIONS---\n1. Nên làm gì tiếp?', catalog);
  assert.equal(parsed.fallback, '## Tổng quan\nLuận giải cũ.');
  assert.deepEqual(parsed.questions, ['Nên làm gì tiếp?']);
});

test('questions-only responses are explicitly missing interpretation', async () => {
  const { parseInterpretationResponse } = await import('../src/logic/interpretationEvidence.js');
  for (const raw of ['---SUGGESTED_QUESTIONS---\n1. Nên làm gì tiếp?', JSON.stringify({ version: 1, sections: [], questions: ['Nên làm gì tiếp?'] })]) {
    const parsed = parseInterpretationResponse(raw, catalog);
    assert.equal(parsed.fallback, '');
    assert.equal(parsed.sections.length, 0);
    assert.deepEqual(parsed.questions, ['Nên làm gì tiếp?']);
  }
});

test('JSON extraction preserves braces and escaped quotes inside prose', () => {
  const raw = JSON.stringify({ version: 1, sections: [{ text: 'Chữ { trong câu và "lời khuyên" } vẫn giữ nguyên.' }] });
  assert.equal(parseEvidenceResponse(`Luận giải:\n${raw}\nKết thúc`, catalog).sections[0].text, 'Chữ { trong câu và "lời khuyên" } vẫn giữ nguyên.');
});
