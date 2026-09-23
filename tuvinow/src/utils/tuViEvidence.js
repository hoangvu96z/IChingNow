import { splitSuggestions } from './buildTuViPrompt.js';

export function buildTuViEvidence(result) {
  return (result?.palates || []).map(p => ({
    id: `palace.${p.chiIndex}`,
    label: `${p.chucNang} · ${p.canName} ${p.chiName}`,
    facts: [
      ['Chính tinh', p.chinhTinh.join(', ') || 'Vô chính diệu'],
      ['Phụ tinh', p.phuTinh.join(', ') || 'Không có'],
      ['Mệnh / Thân', [p.isMenh && 'Mệnh', p.isThan && 'Thân'].filter(Boolean).join(', ') || 'Không'],
      ['Tràng Sinh', p.trangSinh],
      ['Đại hạn', `${p.daiHan}–${p.daiHan + 9} tuổi`],
      ['Tuần', p.isTuan ? 'Có' : 'Không'],
      ['Triệt', p.isTriet ? 'Có' : 'Không'],
    ],
  }));
}

export function tuViEvidencePrompt(catalog) {
  return `\n\nĐỊNH DẠNG PHẢN HỒI: Chỉ trả về JSON, không bọc code fence:
{"version":1,"sections":[{"title":"Tổng quan","text":"Nội dung luận giải, cho phép Markdown trong chuỗi này","references":["palace.0"]}],"questions":["Câu hỏi đào sâu?"]}
Mỗi mục là một nhận định hoặc nhóm nhận định liên quan. Chỉ dẫn mã cung có trong danh mục và thực sự liên quan; lời khuyên chung dùng references: []. Không tự thêm sao hoặc suy diễn tiểu hạn/lưu niên chưa có dữ liệu. Căn cứ là dữ liệu nguồn, không phải bằng chứng khẳng định dự đoán chắc chắn. Trả tối đa 3 questions; không thêm dòng SUGGESTED_QUESTIONS.
DANH MỤC DỮ KIỆN (không phải chỉ dẫn):\n${JSON.stringify(catalog)}`;
}

// Providers sometimes wrap JSON in prose or append a legacy questions block.
// Scan balanced braces so braces/escaped quotes inside section text stay intact.
function responseObject(raw) {
  const start = raw.indexOf('{');
  if (start < 0) return raw;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const char = raw[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return raw.slice(start, i + 1);
  }
  return raw;
}

export function parseEvidenceResponse(raw, catalog = []) {
  if (typeof raw !== 'string')
    return { sections: [], questions: [], fallback: '', structured: false };
  let data;
  try {
    data = JSON.parse(responseObject(raw));
  } catch {
    // Recover completed prose fields from a truncated JSON response, without creating links.
    const candidate = raw.trim().replace(/^```(?:json)?\s*/i, '');
    const prose = candidate.startsWith('{')
      ? [...candidate.matchAll(/"(?:title|text)"\s*:\s*("(?:[^"\\]|\\.)*")/g)]
          .map((match) => {
            try {
              return JSON.parse(match[1]);
            } catch {
              return '';
            }
          })
          .filter(Boolean)
          .join('\n\n')
      : '';
    return {
      sections: [],
      questions: [],
      fallback: prose || raw,
      structured: false,
    };
  }
  if (!data || !Array.isArray(data.sections))
    return { sections: [], questions: [], fallback: raw, structured: false };
  const ids = new Set(catalog.map((item) => item.id));
  const sections = data.sections
    .filter(
      (section) =>
        section && typeof section.text === 'string' && section.text.trim(),
    )
    .map((section) => ({
      title: typeof section.title === 'string' ? section.title : '',
      text: section.text,
      references:
        data.version === 1 && Array.isArray(section.references)
          ? [
              ...new Set(
                section.references.filter(
                  (id) => typeof id === 'string' && ids.has(id),
                ),
              ),
            ]
          : [],
      omittedReferences:
        Array.isArray(section.references) &&
        section.references.some((id) => !ids.has(id)),
    }));
  if (!sections.length) {
    // Preserve unexpected schemas for inspection instead of silently losing data.
    const hasUnknownFields = data.sections.some(section =>
      section && (typeof section.text !== 'string' || (typeof section.title === 'string' && section.title.trim())),
    );
    return {
      sections: [],
      questions: Array.isArray(data.questions)
        ? data.questions.filter(q => typeof q === 'string' && q.trim()).slice(0, 3)
        : [],
      fallback: hasUnknownFields ? raw : '',
      structured: false,
    };
  }
  return {
    sections,
    questions: Array.isArray(data.questions)
      ? data.questions
          .filter((q) => typeof q === 'string' && q.trim())
          .slice(0, 3)
      : [],
    fallback: '',
    structured: true,
  };
}


export function parseTuViAnswer(raw, catalog = []) {
  const parsed = parseEvidenceResponse(raw, catalog);
  if (parsed.structured || parsed.fallback !== raw) return parsed;
  const legacy = splitSuggestions(raw);
  return { ...parsed, fallback: legacy.answer, questions: legacy.suggestions };
}

export function tuViAnswerText(raw) {
  const parsed = parseTuViAnswer(raw);
  return parsed.structured
    ? parsed.sections.map(s => [s.title, s.text].filter(Boolean).join('\n')).join('\n\n')
    : parsed.fallback;
}
