/**
 * Bộ Thuật Toán Tử Vi Đẩu Số Nâng Cao (`shared/src/utils/ziwei/index.js`)
 * Tập hợp đầy đủ:
 * - Chân Thái Dương Thời & Bát Tự Tứ Trụ (`solarTime.js`)
 * - Cấu Hình Đa Trường Phái & Độ Sáng Sao 85 Tinh Diệu (`schoolConfig.js`)
 * - Tứ Hóa Đa Tầng, Phi Tinh Tứ Hóa, Tự Hóa, Lai Nhân Cung & Phi Hóa Hợp Hôn (`sihua.js`)
 * - Thập Nhị Thần: Bác Sỹ, Tuế Tiền / Thái Tuế, Tướng Tiền (`shierShen.js`)
 * - Điều Hướng Vận Hạn Tương Tác, Đồng Hạn, Tam Phương Tứ Chính & Vô Chính Diệu Mượn Sao (`yunxian.js`)
 * - Nhận Diện 44+ Cách Cục Kinh Điển & Tóm Tắt Cung Mệnh (`patterns.js`)
 * - Kho Tri Thức 14 Chính Tinh, Hợp Hôn, Thơ Cân Xương, Cổ Thư & 12 Lá Số Danh Nhân (`knowledge.js`)
 */

export * from './solarTime.js';
export * from './schoolConfig.js';
export * from './sihua.js';
export * from './shierShen.js';
export * from './yunxian.js';
export * from './patterns.js';
export * from './knowledge.js';

import {
  calculateTrueSolarTime,
  getFourPillarsFromSolar,
} from './solarTime.js';
import {
  DEFAULT_SCHOOL_CONFIG,
  getSchoolStarBrightness,
} from './schoolConfig.js';
import {
  buildChartFlyingSihua,
} from './sihua.js';
import {
  buildShierShenForChart,
} from './shierShen.js';
import {
  getTamPhuongTuChinh,
  getBorrowedStarsForPalace,
  getChartDaXianList,
  getActiveDaXianForAge,
  buildYunxianOverlay,
} from './yunxian.js';
import {
  detectPatterns,
  getMingGongSummary,
} from './patterns.js';
import {
  getCanLuongPoem,
} from './knowledge.js';

/**
 * Tính toán toàn bộ siêu dữ liệu Tử Vi nâng cao (`ziweiMeta`) cho một lá số `anLaSoTuVi`.
 */
