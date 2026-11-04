/**
 * Chân Thái Dương Thời (Giờ Mặt Trời Thật), Chính Sách Tháng Nhuận & Bát Tự Tứ Trụ
 * Ported & localized for Vietnamese Tử Vi Đẩu Số from lib/ziwei/true-solar-time.ts,
 * lib/ziwei/dst-cn.ts, lib/ziwei/clock-adjust.ts, and lib/ziwei/algorithm.ts.
 */
import { Solar, LunarMonth } from 'lunar-javascript';

export const STEMS_ZH = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES_ZH = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const MINUTES_PER_DAY = 1440;
const SECONDS_PER_DAY = 86400;
const mod = (value, base) => ((value % base) + base) % base;

// ─── Danh mục 63 Tỉnh/Thành Việt Nam + Thành phố Quốc tế ───────────────────
export const VN_LOCATIONS = [
  // Miền Bắc (25 tỉnh/thành)
  { id: 'vn-ha-noi', name: 'Hà Nội', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.8542, latitude: 21.0285, utcOffsetMinutes: 420 },
  { id: 'vn-hai-phong', name: 'Hải Phòng', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.6881, latitude: 20.8449, utcOffsetMinutes: 420 },
  { id: 'vn-quang-ninh', name: 'Quảng Ninh (Hạ Long)', region: 'Miền Bắc', country: 'Việt Nam', longitude: 107.0734, latitude: 20.9599, utcOffsetMinutes: 420 },
  { id: 'vn-bac-ninh', name: 'Bắc Ninh', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.0763, latitude: 21.1861, utcOffsetMinutes: 420 },
  { id: 'vn-bac-giang', name: 'Bắc Giang', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.1946, latitude: 21.2731, utcOffsetMinutes: 420 },
  { id: 'vn-hai-duong', name: 'Hải Dương', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.3146, latitude: 20.9373, utcOffsetMinutes: 420 },
  { id: 'vn-hung-yen', name: 'Hưng Yên', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.0511, latitude: 20.6464, utcOffsetMinutes: 420 },
  { id: 'vn-ha-nam', name: 'Hà Nam (Phủ Lý)', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.9139, latitude: 20.5411, utcOffsetMinutes: 420 },
  { id: 'vn-nam-dinh', name: 'Nam Định', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.1621, latitude: 20.4388, utcOffsetMinutes: 420 },
  { id: 'vn-thai-binh', name: 'Thái Bình', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.3366, latitude: 20.4463, utcOffsetMinutes: 420 },
  { id: 'vn-ninh-binh', name: 'Ninh Bình', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.9745, latitude: 20.2506, utcOffsetMinutes: 420 },
  { id: 'vn-vinh-phuc', name: 'Vĩnh Phúc (Vĩnh Yên)', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.6049, latitude: 21.3089, utcOffsetMinutes: 420 },
  { id: 'vn-phu-tho', name: 'Phú Thọ (Việt Trì)', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.4020, latitude: 21.3228, utcOffsetMinutes: 420 },
  { id: 'vn-thai-nguyen', name: 'Thái Nguyên', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.8482, latitude: 21.5942, utcOffsetMinutes: 420 },
  { id: 'vn-bac-kan', name: 'Bắc Kạn', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.8348, latitude: 22.1470, utcOffsetMinutes: 420 },
  { id: 'vn-cao-bang', name: 'Cao Bằng', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.2640, latitude: 22.6657, utcOffsetMinutes: 420 },
  { id: 'vn-lang-son', name: 'Lạng Sơn', region: 'Miền Bắc', country: 'Việt Nam', longitude: 106.7615, latitude: 21.8537, utcOffsetMinutes: 420 },
  { id: 'vn-tuyen-quang', name: 'Tuyên Quang', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.2181, latitude: 21.8236, utcOffsetMinutes: 420 },
  { id: 'vn-ha-giang', name: 'Hà Giang', region: 'Miền Bắc', country: 'Việt Nam', longitude: 104.9836, latitude: 22.8233, utcOffsetMinutes: 420 },
  { id: 'vn-yen-bai', name: 'Yên Bái', region: 'Miền Bắc', country: 'Việt Nam', longitude: 104.8976, latitude: 21.7052, utcOffsetMinutes: 420 },
  { id: 'vn-lao-cai', name: 'Lào Cai', region: 'Miền Bắc', country: 'Việt Nam', longitude: 103.9707, latitude: 22.4856, utcOffsetMinutes: 420 },
  { id: 'vn-hoa-binh', name: 'Hòa Bình', region: 'Miền Bắc', country: 'Việt Nam', longitude: 105.3383, latitude: 20.8133, utcOffsetMinutes: 420 },
  { id: 'vn-son-la', name: 'Sơn La', region: 'Miền Bắc', country: 'Việt Nam', longitude: 103.9188, latitude: 21.3256, utcOffsetMinutes: 420 },
  { id: 'vn-dien-bien', name: 'Điện Biên (Điện Biên Phủ)', region: 'Miền Bắc', country: 'Việt Nam', longitude: 103.0169, latitude: 21.3860, utcOffsetMinutes: 420 },
  { id: 'vn-lai-chau', name: 'Lai Châu', region: 'Miền Bắc', country: 'Việt Nam', longitude: 103.4590, latitude: 22.3964, utcOffsetMinutes: 420 },

  // Miền Trung & Tây Nguyên (19 tỉnh/thành)
  { id: 'vn-thanh-hoa', name: 'Thanh Hóa', region: 'Miền Trung', country: 'Việt Nam', longitude: 105.7764, latitude: 19.8067, utcOffsetMinutes: 420 },
  { id: 'vn-nghe-an', name: 'Nghệ An (Vinh)', region: 'Miền Trung', country: 'Việt Nam', longitude: 105.6813, latitude: 18.6796, utcOffsetMinutes: 420 },
  { id: 'vn-ha-tinh', name: 'Hà Tĩnh', region: 'Miền Trung', country: 'Việt Nam', longitude: 105.9057, latitude: 18.3428, utcOffsetMinutes: 420 },
  { id: 'vn-quang-binh', name: 'Quảng Bình (Đồng Hới)', region: 'Miền Trung', country: 'Việt Nam', longitude: 106.6223, latitude: 17.4689, utcOffsetMinutes: 420 },
  { id: 'vn-quang-tri', name: 'Quảng Trị (Đông Hà)', region: 'Miền Trung', country: 'Việt Nam', longitude: 107.1003, latitude: 16.8163, utcOffsetMinutes: 420 },
  { id: 'vn-thua-thien-hue', name: 'Thừa Thiên Huế', region: 'Miền Trung', country: 'Việt Nam', longitude: 107.5909, latitude: 16.4637, utcOffsetMinutes: 420 },
  { id: 'vn-da-nang', name: 'Đà Nẵng', region: 'Miền Trung', country: 'Việt Nam', longitude: 108.2022, latitude: 16.0544, utcOffsetMinutes: 420 },
  { id: 'vn-quang-nam', name: 'Quảng Nam (Tam Kỳ)', region: 'Miền Trung', country: 'Việt Nam', longitude: 108.4740, latitude: 15.5736, utcOffsetMinutes: 420 },
  { id: 'vn-quang-ngai', name: 'Quảng Ngãi', region: 'Miền Trung', country: 'Việt Nam', longitude: 108.8044, latitude: 15.1214, utcOffsetMinutes: 420 },
  { id: 'vn-binh-dinh', name: 'Bình Định (Quy Nhơn)', region: 'Miền Trung', country: 'Việt Nam', longitude: 109.2197, latitude: 13.7830, utcOffsetMinutes: 420 },
  { id: 'vn-phu-yen', name: 'Phú Yên (Tuy Hòa)', region: 'Miền Trung', country: 'Việt Nam', longitude: 109.2950, latitude: 13.0955, utcOffsetMinutes: 420 },
  { id: 'vn-khanh-hoa', name: 'Khánh Hòa (Nha Trang)', region: 'Miền Trung', country: 'Việt Nam', longitude: 109.1967, latitude: 12.2388, utcOffsetMinutes: 420 },
  { id: 'vn-ninh-thuan', name: 'Ninh Thuận (Phan Rang)', region: 'Miền Trung', country: 'Việt Nam', longitude: 108.9886, latitude: 11.5643, utcOffsetMinutes: 420 },
  { id: 'vn-binh-thuan', name: 'Bình Thuận (Phan Thiết)', region: 'Miền Trung', country: 'Việt Nam', longitude: 108.1021, latitude: 10.9289, utcOffsetMinutes: 420 },
  { id: 'vn-kon-tum', name: 'Kon Tum', region: 'Tây Nguyên', country: 'Việt Nam', longitude: 108.0005, latitude: 14.3497, utcOffsetMinutes: 420 },
  { id: 'vn-gia-lai', name: 'Gia Lai (Pleiku)', region: 'Tây Nguyên', country: 'Việt Nam', longitude: 108.0051, latitude: 13.9833, utcOffsetMinutes: 420 },
  { id: 'vn-dak-lak', name: 'Đắk Lắk (Buôn Ma Thuột)', region: 'Tây Nguyên', country: 'Việt Nam', longitude: 108.0378, latitude: 12.6667, utcOffsetMinutes: 420 },
  { id: 'vn-dak-nong', name: 'Đắk Nông (Gia Nghĩa)', region: 'Tây Nguyên', country: 'Việt Nam', longitude: 107.6907, latitude: 12.0042, utcOffsetMinutes: 420 },
  { id: 'vn-lam-dong', name: 'Lâm Đồng (Đà Lạt)', region: 'Tây Nguyên', country: 'Việt Nam', longitude: 108.4583, latitude: 11.9404, utcOffsetMinutes: 420 },

  // Miền Nam (19 tỉnh/thành)
  { id: 'vn-tp-hcm', name: 'TP. Hồ Chí Minh', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.6297, latitude: 10.8231, utcOffsetMinutes: 420 },
  { id: 'vn-binh-duong', name: 'Bình Dương (Thủ Dầu Một)', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.6519, latitude: 10.9804, utcOffsetMinutes: 420 },
  { id: 'vn-dong-nai', name: 'Đồng Nai (Biên Hòa)', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.8427, latitude: 10.9574, utcOffsetMinutes: 420 },
  { id: 'vn-ba-ria-vung-tau', name: 'Bà Rịa - Vũng Tàu', region: 'Miền Nam', country: 'Việt Nam', longitude: 107.0843, latitude: 10.3460, utcOffsetMinutes: 420 },
  { id: 'vn-binh-phuoc', name: 'Bình Phước (Đồng Xoài)', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.8906, latitude: 11.5350, utcOffsetMinutes: 420 },
  { id: 'vn-tay-ninh', name: 'Tây Ninh', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.0983, latitude: 11.3100, utcOffsetMinutes: 420 },
  { id: 'vn-long-an', name: 'Long An (Tân An)', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.4134, latitude: 10.5359, utcOffsetMinutes: 420 },
  { id: 'vn-tien-giang', name: 'Tiền Giang (Mỹ Tho)', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.3600, latitude: 10.3600, utcOffsetMinutes: 420 },
  { id: 'vn-ben-tre', name: 'Bến Tre', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.3756, latitude: 10.2434, utcOffsetMinutes: 420 },
  { id: 'vn-tra-vinh', name: 'Trà Vinh', region: 'Miền Nam', country: 'Việt Nam', longitude: 106.3421, latitude: 9.9347, utcOffsetMinutes: 420 },
  { id: 'vn-vinh-long', name: 'Vĩnh Long', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.9722, latitude: 10.2537, utcOffsetMinutes: 420 },
  { id: 'vn-dong-thap', name: 'Đồng Tháp (Cao Lãnh)', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.6329, latitude: 10.4594, utcOffsetMinutes: 420 },
  { id: 'vn-an-giang', name: 'An Giang (Long Xuyên)', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.4352, latitude: 10.3864, utcOffsetMinutes: 420 },
  { id: 'vn-kien-giang', name: 'Kiên Giang (Rạch Giá)', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.0809, latitude: 10.0125, utcOffsetMinutes: 420 },
  { id: 'vn-can-tho', name: 'Cần Thơ', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.7851, latitude: 10.0452, utcOffsetMinutes: 420 },
  { id: 'vn-hau-giang', name: 'Hậu Giang (Vị Thanh)', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.4701, latitude: 9.7845, utcOffsetMinutes: 420 },
  { id: 'vn-soc-trang', name: 'Sóc Trăng', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.9739, latitude: 9.6025, utcOffsetMinutes: 420 },
  { id: 'vn-bac-lieu', name: 'Bạc Liêu', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.7244, latitude: 9.2941, utcOffsetMinutes: 420 },
  { id: 'vn-ca-mau', name: 'Cà Mau', region: 'Miền Nam', country: 'Việt Nam', longitude: 105.1524, latitude: 9.1768, utcOffsetMinutes: 420 },

  // Quốc tế (Thành phố lớn)
  { id: 'intl-beijing', name: 'Bắc Kinh (Beijing)', region: 'Quốc tế', country: 'Trung Quốc', longitude: 116.4074, latitude: 39.9042, utcOffsetMinutes: 480 },
  { id: 'intl-shanghai', name: 'Thượng Hải (Shanghai)', region: 'Quốc tế', country: 'Trung Quốc', longitude: 121.4737, latitude: 31.2304, utcOffsetMinutes: 480 },
  { id: 'intl-taipei', name: 'Đài Bắc (Taipei)', region: 'Quốc tế', country: 'Đài Loan', longitude: 121.5654, latitude: 25.0330, utcOffsetMinutes: 480 },
  { id: 'intl-hong-kong', name: 'Hồng Kông (Hong Kong)', region: 'Quốc tế', country: 'Trung Quốc', longitude: 114.1694, latitude: 22.3193, utcOffsetMinutes: 480 },
  { id: 'intl-singapore', name: 'Singapore', region: 'Quốc tế', country: 'Singapore', longitude: 103.8198, latitude: 1.3521, utcOffsetMinutes: 480 },
  { id: 'intl-bangkok', name: 'Bangkok', region: 'Quốc tế', country: 'Thái Lan', longitude: 100.5018, latitude: 13.7563, utcOffsetMinutes: 420 },
  { id: 'intl-tokyo', name: 'Tokyo', region: 'Quốc tế', country: 'Nhật Bản', longitude: 139.6917, latitude: 35.6895, utcOffsetMinutes: 540 },
  { id: 'intl-seoul', name: 'Seoul', region: 'Quốc tế', country: 'Hàn Quốc', longitude: 126.9780, latitude: 37.5665, utcOffsetMinutes: 540 },
  { id: 'intl-sydney', name: 'Sydney', region: 'Quốc tế', country: 'Úc', longitude: 151.2093, latitude: -33.8688, utcOffsetMinutes: 600 },
  { id: 'intl-melbourne', name: 'Melbourne', region: 'Quốc tế', country: 'Úc', longitude: 144.9631, latitude: -37.8136, utcOffsetMinutes: 600 },
  { id: 'intl-london', name: 'London', region: 'Quốc tế', country: 'Anh', longitude: -0.1276, latitude: 51.5072, utcOffsetMinutes: 0 },
  { id: 'intl-paris', name: 'Paris', region: 'Quốc tế', country: 'Pháp', longitude: 2.3522, latitude: 48.8566, utcOffsetMinutes: 60 },
  { id: 'intl-berlin', name: 'Berlin', region: 'Quốc tế', country: 'Đức', longitude: 13.4050, latitude: 52.5200, utcOffsetMinutes: 60 },
  { id: 'intl-moscow', name: 'Moscow', region: 'Quốc tế', country: 'Nga', longitude: 37.6173, latitude: 55.7558, utcOffsetMinutes: 180 },
  { id: 'intl-new-york', name: 'New York', region: 'Quốc tế', country: 'Hoa Kỳ', longitude: -74.0060, latitude: 40.7128, utcOffsetMinutes: -300 },
  { id: 'intl-los-angeles', name: 'Los Angeles', region: 'Quốc tế', country: 'Hoa Kỳ', longitude: -118.2437, latitude: 34.0522, utcOffsetMinutes: -480 },
  { id: 'intl-san-francisco', name: 'San Francisco', region: 'Quốc tế', country: 'Hoa Kỳ', longitude: -122.4194, latitude: 37.7749, utcOffsetMinutes: -480 },
  { id: 'intl-toronto', name: 'Toronto', region: 'Quốc tế', country: 'Canada', longitude: -79.3832, latitude: 43.6532, utcOffsetMinutes: -300 },
];

