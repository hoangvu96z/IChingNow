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
  assert.ok(text.includes('HƯỚNG DẪN CẤU TRÚC LUẬN GIẢI (CHẾ ĐỘ TỔNG QUÁT & TRỌNG TÂM):'));
  assert.ok(!text.includes('---SUGGESTED_QUESTIONS---'));
  assert.ok(text.includes('KẾT QUẢ ĐÁNH GIÁ & LUẬN ĐOÁN TỪ ENGINE ZIWEI MỚI (V6 & V12):'));
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

test('exportOptions toggles includeZiweiEngine (on/off) and switches promptStyle (concise, topic_focused, full_12_palaces)', () => {
  const withEngine = buildTuViPrompt(result, input, 'overview', '', false, null, {
    includeZiweiEngine: true,
    promptStyle: 'concise',
  });
  assert.ok(withEngine.includes('KẾT QUẢ ĐÁNH GIÁ & LUẬN ĐOÁN TỪ ENGINE ZIWEI MỚI (V6 & V12):'));
  assert.ok(withEngine.includes('- Điểm đánh giá 6 phương diện cuộc đời:'));
  assert.ok(withEngine.includes('- Tóm tắt nhận định nền tảng từ Engine Luận Giải v6:'));
  assert.ok(withEngine.includes('CÁCH CỤC ĐẨU SỐ ĐƯỢC NHẬN DIỆN:'));
  assert.ok(withEngine.includes('MA TRẬN PHI TINH TỨ HÓA 12 CUNG:'));
  assert.ok(withEngine.includes('HƯỚNG DẪN CẤU TRÚC LUẬN GIẢI (CHẾ ĐỘ TỔNG QUÁT & TRỌNG TÂM):'));

  const withoutEngine = buildTuViPrompt(result, input, 'overview', '', false, null, {
    includeZiweiEngine: false,
    promptStyle: 'concise',
  });
  assert.ok(!withoutEngine.includes('KẾT QUẢ ĐÁNH GIÁ & LUẬN ĐOÁN TỪ ENGINE ZIWEI MỚI (V6 & V12):'));
  assert.ok(!withoutEngine.includes('CÁCH CỤC ĐẨU SỐ ĐƯỢC NHẬN DIỆN:'));
  assert.ok(!withoutEngine.includes('MA TRẬN PHI TINH TỨ HÓA 12 CUNG:'));
  assert.ok(withoutEngine.includes('CHI TIẾT 12 CUNG:'));

  const topicFocused = buildTuViPrompt(result, input, 'career', 'Thăng tiến?', false, null, {
    includeZiweiEngine: true,
    promptStyle: 'topic_focused',
  });
  assert.ok(topicFocused.includes('HƯỚNG DẪN CẤU TRÚC LUẬN GIẢI (CHẾ ĐỘ XOÁY SÂU CHỦ ĐỀ & VẬN HẠN):'));

  const full12Palaces = buildTuViPrompt(result, input, 'overview', '', false, null, {
    includeZiweiEngine: true,
    promptStyle: 'full_12_palaces',
  });
  assert.ok(full12Palaces.includes('HƯỚNG DẪN LUẬN GIẢI CHI TIẾT (KHẢO SÁT ĐỦ 12 CUNG):'));
  assert.ok(full12Palaces.includes('Khảo sát đủ 12 cung'));
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

test('buildTuViText and buildTuViPrompt dynamically adapt to mingpan, daxian, liunian (2026 -> 2029 updates L.*, tuổi âm, tiểu hạn), and liuyue (tháng 3 -> tháng 9)', () => {
  // 1. Mingpan mode
  const mingpanState = { mode: 'mingpan' };
  const mingpanText = buildTuViText(result, input, mingpanState);
  const mingpanPrompt = buildTuViPrompt(result, input, 'overview', '', false, mingpanState);

  assert.ok(mingpanText.includes('TÙY CHỌN VẬN HẠN ĐANG XEM / XUẤT CHO AI:'));
  assert.ok(mingpanText.includes('- Chế độ trọng tâm: BẢN MỆNH'));
  assert.ok(mingpanPrompt.includes('Trọng tâm luận giải: Tập trung phân tích chuyên sâu BẢN MỆNH'));

  // 2. Daxian mode (selecting specific daXianChiIndex)
  const daxianState1 = { mode: 'daxian', daXianChiIndex: 2 }; // Dần
  const daxianText1 = buildTuViText(result, input, daxianState1);
  const daxianPrompt1 = buildTuViPrompt(result, input, 'career', 'Sự nghiệp đại vận?', false, daxianState1);

  assert.ok(daxianText1.includes('- Chế độ trọng tâm: ĐẠI VẬN (ĐẠI HẠN 10 NĂM)'));
  assert.ok(daxianText1.includes('Tứ Hóa Đại Hạn: ĐH.Lộc'));
  assert.ok(daxianText1.includes('Cung Đại hạn đang xem:'));
  assert.ok(daxianPrompt1.includes('Trọng tâm luận giải: Tập trung phân tích chuyên sâu ĐẠI HẠN 10 NĂM đang chọn'));

  const daxianState2 = { mode: 'daxian', daXianChiIndex: 6 }; // Ngọ
  const daxianText2 = buildTuViText(result, input, daxianState2);
  assert.notEqual(daxianText1, daxianText2);

  // 3. Liunian mode: 2026 vs 2029
  // 2026: Bính Ngọ (31 tuổi âm)
  const liunian2026State = { mode: 'liunian', viewYear: 2026 };
  const text2026 = buildTuViText(result, input, liunian2026State);
  const prompt2026 = buildTuViPrompt(result, input, 'love', '', false, liunian2026State);

  assert.ok(text2026.includes('- Chế độ trọng tâm: LƯU NIÊN (VẬN HẠN THEO NĂM)'));
  assert.ok(text2026.includes('Năm 2026 (Bính Ngọ, 31 tuổi âm)'));
  assert.ok(text2026.includes('Tuổi âm năm xem: 31'));
  assert.ok(text2026.includes('LN.Lộc'));
  assert.ok(text2026.includes('L.Thái Tuế'));
  assert.ok(prompt2026.includes('Trọng tâm luận giải: Tập trung phân tích chuyên sâu LƯU NIÊN Năm 2026'));

  // 2029: Kỷ Dậu (34 tuổi âm)
  const liunian2029State = { mode: 'liunian', viewYear: 2029 };
  const text2029 = buildTuViText(result, input, liunian2029State);
  const prompt2029 = buildTuViPrompt(result, input, 'love', '', false, liunian2029State);

  assert.ok(text2029.includes('Năm 2029 (Kỷ Dậu, 34 tuổi âm)'));
  assert.ok(text2029.includes('Tuổi âm năm xem: 34'));
  assert.ok(prompt2029.includes('Trọng tâm luận giải: Tập trung phân tích chuyên sâu LƯU NIÊN Năm 2029'));
  // Ensure annual stars and tiểu hạn changed between 2026 and 2029
  assert.notEqual(text2026, text2029);

  // 4. Liuyue mode: tháng 3 vs tháng 9
  const liuyue3State = { mode: 'liuyue', viewYear: 2026, lunarMonth: 3 };
  const textMonth3 = buildTuViText(result, input, liuyue3State);
  const promptMonth3 = buildTuViPrompt(result, input, 'overview', '', false, liuyue3State);

  assert.ok(textMonth3.includes('- Chế độ trọng tâm: LƯU NGUYỆT (VẬN HẠN CHI TIẾT THEO THÁNG ÂM LỊCH)'));
  assert.ok(textMonth3.includes('Tháng 3 Âm Lịch'));
  assert.ok(textMonth3.includes('Cung Lưu nguyệt Tháng 3:'));
  assert.ok(textMonth3.includes('Tứ Hóa Lưu Nguyệt: LNg.Lộc'));
  assert.ok(promptMonth3.includes('Trọng tâm luận giải: Tập trung phân tích chuyên sâu LƯU NGUYỆT Tháng 3 Âm Lịch (Năm 2026)'));

  const liuyue9State = { mode: 'liuyue', viewYear: 2026, lunarMonth: 9 };
  const textMonth9 = buildTuViText(result, input, liuyue9State);
  const promptMonth9 = buildTuViPrompt(result, input, 'overview', '', false, liuyue9State);

  assert.ok(textMonth9.includes('Tháng 9 Âm Lịch'));
  assert.ok(textMonth9.includes('Cung Lưu nguyệt Tháng 9:'));
  assert.ok(promptMonth9.includes('Trọng tâm luận giải: Tập trung phân tích chuyên sâu LƯU NGUYỆT Tháng 9 Âm Lịch (Năm 2026)'));
  assert.notEqual(textMonth3, textMonth9);
});

test('Ngô Thị Tâm (24/7/2001 Dương -> 4/6/2001 Âm, Giờ Thìn, Âm Nữ, Lưu Niên 2027) has zero data contradictions in AI prompt', () => {
  const ngoThiTamInput = {
    name: 'Ngô Thị Tâm',
    lunarYear: 2001,
    lunarMonth: 6,
    lunarDay: 4,
    lunarHourIndex: 4, // Thìn
    yearCanIndex: 7,   // Tân
    yearChiIndex: 5,   // Tỵ
    gender: 0,         // Nữ
    isLunar: false,
    solarDateStr: '24/7/2001 (Dương lịch)',
    lunarDateStr: '6/4/2001 (Âm lịch)',
    viewYear: 2027,
    viewYearCanIndex: 3, // Đinh
    viewYearChiIndex: 7, // Mùi
    schoolConfig: {
      lateZishiRule: 'ziwei_standard',
      brightnessSchool: 'v11',
      gengStemSchool: 'XD',
      leapPolicy: 'mid',
    },
  };
  const chart = anLaSoTuVi(ngoThiTamInput);
  const prompt = buildTuViPrompt(chart, ngoThiTamInput, 'overview', '', false, {
    mode: 'liunian',
    viewYear: 2027,
  });

  // 1. Solar Four Pillars must use 24/7/2001 (Tháng Ất Mùi · Ngày Mậu Tý · Giờ Bính Thìn), NOT Lunar 4/6/2001 treated as June 4 (Tháng Quý Tỵ · Ngày Mậu Tuất)!
  assert.ok(prompt.includes('Năm Tân Tỵ · Tháng Ất Mùi · Ngày Mậu Tý · Giờ Bính Thìn'));
  assert.ok(!prompt.includes('Tháng Quý Tỵ'));

  // 2. Bone Weight poem for 4 lượng 6 chỉ is included with poem & meaning, not "không kèm bài thơ"
  assert.ok(prompt.includes('THƠ CÂN XƯƠNG ĐOÁN SỐ VIÊN THIÊN CƯƠNG:'));
  assert.ok(prompt.includes('Đông tây nam bắc tận giai thông'));
  assert.ok(!prompt.includes('không kèm bài thơ hay quy tắc giải nghĩa cân lượng'));

  // 3. Lưu Niên (LN.Mệnh at Mùi) & Lưu Đại Hạn (Lưu Đại Hạn tại Tý) are 100% synchronized in Engine v12
  assert.ok(prompt.includes('Lưu Đại Hạn tại Tý'));
  assert.ok(prompt.includes('Cung Lưu Đại Hạn của năm xem'));
  assert.ok(prompt.includes('LN.Mệnh tại Mùi'));

  // 4. Patterns include target palace and breaking conditions (Thiên Tướng lạc hãm + Địa Kiếp)
  assert.ok(prompt.includes('[Tại cung: Tài Bạch, Mệnh]'));
  assert.ok(prompt.includes('Thiên Tướng lạc hãm tại Mão'));
  assert.ok(prompt.includes('Cung Mệnh gặp Địa Không / Địa Kiếp'));
});