export function computeZiweiMeta(chart, inputData = {}, schoolConfig = DEFAULT_SCHOOL_CONFIG) {
  if (!chart || !Array.isArray(chart.palates)) return null;
  const mergedConfig = { ...DEFAULT_SCHOOL_CONFIG, ...(schoolConfig || {}) };

  const patterns = detectPatterns(chart);
  const mingSummary = getMingGongSummary(chart);
  const flyingSihua = buildChartFlyingSihua(chart, mergedConfig);
  const laiNhanCung = flyingSihua.laiNhanCung;

  const shierShen = buildShierShenForChart(chart, {
    yearCanIndex: inputData?.yearCanIndex,
    yearChiIndex: inputData?.yearChiIndex,
    gender: inputData?.gender,
    activeBranchIndex: inputData?.viewYearChiIndex,
  });

  const emptyPalaceBorrowing = Array.from({ length: 12 }, (_, i) => getBorrowedStarsForPalace(chart, i));
  const tamPhuongMap = Array.from({ length: 12 }, (_, i) => getTamPhuongTuChinh(i));
  const canLuongPoem = getCanLuongPoem(chart.canLuongStr);
  const daXianList = getChartDaXianList(chart);
  const activeDaXian = chart.tuoiAm ? getActiveDaXianForAge(chart, chart.tuoiAm) : null;

  const yunxianOverlay = buildYunxianOverlay(chart, {
    mode: inputData?.yunxianMode || (chart.viewYear ? 'liunian' : 'mingpan'),
    daXianChiIndex: inputData?.daXianChiIndex,
    viewYear: chart.viewYear ?? inputData?.viewYear,
    lunarMonth: inputData?.viewLunarMonth || 1,
    lunarDay: inputData?.viewLunarDay || 1,
    hourIndex: inputData?.viewHourIndex ?? 0,
    schoolConfig: mergedConfig,
  });

  // Tính Chân Thái Dương Thời nếu có giờ phút đồng hồ
  const solarSrc = inputData?.solarInput || (
    inputData && !inputData.isLunar && inputData.year && inputData.month && inputData.day
      ? { year: Number(inputData.year), month: Number(inputData.month), day: Number(inputData.day) }
      : null
  );
  let trueSolarTimeInfo = null;
  if (
    solarSrc
    && inputData?.clockHour !== undefined
    && inputData?.clockMinute !== undefined
    && inputData?.clockHour !== ''
    && inputData?.clockMinute !== ''
  ) {
    trueSolarTimeInfo = calculateTrueSolarTime({
      year: Number(solarSrc.year),
      month: Number(solarSrc.month),
      day: Number(solarSrc.day),
      clockHour: Number(inputData.clockHour),
      clockMinute: Number(inputData.clockMinute),
      longitude: inputData.longitude !== undefined && inputData.longitude !== '' ? Number(inputData.longitude) : undefined,
      utcOffsetMinutes: inputData.utcOffsetMinutes !== undefined ? Number(inputData.utcOffsetMinutes) : 420,
    });
  }

  // Tính Bát Tự Tứ Trụ nếu có ngày Dương lịch
  let fourPillarsInfo = null;
  if (solarSrc && solarSrc.year && solarSrc.month && solarSrc.day) {
    const resolvedHourIdx = inputData?.lunarHourIndex ?? inputData?.hourIndex ?? trueSolarTimeInfo?.branch ?? 0;
    fourPillarsInfo = getFourPillarsFromSolar(
      Number(solarSrc.year),
      Number(solarSrc.month),
      Number(solarSrc.day),
      Number(resolvedHourIdx),
      mergedConfig.leapMonth || 'split',
    );
  }

  // Độ sáng sao theo trường phái đã chọn cho cả 12 cung
  const brightnessSchool = mergedConfig.brightnessSchool || 'v11';
  const schoolStarBrightnessMap = {};
  for (const p of chart.palates) {
    const palaceMap = {};
    for (const rawStar of [...(p.chinhTinh || []), ...(p.phuTinh || [])]) {
      const cleanName = String(rawStar).replace(/^L\./, '').split('(')[0].trim();
      const bInfo = getSchoolStarBrightness(cleanName, p.chiIndex, brightnessSchool);
      if (bInfo) palaceMap[cleanName] = bInfo;
    }
    schoolStarBrightnessMap[p.chiIndex] = palaceMap;
  }

  return {
    schoolConfig: mergedConfig,
    patterns,
    mingSummary,
    flyingSihua,
    laiNhanCung,
    shierShen,
    emptyPalaceBorrowing,
    tamPhuongMap,
    canLuongPoem,
    daXianList,
    activeDaXian,
    yunxianOverlay,
    fourPillarsInfo,
    trueSolarTimeInfo,
    schoolStarBrightnessMap,
  };
}

/**
 * Làm giàu lá số Tử Vi (`chart`) với đầy đủ thông tin `ziweiMeta` mà không làm thay đổi
 * bất kỳ trường gốc nào của `anLaSoTuVi`.
 */
export function enrichTuViChart(chart, inputData = {}, schoolConfig = DEFAULT_SCHOOL_CONFIG) {
  if (!chart || !Array.isArray(chart.palates)) return chart;
  const ziweiMeta = computeZiweiMeta(chart, inputData, schoolConfig);
  return {
    ...chart,
    ziweiMeta,
  };
}
