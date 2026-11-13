/**
 * Bộ tính Ứng Kỳ tự động (Automated Timing of Manifestation Calculator)
 * Dựa trên pháp quyết Tăng San Bốc Dịch (Dã Hạc Lão Nhân):
 *   1. Dụng Thần Tuần Không → Xuất Không / Điền Thực / Xung Không
 *   2. Dụng Thần Hợp Trụ (hoặc Tĩnh phùng Hợp) → Xung Hợp
 *   3. Dụng Thần Nhập Mộ (Nhật Mộ / Động Mộ / Hóa Mộ) → Xung Mộ / Xung Dụng Thần
 *   4. Dụng Thần Phục Tàng → Trị Nhật (xuất lộ) / Xung Phi Thần
 *   5. Dụng Thần Vượng Tĩnh → Xung Động / Trị Nhật
 *   6. Dụng Thần Động → Hợp Nhật / Trị Nhật / Lâm Chi biến
 *   7. Dụng Thần Suy Nhược → Sinh Phù (Nguyên Thần) / Đế Vượng – Trường Sinh
 */

import { EARTHLY_BRANCHES, WU_XING, getTruongSinhStage } from '../data/lucYao.js';
import { LUC_XUNG, LUC_HOP, TOMB_BY_ELEMENT, VERDICT } from '../data/lucHaoRules.js';
import { getCanChiFromDate } from './solarLunar.js';

const WEEKDAYS_VI = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

function parseStartUtcDate(startDateInput, hexData) {
  let raw = startDateInput;
  if (!raw) {
    if (hexData?.castDate && /^\d{4}-\d{2}-\d{2}$/.test(hexData.castDate)) {
      raw = hexData.castDate;
    } else if (typeof hexData?.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(hexData.createdAt)) {
      raw = hexData.createdAt.slice(0, 10);
    }
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return new Date(Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate()));
  }

  if (typeof raw === 'string') {
    const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    }
  }

  const now = new Date();
  const vnNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 7 * 3600000);
  return new Date(Date.UTC(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate()));
}

function formatUtcDateParts(utcDate) {
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  const dow = utcDate.getUTCDay();
  return {
    isoDate: `${y}-${m}-${d}`,
    displayDate: `${d}/${m}/${y}`,
    weekdayVi: WEEKDAYS_VI[dow],
    weekdayEn: WEEKDAYS_EN[dow],
  };
}

function findStageBranch(element, stageName) {
  if (!element) return null;
  const found = EARTHLY_BRANCHES.find(
    (b) => getTruongSinhStage(element, b.name)?.name === stageName
  );
  return found?.name || null;
}

/**
 * Suy luận Ứng Kỳ và quét lịch Vạn Niên (Can Chi) để tìm các ngày Dương lịch cụ thể sắp tới.
 *
 * @param {Object} hexData - Kết quả quẻ Lục Hào (từ buildLucHaoResult)
 * @param {Object} analysis - Kết quả phân tích (từ analyzeLucHao)
 * @param {{ startDate?: string|Date, scanDays?: number, maxCandidates?: number }} [options]
 */
