/**
 * Sinh câu hỏi cho game "Luyện Dịch". Hàm thuần, có seed để Thử thách hằng ngày
 * ra cùng một đề cho mọi người.
 */
import { HEXAGRAMS } from '../data/hexagrams.js';
import { WU_XING, EARTHLY_BRANCHES } from '../data/lucYao.js';
import { computeNapGiap } from '../logic/napGiap.js';

export const MODES = {
  hex:    { id: 'hex',    label: 'Đoán quẻ',  emoji: '☰', desc: 'Nhìn 6 hào, chọn đúng tên quẻ' },
  wuxing: { id: 'wuxing', label: 'Ngũ Hành',  emoji: '☯', desc: 'Sinh hay khắc? Nắm vững nền tảng' },
  napgiap:{ id: 'napgiap',label: 'Nạp Giáp',  emoji: '干', desc: 'Điền Địa Chi cho từng hào' },
};

// ── RNG ───────────────────────────────────────────────────────────────────
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Trộn đáp án đúng với các đáp án sai (không trùng), trả về {options, answerIndex} */
function buildOptions(rng, correct, pool, count = 4) {
  const wrong = shuffle(rng, pool.filter((x) => x !== correct)).slice(0, count - 1);
  const options = shuffle(rng, [correct, ...wrong]);
  return { options, answerIndex: options.indexOf(correct) };
}

// ── Generators ────────────────────────────────────────────────────────────
export function genGuessHexagram(rng) {
  const hex = pick(rng, HEXAGRAMS);
  const { options, answerIndex } = buildOptions(rng, hex.nameVi, HEXAGRAMS.map((h) => h.nameVi));
  return {
    type: 'hex',
    prompt: 'Đây là quẻ nào?',
    binary: hex.binary, // bit 0 = hào 1 (dưới cùng)
    options,
    answerIndex,
    explain: `${hex.nameVi} (${hex.nameZh}): quái dưới ${hex.lower}, quái trên ${hex.upper}.`,
  };
}

const EL = Object.keys(WU_XING);

export function genWuXing(rng) {
  const a = pick(rng, EL);
  const b = pick(rng, EL.filter((e) => e !== a));
  const sentences = [
    `${a} sinh ${b}`, `${b} sinh ${a}`, `${a} khắc ${b}`, `${b} khắc ${a}`,
  ];
  let correct;
  if (WU_XING[a].generates === b) correct = sentences[0];
  else if (WU_XING[b].generates === a) correct = sentences[1];
  else if (WU_XING[a].overcomes === b) correct = sentences[2];
  else correct = sentences[3];
  const options = shuffle(rng, sentences);
  return {
    type: 'wuxing',
    prompt: `Quan hệ giữa ${a} và ${b} là gì?`,
    options,
    answerIndex: options.indexOf(correct),
    explain: `Tương sinh: Mộc→Hỏa→Thổ→Kim→Thủy→Mộc. Tương khắc: Mộc→Thổ→Thủy→Hỏa→Kim→Mộc. Đáp án: ${correct}.`,
  };
}

export function genNapGiap(rng) {
  const hex = pick(rng, HEXAGRAMS);
  const idx = 1 + Math.floor(rng() * 6);
  const line = computeNapGiap(hex.binary)[idx - 1];
  const chis = EARTHLY_BRANCHES.map((b) => b.name);
  const { options, answerIndex } = buildOptions(rng, line.chi, chis);
  return {
    type: 'napgiap',
    prompt: `Hào ${idx} của quẻ ${hex.nameVi} nạp Địa Chi gì?`,
    binary: hex.binary,
    highlight: idx,
    options,
    answerIndex,
    explain: `Hào ${idx}: ${line.can} ${line.chi} (${line.nguHanhHao}). Mỗi quái nạp Can Chi cố định, hào 1-3 theo quái dưới, hào 4-6 theo quái trên.`,
  };
}

const GENERATORS = { hex: genGuessHexagram, wuxing: genWuXing, napgiap: genNapGiap };

/**
 * Tạo bộ câu hỏi.
 * @param {'hex'|'wuxing'|'napgiap'|'mix'} mode
 * @param {number} count
 * @param {number} seed
 */
export function buildSession(mode, count, seed) {
  const rng = mulberry32(seed);
  const order = ['hex', 'wuxing', 'napgiap'];
  return Array.from({ length: count }, (_, i) => {
    const m = mode === 'mix' ? order[i % order.length] : mode;
    return GENERATORS[m](rng);
  });
}

export function dailySession(dateStr) {
  return buildSession('mix', 5, seedFromString(`iching-daily-${dateStr}`));
}

/** Văn bản chia sẻ kiểu Wordle */
export function buildShareText(results, dateStr, url = '') {
  const squares = results.map((r) => (r ? '🟩' : '🟥')).join('');
  const score = results.filter(Boolean).length;
  return `易 IChingNow · Luyện Dịch ${dateStr}\n${squares} ${score}/${results.length}${url ? `\n${url}` : ''}`;
}
