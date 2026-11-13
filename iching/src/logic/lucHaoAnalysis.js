/**
 * Phân tích Lục Hào thực chiến v2 (Tăng San Bốc Dịch — Dã Hạc Lão Nhân)
 * Bảo toàn 100% tương thích ngược với giao diện Học / Game (`topic`, `dungThan`, `dungLineIndex`,
 * `steps` [6 bước], `score`, `verdict`) đồng thời bổ sung đầy đủ trường chuyên sâu:
 * `dungThanName`, `dungThanLines`, `primaryDT`, `verdictLabel`, `verdictColor`,
 * `factors`, `movingInteractions`, `advice`, `advancedDiagnostics`, `ungKy`.
 */
import { WU_XING, BRANCH_BY_NAME, getTruongSinhStage } from '../data/lucYao.js';
import {
  TOPICS,
  resolveTopicKey,
  LUC_XUNG,
  LUC_HOP,
  TAM_HOP_CUCS,
  TIEN_THAN,
  TOMB_BY_ELEMENT,
  TUYET_BY_ELEMENT,
  SCORE,
  VERDICT,
} from '../data/lucHaoRules.js';
import { computeUngKy } from './ungKy.js';

const elementOf = (chi) => BRANCH_BY_NAME[chi]?.element || null;

function getLucThan(palaceEl, lineEl) {
  if (!palaceEl || !lineEl) return null;
  if (palaceEl === lineEl) return 'Huynh Đệ';
  if (WU_XING[lineEl]?.generates === palaceEl) return 'Phụ Mẫu';
  if (WU_XING[palaceEl]?.generates === lineEl) return 'Tử Tôn';
  if (WU_XING[palaceEl]?.overcomes === lineEl) return 'Thê Tài';
  if (WU_XING[lineEl]?.overcomes === palaceEl) return 'Quan Quỷ';
  return null;
}

const roundScore = (n) => Math.round(Number(n || 0) * 10) / 10;

const sanitizeRefs = (arr) =>
  [...new Set((arr || []).filter((r) => Number.isInteger(r) && r >= 1 && r <= 6))];

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

/** Xác định trạng thái Vượng – Tướng – Hưu – Tù – Tử theo Nguyệt Kiến */
export function getSeasonalVuongSuy(element, monthChi) {
  const mEl = elementOf(monthChi);
  if (!element || !mEl) return 'Bình';
  const rel = relation(element, mEl);
  if (rel === 'same') return 'Vượng';
  if (rel === 'sinhHao') return 'Tướng';
  if (rel === 'haoSinh') return 'Hưu';
  if (rel === 'haoKhac') return 'Tù';
  if (rel === 'khacHao') return 'Tử';
  return 'Bình';
}

/** Làm giàu thông tin từng hào trong quẻ (Ám Động, Nhật Phá, Xung Tán, Hợp Trụ, Mộ, Tuyệt...) */
function enrichLine(rawLine, result, monthChi, dayChi, hasMovingGeneratorFn) {
  const chi = rawLine.chi;
  const el = rawLine.element || elementOf(chi);
  const isMoving = Boolean(rawLine.moving || rawLine.isMoving);
  const changedLineObj = isMoving && result.changedLines
    ? result.changedLines.find((c) => c.index === rawLine.index)
    : null;
  const changedChi = rawLine.changedChi || changedLineObj?.chi || null;
  const changedElement = changedChi ? elementOf(changedChi) : null;

  const vuongSuy = getSeasonalVuongSuy(el, monthChi);
  const tsDay = rawLine.tsDay || getTruongSinhStage(el, dayChi)?.name || '';
  const tsMonth = rawLine.tsMonth || getTruongSinhStage(el, monthChi)?.name || '';
  const tombChi = TOMB_BY_ELEMENT[el] || null;
  const tuyetChi = TUYET_BY_ELEMENT[el] || null;

  const rawKV = Boolean(rawLine.isKhongVong || (result.khongVong || []).includes(chi));
  const isMonthSame = Boolean(monthChi && chi === monthChi);
  // Tăng San Bốc Dịch: Lâm Nguyệt Kiến bất vi Không
  const isTuanKhong = rawKV;
  const isEffectiveVoid = rawKV && !isMonthSame;

  const isNguyetPha = Boolean(monthChi && LUC_XUNG[chi] === monthChi);
  const isDayClashed = Boolean(dayChi && LUC_XUNG[chi] === dayChi);

  const hasMovingSupport = hasMovingGeneratorFn ? hasMovingGeneratorFn(el, rawLine.index) : false;
  const isSeasonallyStrong =
    (vuongSuy === 'Vượng' || vuongSuy === 'Tướng' || isMonthSame || hasMovingSupport) &&
    !isNguyetPha;

  // Ám Động vs Nhật Phá (hào tĩnh) & Xung Khởi vs Xung Tán (hào động)
  let isAmDong = false;
  let isNhatPha = false;
  let isXungTan = false;
  let isXungKhoi = false;
  let isXungKhong = false;

  if (isDayClashed && !rawLine.isHidden) {
    if (!isMoving) {
      if (isSeasonallyStrong && !isEffectiveVoid) {
        isAmDong = true;
      } else if (isSeasonallyStrong && isEffectiveVoid) {
        // Vượng Không phùng Xung tắc thực (đánh thức hào Không)
        isXungKhong = true;
      } else {
        isNhatPha = true;
      }
    } else {
      if (isSeasonallyStrong) {
        isXungKhoi = true;
      } else {
        isXungTan = true;
        isNhatPha = true;
      }
    }
  }

  // Hợp Trụ (hào động gặp Nhật/Nguyệt Lục Hợp) vs Hợp Khởi (hào tĩnh gặp Nhật Lục Hợp)
  let isHopTru = false;
  let isHopKhoi = false;
  let hopPartnerChi = null;
  let hopSource = null;

  if (!rawLine.isHidden) {
    if (isMoving) {
      if (dayChi && LUC_HOP[chi] === dayChi) {
        isHopTru = true;
        hopPartnerChi = dayChi;
        hopSource = 'Nhật thần';
      } else if (monthChi && LUC_HOP[chi] === monthChi) {
        isHopTru = true;
        hopPartnerChi = monthChi;
        hopSource = 'Nguyệt kiến';
      }
    } else if (dayChi && LUC_HOP[chi] === dayChi) {
      isHopKhoi = true;
      hopPartnerChi = dayChi;
      hopSource = 'Nhật thần';
    }
  }

  // Biến hóa của hào động: Hồi Đầu Sinh/Khắc, Hóa Tiến/Thoái, Hóa Mộ, Hóa Tuyệt
  const changeRel = isMoving && changedElement ? relation(el, changedElement) : null;
  const isHoiDauSinh = changeRel === 'sinhHao';
  const isHoiDauKhac = changeRel === 'khacHao';
  const isHoaTien = Boolean(isMoving && changedChi && TIEN_THAN[chi] === changedChi);
  const isHoaThoai = Boolean(isMoving && changedChi && TIEN_THAN[changedChi] === chi);
  const isHoaMo = Boolean(isMoving && changedChi && tombChi && changedChi === tombChi);
  // Thổ biến Tỵ (Hỏa sinh Thổ) là Tuyệt xứ phùng sinh (Hồi Đầu Sinh), không tính Hóa Tuyệt
  const isHoaTuyet = Boolean(
    isMoving &&
    changedChi &&
    tuyetChi &&
    changedChi === tuyetChi &&
    changeRel !== 'sinhHao'
  );

  const isNhapNhatMo = Boolean(dayChi && tombChi && dayChi === tombChi && tsDay === 'Mộ');
  const hasRescue = Boolean(
    (dayChi && (chi === dayChi || LUC_HOP[chi] === dayChi)) ||
    (monthChi && LUC_HOP[chi] === monthChi) ||
    isHoiDauSinh
  );

  const isStrong = Boolean(
    isSeasonallyStrong ||
    (dayChi && (chi === dayChi || relation(el, elementOf(dayChi)) === 'sinhHao')) ||
    isHoiDauSinh ||
    isHoaTien
  ) && !isNhatPha && !isXungTan;

  const isWeak = !isStrong && (vuongSuy === 'Hưu' || vuongSuy === 'Tù' || vuongSuy === 'Tử' || isNguyetPha || isNhatPha);

  return {
    ...rawLine,
    element: el,
    moving: isMoving,
    isMoving,
    changedChi,
    changedElement,
    vuongSuy,
    tsDay,
    tsMonth,
    tombChi,
    isTuanKhong,
    isEffectiveVoid,
    isNguyetPha,
    isDayClashed,
    isAmDong,
    isNhatPha,
    isXungTan,
    isXungKhoi,
    isXungKhong,
    isHopTru,
    isHopKhoi,
    isBoundByHop: isHopTru,
    hopPartnerChi,
    hopSource,
    isHoiDauSinh,
    isHoiDauKhac,
    isHoaTien,
    isHoaThoai,
    isHoaMo,
    isHoaTuyet,
    isNhapNhatMo,
    isNhapDongMo: false,
    isSeasonallyStrong,
    hasRescue,
    isStrong,
    isWeak,
  };
}

