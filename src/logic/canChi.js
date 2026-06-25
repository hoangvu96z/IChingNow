/**
 * Module tính Can Chi thời gian dùng thư viện lunar-javascript
 * 
 * lunar-javascript: https://github.com/6tail/lunar-javascript
 * Cung cấp chuyển đổi dương lịch ↔ âm lịch + Can Chi đầy đủ
 */

import { Solar } from 'lunar-javascript';
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  STEM_BY_NAME,
  BRANCH_BY_NAME,
  getKhongVong,
} from '../data/lucYao.js';

// lunar-javascript trả về Hán tự → cần map sang tên tiếng Việt
const ZH_STEM_TO_VI = {
  '甲':'Giáp','乙':'Ất','丙':'Bính','丁':'Đinh','戊':'Mậu',
  '己':'Kỷ','庚':'Canh','辛':'Tân','壬':'Nhâm','癸':'Quý',
};
const ZH_BRANCH_TO_VI = {
  '子':'Tý','丑':'Sửu','寅':'Dần','卯':'Mão','辰':'Thìn','巳':'Tỵ',
  '午':'Ngọ','未':'Mùi','申':'Thân','酉':'Dậu','戌':'Tuất','亥':'Hợi',
};

function toViStem(zh)   { return ZH_STEM_TO_VI[zh]   || zh; }
function toViBranch(zh) { return ZH_BRANCH_TO_VI[zh] || zh; }

/**
 * Lấy Can Chi đầy đủ cho một thời điểm dương lịch
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:mm'
 * @returns {Object} canChi - tất cả thông tin Can Chi
 */
export function getCanChiFromDate(dateStr, timeStr = '00:00') {
  if (!dateStr) return null;

  try {
    const [year, month, day]   = dateStr.split('-').map(Number);
    const [hour = 0, min = 0]  = (timeStr || '00:00').split(':').map(Number);

    // Chuyển giờ sang địa chi giờ (Tý = 0, Sửu = 1, ...)
    // Giờ Tý: 23:00-00:59, Sửu: 01:00-02:59, ...
    const hourBranchId = getHourBranchId(hour);

    // Dùng lunar-javascript để lấy Can Chi
    const solar  = Solar.fromYmd(year, month, day);
    const lunar  = solar.getLunar();
    const eightChar = lunar.getEightChar();  // Bát Tự

    // Can Chi Năm, Tháng, Ngày từ Bát Tự (lunar-javascript trả Hán tự → convert sang tiếng Việt)
    const namCan   = toViStem(eightChar.getYearGan());
    const namChi   = toViBranch(eightChar.getYearZhi());
    const thangCan = toViStem(eightChar.getMonthGan());
    const thangChi = toViBranch(eightChar.getMonthZhi());
    const ngayCan  = toViStem(eightChar.getDayGan());
    const ngayChi  = toViBranch(eightChar.getDayZhi());

    // Can Chi Giờ — tính theo Can Ngày và Địa Chi Giờ
    const ngayCanId = STEM_BY_NAME[ngayCan]?.id ?? 0;
    const gioCanId  = getHourStemId(ngayCanId, hourBranchId);
    const gioCan    = HEAVENLY_STEMS[gioCanId]?.name ?? '?';
    const gioChi    = EARTHLY_BRANCHES[hourBranchId]?.name ?? '?';

    // Không Vong dựa vào Can Chi Ngày
    const khongVong = getKhongVong(ngayCan, ngayChi);

    // Âm lịch
    const lunarYear  = lunar.getYear();
    const lunarMonth = lunar.getMonth();
    const lunarDay   = lunar.getDay();

    return {
      // Năm
      namCan, namChi,
      namCanObj:  STEM_BY_NAME[namCan]   || null,
      namChiObj:  BRANCH_BY_NAME[namChi] || null,
      // Tháng
      thangCan, thangChi,
      thangCanObj:  STEM_BY_NAME[thangCan]   || null,
      thangChiObj:  BRANCH_BY_NAME[thangChi] || null,
      // Ngày
      ngayCan, ngayChi,
      ngayCanObj:  STEM_BY_NAME[ngayCan]   || null,
      ngayChiObj:  BRANCH_BY_NAME[ngayChi] || null,
      // Giờ
      gioCan, gioChi,
      gioCanObj:  STEM_BY_NAME[gioCan]   || null,
      gioChiObj:  BRANCH_BY_NAME[gioChi] || null,
      // Không Vong
      khongVong,
      // Âm lịch
      lunarDate: `${lunarYear}/${lunarMonth < 0 ? '(N)' + Math.abs(lunarMonth) : lunarMonth}/${lunarDay}`,
      // Hiển thị đầy đủ
      label: `${ngayCan} ${ngayChi}, ${thangCan} ${thangChi}, ${namCan} ${namChi}`,
    };
  } catch (e) {
    console.error('getCanChiFromDate error:', e);
    return getFallbackCanChi(dateStr, timeStr);
  }
}

