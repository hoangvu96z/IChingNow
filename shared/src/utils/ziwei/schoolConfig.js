/**
 * Cấu Hình Trường Phái Tử Vi Đẩu Số (Nam Phái, Đẩu Số Toàn Thư, Trung Châu Phái, Thiên Kỷ)
 * Ported & localized in Vietnamese from lib/ziwei/school-config.ts, lib/ziwei/school-data.ts,
 * and lib/ziwei/school-tables.generated.ts.
 */
import { MIEU_HAM_MAP } from '../tuViEngineV11.js';

export const DEFAULT_LEAP_MONTH = 'split';
const LEAP_MONTH_VALUES = ['split', 'prev-month', 'next-month', 'origin-month'];

export const DEFAULT_SCHOOL_CONFIG = {
  brightnessSchool: 'v11',           // Mặc định Nam Phái Việt Nam (v11), hỗ trợ 'default' (Toàn Thư), 'XD1', 'ZZ' (Trung Châu), 'XD2'
  gengYearSihua: 'v11',              // Mặc định Nam Phái: Nhật - Vũ - Đồng - Âm ('GYWTY'), hỗ trợ 'GYWYT', 'GYWFT', 'GYWFX', 'GYWTX'
  tianmaSchool: 'year-branch',       // Khởi Thiên Mã theo Chi năm sinh
  tiankongSchool: 'normal',          // Khởi Thiên Không trước Thái Tuế 1 cung
  jiekongSchool: 'double',           // Tuần Không & Triệt Không chính - phụ
  kuiyueSchool: 'v11',               // Khôi Việt chuẩn Nam Phái / Toàn Thư
  tianshiTianshang: 'normal',        // Thiên Thương cư Nô Bộc, Thiên Sứ cư Tật Ách
  changshengSchool: 'yin-yang-shun-ni', // Thủy Thổ đồng cung tại Thân, Dương Nam Âm Nữ thuận, Âm Nam Dương Nữ nghịch
  lateZishi: 'next-day',             // Giờ Tý muộn (23:00–00:00) sang ngày hôm sau
  leapMonth: DEFAULT_LEAP_MONTH,     // Tháng nhuận phân đôi (1–15 tháng trước, 16–30 tháng sau)
};

export const SCHOOL_DEFAULT_CONFIG = DEFAULT_SCHOOL_CONFIG;

export const SCHOOL_CONFIG_LS_KEY = 'ziwei-school-config-v1';
export const SCHOOL_LEAP_MIGRATED_KEY = 'ziwei-school-leap-split-migrated';

export const SCHOOL_PARAM_KEYS = ['bs', 'gys', 'tm', 'tk', 'jk', 'ky', 'tst', 'cs', 'lz', 'lm'];

export const SCHOOL_LABELS = {
  brightnessSchool: 'Trường Phái Độ Sáng Sao',
  gengYearSihua: 'Tứ Hóa Can Canh',
  tianmaSchool: 'An Thiên Mã',
  tiankongSchool: 'An Thiên Không',
  jiekongSchool: 'An Triệt Không / Tuần Không',
  kuiyueSchool: 'An Thiên Khôi / Thiên Việt',
  tianshiTianshang: 'An Thiên Thương / Thiên Sứ',
  changshengSchool: 'Vòng Trường Sinh',
  lateZishi: 'Phân Đoạn Giờ Tý Sớm / Muộn',
  leapMonth: 'Chính Sách Tháng Nhuận',
};