/** Chấm điểm nền Nguyệt Kiến + Nhật Thần của một hào (tích hợp Ám Động / Nhật Phá / Xung Tán) */
function scoreBaseStrength(line, monthChi, dayChi) {
  const el = line.element;
  let score = 0;
  const notes = [];
  const factors = [];

  // 1. Nguyệt kiến
  const mRel = relation(el, elementOf(monthChi));
  if (monthChi && line.chi === monthChi) {
    score += SCORE.month.same;
    notes.push(`Nguyệt kiến ${monthChi} trùng chi hào (${line.vuongSuy}: +${SCORE.month.same})`);
    factors.push({
      code: 'month-same',
      label: `Lâm Nguyệt kiến (${monthChi})`,
      delta: SCORE.month.same,
      category: 'season',
      lineIndex: line.index,
    });
  } else if (mRel) {
    const delta = SCORE.month[mRel];
    score += delta;
    notes.push(`Tháng ${monthChi} (${line.vuongSuy}) ${REL_TEXT[mRel]} (${delta > 0 ? `+${delta}` : delta})`);
    factors.push({
      code: `month-${mRel}`,
      label: `Nguyệt kiến ${monthChi} (${line.vuongSuy})`,
      delta,
      category: 'season',
      lineIndex: line.index,
    });
  }

  if (line.isNguyetPha) {
    score += SCORE.nguyetPha;
    notes.push(`Nguyệt Phá (tháng ${monthChi} xung ${line.chi}: ${SCORE.nguyetPha})`);
    factors.push({
      code: 'nguyet-pha',
      label: `Nguyệt Phá (${monthChi} xung ${line.chi})`,
      delta: SCORE.nguyetPha,
      category: 'season',
      lineIndex: line.index,
    });
  }

  // 2. Nhật thần (phân biệt rõ Ám Động vs Nhật Phá vs Xung Tán vs Xung Khởi)
  if (line.isDayClashed && !line.isHidden) {
    if (line.isAmDong) {
      score += SCORE.amDong;
      notes.push(`Ám Động: hào tĩnh đang ${line.vuongSuy} được ngày ${dayChi} xung kích phát (+${SCORE.amDong}, ứng nhanh)`);
      factors.push({
        code: 'am-dong',
        label: `Ám Động (ngày ${dayChi} xung hào vượng ${line.chi})`,
        delta: SCORE.amDong,
        category: 'day',
        lineIndex: line.index,
      });
    } else if (line.isXungKhong) {
      score += 0.5;
      notes.push(`Xung Không tắc thực: ngày ${dayChi} xung đánh thức hào Không ${line.chi} (+0.5)`);
      factors.push({
        code: 'xung-khong',
        label: `Xung Không tắc thực (${dayChi} xung ${line.chi})`,
        delta: 0.5,
        category: 'day',
        lineIndex: line.index,
      });
    } else if (line.isXungTan) {
      score += SCORE.xungTan;
      notes.push(`Xung Tán (Nhật Phá): hào động suy yếu bị ngày ${dayChi} xung tan rã (${SCORE.xungTan})`);
      factors.push({
        code: 'xung-tan',
        label: `Xung Tán / Nhật Phá (${dayChi} xung hào động suy ${line.chi})`,
        delta: SCORE.xungTan,
        category: 'day',
        lineIndex: line.index,
      });
    } else if (line.isXungKhoi) {
      score += SCORE.xungKhoi;
      notes.push(`Xung Khởi / Kích Động: hào động vượng gặp ngày ${dayChi} xung gây xáo động nhanh (${SCORE.xungKhoi})`);
      factors.push({
        code: 'xung-khoi',
        label: `Xung Khởi / Kích Động (${dayChi} xung hào động vượng ${line.chi})`,
        delta: SCORE.xungKhoi,
        category: 'day',
        lineIndex: line.index,
      });
    } else {
      score += SCORE.nhatPha;
      notes.push(`Nhật Phá: hào tĩnh suy (${line.vuongSuy}) bị ngày ${dayChi} xung vỡ (${SCORE.nhatPha})`);
      factors.push({
        code: 'nhat-pha',
        label: `Nhật Phá (${dayChi} xung hào suy ${line.chi})`,
        delta: SCORE.nhatPha,
        category: 'day',
        lineIndex: line.index,
      });
    }
  } else if (dayChi) {
    const dRel = relation(el, elementOf(dayChi));
    if (line.chi === dayChi) {
      score += SCORE.day.same;
      notes.push(`Nhật thần ${dayChi} trùng chi hào (+${SCORE.day.same})`);
      factors.push({
        code: 'day-same',
        label: `Trị Nhật (${dayChi} lâm chi hào)`,
        delta: SCORE.day.same,
        category: 'day',
        lineIndex: line.index,
      });
    } else if (dRel) {
      const delta = SCORE.day[dRel];
      score += delta;
      notes.push(`Ngày ${dayChi} ${REL_TEXT[dRel]} (${delta > 0 ? `+${delta}` : delta})`);
      factors.push({
        code: `day-${dRel}`,
        label: `Nhật thần ${dayChi} (${REL_TEXT[dRel]})`,
        delta,
        category: 'day',
        lineIndex: line.index,
      });
    }
  }

  return { score: roundScore(score), notes, factors };
}

function pickDungThan(enrichedLines, result, dungThan, monthChi, dayChi) {
  if (dungThan === 'Thế') {
    const l = enrichedLines.find((x) => x.isThe);
    return { kind: 'the', candidates: l ? [l] : [] };
  }
  const candidates = enrichedLines.filter((l) => l.lucThan === dungThan);
  if (candidates.length) return { kind: 'present', candidates };

  const hidden = Object.entries(result.phucThanMap || {}).find(([, p]) => p.lucThan === dungThan);
  if (hidden) {
    const idx = Number(hidden[0]);
    const fly = enrichedLines.find((l) => l.index === idx);
    const p = hidden[1];
    const hiddenEnriched = enrichLine(
      {
        ...p,
        index: idx,
        chi: p.chi,
        element: p.element || elementOf(p.chi),
        lucThan: p.lucThan,
        moving: false,
        isMoving: false,
        isHidden: true,
        isPhucThan: true,
        flyChi: fly?.chi || null,
        phiChi: fly?.chi || null,
        phiElement: fly?.element || null,
        phiLucThan: fly?.lucThan || null,
        phiVuongSuy: fly?.vuongSuy || null,
      },
      result,
      monthChi,
      dayChi,
      null
    );
    return { kind: 'hidden', candidates: [hiddenEnriched], phiLine: fly || null };
  }
  return { kind: 'missing', candidates: [], phiLine: null };
}

function chooseBest(candidates, monthChi, dayChi) {
  return candidates
    .map((l) => ({ line: l, ...scoreBaseStrength(l, monthChi, dayChi) }))
    .sort(
      (a, b) =>
        (b.line.isMoving || b.line.isAmDong ? 1 : 0) -
          (a.line.isMoving || a.line.isAmDong ? 1 : 0) ||
        b.score - a.score
    )[0];
}

/** Kiểm tra hào động/ám động có đủ thực lực tham gia sinh khắc liên hoàn hay không */
function isUsableActiveLine(line) {
  if (!line || (!line.isMoving && !line.isAmDong)) return false;
  if (line.isNguyetPha && !line.hasRescue) return false;
  if (line.isNhatPha || line.isXungTan) return false;
  if (line.isHoaTuyet || line.isHoiDauKhac || line.isHoaThoai) return false;
  if (line.isEffectiveVoid && !line.isSeasonallyStrong && !line.isMoving) return false;
  return true;
}

