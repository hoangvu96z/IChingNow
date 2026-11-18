/**
 * Xây dựng dữ liệu ghi chú chuẩn cho SaveToNoteNowButton từ kết quả quẻ Kinh Dịch.
 */
import { inferTopicFromQuestion } from '../data/lucHaoRules.js';
import { analyzeLucHao } from '../logic/lucHaoAnalysis.js';
import { VERIFICATION_META } from '../logic/verification.js';

export function buildIChingNoteNowPayload(result) {
  if (!result) return null;

  const lh = result.method === 'mai-hoa' ? result.lucHaoResult : result;
  const primaryName = result.primaryHexagram?.nameVi || lh?.primaryHexagram?.nameVi || 'Quẻ Kinh Dịch';
  const changedName = result.changedHexagram?.nameVi || lh?.changedHexagram?.nameVi || '';
  const hexPairLabel = changedName ? `${primaryName} ➔ ${changedName}` : primaryName;
  const question = result.question || 'Quẻ Kinh Dịch & Nghiệm Lý';

  const summaryLines = [`Quẻ lập: ${hexPairLabel}`];

  if (lh?.canChi?.ngay && lh?.canChi?.thang) {
    summaryLines.push(
      `Thời điểm: Ngày ${lh.canChi.ngay}, Tháng ${lh.canChi.thang}${
        lh.khongVong?.length ? ` (Tuần Không: ${lh.khongVong.join(', ')})` : ''
      }`
    );
  }

  const ver = result.verification || lh?.verification;
  if (ver && typeof ver === 'object') {
    const rawStatus = String(ver.status || '').trim();
    const hasStatus = rawStatus.length > 0 && rawStatus !== 'pending';
    const hasDate = Boolean(ver.actualDate && String(ver.actualDate).trim());
    const hasNote = Boolean(ver.note && String(ver.note).trim());

    if (hasStatus || hasDate || hasNote) {
      let statusLabel = 'Chờ ứng nghiệm';
      if (rawStatus === 'accurate') statusLabel = 'Ứng nghiệm chuẩn';
      else if (rawStatus === 'partial') statusLabel = 'Ứng một phần';
      else if (rawStatus === 'different' || rawStatus === 'inaccurate') statusLabel = 'Khác dự đoán';
      else if (VERIFICATION_META[rawStatus]?.labelVi) {
        statusLabel = VERIFICATION_META[rawStatus].labelVi.replace(/^[^\p{L}\p{N}]+/u, '').trim();
      }

      summaryLines.push(`Nghiệm lý: ${statusLabel}`);
      if (hasDate) {
        summaryLines.push(`Ngày ứng nghiệm thực tế: ${String(ver.actualDate).trim()}`);
      }
      if (hasNote) {
        summaryLines.push(`Ghi chú nghiệm lý: ${String(ver.note).trim()}`);
      }
    }
  }

  const checklistItems = [];
  if (lh?.lines?.length === 6) {
    const topicKey = result.topic || inferTopicFromQuestion(result.question || '');
    const v2 = analyzeLucHao(lh, topicKey);
    if (v2) {
      summaryLines.push(
        `Chẩn đoán Lục Hào v2 (${v2.topicLabel}): Dụng Thần ${v2.dungThanName} · Điểm ${v2.score} · ${v2.verdictLabel}`
      );
      if (v2.advice) {
        summaryLines.push(`Lời khuyên cốt lõi: ${v2.advice}`);
      }
      if (v2.ungKy?.primaryRuleVi) {
        summaryLines.push(`Pháp quyết Ứng Kỳ: ${v2.ungKy.primaryRuleVi}`);
      }
      const dates = v2.ungKy?.candidateDates || [];
      if (dates.length > 0) {
        summaryLines.push(
          `Mốc Ứng Kỳ dự kiến: ${dates
            .slice(0, 3)
            .map((d) => `${d.displayDate} (${d.canChiDay})`)
            .join(', ')}`
        );
        dates.slice(0, 2).forEach((d) => {
          checklistItems.push(
            `Theo dõi & nghiệm lý vào ngày ${d.displayDate} (${d.weekdayVi}, ${d.canChiDay}) — ${d.matchReasonVi}`
          );
        });
      }
    }
  }

  const hexAdvice =
    result.primaryHexagram?.description?.advice ||
    result.primaryHexagram?.description?.cong_viec ||
    result.primaryHexagram?.description?.tong_quat;
  if (hexAdvice) {
    checklistItems.push(`Ứng xử theo tượng quẻ: ${hexAdvice}`);
  }
  checklistItems.push('Đối chiếu kết quả thực tế và cập nhật trạng thái Nghiệm Lý trên IChingNow');

  return {
    title: `☯ ${hexPairLabel} — ${question}`.slice(0, 180),
    sourceAppLabel: 'IChingNow',
    question,
    summaryLines,
    checklistItems,
    bgColor: 'amber',
    tags: [
      'iching',
      result.method === 'mai-hoa' ? 'mai-hoa' : 'luc-hao',
      'nghiem-ly',
    ],
  };
}