export const SCHOOL_OPTIONS = {
  brightnessSchool: [
    { value: 'v11', label: 'Nam Phái Việt Nam (Chuẩn V11)', desc: 'Mặc định · Hệ 5 cấp (Miếu, Vượng, Đắc, Bình, Hãm) chuẩn Tử Vi Việt Nam' },
    { value: 'default', label: 'Đẩu Số Toàn Thư (Cổ Bản)', desc: 'Hệ 7 cấp (Miếu, Vượng, Đắc, Lợi, Bình, Bất, Hãm) theo Tử Vi Đẩu Số Toàn Thư' },
    { value: 'ZZ', label: 'Trung Châu Phái (Vương Đình Chi)', desc: 'Hệ 5 cấp (Miếu, Vượng, Bình, Nhàn, Hãm) truyền thống Trung Châu' },
    { value: 'XD1', label: 'Hiện Đại Hiệu Đính V1', desc: 'Bảng độ sáng hiệu đính hiện đại (Bản 1 · 7 cấp)' },
    { value: 'XD2', label: 'Hiện Đại Hiệu Đính V2', desc: 'Bảng độ sáng hiệu đính hiện đại (Bản 2 · 5 cấp)' },
  ],
  gengYearSihua: [
    { value: 'v11', label: 'Nhật · Vũ · Đồng · Âm (Nam Phái)', desc: 'Mặc định · Thái Dương Lộc, Vũ Khúc Quyền, Thiên Đồng Khoa, Thái Âm Kỵ' },
    { value: 'GYWYT', label: 'Nhật · Vũ · Âm · Đồng (Toàn Thư)', desc: 'Thái Dương Lộc, Vũ Khúc Quyền, Thái Âm Khoa, Thiên Đồng Kỵ' },
    { value: 'GYWTY', label: 'Nhật · Vũ · Đồng · Âm (Khoa Kỵ Hoán Đổi)', desc: 'Thái Dương Lộc, Vũ Khúc Quyền, Thiên Đồng Khoa, Thái Âm Kỵ' },
    { value: 'GYWFT', label: 'Nhật · Vũ · Phủ · Đồng (Trung Châu)', desc: 'Thái Dương Lộc, Vũ Khúc Quyền, Thiên Phủ Khoa, Thiên Đồng Kỵ' },
    { value: 'GYWFX', label: 'Nhật · Vũ · Phủ · Tướng', desc: 'Thái Dương Lộc, Vũ Khúc Quyền, Thiên Phủ Khoa, Thiên Tướng Kỵ' },
    { value: 'GYWTX', label: 'Nhật · Vũ · Đồng · Tướng', desc: 'Thái Dương Lộc, Vũ Khúc Quyền, Thiên Đồng Khoa, Thiên Tướng Kỵ' },
  ],
  tianmaSchool: [
    { value: 'year-branch', label: 'Theo Địa Chi Năm Sinh', desc: 'Mặc định · Tam hợp Chi năm sinh khởi Thiên Mã (Dần Ngọ Tuất tại Thân...)' },
    { value: 'month-branch', label: 'Theo Địa Chi Tháng Sinh', desc: 'An Thiên Mã theo Chi tháng sinh (Thai thứ Thiên Mã)' },
  ],
  tiankongSchool: [
    { value: 'normal', label: 'Thuận Trước Thái Tuế 1 Cung', desc: 'Mặc định · Thiên Không luôn đứng liền trước cung Thái Tuế' },
    { value: 'shun-jia-shi', label: 'Thuận Theo Giờ Sinh', desc: 'Khởi từ cung Tý thuận theo giờ sinh' },
  ],
  jiekongSchool: [
    { value: 'double', label: 'Chính Phụ Song Tinh', desc: 'Mặc định · Tuần Không và Triệt Không đóng 2 cung liền kề' },
    { value: 'single', label: 'Đơn Tinh Cổ Pháp', desc: 'Chỉ lấy cung Chính Không theo Âm Dương Can' },
    { value: 'zhanyan', label: 'Chiêm Nghiệm Phái', desc: 'Phép an Triệt Không theo Chiêm Nghiệm Phái' },
  ],
  kuiyueSchool: [
    { value: 'v11', label: 'Khôi Việt Nam Phái (Chuẩn V11)', desc: 'Mặc định · Giáp Mậu Canh Sửu Mùi, Đinh Bính Hợi Dậu, Tân Ngọ Dần' },
    { value: 'qs1', label: 'Đẩu Số Toàn Thư Quyết 1', desc: 'Giáp Mậu Canh Ngưu Dương, Tân Phùng Mã Hổ, Nhâm Quý Thố Xà' },
    { value: 'qs2', label: 'Đẩu Số Toàn Thư Quyết 2', desc: 'Khác biệt ở các tuổi Canh, Tân, Nhâm, Quý' },
    { value: 'zhong-yiming', label: 'Chung Nghĩa Minh Tiên Sinh', desc: 'Phép an Khôi Việt theo sách Chung Nghĩa Minh' },
    { value: 'network', label: 'Bản Lưu Truyền Hiện Đại', desc: 'Phép an Khôi Việt phổ biến trên phần mềm' },
  ],
  tianshiTianshang: [
    { value: 'normal', label: 'Cố Định Nô Bộc / Tật Ách', desc: 'Mặc định · Thiên Thương cư Nô Bộc, Thiên Sứ cư Tật Ách' },
    { value: 'zhongzhou', label: 'Trung Châu Phái (Hoán Đổi Âm Dương)', desc: 'Hoán đổi Thiên Thương / Thiên Sứ theo Âm Dương Nam Nữ' },
  ],
  changshengSchool: [
    { value: 'yin-yang-shun-ni', label: 'Phân Biệt Âm Dương Thuận Nghịch', desc: 'Mặc định · Dương Nam Âm Nữ thuận, Âm Nam Dương Nữ nghịch' },
    { value: 'shui-tu', label: 'Thủy Thổ Cộng Trường Sinh', desc: 'Thổ Ngũ Cục khởi Trường Sinh tại Thân cùng Thủy Nhị Cục' },
    { value: 'huo-tu', label: 'Hỏa Thổ Cộng Trường Sinh', desc: 'Thổ Ngũ Cục khởi Trường Sinh tại Dần cùng Hỏa Lục Cục' },
  ],
  lateZishi: [
    { value: 'next-day', label: 'Tính Sang Ngày Hôm Sau', desc: 'Mặc định · Sau 23:00 (Giờ Tý Muộn) bước sang ngày mới' },
    { value: 'current-day', label: 'Giữ Nguyên Ngày Hiện Tại', desc: 'Trường phái Thiên Kỷ Nghê Hải Hạ (23:00–24:00 vẫn thuộc ngày cũ)' },
    { value: 'all-current', label: 'Trụ Ngày Hôm Nay / Trụ Giờ Hôm Nay (Bát Tự)', desc: 'Cả Trụ Ngày và Trụ Giờ đều giữ ngày hiện tại' },
    { value: 'day-cur-time-next', label: 'Trụ Ngày Hôm Nay / Trụ Giờ Hôm Sau (Bát Tự)', desc: 'Trụ Ngày giữ nguyên, Can Giờ tính theo ngày mới' },
  ],
  leapMonth: [
    { value: 'split', label: 'Phân Đôi Giữa Tháng (15 Ngày)', desc: 'Mặc định · Ngày 1–15 tính tháng chính, ngày 16–30 tính sang tháng kế tiếp' },
    { value: 'prev-month', label: 'Tính Theo Tháng Chính', desc: 'Toàn bộ tháng nhuận giữ nguyên số tháng hiện tại' },
    { value: 'next-month', label: 'Tính Sang Tháng Kế Tiếp', desc: 'Thiên Kỷ Nghê Hải Hạ (Tháng 4 nhuận tính là tháng 5)' },
    { value: 'origin-month', label: 'Giữ Nguyên Cờ Tháng Nhuận', desc: 'Không điều chỉnh số tháng, giữ nguyên trạng thái tháng nhuận' },
  ],
};

