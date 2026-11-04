/**
 * Nhận Diện 45+ Cách Cục Kinh Điển Tử Vi Đẩu Số (Kèm Điều Kiện Cần / Điểm Cộng / Phá Cách & Xuất Xứ Cổ Thư)
 * Ported & localized in Vietnamese from lib/ziwei/patterns.ts.
 * Hoạt động trực tiếp trên kết quả `anLaSoTuVi` (`chart.palates`).
 */
import { DIA_CHI } from './solarTime.js';
import { getSiHuaByStem } from './sihua.js';

export const LEVEL_LABELS = {
  excellent: 'Thượng Cách',
  good: 'Cát Cách',
  neutral: 'Bình Hòa',
  caution: 'Hung Cách / Cần Lưu Ý',
};

const SHA_NAMES = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp'];
const SHA_HARD = ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh'];
const SHA_KONG = ['Địa Không', 'Địa Kiếp'];

function cleanPalaceName(chucNang) {
  return String(chucNang || '').replace(/\s*<THÂN>/g, '').trim();
}

function getPalates(chart) {
  return chart?.palates || chart?.palaces || [];
}

function getMenhBranch(chart) {
  const palates = getPalates(chart);
  const menh = palates.find(p => p.isMenh || cleanPalaceName(p.chucNang) === 'Mệnh');
  if (menh) return menh.chiIndex;
  const idx = DIA_CHI.indexOf(chart?.menhCung);
  return idx >= 0 ? idx : 0;
}

function getThanBranch(chart) {
  const palates = getPalates(chart);
  const than = palates.find(p => p.isThan || String(p.chucNang || '').includes('<THÂN>'));
  if (than) return than.chiIndex;
  const idx = DIA_CHI.indexOf(chart?.thanCung);
  return idx >= 0 ? idx : 0;
}

function getMajorStarNames(palace) {
  if (!palace) return [];
  return (palace.chinhTinh || []).map(s => String(s).split('(')[0].trim());
}

function getMinorStarNames(palace) {
  if (!palace) return [];
  return (palace.phuTinh || [])
    .filter(s => !String(s).startsWith('L.'))
    .map(s => String(s).split('(')[0].trim());
}

function getAllStarNames(palace) {
  return [...getMajorStarNames(palace), ...getMinorStarNames(palace)];
}

function hasStar(palace, name) {
  return getAllStarNames(palace).includes(name);
}

function findStarPalace(chart, name) {
  return getPalates(chart).find(p => hasStar(p, name));
}

function getPalaceByBranch(chart, branch) {
  const b = ((Math.trunc(branch) % 12) + 12) % 12;
  return getPalates(chart).find(p => p.chiIndex === b);
}

function getStarBrightnessCode(palace, starName) {
  if (!palace) return null;
  const raw = (palace.chinhTinh || []).find(s => String(s).split('(')[0].trim() === starName);
  if (!raw) return null;
  const m = String(raw).match(/\(([^)]+)\)/);
  return m ? m[1].trim() : null;
}

function isBright(palace, starName) {
  const code = getStarBrightnessCode(palace, starName);
  return code === 'M' || code === 'V' || code === 'Đ';
}

function isDim(palace, starName) {
  const code = getStarBrightnessCode(palace, starName);
  return code === 'H';
}

function shaCountInPalace(palace, list = SHA_HARD) {
  const stars = getAllStarNames(palace);
  return stars.filter(s => list.includes(s)).length;
}

function hasShaInPalace(palace, list = SHA_NAMES) {
  return shaCountInPalace(palace, list) > 0;
}

