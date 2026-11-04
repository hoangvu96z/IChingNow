/**
 * tuViStarRating.js — Module Chấm Điểm 1–5 ⭐ & Đánh Giá 6 Phương Diện Cuộc Đời
 * TuViNow Monorepo Adapter
 */

import { buildYunxianOverlay } from './tuViZiweiModule.js';
import { anLaSoTuVi } from './tuViEngine.js';

function resolveEffectiveChartForRating(result, inputData = {}, yunxianState = null) {
  if (!result || !yunxianState) return result;
  const mode = yunxianState.mode;
  if (mode !== 'liunian' && mode !== 'liuyue') return result;

  const targetYear = yunxianState.viewYear !== undefined && yunxianState.viewYear !== null
    ? Number(yunxianState.viewYear)
    : null;
  if (!targetYear || !Number.isFinite(targetYear)) return result;
  if (result.viewYear === targetYear) return result;

  if (
    inputData &&
    Number.isInteger(inputData.yearCanIndex) &&
    Number.isInteger(inputData.yearChiIndex) &&
    Number.isInteger(inputData.lunarMonth) &&
    Number.isInteger(inputData.lunarDay) &&
    Number.isInteger(inputData.lunarHourIndex) &&
    Number.isInteger(inputData.gender) &&
    Number.isInteger(inputData.lunarYear) &&
    targetYear >= inputData.lunarYear
  ) {
    try {
      const viewYearCanIndex = ((targetYear - 4) % 10 + 10) % 10;
      const viewYearChiIndex = ((targetYear - 4) % 12 + 12) % 12;
      return anLaSoTuVi({
        ...inputData,
        viewYear: targetYear,
        namXem: targetYear,
        viewYearCanIndex,
        viewYearChiIndex,
      });
    } catch {
      return result;
    }
  }
  return result;
}

function palaceHasStarName(palace, targetStar) {
  if (!palace || !targetStar) return false;
  const all = [...(palace.chinhTinh || []), ...(palace.phuTinh || [])];
  return all.some((s) => {
    const clean = String(s).split('(')[0].trim();
    return clean === targetStar;
  });
}

export const STAR_BRIGHTNESS_DELTAS = {
  M: 0.65,
  V: 0.50,
  Đ: 0.30,
  B: 0.10,
  H: -0.45,
};

export const AUSPICIOUS_SECONDARY_STARS = [
  'Tả Phù',
  'Hữu Bật',
  'Thiên Khôi',
  'Thiên Việt',
  'Văn Xương',
  'Văn Khúc',
  'Thiên Mã',
  'Đào Hoa',
  'Hồng Loan',
  'Thiên Hỷ',
];

/**
 * Làm sạch tên cung, loại bỏ thẻ phụ như <THÂN>.
 */
export function cleanPalaceName(chucNang) {
  return String(chucNang || '').replace(/\s*<THÂN>/g, '').trim();
}

/**
 * Trả về chuỗi sao trực quan (ví dụ 4.5 -> '★★★★½', 4.0 -> '★★★★☆', 5.0 -> '★★★★★').
 */
export function renderStarsText(stars) {
  const numeric = typeof stars === 'number' ? stars : parseFloat(stars) || 0;
  const clamped = Math.max(0, Math.min(5, Math.round(numeric * 2) / 2));
  const fullStars = Math.floor(clamped);
  const hasHalf = (clamped % 1) >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(Math.max(0, emptyStars));
}

/**
 * Phân hạng sao thành cấp bậc và màu sắc trực quan:
 * - stars >= 4.5: 'Thượng Cát' (xanh ngọc / vàng kim)
 * - stars >= 4.0: 'Cát Lợi' (xanh lá)
 * - stars >= 3.5: 'Khá Tốt' (xanh dương)
 * - stars >= 3.0: 'Bình Hòa' (vàng cam)
 * - < 3.0: 'Cần Lưu Ý' (cam đỏ)
 */
export function getRatingTier(stars) {
  const num = typeof stars === 'number' ? stars : parseFloat(stars) || 0;
  if (num >= 4.5) {
    return {
      tierKey: 'thuong-cat',
      tierLabel: 'Thượng Cát',
      color: '#10b981',
      badgeClass: 'tier-thuong-cat',
    };
  }
  if (num >= 4.0) {
    return {
      tierKey: 'cat-loi',
      tierLabel: 'Cát Lợi',
      color: '#22c55e',
      badgeClass: 'tier-cat-loi',
    };
  }
  if (num >= 3.5) {
    return {
      tierKey: 'kha-tot',
      tierLabel: 'Khá Tốt',
      color: '#3b82f6',
      badgeClass: 'tier-kha-tot',
    };
  }
  if (num >= 3.0) {
    return {
      tierKey: 'binh-hoa',
      tierLabel: 'Bình Hòa',
      color: '#f59e0b',
      badgeClass: 'tier-binh-hoa',
    };
  }
  return {
    tierKey: 'can-luu-y',
    tierLabel: 'Cần Lưu Ý',
    color: '#ef4444',
    badgeClass: 'tier-can-luu-y',
  };
}

/**
 * Kiểm tra xem danh sách chính tinh có chứa sao Miếu hoặc Vượng không.
 */
function hasMieuVuongInStars(starList) {
  if (!Array.isArray(starList)) return false;
  return starList.some((s) => {
    const m = String(s).match(/\(([MVĐBH])\)/);
    return m && (m[1] === 'M' || m[1] === 'V');
  });
}

/**
 * Tính điểm đánh giá 1 cung số theo quy tắc:
 * - Điểm cơ sở 3.0.
 * - Độ sáng chính tinh tại cung (M: +0.65, V: +0.5, Đ: +0.3, B: +0.1, H: -0.45).
 *   Nếu Vô Chính Diệu: mượn chính tinh Xung Chiếu với hệ số 0.7, +0.35 nếu đắc Tuần/Triệt.
 * - Hội chiếu Tam Phương Tứ Chính: +0.25 nếu có Miếu/Vượng hoặc Hóa Lộc/Quyền/Khoa.
 * - Cát tinh & Tứ Hóa tốt tại cung:
 *   Hóa Lộc +0.55, Hóa Quyền +0.45, Hóa Khoa +0.45, Lộc Tồn +0.45,
 *   Tả/Hữu/Khôi/Việt/Xương/Khúc/Mã/Đào/Hồng/Hỷ: +0.2 mỗi sao, tối đa +1.0.
 * - Sát tinh & Hóa Kỵ tại cung:
 *   Hóa Kỵ -0.45, Không/Kiếp -0.4, Kình/Đà -0.35, Hỏa/Linh -0.3;
 *   nếu có Miếu/Vượng giảm 50% mức trừ.
 * - Giới hạn [2.0, 5.0], làm tròn 0.5.
 */