function normalizeBrightness(cfg) {
  if (!cfg) return { ...DEFAULT_SCHOOL_CONFIG };
  return cfg.brightnessSchool === 'QS' ? { ...cfg, brightnessSchool: 'default' } : cfg;
}

export function loadSchoolConfig() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_SCHOOL_CONFIG };
  }
  try {
    const raw = localStorage.getItem(SCHOOL_CONFIG_LS_KEY);
    if (!raw) return { ...DEFAULT_SCHOOL_CONFIG };
    const parsed = JSON.parse(raw);
    return normalizeBrightness({ ...DEFAULT_SCHOOL_CONFIG, ...parsed });
  } catch {
    return { ...DEFAULT_SCHOOL_CONFIG };
  }
}

export function saveSchoolConfig(cfg) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SCHOOL_CONFIG_LS_KEY, JSON.stringify(cfg));
  } catch { /* ignore */ }
}

export function resetSchoolConfig() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(SCHOOL_CONFIG_LS_KEY);
  } catch { /* ignore */ }
}

export function configToParams(cfg) {
  const out = {};
  if (cfg.brightnessSchool && cfg.brightnessSchool !== DEFAULT_SCHOOL_CONFIG.brightnessSchool) out.bs = cfg.brightnessSchool;
  if (cfg.gengYearSihua && cfg.gengYearSihua !== DEFAULT_SCHOOL_CONFIG.gengYearSihua) out.gys = cfg.gengYearSihua;
  if (cfg.tianmaSchool && cfg.tianmaSchool !== 'year-branch') out.tm = cfg.tianmaSchool;
  if (cfg.tiankongSchool && cfg.tiankongSchool !== 'normal') out.tk = cfg.tiankongSchool;
  if (cfg.jiekongSchool && cfg.jiekongSchool !== 'double') out.jk = cfg.jiekongSchool;
  if (cfg.kuiyueSchool && cfg.kuiyueSchool !== DEFAULT_SCHOOL_CONFIG.kuiyueSchool) out.ky = cfg.kuiyueSchool;
  if (cfg.tianshiTianshang && cfg.tianshiTianshang !== 'normal') out.tst = cfg.tianshiTianshang;
  if (cfg.changshengSchool && cfg.changshengSchool !== 'yin-yang-shun-ni') out.cs = cfg.changshengSchool;
  if (cfg.lateZishi && cfg.lateZishi !== 'next-day') out.lz = cfg.lateZishi;
  if (cfg.leapMonth && cfg.leapMonth !== DEFAULT_LEAP_MONTH) out.lm = cfg.leapMonth;
  return out;
}

export function paramsToConfig(params) {
  const get = key => (params && typeof params.get === 'function' ? params.get(key) : params?.[key]);
  const lm = get('lm');
  return normalizeBrightness({
    brightnessSchool: get('bs') || DEFAULT_SCHOOL_CONFIG.brightnessSchool,
    gengYearSihua: get('gys') || DEFAULT_SCHOOL_CONFIG.gengYearSihua,
    tianmaSchool: get('tm') || DEFAULT_SCHOOL_CONFIG.tianmaSchool,
    tiankongSchool: get('tk') || DEFAULT_SCHOOL_CONFIG.tiankongSchool,
    jiekongSchool: get('jk') || DEFAULT_SCHOOL_CONFIG.jiekongSchool,
    kuiyueSchool: get('ky') || DEFAULT_SCHOOL_CONFIG.kuiyueSchool,
    tianshiTianshang: get('tst') || DEFAULT_SCHOOL_CONFIG.tianshiTianshang,
    changshengSchool: get('cs') || DEFAULT_SCHOOL_CONFIG.changshengSchool,
    lateZishi: get('lz') || DEFAULT_SCHOOL_CONFIG.lateZishi,
    leapMonth: LEAP_MONTH_VALUES.includes(lm) ? lm : DEFAULT_SCHOOL_CONFIG.leapMonth,
  });
}

