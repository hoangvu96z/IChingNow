import test from 'node:test';
import assert from 'node:assert/strict';
import { anLaSoTuVi } from '../src/utils/tuViEngine.js';
import { buildTuViText, buildTuViPrompt, splitSuggestions } from '../src/utils/buildTuViPrompt.js';

const input = { name: 'Nguyễn An', lunarYear: 1996, lunarMonth: 4, lunarDay: 12, lunarHourIndex: 3, yearCanIndex: 2, yearChiIndex: 0, gender: 1, isLunar: true };
const result = anLaSoTuVi(input);
test('exports all 12 palaces and every computed star without recalculation', () => {
  const text = buildTuViText(result, input);
  assert.equal(result.palates.length, 12);
  for (const palace of result.palates) {
    assert.ok(text.includes(`${palace.chucNang} — ${palace.canName} ${palace.chiName}`));
    for (const star of [...palace.chinhTinh, ...palace.phuTinh]) assert.ok(text.includes(star));
    assert.ok(text.includes(`${palace.daiHan}–${palace.daiHan + 9}`));
  }
  assert.ok(text.includes('12/4/1996'));
  assert.ok(text.includes('Giờ sinh: Mão'));
  assert.ok(text.includes('Không cung cấp (nhập âm lịch)'));
});
test('prompt embeds the same export and selected question', () => {
  const prompt = buildTuViPrompt(result, input, 'career', 'Có nên đổi việc?');
  assert.ok(prompt.includes(buildTuViText(result, input)));
  assert.ok(prompt.includes('Công việc & tài chính'));
  assert.ok(prompt.includes('Có nên đổi việc?'));
  assert.ok(prompt.includes('Chưa có tiểu hạn/lưu niên'));
});
test('solar birth and leap lunar month stay distinguished', () => {
  const text = buildTuViText(result, { ...input, isLunar: false, solarDateStr: '29/5/1996', isLeap: true });
  assert.ok(text.includes('29/5/1996'));
  assert.ok(text.includes('(tháng nhuận)'));
});
test('suggestions are optional and limited to three', () => {
  assert.deepEqual(splitSuggestions('Bài luận'), { answer: 'Bài luận', suggestions: [] });
  assert.deepEqual(splitSuggestions('Bài luận\n---SUGGESTED_QUESTIONS---\n1. A\n2. B\n- C\n4. D'), { answer: 'Bài luận', suggestions: ['A', 'B', 'C'] });
});

test('full external export preserves annual facts and derives relationships from actual palace positions', () => {
  const annualInput = { ...input, viewYear: 2026, viewYearCanIndex: 2, viewYearChiIndex: 6 };
  const annual = anLaSoTuVi(annualInput);
  const before = structuredClone(annual);
  const text = buildTuViPrompt(annual, annualInput, 'love', 'Về gia đình?');
  assert.ok(text.includes('Khảo sát đủ 12 cung'));
  assert.ok(text.includes('Tuổi âm năm xem: 31'));
  assert.ok(text.includes(annual.canLuongStr));
  for (const p of annual.palates) {
    const opposite = annual.palates.find(other => other.chiIndex === (p.chiIndex + 6) % 12);
    assert.ok(text.includes(`xung chiếu = ${opposite.chucNang} tại ${opposite.chiName}`));
    assert.ok(text.includes(`Cung lưu niên đại hạn: ${p.luuNienChucNang}`));
    for (const s of p.phuTinh.filter(s => s.startsWith('L.'))) assert.ok(text.includes(s));
  }
  assert.ok(!text.includes('chỉ có 5'));
  assert.ok(!text.includes('undefined'));
  assert.deepEqual(annual, before);
});

test('older charts retain absent annual fields and incomplete birth input is explicit', () => {
  const legacy = structuredClone(result);
  delete legacy.engineVersion;
  delete legacy.canLuongStr;
  delete legacy.tuoiAm;
  delete legacy.tieuHanCung;
  const text = buildTuViText(legacy, {});
  assert.ok(text.includes('Không ghi nhận (lá số lịch sử)'));
  assert.ok(text.includes('Tiểu hạn: Chưa có dữ liệu'));
  assert.ok(text.includes('Cân lượng: Chưa có dữ liệu'));
  assert.ok(!text.includes('undefined'));
});