export function evaluatePalaceRating(palace, allPalaces = [], _result = null, yunxianContext = null) {
  if (!palace) return null;

  let score = 3.0;
  const chinhTinh = Array.isArray(palace.chinhTinh) ? palace.chinhTinh : [];
  const phuTinh = Array.isArray(palace.phuTinh) ? palace.phuTinh : [];
  const nonAnnualPhuTinh = phuTinh.filter((s) => !String(s).startsWith('L.'));
  const annualPhuTinh = phuTinh.filter((s) => String(s).startsWith('L.'));

  const isVoChinhDieu = chinhTinh.length === 0;
  let hasMieuVuong = false;

  // 1. Độ sáng chính tinh tại cung hoặc mượn cung xung chiếu
  if (!isVoChinhDieu) {
    hasMieuVuong = hasMieuVuongInStars(chinhTinh);
    for (const star of chinhTinh) {
      const m = String(star).match(/\(([MVĐBH])\)/);
      if (m && STAR_BRIGHTNESS_DELTAS[m[1]] !== undefined) {
        score += STAR_BRIGHTNESS_DELTAS[m[1]];
      }
    }
  } else {
    // Vô Chính Diệu: mượn đối cung
    const oppChiIndex = (palace.chiIndex + 6) % 12;
    const oppPalace = allPalaces.find((p) => p.chiIndex === oppChiIndex);
    if (oppPalace && Array.isArray(oppPalace.chinhTinh) && oppPalace.chinhTinh.length > 0) {
      hasMieuVuong = hasMieuVuongInStars(oppPalace.chinhTinh);
      for (const star of oppPalace.chinhTinh) {
        const m = String(star).match(/\(([MVĐBH])\)/);
        if (m && STAR_BRIGHTNESS_DELTAS[m[1]] !== undefined) {
          score += STAR_BRIGHTNESS_DELTAS[m[1]] * 0.7;
        }
      }
    }
    if (palace.isTuan || palace.isTriet) {
      score += 0.35;
    }
  }

  // 2. Hội chiếu Tam Phương Tứ Chính (Xung chiếu + 2 cung Tam hợp)
  const xungChiIndex = (palace.chiIndex + 6) % 12;
  const tamHop1 = (palace.chiIndex + 4) % 12;
  const tamHop2 = (palace.chiIndex + 8) % 12;
  const sanFangBranches = [xungChiIndex, tamHop1, tamHop2];

  let hasSanFangBonus = false;
  for (const b of sanFangBranches) {
    const p = allPalaces.find((item) => item.chiIndex === b);
    if (!p) continue;
    if (hasMieuVuongInStars(p.chinhTinh)) {
      hasSanFangBonus = true;
      break;
    }
    const pPhu = Array.isArray(p.phuTinh) ? p.phuTinh : [];
    if (pPhu.some((s) => s.includes('Hóa Lộc') || s.includes('Hóa Quyền') || s.includes('Hóa Khoa'))) {
      hasSanFangBonus = true;
      break;
    }
  }
  if (hasSanFangBonus) {
    score += 0.25;
  }

  // 3. Cát tinh & Tứ Hóa tốt tại cung
  if (nonAnnualPhuTinh.some((s) => s.includes('Hóa Lộc'))) score += 0.55;
  if (nonAnnualPhuTinh.some((s) => s.includes('Hóa Quyền'))) score += 0.45;
  if (nonAnnualPhuTinh.some((s) => s.includes('Hóa Khoa'))) score += 0.45;
  if (nonAnnualPhuTinh.some((s) => s.includes('Lộc Tồn'))) score += 0.45;

  let goodSecondaryCount = 0;
  for (const starName of AUSPICIOUS_SECONDARY_STARS) {
    if (nonAnnualPhuTinh.some((s) => String(s).split('(')[0].trim() === starName)) {
      goodSecondaryCount++;
    }
  }
  score += Math.min(1.0, goodSecondaryCount * 0.2);

  // 4. Sát tinh & Hóa Kỵ tại cung (Miếu/Vượng giảm 50% mức trừ)
  const penaltyFactor = hasMieuVuong ? 0.5 : 1.0;
  if (nonAnnualPhuTinh.some((s) => s.includes('Hóa Kỵ'))) {
    score -= 0.45 * penaltyFactor;
  }
  for (const s of nonAnnualPhuTinh) {
    const raw = String(s).split('(')[0].trim();
    if (raw === 'Địa Không' || raw === 'Địa Kiếp') {
      score -= 0.40 * penaltyFactor;
    } else if (raw === 'Kình Dương' || raw === 'Đà La') {
      score -= 0.35 * penaltyFactor;
    } else if (raw === 'Hỏa Tinh' || raw === 'Linh Tinh') {
      score -= 0.30 * penaltyFactor;
    }
  }

  // 4b. Tác động động của Vận Hạn (Đại Hạn / Lưu Niên / Lưu Nguyệt) lên cung vị
  let rotatedRole = null;
  const activeTransforms = [];
  if (yunxianContext && yunxianContext.mode && yunxianContext.mode !== 'mingpan') {
    const { mode, overlay } = yunxianContext;
    if (mode === 'daxian') {
      rotatedRole = overlay?.daXianPalaceMap?.[palace.chiIndex] || null;
    } else if (mode === 'liunian') {
      rotatedRole = overlay?.luuNienPalaceMap?.[palace.chiIndex] || null;
    } else if (mode === 'liuyue') {
      rotatedRole = overlay?.luuNguyetPalaceMap?.[palace.chiIndex] || null;
    }

    const activeLayers = [];
    if (mode === 'daxian') {
      if (overlay?.sihuaLayers?.daXian?.transforms) {
        activeLayers.push({ transforms: overlay.sihuaLayers.daXian.transforms, weight: 0.9, prefix: 'ĐH.' });
      }
    } else if (mode === 'liunian') {
      if (overlay?.sihuaLayers?.daXian?.transforms) {
        activeLayers.push({ transforms: overlay.sihuaLayers.daXian.transforms, weight: 0.45, prefix: 'ĐH.' });
      }
      if (overlay?.sihuaLayers?.liuNian?.transforms) {
        activeLayers.push({ transforms: overlay.sihuaLayers.liuNian.transforms, weight: 0.95, prefix: 'LN.' });
      }
    } else if (mode === 'liuyue') {
      if (overlay?.sihuaLayers?.daXian?.transforms) {
        activeLayers.push({ transforms: overlay.sihuaLayers.daXian.transforms, weight: 0.3, prefix: 'ĐH.' });
      }
      if (overlay?.sihuaLayers?.liuNian?.transforms) {
        activeLayers.push({ transforms: overlay.sihuaLayers.liuNian.transforms, weight: 0.5, prefix: 'LN.' });
      }
      if (overlay?.sihuaLayers?.liuYue?.transforms) {
        activeLayers.push({ transforms: overlay.sihuaLayers.liuYue.transforms, weight: 1.0, prefix: 'LNg.' });
      }
    }

    const sanFangPalaces = sanFangBranches
      .map((b) => allPalaces.find((item) => item.chiIndex === b))
      .filter(Boolean);

    for (const { transforms, weight, prefix } of activeLayers) {
      const locStar = transforms['Hóa Lộc'];
      const quyenStar = transforms['Hóa Quyền'];
      const khoaStar = transforms['Hóa Khoa'];
      const kyStar = transforms['Hóa Kỵ'];

      if (palaceHasStarName(palace, locStar)) {
        score += 0.65 * weight;
        activeTransforms.push(`${prefix}Lộc`);
      } else if (sanFangPalaces.some((sp) => palaceHasStarName(sp, locStar))) {
        score += 0.22 * weight;
      }

      if (palaceHasStarName(palace, quyenStar)) {
        score += 0.52 * weight;
        activeTransforms.push(`${prefix}Quyền`);
      } else if (sanFangPalaces.some((sp) => palaceHasStarName(sp, quyenStar))) {
        score += 0.18 * weight;
      }

      if (palaceHasStarName(palace, khoaStar)) {
        score += 0.50 * weight;
        activeTransforms.push(`${prefix}Khoa`);
      } else if (sanFangPalaces.some((sp) => palaceHasStarName(sp, khoaStar))) {
        score += 0.18 * weight;
      }

      if (palaceHasStarName(palace, kyStar)) {
        score -= 0.58 * weight * penaltyFactor;
        activeTransforms.push(`${prefix}Kỵ`);
      } else if (sanFangPalaces.some((sp) => palaceHasStarName(sp, kyStar))) {
        score -= 0.20 * weight * penaltyFactor;
      }
    }

    if (mode === 'liunian' || mode === 'liuyue') {
      const annualWeight = mode === 'liunian' ? 0.85 : 0.55;
      for (const s of annualPhuTinh) {
        const raw = String(s).trim();
        if (raw === 'L.Lộc Tồn') {
          score += 0.38 * annualWeight;
        } else if (raw === 'L.Thiên Mã' || raw === 'L.Thiên Khôi' || raw === 'L.Thiên Việt') {
          score += 0.25 * annualWeight;
        } else if (raw === 'L.Hồng Loan' || raw === 'L.Thiên Hỷ') {
          score += 0.20 * annualWeight;
        } else if (raw === 'L.Kình Dương' || raw === 'L.Đà La') {
          score -= 0.32 * annualWeight * penaltyFactor;
        } else if (raw === 'L.Bạch Hổ' || raw === 'L.Tang Môn' || raw === 'L.Thiên Khốc' || raw === 'L.Thiên Hư') {
          score -= 0.18 * annualWeight * penaltyFactor;
        }
      }
    }
  }

  // 5. Giới hạn [2.0, 5.0], làm tròn 0.5
  const rawScore = score;
  const clamped = Math.max(2.0, Math.min(5.0, rawScore));
  const stars = Math.round(clamped * 2) / 2;
  const score100 = Math.round(stars * 20);
  const tier = getRatingTier(stars);
  const starsText = renderStarsText(stars);

  // 6. Câu tóm tắt 1 dòng ngắn gọn, dễ hiểu
  const pName = cleanPalaceName(palace.chucNang);
  const transformSuffix = activeTransforms.length > 0 ? ` (Đang kích hoạt: ${activeTransforms.join(', ')})` : '';
  let summary = '';
  if (isVoChinhDieu) {
    if (palace.isTuan || palace.isTriet) {
      summary = `Cung ${pName} Vô Chính Diệu đắc Tuần/Triệt, mượn chính tinh xung chiếu vững vàng, trong thử thách tự tạo cơ đồ.${transformSuffix}`;
    } else {
      summary = `Cung ${pName} Vô Chính Diệu mượn chính tinh đối cung, cần dựa vào thực lực tích lũy và ngoại viện tam hợp.${transformSuffix}`;
    }
  } else {
    const starNames = chinhTinh.map((s) => String(s).split('(')[0].trim()).join(', ');
    if (stars >= 4.5) {
      summary = `Chính tinh ${starNames} tọa thủ đắc cách, cát tinh hội tụ hanh thông, là điểm sáng rực rỡ của lá số.${transformSuffix}`;
    } else if (stars >= 4.0) {
      summary = `Chính tinh ${starNames} thế cung cát lợi, khí sắc vững vàng, trợ lực phát triển thuận lợi bền bỉ.${transformSuffix}`;
    } else if (stars >= 3.5) {
      summary = `Chính tinh ${starNames} tương đối ổn định, giữ tâm thế vững và phát huy sở trường sẽ đạt kết quả tốt.${transformSuffix}`;
    } else if (stars >= 3.0) {
      summary = `Chính tinh ${starNames} ở thế bình hòa, cần kiên trì bồi đắp nền tảng và chủ động đón nhận cơ hội.${transformSuffix}`;
    } else {
      summary = `Chính tinh ${starNames} gặp sát tinh xung hội, cần bình tĩnh, rèn luyện tính kiên nhẫn để hóa giải thử thách.${transformSuffix}`;
    }
  }

  return {
    palaceName: pName,
    rawPalaceName: palace.chucNang,
    rotatedRole,
    activeTransforms,
    chiIndex: palace.chiIndex,
    chiName: palace.chiName,
    canName: palace.canName,
    stars,
    starsText,
    score100,
    rawScore,
    tierKey: tier.tierKey,
    tierLabel: tier.tierLabel,
    tierColor: tier.color,
    badgeClass: tier.badgeClass,
    summary,
    isVoChinhDieu,
    chinhTinh,
    hasMieuVuong,
    isTuan: Boolean(palace.isTuan),
    isTriet: Boolean(palace.isTriet),
    isMenh: Boolean(palace.isMenh),
    isThan: Boolean(palace.isThan),
  };
}