// ─── Dữ Liệu Bảng Sao & Độ Sáng Theo Trường Phái ────────────────────────────
export const SCHOOL_STAR_ID_TO_NAME = {
  // 14 Chính Tinh
  1: 'Tử Vi', 2: 'Thiên Cơ', 3: 'Thái Dương', 4: 'Vũ Khúc', 5: 'Thiên Đồng', 6: 'Liêm Trinh',
  7: 'Thiên Phủ', 8: 'Thái Âm', 9: 'Tham Lang', 10: 'Cự Môn', 11: 'Thiên Tướng', 12: 'Thiên Lương',
  13: 'Thất Sát', 14: 'Phá Quân',
  // Lục Cát
  15: 'Văn Xương', 16: 'Văn Khúc', 17: 'Tả Phụ', 18: 'Hữu Bật', 19: 'Thiên Khôi', 20: 'Thiên Việt',
  // Lộc Mã + Lục Sát
  21: 'Lộc Tồn', 22: 'Thiên Mã', 23: 'Hỏa Tinh', 24: 'Linh Tinh', 25: 'Kình Dương', 26: 'Đà La',
  27: 'Địa Không', 28: 'Địa Kiếp',
  // Tạp Diệu
  29: 'Thiên Phúc', 30: 'Thiên Quan', 31: 'Thiên Hình', 32: 'Bát Tọa', 33: 'Tam Thai', 34: 'Thiên Tài',
  37: 'Thiên Không', 38: 'Thiên Diêu', 39: 'Thiên Khốc', 40: 'Thiên Hỷ', 41: 'Thiên Hư', 42: 'Thiên Quý', 43: 'Thiên Thọ',
  45: 'Thiên Đức', 48: 'Cô Thần', 51: 'Hồng Loan',
  52: 'Ân Quang', 53: 'Phá Toái', 55: 'Hoa Cái', 56: 'Giải Thần', 57: 'Quả Tú', 58: 'Phượng Cát',
  59: 'Phi Liêm', 60: 'Long Trì', 62: 'Đại Hao', 64: 'Thiên Sứ', 65: 'Thiên Thương',
  77: 'Triệt Không', 78: 'Tuần Không', 79: 'Thiên Giải', 80: 'Âm Sát', 81: 'Long Đức', 82: 'Đào Hoa',
};

export const SCHOOL_MING_ZHU_BY_DIZHI = {
  1: 'Tham Lang',  // Tý
  2: 'Cự Môn',     // Sửu
  3: 'Lộc Tồn',    // Dần
  4: 'Văn Khúc',   // Mão
  5: 'Liêm Trinh', // Thìn
  6: 'Vũ Khúc',    // Tỵ
  7: 'Phá Quân',   // Ngọ
  8: 'Vũ Khúc',    // Mùi
  9: 'Liêm Trinh', // Thân
  10: 'Văn Khúc',  // Dậu
  11: 'Lộc Tồn',   // Tuất
  12: 'Cự Môn',    // Hợi
};

export const SCHOOL_SHEN_ZHU_BY_DIZHI = {
  1: 'Linh Tinh',   // Tý (Nam Phái Linh Tinh, Bắc Phái Hỏa Tinh)
  2: 'Thiên Tướng', // Sửu
  3: 'Thiên Lương', // Dần
  4: 'Thiên Đồng',  // Mão
  5: 'Văn Xương',   // Thìn
  6: 'Thiên Cơ',    // Tỵ
  7: 'Hỏa Tinh',    // Ngọ
  8: 'Thiên Tướng', // Mùi
  9: 'Thiên Lương', // Thân
  10: 'Thiên Đồng', // Dậu
  11: 'Văn Xương',  // Tuất
  12: 'Thiên Cơ',   // Hợi
};