export function computeUngKy(hexData, analysis, options = {}) {
  const { startDate, scanDays = 60, maxCandidates = 6 } = options;
  const safeScanDays = Math.max(1, Math.min(366, Number(scanDays) || 60));

  const dt = analysis?.primaryDT || null;
  const adv = analysis?.advancedDiagnostics || {};
  const score = Number(analysis?.score ?? 0);
  const verdict = analysis?.verdict || 'binh';
  const isUnfavorableWarning = verdict === 'hung' || score <= VERDICT.hung;

  const cautionVi = isUnfavorableWarning
    ? '⚠️ Lưu ý cát hung: Quẻ đang nghiêng về thế Hung / bất lợi — các mốc Ứng Kỳ dưới đây báo hiệu thời điểm dễ phát sinh trở ngại, hao tổn hoặc biến cố cần đặc biệt phòng bị, KHÔNG phải ngày thành tựu!'
    : '';
  const cautionEn = isUnfavorableWarning
    ? '⚠️ Caution: Because this reading carries an unfavorable verdict, these Ứng Kỳ dates mark windows of heightened risk or setback to guard against rather than dates of success.'
    : '';

  if (!dt || !dt.chi) {
    return {
      ruleCode: 'missing-dt',
      primaryRuleVi: 'Dụng Thần khuyết vắng — Chờ ngày/tháng lâm hành Dụng Thần',
      primaryRuleEn: 'Useful God Absent — Await Branch Matching Useful God Element',
      reasoningVi: 'Quẻ thiếu Dụng Thần rõ rệt nên sự việc chưa thành hình; cần đợi tiết khí hoặc ngày mang Ngũ Hành của Dụng Thần để nhen nhóm cơ hội.',
      reasoningEn: 'Useful God is absent; await a day or solar term carrying its Five-Element energy.',
      targetBranches: [],
      candidateDates: [],
      isUnfavorableWarning,
      cautionVi,
      cautionEn,
    };
  }

  const dtChi = dt.chi;
  const dtElement = dt.element;
  const xungDtChi = LUC_XUNG[dtChi];
  const hopDtChi = LUC_HOP[dtChi];
  const tombChi = dt.tombChi || TOMB_BY_ELEMENT[dtElement];
  const xungTombChi = tombChi ? LUC_XUNG[tombChi] : null;

  let ruleCode = 'vuong-tinh';
  let primaryRuleVi = '';
  let primaryRuleEn = '';
  let reasoningVi = '';
  let reasoningEn = '';
  let targetBranches = [];
  // Map branch → evaluator(dayCanChi, offset) => { priority, matchReasonVi, matchReasonEn } | null
  let matchEvaluator = null;

  // ── 1. Dụng Thần Tuần Không ──────────────────────────────────────────────
  if (dt.isTuanKhong) {
    ruleCode = 'tuan-khong';
    primaryRuleVi = 'Tuần Không đãi Xuất / Xung Không';
    primaryRuleEn = 'Void Useful God — Resolves on Exiting Void or Clash';
    reasoningVi = `Dụng Thần ${dt.lucThan} (${dtChi}) đang lâm Tuần Không. Theo Tăng San Bốc Dịch, hào Không phải đợi ngày Xuất Không Điền Thực (ngày ${dtChi} sau khi sang tuần Giáp mới) hoặc ngày Xung Không (${xungDtChi} xung ${dtChi}) mới thực lực ứng nghiệm.`;
    reasoningEn = `Useful God (${dtChi}) sits in Void (Tuần Không); manifestation occurs upon leaving the current 10-day cycle on ${dtChi} (Fill Void) or ${xungDtChi} (Clash Void).`;
    targetBranches = uniq([dtChi, xungDtChi]);
    matchEvaluator = (cc) => {
      const stillVoid = (cc.khongVong || []).includes(dtChi);
      if (cc.ngayChi === dtChi) {
        return {
          priority: stillVoid ? 2 : 1,
          matchReasonVi: stillVoid
            ? `Điền Thực (${dtChi} trùng chi Dụng Thần)`
            : `Xuất Không Điền Thực (đã ra khỏi Tuần Không, lâm chi ${dtChi})`,
          matchReasonEn: stillVoid ? `Direct branch ${dtChi}` : `Exited Void & filled on ${dtChi}`,
        };
      }
      if (cc.ngayChi === xungDtChi) {
        return {
          priority: stillVoid ? (dt.isMoving || dt.isAmDong ? 1 : 2) : 1,
          matchReasonVi: stillVoid
            ? `Xung Không tắc thực (ngày ${xungDtChi} xung kích ${dtChi} ngay trong tuần)`
            : `Xuất Không phùng Xung (đã ra khỏi Tuần Không, ${xungDtChi} xung ${dtChi})`,
          matchReasonEn: `Clash Void (${xungDtChi} clashes ${dtChi})`,
        };
      }
      return null;
    };
  }
  // ── 2. Dụng Thần Hợp Trụ (hoặc Tĩnh phùng Hợp bị trói) ───────────────────
  else if (dt.isHopTru || dt.isBoundByHop) {
    const partnerChi = dt.hopPartnerChi || hopDtChi;
    const xungPartner = partnerChi ? LUC_XUNG[partnerChi] : null;
    ruleCode = 'hop-tru';
    primaryRuleVi = 'Hợp Trụ đãi Xung (Xung mở mối hợp)';
    primaryRuleEn = 'Bound by Six-Harmony — Resolves on Clash Breaking Bond';
    reasoningVi = `Dụng Thần ${dt.lucThan} (${dtChi}) đang bị ${dt.hopSource || 'Nhật/Nguyệt'} (${partnerChi}) Lục Hợp trói buộc ("Động nhi phùng Hợp tắc trụ"). Phải chờ ngày Xung phá mối hợp (${xungDtChi}${xungPartner && xungPartner !== xungDtChi ? ` hoặc ${xungPartner}` : ''}) thì sự việc mới cởi trói mà thành.`;
    reasoningEn = `Useful God (${dtChi}) is bound by Six-Harmony with ${partnerChi}; resolves when clashed open on ${xungDtChi}${xungPartner ? ` or ${xungPartner}` : ''}.`;
    targetBranches = uniq([xungDtChi, xungPartner]);
    matchEvaluator = (cc) => {
      if (cc.ngayChi === xungDtChi) {
        return {
          priority: 1,
          matchReasonVi: `Xung Hợp giải trói (${xungDtChi} xung Dụng Thần ${dtChi})`,
          matchReasonEn: `Clash ${dtChi} to release bond`,
        };
      }
      if (xungPartner && cc.ngayChi === xungPartner) {
        return {
          priority: 1,
          matchReasonVi: `Xung tác nhân Hợp Trụ (${xungPartner} xung ${partnerChi}, mở trói cho ${dtChi})`,
          matchReasonEn: `Clash binding branch ${partnerChi}`,
        };
      }
      return null;
    };
  }
  // ── 3. Dụng Thần Nhập Mộ (Nhật Mộ / Hóa Mộ / Động Mộ) ───────────────────
  else if (dt.isNhapNhatMo || dt.isHoaMo || dt.isNhapDongMo) {
    ruleCode = 'nhap-mo';
    primaryRuleVi = 'Nhập Mộ đãi Xung (Xung khai Mộ khố)';
    primaryRuleEn = 'Entered Tomb — Resolves on Clashing Open the Tomb';
    reasoningVi = `Dụng Thần ${dt.lucThan} (${dtChi}-${dtElement}) đang rơi vào Mộ khố tại ${tombChi}. Pháp quyết Tăng San Bốc Dịch dạy: "Nhập Mộ tất đãi Xung khai" — gặp ngày ${xungTombChi} xung vỡ kho ${tombChi} (hoặc ngày ${xungDtChi} xung Dụng Thần) thì khí lực mới thoát ra.`;
    reasoningEn = `Useful God (${dtChi}-${dtElement}) is enclosed in its ${tombChi} Tomb; resolves on ${xungTombChi} clashing open the Tomb (or ${xungDtChi}).`;
    targetBranches = uniq([xungTombChi, xungDtChi, dtChi]);
    matchEvaluator = (cc) => {
      if (xungTombChi && cc.ngayChi === xungTombChi) {
        return {
          priority: 1,
          matchReasonVi: `Xung khai Mộ khố (${xungTombChi} xung mở mộ ${tombChi})`,
          matchReasonEn: `Clash open ${tombChi} Tomb`,
        };
      }
      if (cc.ngayChi === xungDtChi) {
        return {
          priority: 2,
          matchReasonVi: `Xung kích Dụng Thần (${xungDtChi} xung ${dtChi} thoát Mộ)`,
          matchReasonEn: `Clash Useful God ${dtChi}`,
        };
      }
      if (cc.ngayChi === dtChi) {
        return {
          priority: 2,
          matchReasonVi: `Trị Nhật xuất hiện (ngày ${dtChi} trùng chi Dụng Thần)`,
          matchReasonEn: `Direct branch day ${dtChi}`,
        };
      }
      return null;
    };
  }
  // ── 4. Dụng Thần Phục Tàng ───────────────────────────────────────────────
  else if (dt.isPhucThan || dt.isHidden) {
    const phiChi = dt.phiChi || dt.flyChi || adv?.phucPhiDetail?.phiChi || null;
    const xungPhiChi = phiChi ? LUC_XUNG[phiChi] : null;
    ruleCode = 'phuc-tang';
    primaryRuleVi = 'Phục Tàng đãi Xuất (Trị Nhật hoặc Xung Phi Thần)';
    primaryRuleEn = 'Hidden Spirit — Resolves on Direct Branch or Clashing Flying Spirit';
    reasoningVi = `Dụng Thần ${dt.lucThan} (${dtChi}) không hiện trên quẻ mà ẩn phục dưới Phi Thần${phiChi ? ` ${phiChi}` : ''}. Đợi ngày Trị Nhật (${dtChi} — Phục Thần lộ diện)${xungPhiChi ? ` hoặc ngày ${xungPhiChi} xung bay Phi Thần ${phiChi}` : ''} thì việc mới hiển lộ.`;
    reasoningEn = `Hidden Useful God (${dtChi}) emerges on its own branch day (${dtChi})${xungPhiChi ? ` or when ${xungPhiChi} clashes away Flying Spirit ${phiChi}` : ''}.`;
    targetBranches = uniq([dtChi, xungPhiChi, xungDtChi]);
    matchEvaluator = (cc) => {
      if (cc.ngayChi === dtChi) {
        return {
          priority: 1,
          matchReasonVi: `Trị Nhật lộ Phục (ngày ${dtChi} dẫn Phục Thần xuất hiện)`,
          matchReasonEn: `Hidden Spirit emerges on ${dtChi}`,
        };
      }
      if (xungPhiChi && cc.ngayChi === xungPhiChi) {
        return {
          priority: 1,
          matchReasonVi: `Xung Phi lộ Phục (${xungPhiChi} xung dẹp Phi Thần ${phiChi})`,
          matchReasonEn: `Clash Flying Spirit ${phiChi}`,
        };
      }
      if (cc.ngayChi === xungDtChi) {
        return {
          priority: 2,
          matchReasonVi: `Đề bạt / Xung Phục (${xungDtChi} kích hoạt Phục Thần ${dtChi})`,
          matchReasonEn: `Activate Hidden Spirit ${dtChi}`,
        };
      }
      return null;
    };
  }
  // ── 7. Dụng Thần Suy Nhược / Tổn Thương (Hưu Tù, Nhật Phá, Nguyệt Phá) ──
  else if (dt.isWeak || dt.isNhatPha || dt.isNguyetPha) {
    const nguyenThanEl = WU_XING[dtElement]?.generatedBy || null;
    const nguyenThanBranches = EARTHLY_BRANCHES.filter((b) => b.element === nguyenThanEl).map((b) => b.name);
    const deVuongChi = findStageBranch(dtElement, 'Đế Vượng');
    const truongSinhChi = findStageBranch(dtElement, 'Trường Sinh');

    ruleCode = 'suy-nhuoc';
    primaryRuleVi = 'Dụng Thần Suy Nhược — Đợi ngày Sinh Phù / Lâm Vượng';
    primaryRuleEn = 'Weak Useful God — Resolves on Generating or Prosperous Branch';
    reasoningVi = `Dụng Thần ${dt.lucThan} (${dtChi}-${dtElement}) hiện đang suy yếu (${dt.isNguyetPha ? 'Nguyệt Phá' : dt.isNhatPha ? 'Nhật Phá' : `mùa ${dt.vuongSuy || 'Hưu Tù'}`}). Phải chờ ngày được Nguyên Thần (${nguyenThanEl}: ${nguyenThanBranches.join(', ')}) sinh phù hoặc ngày lâm Đế Vượng / Trị Nhật (${uniq([dtChi, deVuongChi, truongSinhChi]).join(', ')}) tiếp sức.`;
    reasoningEn = `Useful God (${dtChi}-${dtElement}) is seasonally weak; awaits support on Generating (${nguyenThanBranches.join(', ')}) or Peak/Birth (${uniq([dtChi, deVuongChi, truongSinhChi]).join(', ')}) days.`;
    targetBranches = uniq([
      ...(dt.isNguyetPha || dt.isNhatPha ? [dtChi, hopDtChi] : [dtChi]),
      deVuongChi,
      truongSinhChi,
      ...nguyenThanBranches,
    ]);
    matchEvaluator = (cc) => {
      if ((dt.isNguyetPha || dt.isNhatPha) && cc.ngayChi === hopDtChi) {
        return {
          priority: 1,
          matchReasonVi: `Hợp Phá cứu hào (${hopDtChi} lục hợp hàn gắn ${dtChi} bị phá)`,
          matchReasonEn: `Six-Harmony heals broken ${dtChi}`,
        };
      }
      if (cc.ngayChi === dtChi) {
        return {
          priority: 1,
          matchReasonVi: `Điền Thực / Trị Nhật (${dtChi} trợ lực trực tiếp cho Dụng Thần)`,
          matchReasonEn: `Direct branch support on ${dtChi}`,
        };
      }
      if (deVuongChi && cc.ngayChi === deVuongChi) {
        return {
          priority: 1,
          matchReasonVi: `Đắc Đế Vượng (ngày ${deVuongChi} đưa hành ${dtElement} lên cực vượng)`,
          matchReasonEn: `Peak prosperity on ${deVuongChi}`,
        };
      }
      if (truongSinhChi && cc.ngayChi === truongSinhChi) {
        return {
          priority: 2,
          matchReasonVi: `Đắc Trường Sinh (ngày ${truongSinhChi} tiếp nguồn sinh khí cho ${dtElement})`,
          matchReasonEn: `Birth stage support on ${truongSinhChi}`,
        };
      }
      if (nguyenThanBranches.includes(cc.ngayChi)) {
        return {
          priority: 2,
          matchReasonVi: `Nguyên Thần sinh phù (${cc.ngayChi}-${nguyenThanEl} sinh trợ ${dtElement})`,
          matchReasonEn: `Generating element support (${cc.ngayChi})`,
        };
      }
      return null;
    };
  }
  // ── 6. Dụng Thần Động (hoặc Ám Động) ────────────────────────────────────
  else if (dt.isMoving || dt.isAmDong) {
    ruleCode = 'hao-dong';
    primaryRuleVi = dt.isAmDong
      ? 'Dụng Thần Ám Động — Ứng rất nhanh vào Trị Nhật hoặc Hợp Nhật'
      : 'Dụng Thần Động — Đợi Hợp Nhật, Trị Nhật hoặc Lâm Chi biến';
    primaryRuleEn = 'Moving Useful God — Resolves on Six-Harmony, Direct Branch, or Changed Branch';
    reasoningVi = dt.isAmDong
      ? `Dụng Thần ${dt.lucThan} (${dtChi}) đang Ám Động (khí vượng được Nhật xung kích phát), sự việc chuyển biến rất gấp: thường ứng ngay vào ngày Trị Nhật (${dtChi}) hoặc Hợp Nhật (${hopDtChi}).`
      : `Dụng Thần ${dt.lucThan} (${dtChi}) đang phát động hữu lực. Theo khẩu quyết "Động nhi phùng Hợp, phùng Trị": ứng nghiệm vào ngày Hợp (${hopDtChi}), ngày Trị Nhật (${dtChi})${dt.changedChi ? `, hoặc ngày lâm Chi biến (${dt.changedChi})` : ''}.`;
    reasoningEn = `Useful God (${dtChi}) is actively moving; resolves on Six-Harmony (${hopDtChi}), Direct Branch (${dtChi})${dt.changedChi ? `, or Changed Branch (${dt.changedChi})` : ''}.`;
    targetBranches = uniq([hopDtChi, dtChi, dt.changedChi]);
    matchEvaluator = (cc) => {
      if (hopDtChi && cc.ngayChi === hopDtChi) {
        return {
          priority: 1,
          matchReasonVi: `Động phùng Hợp (${hopDtChi} lục hợp kết tụ với hào động ${dtChi})`,
          matchReasonEn: `Six-Harmony completion (${hopDtChi})`,
        };
      }
      if (cc.ngayChi === dtChi) {
        return {
          priority: 1,
          matchReasonVi: `Trị Nhật (${dtChi} lâm ngày Dụng Thần phát động)`,
          matchReasonEn: `Direct branch day (${dtChi})`,
        };
      }
      if (dt.changedChi && cc.ngayChi === dt.changedChi) {
        return {
          priority: 2,
          matchReasonVi: `Lâm Chi biến (ứng vào hào biến ${dt.changedChi})`,
          matchReasonEn: `Changed branch day (${dt.changedChi})`,
        };
      }
      return null;
    };
  }
  // ── 5. Dụng Thần Vượng Tĩnh (khỏe, tĩnh, không bệnh) ─────────────────────
  else {
    ruleCode = 'vuong-tinh';
    primaryRuleVi = 'Dụng Thần Vượng Tĩnh — Đợi ngày Xung Động hoặc Trị Nhật';
    primaryRuleEn = 'Strong & Quiet Useful God — Resolves on Clash Activation or Direct Branch';
    reasoningVi = `Dụng Thần ${dt.lucThan} (${dtChi}-${dtElement}) có khí lực ổn định nhưng đang tĩnh. Theo khẩu quyết "Tĩnh nhi phùng Xung": gặp ngày ${xungDtChi} xung động hoặc ngày ${dtChi} Trị Nhật sẽ kích hoạt ứng nghiệm.`;
    reasoningEn = `Useful God (${dtChi}) is strong and quiet; resolves when clashed into motion on ${xungDtChi} or on its own branch day ${dtChi}.`;
    targetBranches = uniq([xungDtChi, dtChi]);
    matchEvaluator = (cc) => {
      if (cc.ngayChi === xungDtChi) {
        return {
          priority: 1,
          matchReasonVi: `Tĩnh phùng Xung (${xungDtChi} xung động hào tĩnh ${dtChi})`,
          matchReasonEn: `Clash activates quiet ${dtChi}`,
        };
      }
      if (cc.ngayChi === dtChi) {
        return {
          priority: 1,
          matchReasonVi: `Trị Nhật (ngày ${dtChi} lâm chi Dụng Thần)`,
          matchReasonEn: `Direct branch day ${dtChi}`,
        };
      }
      return null;
    };
  }

  // ── Quét lịch Dương lịch → Can Chi trong scanDays ngày tới ──────────────
  const baseUtc = parseStartUtcDate(startDate, hexData);
  const rawMatches = [];

  for (let offset = 1; offset <= safeScanDays; offset += 1) {
    const d = new Date(baseUtc.getTime() + offset * 86400000);
    const { isoDate, displayDate, weekdayVi, weekdayEn } = formatUtcDateParts(d);
    const cc = getCanChiFromDate(isoDate, '12:00');
    if (!cc?.ngayChi) continue;

    const evalRes = matchEvaluator ? matchEvaluator(cc, offset) : null;
    if (!evalRes) continue;

    rawMatches.push({
      isoDate,
      displayDate,
      weekdayVi,
      weekdayEn,
      canChiDay: `${cc.ngayCan} ${cc.ngayChi}`,
      monthChi: cc.thangChi || '',
      branch: cc.ngayChi,
      daysAhead: offset,
      priority: evalRes.priority,
      matchReasonVi: evalRes.matchReasonVi,
      matchReasonEn: evalRes.matchReasonEn,
    });
  }

  // Ưu tiên các mốc priority 1 trước (đặc biệt cho Xuất Không / Xung Mộ / Xung Hợp),
  // trong cùng priority giữ thứ tự thời gian gần nhất, lấy top maxCandidates rồi xếp theo lịch dễ theo dõi.
  const selected = [...rawMatches]
    .sort((a, b) => a.priority - b.priority || a.daysAhead - b.daysAhead)
    .slice(0, maxCandidates)
    .sort((a, b) => a.daysAhead - b.daysAhead);

  return {
    ruleCode,
    primaryRuleVi,
    primaryRuleEn,
    reasoningVi,
    reasoningEn,
    targetBranches,
    candidateDates: selected,
    isUnfavorableWarning,
    cautionVi,
    cautionEn,
  };
}