/**
 * Trích xuất ngũ hành từ Nạp Âm Bản Mệnh ('Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ').
 */
export function extractElementFromNapAm(napAm) {
  const str = String(napAm || '');
  if (str.includes('Kim')) return 'Kim';
  if (str.includes('Mộc')) return 'Mộc';
  if (str.includes('Thủy')) return 'Thủy';
  if (str.includes('Hỏa')) return 'Hỏa';
  if (str.includes('Thổ')) return 'Thổ';
  return null;
}

/**
 * Trích xuất ngũ hành từ Tên Cục ('Mộc Tam Cục' -> 'Mộc', etc.).
 */
export function extractElementFromCucName(cucName) {
  const str = String(cucName || '');
  if (str.includes('Kim')) return 'Kim';
  if (str.includes('Mộc')) return 'Mộc';
  if (str.includes('Thủy')) return 'Thủy';
  if (str.includes('Hỏa')) return 'Hỏa';
  if (str.includes('Thổ')) return 'Thổ';
  return null;
}

/**
 * Xác định mối quan hệ Mệnh Cục.
 */
export function getElementRelation(cucElement, menhElement) {
  if (!cucElement || !menhElement) return null;
  if (cucElement === menhElement) return 'Mệnh Cục Tỷ Hòa';

  const sinh = {
    Thủy: 'Mộc',
    Mộc: 'Hỏa',
    Hỏa: 'Thổ',
    Thổ: 'Kim',
    Kim: 'Thủy',
  };

  const khac = {
    Thủy: 'Hỏa',
    Hỏa: 'Kim',
    Kim: 'Mộc',
    Mộc: 'Thổ',
    Thổ: 'Thủy',
  };

  if (sinh[cucElement] === menhElement) return 'Cục Sinh Mệnh';
  if (sinh[menhElement] === cucElement) return 'Mệnh Sinh Cục';
  if (khac[menhElement] === cucElement) return 'Mệnh Khắc Cục';
  if (khac[cucElement] === menhElement) return 'Cục Khắc Mệnh';
  return null;
}