// 85-star × 12-palace tables (1-indexed: row = starId, col = branchIdx + 1 where 1=Tý..12=Hợi)
export const SCHOOL_AX = {
  SB_QS: [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,1,2,2,3,2,1,1,2,2,3,2],[0,1,7,3,2,4,5,1,7,3,2,4,5],[0,7,6,2,1,2,2,2,3,3,5,6,7],[0,2,1,3,4,1,5,2,1,3,4,1,5],[0,2,6,4,5,5,1,7,6,2,5,5,1],[0,5,4,1,5,4,7,5,4,1,5,4,7],[0,1,1,1,3,1,3,2,1,3,2,1,3],[0,1,1,2,7,7,7,6,6,4,2,2,1],[0,2,1,5,4,1,7,2,1,5,4,1,7],[0,2,6,1,1,7,2,2,6,1,1,7,2],[0,1,1,1,7,3,3,1,3,1,7,3,3],[0,1,2,1,1,1,3,1,2,7,3,1,7],[0,2,1,1,2,1,5,2,1,1,2,1,5],[0,1,2,3,7,2,5,1,2,3,7,2,5],[0,3,1,7,4,3,1,7,4,3,1,7,4],[0,3,1,5,2,3,1,7,2,3,1,7,2],[0,2,1,1,7,1,5,2,1,5,7,1,6],[0,1,1,2,7,1,5,2,1,6,7,1,5],[0,2,2,0,1,0,0,1,0,0,0,0,2],[0,0,0,2,0,0,2,0,2,1,1,0,0],[0,1,0,1,1,0,1,1,0,1,1,0,1],[0,0,0,2,0,0,5,0,0,2,0,0,5],[0,7,3,1,4,7,3,1,4,7,3,1,4],[0,7,3,1,4,7,3,1,4,7,3,1,4],[0,7,1,0,7,1,0,7,1,0,7,1,0],[0,0,1,7,0,1,7,0,1,7,0,1,7],[0,5,7,7,5,7,1,1,5,1,1,7,7],[0,7,7,5,5,7,6,1,5,1,5,5,7],[0,5,0,2,5,0,2,5,0,1,1,0,1],[0,0,0,5,2,2,2,1,1,0,5,5,2],[0,5,7,1,1,5,7,5,7,7,1,1,7],[0,7,1,1,5,2,1,2,5,1,1,5,1],[0,5,1,5,7,1,5,2,1,2,1,2,5],[0,2,5,1,2,7,1,2,5,1,2,7,1],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,5,7,5,1,1,1,7,2,2,7,5],[0,7,5,2,1,7,5,5,2,7,1,1,7],[0,5,1,5,1,5,6,7,5,1,6,5,5],[0,2,7,1,2,7,1,1,7,2,1,7,2],[0,7,1,2,1,7,2,5,7,1,2,7,5],[0,1,2,5,2,2,5,1,2,7,1,2,5],[0,5,1,2,7,1,5,5,2,2,5,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,1,5,5,1,2,2,1,5,6,1,5],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,5,0,0,7,0,0,5,0,0,7],[0,7,0,0,5,0,0,7,0,0,5,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,7,2,1,1,2,2,7,1,2,7,1],[0,5,1,5,1,1,5,1,2,5,7,1,6],[0,0,7,0,0,0,7,0,0,0,5,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,7,0,0,1,0,0,7,0,0,5,0],[0,1,5,1,1,1,2,1,5,6,2,1,5],[0,0,5,0,0,7,0,0,6,0,0,7,0],[0,1,5,1,2,7,1,5,7,6,1,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,5,5,1,1,7,6,1,5,1,7,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,5,7,6,5,7,2,5,7,6,5,7],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,7,5,5,7,5,5,5,5,7,7,2],[0,7,5,5,7,5,5,7,7,5,5,5,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,6,7,5,7,1,1,1,1,1,0,0],[0,7,5,7,5,7,1,1,7,1,1,7,5],[0,1,3,1,1,1,2,1,3,4,2,1,3],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,0,0,5,0,0,7,0,0,5,0,0]],
  SB_XD1: [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,1,1,2,3,2,1,1,2,2,3,2],[0,1,7,3,2,4,5,1,7,3,2,4,5],[0,7,6,2,1,2,2,1,3,4,5,7,7],[0,2,1,3,4,1,5,2,1,3,4,1,5],[0,2,6,4,1,5,1,7,6,2,5,5,1],[0,5,4,1,5,4,7,5,4,1,5,4,7],[0,1,1,1,3,2,3,2,1,3,2,2,3],[0,1,1,6,7,7,7,7,5,4,2,2,1],[0,2,1,5,3,1,7,2,1,5,4,1,7],[0,2,6,1,1,5,5,2,5,1,1,5,2],[0,1,1,1,7,5,3,3,3,1,7,3,3],[0,1,2,1,2,1,7,1,2,7,3,1,7],[0,2,1,1,2,3,5,2,1,1,2,1,5],[0,1,2,3,7,2,5,1,2,3,7,2,5],[0,3,1,7,2,3,1,7,4,3,1,7,4],[0,3,1,5,2,3,1,7,2,3,1,7,2],[0,2,1,1,7,1,5,2,1,5,7,1,6],[0,1,1,2,7,1,5,2,1,6,7,1,5],[0,2,2,0,1,0,0,1,0,0,0,0,2],[0,0,0,2,0,0,2,0,2,1,1,0,0],[0,1,0,1,1,0,1,1,0,1,1,0,1],[0,0,0,2,0,0,5,0,0,2,0,0,5],[0,7,3,1,4,7,3,1,4,7,3,1,4],[0,7,3,1,4,7,3,1,4,7,3,1,4],[0,2,1,4,7,1,4,7,1,4,2,1,4],[0,4,1,7,4,1,7,4,1,7,4,1,7],[0,5,7,7,5,7,1,1,5,1,1,7,7],[0,7,7,5,5,7,6,1,5,1,5,5,7],[0,5,0,2,5,0,2,5,0,1,1,0,1],[0,0,0,5,2,2,2,1,1,0,5,5,2],[0,5,7,1,1,5,7,5,7,7,1,1,7],[0,7,1,1,5,2,1,2,5,1,1,5,1],[0,5,1,5,7,1,5,2,1,2,1,2,5],[0,2,5,1,2,7,1,2,5,1,2,7,1],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,5,7,5,1,1,1,7,2,2,7,5],[0,7,5,2,1,7,5,5,2,7,1,1,7],[0,5,1,5,1,5,6,7,5,1,6,5,5],[0,2,7,1,2,7,1,1,7,2,1,7,2],[0,7,1,2,1,7,2,5,7,1,2,7,5],[0,1,2,5,2,2,5,1,2,7,1,2,5],[0,5,1,2,7,1,5,5,2,2,5,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,1,5,5,1,2,2,1,5,6,1,5],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,5,0,0,7,0,0,5,0,0,7],[0,7,0,0,5,0,0,7,0,0,5,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,7,2,1,1,2,2,7,1,2,7,1],[0,5,1,5,1,1,5,1,2,5,7,1,6],[0,0,7,0,0,0,7,0,0,0,5,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,7,0,0,1,0,0,7,0,0,5,0],[0,1,5,1,1,1,2,1,5,6,2,1,5],[0,0,5,0,0,7,0,0,6,0,0,7,0],[0,1,5,1,2,7,1,5,7,6,1,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,5,5,1,1,7,6,1,5,1,7,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,5,7,6,5,7,2,5,7,6,5,7],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,7,5,5,7,5,5,5,5,7,7,2],[0,7,5,5,7,5,5,7,7,5,5,5,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,6,7,5,7,1,1,1,1,1,0,0],[0,7,5,7,5,7,1,1,7,1,1,7,5],[0,1,3,1,1,1,2,1,3,4,2,1,3],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,7,0,0,5,0,0,7,0,0,5,0,0]],
  SB_ZZ: [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,3,1,1,2,5,2,1,1,2,3,4,2],[0,1,5,2,2,1,3,1,5,3,2,1,3],[0,5,5,2,1,2,2,1,3,4,4,5,5],[0,2,1,4,5,1,3,2,1,3,2,1,3],[0,2,5,4,1,3,1,5,5,2,3,3,1],[0,3,2,1,4,2,5,3,1,1,3,2,5],[0,1,1,1,3,1,3,2,1,3,5,1,2],[0,1,1,4,5,4,5,5,3,3,2,2,1],[0,2,1,3,4,1,5,2,1,3,3,1,5],[0,2,2,1,1,3,3,2,5,1,1,2,2],[0,1,1,1,5,2,3,2,4,1,5,4,3],[0,1,2,1,1,2,5,1,2,5,4,2,5],[0,2,1,1,5,2,3,2,2,1,4,1,3],[0,1,2,5,2,2,4,1,1,5,5,2,3],[0,2,1,5,3,2,1,5,3,2,1,5,2],[0,1,1,3,2,1,1,5,2,3,1,5,2],[0,2,1,1,5,1,3,2,1,3,5,1,4],[0,1,1,2,5,1,3,2,1,4,5,1,3],[0,2,2,0,1,0,0,1,0,0,0,0,2],[0,0,0,2,0,0,2,0,2,1,1,0,0],[0,2,0,1,2,0,1,2,0,1,2,0,1],[0,0,0,2,0,0,3,0,0,2,0,0,3],[0,3,2,1,3,4,2,1,4,5,5,1,3],[0,5,5,1,1,2,2,1,2,2,5,1,1],[0,5,1,0,5,1,0,3,1,0,5,1,0],[0,0,1,5,0,1,5,0,1,5,0,1,5],[0,3,5,5,3,5,1,1,3,1,1,5,5],[0,5,5,3,3,5,4,1,3,1,3,3,2],[0,3,0,2,3,0,2,3,0,1,1,0,1],[0,0,0,3,2,2,2,1,1,0,3,3,2],[0,3,5,1,1,3,5,3,5,5,1,1,5],[0,5,1,1,3,2,1,2,3,1,1,3,1],[0,3,1,3,5,1,3,2,1,2,1,2,3],[0,2,3,1,2,5,1,2,3,1,2,5,1],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,3,5,3,1,1,1,5,2,2,5,3],[0,5,3,2,1,5,3,3,2,5,1,1,5],[0,3,1,3,1,3,4,5,3,1,4,3,3],[0,2,5,1,2,5,1,1,5,2,1,5,2],[0,5,1,2,1,5,2,3,5,1,2,5,3],[0,1,2,3,2,2,3,1,2,5,1,2,3],[0,3,1,2,5,1,3,3,2,2,3,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,1,3,3,1,2,2,1,3,4,1,3],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,3,0,0,5,0,0,3,0,0,5],[0,5,0,0,3,0,0,5,0,0,3,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,5,2,1,1,2,2,5,1,2,5,1],[0,3,1,3,1,1,3,1,2,3,5,1,4],[0,0,5,0,0,0,5,0,0,0,3,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,5,0,0,1,0,0,5,0,0,3,0],[0,1,3,1,1,1,2,1,3,4,2,1,3],[0,0,3,0,0,5,0,0,4,0,0,5,0],[0,1,3,1,2,5,1,3,5,4,1,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,3,3,1,1,5,4,1,3,1,5,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,3,5,4,3,5,2,3,5,4,3,5],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,5,3,3,5,3,3,3,3,5,5,2],[0,5,3,3,5,3,3,5,5,3,3,3,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,4,5,3,5,1,1,1,1,1,0,0],[0,5,3,5,3,5,1,1,5,1,1,5,3],[0,1,3,1,1,1,2,1,3,4,2,1,3],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,0,0,3,0,0,5,0,0,3,0,0]],
  SB_XD2: [[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,4,1,1,2,4,2,1,1,2,3,5,2],[0,1,5,2,2,2,3,1,5,2,2,2,3],[0,5,5,2,1,2,2,1,2,3,3,5,5],[0,2,1,3,5,1,3,2,1,3,2,1,3],[0,2,5,3,1,2,1,5,5,2,3,3,1],[0,3,2,1,4,2,5,3,1,1,3,2,5],[0,2,1,1,3,1,2,2,1,2,3,1,2],[0,1,1,5,5,5,5,5,5,2,2,1,1],[0,2,1,3,2,1,5,2,1,3,2,1,5],[0,2,5,1,2,5,1,2,5,1,2,5,1],[0,1,1,1,5,2,3,2,3,1,5,5,3],[0,1,2,1,1,2,5,1,2,5,3,2,5],[0,2,2,1,5,1,3,2,2,1,3,1,3],[0,1,1,5,2,2,3,1,1,5,5,2,3],[0,2,1,5,3,2,1,4,3,2,1,5,3],[0,1,2,5,3,2,1,3,2,2,1,5,3],[0,2,1,2,1,1,2,2,1,2,2,1,2],[0,2,1,2,1,1,2,2,1,2,2,1,2],[0,1,2,1,1,1,1,1,2,1,1,1,1],[0,1,2,1,1,1,1,1,2,1,1,1,1],[0,2,0,1,2,0,1,2,0,1,2,0,1],[0,0,0,2,0,0,3,0,0,2,0,0,3],[0,5,3,1,2,5,3,1,2,5,3,1,2],[0,5,3,1,2,5,3,1,2,5,3,1,2],[0,5,1,0,5,1,0,5,1,0,5,1,0],[0,0,1,5,0,1,5,0,1,5,0,1,5],[0,3,5,5,3,5,1,1,3,1,1,5,5],[0,5,5,3,3,5,4,1,3,1,3,3,2],[0,3,0,2,3,0,2,3,0,1,1,0,1],[0,0,0,3,2,2,2,1,1,0,3,3,2],[0,3,5,1,1,3,5,3,5,5,1,1,5],[0,5,1,1,3,2,1,2,3,1,1,3,1],[0,3,1,3,5,1,3,2,1,2,1,2,3],[0,2,3,1,2,5,1,2,3,1,2,5,1],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,3,5,3,1,1,1,5,2,2,5,3],[0,5,3,2,1,5,3,3,2,5,1,1,5],[0,3,1,3,1,3,4,5,3,1,4,3,3],[0,2,5,1,2,5,1,1,5,2,1,5,2],[0,5,1,2,1,5,2,3,5,1,2,5,3],[0,1,2,3,2,2,3,1,2,5,1,2,3],[0,3,1,2,5,1,3,3,2,2,3,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,1,3,3,1,2,2,1,3,4,1,3],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,3,0,0,5,0,0,3,0,0,5],[0,5,0,0,3,0,0,5,0,0,3,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,1,5,2,1,1,2,2,5,1,2,5,1],[0,3,1,3,1,1,3,1,2,3,5,1,4],[0,0,5,0,0,0,5,0,0,0,3,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,5,0,0,1,0,0,5,0,0,3,0],[0,1,3,1,1,1,2,1,3,4,2,1,3],[0,0,3,0,0,5,0,0,4,0,0,5,0],[0,1,3,1,2,5,1,3,5,4,1,1,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,3,3,1,1,5,4,1,3,1,5,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,2,3,5,4,3,5,2,3,5,4,3,5],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,5,3,3,5,3,3,3,3,5,5,2],[0,5,3,3,5,3,3,5,5,3,3,3,2],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,4,5,3,5,1,1,1,1,1,0,0],[0,5,3,5,3,5,1,1,5,1,1,5,3],[0,1,3,1,1,1,2,1,3,4,2,1,3],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,5,0,0,3,0,0,5,0,0,3,0,0]],
};

