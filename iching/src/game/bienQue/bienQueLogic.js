/**
 * Biến Quẻ: puzzle biến quẻ xuất phát thành quẻ đích bằng các "chiêu" Kinh Dịch.
 * Hàm thuần, không phụ thuộc React. Quẻ biểu diễn bằng chuỗi 6 bit, ký tự 0 = hào 1 (dưới cùng).
 */
import { HEXAGRAMS } from '../../data/hexagrams.js';
import { HEXAGRAM_DESCRIPTIONS } from '../../data/hexagramDescriptions.js';
import { mulberry32, seedFromString } from '../questionGenerators.js';

// ── Dữ liệu quẻ ────────────────────────────────────────────────────────────
export const HEX_BY_BIN = Object.fromEntries(HEXAGRAMS.map((h) => [h.binary, h]));
const DESC_BY_ID = {};
for (const d of Object.values(HEXAGRAM_DESCRIPTIONS)) DESC_BY_ID[d.id] = d;

const ALL_BINS = HEXAGRAMS.map((h) => h.binary);

/** Ký tự Unicode của quẻ (䷀ … ䷿), theo thứ tự Văn Vương */
export const glyph = (bin) => String.fromCodePoint(0x4dc0 + HEX_BY_BIN[bin].id - 1);

function shortSummary(text = '') {
  // "Cát. Đại biểu cho ..." → lấy phần đánh giá + câu đầu tiên
  return text.split(/(?<=\.)\s+/).slice(0, 2).join(' ');
}

export function hexInfo(bin) {
  const h = HEX_BY_BIN[bin];
  if (!h) return null;
  return { ...h, glyph: glyph(bin), summary: shortSummary(DESC_BY_ID[h.id]?.tong_quat) };
}

// ── Chiêu thức ─────────────────────────────────────────────────────────────
export const SKILLS = {
  flip: { id: 'flip', label: 'Động hào', icon: '⚋', emoji: '🔸', desc: 'Chạm một hào để lật âm ↔ dương (ra Quẻ Biến)' },
  thac: { id: 'thac', label: 'Thác',     icon: '☯', emoji: '☯️', desc: 'Đảo toàn bộ âm dương, ra quẻ đối (Thác quái)' },
  tong: { id: 'tong', label: 'Tổng',     icon: '⇅', emoji: '🔃', desc: 'Lật ngược quẻ từ trên xuống, ra quẻ ngược (Tổng quái)' },
  ho:   { id: 'ho',   label: 'Hỗ',       icon: '⧉', emoji: '🔀', desc: 'Hào 2-3-4 làm quái dưới, hào 3-4-5 làm quái trên (Hỗ quái)' },
};
export const ALL_SKILLS = ['flip', 'thac', 'tong', 'ho'];
export const ALL_LINES = [1, 2, 3, 4, 5, 6];

/** @param {{type:'flip'|'thac'|'tong'|'ho', line?:number}} move */
export function applyMove(bin, move) {
  switch (move.type) {
    case 'flip': {
      const i = move.line - 1;
      return bin.slice(0, i) + (bin[i] === '1' ? '0' : '1') + bin.slice(i + 1);
    }
    case 'thac': return bin.replace(/[01]/g, (c) => (c === '1' ? '0' : '1'));
    case 'tong': return bin.split('').reverse().join('');
    case 'ho':   return bin[1] + bin[2] + bin[3] + bin[2] + bin[3] + bin[4];
    default:     return bin;
  }
}

/** `lines`: các hào được phép động; hào còn lại bị phong ấn */
export function neighbors(bin, skills, lines = ALL_LINES) {
  const out = [];
  for (const s of skills) {
    if (s === 'flip') {
      for (const line of lines) {
        const move = { type: 'flip', line };
        out.push({ move, bin: applyMove(bin, move) });
      }
    } else {
      const move = { type: s };
      const next = applyMove(bin, move);
      if (next !== bin) out.push({ move, bin: next });
    }
  }
  return out;
}