/**
 * Tìm đánh giá cung theo tên chức năng gốc hoặc tên cung xoay vận hạn (ĐH.* / LN.* / LNg.*).
 */
function findRatingByPalaceName(ratings, targetName, rotatedSuffix = null) {
  if (rotatedSuffix) {
    const rotFound = ratings.find(
      (r) => r.rotatedRole && r.rotatedRole.endsWith(`.${rotatedSuffix}`)
    );
    if (rotFound) return rotFound;
  }
  const found = ratings.find((r) => r.palaceName === targetName || r.palaceName.includes(targetName));
  return found || { rawScore: 3.0, stars: 3.0, score100: 60, tierLabel: 'Bình Hòa' };
}

function evaluateTatAchSafety(palace, includeAnnual = false) {
  let healthSafety = 3.5;
  if (!palace) return healthSafety;
  const allTatAchStars = [
    ...(palace.chinhTinh || []),
    ...(palace.phuTinh || []).filter((s) => includeAnnual || !String(s).startsWith('L.')),
  ];
  if (allTatAchStars.some((s) => s.includes('Hóa Khoa'))) healthSafety += 0.5;
  if (allTatAchStars.some((s) => s.includes('Thiên Lương'))) healthSafety += 0.5;
  if (allTatAchStars.some((s) => s.includes('Thiên Đồng'))) healthSafety += 0.4;
  if (palace.isTuan || palace.isTriet) healthSafety += 0.4;
  if (allTatAchStars.some((s) => s.includes('Bác Sỹ') || s.includes('Ân Quang') || s.includes('Thiên Quý'))) {
    healthSafety += 0.25;
  }
  for (const s of allTatAchStars) {
    const raw = String(s).split('(')[0].trim().replace(/^L\./, '');
    if (raw === 'Địa Không' || raw === 'Địa Kiếp') healthSafety -= 0.35;
    else if (raw === 'Kình Dương' || raw === 'Đà La') healthSafety -= 0.30;
    else if (raw === 'Hỏa Tinh' || raw === 'Linh Tinh' || raw === 'Hóa Kỵ') healthSafety -= 0.25;
    else if (raw === 'Bạch Hổ' || raw === 'Tang Môn' || raw === 'Thiên Khốc' || raw === 'Thiên Hư') healthSafety -= 0.15;
  }
  return Math.max(2.0, Math.min(5.0, healthSafety));
}

/**
 * Đánh giá 6 phương diện cuộc đời:
 * 1. career — Công Danh & Sự Nghiệp (Quan Lộc 55% + Mệnh 30% + Tài Bạch 15%)
 * 2. wealth — Tài Lộc & Điền Sản (Tài Bạch 55% + Điền Trạch 30% + Phúc Đức 15%)
 * 3. love — Tình Duyên & Gia Đạo (Phu Thê 55% + Tử Tức 25% + Phúc Đức 20%)
 * 4. fortune — Phúc Đức & Nội Tâm (Phúc Đức 55% + Mệnh 30% + Âm Dương/Mệnh Cục thuận lý 15%)
 * 5. social — Quý Nhân & Xã Giao (Thiên Di 55% + Nô Bộc 30% + Huynh Đệ 15%)
 * 6. health — Sức Khỏe & Bình An (Tật Ách an toàn + Mệnh)
 *
 * Khi yunxianContext (daxian / liunian / liuyue) được truyền vào, điểm 6 phương diện sẽ
 * kết hợp cung xoay chiều của kỳ hạn đang chọn (70% trọng số ứng kỳ) với cung gốc Bản Mệnh (30% trọng số nền tảng).
 */