export function findLocationById(id) {
  return VN_LOCATIONS.find(loc => loc.id === id) || null;
}

export function findLocationByName(name) {
  if (!name) return null;
  const q = String(name).trim().toLowerCase();
  return VN_LOCATIONS.find(
    loc => loc.name.toLowerCase() === q || loc.name.toLowerCase().includes(q)
  ) || null;
}

// ─── 1. Chân Thái Dương Thời (True Solar Time) ─────────────────────────────
export function isValidGregorianDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function shiftGregorianDate(date, dayOffset) {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + dayOffset));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function sameGregorianDate(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function dayOfYear(year, month, day) {
  return Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
}

/**
 * Phương trình Thời gian NOAA (Equation of Time) tính bằng phút.
 * Giá trị dương nghĩa là Chân Thái Dương Thời nhanh hơn giờ mặt trời trung bình.
 */
export function equationOfTimeMinutes(
  year,
  month,
  day,
  clockHour = 12,
  clockMinute = 0,
) {
  if (!isValidGregorianDate(year, month, day)) return 0;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const fractionalHour = clockHour + clockMinute / 60;
  const gamma = (2 * Math.PI / daysInYear)
    * (dayOfYear(year, month, day) - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

export function branchFromSolarMinutes(normalizedMinutes) {
  if (normalizedMinutes >= 1380 || normalizedMinutes < 60) return 0;
  return Math.floor((normalizedMinutes - 60) / 120) + 1;
}

/**
 * Tính Chân Thái Dương Thời (Giờ Mặt Trời Thật) từ giờ đồng hồ, kinh độ và múi giờ chuẩn.
 * Mặc định utcOffsetMinutes = 420 (UTC+7 Việt Nam, kinh tuyến chuẩn 105°E).
 */
export function calculateTrueSolarTime(input) {
  const dateValid = isValidGregorianDate(input.year, input.month, input.day);
  const corrected = input.longitude !== undefined && input.longitude !== null && Number.isFinite(Number(input.longitude));
  const utcOffset = input.utcOffsetMinutes !== undefined && Number.isFinite(Number(input.utcOffsetMinutes))
    ? Number(input.utcOffsetMinutes)
    : 420; // Mặc định UTC+7 (Việt Nam, 105°E)
  const meridian = utcOffset / 4;
  const longitudeCorrectionMinutes = corrected ? (Number(input.longitude) - meridian) * 4 : 0;
  const eot = corrected && dateValid
    ? equationOfTimeMinutes(input.year, input.month, input.day, input.clockHour, input.clockMinute)
    : 0;
  const totalCorrectionMinutes = longitudeCorrectionMinutes + eot;
  const rawMinutes = input.clockHour * 60 + input.clockMinute + totalCorrectionMinutes;

  const roundedTotalSeconds = Math.round(rawMinutes * 60);
  const dayOffset = Math.floor(roundedTotalSeconds / SECONDS_PER_DAY);
  const secondOfDay = mod(roundedTotalSeconds, SECONDS_PER_DAY);
  const hour = Math.floor(secondOfDay / 3600);
  const minute = Math.floor((secondOfDay % 3600) / 60);
  const second = secondOfDay % 60;
  const normalizedMinutes = secondOfDay / 60;
  const branch = branchFromSolarMinutes(normalizedMinutes);

  return {
    dateValid,
    corrected,
    meridianDeg: meridian,
    utcOffsetMinutes: utcOffset,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes: eot,
    totalCorrectionMinutes,
    rawMinutes,
    normalizedMinutes,
    dayOffset,
    hour,
    minute,
    second,
    branch,
    branchName: DIA_CHI[branch],
  };
}

/**
 * Hợp nhất độ lệch ngày Chân Thái Dương Thời với quy tắc Giờ Tý Muộn (23:00–24:00).
 */
export function resolveZiweiDayOffset(solar, lateZishi = 'next-day') {
  const nextDayRule = lateZishi === 'next-day';
  const isLateZishi = solar.branch === 0 && solar.normalizedMinutes >= 1380;

  if (solar.dayOffset < 0 && isLateZishi) {
    return nextDayRule ? solar.dayOffset + 1 : solar.dayOffset;
  }
  if (solar.dayOffset !== 0) return solar.dayOffset;
  if (isLateZishi) return nextDayRule ? 1 : 0;
  return 0;
}

export function formatTrueSolarClock(solar, withSeconds = false) {
  const base = `${String(solar.hour).padStart(2, '0')}:${String(solar.minute).padStart(2, '0')}`;
  return withSeconds ? `${base}:${String(solar.second).padStart(2, '0')}` : base;
}

export function formatSignedMinutes(value) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

// ─── 2. Giờ Mùa Hè (DST) & Dịch Chuyển Giờ Đồng Hồ ─────────────────────────
const XLS_CN = [
  [1935, 5, 1, 9, 30], [1936, 5, 1, 9, 30], [1937, 5, 1, 9, 30], [1938, 5, 1, 9, 30],
  [1939, 5, 1, 9, 30], [1940, 5, 1, 9, 30], [1941, 5, 1, 9, 30], [1942, 5, 1, 9, 30],
  [1943, 5, 1, 9, 30], [1944, 5, 1, 9, 30], [1945, 5, 1, 9, 30], [1946, 5, 1, 9, 30],
  [1947, 5, 1, 9, 30], [1948, 5, 1, 9, 30], [1949, 5, 1, 9, 30], [1950, 5, 1, 9, 30],
  [1951, 5, 1, 9, 30], [1952, 3, 1, 10, 31], [1953, 4, 1, 10, 31], [1954, 4, 1, 10, 31],
  [1955, 5, 1, 9, 30], [1956, 5, 1, 9, 30], [1957, 4, 1, 9, 30], [1958, 4, 1, 9, 30],
  [1959, 4, 1, 9, 30], [1960, 6, 1, 9, 30], [1961, 6, 1, 9, 30], [1974, 4, 1, 10, 31],
  [1975, 4, 1, 10, 31], [1979, 7, 1, 9, 30], [1986, 5, 4, 9, 14], [1987, 4, 12, 9, 13],
  [1988, 4, 10, 9, 11], [1989, 4, 16, 9, 17], [1990, 4, 15, 9, 16], [1991, 4, 14, 9, 15],
];

export function isChinaDST(year, month, day) {
  for (const [y, m1, d1, m2, d2] of XLS_CN) {
    if (year !== y) continue;
    if (month > m1 && month < m2) return true;
    if (month === m1) {
      if (day >= d1) return true;
    } else if (month === m2) {
      if (day <= d2) return true;
    }
  }
  return false;
}

export function isChinaDSTYear(year) {
  return XLS_CN.some(([y]) => y === year);
}

export function chinaDSTRange(year) {
  const hit = XLS_CN.find(([y]) => y === year);
  if (!hit) return null;
  const [, m1, d1, m2, d2] = hit;
  return { start: `${d1}/${m1}`, end: `${d2}/${m2}` };
}

export function chinaDSTSpan(year) {
  const hit = XLS_CN.find(([y]) => y === year);
  if (!hit) return null;
  const [, startMonth, startDay, endMonth, endDay] = hit;
  return { startMonth, startDay, endMonth, endDay };
}

export function chinaDSTYears() {
  return XLS_CN.map(([y]) => y);
}

export function clockToStandardDelta(actualOffsetMin, stdOffsetMin) {
  return stdOffsetMin - actualOffsetMin;
}

export function shiftClock(t, deltaMin) {
  if (!t || t.clockHour === '' || t.clockMinute === '' || t.clockHour == null || t.clockMinute == null) return null;
  const h = Number(t.clockHour);
  const m = Number(t.clockMinute);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  if (!Number.isInteger(deltaMin) || deltaMin === 0) return null;
  const total = h * 60 + m + deltaMin;
  if (total < 0 || total >= MINUTES_PER_DAY) return null;
  return { clockHour: String(Math.floor(total / 60)), clockMinute: String(total % 60) };
}

export function formatClock(t) {
  return `${String(t.clockHour).padStart(2, '0')}:${String(t.clockMinute).padStart(2, '0')}`;
}

// ─── 3. Giải Quyết Ngày Tháng Nhuận & Bát Tự Tứ Trụ (Four Pillars) ─────────
function translateGanZhiToVi(gz) {
  if (!gz || typeof gz !== 'string') return '';
  const ganChar = gz[0];
  const zhiChar = gz[1];
  const ganIdx = STEMS_ZH.indexOf(ganChar);
  const zhiIdx = BRANCHES_ZH.indexOf(zhiChar);
  if (ganIdx >= 0 && zhiIdx >= 0) {
    return `${THIEN_CAN[ganIdx]} ${DIA_CHI[zhiIdx]}`;
  }
  return gz;
}

/**
 * Xác định ngày tháng âm lịch hiệu lực để an sao khi gặp tháng nhuận theo trường phái:
 * - 'split': Phân đôi (1–15 giữ tháng hiện tại, 16–30 tính sang tháng sau) — Mặc định chuẩn
 * - 'next-month': Toàn bộ tháng nhuận tính sang tháng kế tiếp (Thiên Kỷ / Nghê Hải Hạ)
 * - 'prev-month': Toàn bộ tháng nhuận giữ nguyên tháng chính
 * - 'origin-month': Giữ nguyên cờ tháng nhuận
 */
export function resolveEffectiveLunarDate(year, month, day, policy = 'split') {
  if (policy !== 'split' && policy !== 'next-month' && policy !== 'prev-month' && policy !== 'origin-month') {
    throw new RangeError(
      `Chính sách tháng nhuận phải là 'split' | 'next-month' | 'prev-month' | 'origin-month'; nhận được ${String(policy)}`,
    );
  }
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const rawLunarMonth = Number(lunar.getMonth());
  const rawLunarDay = Number(lunar.getDay());
  const isRawLeapMonth = rawLunarMonth < 0;
  const absoluteMonth = Math.abs(rawLunarMonth);

  if (!isRawLeapMonth) {
    return {
      lunarYear: Number(lunar.getYear()),
      lunarMonth: absoluteMonth,
      lunarDay: rawLunarDay,
      isLeapMonth: false,
      rawLunarMonth,
      rawLunarDay,
    };
  }

  let lunarYear = Number(lunar.getYear());
  let lunarMonth = absoluteMonth;
  let isLeapMonth = false;

  if (policy === 'split') {
    if (rawLunarDay > 15) lunarMonth = absoluteMonth + 1;
  } else if (policy === 'next-month') {
    lunarMonth = absoluteMonth + 1;
  } else if (policy === 'origin-month') {
    isLeapMonth = true;
  }

  if (lunarMonth > 12) {
    lunarMonth = 1;
    lunarYear += 1;
  }

  let lunarDay = rawLunarDay;
  try {
    const monthKey = isLeapMonth ? -lunarMonth : lunarMonth;
    const dayCount = LunarMonth.fromYm(lunarYear, monthKey)?.getDayCount?.();
    if (typeof dayCount === 'number' && dayCount > 0 && lunarDay > dayCount) lunarDay = dayCount;
  } catch { /* ignore */ }

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    rawLunarMonth,
    rawLunarDay,
  };
}

/**
 * Tính Bát Tự Tứ Trụ (Năm - Tháng - Ngày - Giờ) từ ngày Dương lịch:
 * - `fourPillars` (Theo Tiết Khí Lập Xuân chuẩn Tử Bình Bát Tự)
 * - `fourPillarsLunar` (Theo Mùng 1 Tết Âm lịch & Ngũ Hổ Độn chuẩn Tử Vi Đẩu Số)
 */
export function getFourPillarsFromSolar(year, month, day, hourIndex = 0, policy = 'split') {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const effective = resolveEffectiveLunarDate(year, month, day, policy);

  const yearStem = STEMS_ZH.indexOf(lunar.getYearGan());
  const yearBranch = BRANCHES_ZH.indexOf(lunar.getYearZhi());

  let fourPillars = [];
  let fourPillarsLunar = [];
  let details = null;

  try {
    const branchIdx = hourIndex !== undefined && hourIndex >= 0 && hourIndex <= 11 ? hourIndex : 0;
    const effHour = branchIdx * 2;
    const ec = Solar.fromYmdHms(year, month, day, effHour, 0, 0).getLunar().getEightChar();

    const yearGZ = translateGanZhiToVi(ec.getYear());
    const monthGZ = translateGanZhiToVi(ec.getMonth());

    const dayStemIdx = STEMS_ZH.indexOf(lunar.getDayGan());
    const dayBranchIdx = BRANCHES_ZH.indexOf(lunar.getDayZhi());
    const dayGZ = `${THIEN_CAN[dayStemIdx]} ${DIA_CHI[dayBranchIdx]}`;

    const timeStemBase = (dayStemIdx % 5) * 2;
    const timeStemIdx = (timeStemBase + branchIdx) % 10;
    const timeGZ = `${THIEN_CAN[timeStemIdx]} ${DIA_CHI[branchIdx]}`;

    fourPillars = [yearGZ, monthGZ, dayGZ, timeGZ];

    // Tứ trụ theo lịch Âm (Mùng 1 Tết đổi năm, mùng 1 tháng Âm đổi tháng theo Ngũ Hổ Độn)
    const absM = effective.lunarMonth;
    const safeYearStem = yearStem >= 0 ? yearStem : 0;
    const safeYearBranch = yearBranch >= 0 ? yearBranch : 0;
    const yearGZLunar = `${THIEN_CAN[safeYearStem]} ${DIA_CHI[safeYearBranch]}`;
    const monthBranchIdx = (absM + 1) % 12;
    const monthStemBase = ((safeYearStem % 5) * 2 + 2) % 10;
    const monthStemIdx = (monthStemBase + (absM - 1)) % 10;
    const monthGZLunar = `${THIEN_CAN[monthStemIdx]} ${DIA_CHI[monthBranchIdx]}`;

    fourPillarsLunar = [yearGZLunar, monthGZLunar, dayGZ, timeGZ];
    details = {
      solarTermPillars: {
        year: yearGZ,
        month: monthGZ,
        day: dayGZ,
        hour: timeGZ,
      },
      lunarPillars: {
        year: yearGZLunar,
        month: monthGZLunar,
        day: dayGZ,
        hour: timeGZ,
      },
      dayStemIndex: dayStemIdx,
      dayBranchIndex: dayBranchIdx,
      hourStemIndex: timeStemIdx,
      hourBranchIndex: branchIdx,
    };
  } catch { /* ignore */ }

  return {
    lunarYear: effective.lunarYear,
    lunarMonth: effective.lunarMonth,
    lunarDay: effective.lunarDay,
    isLeapMonth: effective.isLeapMonth,
    rawLunarMonth: effective.rawLunarMonth,
    rawLunarDay: effective.rawLunarDay,
    yearStem: yearStem >= 0 ? yearStem : 0,
    yearBranch: yearBranch >= 0 ? yearBranch : 0,
    fourPillars,
    fourPillarsLunar,
    details,
  };
}
