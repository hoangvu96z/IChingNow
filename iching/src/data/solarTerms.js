import { Solar } from 'lunar-javascript';

export const SOLAR_TERMS = [
  { id: 'lap-xuan',    nameVi: 'Lập Xuân',    nameEn: 'Start of Spring (Lichun)',        nameZh: '立春', zhSimplified: '立春', month: 2,  dayApprox: 4  },
  { id: 'vu-thuy',     nameVi: 'Vũ Thủy',     nameEn: 'Rain Water (Yushui)',             nameZh: '雨水', zhSimplified: '雨水', month: 2,  dayApprox: 19 },
  { id: 'kinh-trap',   nameVi: 'Kinh Trập',   nameEn: 'Awakening of Insects (Jingzhe)',  nameZh: '驚蟄', zhSimplified: '惊蛰', month: 3,  dayApprox: 6  },
  { id: 'xuan-phan',   nameVi: 'Xuân Phân',   nameEn: 'Spring Equinox (Chunfen)',        nameZh: '春分', zhSimplified: '春分', month: 3,  dayApprox: 21 },
  { id: 'thanh-minh',  nameVi: 'Thanh Minh',  nameEn: 'Pure Brightness (Qingming)',      nameZh: '清明', zhSimplified: '清明', month: 4,  dayApprox: 5  },
  { id: 'coc-vu',      nameVi: 'Cốc Vũ',      nameEn: 'Grain Rain (Guyu)',               nameZh: '穀雨', zhSimplified: '谷雨', month: 4,  dayApprox: 20 },
  { id: 'lap-ha',      nameVi: 'Lập Hạ',      nameEn: 'Start of Summer (Lixia)',         nameZh: '立夏', zhSimplified: '立夏', month: 5,  dayApprox: 6  },
  { id: 'tieu-man',    nameVi: 'Tiểu Mãn',    nameEn: 'Grain Buds (Xiaoman)',            nameZh: '小滿', zhSimplified: '小满', month: 5,  dayApprox: 21 },
  { id: 'mang-chung',  nameVi: 'Mang Chủng',  nameEn: 'Grain in Ear (Mangzhong)',        nameZh: '芒種', zhSimplified: '芒种', month: 6,  dayApprox: 6  },
  { id: 'ha-chi',      nameVi: 'Hạ Chí',      nameEn: 'Summer Solstice (Xiazhi)',        nameZh: '夏至', zhSimplified: '夏至', month: 6,  dayApprox: 21 },
  { id: 'tieu-thu',    nameVi: 'Tiểu Thử',    nameEn: 'Minor Heat (Xiaoshu)',            nameZh: '小暑', zhSimplified: '小暑', month: 7,  dayApprox: 7  },
  { id: 'dai-thu',     nameVi: 'Đại Thử',     nameEn: 'Major Heat (Dashu)',              nameZh: '大暑', zhSimplified: '大暑', month: 7,  dayApprox: 23 },
  { id: 'lap-thu',     nameVi: 'Lập Thu',     nameEn: 'Start of Autumn (Liqiu)',         nameZh: '立秋', zhSimplified: '立秋', month: 8,  dayApprox: 7  },
  { id: 'xu-thu',      nameVi: 'Xử Thử',      nameEn: 'End of Heat (Chushu)',            nameZh: '處暑', zhSimplified: '处暑', month: 8,  dayApprox: 23 },
  { id: 'bach-lo',     nameVi: 'Bạch Lộ',     nameEn: 'White Dew (Bailu)',               nameZh: '白露', zhSimplified: '白露', month: 9,  dayApprox: 8  },
  { id: 'thu-phan',    nameVi: 'Thu Phân',    nameEn: 'Autumn Equinox (Qiufen)',         nameZh: '秋分', zhSimplified: '秋分', month: 9,  dayApprox: 23 },
  { id: 'han-lo',      nameVi: 'Hàn Lộ',      nameEn: 'Cold Dew (Hanlu)',                nameZh: '寒露', zhSimplified: '寒露', month: 10, dayApprox: 8  },
  { id: 'suong-giang', nameVi: 'Sương Giáng', nameEn: 'Frost\'s Descent (Shuangjiang)',  nameZh: '霜降', zhSimplified: '霜降', month: 10, dayApprox: 23 },
  { id: 'lap-dong',    nameVi: 'Lập Đông',    nameEn: 'Start of Winter (Lidong)',        nameZh: '立冬', zhSimplified: '立冬', month: 11, dayApprox: 7  },
  { id: 'tieu-tuyet',  nameVi: 'Tiểu Tuyết',  nameEn: 'Minor Snow (Xiaoxue)',            nameZh: '小雪', zhSimplified: '小雪', month: 11, dayApprox: 22 },
  { id: 'dai-tuyet',   nameVi: 'Đại Tuyết',   nameEn: 'Major Snow (Daxue)',              nameZh: '大雪', zhSimplified: '大雪', month: 12, dayApprox: 7  },
  { id: 'dong-chi',    nameVi: 'Đông Chí',    nameEn: 'Winter Solstice (Dongzhi)',       nameZh: '冬至', zhSimplified: '冬至', month: 12, dayApprox: 22 },
  { id: 'tieu-han',    nameVi: 'Tiểu Hàn',    nameEn: 'Minor Cold (Xiaohan)',            nameZh: '小寒', zhSimplified: '小寒', month: 1,  dayApprox: 6  },
  { id: 'dai-han',     nameVi: 'Đại Hàn',     nameEn: 'Major Cold (Dahan)',              nameZh: '大寒', zhSimplified: '大寒', month: 1,  dayApprox: 20 },
];

export const SOLAR_TERM_BY_ZH = Object.fromEntries(
  SOLAR_TERMS.flatMap(t => [
    [t.nameZh, t],
    [t.zhSimplified, t],
  ])
);

/**
 * Tra cứu Tiết khí chính xác theo lịch thiên văn (lunar-javascript), fallback sang xấp xỉ ngày dương lịch
 */
export function estimateSolarTerm(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  try {
    const solar = Solar.fromYmdHms(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      0
    );
    const prevJieQi = solar.getLunar().getPrevJieQi(true);
    const zhName = prevJieQi?.getName?.();
    if (zhName && SOLAR_TERM_BY_ZH[zhName]) {
      return SOLAR_TERM_BY_ZH[zhName];
    }
  } catch {
    // Fallback below
  }

  const m = date.getMonth() + 1;
  const d = date.getDate();
  const candidates = SOLAR_TERMS.filter(t => t.month === m);
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestDiff = Math.abs(d - best.dayApprox);
  candidates.forEach(t => {
    const diff = Math.abs(d - t.dayApprox);
    if (diff < bestDiff) { bestDiff = diff; best = t; }
  });
  return best;
}