export function evaluateSixLifeAspects(result, palaceRatings, yunxianContext = null, natalAspects = null) {
  const isDynamic = Boolean(yunxianContext && yunxianContext.mode && yunxianContext.mode !== 'mingpan');

  const menhNatal = findRatingByPalaceName(palaceRatings, 'Mệnh');
  const quanLocNatal = findRatingByPalaceName(palaceRatings, 'Quan Lộc');
  const taiBachNatal = findRatingByPalaceName(palaceRatings, 'Tài Bạch');
  const dienTrachNatal = findRatingByPalaceName(palaceRatings, 'Điền Trạch');
  const phucDucNatal = findRatingByPalaceName(palaceRatings, 'Phúc Đức');
  const phuTheNatal = findRatingByPalaceName(palaceRatings, 'Phu Thê');
  const tuTucNatal = findRatingByPalaceName(palaceRatings, 'Tử Tức');
  const thienDiNatal = findRatingByPalaceName(palaceRatings, 'Thiên Di');
  const noBocNatal = findRatingByPalaceName(palaceRatings, 'Nô Bộc');
  const huynhDeNatal = findRatingByPalaceName(palaceRatings, 'Huynh Đệ');
  const tatAchNatalPalace = (result?.palates || []).find((p) => cleanPalaceName(p.chucNang) === 'Tật Ách');

  const menhRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Mệnh', 'Mệnh') : menhNatal;
  const quanLocRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Quan Lộc', 'Quan') : quanLocNatal;
  const taiBachRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Tài Bạch', 'Tài') : taiBachNatal;
  const dienTrachRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Điền Trạch', 'Điền') : dienTrachNatal;
  const phucDucRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Phúc Đức', 'Phúc') : phucDucNatal;
  const phuTheRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Phu Thê', 'Phối') : phuTheNatal;
  const tuTucRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Tử Tức', 'Tử') : tuTucNatal;
  const thienDiRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Thiên Di', 'Di') : thienDiNatal;
  const noBocRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Nô Bộc', 'Nô') : noBocNatal;
  const huynhDeRot = isDynamic ? findRatingByPalaceName(palaceRatings, 'Huynh Đệ', 'Huynh') : huynhDeNatal;
  const tatAchRotRating = isDynamic ? findRatingByPalaceName(palaceRatings, 'Tật Ách', 'Tật') : null;
  const tatAchRotPalace = tatAchRotRating
    ? (result?.palates || []).find((p) => p.chiIndex === tatAchRotRating.chiIndex)
    : tatAchNatalPalace;

  const blend = (rotVal, natalVal) => (isDynamic ? rotVal * 0.72 + natalVal * 0.28 : natalVal);

  // 1. Career
  const careerNatalRaw = quanLocNatal.rawScore * 0.55 + menhNatal.rawScore * 0.30 + taiBachNatal.rawScore * 0.15;
  const careerRotRaw = quanLocRot.rawScore * 0.55 + menhRot.rawScore * 0.30 + taiBachRot.rawScore * 0.15;
  const careerRaw = blend(careerRotRaw, careerNatalRaw);

  // 2. Wealth
  const wealthNatalRaw = taiBachNatal.rawScore * 0.55 + dienTrachNatal.rawScore * 0.30 + phucDucNatal.rawScore * 0.15;
  const wealthRotRaw = taiBachRot.rawScore * 0.55 + dienTrachRot.rawScore * 0.30 + phucDucRot.rawScore * 0.15;
  const wealthRaw = blend(wealthRotRaw, wealthNatalRaw);

  // 3. Love
  const loveNatalRaw = phuTheNatal.rawScore * 0.55 + tuTucNatal.rawScore * 0.25 + phucDucNatal.rawScore * 0.20;
  const loveRotRaw = phuTheRot.rawScore * 0.55 + tuTucRot.rawScore * 0.25 + phucDucRot.rawScore * 0.20;
  const loveRaw = blend(loveRotRaw, loveNatalRaw);

  // 4. Fortune
  let thuanLyScore = 3.5;
  if (result?.isThuan) thuanLyScore += 0.5;
  const menhEl = extractElementFromNapAm(result?.banMenhNapAm);
  const cucEl = extractElementFromCucName(result?.cucName);
  const rel = getElementRelation(cucEl, menhEl);
  if (rel === 'Cục Sinh Mệnh') thuanLyScore += 0.6;
  else if (rel === 'Mệnh Cục Tỷ Hòa') thuanLyScore += 0.4;
  else if (rel === 'Mệnh Sinh Cục') thuanLyScore += 0.2;
  else if (rel === 'Cục Khắc Mệnh') thuanLyScore -= 0.4;
  const clampedThuanLy = Math.max(2.0, Math.min(5.0, thuanLyScore));
  const fortuneNatalRaw = phucDucNatal.rawScore * 0.55 + menhNatal.rawScore * 0.30 + clampedThuanLy * 0.15;
  const fortuneRotRaw = phucDucRot.rawScore * 0.55 + menhRot.rawScore * 0.30 + clampedThuanLy * 0.15;
  const fortuneRaw = blend(fortuneRotRaw, fortuneNatalRaw);

  // 5. Social
  const socialNatalRaw = thienDiNatal.rawScore * 0.55 + noBocNatal.rawScore * 0.30 + huynhDeNatal.rawScore * 0.15;
  const socialRotRaw = thienDiRot.rawScore * 0.55 + noBocRot.rawScore * 0.30 + huynhDeRot.rawScore * 0.15;
  const socialRaw = blend(socialRotRaw, socialNatalRaw);

  // 6. Health
  const natalHealthSafety = evaluateTatAchSafety(tatAchNatalPalace, false);
  const rotHealthSafety = isDynamic
    ? evaluateTatAchSafety(tatAchRotPalace, yunxianContext.mode === 'liunian' || yunxianContext.mode === 'liuyue') * 0.65 +
      (tatAchRotRating ? tatAchRotRating.rawScore * 0.35 : natalHealthSafety * 0.35)
    : natalHealthSafety;
  const healthNatalRaw = natalHealthSafety * 0.65 + menhNatal.rawScore * 0.35;
  const healthRotRaw = rotHealthSafety * 0.65 + menhRot.rawScore * 0.35;
  const healthRaw = blend(healthRotRaw, healthNatalRaw);

  const aspectConfigs = [
    {
      id: 'career',
      shortName: 'Sự Nghiệp',
      name: 'Công Danh & Sự Nghiệp',
      icon: '💼',
      raw: careerRaw,
      rotatedFocus: isDynamic && quanLocRot?.rotatedRole ? `${quanLocRot.rotatedRole} tại ${quanLocRot.chiName} (${quanLocRot.palaceName})` : null,
      getComment: (s) =>
        s >= 4.5
          ? 'Công danh rộng mở, có cơ hội thăng tiến và khẳng định uy tín vững chắc trong sự nghiệp.'
          : s >= 4.0
            ? 'Sự nghiệp tiến triển thuận lợi, dễ gặt hái thành quả tốt khi chuyên tâm theo đuổi mục tiêu.'
            : s >= 3.5
              ? 'Công việc tiến triển ổn định, làm việc kiên trì và tích lũy sẽ đạt vị trí xứng đáng.'
              : s >= 3.0
                ? 'Sự nghiệp ở mức bình hòa, nên trau dồi chuyên môn và cẩn trọng trước các bước chuyển đổi.'
                : 'Sự nghiệp có lúc biến động, nên làm việc thận trọng và chuẩn bị kế hoạch dự phòng dài hạn.',
    },
    {
      id: 'wealth',
      shortName: 'Tài Lộc',
      name: 'Tài Lộc & Điền Sản',
      icon: '💰',
      raw: wealthRaw,
      rotatedFocus: isDynamic && taiBachRot?.rotatedRole ? `${taiBachRot.rotatedRole} tại ${taiBachRot.chiName} (${taiBachRot.palaceName})` : null,
      getComment: (s) =>
        s >= 4.5
          ? 'Tài vận dồi dào hanh thông, có duyên tụ tài và khả năng gầy dựng điền sản hưng thịnh.'
          : s >= 4.0
            ? 'Tài chính vững vàng, nguồn thu mở rộng, có cơ hội gia tăng tích lũy tài sản tốt.'
            : s >= 3.5
              ? 'Tài chính ổn định, thu chi cân đối, của cải tích lũy bền vững theo thời gian.'
              : s >= 3.0
                ? 'Tiền bạc bình ổn đủ dùng, cần quản lý chi tiêu hợp lý để tránh thất thoát.'
                : 'Nên cẩn trọng trong đầu tư, hạn chế các quyết định mạo hiểm khi chưa nắm chắc thông tin.',
    },
    {
      id: 'love',
      shortName: 'Tình Duyên',
      name: 'Tình Duyên & Gia Đạo',
      icon: '💕',
      raw: loveRaw,
      rotatedFocus: isDynamic && phuTheRot?.rotatedRole ? `${phuTheRot.rotatedRole} tại ${phuTheRot.chiName} (${phuTheRot.palaceName})` : null,
      getComment: (s) =>
        s >= 4.5
          ? 'Tình cảm thấu hiểu hài hòa, bạn đời là chỗ dựa tinh thần và đồng hành tin cậy trọn đời.'
          : s >= 4.0
            ? 'Gia đạo êm ấm vui tươi, đời sống hôn nhân thuận hòa và hỗ trợ nhau cùng tiến bộ.'
            : s >= 3.5
              ? 'Gia đạo yên vui, hai bên biết lắng nghe và cùng nhau vun đắp hạnh phúc gia đình.'
              : s >= 3.0
                ? 'Tình duyên bình hòa, cần dành thêm thời gian chia sẻ để duy trì sự gắn kết ấm áp.'
                : 'Cần hạ bớt cái tôi, lắng nghe và thấu cảm nhiều hơn để giữ hòa khí trong đời sống tình cảm.',
    },
    {
      id: 'fortune',
      shortName: 'Phúc Đức',
      name: 'Phúc Đức & Nội Tâm',
      icon: '🌿',
      raw: fortuneRaw,
      rotatedFocus: isDynamic && phucDucRot?.rotatedRole ? `${phucDucRot.rotatedRole} tại ${phucDucRot.chiName} (${phucDucRot.palaceName})` : null,
      getComment: (s) =>
        s >= 4.5
          ? 'Phúc đức dày dặn, tâm hồn thanh thản an lạc, gặp hung hóa cát nhờ năng lượng thiện lành bền bỉ.'
          : s >= 4.0
            ? 'Nội tâm an ổn vững vàng, luôn tìm thấy điểm tựa bình yên và niềm vui trong cuộc sống.'
            : s >= 3.5
              ? 'Tâm thế bình an, cuộc sống thanh thản, giữ tâm thiện lành sẽ luôn đón nhận nhiều may mắn.'
              : s >= 3.0
                ? 'Nội tâm đôi lúc còn suy tư, nên dành thời gian tĩnh tâm và nuôi dưỡng lòng biết ơn.'
                : 'Nên chú trọng tu dưỡng tâm tính, hướng thiện và tích lũy phúc đức cho bản thân và gia đình.',
    },
    {
      id: 'social',
      shortName: 'Quý Nhân',
      name: 'Quý Nhân & Xã Giao',
      icon: '🤝',
      raw: socialRaw,
      rotatedFocus: isDynamic && thienDiRot?.rotatedRole ? `${thienDiRot.rotatedRole} tại ${thienDiRot.chiName} (${thienDiRot.palaceName})` : null,
      getComment: (s) =>
        s >= 4.5
          ? 'Quý nhân nâng đỡ, đối tác và bạn hữu trợ lực đắc lực, ra ngoài mưu sự dễ gặp vận may lớn.'
          : s >= 4.0
            ? 'Mối quan hệ bạn bè rộng rãi, dễ tạo được thiện cảm và nhận được sự giúp đỡ khi cần thiết.'
            : s >= 3.5
              ? 'Giao tiếp hòa nhã, các mối quan hệ xã hội thuận hòa và tạo môi trường làm việc dễ chịu.'
              : s >= 3.0
                ? 'Mạng lưới bạn bè ở mức vừa đủ, nên mở rộng giao lưu và chọn người tin cậy để đồng hành.'
                : 'Nên cẩn trọng trong hợp tác, chọn bạn chân thành và giữ khoảng cách an toàn với người mới quen.',
    },
    {
      id: 'health',
      shortName: 'Sức Khỏe',
      name: 'Sức Khỏe & Bình An',
      icon: '❤️‍🩹',
      raw: healthRaw,
      rotatedFocus: isDynamic && tatAchRotRating?.rotatedRole ? `${tatAchRotRating.rotatedRole} tại ${tatAchRotRating.chiName} (${tatAchRotRating.palaceName})` : null,
      getComment: (s) =>
        s >= 4.5
          ? 'Sức khỏe dồi dào, thân tâm an ổn, có sao cứu giải bảo vệ trước đau ốm và tai ương.'
          : s >= 4.0
            ? 'Thể lực tốt, khả năng hồi phục nhanh, duy trì sinh hoạt điều độ sẽ rất trường thọ.'
            : s >= 3.5
              ? 'Thể trạng tương đối tốt, chỉ cần duy trì lối sống lành mạnh và tập luyện thể thao đều đặn.'
              : s >= 3.0
                ? 'Sức khỏe bình thường, cần chú ý giấc ngủ và chế độ dinh dưỡng để tránh mệt mỏi.'
                : 'Cần chú ý chăm sóc thân thể, nghỉ ngơi điều độ và khám sức khỏe định kỳ để phòng ngừa.',
    },
  ];

  return aspectConfigs.map((cfg) => {
    const clamped = Math.max(2.0, Math.min(5.0, cfg.raw));
    const stars = Math.round(clamped * 2) / 2;
    const score100 = Math.round(stars * 20);
    const tier = getRatingTier(stars);
    const natalItem = Array.isArray(natalAspects) ? natalAspects.find((n) => n.id === cfg.id) : null;
    const natalStars = natalItem ? natalItem.stars : stars;
    const deltaStars = Math.round((stars - natalStars) * 10) / 10;

    return {
      id: cfg.id,
      shortName: cfg.shortName,
      name: cfg.name,
      icon: cfg.icon,
      rawScore: cfg.raw,
      stars,
      starsText: renderStarsText(stars),
      score100,
      natalStars,
      deltaStars,
      rotatedFocus: cfg.rotatedFocus,
      tierKey: tier.tierKey,
      tierLabel: tier.tierLabel,
      tierColor: tier.color,
      badgeClass: tier.badgeClass,
      comment: cfg.getComment(stars),
    };
  });
}