/** BFS từ start → { dist: {bin:n}, prev: {bin:{from, move}} } */
export function bfs(start, skills, lines = ALL_LINES) {
  const dist = { [start]: 0 };
  const prev = {};
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const { move, bin } of neighbors(cur, skills, lines)) {
      if (bin in dist) continue;
      dist[bin] = dist[cur] + 1;
      prev[bin] = { from: cur, move };
      queue.push(bin);
    }
  }
  return { dist, prev };
}

/** Lời giải tối ưu: mảng move, hoặc null nếu không tới được */
export function solve(start, target, skills, lines = ALL_LINES) {
  if (start === target) return [];
  const { dist, prev } = bfs(start, skills, lines);
  if (!(target in dist)) return null;
  const path = [];
  for (let b = target; b !== start; b = prev[b].from) path.unshift(prev[b].move);
  return path;
}

// ── Sinh đề ────────────────────────────────────────────────────────────────
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Sinh đề có khoảng cách tối ưu nằm trong [minDist, maxDist].
 * `require`: chiêu bắt buộc phải hữu ích (không có nó thì xa hơn hoặc không tới được).
 */
export function generatePuzzle(rng, { skills, lines = ALL_LINES, minDist, maxDist = minDist, require = null }) {
  for (const req of require ? [require, null] : [null]) {
    for (const start of shuffle(rng, ALL_BINS)) {
      const { dist } = bfs(start, skills, lines);
      const without = req ? bfs(start, skills.filter((s) => s !== req), lines).dist : null;
      const cands = ALL_BINS.filter((b) => (
        dist[b] >= minDist && dist[b] <= maxDist
        && (!req || !(b in without) || without[b] > dist[b])
      ));
      if (cands.length) {
        const target = cands[Math.floor(rng() * cands.length)];
        const optimal = dist[target];
        return { start, target, skills, lines, optimal, maxMoves: optimal + 3 };
      }
    }
  }
  if (minDist > 1) return generatePuzzle(rng, { skills, lines, minDist: minDist - 1, maxDist, require });
  throw new Error('Không sinh được đề');
}

// ── Hành trình ─────────────────────────────────────────────────────────────
// Mỗi màn: d = độ sâu lời giải, lines = các hào được động (hào khác bị phong ấn)
const L = ALL_LINES;
export const CHAPTERS = [
  {
    id: 'c1', roman: 'I', title: 'Động Hào', skills: ['flip'], require: null,
    levels: [{ d: 1, lines: L }, { d: 1, lines: L }, { d: 2, lines: L }, { d: 2, lines: L }, { d: 3, lines: L }, { d: 4, lines: L }],
    lesson: {
      skill: 'flip',
      text: 'Hào động là hào đang biến: dương (—) hóa âm (- -) và ngược lại. Khi xem quẻ, các hào động tạo ra Quẻ Biến, cho biết sự việc sẽ diễn biến thế nào.',
      example: ['111111', '011111'],
    },
  },
  {
    id: 'c2', roman: 'II', title: 'Thác Quái', skills: ['flip', 'thac'], require: 'thac',
    levels: [{ d: 1, lines: L }, { d: 2, lines: L }, { d: 3, lines: [1, 2, 3] }, { d: 4, lines: [1, 2, 3] }, { d: 3, lines: [1, 4] }, { d: 3, lines: [2, 5] }],
    lesson: {
      skill: 'thac',
      text: 'Thác quái (quẻ đối) đảo mọi hào âm thành dương, dương thành âm. Nó cho thấy mặt trái, góc nhìn ngược lại của sự việc. Từ chương này, một số hào bị 🔒 phong ấn và không động được.',
      example: ['111111', '000000'],
    },
  },
  {
    id: 'c3', roman: 'III', title: 'Tổng Quái', skills: ['flip', 'tong'], require: 'tong',
    levels: [{ d: 1, lines: L }, { d: 3, lines: [1, 2, 3] }, { d: 4, lines: [1, 2, 3] }, { d: 5, lines: [1, 3, 5] }, { d: 5, lines: [1, 2] }, { d: 6, lines: [1, 3, 5] }],
    lesson: {
      skill: 'tong',
      text: 'Tổng quái (quẻ ngược) là quẻ lật ngược trên xuống dưới, như người ngồi đối diện nhìn vào. Nó cho thấy góc nhìn của đối phương.',
      example: ['100010', '010001'],
    },
  },
  {
    id: 'c4', roman: 'IV', title: 'Hỗ Quái', skills: ALL_SKILLS, require: 'ho',
    levels: [{ d: 1, lines: L }, { d: 2, lines: [2] }, { d: 4, lines: [2] }, { d: 5, lines: [2] }, { d: 6, lines: [2] }, { d: 7, lines: [2] }],
    lesson: {
      skill: 'ho',
      text: 'Hỗ quái lấy hào 2-3-4 làm quái dưới, hào 3-4-5 làm quái trên. Nó cho thấy diễn biến ẩn bên trong, khúc giữa từ đầu đến cuối sự việc.',
      example: ['100010', '000001'],
    },
  },
];

