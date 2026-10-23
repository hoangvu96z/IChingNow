export const JOURNAL_TAG_LABELS = Object.freeze({
  career: 'Sự nghiệp',
  love: 'Tình cảm',
  health: 'Sức khỏe',
  family: 'Gia đình',
  finance: 'Tài chính',
  personal: 'Bản thân',
  growth: 'Phát triển',
  other: 'Khác',
});

export const JOURNAL_APP_LABELS = Object.freeze({
  iching: 'Kinh Dịch',
  tarot: 'Tarot',
  tuvi: 'Tử Vi',
  'tuvi-hop-hon': 'Tử Vi Hợp Hôn',
});

export function padJournalDateBounds(from, to) {
  const shift = (value, days) => {
    if (!value) return value;
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  return { from: shift(from, -1), to: shift(to, 1) };
}

function localDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function searchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi');
}

export function filterJournalEntries(entries, filters = {}) {
  const query = searchText(filters.query).trim();
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null;
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const date = localDate(entry.createdAt);
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    if (filters.tag && !entry.tags?.includes(filters.tag)) return false;
    if (filters.app && entry.reading?.app !== filters.app) return false;
    if (!query) return true;

    // Search only reflection text and safe reading metadata, never the original question.
    const haystack = searchText([
      entry.reflection,
      JOURNAL_APP_LABELS[entry.reading?.app] || entry.reading?.app,
      entry.reading?.type,
      ...(entry.tags || []).map((tag) => JOURNAL_TAG_LABELS[tag] || tag),
    ].join(' '));
    return haystack.includes(query);
  });
}

export function buildReflectionReport(entries, { period, value }) {
  const selected = (Array.isArray(entries) ? entries : [])
    .filter((entry) => {
      const date = localDate(entry.createdAt);
      if (!date) return false;
      return period === 'year'
        ? String(date.getFullYear()) === String(value)
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === value;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const tagCounts = new Map();
  for (const entry of selected) {
    for (const tag of new Set(entry.tags || [])) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const label = period === 'year' ? `Năm ${value}` : `Tháng ${value}`;
  const lines = [
    `# Nhật ký chiêm nghiệm — ${label}`,
    '',
    `- Số reflection: ${selected.length}`,
    `- Theo ứng dụng: ${Object.entries(JOURNAL_APP_LABELS)
      .map(([app, appLabel]) => `${appLabel}: ${selected.filter((entry) => entry.reading?.app === app).length}`)
      .join(' · ')}`,
    `- Chủ đề thường gặp: ${[...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => `${JOURNAL_TAG_LABELS[tag] || tag} (${count})`)
      .join(', ') || 'Chưa có chủ đề gắn thẻ'}`,
    '',
    '## Reflection',
  ];

  for (const entry of selected) {
    const date = localDate(entry.createdAt);
    const app = JOURNAL_APP_LABELS[entry.reading?.app] || entry.reading?.app || 'Ứng dụng';
    const tags = (entry.tags || []).map((tag) => JOURNAL_TAG_LABELS[tag] || tag).join(', ');
    lines.push(
      '',
      `### ${date.toLocaleDateString('vi-VN')} · ${app} · ${entry.reading?.type || 'Reading'}`,
      ...(tags ? [`Chủ đề: ${tags}`, ''] : ['']),
      entry.reflection || '',
    );
  }

  return { label, count: selected.length, entries: selected, markdown: `${lines.join('\n').trim()}\n` };
}