/**
 * Đánh giá vận hạn đang chọn trên lá số (Bản Mệnh, Đại Hạn, Lưu Niên, Lưu Nguyệt).
 */
export function evaluateActiveYunxianRating(result, inputData, yunxianState, palaceRatings = []) {
  const mode = yunxianState?.mode || (result?.viewYear ? 'liunian' : 'mingpan');
  const overlay = buildYunxianOverlay(result, {
    mode,
    daXianChiIndex: yunxianState?.daXianChiIndex,
    viewYear: yunxianState?.viewYear || result?.viewYear,
    lunarMonth: yunxianState?.lunarMonth || 1,
  });

  const palates = result?.palates || [];
  const menhPalace = palates.find((p) => p.isMenh) || palates[0];
  const menhRating = palaceRatings.find((r) => r.isMenh) || palaceRatings[0] || {
    stars: 3.5,
    score100: 70,
    tierLabel: 'Khá Tốt',
    tierColor: '#3b82f6',
    badgeClass: 'tier-kha-tot',
    summary: 'Chủ Mệnh ổn định, tích lũy nội lực bền vững.',
  };

  if (mode === 'mingpan') {
    return {
      mode: 'mingpan',
      modeLabel: 'Bản Mệnh',
      title: 'Bản Mệnh Trọn Đời',
      stars: menhRating.stars,
      starsText: renderStarsText(menhRating.stars),
      score100: menhRating.score100,
      tierLabel: menhRating.tierLabel,
      tierColor: menhRating.tierColor,
      badgeClass: menhRating.badgeClass,
      highlights: [
        `Chủ Mệnh ngụ tại cung ${menhPalace?.chiName || ''} (${menhPalace?.chinhTinh?.join(', ') || 'Vô Chính Diệu'}): Nền tảng cốt lõi định hình phẩm chất và năng lượng sống.`,
        menhRating.summary,
        'Chiến lược dài hạn: Phát huy tối đa sở trường cốt lõi, giữ gìn phúc đức và kiên định với mục tiêu đã định.',
      ],
    };
  }

  if (mode === 'daxian') {
    const adx = overlay?.activeDaXian;
    const targetChi = adx ? adx.chiIndex : (menhPalace?.chiIndex || 0);
    const pRating = palaceRatings.find((p) => p.chiIndex === targetChi) || menhRating;
    const p = palates.find((x) => x.chiIndex === targetChi);
    const title = adx
      ? `Đại Hạn ${adx.startAge}–${adx.endAge} tuổi (${adx.chiName} · Cung ${adx.natalChucNang})`
      : 'Đại Hạn 10 Năm';

    return {
      mode: 'daxian',
      modeLabel: 'Đại Hạn',
      title,
      stars: pRating.stars,
      starsText: renderStarsText(pRating.stars),
      score100: pRating.score100,
      tierLabel: pRating.tierLabel,
      tierColor: pRating.tierColor,
      badgeClass: pRating.badgeClass,
      highlights: [
        `Chặng đường 10 năm chuyển vận vào cung ${p?.chiName || ''} (${cleanPalaceName(p?.chucNang)}), mở ra cơ hội và thách thức mới.`,
        `Thời vận đại hạn: ${pRating.summary}`,
        pRating.stars >= 4.0
          ? 'Định hướng 10 năm: Thời cơ vàng để bứt phá quy mô, tự tin triển khai các dự định lớn và mở rộng quan hệ.'
          : pRating.stars >= 3.5
            ? 'Định hướng 10 năm: Tiến bước vững chắc, tập trung rèn luyện chuyên môn và củng cố nền tảng kinh tế.'
            : 'Định hướng 10 năm: Giữ thế chủ động phòng thủ, kiểm soát rủi ro tài chính và chú ý sức khỏe.',
      ],
    };
  }

  if (mode === 'liunian') {
    const vYear = Number(yunxianState?.viewYear || result?.viewYear || new Date().getFullYear());
    const liuNianLayer = overlay?.sihuaLayers?.liuNian || overlay?.liuNianSiHua;
    const targetChi = liuNianLayer?.branchIndex ?? (((vYear - 4) % 12 + 12) % 12);
    const pRating = palaceRatings.find((p) => p.chiIndex === targetChi) || menhRating;
    const p = palates.find((x) => x.chiIndex === targetChi);
    const stemName = liuNianLayer?.stemName || '';
    const branchName = liuNianLayer?.branchName || '';
    const yearCanChi = stemName && branchName ? ` (${stemName} ${branchName})` : '';
    const title = `Lưu Niên Năm ${vYear}${yearCanChi}`.trim();

    return {
      mode: 'liunian',
      modeLabel: 'Lưu Niên',
      title,
      stars: pRating.stars,
      starsText: renderStarsText(pRating.stars),
      score100: pRating.score100,
      tierLabel: pRating.tierLabel,
      tierColor: pRating.tierColor,
      badgeClass: pRating.badgeClass,
      highlights: [
        `Vận trình năm ${vYear} nhập cung ${p?.chiName || ''} (${cleanPalaceName(p?.chucNang)}), tuổi âm ${result?.tuoiAm ? result.tuoiAm + (vYear - (result.viewYear || vYear)) : ''} tuổi.`,
        `Khí vận lưu niên: ${pRating.summary}`,
        pRating.stars >= 4.0
          ? 'Lời khuyên năm: Khí vận hanh thông, thích hợp triển khai kế hoạch mới và đón nhận cơ hội thăng tiến.'
          : pRating.stars >= 3.5
            ? 'Lời khuyên năm: Năm bình hòa ổn định, kiên trì theo đuổi lộ trình hiện tại và tích lũy kinh nghiệm.'
            : 'Lời khuyên năm: Thận trọng trong chi tiêu và đi lại, dĩ hòa vi quý trong các mối quan hệ.',
      ],
    };
  }

  // mode === 'liuyue'
  const lMonth = Number(yunxianState?.lunarMonth || 1);
  const liuYueLayer = overlay?.sihuaLayers?.liuYue || overlay?.liuYueSiHua;
  const targetChi = liuYueLayer?.branchIndex ?? (((lMonth + 1) % 12 + 12) % 12);
  const pRating = palaceRatings.find((p) => p.chiIndex === targetChi) || menhRating;
  const p = palates.find((x) => x.chiIndex === targetChi);
  const monthStem = liuYueLayer?.stemName || '';
  const monthBranch = liuYueLayer?.branchName || '';
  const monthCanChi = monthStem && monthBranch ? ` (${monthStem} ${monthBranch})` : '';
  const title = `Lưu Nguyệt Tháng ${lMonth} Âm Lịch${monthCanChi}`.trim();

  return {
    mode: 'liuyue',
    modeLabel: 'Lưu Nguyệt',
    title,
    stars: pRating.stars,
    starsText: renderStarsText(pRating.stars),
    score100: pRating.score100,
    tierLabel: pRating.tierLabel,
    tierColor: pRating.tierColor,
    badgeClass: pRating.badgeClass,
    highlights: [
      `Tiết khí tháng ${lMonth} Âm Lịch chiếu cung ${p?.chiName || ''} (${cleanPalaceName(p?.chucNang)}).`,
      `Biến chuyển trong tháng: ${pRating.summary}`,
      pRating.stars >= 4.0
        ? 'Lời khuyên tháng: Tháng nhiều năng lượng tích cực, nên chủ động giải quyết công việc trọng điểm.'
        : 'Lời khuyên tháng: Giữ nhịp sinh hoạt điều độ, cân nhắc kỹ lưỡng trong các khoản chi tiêu phát sinh.',
    ],
  };
}