test('buildTuViPrompt incorporates dynamic yunxianState (Đại Hạn, Lưu Niên 2027, Lưu Nguyệt Tháng 5, Tứ Hóa, Phi Tinh matrix)', () => {
  const dynamicState = {
    mode: 'liunian',
    viewYear: 2027,
    lunarMonth: 5,
  };
  const prompt = buildTuViPrompt(result, input, 'overview', '', false, dynamicState);

  // Dynamic Vận Hạn sections
  assert.ok(prompt.includes('NGỮ CẢNH VẬN HẠN ĐỘNG THEO LỰA CHỌN HIỆN TẠI (TIMENAV)'));
  assert.ok(prompt.includes('ĐẠI HẠN ĐANG XEM'));
  assert.ok(prompt.includes('LƯU NIÊN ĐANG XEM: Năm 2027'));
  assert.ok(prompt.includes('LƯU NGUYỆT ĐANG XEM: Tháng 5 Âm Lịch'));

  // Multi-layer Tứ Hóa (ĐH, LN, LNg)
  assert.ok(prompt.includes('ĐH.Hóa Lộc'));
  assert.ok(prompt.includes('ĐH.Hóa Quyền'));
  assert.ok(prompt.includes('ĐH.Hóa Khoa'));
  assert.ok(prompt.includes('ĐH.Hóa Kỵ'));

  assert.ok(prompt.includes('LN.Hóa Lộc'));
  assert.ok(prompt.includes('LN.Hóa Quyền'));
  assert.ok(prompt.includes('LN.Hóa Khoa'));
  assert.ok(prompt.includes('LN.Hóa Kỵ'));

  assert.ok(prompt.includes('LNg.Hóa Lộc'));
  assert.ok(prompt.includes('LNg.Hóa Quyền'));
  assert.ok(prompt.includes('LNg.Hóa Khoa'));
  assert.ok(prompt.includes('LNg.Hóa Kỵ'));

  // 12-palace Phi Tinh matrix, Lai Nhân Cung & 3 Vòng Thập Nhị Thần
  assert.ok(prompt.includes('MA TRẬN PHI TINH TỨ HÓA 12 CUNG'));
  assert.ok(prompt.includes('LAI NHÂN CUNG'));
  assert.ok(prompt.includes('BA VÒNG THẬP NHỊ THẦN (BÁC SỸ, THÁI TUẾ, TƯỚNG TIỀN)'));
  assert.ok(prompt.includes('Vòng Bác Sỹ:'));
  assert.ok(prompt.includes('Vòng Thái Tuế:'));
  assert.ok(prompt.includes('Vòng Tướng Tiền:'));
  assert.ok(!prompt.includes('undefined'));
});

test('buildTuViPrompt with True Solar Time, Birthplace, and SchoolConfig outputs exact solar pillars and config', () => {
  const solarInput = {
    ...input,
    locationName: 'TP. Hồ Chí Minh',
    longitude: 106.66,
    clockHour: 6,
    clockMinute: 30,
    solarInput: { day: 29, month: 5, year: 1996 },
    schoolConfig: {
      lateZishiRule: 'ziwei_standard',
      brightnessSchool: 'xd1',
      gengStemSchool: 'XD',
      leapPolicy: 'mid',
    },
  };
  const text = buildTuViPrompt(result, solarInput, 'career', 'Đầu tư được không?');

  assert.ok(text.includes('CHÂN THÁI DƯƠNG THỜI (GIỜ MẶT TRỜI THẬT) VÀ ĐỊA ĐIỂM SINH'));
  assert.ok(text.includes('Nơi sinh: TP. Hồ Chí Minh'));
  assert.ok(text.includes('106.66°E'));
  assert.ok(text.includes('Giờ đồng hồ dân dụng: 6:30'));
  assert.ok(text.includes('Bát Tự Tứ Trụ (theo Tiết Khí Lập Xuân)'));
  assert.ok(text.includes('Cấu hình trường phái: Giờ Tý: ziwei_standard'));
  assert.ok(!text.includes('Không cung cấp nơi sinh, múi giờ sinh, phút sinh hoặc hiệu chỉnh giờ mặt trời.'));
});