/**
 * Tính id Địa Chi Giờ từ giờ dương lịch
 * Tý (23-1h)=0, Sửu(1-3h)=1, ... Hợi(21-23h)=11
 */
export function getHourBranchId(hour) {
  if (hour === 23) return 0; // Tý đêm
  return Math.floor((hour + 1) / 2) % 12;
}

/**
 * Tính id Thiên Can Giờ từ Can Ngày và Địa Chi Giờ
 * Công thức: 五子遁年起月法 áp dụng cho giờ
 * Can Ngày Giáp/Kỷ (0,5): giờ Tý = Giáp (0)
 * Can Ngày Ất/Canh (1,6): giờ Tý = Bính (2)
 * Can Ngày Bính/Tân (2,7): giờ Tý = Mậu (4)
 * Can Ngày Đinh/Nhâm (3,8): giờ Tý = Canh (6)
 * Can Ngày Mậu/Quý (4,9): giờ Tý = Nhâm (8)
 */
export function getHourStemId(dayStemId, hourBranchId) {
  const base = [0, 2, 4, 6, 8][dayStemId % 5]; // Can giờ Tý của ngày đó
  return (base + hourBranchId) % 10;
}

/**
 * Fallback: tính Can Chi bằng công thức thuần toán (khi lunar-javascript lỗi)
 */
function getFallbackCanChi(dateStr, timeStr) {
  // Ngày gốc: 1900-01-31 = Giáp Tý (0,0) theo lịch Can Chi
  const [y, m, d]   = dateStr.split('-').map(Number);
  const [hour = 0]  = (timeStr || '00:00').split(':').map(Number);
  const targetDate  = new Date(y, m - 1, d);
  const baseDate    = new Date(1900, 0, 31); // Giáp Tý
  const diffDays    = Math.round((targetDate - baseDate) / 86400000);

  const ngayCanId   = ((diffDays % 10) + 10) % 10;
  const ngayChiId   = ((diffDays % 12) + 12) % 12;
  const ngayCan     = HEAVENLY_STEMS[ngayCanId].name;
  const ngayChi     = EARTHLY_BRANCHES[ngayChiId].name;

  const hourBranchId = getHourBranchId(hour);
  const gioCanId     = getHourStemId(ngayCanId, hourBranchId);

  const khongVong = getKhongVong(ngayCan, ngayChi);

  return {
    namCan: '?', namChi: '?',
    thangCan: '?', thangChi: '?',
    ngayCan,   ngayChi,
    ngayCanObj:  HEAVENLY_STEMS[ngayCanId],
    ngayChiObj:  EARTHLY_BRANCHES[ngayChiId],
    gioCan:  HEAVENLY_STEMS[gioCanId].name,
    gioChi:  EARTHLY_BRANCHES[hourBranchId].name,
    gioCanObj:  HEAVENLY_STEMS[gioCanId],
    gioChiObj:  EARTHLY_BRANCHES[hourBranchId],
    khongVong,
    lunarDate: '(tính gần đúng)',
    label: `${ngayCan} ${ngayChi} (gần đúng)`,
    isFallback: true,
  };
}