/**
 * Hàm tổng hợp trả về toàn bộ điểm số, đánh giá 6 phương diện, 12 cung và vận hạn đang kích hoạt.
 */
export function buildChartStarEvaluation(result, inputData, yunxianState) {
  if (!result || !Array.isArray(result.palates)) return null;

  const effectiveResult = resolveEffectiveChartForRating(result, inputData, yunxianState);
  const palates = effectiveResult.palates;
  const mode = yunxianState?.mode || (effectiveResult?.viewYear ? 'liunian' : 'mingpan');
  const isDynamic = mode !== 'mingpan';

  const overlay = buildYunxianOverlay(effectiveResult, {
    mode,
    daXianChiIndex: yunxianState?.daXianChiIndex,
    viewYear: yunxianState?.viewYear || effectiveResult?.viewYear,
    lunarMonth: yunxianState?.lunarMonth || 1,
    schoolConfig: inputData?.schoolConfig,
    birthYear: inputData?.lunarYear,
  });

  // 1. Natal baseline (Bản Mệnh gốc)
  const natalPalaceRatings = palates.map((p) => evaluatePalaceRating(p, palates, effectiveResult, null));
  const natalAspects = evaluateSixLifeAspects(effectiveResult, natalPalaceRatings, null, null);
  const natalAspectSum = natalAspects.reduce((sum, a) => sum + a.stars, 0);
  const natalAvgRaw = natalAspectSum / natalAspects.length;
  const natalStars = Math.round(natalAvgRaw * 2) / 2;
  const natalScore = Math.round(natalAvgRaw * 10) / 10;

  // 2. Active period evaluation (Bản Mệnh / Đại Hạn / Lưu Niên / Lưu Nguyệt)
  const yunxianContext = isDynamic ? { mode, overlay } : null;
  const palaceRatings = isDynamic
    ? palates.map((p) => evaluatePalaceRating(p, palates, effectiveResult, yunxianContext))
    : natalPalaceRatings;
  const aspects = isDynamic
    ? evaluateSixLifeAspects(effectiveResult, palaceRatings, yunxianContext, natalAspects)
    : natalAspects;
  const activeYunxian = evaluateActiveYunxianRating(effectiveResult, inputData, yunxianState, palaceRatings);

  // Overall score: trung bình cộng của 6 phương diện
  const aspectSum = aspects.reduce((sum, a) => sum + a.stars, 0);
  const avgStarsRaw = aspectSum / aspects.length;
  const overallStars = Math.round(avgStarsRaw * 2) / 2;
  const overallScore = Math.round(avgStarsRaw * 10) / 10;
  const overallScore100 = Math.round(overallStars * 20);
  const overallTier = getRatingTier(overallStars);
  const deltaScore = Math.round((overallScore - natalScore) * 10) / 10;

  // Top strengths (top 2 phương diện điểm cao nhất)
  const sortedAspects = [...aspects].sort((a, b) => b.stars - a.stars || b.rawScore - a.rawScore);
  const topStrengths = sortedAspects.slice(0, 2).map((a) => ({
    name: a.name,
    icon: a.icon,
    stars: a.stars,
    starsText: a.starsText,
    rotatedFocus: a.rotatedFocus || null,
    summary: a.comment,
  }));

  // Lời khuyên trọng tâm theo kỳ vận hạn đang xem
  const lowestAspect = sortedAspects[sortedAspects.length - 1];
  const periodPrefix = isDynamic && activeYunxian?.title ? `Trong ${activeYunxian.title}: ` : '';
  const coreAdvice = `${periodPrefix}Phát huy tối đa ưu thế ở ${sortedAspects[0].name.toLowerCase()} và ${sortedAspects[1].name.toLowerCase()}, đồng thời dành sự quan tâm chu toàn cho ${lowestAspect.name.toLowerCase()} để mọi phương diện luôn hài hòa viên mãn.`;

  // Nhãn nhanh
  const quickTags = [];
  if (effectiveResult.isThuan !== undefined) {
    quickTags.push(effectiveResult.isThuan ? 'Âm Dương Thuận Lý' : 'Âm Dương Nghịch Lý');
  }
  const menhEl = extractElementFromNapAm(effectiveResult.banMenhNapAm);
  const cucEl = extractElementFromCucName(effectiveResult.cucName);
  if (menhEl && cucEl) {
    const relation = getElementRelation(cucEl, menhEl);
    if (relation) quickTags.push(relation);
  }
  if (effectiveResult.banMenhNapAm) {
    quickTags.push(`Mệnh: ${effectiveResult.banMenhNapAm}`);
  }
  const thanPalace = palates.find((p) => p.isThan);
  if (thanPalace) {
    quickTags.push(`Thân: Cư ${cleanPalaceName(thanPalace.chucNang)}`);
  }
  if (effectiveResult.canLuongStr) {
    quickTags.push(`Cân lượng: ${effectiveResult.canLuongStr}`);
  }

  return {
    overall: {
      score: overallScore,
      stars: overallStars,
      starsText: renderStarsText(overallStars),
      score100: overallScore100,
      natalScore,
      natalStars,
      deltaScore,
      isDynamic,
      mode,
      contextLabel: activeYunxian?.title || 'Bản Mệnh Trọn Đời',
      tierKey: overallTier.tierKey,
      tierLabel: overallTier.tierLabel,
      tierColor: overallTier.color,
      badgeClass: overallTier.badgeClass,
      topStrengths,
      coreAdvice,
    },
    aspects,
    natalAspects,
    palaceRatings,
    activeYunxian,
    quickTags,
  };
}