export const BRIGHTNESS_NUM_TO_VI_7 = {
  1: { code: 'M', label: 'Miếu' },
  2: { code: 'V', label: 'Vượng' },
  3: { code: 'Đ', label: 'Đắc' },
  4: { code: 'L', label: 'Lợi' },
  5: { code: 'B', label: 'Bình' },
  6: { code: 'Bt', label: 'Bất' },
  7: { code: 'H', label: 'Hãm' },
};

export const BRIGHTNESS_NUM_TO_VI_5 = {
  1: { code: 'M', label: 'Miếu' },
  2: { code: 'V', label: 'Vượng' },
  3: { code: 'B', label: 'Bình' },
  4: { code: 'N', label: 'Nhàn' },
  5: { code: 'H', label: 'Hãm' },
};

export const V11_CODE_TO_LABEL = {
  M: 'Miếu',
  V: 'Vượng',
  Đ: 'Đắc',
  B: 'Bình',
  H: 'Hãm',
};

const SCHOOL_NAME_TO_ID = {};
for (const [idStr, nameVi] of Object.entries(SCHOOL_STAR_ID_TO_NAME)) {
  SCHOOL_NAME_TO_ID[nameVi] = Number(idStr);
}
const EXTRA_STAR_ALIASES = {
  'Hàm Trì': 82,
  'Phượng Các': 58,
  'Bác Sĩ': 0,
  '紫微': 1, '天机': 2, '太阳': 3, '武曲': 4, '天同': 5, '廉贞': 6,
  '天府': 7, '太阴': 8, '贪狼': 9, '巨门': 10, '天相': 11, '天梁': 12,
  '七杀': 13, '破军': 14,
  '文昌': 15, '文曲': 16, '左辅': 17, '右弼': 18, '天魁': 19, '天钺': 20,
  '禄存': 21, '天马': 22, '火星': 23, '铃星': 24, '擎羊': 25, '陀罗': 26,
  '地空': 27, '地劫': 28,
};
for (const [alias, id] of Object.entries(EXTRA_STAR_ALIASES)) {
  if (id > 0) SCHOOL_NAME_TO_ID[alias] = id;
}

