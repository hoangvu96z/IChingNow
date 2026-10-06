/**
 * Sinh câu hỏi cho game "Luyện Dịch". Hàm thuần, có seed để Thử thách hằng ngày
 * ra cùng một đề cho mọi người.
 */
import { HEXAGRAMS } from '../data/hexagrams.js';
import { WU_XING, EARTHLY_BRANCHES } from '../data/lucYao.js';
import { computeNapGiap } from '../logic/napGiap.js';
import { buildLucHaoResult } from '../logic/buildHexagram.js';
import { analyzeLucHao } from '../logic/lucHaoAnalysis.js';
import { TOPICS } from '../data/lucHaoRules.js';

/** stage 1 = nền tảng, stage 2 = Lục Hào. count = số câu mỗi lượt. */
export const MODES = {
  hex:     { id: 'hex',     stage: 1, count: 10, label: 'Đoán quẻ',      emoji: '☰', desc: 'Nhìn 6 hào, chọn đúng tên quẻ' },
  wuxing:  { id: 'wuxing',  stage: 1, count: 10, label: 'Ngũ Hành',      emoji: '☯', desc: 'Sinh hay khắc? Nắm vững nền tảng' },
  napgiap: { id: 'napgiap', stage: 1, count: 10, label: 'Nạp Giáp',      emoji: '干', desc: 'Điền Địa Chi cho từng hào' },
  lucthan: { id: 'lucthan', stage: 2, count: 10, label: 'Lục Thân',      emoji: '👪', desc: 'Từ Cung và Ngũ Hành hào, gọi đúng tên Lục Thân' },
  dungthan:{ id: 'dungthan',stage: 2, count: 10, label: 'Chọn Dụng Thần',emoji: '🎯', desc: 'Đọc tình huống, chọn hào đại diện cho việc hỏi' },
  xemque:  { id: 'xemque',  stage: 2, count: 5,  label: 'Xem quẻ thử',   emoji: '🔍', desc: 'Tự đoán Cát / Bình / Hung, rồi so với từng bước giải' },
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

// ── Giai đoạn 2: Lục Hào ─────────────────────────────────────────────────

/** Dựng quẻ Lục Hào đầy đủ (Cung, Thế, Lục Thân...) từ binary + hào động + ngày. */
function makeReading(binary, moving = [], castDate = '2026-09-22') {
  return buildLucHaoResult({
    formData: { castDate, castTime: '10:00', question: 'luyện dịch' },
    mode: 'quick',
    lines: binary.split('').map((c, i) => ({
      index: i + 1,
      yinYang: c === '1' ? 'yang' : 'yin',
      moving: moving.includes(i + 1),
    })),
  });
}

const LUC_THAN_NAMES = ['Phụ Mẫu', 'Huynh Đệ', 'Tử Tôn', 'Thê Tài', 'Quan Quỷ'];
const LUC_THAN_RULE = {
  'Phụ Mẫu':  (h, c) => `${h} sinh ${c}: hào sinh Cung → Phụ Mẫu`,
  'Tử Tôn':   (h, c) => `${c} sinh ${h}: Cung sinh hào → Tử Tôn`,
  'Quan Quỷ': (h, c) => `${h} khắc ${c}: hào khắc Cung → Quan Quỷ`,
  'Thê Tài':  (h, c) => `${c} khắc ${h}: Cung khắc hào → Thê Tài`,
  'Huynh Đệ': (h, c) => `${h} cùng hành ${c} → Huynh Đệ`,
};

export function genLucThan(rng) {
  const hex = pick(rng, HEXAGRAMS);
  const r = makeReading(hex.binary);
  const idx = 1 + Math.floor(rng() * 6);
  const line = r.lines[idx - 1];
  const { options, answerIndex } = buildOptions(rng, line.lucThan, LUC_THAN_NAMES);
  return {
    type: 'lucthan',
    prompt: `Quẻ ${hex.nameVi} thuộc Cung ${r.palaceName} (${r.palaceElement}). Hào ${idx} nạp ${line.chi} (${line.nguHanhHao}). Hào này là Lục Thân gì?`,
    binary: hex.binary,
    highlight: idx,
    options,
    answerIndex,
    explain: `${LUC_THAN_RULE[line.lucThan](line.nguHanhHao, r.palaceElement)}. Lục Thân luôn so Ngũ Hành của hào với Ngũ Hành của Cung, không phải của quái.`,
  };
}

/** Tình huống → chủ đề trong TOPICS hoặc Dụng Thần trực tiếp. */
const SCENARIOS = [
  { text: 'Bạn sắp phỏng vấn xin việc, hỏi có đậu không?', dung: 'Quan Quỷ', why: 'Công danh, chức vụ là Quan Quỷ.' },
  { text: 'Bạn hỏi năm nay có được thăng chức không?', dung: 'Quan Quỷ', why: 'Thăng chức thuộc công danh: Quan Quỷ.' },
  { text: 'Bạn mở quán cà phê, hỏi có lời không?', dung: 'Thê Tài', why: 'Tiền bạc, lợi nhuận là Thê Tài.' },
  { text: 'Bạn cho người quen vay tiền, hỏi có đòi lại được không?', dung: 'Thê Tài', why: 'Hỏi tiền thì lấy Thê Tài.' },
  { text: 'Một chàng trai hỏi chuyện tình cảm với bạn gái.', dung: 'Thê Tài', why: 'Nam hỏi vợ, người yêu: Thê Tài.' },
  { text: 'Một cô gái hỏi người yêu có thật lòng không.', dung: 'Quan Quỷ', why: 'Nữ hỏi chồng, người yêu: Quan Quỷ.' },
  { text: 'Bạn sắp thi chứng chỉ IELTS, hỏi kết quả.', dung: 'Phụ Mẫu', why: 'Thi cử, bằng cấp, văn bản: Phụ Mẫu.' },
  { text: 'Bạn hỏi hợp đồng thuê nhà có ký được không?', dung: 'Phụ Mẫu', why: 'Hợp đồng, giấy tờ là Phụ Mẫu.' },
  { text: 'Bạn hỏi bệnh của mẹ có mau khỏi không?', dung: 'Phụ Mẫu', why: 'Cha mẹ là Phụ Mẫu.' },
  { text: 'Vợ chồng mong con, hỏi bao giờ có tin vui?', dung: 'Tử Tôn', why: 'Con cái là Tử Tôn.' },
  { text: 'Con mèo nhà bạn đi lạc, hỏi có tìm lại được không?', dung: 'Tử Tôn', why: 'Vật nuôi cũng xem Tử Tôn.' },
  { text: 'Bạn hỏi em trai đi du học có thuận lợi không?', dung: 'Huynh Đệ', why: 'Anh chị em là Huynh Đệ.' },
  { text: 'Bạn thân đang giận, bạn hỏi có làm lành được không?', dung: 'Huynh Đệ', why: 'Bạn bè ngang hàng là Huynh Đệ.' },
  { text: 'Bạn hỏi chung về vận trình tuần tới của mình.', dung: 'Thế', why: 'Việc chung của bản thân thì lấy hào Thế.' },
  { text: 'Bạn hỏi sức khỏe bản thân sau ca mổ.', dung: 'Thế', why: 'Hỏi bản thân, sức khỏe mình: lấy hào Thế.' },
];
const DUNG_POOL = [...LUC_THAN_NAMES, 'Thế'];
const dungLabel = (d) => (d === 'Thế' ? 'Hào Thế' : d);

export function genDungThan(rng) {
  const s = pick(rng, SCENARIOS);
  const { options, answerIndex } = buildOptions(rng, s.dung, DUNG_POOL);
  return {
    type: 'dungthan',
    prompt: `${s.text} Dụng Thần là gì?`,
    options: options.map(dungLabel),
    answerIndex,
    explain: `${s.why} Chọn đúng Dụng Thần là bước 1, sai bước này thì các bước sau đều lệch.`,
  };
}

const VERDICT_OPTIONS = ['Cát', 'Bình', 'Hung'];
const VERDICT_INDEX = { cat: 0, binh: 1, hung: 2 };
const PRACTICE_TOPICS = ['career', 'wealth', 'love', 'love_f', 'study', 'children', 'general'];

export function genXemQue(rng) {
  const hex = pick(rng, HEXAGRAMS);
  const moving = [1, 2, 3, 4, 5, 6].filter(() => rng() < 0.22);
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${2025 + Math.floor(rng() * 3)}-${pad(1 + Math.floor(rng() * 12))}-${pad(1 + Math.floor(rng() * 28))}`;
  const topic = pick(rng, PRACTICE_TOPICS);
  const r = makeReading(hex.binary, moving, date);
  const a = analyzeLucHao(r, topic);
  const steps = a.steps.filter((st) => st.id !== 'ket-luan').map((st, i) => `${i + 1}. ${st.title}: ${st.finding}`);
  return {
    type: 'xemque',
    prompt: `Hỏi "${TOPICS[topic].label}". Quẻ ${hex.nameVi} (Cung ${r.palaceName}), ngày ${r.ngayCan} ${r.ngayChi}, tháng ${r.canChi?.thangChi || '?'}`
      + `${moving.length ? `, động hào ${moving.join(', ')}` : ', quẻ tĩnh'}. Quẻ này Cát, Bình hay Hung?`,
    binary: hex.binary,
    moving,
    highlight: a.dungLineIndex ?? undefined,
    revealHighlight: true,
    options: VERDICT_OPTIONS,
    answerIndex: VERDICT_INDEX[a.verdict],
    explain: `${steps.join('\n')}\n→ Tổng điểm ${a.score}: ${VERDICT_OPTIONS[VERDICT_INDEX[a.verdict]]}. (Cách chấm tham khảo để luyện, không thay thầy xem quẻ.)`,
  };
}

const GENERATORS = {
  hex: genGuessHexagram, wuxing: genWuXing, napgiap: genNapGiap,
  lucthan: genLucThan, dungthan: genDungThan, xemque: genXemQue,
};

/**
 * Tạo bộ câu hỏi.
 * @param {'hex'|'wuxing'|'napgiap'|'lucthan'|'dungthan'|'xemque'|'mix'} mode
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
