/**
 * Phân tích Lục Hào có giải thích từng bước (phục vụ chế độ Học).
 * Hàm thuần: analyzeLucHao(result, topic) → { topic, dungThan, steps[], score, verdict }
 * Mỗi step: { id, title, finding, why, refs[], glossary[] }
 */
import { WU_XING, BRANCH_BY_NAME } from '../data/lucYao.js';
import { TOPICS, LUC_XUNG, TIEN_THAN, SCORE, VERDICT } from '../data/lucHaoRules.js';

const elementOf = (chi) => BRANCH_BY_NAME[chi]?.element || null;

/** Quan hệ của `other` đối với hào có hành `hao` */
export function relation(hao, other) {
  if (!hao || !other) return null;
  if (hao === other) return 'same';
  if (WU_XING[other]?.generates === hao) return 'sinhHao';
  if (WU_XING[hao]?.generates === other) return 'haoSinh';
  if (WU_XING[hao]?.overcomes === other) return 'haoKhac';
  if (WU_XING[other]?.overcomes === hao) return 'khacHao';
  return null;
}

const REL_TEXT = {
  same: 'cùng hành (trợ giúp)',
  sinhHao: 'sinh cho hào',
  haoSinh: 'bị hào sinh đi (hào bị tiết)',
  haoKhac: 'bị hào khắc (hào hao sức)',
  khacHao: 'khắc hào',
};

function scoreStrength(line, monthChi, dayChi) {
  const el = elementOf(line.chi);
  let score = 0;
  const notes = [];

  const m = relation(el, elementOf(monthChi));
  if (line.chi === monthChi) { score += SCORE.month.same; notes.push(`Nguyệt kiến ${monthChi} trùng chi hào: vượng`); }
  else if (m) { score += SCORE.month[m]; notes.push(`Tháng ${monthChi} ${REL_TEXT[m]}`); }
  if (LUC_XUNG[line.chi] === monthChi) { score += SCORE.nguyetPha; notes.push(`Nguyệt Phá (tháng ${monthChi} xung ${line.chi})`); }

  const d = relation(el, elementOf(dayChi));
  if (line.chi === dayChi) { score += SCORE.day.same; notes.push(`Nhật thần ${dayChi} trùng chi hào`); }
  else if (d) { score += SCORE.day[d]; notes.push(`Ngày ${dayChi} ${REL_TEXT[d]}`); }
  if (LUC_XUNG[line.chi] === dayChi) { score += SCORE.nhatXung; notes.push(`Nhật xung (ngày ${dayChi} xung ${line.chi})`); }

  return { score, notes };
}

function pickDungThan(result, dungThan) {
  const lines = result.lines || [];
  if (dungThan === 'Thế') {
    const l = lines.find((x) => x.isThe);
    return { kind: 'the', candidates: l ? [l] : [] };
  }
  const candidates = lines.filter((l) => l.lucThan === dungThan);
  if (candidates.length) return { kind: 'present', candidates };

  const hidden = Object.entries(result.phucThanMap || {}).find(([, p]) => p.lucThan === dungThan);
  if (hidden) {
    const idx = Number(hidden[0]);
    const fly = lines.find((l) => l.index === idx);
    const p = hidden[1];
    return {
      kind: 'hidden',
      candidates: [{ ...p, index: idx, chi: p.chi, lucThan: p.lucThan, isHidden: true, flyChi: fly?.chi }],
    };
  }
  return { kind: 'missing', candidates: [] };
}

function chooseBest(candidates, monthChi, dayChi) {
  return candidates
    .map((l) => ({ line: l, ...scoreStrength(l, monthChi, dayChi) }))
    .sort((a, b) => (b.line.moving ? 1 : 0) - (a.line.moving ? 1 : 0) || b.score - a.score)[0];
}