/** Kiểm tra hào động đủ điều kiện kết Tam Hợp Cục (không Hóa Thoái, không Nhật Phá vô cứu) */
function isEligibleForTamHop(line) {
  if (!line || !line.isMoving) return false;
  if (line.isHoaThoai) return false;
  if ((line.isNhatPha || line.isXungTan || line.isNguyetPha) && !line.hasRescue) return false;
  if (line.isHoaTuyet) return false;
  return true;
}

/** Phát hiện Tam Hợp Cục theo 3 quy tắc Tăng San Bốc Dịch */
function detectTamHopCucs(enrichedLines, monthChi, dayChi, targetElement, targetLabel) {
  const eligibleMoving = enrichedLines.filter(isEligibleForTamHop);
  const results = [];

  for (const cuc of TAM_HOP_CUCS) {
    const [b1, b2, b3] = cuc.branches;
    let matched = null;

    // (a) 3 hào động đủ 3 chi
    const l1 = eligibleMoving.find((l) => l.chi === b1);
    const l2 = eligibleMoving.find((l) => l.chi === b2 && l.index !== l1?.index);
    const l3 = eligibleMoving.find(
      (l) => l.chi === b3 && l.index !== l1?.index && l.index !== l2?.index
    );
    if (l1 && l2 && l3) {
      matched = {
        formationType: 'three-moving',
        formationLabelVi: 'Tam hào đồng động kết cục',
        participatingLines: [l1.index, l2.index, l3.index].sort((a, b) => a - b),
      };
    }

    // (b) 2 hào động + Nhật thần hoặc Nguyệt kiến bù chi khuyết
    if (!matched) {
      const pairs = [
        [b1, b2, b3],
        [b1, b3, b2],
        [b2, b3, b1],
      ];
      for (const [mA, mB, missing] of pairs) {
        const lineA = eligibleMoving.find((l) => l.chi === mA);
        const lineB = eligibleMoving.find((l) => l.chi === mB && l.index !== lineA?.index);
        if (lineA && lineB && (dayChi === missing || monthChi === missing)) {
          const fillSource = dayChi === missing ? `Nhật thần ${dayChi}` : `Nguyệt kiến ${monthChi}`;
          matched = {
            formationType: 'two-moving-plus-stem-branch',
            formationLabelVi: `Nhị động hợp ${fillSource} thành cục`,
            participatingLines: [lineA.index, lineB.index].sort((a, b) => a - b),
          };
          break;
        }
      }
    }

    // (c) Nội quái (hào 1 & 3 động) hoặc Ngoại quái (hào 4 & 6 động) + chi biến + Nhật/Nguyệt
    if (!matched) {
      for (const [idxA, idxB, scopeLabel] of [
        [1, 3, 'Nội quái (hào 1 & 3)'],
        [4, 6, 'Ngoại quái (hào 4 & 6)'],
      ]) {
        const lineA = eligibleMoving.find((l) => l.index === idxA);
        const lineB = eligibleMoving.find((l) => l.index === idxB);
        if (!lineA || !lineB) continue;

        const aBranches = [lineA.chi, lineA.changedChi].filter(Boolean);
        const bBranches = [lineB.chi, lineB.changedChi].filter(Boolean);
        const aTouches = aBranches.some((x) => cuc.branches.includes(x));
        const bTouches = bBranches.some((x) => cuc.branches.includes(x));
        const hasChangedContribution =
          cuc.branches.includes(lineA.changedChi) || cuc.branches.includes(lineB.changedChi);

        const pool = new Set([...aBranches, ...bBranches, dayChi, monthChi].filter(Boolean));
        if (
          aTouches &&
          bTouches &&
          hasChangedContribution &&
          cuc.branches.every((br) => pool.has(br))
        ) {
          matched = {
            formationType: 'inner-outer-change',
            formationLabelVi: `${scopeLabel} động biến hóa hợp cục`,
            participatingLines: [idxA, idxB],
          };
          break;
        }
      }
    }

    if (matched) {
      const rel = targetElement ? relation(targetElement, cuc.element) : null;
      let delta = 0;
      let effectVi = '';
      if (rel === 'sinhHao') {
        delta = SCORE.tamHopSinh;
        effectVi = `sinh trợ mạnh mẽ cho ${targetLabel} (+${delta})`;
      } else if (rel === 'same') {
        delta = SCORE.tamHopSame;
        effectVi = `tỷ hòa tiếp sức bền vững cho ${targetLabel} (+${delta})`;
      } else if (rel === 'khacHao') {
        delta = SCORE.tamHopKhac;
        effectVi = `hợp lực khắc chế ${targetLabel} (${delta})`;
      } else if (rel === 'haoSinh') {
        delta = -1;
        effectVi = `làm tiết khí ${targetLabel} (-1)`;
      } else if (rel === 'haoKhac') {
        delta = 0.5;
        effectVi = `để ${targetLabel} chế phục thu hoạch (+0.5)`;
      }

      results.push({
        id: cuc.id,
        element: cuc.element,
        branches: cuc.branches,
        labelVi: cuc.labelVi,
        labelEn: cuc.labelEn,
        formationType: matched.formationType,
        formationLabelVi: matched.formationLabelVi,
        participatingLines: matched.participatingLines,
        relationToDT: rel,
        delta,
        summaryVi: `${cuc.labelVi} (${matched.formationLabelVi}, hào ${matched.participatingLines.join(' & ')}) → ${effectVi}.`,
      });
    }
  }

  return results;
}

/** Phân tích Thế – Ứng theo ngữ cảnh chủ đề */
function analyzeTheUng(enrichedLines, topicKey, topicObj, dungThan) {
  const theLine = enrichedLines.find((l) => l.isThe) || null;
  const ungLine = enrichedLines.find((l) => l.isUng) || null;
  if (!theLine || !ungLine) return null;

  const elRel = relation(theLine.element, ungLine.element);
  const isLucHop = LUC_HOP[theLine.chi] === ungLine.chi;
  const isLucXung = LUC_XUNG[theLine.chi] === ungLine.chi;
  const isSameBranch = theLine.chi === ungLine.chi;

  let delta = 0;
  const parts = [
    `Thế hào ${theLine.index} (${theLine.lucThan} ${theLine.chi}-${theLine.element}) vs Ứng hào ${ungLine.index} (${ungLine.lucThan} ${ungLine.chi}-${ungLine.element})`,
  ];

  if (isLucHop) parts.push('Thế – Ứng Lục Hợp (dễ gắn kết, đồng thuận)');
  else if (isLucXung) parts.push('Thế – Ứng Lục Xung (dễ bất đồng, va chạm hoặc xa cách)');

  if (elRel === 'sinhHao') parts.push('Ứng sinh Thế (đối phương/hoàn cảnh hướng về trợ lực cho ta)');
  else if (elRel === 'haoSinh') parts.push('Thế sinh Ứng (ta chủ động nhường nhịn, bỏ tâm sức vì đối phương)');
  else if (elRel === 'same') parts.push('Thế – Ứng tỷ hòa (đôi bên ngang sức)');
  else if (elRel === 'haoKhac') parts.push('Thế khắc Ứng (ta nắm thế chủ động kiểm soát)');
  else if (elRel === 'khacHao') parts.push('Ứng khắc Thế (đối phương/ngoại cảnh gây áp lực lên ta)');

  if (topicObj.interpersonal) {
    if (topicKey === 'love' || topicKey === 'love_f' || topicKey === 'siblings') {
      if (isLucHop) delta += 1;
      if (isLucXung) delta -= 1;
      if (elRel === 'sinhHao') delta += 1;
      else if (elRel === 'same') delta += 0.5;
      else if (elRel === 'khacHao') delta -= 1;
      else if (elRel === 'haoKhac') delta -= 0.5;
    } else if (topicKey === 'lawsuit') {
      if (elRel === 'haoKhac') delta += 1;
      else if (elRel === 'khacHao') delta -= 1.5;
      else if (elRel === 'sinhHao') delta += 0.5;
      if (isLucHop) delta += 0.5;
    } else {
      // career, wealth, study
      if (isLucHop) delta += 0.5;
      if (isLucXung) delta -= 0.5;
      if (elRel === 'sinhHao') delta += 0.5;
      else if (elRel === 'khacHao') delta -= 0.5;
      else if (topicKey === 'wealth' && elRel === 'haoKhac') delta += 0.5;
    }
  }

  // Nếu Dụng Thần không phải Thế mà Hào Thế bị Nhật Phá / Nguyệt Phá vô cứu → bản thân khó gánh vác
  let theBrokenPenalty = 0;
  if (dungThan !== 'Thế' && (theLine.isNguyetPha || theLine.isNhatPha) && !theLine.hasRescue) {
    theBrokenPenalty = -1;
    delta += theBrokenPenalty;
    parts.push('Lưu ý: Hào Thế bị Phá, bản thân cần củng cố nội lực mới đón nhận được kết quả');
  }

  return {
    theIndex: theLine.index,
    theChi: theLine.chi,
    theElement: theLine.element,
    theLucThan: theLine.lucThan,
    ungIndex: ungLine.index,
    ungChi: ungLine.chi,
    ungElement: ungLine.element,
    ungLucThan: ungLine.lucThan,
    elementRelation: elRel,
    isLucHop,
    isLucXung,
    isSameBranch,
    interpersonalTopic: Boolean(topicObj.interpersonal),
    theBrokenPenalty,
    delta: roundScore(delta),
    summaryVi: `${parts.join('; ')}.`,
  };
}

