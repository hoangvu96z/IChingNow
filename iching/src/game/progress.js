/**
 * Tiến trình game: XP, cấp bậc, huy hiệu, thử thách hằng ngày.
 * applyResult là hàm thuần (dễ test); load/save dùng localStorage.
 */
const KEY = 'iching_game_progress_v1';

export const RANKS = [
  { min: 0,    name: 'Sơ học',    emoji: '🌱' },
  { min: 100,  name: 'Học trò',   emoji: '📘' },
  { min: 300,  name: 'Thông hiểu', emoji: '🔍' },
  { min: 700,  name: 'Cao thủ',   emoji: '🥋' },
  { min: 1500, name: 'Tông sư',   emoji: '🐉' },
];

export const BADGES = {
  'first-game': { label: 'Bước đầu',   emoji: '🎯', desc: 'Hoàn thành ván đầu tiên' },
  'perfect':    { label: 'Hoàn hảo',   emoji: '💯', desc: 'Đúng tất cả câu trong một ván' },
  'daily':      { label: 'Siêng năng', emoji: '📅', desc: 'Hoàn thành Thử thách hằng ngày' },
  'veteran':    { label: 'Lão luyện',  emoji: '🏅', desc: 'Trả lời đúng 100 câu' },
};

export const XP_PER_CORRECT = 10;
export const XP_DAILY_BONUS = 20;
export const XP_PERFECT_BONUS = 10;

export function emptyProgress() {
  return { xp: 0, played: 0, correct: 0, answered: 0, badges: [], daily: {} };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return emptyProgress();
}

export function saveProgress(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function rankFor(xp) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (xp >= r.min) idx = i; });
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { ...cur, next, pct };
}

/**
 * @param {object} p tiến trình hiện tại
 * @param {{results:boolean[], daily?:boolean, date:string}} r kết quả một ván
 * @returns {{progress:object, gainedXp:number, newBadges:string[]}}
 */
export function applyResult(p, { results, daily = false, date }) {
  const correct = results.filter(Boolean).length;
  const total = results.length;
  let gained = correct * XP_PER_CORRECT;
  const perfect = total > 0 && correct === total;
  if (perfect) gained += XP_PERFECT_BONUS;

  const next = {
    ...p,
    played: p.played + 1,
    correct: p.correct + correct,
    answered: p.answered + total,
    daily: { ...p.daily },
  };

  // Thử thách hằng ngày: chỉ tính XP/lưu điểm lần đầu trong ngày
  const firstDaily = daily && !p.daily[date];
  if (daily) {
    if (firstDaily) {
      gained += XP_DAILY_BONUS;
      next.daily[date] = { score: correct, total, results };
    } else {
      gained = 0; // chơi lại đề cũ không cộng XP
    }
  }
  next.xp = p.xp + gained;

  const earned = new Set(p.badges);
  const newBadges = [];
  const give = (id) => { if (!earned.has(id)) { earned.add(id); newBadges.push(id); } };
  give('first-game');
  if (perfect) give('perfect');
  if (daily) give('daily');
  if (next.correct >= 100) give('veteran');
  next.badges = [...earned];

  return { progress: next, gainedXp: gained, newBadges };
}

export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