export const levelKey = (ci, li) => `${CHAPTERS[ci].id}-${li}`;

export function levelPuzzle(ci, li) {
  const ch = CHAPTERS[ci];
  const { d, lines } = ch.levels[li];
  const rng = mulberry32(seedFromString(`bq-${ch.id}-${li}`));
  return { ...generatePuzzle(rng, { skills: ch.skills, lines, minDist: d, maxDist: d, require: ch.require }), id: levelKey(ci, li) };
}

const EPOCH = Date.UTC(2026, 9, 1); // #1 = 01/10/2026
const DAILY_LINES = [[2], [5], [1, 2], [5, 6]];

export function dailyNumber(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86400000) + 1;
}

export function dailyPuzzle(dateStr) {
  const rng = mulberry32(seedFromString(`bq-daily-${dateStr}`));
  const lines = DAILY_LINES[Math.floor(rng() * DAILY_LINES.length)];
  return {
    ...generatePuzzle(rng, { skills: ALL_SKILLS, lines, minDist: 5, maxDist: 6 }),
    id: `daily-${dateStr}`,
    number: dailyNumber(dateStr),
  };
}

// ── Chấm điểm & chia sẻ ────────────────────────────────────────────────────
export function starsFor(moves, optimal, usedHint = false) {
  const base = moves <= optimal ? 3 : moves <= optimal + 1 ? 2 : 1;
  return usedHint ? Math.min(base, 2) : base;
}

export function shareText({ puzzle, moves, stars, url = '' }) {
  return [
    `易 Biến Quẻ #${puzzle.number ?? ''}`.trim(),
    `${glyph(puzzle.start)} → ${glyph(puzzle.target)} · ${moves.length} nước ${'⭐'.repeat(stars)}`,
    moves.map((m) => SKILLS[m.type].emoji).join(''),
    url,
  ].filter(Boolean).join('\n');
}

// ── Lưu tiến trình Biến Quẻ ────────────────────────────────────────────────
const KEY = 'iching_bienque_v1';

export const emptyStore = () => ({ stars: {}, daily: {} });

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyStore(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return emptyStore();
}

export function saveStore(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Ghi kết quả màn; chỉ thưởng XP cho số sao tăng thêm */
export function recordLevel(store, key, stars) {
  const prevStars = store.stars[key] || 0;
  const best = Math.max(prevStars, stars);
  return {
    store: { ...store, stars: { ...store.stars, [key]: best } },
    xp: (best - prevStars) * 10,
  };
}

/** Ghi kết quả đề ngày; chỉ lần giải đầu tiên được tính */
export function recordDaily(store, date, moves, stars) {
  if (store.daily[date]) return { store, xp: 0, first: false };
  return {
    store: { ...store, daily: { ...store.daily, [date]: { moves, stars } } },
    xp: 20 + stars * 10,
    first: true,
  };
}

export function isLevelUnlocked(store, ci, li) {
  if (li > 0) return Boolean(store.stars[levelKey(ci, li - 1)]);
  if (ci === 0) return true;
  return Boolean(store.stars[levelKey(ci - 1, CHAPTERS[ci - 1].levels.length - 1)]);
}

export function totalStars(store) {
  return Object.values(store.stars).reduce((a, b) => a + b, 0);
}

export const MAX_STARS = CHAPTERS.reduce((a, c) => a + c.levels.length * 3, 0);