const SB_BY_SCHOOL = {
  default: SCHOOL_AX.SB_QS,
  QS: SCHOOL_AX.SB_QS,
  XD1: SCHOOL_AX.SB_XD1,
  ZZ: SCHOOL_AX.SB_ZZ,
  XD2: SCHOOL_AX.SB_XD2,
};

/**
 * Tra cứu độ sáng của sao tại địa chi `branchIdx` (0=Tý .. 11=Hợi) theo trường phái:
 * - `'v11'`: Nam Phái Việt Nam (MIEU_HAM_MAP cho 14 Chính Tinh + fallback Toàn Thư cho Phụ Tinh)
 * - `'default'` / `'QS'`: Đẩu Số Toàn Thư (7 cấp: Miếu, Vượng, Đắc, Lợi, Bình, Bất, Hãm)
 * - `'XD1'`: Hiện Đại 1 (7 cấp)
 * - `'ZZ'`: Trung Châu Phái (5 cấp: Miếu, Vượng, Bình, Nhàn, Hãm)
 * - `'XD2'`: Hiện Đại 2 (5 cấp)
 *
 * @returns {{ code: string, label: string, tier: 'bright' | 'normal' | 'dim' } | null}
 */
export function getSchoolStarBrightness(starName, branchIdx, school = 'v11') {
  if (!starName || typeof starName !== 'string') return null;
  const cleanName = starName.replace(/^L\./, '').split('(')[0].trim();
  const bIdx = ((Math.trunc(branchIdx) % 12) + 12) % 12;

  if (school === 'v11') {
    const v11Row = MIEU_HAM_MAP[cleanName];
    if (v11Row && v11Row[bIdx]) {
      const code = v11Row[bIdx];
      const label = V11_CODE_TO_LABEL[code] || code;
      const tier = (code === 'M' || code === 'V') ? 'bright' : (code === 'H' ? 'dim' : 'normal');
      return { code, label, tier };
    }
  }

  const effectiveSchool = (school === 'v11' || school === 'default') ? 'QS' : school;
  const id = SCHOOL_NAME_TO_ID[cleanName];
  if (!id) return null;
  const table = SB_BY_SCHOOL[effectiveSchool] || SCHOOL_AX.SB_QS;
  const v = table?.[id]?.[bIdx + 1];
  if (!v || v === 0) return null;

  const isFiveTier = effectiveSchool === 'ZZ' || effectiveSchool === 'XD2';
  const entry = isFiveTier ? BRIGHTNESS_NUM_TO_VI_5[v] : BRIGHTNESS_NUM_TO_VI_7[v];
  if (!entry) return null;

  const tier = (entry.code === 'M' || entry.code === 'V')
    ? 'bright'
    : (entry.code === 'H' || entry.code === 'Bt' || entry.code === 'N' ? 'dim' : 'normal');

  return {
    code: entry.code,
    label: entry.label,
    tier,
  };
}

export function schoolStarBrightness(starName, branchIdx, school = 'default') {
  const res = getSchoolStarBrightness(starName, branchIdx, school);
  return res ? res.label : undefined;
}

export function validateSchoolData() {
  const errors = [];
  if (Object.keys(SCHOOL_MING_ZHU_BY_DIZHI).length !== 12) {
    errors.push(`MING_ZHU expected 12 entries, got ${Object.keys(SCHOOL_MING_ZHU_BY_DIZHI).length}`);
  }
  if (Object.keys(SCHOOL_SHEN_ZHU_BY_DIZHI).length !== 12) {
    errors.push(`SHEN_ZHU expected 12 entries, got ${Object.keys(SCHOOL_SHEN_ZHU_BY_DIZHI).length}`);
  }
  for (const [name, tbl] of Object.entries(SB_BY_SCHOOL)) {
    if (!tbl || tbl.length < 15) errors.push(`Bảng độ sáng ${name} không đủ hàng`);
  }
  return { ok: errors.length === 0, errors };
}