export function analyzeLucHao(result, topicKey = 'general') {
  if (!result?.lines || result.lines.length < 6) return null;

  const resolvedKey = resolveTopicKey(topicKey);
  const canonicalTopic = TOPICS[topicKey] ? topicKey : resolvedKey;
  const topic = TOPICS[resolvedKey] || TOPICS.general;
  const monthChi = result.canChi?.thangChi || null;
  const dayChi = result.ngayChi || result.canChi?.ngayChi || null;
  const palaceElement = result.palaceElement || null;

  // Tiền kiểm tra hào động sinh trợ để xét Ám Động chuẩn xác
  const rawMovingElements = (result.lines || [])
    .filter((l) => l.moving || l.isMoving)
    .map((l) => ({ index: l.index, element: l.element || elementOf(l.chi) }));

  const hasMovingGenerator = (targetEl, selfIndex) =>
    rawMovingElements.some(
      (m) => m.index !== selfIndex && relation(targetEl, m.element) === 'sinhHao'
    );

  const enrichedLines = result.lines.map((l) =>
    enrichLine(l, result, monthChi, dayChi, hasMovingGenerator)
  );

  const steps = [];
  const factors = [];
  const movingInteractions = [];

  // ── 1. Chọn Dụng Thần ────────────────────────────────────────────────────
  const pick = pickDungThan(enrichedLines, result, topic.dungThan, monthChi, dayChi);
  const picked = pick.candidates.length ? chooseBest(pick.candidates, monthChi, dayChi) : null;
  const dungLine = picked?.line || null;

  const dungThanName =
    topic.dungThan === 'Thế'
      ? `Hào Thế${dungLine?.lucThan ? ` (${dungLine.lucThan})` : ''}`
      : topic.dungThan;

  let f1;
  if (pick.kind === 'the') {
    f1 = `Hỏi việc chung/bản thân nên lấy hào Thế (hào ${dungLine?.index}, ${dungLine?.chi}-${dungLine?.element}) làm Dụng Thần.`;
  } else if (pick.kind === 'present') {
    f1 =
      `Dụng Thần là ${topic.dungThan}. Quẻ có ${pick.candidates.length} hào ${topic.dungThan}` +
      (pick.candidates.length > 1
        ? `; chọn hào ${dungLine.index} (${dungLine.chi}-${dungLine.element}) vì ${
            dungLine.isMoving ? 'đang động' : dungLine.isAmDong ? 'đang Ám Động' : 'vượng khí nhất'
          }.`
        : `: hào ${dungLine.index} (${dungLine.chi}-${dungLine.element}).`);
  } else if (pick.kind === 'hidden') {
    f1 = `Dụng Thần ${topic.dungThan} không lộ trên quẻ, ẩn phục dưới hào ${dungLine.index} — Phi Thần ${pick.phiLine?.lucThan || ''} (${pick.phiLine?.chi || '?'}) đè trên Phục Thần ${dungLine.chi}-${dungLine.element}.`;
  } else {
    f1 = `Quẻ không có ${topic.dungThan} cả lộ lẫn phục: việc khó có kết quả rõ ràng.`;
  }

  steps.push({
    id: 'dung-than',
    title: 'Chọn Dụng Thần',
    finding: f1,
    why: `Chủ đề "${topic.label}" dùng ${topic.dungThan} làm tâm điểm. Mọi sinh khắc của Nhật, Nguyệt và hào động đều quy về hào này.`,
    refs: sanitizeRefs(dungLine ? [dungLine.index] : []),
    glossary: [
      topic.dungThan === 'Thế' ? 'the' : topic.dungThan,
      ...(pick.kind === 'hidden' ? ['phucThan'] : []),
    ],
  });

  // ── 2. Nguyệt Kiến & Nhật Thần (kèm tóm tắt Ám Động / Nhật Phá toàn quẻ) ──
  const amDongLines = enrichedLines.filter((l) => l.isAmDong);
  const nhatPhaLines = enrichedLines.filter((l) => l.isNhatPha);
  const xungKhoiLines = enrichedLines.filter((l) => l.isXungKhoi);
  const hopTruLines = [];

  const timeExtra = [];
  if (amDongLines.length) {
    timeExtra.push(
      `Ám Động: ${amDongLines.map((l) => `hào ${l.index} (${l.lucThan} ${l.chi})`).join(', ')}`
    );
  }
  if (nhatPhaLines.length) {
    timeExtra.push(
      `Nhật Phá/Xung Tán: ${nhatPhaLines.map((l) => `hào ${l.index} (${l.lucThan} ${l.chi})`).join(', ')}`
    );
  }

  const gl2 = ['nguyetKien', 'nhatThan'];
  if (amDongLines.length) gl2.push('amDong');
  if (nhatPhaLines.length) gl2.push('nhatPha');

  steps.push({
    id: 'thoi-gian',
    title: 'Xem Nguyệt kiến và Nhật thần',
    finding:
      `Tháng ${monthChi || '?'}, ngày ${result.ngayCan || ''} ${dayChi || '?'} (Tuần Không: ${(result.khongVong || []).join(', ') || 'không có'}).` +
      (timeExtra.length ? ` ${timeExtra.join(' · ')}.` : ''),
    why: 'Nguyệt kiến cầm quyền vượng suy trong tháng; Nhật thần kích hoạt Ám Động nếu hào vượng, hoặc đánh Nhật Phá nếu hào suy.',
    refs: sanitizeRefs([...amDongLines.map((l) => l.index), ...nhatPhaLines.map((l) => l.index)]),
    glossary: gl2,
  });

  let total = 0;
  let phucPhiDetail = null;
  let chainSummary = null;
  let tamHopCucs = [];
  let moDiagnostics = {
    tombChi: null,
    isNhapNhatMo: false,
    isHoaMo: false,
    isNhapDongMo: false,
    isHoaTuyet: false,
    summaryVi: '',
    items: [],
  };

  if (!dungLine) {
    total -= 3;
    factors.push({
      code: 'missing-dt',
      label: 'Khuyết Dụng Thần (cả lộ lẫn phục)',
      delta: -3,
      category: 'dung-than',
      lineIndex: null,
    });
    steps.push({
      id: 'vuong-suy',
      title: 'Vượng / Suy của Dụng Thần',
      finding: 'Không có Dụng Thần để chấm điểm khí lực.',
      why: '',
      refs: [],
      glossary: [],
    });
    steps.push({
      id: 'dong-tinh',
      title: 'Hào động và biến hóa',
      finding: 'Dụng Thần khuyết vắng nên chưa xét biến hóa.',
      why: '',
      refs: [],
      glossary: ['moving'],
    });
    steps.push({
      id: 'tuan-khong',
      title: 'Tuần Không & Mộ Khố',
      finding: 'Không có Dụng Thần.',
      why: '',
      refs: [],
      glossary: ['khongVong'],
    });
  } else {
    // ── 3. Vượng / Suy + Phi – Phục (nếu Dụng Thần phục tàng) ────────────────
    total += picked.score;
    factors.push(...picked.factors);
    const notes3 = [...picked.notes];
    const gl3 = ['nguyetKien', 'nhatThan'];
    if (dungLine.isAmDong) gl3.push('amDong');
    if (dungLine.isNhatPha) gl3.push('nhatPha');

    // Hợp Khởi nếu Dụng Thần tĩnh được Nhật Lục Hợp
    if (dungLine.isHopKhoi && !dungLine.isHidden) {
      total += SCORE.hopKhoiDT;
      notes3.push(`Nhật thần ${dayChi} Lục Hợp với ${dungLine.chi} → Hợp Khởi trợ vượng (+${SCORE.hopKhoiDT})`);
      factors.push({
        code: 'hop-khoi-dt',
        label: `Nhật Hợp Khởi (${dayChi} hợp ${dungLine.chi})`,
        delta: SCORE.hopKhoiDT,
        category: 'day',
        lineIndex: dungLine.index,
      });
    }

    // Chẩn đoán chuyên sâu Phi Thần – Phục Thần
    if (pick.kind === 'hidden' && pick.phiLine) {
      gl3.push('phucThan');
      const phi = pick.phiLine;
      const ppRel = relation(dungLine.element, phi.element);
      const dayClashesOrOvercomesPhi = Boolean(
        dayChi &&
          (LUC_XUNG[phi.chi] === dayChi || relation(phi.element, elementOf(dayChi)) === 'khacHao')
      );
      const monthClashesOrOvercomesPhi = Boolean(
        monthChi &&
          (LUC_XUNG[phi.chi] === monthChi ||
            relation(phi.element, elementOf(monthChi)) === 'khacHao')
      );
      const isRescued = dayClashesOrOvercomesPhi || monthClashesOrOvercomesPhi;

      let ppDelta = 0;
      let ppSummary = '';
      let relationType = ppRel || 'other';
      let rescueDetailVi = '';

      if (ppRel === 'sinhHao') {
        ppDelta = SCORE.phiSinhPhuc;
        ppSummary = `Phi sinh Phục: Phi Thần ${phi.lucThan} (${phi.chi}-${phi.element}) sinh dưỡng Phục Thần ${dungLine.lucThan} (${dungLine.chi}) — ẩn nhưng có nguồn nuôi, chờ ngày xuất lộ (+${ppDelta})`;
      } else if (ppRel === 'khacHao') {
        if (isRescued) {
          ppDelta = SCORE.phiKhacPhucRescued;
          const rescuer = dayClashesOrOvercomesPhi
            ? `Nhật thần ${dayChi}`
            : `Nguyệt kiến ${monthChi}`;
          rescueDetailVi = `${rescuer} xung khắc Phi Thần ${phi.chi}`;
          ppSummary = `Nhật/Nguyệt xung khắc Phi Thần (${phi.chi}), giải cứu Phục Thần (${dungLine.chi}) lộ diện (+${ppDelta})`;
        } else {
          ppDelta = SCORE.phiKhacPhuc;
          ppSummary = `Phi khắc Phục: Phi Thần ${phi.lucThan} (${phi.chi}-${phi.element}) đè khắc Phục Thần ${dungLine.chi} và chưa có Nhật/Nguyệt xung phá Phi (${ppDelta})`;
        }
      } else if (ppRel === 'haoSinh') {
        ppDelta = SCORE.phucSinhPhi;
        ppSummary = `Phục sinh Phi: Phục Thần ${dungLine.chi} bị Phi Thần ${phi.chi} rút khí (tiết khí: ${ppDelta})`;
      } else if (ppRel === 'haoKhac') {
        ppDelta = SCORE.phucKhacPhi;
        ppSummary = `Phục khắc Phi: Phục Thần ${dungLine.chi} phải tự hao sức khắc Phi Thần ${phi.chi} để vươn ra (${ppDelta})`;
      } else if (ppRel === 'same') {
        ppDelta = 0.5;
        ppSummary = `Phi – Phục tỷ hòa (${phi.chi} & ${dungLine.chi} đồng hành tương trợ: +0.5)`;
      }

      total += ppDelta;
      notes3.push(ppSummary);
      factors.push({
        code: `phuc-phi-${relationType}`,
        label: isRescued && ppRel === 'khacHao' ? 'Xung Phi cứu Phục' : 'Quan hệ Phi – Phục',
        delta: ppDelta,
        category: 'phuc-than',
        lineIndex: dungLine.index,
      });

      phucPhiDetail = {
        hiddenIndex: dungLine.index,
        phucChi: dungLine.chi,
        phucElement: dungLine.element,
        phucLucThan: dungLine.lucThan,
        phiChi: phi.chi,
        phiElement: phi.element,
        phiLucThan: phi.lucThan,
        phiVuongSuy: phi.vuongSuy,
        relationType,
        isRescuedByDayMonth: isRescued,
        rescueDetailVi,
        delta: ppDelta,
        summaryVi: `${ppSummary}.`,
      };
    }

    steps.push({
      id: 'vuong-suy',
      title: 'Vượng / Suy của Dụng Thần',
      finding: notes3.length
        ? `${notes3.join('; ')}. Điểm nền: ${roundScore(total)}.`
        : 'Không có tác động đặc biệt từ tháng và ngày.',
      why: 'Dụng Thần đắc lệnh tháng (Vượng/Tướng), được Nhật sinh hoặc Ám Động là hữu lực; gặp Nguyệt Phá, Nhật Phá hoặc bị Phi Thần đè khắc là suy tổn.',
      refs: sanitizeRefs([dungLine.index]),
      glossary: [...new Set(gl3)],
    });

    // ── 4. Hào động, Biến hóa, Liên Hoàn Tương Sinh, Tam Hợp Cục & Hợp Trụ ──
    const notes4 = [];
    const gl4 = ['moving'];
    const dEl = dungLine.element;

    // 4a. Bản thân Dụng Thần phát động biến hóa
    if (dungLine.isMoving && dungLine.changedChi) {
      if (dungLine.isHoiDauSinh) {
        total += SCORE.hoiDauSinh;
        notes4.push(`Hồi Đầu Sinh: ${dungLine.chi} biến ${dungLine.changedChi} (+${SCORE.hoiDauSinh}).`);
        gl4.push('hoiDauSinh');
        factors.push({
          code: 'hoi-dau-sinh',
          label: `Dụng Thần Hồi Đầu Sinh (${dungLine.chi} → ${dungLine.changedChi})`,
          delta: SCORE.hoiDauSinh,
          category: 'change',
          lineIndex: dungLine.index,
        });
      } else if (dungLine.isHoiDauKhac) {
        total += SCORE.hoiDauKhac;
        notes4.push(`Hồi Đầu Khắc: ${dungLine.chi} biến ${dungLine.changedChi} (${SCORE.hoiDauKhac}).`);
        gl4.push('hoiDauKhac');
        factors.push({
          code: 'hoi-dau-khac',
          label: `Dụng Thần Hồi Đầu Khắc (${dungLine.chi} → ${dungLine.changedChi})`,
          delta: SCORE.hoiDauKhac,
          category: 'change',
          lineIndex: dungLine.index,
        });
      }

      if (dungLine.isHoaTien) {
        total += SCORE.hoaTien;
        notes4.push(`Hóa Tiến Thần (${dungLine.chi} → ${dungLine.changedChi}: +${SCORE.hoaTien}).`);
        gl4.push('hoaTien');
        factors.push({
          code: 'hoa-tien',
          label: `Dụng Thần Hóa Tiến Thần (${dungLine.chi} → ${dungLine.changedChi})`,
          delta: SCORE.hoaTien,
          category: 'change',
          lineIndex: dungLine.index,
        });
      } else if (dungLine.isHoaThoai) {
        total += SCORE.hoaThoai;
        notes4.push(`Hóa Thoái Thần (${dungLine.chi} → ${dungLine.changedChi}: ${SCORE.hoaThoai}).`);
        gl4.push('hoaThoai');
        factors.push({
          code: 'hoa-thoai',
          label: `Dụng Thần Hóa Thoái Thần (${dungLine.chi} → ${dungLine.changedChi})`,
          delta: SCORE.hoaThoai,
          category: 'change',
          lineIndex: dungLine.index,
        });
      }

      if (dungLine.isHopTru) {
        total += SCORE.hopTruDT;
        notes4.push(
          `Hợp Trụ: Dụng Thần động bị ${dungLine.hopSource} ${dungLine.hopPartnerChi} Lục Hợp níu giữ (${SCORE.hopTruDT}, đợi ngày Xung Hợp mới ứng).`
        );
        gl4.push('hopTru');
        factors.push({
          code: 'hop-tru-dt',
          label: `Dụng Thần Hợp Trụ (${dungLine.chi} hợp ${dungLine.hopPartnerChi})`,
          delta: SCORE.hopTruDT,
          category: 'hop-tru',
          lineIndex: dungLine.index,
        });
        hopTruLines.push({
          index: dungLine.index,
          lucThan: dungLine.lucThan,
          chi: dungLine.chi,
          partnerChi: dungLine.hopPartnerChi,
          source: dungLine.hopSource,
          roleToDT: 'Dụng Thần',
          isKyThanBound: false,
          summaryVi: `Hào ${dungLine.index} (${dungLine.lucThan} ${dungLine.chi}) động gặp ${dungLine.hopSource} ${dungLine.hopPartnerChi} Hợp Trụ → sự việc trì hoãn đến ngày Xung Hợp.`,
        });
      }

      movingInteractions.push({
        index: dungLine.index,
        lucThan: dungLine.lucThan,
        chi: dungLine.chi,
        changedChi: dungLine.changedChi,
        role: 'Dụng Thần',
        isAmDong: false,
        isHopTru: dungLine.isHopTru,
        summaryVi: `Hào ${dungLine.index} (${dungLine.lucThan} ${dungLine.chi} → ${dungLine.changedChi}): Dụng Thần phát động.`,
      });
    } else if (dungLine.isAmDong) {
      notes4.push(`Dụng Thần ${dungLine.chi} Ám Động (chuyển biến rất nhanh).`);
      movingInteractions.push({
        index: dungLine.index,
        lucThan: dungLine.lucThan,
        chi: dungLine.chi,
        changedChi: null,
        role: 'Dụng Thần',
        isAmDong: true,
        isHopTru: false,
        summaryVi: `Hào ${dungLine.index} (${dungLine.lucThan} ${dungLine.chi}): Dụng Thần Ám Động.`,
      });
    }

    // 4b. Chuỗi Nguyên Thần – Dụng Thần – Kỵ Thần – Cừu Thần – Tiết Thần
    const nguyenThanEl = WU_XING[dEl]?.generatedBy || null;
    const kyThanEl = WU_XING[dEl]?.overcomeBy || null;
    const cuuThanEl = WU_XING[dEl]?.overcomes || null;
    const tietThanEl = WU_XING[dEl]?.generates || null;

    const roleNameOf = (el) => {
      if (!el) return 'Khác';
      if (el === nguyenThanEl) return 'Nguyên Thần';
      if (el === kyThanEl) return 'Kỵ Thần';
      if (el === cuuThanEl) return 'Cừu Thần';
      if (el === tietThanEl) return 'Tiết Thần';
      return 'Tỷ Trợ';
    };

    const otherActive = enrichedLines.filter(
      (l) => (l.isMoving || l.isAmDong) && (dungLine.isHidden || l.index !== dungLine.index)
    );

    // Ghi nhận Hợp Trụ trên các hào động khác (đặc biệt Kỵ Thần bị Hợp Trụ)
    for (const l of otherActive) {
      const role = roleNameOf(l.element);
      if (l.isHopTru) {
        gl4.push('hopTru');
        const isKy = role === 'Kỵ Thần';
        hopTruLines.push({
          index: l.index,
          lucThan: l.lucThan,
          chi: l.chi,
          partnerChi: l.hopPartnerChi,
          source: l.hopSource,
          roleToDT: role,
          isKyThanBound: isKy,
          summaryVi: isKy
            ? `Hào ${l.index} (Kỵ Thần ${l.lucThan} ${l.chi}) động nhưng bị ${l.hopSource} ${l.hopPartnerChi} Hợp Trụ nên tạm thời bị trói, giảm sức khắc Dụng Thần.`
            : `Hào ${l.index} (${role} ${l.lucThan} ${l.chi}) bị ${l.hopSource} ${l.hopPartnerChi} Hợp Trụ.`,
        });
      }
      movingInteractions.push({
        index: l.index,
        lucThan: l.lucThan,
        chi: l.chi,
        changedChi: l.changedChi,
        role,
        isAmDong: l.isAmDong,
        isHopTru: l.isHopTru,
        usable: isUsableActiveLine(l),
        summaryVi: `Hào ${l.index} (${l.lucThan} ${l.chi}${l.changedChi ? ` → ${l.changedChi}` : ''}, ${l.isAmDong ? 'Ám Động' : 'động'}): đóng vai ${role}.`,
      });
    }

    const usableNguyen = otherActive.filter(
      (l) => l.element === nguyenThanEl && isUsableActiveLine(l) && !l.isHopTru
    );
    const usableKyUnbound = otherActive.filter(
      (l) => l.element === kyThanEl && isUsableActiveLine(l) && !l.isHopTru
    );
    const boundKy = otherActive.filter(
      (l) => l.element === kyThanEl && isUsableActiveLine(l) && l.isHopTru
    );
    const usableCuu = otherActive.filter(
      (l) => l.element === cuuThanEl && isUsableActiveLine(l) && !l.isHopTru
    );
    const usableSame = otherActive.filter(
      (l) => l.element === dEl && isUsableActiveLine(l) && !l.isHopTru
    );

    const isThamSinhVongKhac = usableNguyen.length > 0 && usableKyUnbound.length > 0;
    const isCuuThanChain =
      usableNguyen.length === 0 && usableCuu.length > 0 && usableKyUnbound.length > 0;

    let chainText = '';
    if (isThamSinhVongKhac) {
      total += SCORE.thamSinhVongKhac;
      gl4.push('thamSinhVongKhac');
      chainText =
        'Tham sinh vong khắc: Kỵ Thần động sinh Nguyên Thần, Nguyên Thần tiếp tục sinh Dụng Thần — chuyển hung thành cát!';
      notes4.push(
        `${chainText} (Kỵ hào ${usableKyUnbound.map((x) => x.index).join(',')} → Nguyên hào ${usableNguyen.map((x) => x.index).join(',')} → Dụng: +${SCORE.thamSinhVongKhac}).`
      );
      factors.push({
        code: 'tham-sinh-vong-khac',
        label: 'Tham sinh vong khắc (Kỵ → Nguyên → Dụng)',
        delta: SCORE.thamSinhVongKhac,
        category: 'chain',
        lineIndex: usableNguyen[0].index,
      });
    } else {
      for (const nt of usableNguyen) {
        const bonus = 1.5;
        total += bonus;
        notes4.push(
          `Nguyên Thần hào ${nt.index} (${nt.lucThan} ${nt.chi}) ${nt.isAmDong ? 'Ám Động' : 'động'} sinh Dụng Thần (+${bonus}).`
        );
        factors.push({
          code: 'nguyen-than-sinh',
          label: `Nguyên Thần hào ${nt.index} (${nt.chi}) sinh Dụng Thần`,
          delta: bonus,
          category: 'chain',
          lineIndex: nt.index,
        });
      }

      for (const ky of usableKyUnbound) {
        const pen = -2;
        total += pen;
        notes4.push(
          `Kỵ Thần hào ${ky.index} (${ky.lucThan} ${ky.chi}) ${ky.isAmDong ? 'Ám Động' : 'động'} khắc Dụng Thần (${pen}).`
        );
        factors.push({
          code: 'ky-than-khac',
          label: `Kỵ Thần hào ${ky.index} (${ky.chi}) khắc Dụng Thần`,
          delta: pen,
          category: 'chain',
          lineIndex: ky.index,
        });
      }

      for (const bKy of boundKy) {
        const pen = -0.5;
        total += pen;
        notes4.push(
          `Kỵ Thần hào ${bKy.index} (${bKy.chi}) động nhưng bị ${bKy.hopSource} ${bKy.hopPartnerChi} Hợp Trụ trói chân nên tạm giảm sức hại (${pen}).`
        );
        factors.push({
          code: 'ky-than-hop-tru',
          label: `Kỵ Thần hào ${bKy.index} (${bKy.chi}) bị Hợp Trụ kìm hãm`,
          delta: pen,
          category: 'hop-tru',
          lineIndex: bKy.index,
        });
      }

      if (isCuuThanChain) {
        total += SCORE.cuuThanChain;
        chainText = `Cừu Thần (hào ${usableCuu.map((x) => x.index).join(',')}) động khắc chế Nguyên Thần và tiếp sức cho Kỵ Thần (hào ${usableKyUnbound.map((x) => x.index).join(',')}) khắc Dụng Thần!`;
        notes4.push(`${chainText} (${SCORE.cuuThanChain}).`);
        factors.push({
          code: 'cuu-than-chain',
          label: 'Cừu Thần động khắc Nguyên Thần sinh Kỵ Thần',
          delta: SCORE.cuuThanChain,
          category: 'chain',
          lineIndex: usableCuu[0].index,
        });
      }
    }

    for (const sm of usableSame) {
      total += 1;
      notes4.push(`Hào ${sm.index} (${sm.chi}) đồng hành trợ lực cho Dụng Thần (+1).`);
      factors.push({
        code: 'ty-hoa-dong',
        label: `Hào ${sm.index} (${sm.chi}) tỷ hòa trợ Dụng Thần`,
        delta: 1,
        category: 'chain',
        lineIndex: sm.index,
      });
    }

    // Các hào Kỵ Thần động nhưng tự bại (Hồi Đầu Khắc / Nhật Phá / Hóa Thoái)
    const defeatedKy = otherActive.filter(
      (l) => l.element === kyThanEl && !isUsableActiveLine(l)
    );
    for (const dKy of defeatedKy) {
      notes4.push(
        `Kỵ Thần hào ${dKy.index} (${dKy.chi}) tuy động nhưng bị ${
          dKy.isHoiDauKhac
            ? 'Hồi Đầu Khắc'
            : dKy.isNhatPha
            ? 'Nhật Phá/Xung Tán'
            : dKy.isHoaThoai
            ? 'Hóa Thoái'
            : 'suy bại'
        } nên mất sức hại Dụng Thần.`
      );
    }

    chainSummary = {
      roles: {
        nguyenThan: {
          element: nguyenThanEl,
          lucThan: palaceElement && nguyenThanEl ? getLucThan(palaceElement, nguyenThanEl) : null,
        },
        dungThan: {
          element: dEl,
          lucThan: dungLine.lucThan,
        },
        kyThan: {
          element: kyThanEl,
          lucThan: palaceElement && kyThanEl ? getLucThan(palaceElement, kyThanEl) : null,
        },
        cuuThan: {
          element: cuuThanEl,
          lucThan: palaceElement && cuuThanEl ? getLucThan(palaceElement, cuuThanEl) : null,
        },
        tietThan: {
          element: tietThanEl,
          lucThan: palaceElement && tietThanEl ? getLucThan(palaceElement, tietThanEl) : null,
        },
      },
      isThamSinhVongKhac,
      isCuuThanChain,
      activeNguyenThanLines: usableNguyen.map((l) => l.index),
      activeKyThanLines: usableKyUnbound.map((l) => l.index),
      activeCuuThanLines: usableCuu.map((l) => l.index),
      summaryVi:
        chainText ||
        (usableNguyen.length
          ? `Nguyên Thần (${nguyenThanEl}) đang phát động trợ sinh Dụng Thần (${dEl}).`
          : usableKyUnbound.length
          ? `Kỵ Thần (${kyThanEl}) phát động khắc Dụng Thần (${dEl}) mà thiếu Nguyên Thần thông quan.`
          : `Chuỗi sinh khắc ổn định: Nguyên Thần (${nguyenThanEl || '?'}) → Dụng Thần (${dEl}) ← Kỵ Thần (${kyThanEl || '?'}).`),
    };

    // 4c. Tam Hợp Cục
    tamHopCucs = detectTamHopCucs(enrichedLines, monthChi, dayChi, dEl, dungThanName);
    for (const cuc of tamHopCucs) {
      total += cuc.delta;
      gl4.push('tamHopCuc');
      notes4.push(cuc.summaryVi);
      factors.push({
        code: `tam-hop-${cuc.id}`,
        label: cuc.labelVi,
        delta: cuc.delta,
        category: 'tam-hop',
        lineIndex: cuc.participatingLines[0] || dungLine.index,
      });
    }

    if (!notes4.length) {
      notes4.push(
        result.movingLines?.length
          ? 'Hào động không tác động sinh khắc trực tiếp lên Dụng Thần.'
          : 'Quẻ tĩnh (không có hào động): cát hung định đoạt chủ yếu bởi Nguyệt kiến và Nhật thần.'
      );
    }

    steps.push({
      id: 'dong-tinh',
      title: 'Hào động và biến hóa',
      finding: notes4.join(' '),
      why: 'Xét Hồi Đầu Sinh/Khắc, Hóa Tiến/Thoái, chuỗi Tham Sinh Vong Khắc, Tam Hợp Cục và Hợp Trụ theo Tăng San Bốc Dịch.',
      refs: sanitizeRefs([
        dungLine.index,
        ...(result.movingLines || []),
        ...amDongLines.map((l) => l.index),
      ]),
      glossary: [...new Set(gl4)],
    });

    // ── 5. Tuần Không, Nhập Mộ & Hóa Tuyệt ───────────────────────────────────
    const notes5 = [];
    const gl5 = ['khongVong'];

    if (dungLine.isTuanKhong) {
      if (!dungLine.isEffectiveVoid) {
        notes5.push(
          `Dụng Thần ${dungLine.chi} gặp Tuần Không nhưng lâm Nguyệt kiến ${monthChi} nên "Lâm Nguyệt bất Không" (không mất lực).`
        );
      } else if (dungLine.isMoving || dungLine.isAmDong) {
        total += SCORE.khongVongMovingOrAmDong;
        notes5.push(
          `Dụng Thần ${dungLine.chi} lâm Tuần Không nhưng đang ${dungLine.isAmDong ? 'Ám Động' : 'phát động'} ("Động bất vi Không", chờ ngày Xuất Không là ứng: ${SCORE.khongVongMovingOrAmDong}).`
        );
        factors.push({
          code: 'tuan-khong-moving',
          label: `Dụng Thần Tuần Không nhưng đang động (${dungLine.chi})`,
          delta: SCORE.khongVongMovingOrAmDong,
          category: 'void-tomb',
          lineIndex: dungLine.index,
        });
      } else {
        total += SCORE.khongVong;
        notes5.push(
          `Dụng Thần ${dungLine.chi} rơi vào Tuần Không tĩnh (${SCORE.khongVong}) — lực đang rỗng, phải đợi Xuất Không / Xung Không.`
        );
        factors.push({
          code: 'tuan-khong-quiet',
          label: `Dụng Thần tĩnh lâm Tuần Không (${dungLine.chi})`,
          delta: SCORE.khongVong,
          category: 'void-tomb',
          lineIndex: dungLine.index,
        });
      }
    } else {
      notes5.push('Dụng Thần không rơi vào Tuần Không.');
    }

    // Kiểm tra Tam Mộ (Nhật Mộ, Hóa Mộ, Động Mộ) & Hóa Tuyệt
    const tombChi = dungLine.tombChi;
    const movingTombLine =
      !dungLine.isMoving && tombChi
        ? enrichedLines.find(
            (l) =>
              l.index !== dungLine.index &&
              l.isMoving &&
              !l.isNhatPha &&
              !l.isXungTan &&
              l.chi === tombChi
          )
        : null;

    if (movingTombLine) {
      dungLine.isNhapDongMo = true;
    }

    const moItems = [];
    if (dungLine.isNhapNhatMo) {
      const moDelta = dungLine.isSeasonallyStrong ? SCORE.nhapNhatMoStrong : SCORE.nhapNhatMoWeak;
      total += moDelta;
      gl5.push('nhapMo');
      const msg = dungLine.isSeasonallyStrong
        ? `Nhập Nhật Mộ tại ${dayChi} (hào có khí nhưng tạm bị kho khóa: ${moDelta}, đợi Xung Mộ)`
        : `Suy nhược Nhập Nhật Mộ tại ${dayChi} (khí lực bế tắc trong Mộ: ${moDelta})`;
      moItems.push(msg);
      notes5.push(`${msg}.`);
      factors.push({
        code: 'nhap-nhat-mo',
        label: `Dụng Thần Nhập Nhật Mộ (${dayChi})`,
        delta: moDelta,
        category: 'void-tomb',
        lineIndex: dungLine.index,
      });
    }

    if (dungLine.isHoaMo) {
      total += SCORE.hoaMo;
      gl5.push('nhapMo');
      const msg = `Động Hóa Mộ: ${dungLine.chi} biến nhập Mộ tại ${dungLine.changedChi} (${SCORE.hoaMo})`;
      moItems.push(msg);
      notes5.push(`${msg}.`);
      factors.push({
        code: 'hoa-mo',
        label: `Dụng Thần Động Hóa Mộ (${dungLine.chi} → ${dungLine.changedChi})`,
        delta: SCORE.hoaMo,
        category: 'void-tomb',
        lineIndex: dungLine.index,
      });
    }

    if (dungLine.isNhapDongMo && movingTombLine) {
      total += SCORE.nhapDongMo;
      gl5.push('nhapMo');
      const msg = `Nhập Động Mộ: hào ${movingTombLine.index} (${movingTombLine.chi}) động thu Dụng Thần vào Mộ (${SCORE.nhapDongMo})`;
      moItems.push(msg);
      notes5.push(`${msg}.`);
      factors.push({
        code: 'nhap-dong-mo',
        label: `Nhập Động Mộ (hào ${movingTombLine.index} ${movingTombLine.chi})`,
        delta: SCORE.nhapDongMo,
        category: 'void-tomb',
        lineIndex: movingTombLine.index,
      });
    }

    if (dungLine.isHoaTuyet) {
      const tuyetDelta = dungLine.isHoiDauKhac ? -1 : SCORE.hoaTuyet;
      total += tuyetDelta;
      const msg = `Động Hóa Tuyệt: ${dungLine.chi} (${dungLine.element}) biến sang đất Tuyệt tại ${dungLine.changedChi} (${tuyetDelta})`;
      moItems.push(msg);
      notes5.push(`${msg}.`);
      factors.push({
        code: 'hoa-tuyet',
        label: `Dụng Thần Hóa Tuyệt (${dungLine.chi} → ${dungLine.changedChi})`,
        delta: tuyetDelta,
        category: 'void-tomb',
        lineIndex: dungLine.index,
      });
    }

    moDiagnostics = {
      tombChi,
      isNhapNhatMo: dungLine.isNhapNhatMo,
      isHoaMo: dungLine.isHoaMo,
      isNhapDongMo: dungLine.isNhapDongMo,
      isHoaTuyet: dungLine.isHoaTuyet,
      items: moItems,
      summaryVi: moItems.length
        ? moItems.join('; ')
        : `Dụng Thần không bị Nhập Mộ (kho ${tombChi || '?'}) hay Hóa Tuyệt.`,
    };

    steps.push({
      id: 'tuan-khong',
      title: 'Tuần Không & Mộ Khố',
      finding: notes5.join(' '),
      why: 'Tuần Không làm việc chưa thực; Nhập Mộ làm khí lực bị khóa kín — cả hai đều cần ngày Xung / Xuất để mở khóa.',
      refs: sanitizeRefs([
        dungLine.index,
        ...(movingTombLine ? [movingTombLine.index] : []),
      ]),
      glossary: [...new Set(gl5)],
    });
  }

  // ── Bổ sung Thế – Ứng theo bối cảnh chủ đề ────────────────────────────────
  const theUngRelation = analyzeTheUng(enrichedLines, resolvedKey, topic, topic.dungThan);
  if (theUngRelation && theUngRelation.delta !== 0) {
    total += theUngRelation.delta;
    factors.push({
      code: 'the-ung-context',
      label: `Tương quan Thế – Ứng (${theUngRelation.theChi} vs ${theUngRelation.ungChi})`,
      delta: theUngRelation.delta,
      category: 'the-ung',
      lineIndex: theUngRelation.theIndex,
    });
  }

  total = roundScore(total);

  // ── 6. Kết luận + Tính Ứng Kỳ tự động ─────────────────────────────────────
  const verdict = total >= VERDICT.cat ? 'cat' : total <= VERDICT.hung ? 'hung' : 'binh';
  const verdictLabel =
    total >= VERDICT.daiCat
      ? 'Đại Cát (rất thuận lợi, đắc thời đắc lực)'
      : verdict === 'cat'
      ? 'Cát (thuận lợi)'
      : total <= VERDICT.daiHung
      ? 'Đại Hung (nhiều lực cản lớn, cần phòng bị)'
      : verdict === 'hung'
      ? 'Hung (nhiều trở ngại)'
      : 'Bình (tùy diễn biến & nhân sự)';

  const verdictColor =
    verdict === 'cat' ? '#16a34a' : verdict === 'hung' ? '#dc2626' : '#d97706';

  const partialDiagnostics = {
    amDongLines,
    nhatPhaLines,
    xungKhoiLines,
    chainSummary,
    tamHopCucs,
    hopTruLines,
    moDiagnostics,
    phucPhiDetail,
    theUngRelation,
  };

  const ungKy = computeUngKy(result, {
    primaryDT: dungLine,
    advancedDiagnostics: partialDiagnostics,
    score: total,
    verdict,
  });

  const advancedDiagnostics = {
    ...partialDiagnostics,
    ungKy,
  };

  const topUngKyText = ungKy.candidateDates?.length
    ? ` Ứng kỳ gần nhất: ${ungKy.candidateDates
        .slice(0, 2)
        .map((d) => `${d.displayDate} (${d.canChiDay})`)
        .join(', ')}.`
    : '';

  const advice = !dungLine
    ? 'Dụng Thần khuyết vắng: nên tạm hoãn quyết định lớn, chờ thời điểm hoặc dữ kiện rõ ràng hơn.'
    : verdict === 'cat'
    ? `Dụng Thần ${dungThanName} đắc lực (${verdictLabel}): có thể chủ động triển khai theo kế hoạch.${
        dungLine.isTuanKhong || dungLine.isHopTru || dungLine.isNhapNhatMo || dungLine.isHoaMo
          ? ` Lưu ý tháo nút thắt "${ungKy.primaryRuleVi}" đúng mốc Ứng Kỳ để đạt trọn kết quả.`
          : topUngKyText
      }`
    : verdict === 'hung'
    ? `Dụng Thần ${dungThanName} đang chịu tổn thương (${verdictLabel}): nên thận trọng giữ mình, tránh mạo hiểm vội vàng; lưu tâm các mốc Ứng Kỳ để phòng ngừa rủi ro.`
    : `Thế quẻ đang giằng co (${verdictLabel}): kết quả phụ thuộc nhiều vào nỗ lực điều chỉnh nhân sự và nắm bắt đúng thời cơ Ứng Kỳ.${topUngKyText}`;

  const ketLuanGl = ['ungKy'];
  if (theUngRelation) ketLuanGl.push('the', 'ung');

  steps.push({
    id: 'ket-luan',
    title: 'Kết luận & Ứng Kỳ',
    finding:
      `Tổng điểm ${total}: ${verdictLabel}.` +
      (theUngRelation ? ` ${theUngRelation.summaryVi}` : '') +
      (ungKy.primaryRuleVi ? ` Pháp Ứng Kỳ: ${ungKy.primaryRuleVi}.${topUngKyText}` : ''),
    why: advice,
    refs: sanitizeRefs([
      ...(dungLine ? [dungLine.index] : []),
      ...(theUngRelation ? [theUngRelation.theIndex, theUngRelation.ungIndex] : []),
    ]),
    glossary: ketLuanGl,
  });

  return {
    topic: canonicalTopic,
    resolvedTopic: resolvedKey,
    topicLabel: topic.label,
    dungThan: topic.dungThan,
    dungThanName,
    dungLineIndex: dungLine?.index ?? null,
    dungThanLines: pick.candidates,
    primaryDT: dungLine,
    enrichedLines,
    steps,
    score: total,
    verdict,
    verdictLabel,
    verdictColor,
    factors,
    movingInteractions,
    advice,
    advancedDiagnostics,
    ungKy,
  };
}
