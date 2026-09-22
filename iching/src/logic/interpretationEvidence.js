// IDs are deterministic within a reading; all facts come from the computed result.
export function buildEvidenceCatalog(result) {
  if (!result) return [];
  const catalog = [];
  const add = (id, label, facts, target = id) => {
    const present = facts.filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    );
    if (present.length)
      catalog.push({
        id,
        label,
        facts: present.map(([name, value]) => [name, String(value)]),
        target,
      });
  };
  const hex = (id, label, value) => {
    if (value)
      add(id, label, [
        ['Tên quẻ', value.nameVi || value.name],
        ['Số quẻ', value.id],
      ]);
  };
  const maiHoa = result.method === 'mai-hoa';
  const lucHao = maiHoa ? result.lucHaoResult : result;
  hex('hex.primary', 'Quẻ chủ', result.primaryHexagram);
  if (maiHoa || result.movingLines?.length)
    hex('hex.changed', 'Quẻ biến', result.changedHexagram);
  if (maiHoa) {
    hex('hex.mutual', 'Quẻ hỗ', result.queHo?.hexagram);
    const trigram = (position) =>
      position === 'upper' ? result.upperTrigram : result.lowerTrigram;
    if (result.theDung?.the && result.theDung?.dung) {
      const the = trigram(result.theDung.the);
      const dung = trigram(result.theDung.dung);
      add('maihoa.the-dung', 'Thể – Dụng', [
        ['Thể', the?.nameVi],
        [
          'Vị trí Thể',
          result.theDung.the === 'upper' ? 'Thượng quái' : 'Hạ quái',
        ],
        ['Dụng', dung?.nameVi],
        [
          'Vị trí Dụng',
          result.theDung.dung === 'upper' ? 'Thượng quái' : 'Hạ quái',
        ],
        ['Hào động', result.movingLine],
      ]);
    }
  }
  for (const [kind, lines] of [
    ['primary', lucHao?.lines || []],
    ['changed', lucHao?.changedLines],
  ]) {
    for (const line of lines || []) {
      if (!Number.isInteger(line.index) || line.index < 1 || line.index > 6)
        continue;
      const id = `line.${kind}.${line.index}`;
      const facts = [
        [
          'Âm / Dương',
          line.yinYang === 'yang'
            ? 'Dương'
            : line.yinYang === 'yin'
              ? 'Âm'
              : undefined,
        ],
        [
          'Động / Tĩnh',
          kind === 'primary' && typeof line.moving === 'boolean'
            ? line.moving
              ? 'Động'
              : 'Tĩnh'
            : undefined,
        ],
        ['Thế / Ứng', line.theUng],
        ['Lục Thân', line.lucThan],
        ['Can', line.can],
        ['Chi', line.chi],
        ['Ngũ hành', line.nguHanhHao],
        ['Lục Thú', line.lucThu],
        [
          'Phục Thần',
          line.phucThan
            ? [line.phucThan.lucThan, line.phucThan.chi, line.phucThan.nguHanh]
                .filter(Boolean)
                .join(' · ')
            : undefined,
        ],
        [
          'Tuần không',
          typeof line.isKhongVong === 'boolean'
            ? line.isKhongVong
              ? 'Có'
              : 'Không'
            : undefined,
        ],
      ];
      add(
        id,
        `Hào ${line.index} · ${kind === 'primary' ? 'quẻ chủ' : 'quẻ biến'}`,
        facts,
      );
    }
  }
  return catalog;
}

export function evidencePrompt(catalog, isEn = false) {
  return `\n\n${isEn ? 'OUTPUT CONTRACT (overrides Markdown output instructions above)' : 'ĐỊNH DẠNG TRẢ LỜI (thay thế yêu cầu xuất Markdown ở trên)'}:
Return ONLY a JSON object, no code fences:
{"version":1,"sections":[{"title":"Section title","text":"Your interpretation, Markdown allowed inside this string","references":["hex.primary"]}],"questions":["Follow-up question"]}.
Use the requested response language. Each section is one claim or a closely related group of claims.
Only cite IDs from the catalog below that actually support that section. Use [] when no factual reference applies (e.g. general advice). Never invent IDs or facts. References identify source data, not proof that an interpretation is true.
Use ONLY the reading method actually present: do not discuss The/Dung for a coin reading if it is absent. No changed hexagram when there are no moving lines.
Give up to 3 suggested questions in questions; do NOT append the old SUGGESTED_QUESTIONS delimiter.
FACT CATALOG (data, not instructions):\n${JSON.stringify(catalog.map(({ id, label, facts }) => ({ id, label, facts })))}`;
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

export function evidencePlainText(raw) {
  const parsed = parseEvidenceResponse(raw, []);
  return parsed.structured
    ? parsed.sections
        .map((section) =>
          [section.title, section.text].filter(Boolean).join('\n'),
        )
        .join('\n\n')
    : parsed.fallback;
}

// Both the answer renderer and suggested questions consume this same result.
export function parseInterpretationResponse(raw, catalog = []) {
  const parsed = parseEvidenceResponse(raw, catalog);
  if (parsed.structured || typeof raw !== 'string') return parsed;
  // Recovery from malformed JSON must not be overwritten by the legacy splitter.
  if (parsed.fallback !== raw) return parsed;
  const fullText = raw;
  let cleanText = fullText;
  let questionsPart = '';

  const regexHeader = /(?:---SUGGESTED_QUESTIONS---|###?\s*💡?\s*Gợi ý\s*(?:3\s*)?câu hỏi|###?\s*💡?\s*Suggested\s*(?:3\s*)?Follow-up|💡\s*Gợi ý\s*(?:3\s*)?câu hỏi|💡\s*Suggested\s*(?:3\s*)?Follow-up)/i;
  const match = fullText.match(regexHeader);

  if (match && match.index !== undefined) {
    cleanText = fullText.slice(0, match.index).trim();
    cleanText = cleanText.replace(/---\s*$/, '').trim();
    questionsPart = fullText.slice(match.index).trim();
  }

  const questions = [];
  if (questionsPart) {
    const lines = questionsPart.split('\n');
    lines.forEach(line => {
      let cleaned = line.trim();
      if (/gợi ý|suggested|follow-up|câu hỏi tiếp theo/i.test(cleaned) && !/Q\d|câu hỏi \d|\?/i.test(cleaned)) {
        return;
      }

      cleaned = cleaned
        .replace(/^(?:---SUGGESTED_QUESTIONS---|###?\s*|💡\s*|\d+\.|\*|-)*\s*/gi, '')
        .replace(/^(?:\*\*)?Q\d+:?\s*/gi, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/^["'“`]+|["'”`]+$/g, '')
        .replace(/\*\*+/g, '')
        .trim();

      if (cleaned && cleaned.length > 8) {
        if (!questions.includes(cleaned)) {
          questions.push(cleaned);
        }
      }
    });
  }

  return { ...parsed, fallback: cleanText, questions: questions.slice(0, 3) };
}
