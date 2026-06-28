export const HOUR_BRANCHES = [
  { value: 'ty',   label: 'Giờ Tý',   hours: [23, 0],  hourZh: '子', chiNumber: 1  },
  { value: 'suu',  label: 'Giờ Sửu',  hours: [1, 2],   hourZh: '丑', chiNumber: 2  },
  { value: 'dan',  label: 'Giờ Dần',  hours: [3, 4],   hourZh: '寅', chiNumber: 3  },
  { value: 'mao',  label: 'Giờ Mão',  hours: [5, 6],   hourZh: '卯', chiNumber: 4  },
  { value: 'thin', label: 'Giờ Thìn', hours: [7, 8],   hourZh: '辰', chiNumber: 5  },
  { value: 'ti',   label: 'Giờ Tị',   hours: [9, 10],  hourZh: '巳', chiNumber: 6  },
  { value: 'ngo',  label: 'Giờ Ngọ',  hours: [11, 12], hourZh: '午', chiNumber: 7  },
  { value: 'mui',  label: 'Giờ Mùi',  hours: [13, 14], hourZh: '未', chiNumber: 8  },
  { value: 'than', label: 'Giờ Thân', hours: [15, 16], hourZh: '申', chiNumber: 9  },
  { value: 'dau',  label: 'Giờ Dậu',  hours: [17, 18], hourZh: '酉', chiNumber: 10 },
  { value: 'tuat', label: 'Giờ Tuất', hours: [19, 20], hourZh: '戌', chiNumber: 11 },
  { value: 'hoi',  label: 'Giờ Hợi',  hours: [21, 22], hourZh: '亥', chiNumber: 12 },
];

/**
 * Tự động lấy địa chi giờ từ giờ hiện tại
 */
export function getHourBranchFromHour(hour) {
  return HOUR_BRANCHES.find(b => b.hours.includes(hour)) || HOUR_BRANCHES[0];
}
