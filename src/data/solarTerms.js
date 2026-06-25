export const SOLAR_TERMS = [
  { id: 'lap-xuan',    nameVi: 'Lập Xuân',   nameZh: '立春',  month: 2,  dayApprox: 4  },
  { id: 'vu-thuy',     nameVi: 'Vũ Thủy',    nameZh: '雨水',  month: 2,  dayApprox: 19 },
  { id: 'kinh-trap',   nameVi: 'Kinh Trập',   nameZh: '驚蟄',  month: 3,  dayApprox: 6  },
  { id: 'xuan-phan',   nameVi: 'Xuân Phân',   nameZh: '春分',  month: 3,  dayApprox: 21 },
  { id: 'thanh-minh',  nameVi: 'Thanh Minh',  nameZh: '清明',  month: 4,  dayApprox: 5  },
  { id: 'coc-vu',      nameVi: 'Cốc Vũ',     nameZh: '穀雨',  month: 4,  dayApprox: 20 },
  { id: 'lap-ha',      nameVi: 'Lập Hạ',     nameZh: '立夏',  month: 5,  dayApprox: 6  },
  { id: 'tieu-man',    nameVi: 'Tiểu Mãn',   nameZh: '小滿',  month: 5,  dayApprox: 21 },
  { id: 'mang-chung',  nameVi: 'Mang Chủng',  nameZh: '芒種',  month: 6,  dayApprox: 6  },
  { id: 'ha-chi',      nameVi: 'Hạ Chí',     nameZh: '夏至',  month: 6,  dayApprox: 21 },
  { id: 'tieu-thu',    nameVi: 'Tiểu Thử',   nameZh: '小暑',  month: 7,  dayApprox: 7  },
  { id: 'dai-thu',     nameVi: 'Đại Thử',    nameZh: '大暑',  month: 7,  dayApprox: 23 },
  { id: 'lap-thu',     nameVi: 'Lập Thu',    nameZh: '立秋',  month: 8,  dayApprox: 7  },
  { id: 'xu-thu',      nameVi: 'Xử Thử',     nameZh: '處暑',  month: 8,  dayApprox: 23 },
  { id: 'bach-lo',     nameVi: 'Bạch Lộ',    nameZh: '白露',  month: 9,  dayApprox: 8  },
  { id: 'thu-phan',    nameVi: 'Thu Phân',    nameZh: '秋分',  month: 9,  dayApprox: 23 },
  { id: 'han-lo',      nameVi: 'Hàn Lộ',     nameZh: '寒露',  month: 10, dayApprox: 8  },
  { id: 'suong-giang', nameVi: 'Sương Giáng', nameZh: '霜降',  month: 10, dayApprox: 23 },
  { id: 'lap-dong',    nameVi: 'Lập Đông',   nameZh: '立冬',  month: 11, dayApprox: 7  },
  { id: 'tieu-tuyet',  nameVi: 'Tiểu Tuyết', nameZh: '小雪',  month: 11, dayApprox: 22 },
  { id: 'dai-tuyet',   nameVi: 'Đại Tuyết',  nameZh: '大Tuyết', month: 12, dayApprox: 7  },
  { id: 'dong-chi',    nameVi: 'Đông Chí',   nameZh: '冬至',  month: 12, dayApprox: 22 },
  { id: 'tieu-han',    nameVi: 'Tiểu Hàn',   nameZh: '小寒',  month: 1,  dayApprox: 6  },
  { id: 'dai-han',     nameVi: 'Đại Hàn',    nameZh: '大寒',  month: 1,  dayApprox: 20 },
];

/**
 * Ước tính tiết khí hiện tại từ ngày dương lịch
 */
export function estimateSolarTerm(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const candidates = SOLAR_TERMS.filter(t => t.month === m);
  if (!candidates.length) return null;
  // Chọn tiết khí gần nhất về ngày
  let best = candidates[0];
  let bestDiff = Math.abs(d - best.dayApprox);
  candidates.forEach(t => {
    const diff = Math.abs(d - t.dayApprox);
    if (diff < bestDiff) { bestDiff = diff; best = t; }
  });
  return best;
}