export function analyzeLucHao(result, topicKey = 'general') {
  if (!result?.lines || result.lines.length < 6) return null;
  const topic = TOPICS[topicKey] || TOPICS.general;
  const monthChi = result.canChi?.thangChi;
  const dayChi = result.ngayChi;
  const steps = [];

  // 1. Dụng Thần
  const pick = pickDungThan(result, topic.dungThan);
  const picked = pick.candidates.length ? chooseBest(pick.candidates, monthChi, dayChi) : null;
  const dungLine = picked?.line || null;

  let f1;
  if (pick.kind === 'the') f1 = `Hỏi việc chung/bản thân nên lấy hào Thế (hào ${dungLine?.index}, ${dungLine?.chi}) làm Dụng Thần.`;
  else if (pick.kind === 'present') {
    f1 = `Dụng Thần là ${topic.dungThan}. Quẻ có ${pick.candidates.length} hào ${topic.dungThan}`
      + (pick.candidates.length > 1 ? `; chọn hào ${dungLine.index} (${dungLine.chi}) vì ${dungLine.moving ? 'đang động' : 'mạnh nhất'}.` : `: hào ${dungLine.index} (${dungLine.chi}).`);
  } else if (pick.kind === 'hidden') f1 = `Dụng Thần ${topic.dungThan} không lộ trong quẻ, đang phục dưới hào ${dungLine.index} (Phục Thần ${dungLine.chi}).`;
  else f1 = `Quẻ không có ${topic.dungThan} cả lộ lẫn phục: việc khó có kết quả rõ ràng.`;
  steps.push({
    id: 'dung-than', title: 'Chọn Dụng Thần', finding: f1,
    why: `Chủ đề "${topic.label}" dùng ${topic.dungThan} làm đại diện. Mọi phân tích sau xoay quanh hào này.`,
    refs: dungLine ? [dungLine.index] : [], glossary: [topic.dungThan === 'Thế' ? 'the' : topic.dungThan, ...(pick.kind === 'hidden' ? ['phucThan'] : [])],
  });

  // 2. Nguyệt kiến + Nhật thần
  steps.push({
    id: 'thoi-gian', title: 'Xem Nguyệt kiến và Nhật thần',
    finding: `Tháng ${monthChi || '?'}, ngày ${result.ngayCan} ${dayChi} (Tuần Không: ${(result.khongVong || []).join(', ') || 'không có'}).`,
    why: 'Tháng và ngày hỏi là "bối cảnh" quyết định các hào mạnh hay yếu.',
    refs: [], glossary: ['nguyetKien', 'nhatThan'],
  });

  let total = 0;
  if (!dungLine) {
    steps.push({ id: 'vuong-suy', title: 'Vượng / Suy của Dụng Thần', finding: 'Không có Dụng Thần để chấm.', why: '', refs: [], glossary: [] });
    total -= 3;
  } else {
    // 3. Vượng/Suy
    total += picked.score;
    steps.push({
      id: 'vuong-suy', title: 'Vượng / Suy của Dụng Thần',
      finding: picked.notes.length ? picked.notes.join('; ') + `. Điểm: ${picked.score}.` : 'Không có tác động đặc biệt từ tháng và ngày.',
      why: 'Dụng Thần được tháng, ngày sinh hoặc trợ thì vượng; bị khắc, xung thì suy.',
      refs: [dungLine.index], glossary: ['nguyetKien', 'nhatThan'],
    });

    // 4. Động / Tĩnh
    const notes4 = []; const gl4 = ['moving'];
    if (dungLine.moving && result.changedLines) {
      const ch = result.changedLines.find((l) => l.index === dungLine.index);
      const r = relation(elementOf(dungLine.chi), elementOf(ch?.chi));
      if (r === 'sinhHao') { total += SCORE.hoiDauSinh; notes4.push(`Hồi Đầu Sinh: ${dungLine.chi} biến ${ch.chi}.`); gl4.push('hoiDauSinh'); }
      else if (r === 'khacHao') { total += SCORE.hoiDauKhac; notes4.push(`Hồi Đầu Khắc: ${dungLine.chi} biến ${ch.chi}.`); gl4.push('hoiDauKhac'); }
      if (TIEN_THAN[dungLine.chi] === ch?.chi) { total += SCORE.hoaTien; notes4.push('Hóa Tiến Thần.'); gl4.push('hoaTien'); }
      else if (TIEN_THAN[ch?.chi] === dungLine.chi) { total += SCORE.hoaThoai; notes4.push('Hóa Thoái Thần.'); gl4.push('hoaThoai'); }
    } else if (dungLine.moving) notes4.push('Dụng Thần đang động.');
    // Hào động khác tác động lên Dụng Thần
    const dEl = elementOf(dungLine.chi);
    for (const l of result.lines.filter((x) => x.moving && x.index !== dungLine.index)) {
      const r = relation(dEl, elementOf(l.chi));
      if (r === 'sinhHao') { total += 1; notes4.push(`Hào ${l.index} (${l.chi}) động sinh Dụng Thần.`); }
      else if (r === 'khacHao') { total -= 2; notes4.push(`Hào ${l.index} (${l.chi}) động khắc Dụng Thần.`); }
    }
    if (!notes4.length) notes4.push(result.movingLines?.length ? 'Hào động không tác động trực tiếp lên Dụng Thần.' : 'Quẻ tĩnh (không hào động): xem chủ yếu Nhật/Nguyệt.');
    steps.push({
      id: 'dong-tinh', title: 'Hào động và biến hóa', finding: notes4.join(' '),
      why: 'Hào động là nơi sự việc chuyển biến; hào sinh Dụng Thần là trợ lực, hào khắc là cản trở.',
      refs: [dungLine.index, ...(result.movingLines || [])], glossary: gl4,
    });

    // 5. Tuần Không
    const isKV = !!dungLine.isKhongVong || (result.khongVong || []).includes(dungLine.chi);
    if (isKV) total += SCORE.khongVong;
    steps.push({
      id: 'tuan-khong', title: 'Tuần Không',
      finding: isKV ? `Dụng Thần ${dungLine.chi} rơi vào Tuần Không${dungLine.moving ? ' nhưng đang động (vẫn có lực)' : ''}.` : 'Dụng Thần không rơi vào Tuần Không.',
      why: 'Hào gặp Không như bị "rỗng", việc chưa thực tế hoặc hư danh.',
      refs: [dungLine.index], glossary: ['khongVong'],
    });
  }

  // 6. Kết luận
  const verdict = total >= VERDICT.cat ? 'cat' : total <= VERDICT.hung ? 'hung' : 'binh';
  const label = { cat: 'Cát (thuận lợi)', binh: 'Bình (tùy diễn biến)', hung: 'Hung (nhiều trở ngại)' }[verdict];
  steps.push({
    id: 'ket-luan', title: 'Kết luận sơ bộ',
    finding: `Tổng điểm ${total}: ${label}.`,
    why: 'Đây là cách tính tham khảo để học; thầy xem quẻ còn xét thêm Thế/Ứng, Lục Thú, bối cảnh.',
    refs: dungLine ? [dungLine.index] : [], glossary: [],
  });

  return { topic: topicKey, dungThan: topic.dungThan, dungLineIndex: dungLine?.index ?? null, steps, score: total, verdict };
}
