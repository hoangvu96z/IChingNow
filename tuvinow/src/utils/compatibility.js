import { solarToLunar } from './lunarConverter.js';
import { anLaSoTuVi } from './tuViEngine.js';
import { buildTuViText, TOPICS } from './buildTuViPrompt.js';
import { buildTuViEvidence } from './tuViEvidence.js';

export const COMPATIBILITY_VERSION = 'user-reference-1';
export const WEIGHTS = { nguHanh: .30, phuThe: .30, tuHoa: .25, daoHoa: .15 };
// The nine names in the supplied example, not an expanded astrological catalogue.
export const ROMANCE_STARS = ['Hồng Loan', 'Thái Âm', 'Tham Lang', 'Văn Khúc', 'Văn Xương', 'Hóa Lộc', 'Thiên Hỷ', 'Đào Hoa', 'Thiên Cơ'];
const BAD_STARS = ['Quả Tú', 'Cô Thần', 'Kình Dương', 'Đà La', 'Địa Không', 'Địa Kiếp'];
const ELEMENTS = { Kim: 'Kim', Moc: 'Mộc', Thuy: 'Thủy', Hoa: 'Hỏa', Tho: 'Thổ' };
const SINH = { Kim: 'Thuy', Thuy: 'Moc', Moc: 'Hoa', Hoa: 'Tho', Tho: 'Kim' };
const starName = s => s.replace(/\s*\([MVĐBH]\)$/, '').trim();

export function createCompatibilityPerson(person) {
  const hoTen = person.hoTen?.trim();
  const { ngay, thang, nam, gio, gioiTinh } = person;
  if (!hoTen || hoTen.length > 100) throw new Error('Họ tên cần từ 1 đến 100 ký tự.');
  if (![ngay, thang, nam, gio].every(Number.isInteger) || nam < 1900 || nam > new Date().getFullYear()
    || thang < 1 || thang > 12 || ngay < 1 || ngay > new Date(nam, thang, 0).getDate()
    || gio < 0 || gio > 23 || !['Nam', 'Nữ'].includes(gioiTinh)) throw new Error('Kiểm tra ngày sinh dương lịch, giờ sinh (0–23) và giới tính.');
  const inputData = { ...solarToLunar(nam, thang, ngay), name: hoTen, isLunar: false,
    solarInput: { day: ngay, month: thang, year: nam }, lunarHourIndex: Math.floor((gio + 1) / 2) % 12, gender: gioiTinh === 'Nam' ? 1 : 0 };
  const result = anLaSoTuVi(inputData);
  const phuThe = result.palates.find(p => p.chucNang.replace(' <THÂN>', '') === 'Phu Thê');
  const menh = Object.keys(ELEMENTS).find(key => result.banMenhNapAm.endsWith(ELEMENTS[key]));
  if (!menh || !phuThe) throw new Error('Lá số thiếu Nạp Âm hoặc cung Phu Thê để đối chiếu.');
  return { inputData, result, person: { hoTen, menh,
    phuTheStars: [...phuThe.chinhTinh, ...phuThe.phuTinh].map(starName), canPhuThe: phuThe.canName,
    daoHoaStars: result.palates.flatMap(p => [...p.chinhTinh, ...p.phuTinh].map(starName)
      .filter(sao => ROMANCE_STARS.includes(sao)).map(sao => ({ sao, cung: p.chucNang.replace(' <THÂN>', '') }))) } };
}

