/**
 * Bộ xây dựng ngữ cảnh Lục Hào Tăng San Bốc Dịch v2 & Ứng Kỳ cho AI Prompt.
 */
import { inferTopicFromQuestion } from '../data/lucHaoRules.js';
import { analyzeLucHao } from '../logic/lucHaoAnalysis.js';

/**
 * Sinh danh sách bullet cô đọng chuẩn cổ pháp Tăng San Bốc Dịch + Dự báo Ứng Kỳ
 * để nhúng vào prompt AI luận giải quẻ.
 *
 * @param {Object} result - Kết quả quẻ hiện tại (Lục Hào hoặc Mai Hoa có lucHaoResult)
 * @param {boolean} [isEn=false]
 * @returns {string[]}
 */
export function buildLucHaoPromptBullets(result, isEn = false) {
  if (!result) return [];
  const lh = result.method === 'mai-hoa' ? result.lucHaoResult : result;
  const bullets = [];

  if (lh?.canChi?.tietKhi) {
    bullets.push(
      isEn
        ? `Solar Term (Tiết khí): ${lh.canChi.tietKhiEn || lh.canChi.tietKhi}`
        : `Tiết khí: ${lh.canChi.tietKhi}`
    );
  }
  if (lh?.canChi?.nhatThan && lh.canChi.nhatThan !== '?') {
    bullets.push(
      isEn
        ? `Day Branch (Nhật thần): ${lh.canChi.nhatThan} | Month Branch (Nguyệt lệnh): ${lh.canChi.nguyetLenh}`
        : `Nhật thần: ${lh.canChi.nhatThan} | Nguyệt lệnh: ${lh.canChi.nguyetLenh}`
    );
  }
  if (lh?.theHao) {
    bullets.push(isEn ? `Subject Line (Hào Thế): Line ${lh.theHao}` : `Hào Thế: Hào ${lh.theHao}`);
  }
  if (lh?.ungHao) {
    bullets.push(isEn ? `Object Line (Hào Ứng): Line ${lh.ungHao}` : `Hào Ứng: Hào ${lh.ungHao}`);
  }
  if (lh?.khongVong?.length > 0) {
    bullets.push(
      isEn
        ? `Void/Empty Branches (Tuần Không): ${lh.khongVong.join(', ')}`
        : `Tuần Không: ${lh.khongVong.join(', ')}`
    );
  }
  if (lh?.primaryTrait?.code) {
    bullets.push(
      isEn
        ? `Primary Hexagram Trait: ${lh.primaryTrait.labelEn}`
        : `Đặc tính Quẻ Chủ: ${lh.primaryTrait.labelVi}`
    );
  }
  if (lh?.changedTrait?.code) {
    bullets.push(
      isEn
        ? `Changed Hexagram Trait: ${lh.changedTrait.labelEn}`
        : `Đặc tính Quẻ Biến: ${lh.changedTrait.labelVi}`
    );
  }
  if (lh?.quaiThanChi) {
    bullets.push(
      isEn
        ? `Hexagram Body (Quái Thân): ${lh.quaiThanChi}${lh.changedQuaiThanChi ? ` (Changed: ${lh.changedQuaiThanChi})` : ''}`
        : `Quái Thân: ${lh.quaiThanChi}${lh.changedQuaiThanChi ? ` (Quẻ biến: ${lh.changedQuaiThanChi})` : ''}`
    );
  }
  if (lh?.locChi || lh?.maChi || lh?.daoHoaChi) {
    bullets.push(
      isEn
        ? `Day Symbolic Stars: Lộc=${lh.locChi || '-'}, Dịch Mã=${lh.maChi || '-'}, Đào Hoa=${lh.daoHoaChi || '-'}`
        : `Thần sát theo ngày: Lộc tại ${lh.locChi || '-'}, Dịch Mã tại ${lh.maChi || '-'}, Đào Hoa tại ${lh.daoHoaChi || '-'}`
    );
  }
  if (result.dungThan) {
    bullets.push(isEn ? `Selected Useful God: ${result.dungThan}` : `Dụng Thần chọn sẵn: ${result.dungThan}`);
  }

  // Bổ sung chẩn đoán thực chiến Tăng San Bốc Dịch v2 & Ứng Kỳ nếu có đủ 6 hào Lục Hào
  if (lh?.lines?.length === 6) {
    const inferredTopic = result.topic || inferTopicFromQuestion(result.question || '');
    const v2 = analyzeLucHao(lh, inferredTopic);
    if (v2) {
      const adv = v2.advancedDiagnostics || {};
      const dt = v2.primaryDT;
      bullets.push(
        isEn
          ? `Tăng San Bốc Dịch v2 Assessment (${v2.topicLabel}): Useful God = ${v2.dungThanName}${dt ? ` at Line ${dt.index} (${dt.chi}-${dt.element}, ${dt.vuongSuy})` : ''}, Score = ${v2.score}, Verdict = ${v2.verdictLabel}`
          : `Chẩn đoán Tăng San Bốc Dịch v2 (${v2.topicLabel}): Dụng Thần = ${v2.dungThanName}${dt ? ` tại Hào ${dt.index} (${dt.chi}-${dt.element}, mùa ${dt.vuongSuy})` : ''}, Điểm = ${v2.score} (${v2.verdictLabel})`
      );

      if (adv.amDongLines?.length) {
        bullets.push(
          `Ám Động: ${adv.amDongLines.map((l) => `Hào ${l.index} (${l.lucThan} ${l.chi})`).join(', ')}`
        );
      }
      if (adv.nhatPhaLines?.length) {
        bullets.push(
          `Nhật Phá / Xung Tán: ${adv.nhatPhaLines.map((l) => `Hào ${l.index} (${l.lucThan} ${l.chi})`).join(', ')}`
        );
      }
      if (adv.chainSummary?.isThamSinhVongKhac || adv.chainSummary?.isCuuThanChain) {
        bullets.push(`Liên hoàn sinh khắc: ${adv.chainSummary.summaryVi}`);
      }
      if (adv.tamHopCucs?.length) {
        bullets.push(`Tam Hợp Cục: ${adv.tamHopCucs.map((c) => c.summaryVi).join(' | ')}`);
      }
      if (adv.hopTruLines?.length) {
        bullets.push(`Hợp Trụ: ${adv.hopTruLines.map((h) => h.summaryVi).join(' | ')}`);
      }
      if (adv.moDiagnostics?.items?.length) {
        bullets.push(`Mộ / Tuyệt: ${adv.moDiagnostics.items.join('; ')}`);
      }
      if (adv.phucPhiDetail?.summaryVi) {
        bullets.push(`Phi – Phục: ${adv.phucPhiDetail.summaryVi}`);
      }
      if (adv.theUngRelation?.summaryVi) {
        bullets.push(`Thế – Ứng: ${adv.theUngRelation.summaryVi}`);
      }
      if (v2.ungKy?.primaryRuleVi) {
        const dateStr = (v2.ungKy.candidateDates || [])
          .slice(0, 4)
          .map((d) => `${d.displayDate} (${d.canChiDay} - ${isEn ? d.matchReasonEn : d.matchReasonVi})`)
          .join('; ');
        bullets.push(
          isEn
            ? `Ứng Kỳ Timing (${v2.ungKy.primaryRuleEn}): ${dateStr || 'See target branches ' + (v2.ungKy.targetBranches || []).join(', ')}`
            : `Dự báo Ứng Kỳ (${v2.ungKy.primaryRuleVi}): ${dateStr || 'Các chi ứng: ' + (v2.ungKy.targetBranches || []).join(', ')}`
        );
      }
    }
  }

  return bullets;
}