function getSanFangPalaces(chart) {
  const m = getMenhBranch(chart);
  const branches = [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
  return getPalates(chart).filter(p => branches.includes(p.chiIndex));
}

function isInSanFang(chart, branch) {
  const m = getMenhBranch(chart);
  return [m, (m + 4) % 12, (m + 8) % 12, (m + 6) % 12].includes(branch);
}

function getDuiGong(chart, branch) {
  return getPalaceByBranch(chart, (branch + 6) % 12);
}

function getJiaPalaces(chart, branch) {
  return {
    prev: getPalaceByBranch(chart, (branch + 11) % 12),
    next: getPalaceByBranch(chart, (branch + 1) % 12),
  };
}

function sanFangAllStars(chart) {
  return new Set(getSanFangPalaces(chart).flatMap(p => getAllStarNames(p)));
}

function sanFangShaCount(chart, list = SHA_HARD) {
  return getSanFangPalaces(chart).reduce((sum, p) => sum + shaCountInPalace(p, list), 0);
}

function getChartBirthSiHuaMap(chart) {
  const stemName = chart?.canChiNam ? String(chart.canChiNam).trim().split(/\s+/)[0] : 'Giáp';
  const t = getSiHuaByStem(stemName);
  return {
    [t.Loc]: 'Hóa Lộc',
    [t.Quyen]: 'Hóa Quyền',
    [t.Khoa]: 'Hóa Khoa',
    [t.Ky]: 'Hóa Kỵ',
  };
}

function getStarSiHua(chart, palace, starName) {
  if (!hasStar(palace, starName)) return undefined;
  const map = getChartBirthSiHuaMap(chart);
  return map[starName];
}

function palaceHasSiHua(palace, huaName, chart = null) {
  const fullHua = huaName.startsWith('Hóa ') ? huaName : `Hóa ${huaName}`;
  if (getMinorStarNames(palace).includes(fullHua)) return true;
  if (chart) {
    const birthMap = getChartBirthSiHuaMap(chart);
    return getAllStarNames(palace).some(s => birthMap[s] === fullHua);
  }
  return false;
}

function sanFangHasSiHua(chart, huaName) {
  return getSanFangPalaces(chart).some(p => palaceHasSiHua(p, huaName, chart));
}

function pushPattern(patterns, pat) {
  const level = pat.level || 'neutral';
  patterns.push({
    id: pat.id,
    name: pat.name,
    nameZh: pat.nameZh || '',
    level,
    levelLabel: LEVEL_LABELS[level] || 'Bình Hòa',
    description: pat.description,
    palaces: pat.palaces || ['Mệnh'],
    conditions: {
      required: pat.conditions?.required || [],
      bonus: pat.conditions?.bonus || [],
      breaking: pat.conditions?.breaking || [],
    },
    source: pat.source || '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

// ────────────────── 1. THƯỢNG CÁCH & CHÍNH CÁCH (TRỌNG CÁCH) ──────────────────

/** 1. Quân Thần Khánh Hội: Tử Vi nhập Mệnh, Tả Phụ Hữu Bật hội chiếu */
function detectJunChenQingHui(chart, ming, patterns) {
  if (!hasStar(ming, 'Tử Vi')) return;
  const sanFangSet = sanFangAllStars(chart);
  if (!sanFangSet.has('Tả Phụ') || !sanFangSet.has('Hữu Bật')) return;

  const required = ['Tử Vi tọa thủ cung Mệnh', 'Tả Phụ và Hữu Bật đồng hội trong Tam Phương Tứ Chính'];
  const bonus = [];
  const breaking = [];
  if (sanFangSet.has('Văn Xương') || sanFangSet.has('Văn Khúc')) bonus.push('Hội thêm Văn Xương hoặc Văn Khúc (văn võ toàn tài)');
  if (sanFangSet.has('Thiên Khôi') || sanFangSet.has('Thiên Việt')) bonus.push('Thiên Khôi / Thiên Việt quý nhân gia hội');
  if (getStarSiHua(chart, ming, 'Tử Vi') === 'Hóa Quyền') bonus.push('Tử Vi Hóa Quyền uy quyền hiển hách');
  if (sanFangShaCount(chart, SHA_KONG) >= 2) breaking.push('Địa Không Địa Kiếp hội chiếu (Đế tọa kỵ Không Kiếp)');

  pushPattern(patterns, {
    id: 'quan-than-khanh-hoi',
    name: 'Quân Thần Khánh Hội',
    nameZh: '君臣庆会',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Tử Vi tọa Mệnh được Tả Phụ, Hữu Bật cùng hội chiếu như Vua hiền gặp tôi giỏi phò tá, chủ về đại phú đại quý, năng lực thống lĩnh và quản trị xuất chúng. Cả đời nhiều quý nhân phù trợ, hợp lãnh đạo chính giới, tập đoàn lớn hoặc làm chủ tổ chức.',
    palaces: ['Mệnh'],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Quân Thần Khánh Hội Cách》',
  });
}

/** 2. Tử Phủ Đồng Cung: Tử Vi + Thiên Phủ đồng cung tại Dần hoặc Thân */
function detectZiFu(chart, ming, patterns) {
  const ziwei = findStarPalace(chart, 'Tử Vi');
  const tianfu = findStarPalace(chart, 'Thiên Phủ');
  if (!ziwei || !tianfu || ziwei.chiIndex !== tianfu.chiIndex) return;

  const inMing = ziwei.chiIndex === getMenhBranch(chart);
  const required = inMing
    ? [`Tử Vi và Thiên Phủ đồng cung tọa Mệnh tại ${ziwei.chiName}`]
    : [`Tử Vi và Thiên Phủ đồng cung tại ${cleanPalaceName(ziwei.chucNang)} (${ziwei.chiName})`];
  const bonus = [];
  const breaking = [];
  const sanFangSet = sanFangAllStars(chart);
  if (sanFangSet.has('Tả Phụ') && sanFangSet.has('Hữu Bật')) bonus.push('Tả Phụ Hữu Bật đồng hội');
  if (sanFangSet.has('Văn Xương') || sanFangSet.has('Văn Khúc')) bonus.push('Hội hợp Văn Xương / Văn Khúc');
  if (hasShaInPalace(ziwei, SHA_KONG)) breaking.push('Cung Tử Phủ gặp Địa Không / Địa Kiếp làm hao tổn quý khí');
  if (shaCountInPalace(ziwei, SHA_HARD) >= 2) breaking.push('Cung Tử Phủ gặp từ 2 Tứ Sát trở lên');

  pushPattern(patterns, {
    id: 'tu-phu-dong-cung',
    name: 'Tử Phủ Đồng Cung',
    nameZh: '紫府同宫',
    level: inMing && !breaking.length ? 'excellent' : 'good',
    description: inMing
      ? 'Tử Vi (Đế tinh) và Thiên Phủ (Tài khố) đồng cung nhập Mệnh tại Dần/Thân, Bắc Đẩu và Nam Đẩu quy nguyên, chủ về phẩm chất đĩnh đạc, tài lộc dồi dào, suốt đời áo cơm sung túc, hợp nắm giữ trọng trách quản lý và tài chính.'
      : 'Tử Vi và Thiên Phủ đồng cung tại cung chức năng trên lá số, tạo điểm tựa quý khí và năng lực tích lũy vững vàng cho lĩnh vực cung đó.',
    palaces: [cleanPalaceName(ziwei.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tử Phủ Đồng Cung Cách》',
  });
}

/** 3. Phủ Tướng Triều Viên: Thiên Phủ, Thiên Tướng hội chiếu Tam Phương Tứ Chính của Mệnh */
function detectFuXiangChaoYuan(chart, ming, patterns) {
  const tianfu = findStarPalace(chart, 'Thiên Phủ');
  const tianxiang = findStarPalace(chart, 'Thiên Tướng');
  if (!tianfu || !tianxiang) return;
  const menhBranch = getMenhBranch(chart);
  if (!isInSanFang(chart, tianfu.chiIndex) || !isInSanFang(chart, tianxiang.chiIndex)) return;
  if (tianfu.chiIndex === menhBranch && tianxiang.chiIndex === menhBranch) return;
  if (tianfu.chiIndex === tianxiang.chiIndex) return;

  const required = ['Thiên Phủ cư Tam Phương của Mệnh', 'Thiên Tướng cư Tam Phương của Mệnh', 'Phủ Tướng phân thủ hai cung tam hợp chầu về'];
  const bonus = [];
  const breaking = [];
  if (hasStar(ming, 'Lộc Tồn') || palaceHasSiHua(ming, 'Hóa Lộc', chart)) bonus.push('Cung Mệnh đắc Lộc (Lộc Tồn hoặc Hóa Lộc)');
  if (sanFangAllStars(chart).has('Tả Phụ') || sanFangAllStars(chart).has('Hữu Bật')) bonus.push('Hội thêm Tả Phụ / Hữu Bật');
  if (isDim(tianxiang, 'Thiên Tướng')) breaking.push(`Thiên Tướng lạc hãm tại ${tianxiang.chiName} làm suy giảm ấn lực`);
  if (isDim(tianfu, 'Thiên Phủ')) breaking.push(`Thiên Phủ lạc hãm tại ${tianfu.chiName}`);
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh tọa Tứ Sát (Kình/Đà/Hỏa/Linh)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Cung Mệnh gặp Địa Không / Địa Kiếp (Phủ Tướng kỵ Không Kiếp)');
  if (sanFangShaCount(chart, SHA_NAMES) >= 3) breaking.push('Tam Phương Tứ Chính hội nhiều sát tinh / Không Kiếp');

  const resolvedLevel = breaking.length >= 2 ? 'neutral' : breaking.length === 1 ? 'good' : 'excellent';
  pushPattern(patterns, {
    id: 'phu-tuong-trieu-vien',
    name: 'Phủ Tướng Triều Viên',
    nameZh: '府相朝垣',
    level: resolvedLevel,
    description: 'Thiên Phủ (Tài khố) và Thiên Tướng (Ấn tinh) phân cư Tam Phương Tứ Chính chầu về Mệnh, cổ thư ca ngợi "Phủ Tướng triều viên thiên chung thực lộc". Chủ về bổng lộc dồi dào, nhân duyên đắc lực, cực hợp chính giới, tài chính, quản trị doanh nghiệp (cần Phủ Tướng miếu vượng và tránh Không Kiếp/Tứ Sát xâm phạm).',
    palaces: [cleanPalaceName(tianfu.chucNang), cleanPalaceName(tianxiang.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Phủ Tướng Triều Viên Cách》',
  });
}

/** 4. Dương Lương Xương Lộc: Thái Dương + Thiên Lương + Văn Xương + Lộc Tồn hội Mệnh */
function detectYangLiangChangLu(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const hasLu = sanFangSet.has('Lộc Tồn') || sanFangHasSiHua(chart, 'Hóa Lộc');
  if (!sanFangSet.has('Thái Dương') || !sanFangSet.has('Thiên Lương') || !sanFangSet.has('Văn Xương') || !hasLu) return;

  const sun = findStarPalace(chart, 'Thái Dương');
  const liang = findStarPalace(chart, 'Thiên Lương');
  const required = [
    'Thái Dương hội Tam Phương cung Mệnh',
    'Thiên Lương hội Tam Phương cung Mệnh',
    'Văn Xương hội Tam Phương cung Mệnh',
    'Hội Lộc Tồn hoặc Hóa Lộc trong Tam Phương',
  ];
  const bonus = [];
  const breaking = [];
  if (sun && isBright(sun, 'Thái Dương')) bonus.push('Thái Dương miếu vượng rực rỡ');
  if (liang && isBright(liang, 'Thiên Lương')) bonus.push('Thiên Lương miếu vượng');
  if (sanFangHasSiHua(chart, 'Hóa Khoa')) bonus.push('Hội thêm Hóa Khoa (khoa danh hiển đạt)');
  if (sun && isDim(sun, 'Thái Dương')) breaking.push('Thái Dương lạc hãm làm giảm ánh sáng Dương Lương');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Tam Phương gặp nhiều sát tinh');

  pushPattern(patterns, {
    id: 'duong-luong-xuong-loc',
    name: 'Dương Lương Xương Lộc',
    nameZh: '阳梁昌禄',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thái Dương, Thiên Lương, Văn Xương và Lộc Tồn (hoặc Hóa Lộc) cùng hội chiếu cung Mệnh, cổ phú viết "Thái Dương ấm tinh tập Xương Lộc, truyền lô đệ nhất danh". Đại lợi thi cử, học thuật, nghiên cứu, y dược, luật pháp và chứng chỉ chuyên môn cao cấp.',
    palaces: [cleanPalaceName(sun?.chucNang), cleanPalaceName(liang?.chucNang)].filter(Boolean),
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Dương Lương Xương Lộc Cách》',
  });
}

/** 5 & 6. Hỏa Tham Cách / Linh Tham Cách */
function detectHuoTanLingTan(chart, ming, patterns) {
  const tan = findStarPalace(chart, 'Tham Lang');
  if (!tan) return;
  const huo = findStarPalace(chart, 'Hỏa Tinh');
  const ling = findStarPalace(chart, 'Linh Tinh');

  for (const [shaName, shaPalace, id, patName, zhName] of [
    ['Hỏa Tinh', huo, 'hoa-tham-cach', 'Hỏa Tham Cách', '火贪格'],
    ['Linh Tinh', ling, 'linh-tham-cach', 'Linh Tham Cách', '铃贪格'],
  ]) {
    if (!shaPalace) continue;
    const sameOrTrine =
      tan.chiIndex === shaPalace.chiIndex ||
      (tan.chiIndex + 4) % 12 === shaPalace.chiIndex ||
      (tan.chiIndex + 8) % 12 === shaPalace.chiIndex ||
      (tan.chiIndex + 6) % 12 === shaPalace.chiIndex;
    if (!sameOrTrine) continue;
    if (!isInSanFang(chart, tan.chiIndex)) continue;

    const required = [
      `Tham Lang ${tan.chiIndex === shaPalace.chiIndex ? 'đồng cung' : 'hội chiếu'} cùng ${shaName}`,
      'Tham Lang nằm trong Tam Phương Tứ Chính của Mệnh',
    ];
    const bonus = [];
    const breaking = [];
    if (isBright(tan, 'Tham Lang')) bonus.push('Tham Lang đắc miếu vượng');
    const sh = getStarSiHua(chart, tan, 'Tham Lang');
    if (sh === 'Hóa Lộc' || sh === 'Hóa Quyền') bonus.push(`Tham Lang ${sh}`);
    if (hasShaInPalace(tan, ['Kình Dương', 'Đà La'])) breaking.push('Cung Tham Lang gặp thêm Kình Dương / Đà La làm giảm lực bộc phát');
    if (hasShaInPalace(tan, SHA_KONG)) breaking.push('Tham Lang ngộ Không Kiếp (tài đến nhanh đi nhanh)');

    pushPattern(patterns, {
      id,
      name: patName,
      nameZh: zhName,
      level: breaking.length ? 'good' : 'excellent',
      description: `Tham Lang gặp ${shaName} ${tan.chiIndex === shaPalace.chiIndex ? 'đồng cung' : 'tam phương hội chiếu'}, cổ thư viết "Tham Hỏa tương phùng danh chấn chư bang", chủ về cơ hội bộc phát bất ngờ, hoạnh phát tài lộc hoặc lập công lớn nơi thương trường. Khi thành công cần biết giữ thành quả.`,
      palaces: [...new Set([cleanPalaceName(tan.chucNang), cleanPalaceName(shaPalace.chucNang)])],
      conditions: { required, bonus, breaking },
      source: '《Đẩu Số Cốt Tủy Phú》',
    });
  }
}

/** 7. Vũ Tham Cách: Vũ Khúc + Tham Lang đồng cung (Sửu/Mùi) hoặc xung chiếu */
function detectWuTan(chart, ming, patterns) {
  const wu = findStarPalace(chart, 'Vũ Khúc');
  const tan = findStarPalace(chart, 'Tham Lang');
  if (!wu || !tan) return;
  const sameOrOppose = wu.chiIndex === tan.chiIndex || (wu.chiIndex + 6) % 12 === tan.chiIndex;
  if (!sameOrOppose) return;
  if (!isInSanFang(chart, wu.chiIndex) && !isInSanFang(chart, tan.chiIndex)) return;

  const required = [
    wu.chiIndex === tan.chiIndex ? `Vũ Khúc và Tham Lang đồng cung tại ${wu.chiName}` : 'Vũ Khúc và Tham Lang đối cung xung chiếu',
    'Hội chiếu Tam Phương Tứ Chính cung Mệnh',
  ];
  const bonus = [];
  const breaking = [];
  const sf = sanFangAllStars(chart);
  if (sf.has('Hỏa Tinh') || sf.has('Linh Tinh')) bonus.push('Hội thêm Hỏa Tinh / Linh Tinh (Vũ Tham Hỏa Linh đại phát)');
  if (getStarSiHua(chart, wu, 'Vũ Khúc') === 'Hóa Lộc') bonus.push('Vũ Khúc Hóa Lộc');
  if (hasShaInPalace(wu, ['Kình Dương', 'Đà La'])) breaking.push('Cung Vũ Tham gặp Kình Đà');
  if (hasShaInPalace(wu, SHA_KONG)) breaking.push('Cung Vũ Tham gặp Không Kiếp');

  pushPattern(patterns, {
    id: 'vu-tham-cach',
    name: 'Vũ Tham Cách',
    nameZh: '武贪格',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Vũ Khúc (Tài tinh) và Tham Lang đồng độ tại Sửu/Mùi hoặc đối chiếu, cổ phú viết "Vũ Tham bất phát thiếu niên nhân" — tiền vận cần rèn luyện bản lĩnh, sau tuổi 30–35 hậu vận bộc phát mạnh mẽ về tài chính, thương mại, đầu tư.',
    palaces: [...new Set([cleanPalaceName(wu.chucNang), cleanPalaceName(tan.chucNang)])],
    conditions: { required, bonus, breaking },
    source: '《Đẩu Số Cốt Tủy Phú》',
  });
}

/** 8. Sát Phá Lang: Thất Sát, Phá Quân, Tham Lang hội tụ Tam Phương */
function detectShaPoLang(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['Thất Sát', 'Phá Quân', 'Tham Lang'].filter(s => sanFangSet.has(s));
  if (has.length < 3) return;

  const required = ['Thất Sát, Phá Quân, Tham Lang tam hợp hội chiếu Mệnh - Tài - Quan'];
  const bonus = [];
  const breaking = [];
  if (sanFangHasSiHua(chart, 'Hóa Lộc') || sanFangHasSiHua(chart, 'Hóa Quyền')) bonus.push('Tam Phương có Hóa Lộc hoặc Hóa Quyền (khai sáng đắc lực)');
  if (sanFangSet.has('Tả Phụ') && sanFangSet.has('Hữu Bật')) bonus.push('Tả Phụ Hữu Bật đồng hội');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Tam Phương hội quá nhiều sát tinh (biến động vất vả)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Mệnh tọa Không Kiếp');

  pushPattern(patterns, {
    id: 'sat-pha-lang',
    name: 'Sát Phá Lang (Trúc La Tam Hạn)',
    nameZh: '杀破狼',
    level: breaking.length ? 'caution' : 'good',
    description: 'Thất Sát, Phá Quân, Tham Lang hội tụ Mệnh - Tài - Quan, là mẫu người tiên phong, dám nghĩ dám làm, ưa đột phá và không chịu khuất phục hoàn cảnh. Hợp khởi nghiệp, kinh doanh, kỹ thuật mũi nhọn, quân đội hoặc mở thị trường mới.',
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => cleanPalaceName(p.chucNang)),
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Sát Phá Lang》',
  });
}

/** 9. Cơ Nguyệt Đồng Lương: Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương hội Mệnh Tài Quan Di */
function detectJiYueTongLiang(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'].filter(s => sanFangSet.has(s));
  if (has.length < 4) return;

  const required = ['Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương đủ 4 sao hội Tam Phương Tứ Chính'];
  const bonus = [];
  const breaking = [];
  if (sanFangSet.has('Văn Xương') || sanFangSet.has('Văn Khúc')) bonus.push('Hội thêm Văn Xương / Văn Khúc');
  if (sanFangHasSiHua(chart, 'Hóa Khoa') || sanFangHasSiHua(chart, 'Hóa Lộc')) bonus.push('Hội Hóa Khoa / Hóa Lộc');
  if (sanFangShaCount(chart, SHA_HARD) >= 3) breaking.push('Tam Phương gặp nhiều sát tinh (Cơ Nguyệt Đồng Lương kỵ sát)');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh tọa Tứ Sát');

  pushPattern(patterns, {
    id: 'co-nguyet-dong-luong',
    name: 'Cơ Nguyệt Đồng Lương (Tác Lại Nhân)',
    nameZh: '机月同梁',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thiên Cơ, Thái Âm, Thiên Đồng, Thiên Lương đủ 4 sao hội vào Mệnh - Tài - Quan - Di, cổ phú viết "Cơ Nguyệt Đồng Lương tác lại nhân". Chủ về trí tuệ mưu lược, làm việc bài bản, cực hợp quản lý hành chính, tài chính ngân hàng, giáo dục, y tế, công nghệ và tham mưu.',
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => cleanPalaceName(p.chucNang)),
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Cơ Nguyệt Đồng Lương Cách》',
  });
}

// ────────────────── 2. TRUNG CÁCH & ĐỒNG ĐỘ / GIÁP CUNG CÁCH ──────────────────

/** 10. Liêm Trinh Thiên Tướng đồng cung (Tý/Ngọ) */
function detectLianXiang(chart, patterns) {
  const lian = findStarPalace(chart, 'Liêm Trinh');
  const xiang = findStarPalace(chart, 'Thiên Tướng');
  if (!lian || !xiang || lian.chiIndex !== xiang.chiIndex) return;

  const inMing = lian.chiIndex === getMenhBranch(chart);
  const required = [`Liêm Trinh và Thiên Tướng đồng cung tại ${lian.chiName}`];
  const bonus = [];
  const breaking = [];
  if (hasStar(lian, 'Lộc Tồn') || getStarSiHua(chart, lian, 'Liêm Trinh') === 'Hóa Lộc') bonus.push('Đắc Lộc Tồn hoặc Liêm Trinh Hóa Lộc (Thanh Bạch Năng Tương Thủ)');
  if (sanFangAllStars(chart).has('Tả Phụ')) bonus.push('Hội Tả Phụ');
  if (hasShaInPalace(lian, ['Kình Dương'])) breaking.push('Gặp Kình Dương đồng độ (Hình Tù Giáp Ấn)');
  if (getStarSiHua(chart, lian, 'Liêm Trinh') === 'Hóa Kỵ') breaking.push('Liêm Trinh Hóa Kỵ (cẩn trọng giấy tờ pháp lý)');

  pushPattern(patterns, {
    id: 'liem-trinh-thien-tuong',
    name: 'Liêm Tướng Đồng Cung (Hình Ấn Tương Phối)',
    nameZh: '廉贞天相格',
    level: breaking.length ? 'caution' : (inMing ? 'good' : 'neutral'),
    description: 'Liêm Trinh đồng cung Thiên Tướng tại Tý/Ngọ, Thiên Tướng dùng thủy chế hóa tính hỏa của Liêm Trinh thành cách cục thanh liêm, cẩn trọng, giỏi hành chính, pháp chế và điều hành.',
    palaces: [cleanPalaceName(lian.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 11. Vũ Khúc Thất Sát đồng cung (Mão/Dậu) */
function detectWuQiSha(chart, patterns) {
  const wu = findStarPalace(chart, 'Vũ Khúc');
  const qi = findStarPalace(chart, 'Thất Sát');
  if (!wu || !qi || wu.chiIndex !== qi.chiIndex) return;

  const inMing = wu.chiIndex === getMenhBranch(chart);
  const required = [`Vũ Khúc và Thất Sát đồng cung tại ${wu.chiName}`];
  const bonus = [];
  const breaking = [];
  if (getStarSiHua(chart, wu, 'Vũ Khúc') === 'Hóa Quyền') bonus.push('Vũ Khúc Hóa Quyền');
  if (getStarSiHua(chart, wu, 'Vũ Khúc') === 'Hóa Lộc') bonus.push('Vũ Khúc Hóa Lộc');
  if (getStarSiHua(chart, wu, 'Vũ Khúc') === 'Hóa Kỵ') breaking.push('Vũ Khúc Hóa Kỵ (cần cẩn trọng quản trị dòng tiền)');
  if (hasShaInPalace(wu, SHA_HARD)) breaking.push('Cung Vũ Sát gặp thêm Tứ Sát');

  pushPattern(patterns, {
    id: 'vu-khuc-that-sat',
    name: 'Vũ Khúc Thất Sát (Tướng Tinh Phối Tài)',
    nameZh: '武曲七杀',
    level: breaking.length ? 'caution' : (inMing ? 'excellent' : 'good'),
    description: 'Vũ Khúc và Thất Sát đồng độ tại Mão/Dậu, kết hợp sự quyết đoán của Tướng tinh với năng lực thực thi của Tài tinh. Chủ về bản lĩnh sắc bén, dám đương đầu thử thách lớn.',
    palaces: [cleanPalaceName(wu.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 12. Thiên Đồng Thiên Lương đồng cung (Dần/Thân) */
function detectTongLiang(chart, patterns) {
  const tong = findStarPalace(chart, 'Thiên Đồng');
  const liang = findStarPalace(chart, 'Thiên Lương');
  if (!tong || !liang || tong.chiIndex !== liang.chiIndex) return;

  const required = [`Thiên Đồng và Thiên Lương đồng cung tại ${tong.chiName}`];
  const bonus = [];
  const breaking = [];
  if (sanFangAllStars(chart).has('Văn Xương') || sanFangAllStars(chart).has('Văn Khúc')) bonus.push('Hội Văn Xương / Văn Khúc');
  if (getStarSiHua(chart, tong, 'Thiên Đồng') === 'Hóa Lộc') bonus.push('Thiên Đồng Hóa Lộc');
  if (hasShaInPalace(tong, SHA_HARD)) breaking.push('Gặp Tứ Sát đồng cung');

  pushPattern(patterns, {
    id: 'thien-dong-thien-luong',
    name: 'Đồng Lương Dần Thân (Cung Ấm Triều Cương)',
    nameZh: '天同天梁格',
    level: breaking.length ? 'neutral' : 'good',
    description: 'Thiên Đồng (Phúc tinh) và Thiên Lương (Ấm tinh) đồng độ tại Dần/Thân, tính cách nhân hậu, điềm đạm, được quý nhân và trưởng bối che chở, hợp y dược, giáo dục, văn hóa, phúc lợi xã hội.',
    palaces: [cleanPalaceName(tong.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 13. Nhật Nguyệt Đồng Cung: Thái Dương + Thái Âm đồng cung tại Sửu hoặc Mùi */
function detectRiYueTongGong(chart, patterns) {
  const sun = findStarPalace(chart, 'Thái Dương');
  const moon = findStarPalace(chart, 'Thái Âm');
  if (!sun || !moon || sun.chiIndex !== moon.chiIndex) return;
  if (sun.chiIndex !== 1 && sun.chiIndex !== 7) return;

  const inMing = sun.chiIndex === getMenhBranch(chart);
  const required = [`Thái Dương và Thái Âm đồng cung tại ${sun.chiName}`];
  const bonus = [];
  const breaking = [];
  if (sun.chiIndex === 7) bonus.push('Tọa cung Mùi (Nhật Nguyệt đồng minh chiếu rạng)');
  if (sanFangAllStars(chart).has('Văn Xương') && sanFangAllStars(chart).has('Văn Khúc')) bonus.push('Xương Khúc hội chiếu');
  if (hasShaInPalace(sun, SHA_HARD)) breaking.push('Cung Nhật Nguyệt gặp Tứ Sát');

  pushPattern(patterns, {
    id: 'nhat-nguyet-dong-cung',
    name: 'Nhật Nguyệt Đồng Cung',
    nameZh: '日月同宫',
    level: breaking.length ? 'good' : (inMing ? 'excellent' : 'good'),
    description: `Thái Dương và Thái Âm đồng độ tại cung ${sun.chiName}, Âm Dương giao hòa, văn võ kiêm toàn, tầm nhìn linh hoạt đa chiều, dễ lập danh tiếng và có duyên ngoại giao rộng mở.`,
    palaces: [cleanPalaceName(sun.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 14. Nhật Nguyệt Giáp Mệnh: Thái Dương và Thái Âm giáp hai bên cung Mệnh */
function detectRiYueJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, getMenhBranch(chart));
  if (!prev || !next) return;
  const prevHasSun = hasStar(prev, 'Thái Dương');
  const prevHasMoon = hasStar(prev, 'Thái Âm');
  const nextHasSun = hasStar(next, 'Thái Dương');
  const nextHasMoon = hasStar(next, 'Thái Âm');
  if (!((prevHasSun && nextHasMoon) || (prevHasMoon && nextHasSun))) return;

  const sunPalace = prevHasSun ? prev : next;
  const moonPalace = prevHasMoon ? prev : next;
  const required = ['Thái Dương và Thái Âm phân cư hai cung giáp kề cung Mệnh'];
  const bonus = [];
  const breaking = [];
  if (isBright(sunPalace, 'Thái Dương')) bonus.push('Thái Dương miếu vượng');
  if (isBright(moonPalace, 'Thái Âm')) bonus.push('Thái Âm miếu vượng');
  if (isDim(sunPalace, 'Thái Dương') || isDim(moonPalace, 'Thái Âm')) breaking.push('Nhật hoặc Nguyệt lạc hãm làm giảm lực giáp chiếu');

  pushPattern(patterns, {
    id: 'nhat-nguyet-giap-menh',
    name: 'Nhật Nguyệt Giáp Mệnh',
    nameZh: '日月夹命',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Thái Dương và Thái Âm phân cư hai bên giáp cung Mệnh, cổ phú viết "Nhật Nguyệt giáp Mệnh, bất quyền tắc phú". Chủ về cả đời được quý nhân và gia đình nâng đỡ, tài quyền song mỹ.',
    palaces: ['Mệnh', cleanPalaceName(sunPalace.chucNang), cleanPalaceName(moonPalace.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Nhật Nguyệt Giáp Mệnh》',
  });
}

/** 15. Cự Nhật Đồng Cung: Cự Môn + Thái Dương đồng cung tại Dần hoặc Thân */
function detectJuRiTongGong(chart, patterns) {
  const ju = findStarPalace(chart, 'Cự Môn');
  const sun = findStarPalace(chart, 'Thái Dương');
  if (!ju || !sun || ju.chiIndex !== sun.chiIndex) return;
  if (ju.chiIndex !== 2 && ju.chiIndex !== 8) return;

  const inMing = ju.chiIndex === getMenhBranch(chart);
  const required = [`Cự Môn và Thái Dương đồng cung tại ${ju.chiName}`];
  const bonus = [];
  const breaking = [];
  if (ju.chiIndex === 2) bonus.push('Tọa cung Dần: Thái Dương ban mai hóa giải ám khí của Cự Môn');
  const juSh = getStarSiHua(chart, ju, 'Cự Môn');
  if (juSh === 'Hóa Lộc' || juSh === 'Hóa Quyền') bonus.push(`Cự Môn ${juSh} (khẩu tài sinh lộc)`);
  if (juSh === 'Hóa Kỵ') breaking.push('Cự Môn Hóa Kỵ (dễ vướng thị phi tranh biện)');
  if (ju.chiIndex === 8) breaking.push('Tọa cung Thân: Thái Dương xế chiều, lực hóa giải giảm nhẹ');

  pushPattern(patterns, {
    id: 'cu-nhat-dong-cung',
    name: 'Cự Nhật Đồng Cung',
    nameZh: '巨日同宫',
    level: breaking.length ? 'caution' : (inMing && ju.chiIndex === 2 ? 'excellent' : 'good'),
    description: `Cự Môn và Thái Dương đồng độ tại cung ${ju.chiName}, ánh sáng Thái Dương xua tan ám khí của Cự Môn, cổ thư khen "Cự Nhật đồng cung, quan phong tam đại". Rất hợp ngoại giao, luật sư, truyền thông, ngoại ngữ, giảng dạy.`,
    palaces: [cleanPalaceName(ju.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư · Cự Nhật Đồng Cung》',
  });
}

/** 16. Thạch Trung Ẩn Ngọc: Cự Môn tọa Mệnh tại Tý hoặc Ngọ */
function detectShiZhongYinYu(chart, ming, patterns) {
  if (!hasStar(ming, 'Cự Môn')) return;
  if (ming.chiIndex !== 0 && ming.chiIndex !== 6) return;

  const required = [`Cự Môn tọa thủ cung Mệnh tại ${ming.chiName}`];
  const bonus = [];
  const breaking = [];
  const sh = getStarSiHua(chart, ming, 'Cự Môn');
  if (sh === 'Hóa Lộc' || sh === 'Hóa Quyền' || sanFangHasSiHua(chart, 'Hóa Khoa')) bonus.push('Đắc Hóa Lộc / Hóa Quyền / Hóa Khoa khai mở ngọc quý');
  if (sanFangAllStars(chart).has('Văn Xương') || sanFangAllStars(chart).has('Văn Khúc')) bonus.push('Hội Văn Xương / Văn Khúc');
  if (sh === 'Hóa Kỵ') breaking.push('Cự Môn Hóa Kỵ');
  if (hasShaInPalace(ming, SHA_HARD)) breaking.push('Cung Mệnh tọa Tứ Sát');

  pushPattern(patterns, {
    id: 'thach-trung-an-ngoc',
    name: 'Thạch Trung Ẩn Ngọc (Ngọc Ẩn Trong Đá)',
    nameZh: '石中隐玉',
    level: breaking.length ? 'caution' : 'excellent',
    description: 'Cự Môn tọa Mệnh tại Tý hoặc Ngọ, ví như viên ngọc quý ẩn trong đá: vẻ ngoài khiêm nhường nhưng nội lực, trí tuệ và tài hùng biện cực kỳ sâu sắc. Qua mài giũa tiền vận sẽ tỏa sáng rực rỡ ở trung hậu vận.',
    palaces: ['Mệnh'],
    conditions: { required, bonus, breaking },
    source: '《Đẩu Số Cốt Tủy Phú · Thạch Trung Ẩn Ngọc》',
  });
}

/** 17. Minh Châu Xuất Hải: Mệnh tại Mùi Vô Chính Diệu, đối cung Sửu có Thái Dương Thái Âm */
function detectMingZhuChuHai(chart, ming, patterns) {
  if (ming.chiIndex !== 7) return;
  if (getMajorStarNames(ming).length > 0) return;
  const dui = getDuiGong(chart, ming.chiIndex);
  if (!dui || !hasStar(dui, 'Thái Dương') || !hasStar(dui, 'Thái Âm')) return;

  const required = [
    'Cung Mệnh an tại Mùi Vô Chính Diệu',
    'Đối cung Sửu có Thái Dương và Thái Âm đồng độ xung chiếu',
    'Tam hợp Mão (Thái Dương / Thiên Lương) và Hợi (Thái Âm) hội chiếu',
  ];
  const bonus = [];
  const breaking = [];
  const sf = sanFangAllStars(chart);
  if (sf.has('Văn Xương') || sf.has('Văn Khúc')) bonus.push('Hội Văn Xương / Văn Khúc');
  if (sf.has('Tả Phụ') || sf.has('Hữu Bật')) bonus.push('Hội Tả Phụ / Hữu Bật');
  if (sanFangShaCount(chart, SHA_HARD) >= 2) breaking.push('Tam Phương gặp sát tinh làm mờ ánh châu ngọc');

  pushPattern(patterns, {
    id: 'minh-chau-xuat-hai',
    name: 'Minh Châu Xuất Hải (Châu Sáng Vượt Biển)',
    nameZh: '明珠出海',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Mệnh lập tại Mùi Vô Chính Diệu, được Nhật Nguyệt từ cung Sửu xung chiếu cùng Thiên Lương, Thái Âm tam hợp hội về, cổ phú ca ngợi "Minh châu xuất hải, tài quan song mỹ". Chủ về tài năng vượt trội, danh vọng vươn xa.',
    palaces: ['Mệnh', cleanPalaceName(dui.chucNang)],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Tập · Minh Châu Xuất Hải》',
  });
}

/** 18. Tử Vi Độc Tọa Nhập Mệnh (Tý/Ngọ Cực Hướng Ly Minh) */
function detectZiWeiInMing(chart, ming, patterns) {
  if (!hasStar(ming, 'Tử Vi') || getMajorStarNames(ming).length > 1) return;

  const isNgo = ming.chiIndex === 6;
  const required = [
    isNgo
      ? 'Tử Vi độc tọa cung Mệnh tại Ngọ (Cực Hướng Ly Minh)'
      : `Tử Vi độc tọa cung Mệnh tại ${ming.chiName}`,
  ];
  const bonus = [];
  const breaking = [];
  const sf = sanFangAllStars(chart);
  if (sf.has('Tả Phụ') && sf.has('Hữu Bật')) bonus.push('Tả Phụ Hữu Bật đồng hội');
  if (sf.has('Văn Xương') && sf.has('Văn Khúc')) bonus.push('Văn Xương Văn Khúc đồng hội');
  if (!sf.has('Tả Phụ') && !sf.has('Hữu Bật')) breaking.push('Thiếu Tả Phụ Hữu Bật (Đế tọa cô quân)');
  if (hasShaInPalace(ming, SHA_KONG)) breaking.push('Tử Vi gặp Địa Không / Địa Kiếp');

  pushPattern(patterns, {
    id: 'tu-vi-doc-toa-nhap-menh',
    name: isNgo ? 'Cực Hướng Ly Minh (Tử Vi Độc Tọa Ngọ)' : 'Tử Vi Độc Tọa Nhập Mệnh',
    nameZh: isNgo ? '极向离明' : '紫微入命',
    level: breaking.length ? 'caution' : (isNgo || bonus.length ? 'excellent' : 'good'),
    description: isNgo
      ? 'Tử Vi độc tọa cung Mệnh tại Ngọ không gặp sát tinh, cổ thư gọi là "Cực Hướng Ly Minh" — vua ngự phương Nam trông về phương Bắc, khí phách đường hoàng, chủ về đại quý và uy tín lãnh đạo lớn.'
      : 'Tử Vi độc tọa cung Mệnh, tâm thế tự chủ và có khí chất dẫn dắt. Rất cần hội hợp Tả Phụ, Hữu Bật để tránh thế "Cô Quân Tại Dã".',
    palaces: ['Mệnh'],
    conditions: { required, bonus, breaking },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

// ────────────────── 3. TRỢ LỰC CÁCH (GIÁP CUNG & TAM KỲ / SONG LỘC) ──────────────────

/** 19. Phụ Bật Giáp Mệnh */
function detectFuBiJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, getMenhBranch(chart));
  if (!prev || !next) return;
  const ok = (hasStar(prev, 'Tả Phụ') && hasStar(next, 'Hữu Bật'))
    || (hasStar(prev, 'Hữu Bật') && hasStar(next, 'Tả Phụ'));
  if (!ok) return;

  const bonus = [];
  if (sanFangAllStars(chart).has('Thiên Khôi') || sanFangAllStars(chart).has('Thiên Việt')) bonus.push('Hội thêm Thiên Khôi / Thiên Việt');

  pushPattern(patterns, {
    id: 'phu-bat-giap-menh',
    name: 'Tả Hữu Giáp Mệnh (Phụ Bật Giáp Đế)',
    nameZh: '辅弼夹命',
    level: 'excellent',
    description: 'Tả Phụ và Hữu Bật phân cư hai cung giáp kề cung Mệnh, chủ về cả đời được quý nhân và cộng sự đắc lực bao bọc, năng lực tổ chức và điều phối nhân sự xuất sắc.',
    palaces: ['Mệnh', cleanPalaceName(prev.chucNang), cleanPalaceName(next.chucNang)],
    conditions: { required: ['Tả Phụ và Hữu Bật phân cư hai cung giáp cung Mệnh'], bonus, breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Phụ Bật Giáp Mệnh》',
  });
}

/** 20. Xương Khúc Giáp Mệnh */
function detectChangQuJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, getMenhBranch(chart));
  if (!prev || !next) return;
  const ok = (hasStar(prev, 'Văn Xương') && hasStar(next, 'Văn Khúc'))
    || (hasStar(prev, 'Văn Khúc') && hasStar(next, 'Văn Xương'));
  if (!ok) return;

  pushPattern(patterns, {
    id: 'xuong-khuc-giap-menh',
    name: 'Xương Khúc Giáp Mệnh',
    nameZh: '昌曲夹命',
    level: 'excellent',
    description: 'Văn Xương và Văn Khúc phân cư hai cung giáp cung Mệnh, cổ phú viết "Xương Khúc giáp Mệnh tối vi kỳ". Chủ về thông tuệ, học vấn uyên bác, văn chương nghệ thuật và khoa cử thuận lợi.',
    palaces: ['Mệnh', cleanPalaceName(prev.chucNang), cleanPalaceName(next.chucNang)],
    conditions: { required: ['Văn Xương và Văn Khúc phân cư hai cung giáp cung Mệnh'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 21. Khôi Việt Giáp Mệnh */
function detectKuiYueJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, getMenhBranch(chart));
  if (!prev || !next) return;
  const ok = (hasStar(prev, 'Thiên Khôi') && hasStar(next, 'Thiên Việt'))
    || (hasStar(prev, 'Thiên Việt') && hasStar(next, 'Thiên Khôi'));
  if (!ok) return;

  pushPattern(patterns, {
    id: 'khoi-viet-giap-menh',
    name: 'Khôi Việt Giáp Mệnh (Tọa Quý Hướng Quý)',
    nameZh: '魁钺夹命',
    level: 'good',
    description: 'Thiên Khôi và Thiên Việt phân cư hai bên giáp cung Mệnh, chủ về cơ duyên gặp quý nhân nâng đỡ đúng lúc trong thi cử, thăng tiến và những bước ngoặt trọng đại.',
    palaces: ['Mệnh', cleanPalaceName(prev.chucNang), cleanPalaceName(next.chucNang)],
    conditions: { required: ['Thiên Khôi và Thiên Việt phân cư hai cung giáp cung Mệnh'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 22. Song Lộc Triều Viên: Hóa Lộc + Lộc Tồn đồng hội Tam Phương */
function detectShuangLuChaoYuan(chart, ming, patterns) {
  const sanFang = getSanFangPalaces(chart);
  const huaLuFound = sanFang.some(p => palaceHasSiHua(p, 'Hóa Lộc', chart));
  const luCunFound = sanFang.some(p => hasStar(p, 'Lộc Tồn'));
  if (!huaLuFound || !luCunFound) return;

  const breaking = hasShaInPalace(ming, SHA_KONG) ? ['Cung Mệnh gặp Địa Không / Địa Kiếp (Lộc ngộ Không Vong)'] : [];

  pushPattern(patterns, {
    id: 'song-loc-trieu-vien',
    name: 'Song Lộc Triều Viên (Minh Lộc Ám Lộc)',
    nameZh: '双禄朝垣',
    level: breaking.length ? 'good' : 'excellent',
    description: 'Hóa Lộc và Lộc Tồn cùng hội chiếu Tam Phương Tứ Chính của cung Mệnh, cổ thư ca ngợi "Song Lộc triều viên, phú tỷ Đào Chu". Chủ về nguồn tài chính dồi dào, vừa giỏi mở rộng dòng tiền vừa giỏi tích lũy.',
    palaces: sanFang.map(p => cleanPalaceName(p.chucNang)),
    conditions: {
      required: ['Hóa Lộc hội chiếu Tam Phương Tứ Chính', 'Lộc Tồn hội chiếu Tam Phương Tứ Chính'],
      bonus: [],
      breaking,
    },
    source: '《Tử Vi Đẩu Số Toàn Thư · Song Lộc Triều Viên》',
  });
}

/** 23. Tam Kỳ Gia Hội: Hóa Lộc + Hóa Quyền + Hóa Khoa hội Tam Phương */
function detectSanQiJiaHui(chart, patterns) {
  const sanFang = getSanFangPalaces(chart);
  const lu = sanFang.some(p => palaceHasSiHua(p, 'Hóa Lộc', chart));
  const quan = sanFang.some(p => palaceHasSiHua(p, 'Hóa Quyền', chart));
  const khoa = sanFang.some(p => palaceHasSiHua(p, 'Hóa Khoa', chart));
  if (!(lu && quan && khoa)) return;

  pushPattern(patterns, {
    id: 'tam-ky-gia-hoi',
    name: 'Tam Kỳ Gia Hội (Khoa Quyền Lộc Hội)',
    nameZh: '三奇加会',
    level: 'excellent',
    description: 'Hóa Khoa, Hóa Quyền, Hóa Lộc cùng hội tụ trong Tam Phương Tứ Chính của cung Mệnh. Đây là một trong những đại cát cách bậc nhất của Tử Vi Đẩu Số, chủ về danh tiếng (Khoa), thực quyền (Quyền) và tài lộc (Lộc) hội tụ.',
    palaces: sanFang.map(p => cleanPalaceName(p.chucNang)),
    conditions: { required: ['Hóa Lộc, Hóa Quyền, Hóa Khoa cùng hội chiếu Mệnh - Tài - Quan - Di'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tam Kỳ Gia Hội》',
  });
}

/** 24. Hóa Lộc Nhập Mệnh */
function detectHuaLuRuMing(chart, ming, patterns) {
  if (!palaceHasSiHua(ming, 'Hóa Lộc', chart)) return;
  const birthMap = getChartBirthSiHuaMap(chart);
  const luStar = getAllStarNames(ming).find(s => birthMap[s] === 'Hóa Lộc') || 'Chính tinh';

  pushPattern(patterns, {
    id: 'hoa-loc-nhap-menh',
    name: `${luStar} Hóa Lộc Nhập Mệnh`,
    nameZh: '化禄入命',
    level: 'good',
    description: `${luStar} Hóa Lộc tọa thủ ngay cung Mệnh, chủ về nhân duyên tốt đẹp, tính tình cởi mở, đi tới đâu cũng dễ gặp cơ hội tài lộc và thuận lợi trong việc biến năng lực bản thân thành giá trị thực tế.`,
    palaces: ['Mệnh'],
    conditions: { required: [`${luStar} Hóa Lộc tọa thủ cung Mệnh`], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

// ────────────────── 4. HUNG CÁCH / CÁCH CỤC CẦN LƯU Ý ──────────────────

/** 25. Hóa Kỵ Nhập Mệnh / Thiên Di */
function detectHuaJiRuMingQian(chart, patterns) {
  const menhBranch = getMenhBranch(chart);
  const qianBranch = (menhBranch + 6) % 12;
  const birthMap = getChartBirthSiHuaMap(chart);

  for (const palace of getPalates(chart)) {
    if (palace.chiIndex !== menhBranch && palace.chiIndex !== qianBranch) continue;
    if (!palaceHasSiHua(palace, 'Hóa Kỵ', chart)) continue;
    const jiStar = getAllStarNames(palace).find(s => birthMap[s] === 'Hóa Kỵ') || 'Chính tinh';
    const inMing = palace.chiIndex === menhBranch;

    pushPattern(patterns, {
      id: inMing ? 'hoa-ky-nhap-menh' : 'hoa-ky-nhap-di',
      name: `${jiStar} Hóa Kỵ Nhập ${inMing ? 'Mệnh' : 'Thiên Di'}`,
      nameZh: inMing ? '化忌入命' : '化忌入迁',
      level: 'caution',
      description: inMing
        ? `${jiStar} Hóa Kỵ tọa thủ cung Mệnh: tâm tư sâu sắc, hay tự tạo áp lực hoặc cầu toàn quá mức. Hóa Kỵ không hẳn là xấu nếu biết biến sự执着 (chuyên tâm) thành kỹ năng nghiên cứu chuyên sâu.`
        : `${jiStar} Hóa Kỵ tọa cung Thiên Di xung chiếu Mệnh: khi ra ngoài giao tiếp hoặc đi xa cần chú ý giữ hòa khí, cẩn trọng hợp đồng và tránh nóng vội.`,
      palaces: [cleanPalaceName(palace.chucNang)],
      conditions: { required: [`${jiStar} Hóa Kỵ tọa cung ${cleanPalaceName(palace.chucNang)}`], bonus: [], breaking: [] },
      source: '《Tử Vi Đẩu Số Toàn Thư》',
    });
  }
}

/** 26. Dương Đà Giáp Kỵ: Hóa Kỵ tọa Mệnh, bị Kình Dương và Đà La giáp hai bên */
function detectYangTuoJiaJi(chart, patterns) {
  const ming = getPalaceByBranch(chart, getMenhBranch(chart));
  if (!ming || !palaceHasSiHua(ming, 'Hóa Kỵ', chart)) return;
  const { prev, next } = getJiaPalaces(chart, ming.chiIndex);
  if (!prev || !next) return;
  const ok = (hasStar(prev, 'Kình Dương') && hasStar(next, 'Đà La'))
    || (hasStar(prev, 'Đà La') && hasStar(next, 'Kình Dương'));
  if (!ok) return;

  pushPattern(patterns, {
    id: 'duong-da-giap-ky',
    name: 'Dương Đà Giáp Kỵ',
    nameZh: '羊陀夹忌',
    level: 'caution',
    description: 'Cung Mệnh có Lộc Tồn đồng độ Hóa Kỵ, hai bên giáp Kình Dương và Đà La ("Dương Đà giáp Kỵ"). Cần đặc biệt chú ý quản trị rủi ro tài chính, giữ tâm thế bình tĩnh và tránh đầu tư mạo hiểm.',
    palaces: ['Mệnh', cleanPalaceName(prev.chucNang), cleanPalaceName(next.chucNang)],
    conditions: { required: ['Hóa Kỵ tọa Mệnh', 'Kình Dương và Đà La giáp hai bên cung Mệnh'], bonus: [], breaking: [] },
    source: '《Đẩu Số Cốt Tủy Phú · Dương Đà Giáp Kỵ》',
  });
}

/** 27. Hỏa Linh Giáp Mệnh */
function detectHuoLingJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, getMenhBranch(chart));
  if (!prev || !next) return;
  const ok = (hasStar(prev, 'Hỏa Tinh') && hasStar(next, 'Linh Tinh'))
    || (hasStar(prev, 'Linh Tinh') && hasStar(next, 'Hỏa Tinh'));
  if (!ok) return;

  pushPattern(patterns, {
    id: 'hoa-linh-giap-menh',
    name: 'Hỏa Linh Giáp Mệnh',
    nameZh: '火铃夹命',
    level: 'caution',
    description: 'Hỏa Tinh và Linh Tinh phân cư hai cung giáp cung Mệnh, chủ về nhịp sống gấp gáp, nhiều biến động bất ngờ. Cần rèn luyện sự kiên nhẫn và tránh ra quyết định khi đang nóng giận.',
    palaces: ['Mệnh', cleanPalaceName(prev.chucNang), cleanPalaceName(next.chucNang)],
    conditions: { required: ['Hỏa Tinh và Linh Tinh phân cư hai cung giáp cung Mệnh'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 28. Không Kiếp Giáp Mệnh */
function detectKongJieJiaMing(chart, patterns) {
  const { prev, next } = getJiaPalaces(chart, getMenhBranch(chart));
  if (!prev || !next) return;
  const ok = (hasStar(prev, 'Địa Không') && hasStar(next, 'Địa Kiếp'))
    || (hasStar(prev, 'Địa Kiếp') && hasStar(next, 'Địa Không'));
  if (!ok) return;

  pushPattern(patterns, {
    id: 'khong-kiep-giap-menh',
    name: 'Không Kiếp Giáp Mệnh',
    nameZh: '空劫夹命',
    level: 'caution',
    description: 'Địa Không và Địa Kiếp phân cư hai bên giáp cung Mệnh, tư duy độc đáo khác thường nhưng tiền bạc dễ tụ tán thất thường. Hợp phát triển chuyên môn sâu, triết học, sáng tạo, công nghệ hơn là đầu cơ ngắn hạn.',
    palaces: ['Mệnh', cleanPalaceName(prev.chucNang), cleanPalaceName(next.chucNang)],
    conditions: { required: ['Địa Không và Địa Kiếp phân cư hai cung giáp cung Mệnh'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 29. Hình Tù Giáp Ấn / Liêm Sát Dương hội chiếu */
function detectLianShaYang(chart, patterns) {
  const sf = sanFangAllStars(chart);
  if (!(sf.has('Liêm Trinh') && sf.has('Thất Sát') && sf.has('Kình Dương'))) return;

  pushPattern(patterns, {
    id: 'liem-sat-duong',
    name: 'Liêm Sát Kình Dương Hội (Hình Tù Hội Sát)',
    nameZh: '廉杀羊',
    level: 'caution',
    description: 'Liêm Trinh (Tù tinh), Thất Sát (Tướng tinh) và Kình Dương (Hình tinh) cùng hội chiếu Tam Phương Tứ Chính. Nhắc nhở cần tuân thủ pháp luật nghiêm ngặt, chú ý an toàn giao thông và kiểm soát xung đột.',
    palaces: ['Mệnh'],
    conditions: { required: ['Liêm Trinh, Thất Sát, Kình Dương hội chiếu Tam Phương Tứ Chính'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư》',
  });
}

/** 30. Cự Hỏa Dương: Cự Môn + Hỏa Tinh + Kình Dương hội chiếu */
function detectJuHuoYang(chart, patterns) {
  const sf = sanFangAllStars(chart);
  if (!(sf.has('Cự Môn') && sf.has('Hỏa Tinh') && sf.has('Kình Dương'))) return;

  pushPattern(patterns, {
    id: 'cu-hoa-duong',
    name: 'Cự Hỏa Kình Dương Hội',
    nameZh: '巨火羊',
    level: 'caution',
    description: 'Cự Môn, Hỏa Tinh và Kình Dương cùng hội chiếu Tam Phương. Khẩu khí thẳng thắn dễ dẫn đến tranh chấp hoặc áp lực tinh thần; cần rèn luyện nghệ thuật lắng nghe và giữ lời nói ôn hòa.',
    palaces: ['Mệnh'],
    conditions: { required: ['Cự Môn, Hỏa Tinh, Kình Dương hội chiếu Tam Phương Tứ Chính'], bonus: [], breaking: [] },
    source: '《Đẩu Số Cốt Tủy Phú》',
  });
}

/** 31. Linh Xương Đà Vũ: Linh Tinh + Văn Xương + Đà La + Vũ Khúc hội chiếu */
function detectLingChangTuoWu(chart, patterns) {
  const sf = sanFangAllStars(chart);
  if (!(sf.has('Linh Tinh') && sf.has('Văn Xương') && sf.has('Đà La') && sf.has('Vũ Khúc'))) return;

  pushPattern(patterns, {
    id: 'linh-xuong-da-vu',
    name: 'Linh Xương Đà Vũ Hội',
    nameZh: '铃昌陀武',
    level: 'caution',
    description: 'Linh Tinh, Văn Xương, Đà La và Vũ Khúc cùng hội trong Tam Phương Tứ Chính. Cổ thư nhắc nhở khi gặp tổ hợp này cần hết sức thận trọng trong ký kết văn thư, bảo lãnh tài chính và giữ vững tâm lý trước biến cố.',
    palaces: ['Mệnh'],
    conditions: { required: ['Linh Tinh, Văn Xương, Đà La, Vũ Khúc hội chiếu Tam Phương Tứ Chính'], bonus: [], breaking: [] },
    source: '《Đẩu Số Cốt Tủy Phú · Linh Xương Đà Vũ》',
  });
}

/** 32. Mã Đầu Đái Tiễn: Kình Dương tọa Mệnh tại Ngọ */
function detectMaTouDaiJian(chart, ming, patterns) {
  if (ming.chiIndex !== 6) return;
  if (!hasStar(ming, 'Kình Dương')) return;

  const required = ['Kình Dương tọa thủ cung Mệnh tại Ngọ'];
  const bonus = [];
  const sf = sanFangAllStars(chart);
  if (sf.has('Thất Sát') || sf.has('Phá Quân') || hasStar(ming, 'Thiên Đồng')) bonus.push('Hội Thất Sát / Phá Quân / Thiên Đồng Thái Âm (Bính Mậu hạn phát võ quý)');
  if (sf.has('Thiên Khôi') || sf.has('Thiên Việt')) bonus.push('Khôi Việt quý nhân gia hội');

  pushPattern(patterns, {
    id: 'ma-dau-dai-tien',
    name: 'Mã Đầu Đái Tiễn (Ngựa Mang Cung Tên)',
    nameZh: '马头带箭',
    level: bonus.length ? 'good' : 'caution',
    description: 'Kình Dương tọa Mệnh tại cung Ngọ, cổ phú viết "Mã đầu đái tiễn, uy trấn biên cương". Chủ về ý chí kiên cường, hành động quyết liệt, sau nhiều thử thách gian lao sẽ lập nên nghiệp lớn.',
    palaces: ['Mệnh'],
    conditions: { required, bonus, breaking: [] },
    source: '《Đẩu Số Cốt Tủy Phú · Mã Đầu Đái Tiễn》',
  });
}

// ────────────────── 5. CÁCH CỤC KINH ĐIỂN BỔ SUNG & CƠ BẢN (10+ CÁCH) ──────────────────

/** 33. Lộc Tồn Thủ Mệnh / Thủ Thân */
function detectLuCunShouShen(chart, patterns) {
  const luCunPalace = findStarPalace(chart, 'Lộc Tồn');
  if (!luCunPalace) return;
  const inMing = luCunPalace.chiIndex === getMenhBranch(chart);
  const inShen = luCunPalace.chiIndex === getThanBranch(chart);
  if (!inMing && !inShen) return;

  pushPattern(patterns, {
    id: inMing ? 'loc-ton-thu-menh' : 'loc-ton-thu-than',
    name: inMing ? 'Lộc Tồn Thủ Mệnh' : 'Lộc Tồn Thủ Thân',
    nameZh: inMing ? '禄存守命' : '禄存守身',
    level: 'good',
    description: inMing
      ? 'Lộc Tồn (Thiên Lộc) tọa thủ cung Mệnh, chủ về suốt đời cơm áo vững vàng, cẩn trọng và giỏi tích lũy tài sản. Nếu hội thêm Hóa Lộc hoặc Thiên Mã càng đại phát.'
      : 'Lộc Tồn tọa thủ cung Thân, hậu vận sau tuổi 35 tài lộc ổn định, phúc lộc dồi dào.',
    palaces: [inMing ? 'Mệnh' : cleanPalaceName(luCunPalace.chucNang)],
    conditions: { required: [inMing ? 'Lộc Tồn tọa cung Mệnh' : 'Lộc Tồn tọa cung Thân'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Lộc Tồn Tinh》',
  });
}

/** 34. Lộc Mã Giao Trì & Thiên Mã Nhập Mệnh / Thiên Di */
function detectTianMaRuMing(chart, patterns) {
  const tianMaPalace = findStarPalace(chart, 'Thiên Mã');
  if (!tianMaPalace) return;
  const menhBranch = getMenhBranch(chart);
  const inMing = tianMaPalace.chiIndex === menhBranch;
  const inQian = tianMaPalace.chiIndex === ((menhBranch + 6) % 12);

  // Kiểm tra Lộc Mã Giao Trì trong Tam Phương
  const sf = sanFangAllStars(chart);
  if (sf.has('Thiên Mã') && (sf.has('Lộc Tồn') || sanFangHasSiHua(chart, 'Hóa Lộc'))) {
    pushPattern(patterns, {
      id: 'loc-ma-giao-tri',
      name: 'Lộc Mã Giao Trì',
      nameZh: '禄马交驰',
      level: 'excellent',
      description: 'Thiên Mã hội hợp Lộc Tồn hoặc Hóa Lộc trong Tam Phương Tứ Chính ("Lộc Mã giao trì, phát tài viễn quận"). Càng năng động di chuyển, xuất ngoại, giao thương hoặc đổi mới càng phát đạt lớn về tài lộc.',
      palaces: [cleanPalaceName(tianMaPalace.chucNang)],
      conditions: { required: ['Thiên Mã hội cùng Lộc Tồn hoặc Hóa Lộc trong Tam Phương Tứ Chính'], bonus: [], breaking: [] },
      source: '《Đẩu Số Cốt Tủy Phú · Lộc Mã Giao Trì》',
    });
  }

  if (!inMing && !inQian) return;
  pushPattern(patterns, {
    id: inMing ? 'thien-ma-nhap-menh' : 'thien-ma-tai-di',
    name: inMing ? 'Thiên Mã Nhập Mệnh' : 'Thiên Mã Cư Thiên Di',
    nameZh: inMing ? '天马入命' : '天马在迁',
    level: 'neutral',
    description: inMing
      ? 'Thiên Mã tọa thủ cung Mệnh, tính cách năng động, thích dịch chuyển, hợp làm việc đa quốc gia, thương mại, logistics hoặc phát triển sự nghiệp phương xa.'
      : 'Thiên Mã cư cung Thiên Di, ra ngoài nhiều cơ hội mở mang tầm mắt, lập nghiệp phương xa thuận lợi.',
    palaces: [cleanPalaceName(tianMaPalace.chucNang)],
    conditions: { required: [inMing ? 'Thiên Mã tọa cung Mệnh' : 'Thiên Mã tọa cung Thiên Di'], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Thiên Mã Tinh》',
  });
}

/** 35. Hóa Lộc Nhập Tài Bạch */
function detectHuaLuRuCai(chart, patterns) {
  const cai = getPalates(chart).find(p => cleanPalaceName(p.chucNang) === 'Tài Bạch');
  if (!cai || !palaceHasSiHua(cai, 'Hóa Lộc', chart)) return;
  const birthMap = getChartBirthSiHuaMap(chart);
  const luStar = getAllStarNames(cai).find(s => birthMap[s] === 'Hóa Lộc') || 'Chính tinh';

  pushPattern(patterns, {
    id: 'hoa-loc-nhap-tai',
    name: 'Hóa Lộc Nhập Tài Bạch',
    nameZh: '化禄入财',
    level: 'good',
    description: `${luStar} Hóa Lộc tọa thủ cung Tài Bạch, chủ về dòng tiền thông suốt, nhạy bén với cơ hội kiếm tiền và có duyên tài chính tự nhiên.`,
    palaces: ['Tài Bạch'],
    conditions: { required: [`${luStar} Hóa Lộc tọa thủ cung Tài Bạch`], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Luận》',
  });
}

/** 36. Hóa Quyền Nhập Quan Lộc */
function detectHuaQuanRuGuan(chart, patterns) {
  const guan = getPalates(chart).find(p => cleanPalaceName(p.chucNang) === 'Quan Lộc');
  if (!guan || !palaceHasSiHua(guan, 'Hóa Quyền', chart)) return;
  const birthMap = getChartBirthSiHuaMap(chart);
  const quanStar = getAllStarNames(guan).find(s => birthMap[s] === 'Hóa Quyền') || 'Chính tinh';

  pushPattern(patterns, {
    id: 'hoa-quyen-nhap-quan',
    name: 'Hóa Quyền Nhập Quan Lộc',
    nameZh: '化权入官',
    level: 'good',
    description: `${quanStar} Hóa Quyền tọa thủ cung Quan Lộc, chủ về năng lực điều hành, quyết đoán trong công việc, dễ nắm giữ vị trí quản lý hoặc chuyên gia đầu ngành.`,
    palaces: ['Quan Lộc'],
    conditions: { required: [`${quanStar} Hóa Quyền tọa thủ cung Quan Lộc`], bonus: [], breaking: [] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Luận》',
  });
}

/** 37. Hóa Khoa Nhập Mệnh / Thân */
function detectHuaKeRuMingShen(chart, patterns) {
  const ming = getPalaceByBranch(chart, getMenhBranch(chart));
  const shen = getPalaceByBranch(chart, getThanBranch(chart));
  const birthMap = getChartBirthSiHuaMap(chart);

  for (const p of [ming, shen].filter(Boolean)) {
    if (!palaceHasSiHua(p, 'Hóa Khoa', chart)) continue;
    const keStar = getAllStarNames(p).find(s => birthMap[s] === 'Hóa Khoa') || 'Chính tinh';
    const isMing = p.chiIndex === getMenhBranch(chart);
    pushPattern(patterns, {
      id: isMing ? 'hoa-khoa-nhap-menh' : 'hoa-khoa-nhap-than',
      name: isMing ? 'Hóa Khoa Nhập Mệnh' : 'Hóa Khoa Nhập Thân',
      nameZh: isMing ? '化科入命' : '化科入身',
      level: 'good',
      description: `${keStar} Hóa Khoa tọa thủ cung ${isMing ? 'Mệnh' : 'Thân'}, chủ về học thức, uy tín chuyên môn, phong thái nho nhã và có năng lực giải ách trừ nguy.`,
      palaces: [cleanPalaceName(p.chucNang)],
      conditions: { required: [`${keStar} Hóa Khoa tọa thủ cung ${cleanPalaceName(p.chucNang)}`], bonus: [], breaking: [] },
      source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Luận》',
    });
    return;
  }
}

/** 38. Cơ Nguyệt Đồng Lương Tam Tinh Hội */
function detectJiYueTongLiangPartial(chart, ming, patterns) {
  const sanFangSet = sanFangAllStars(chart);
  const has = ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'].filter(s => sanFangSet.has(s));
  if (has.length !== 3) return;
  const missing = ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'].filter(s => !sanFangSet.has(s));

  pushPattern(patterns, {
    id: 'co-nguyet-dong-luong-tam-tinh',
    name: 'Cơ Nguyệt Đồng Lương Tam Tinh Hội',
    nameZh: '机月同梁三星会',
    level: 'neutral',
    description: `Tam Phương Tứ Chính hội 3 trong 4 sao hệ Cơ Nguyệt Đồng Lương (${has.join(', ')}; khuyết ${missing.join(', ')}). Mang khí chất điềm đạm, trí tuệ, hợp công việc chuyên môn, giáo dục, nghiên cứu và quản trị ổn định.`,
    palaces: getSanFangPalaces(chart).filter(p => has.some(s => getMajorStarNames(p).includes(s))).map(p => cleanPalaceName(p.chucNang)),
    conditions: { required: [`Tam Phương Tứ Chính hội ${has.join(', ')}`] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Cơ Nguyệt Đồng Lương Cách》',
  });
}

/** 39. Xương Khúc Đồng Hội / Tọa Mệnh */
function detectChangQuTongHui(chart, patterns) {
  const sf = sanFangAllStars(chart);
  if (!sf.has('Văn Xương') || !sf.has('Văn Khúc')) return;
  const ming = getPalaceByBranch(chart, getMenhBranch(chart));
  if (!ming) return;
  const inMing = hasStar(ming, 'Văn Xương') && hasStar(ming, 'Văn Khúc');

  pushPattern(patterns, {
    id: inMing ? 'xuong-khuc-toa-menh' : 'xuong-khuc-dong-hoi',
    name: inMing ? 'Văn Tinh Ám Củng (Xương Khúc Tọa Mệnh)' : 'Xương Khúc Đồng Hội',
    nameZh: inMing ? '昌曲坐命' : '昌曲同会',
    level: 'good',
    description: inMing
      ? 'Văn Xương và Văn Khúc đồng cung tọa Mệnh, chủ về tư chất thông minh, tài hoa nghệ thuật, ngôn từ sắc sảo và học nhanh hiểu rộng.'
      : 'Văn Xương và Văn Khúc cùng hội chiếu Tam Phương Tứ Chính cung Mệnh, lợi cho học hành, thi cử, truyền thông và sáng tạo tri thức.',
    palaces: ['Mệnh'],
    conditions: { required: ['Văn Xương và Văn Khúc đồng hội Tam Phương Tứ Chính cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Văn Tinh Luận》',
  });
}

/** 40. Phụ Bật Đồng Hội */
function detectFuBiTongHui(chart, patterns) {
  const sf = sanFangAllStars(chart);
  if (!sf.has('Tả Phụ') || !sf.has('Hữu Bật')) return;

  pushPattern(patterns, {
    id: 'phu-bat-dong-hoi',
    name: 'Tả Hữu Đồng Hội (Phụ Bật Tương Phùng)',
    nameZh: '辅弼同会',
    level: 'good',
    description: 'Tả Phụ và Hữu Bật cùng hội chiếu Tam Phương Tứ Chính cung Mệnh, chủ về hậu thuẫn nhân sự vững chắc, hợp làm việc đội nhóm và lãnh đạo tập thể.',
    palaces: ['Mệnh'],
    conditions: { required: ['Tả Phụ và Hữu Bật đồng hội Tam Phương Tứ Chính cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Phụ Bật Luận》',
  });
}

/** 41. Khôi Việt Đồng Hội */
function detectKuiYueTongHui(chart, patterns) {
  const sf = sanFangAllStars(chart);
  if (!sf.has('Thiên Khôi') || !sf.has('Thiên Việt')) return;

  pushPattern(patterns, {
    id: 'khoi-viet-dong-hoi',
    name: 'Khôi Việt Đồng Hội (Thiên Ất Quý Nhân)',
    nameZh: '魁钺同会',
    level: 'good',
    description: 'Thiên Khôi và Thiên Việt cùng hội chiếu Tam Phương Tứ Chính cung Mệnh, cổ phú viết "Khôi Việt đồng cung danh liệt tam khanh", luôn có quý nhân xuất hiện trợ giúp khi gặp bước ngoặt.',
    palaces: ['Mệnh'],
    conditions: { required: ['Thiên Khôi và Thiên Việt đồng hội Tam Phương Tứ Chính cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Khôi Việt Luận》',
  });
}

/** 42. Khoa Quyền Song Hội */
function detectKeQuanShuangHui(chart, patterns) {
  const sfPalaces = getSanFangPalaces(chart);
  const hasKe = sfPalaces.some(p => palaceHasSiHua(p, 'Hóa Khoa', chart));
  const hasQuan = sfPalaces.some(p => palaceHasSiHua(p, 'Hóa Quyền', chart));
  if (!hasKe || !hasQuan) return;

  pushPattern(patterns, {
    id: 'khoa-quyen-song-hoi',
    name: 'Khoa Quyền Song Hội',
    nameZh: '科权双会',
    level: 'good',
    description: 'Hóa Khoa và Hóa Quyền cùng hội chiếu Tam Phương Tứ Chính cung Mệnh, vừa có uy tín học thuật/danh tiếng (Khoa) vừa có năng lực quyết đoán thực thi (Quyền).',
    palaces: ['Mệnh'],
    conditions: { required: ['Hóa Khoa và Hóa Quyền đồng hội Tam Phương Tứ Chính cung Mệnh'] },
    source: '《Tử Vi Đẩu Số Toàn Thư · Tứ Hóa Hội Chiếu》',
  });
}

/** 43. Thất Sát Triều Đẩu / Ngưỡng Đẩu (Thất Sát độc tọa Tý/Ngọ/Dần/Thân) */
function detectQiShaChaoDou(chart, ming, patterns) {
  if (!hasStar(ming, 'Thất Sát') || getMajorStarNames(ming).length > 1) return;
  if (![0, 6, 2, 8].includes(ming.chiIndex)) return;

  const isDanThan = ming.chiIndex === 2 || ming.chiIndex === 8;
  pushPattern(patterns, {
    id: 'that-sat-trieu-dau',
    name: isDanThan ? 'Thất Sát Triều Đẩu (Dần / Thân)' : 'Thất Sát Ngưỡng Đẩu (Tý / Ngọ)',
    nameZh: '七杀朝斗',
    level: 'excellent',
    description: `Thất Sát độc tọa cung Mệnh tại ${ming.chiName}, đối cung có Tử Vi Thiên Phủ xung chiếu, cổ phú viết "Thất Sát triều đẩu, tước lộc vinh xương". Chủ về uy quyền lớn, bản lĩnh thống lĩnh và tự tay gây dựng cơ đồ.`,
    palaces: ['Mệnh'],
    conditions: { required: [`Thất Sát độc tọa cung Mệnh tại ${ming.chiName} miếu địa`] },
    source: '《Đẩu Số Cốt Tủy Phú · Thất Sát Triều Đẩu》',
  });
}

/** 44. Nhật Chiếu Lôi Môn (Thái Dương tọa Mệnh tại Mão) & Nguyệt Lãng Thiên Môn (Thái Âm tọa Mệnh tại Hợi) */
function detectRiYueSpecialMing(chart, ming, patterns) {
  if (ming.chiIndex === 3 && hasStar(ming, 'Thái Dương')) {
    pushPattern(patterns, {
      id: 'nhat-chieu-loi-mon',
      name: 'Nhật Chiếu Lôi Môn (Nhật Xuất Phù Tang)',
      nameZh: '日照雷门',
      level: 'excellent',
      description: 'Thái Dương đồng độ Thiên Lương tại cung Mão (Chấn cung - Lôi Môn) vào giờ Mão mặt trời mọc rạng rỡ khắp nhân gian. Chủ về danh tiếng vang xa, tâm hồn quang minh chính đại, phú quý vinh hiển.',
      palaces: ['Mệnh'],
      conditions: { required: ['Thái Dương tọa thủ cung Mệnh tại Mão'] },
      source: '《Tử Vi Đẩu Số Toàn Thư · Nhật Chiếu Lôi Môn》',
    });
  }
  if (ming.chiIndex === 11 && hasStar(ming, 'Thái Âm')) {
    pushPattern(patterns, {
      id: 'nguyet-lang-thien-mon',
      name: 'Nguyệt Lãng Thiên Môn (Trăng Sáng Cổng Trời)',
      nameZh: '月朗天门',
      level: 'excellent',
      description: 'Thái Âm độc tọa cung Mệnh tại Hợi (Thiên Môn) ban đêm trăng sáng vằng vặc, cổ phú khen "Nguyệt lãng Thiên Môn, tấn tước phong hầu". Chủ về trí tuệ thanh cao, tài phú dồi dào và nhân duyên tốt đẹp.',
      palaces: ['Mệnh'],
      conditions: { required: ['Thái Âm độc tọa cung Mệnh tại Hợi'] },
      source: '《Tử Vi Đẩu Số Toàn Thư · Nguyệt Lãng Thiên Môn》',
    });
  }
}

// ────────────────── HÀM CHÍNH NHẬN DIỆN CÁCH CỤC ──────────────────
export function detectPatterns(chart) {
  const patterns = [];
  const ming = getPalaceByBranch(chart, getMenhBranch(chart));
  if (!ming) return patterns;

  // Thượng cách & Chính cách
  detectJunChenQingHui(chart, ming, patterns);
  detectZiFu(chart, ming, patterns);
  detectFuXiangChaoYuan(chart, ming, patterns);
  detectYangLiangChangLu(chart, ming, patterns);
  detectHuoTanLingTan(chart, ming, patterns);
  detectWuTan(chart, ming, patterns);
  detectShaPoLang(chart, ming, patterns);
  detectJiYueTongLiang(chart, ming, patterns);

  // Trung cách & Đồng độ / Giáp cung
  detectLianXiang(chart, patterns);
  detectWuQiSha(chart, patterns);
  detectTongLiang(chart, patterns);
  detectRiYueTongGong(chart, patterns);
  detectRiYueJiaMing(chart, patterns);
  detectJuRiTongGong(chart, patterns);
  detectShiZhongYinYu(chart, ming, patterns);
  detectMingZhuChuHai(chart, ming, patterns);
  detectZiWeiInMing(chart, ming, patterns);
  detectQiShaChaoDou(chart, ming, patterns);
  detectRiYueSpecialMing(chart, ming, patterns);

  // Trợ lực cách
  detectFuBiJiaMing(chart, patterns);
  detectChangQuJiaMing(chart, patterns);
  detectKuiYueJiaMing(chart, patterns);
  detectShuangLuChaoYuan(chart, ming, patterns);
  detectSanQiJiaHui(chart, patterns);
  detectHuaLuRuMing(chart, ming, patterns);

  // Hung cách / Cần lưu ý
  detectHuaJiRuMingQian(chart, patterns);
  detectYangTuoJiaJi(chart, patterns);
  detectHuoLingJiaMing(chart, patterns);
  detectKongJieJiaMing(chart, patterns);
  detectLianShaYang(chart, patterns);
  detectJuHuoYang(chart, patterns);
  detectLingChangTuoWu(chart, patterns);
  detectMaTouDaiJian(chart, ming, patterns);

  // Cơ bản & Bổ trợ
  detectLuCunShouShen(chart, patterns);
  detectTianMaRuMing(chart, patterns);
  detectHuaLuRuCai(chart, patterns);
  detectHuaQuanRuGuan(chart, patterns);
  detectHuaKeRuMingShen(chart, patterns);
  detectJiYueTongLiangPartial(chart, ming, patterns);
  detectChangQuTongHui(chart, patterns);
  detectFuBiTongHui(chart, patterns);
  detectKuiYueTongHui(chart, patterns);
  detectKeQuanShuangHui(chart, patterns);

  return patterns;
}

// ────────────────── TÓM TẮT CUNG MỆNH ──────────────────
const STAR_KEYWORD_MAP_VI = {
  'Tử Vi': ['Tôn Quý', 'Độc Lập', 'Lãnh Đạo'],
  'Thiên Cơ': ['Trí Tuệ', 'Linh Hoạt', 'Mưu Lược'],
  'Thái Dương': ['Quang Minh', 'Quý Khí', 'Hào Sảng'],
  'Vũ Khúc': ['Tài Phú', 'Cương Nghị', 'Quyết Đoán'],
  'Thiên Đồng': ['Ôn Hòa', 'Phúc Hậu', 'Thung Dung'],
  'Liêm Trinh': ['Tài Nghệ', 'Đào Hoa', 'Chính Trực'],
  'Thiên Phủ': ['Tài Khố', 'Điềm Đạm', 'Bảo Toàn'],
  'Thái Âm': ['Tinh Tế', 'Tài Phú', 'Nội Tâm'],
  'Tham Lang': ['Đa Tài', 'Giao Tế', 'Khát Vọng'],
  'Cự Môn': ['Hùng Biện', 'Sâu Sắc', 'Phân Tích'],
  'Thiên Tướng': ['Ấn Tín', 'Điều Hành', 'Trọng Nghĩa'],
  'Thiên Lương': ['Che Chở', 'Y Dược', 'Đức Độ'],
  'Thất Sát': ['Tướng Tinh', 'Quả Quyết', 'Tiên Phong'],
  'Phá Quân': ['Khai Sáng', 'Đột Phá', 'Đổi Mới'],
};

const STAR_NATURE_MAP_VI = {
  'Tử Vi': 'Đế Vương Tinh',
  'Thiên Cơ': 'Trí Tuệ Tinh',
  'Thái Dương': 'Quý Nhân Tinh',
  'Vũ Khúc': 'Tài Bạch Tinh',
  'Thiên Đồng': 'Phúc Đức Tinh',
  'Liêm Trinh': 'Quyền Tù Tinh',
  'Thiên Phủ': 'Tài Khố Tinh',
  'Thái Âm': 'Tài Phú Tinh',
  'Tham Lang': 'Đào Hoa / Đa Nghệ Tinh',
  'Cự Môn': 'Ngôn Ngữ Tinh',
  'Thiên Tướng': 'Ấn Thụ Tinh',
  'Thiên Lương': 'Ấm Tinh',
  'Thất Sát': 'Tướng Soái Tinh',
  'Phá Quân': 'Khai Sáng Tinh',
};

export function getMingGongSummary(chart) {
  const mingPalace = getPalaceByBranch(chart, getMenhBranch(chart));
  if (!mingPalace) return { stars: [], keywords: [], nature: '', borrowedFromDuiGong: false };

  let starNames = getMajorStarNames(mingPalace);
  let borrowedFromDuiGong = false;
  if (starNames.length === 0) {
    const dui = getDuiGong(chart, mingPalace.chiIndex);
    const duiMajors = getMajorStarNames(dui);
    if (duiMajors.length > 0) {
      starNames = duiMajors;
      borrowedFromDuiGong = true;
    }
  }

  const keywords = starNames.flatMap(n => STAR_KEYWORD_MAP_VI[n] ?? []).slice(0, 6);
  const nature = borrowedFromDuiGong
    ? `Mệnh Vô Chính Diệu (Mượn ${starNames.join(' · ')} xung chiếu)`
    : (starNames.length > 0 ? starNames.map(s => STAR_NATURE_MAP_VI[s]).filter(Boolean).join(' · ') : 'Mệnh Vô Chính Diệu');

  return {
    stars: starNames,
    keywords,
    nature,
    borrowedFromDuiGong,
  };
}