export function evaluateCompatibility(chong, vo) {
  let nguHanhScore = 75;
  let interaction = 'Bình hòa';
  let nguHanhDetail = 'Bình hòa theo điểm mặc định của code mẫu.';
  if (SINH[vo.menh] === chong.menh) {
    nguHanhScore = 85; interaction = `${ELEMENTS[vo.menh]} sinh ${ELEMENTS[chong.menh]}`;
    nguHanhDetail = `${interaction}. Vợ hỗ trợ, nuôi dưỡng chồng theo quy tắc tương sinh.`;
  } else if (SINH[chong.menh] === vo.menh) {
    nguHanhScore = 80; interaction = `${ELEMENTS[chong.menh]} sinh ${ELEMENTS[vo.menh]}`;
    nguHanhDetail = `${interaction}. Chồng hỗ trợ, bảo bọc vợ theo quy tắc tương sinh.`;
  } else if (chong.menh !== vo.menh) {
    interaction = 'Chưa có quy tắc chấm điểm tương khắc';
    nguHanhDetail = 'Code mẫu chưa xử lý tương khắc; đang giữ điểm mặc định 75, không phải kết luận bình hòa.';
  }
  const penalty = [...chong.phuTheStars, ...vo.phuTheStars].reduce((sum, s) => sum + (BAD_STARS.includes(s) ? 5 : 0) + (s === 'Thất Sát' ? 3 : 0), 0);
  const phuTheScore = Math.max(30, Math.min(95, 70 - penalty));
  const daoHoaScore = Math.min(100, Math.round((chong.daoHoaStars.length + vo.daoHoaStars.length) / 16 * 100));
  const list = entries => entries.map(s => `${s.sao} (${s.cung})`).join(', ') || 'Không có';
  const cards = {
    nguHanh: { title: 'Ngũ hành tương hợp', score: nguHanhScore, detail: nguHanhDetail },
    phuThe: { title: 'Cung Phu Thê', score: phuTheScore, detail: `Chồng: ${chong.phuTheStars.join(', ')}. Vợ: ${vo.phuTheStars.join(', ')}. Điểm gốc 70, trừ ${penalty} điểm theo danh sách sao trong code mẫu; giới hạn 30–95.` },
    tuHoa: { title: 'Tứ Hóa chéo', score: 55, detail: 'Điểm mặc định 55 của code mẫu. Chưa tính phi hóa chéo; chưa thể kết luận có hay không chiếu vào Mệnh/Phu Thê.', provisional: true },
    daoHoa: { title: 'Đào hoa · sức hút', score: daoHoaScore, detail: `Chồng có ${chong.daoHoaStars.length}: ${list(chong.daoHoaStars)}. Vợ có ${vo.daoHoaStars.length}: ${list(vo.daoHoaStars)}.` },
  };
  const rawScore = Number(Object.entries(cards).reduce((sum, [key, card]) => sum + card.score * WEIGHTS[key], 0).toFixed(2));
  const totalScore = Math.round(rawScore);
  return { version: COMPATIBILITY_VERSION, totalScore, rawScore, ratingText: totalScore >= 70 ? 'Hợp, hài hoà' : 'Bình hòa',
    husbandName: chong.hoTen, wifeName: vo.hoTen, elements: { husbandElement: ELEMENTS[chong.menh], wifeElement: ELEMENTS[vo.menh], interaction }, cards };
}

export function buildCompatibility(payload) {
  const chong = createCompatibilityPerson(payload.chong);
  const vo = createCompatibilityPerson(payload.vo);
  return { payload, chong, vo, assessment: evaluateCompatibility(chong.person, vo.person) };
}

export function compatibilityEvidence(pair) {
  return ['chong', 'vo'].flatMap(key => buildTuViEvidence(pair[key].result).map(entry => ({ ...entry,
    id: `${key}.${entry.id}`, label: `${key === 'chong' ? 'Chồng' : 'Vợ'} · ${pair[key].inputData.name} · ${entry.label}` })));
}

export function compatibilityText(pair) {
  return `HỢP HÔN TỬ VI — ${pair.assessment.version}\nKết quả quy tắc (chưa hoàn chỉnh vì Tứ Hóa chéo đang cố định):\n${JSON.stringify(pair.assessment, null, 2)}\nTrọng số: ${JSON.stringify(WEIGHTS)}. Tổng làm tròn số nguyên theo code mẫu.\n\nNGƯỜI A — CHỒNG\n${buildTuViText(pair.chong.result, pair.chong.inputData)}\n\nNGƯỜI B — VỢ\n${buildTuViText(pair.vo.result, pair.vo.inputData)}`;
}

export function compatibilityPrompt(pair, topic, question) {
  return `Luận giải hợp hôn của hai người bằng tiếng Việt. Chủ đề: ${TOPICS[topic] || TOPICS.love}. Câu hỏi: ${question?.trim() || 'Phân tích sự hòa hợp, điểm cần dung hòa và cách giao tiếp trong mối quan hệ.'}\n${compatibilityText(pair)}\nYÊU CẦU: Phân tích cả hai lá số, Mệnh/Thân/Phu Thê và các cung liên quan; mỗi nhận định dẫn dữ kiện và ghi rõ thuộc người nào. Không an lại sao, không thêm dữ liệu hay tự đổi điểm. Điểm Tứ Hóa 55 là placeholder chưa tính, tuyệt đối không diễn giải như đã kiểm tra phi hóa. Nhánh tương khắc chưa có quy tắc thì nêu giới hạn, không khẳng định bình hòa. Số sao đào hoa không chứng minh ngoại tình. Điểm số không phải xác suất hôn nhân thành công. Tách tổng quan, bốn tiêu chí, vấn đề người dùng hỏi, điểm cần dung hòa và 3 hành động cụ thể. Không kết luận nên cưới/chia tay chỉ từ lá số. Trả lời câu hỏi tiếp nối theo cùng cặp hồ sơ.`;
}