export function buildLucHaoPromptContext(result, isEn = false) {
  const bullets = buildLucHaoPromptBullets(result, isEn);
  return bullets.length > 0 ? `\n- ${bullets.join('\n- ')}` : '';
}

export function buildIChingAiPrompt(result, plainText, language = 'vi') {
  if (!result) return '';
  const isEn = language === 'en';
  const extraContext = buildLucHaoPromptContext(result, isEn);
  const question = result.question?.trim() || (isEn ? '(General guidance)' : '(Hỏi tổng quan)');

  if (isEn) {
    return [
      'You are an experienced I Ching & Liu Yao (Six Lines / Zeng Shan Bu Yi) master.',
      `Question: "${question}"`,
      extraContext ? `Engine Diagnostics & Context:${extraContext}` : '',
      `\nFull Hexagram Data:\n${plainText}`,
      '\nPlease analyze the Useful God (Dung Than), Month/Day influences, moving lines, Tomb/Clash/Void states, Timing (Ung Ky), and give clear, practical action advice.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    'Bạn là bậc thầy Kinh Dịch & Lục Hào (Tăng San Bốc Dịch). Hãy luận giải sâu sắc, khách quan và thực tế quẻ dưới đây:',
    `Việc cần xem: "${question}"`,
    extraContext ? `Tóm tắt dữ kiện Dụng Thần & Ứng Kỳ:${extraContext}` : '',
    `\nDữ liệu quẻ chi tiết:\n${plainText}`,
    '\nYêu cầu luận giải:\n1. Phân tích Dụng Thần, Nhật Thần/Nguyệt Lệnh (vượng/suy) và Thế – Ứng.\n2. Luận hào động, biến, Mộ/Tuyệt/Tuần Không (nếu có) và dự báo Ứng Kỳ.\n3. Kết luận rõ Cát/Hung và đưa ra lời khuyên hành động cụ thể.',
  ]
    .filter(Boolean)
    .join('\n');
}
