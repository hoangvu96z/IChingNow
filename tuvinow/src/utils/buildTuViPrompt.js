const HOURS = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const TOPICS = { overview: 'Tổng quan', career: 'Công việc & tài chính', love: 'Tình cảm & gia đình', custom: 'Câu hỏi riêng' };

export function buildTuViText(result, input) {
  const lines = [
    'LÁ SỐ TỬ VI ĐẨU SỐ',
    `Họ tên: ${input.name || 'Ẩn danh'}`,
    `Ngày sinh dương lịch: ${input.isLunar ? 'Không cung cấp (nhập âm lịch)' : input.solarDateStr}`,
    `Ngày sinh âm lịch: ${input.lunarDay}/${input.lunarMonth}/${input.lunarYear}${input.isLeap ? ' (tháng nhuận)' : ''}`,
    `Giờ sinh: ${HOURS[input.lunarHourIndex]}`,
    `Âm dương / giới tính: ${result.amDuongNamNu}; ${result.isThuan ? 'Thuận' : 'Nghịch'} hành`,
    `Can chi năm: ${result.canChiNam}; Bản mệnh: ${result.banMenhNapAm}; Cục: ${result.cucName}`,
    `Mệnh tại ${result.menhCung}; Thân tại ${result.thanCung}; Chủ Mệnh: ${result.chuMenh}; Chủ Thân: ${result.chuThan}`,
    `Tuần: ${result.tuanCung.join(', ')}; Triệt: ${result.trietCung.join(', ')}`,
    ...(result.viewYearCanChi ? [`Lưu niên: ${result.viewYear || ''} ${result.viewYearCanChi}. Ký hiệu L. là sao lưu niên; chỉ có L.Lộc Tồn, L.Kình Dương, L.Đà La, L.Thái Tuế, L.Thiên Mã.`] : []),
    'Ký hiệu sao: M = Miếu, V = Vượng, Đ = Đắc, B = Bình, H = Hãm.',
    '\nCHI TIẾT 12 CUNG:',
  ];
  for (const palace of result.palates) {
    lines.push(`\n${palace.chucNang} — ${palace.canName} ${palace.chiName}${palace.isMenh ? ' [Mệnh]' : ''}${palace.isThan ? ' [Thân]' : ''}`,
      `Chính tinh: ${palace.chinhTinh.join(', ') || 'Vô chính diệu'}`,
      `Phụ tinh: ${palace.phuTinh.join(', ') || 'Không có'}`,
      `Tràng Sinh: ${palace.trangSinh}; Đại hạn: ${palace.daiHan}–${palace.daiHan + 9} tuổi`,
      `Tuần: ${palace.isTuan ? 'Có' : 'Không'}; Triệt: ${palace.isTriet ? 'Có' : 'Không'}`);
  }
  return lines.join('\n');
}

export function buildTuViPrompt(result, input, topic = 'overview', question = '', structured = false) {
  return `Bạn là người luận giải Tử Vi Đẩu Số. Hãy phân tích lá số bên dưới bằng tiếng Việt.\nChủ đề: ${TOPICS[topic] || TOPICS.overview}\nCâu hỏi: ${question.trim() || 'Luận giải tổng quan lá số và đưa ra lời khuyên thực tế.'}\n\n${buildTuViText(result, input)}\n\nYÊU CẦU:\n- Dùng đúng dữ liệu lá số, không tự an lại sao hoặc thêm sao không có.\n- Phân tích Mệnh–Thân, các cung liên quan và mối liên hệ giữa các cung; dẫn rõ dữ kiện làm căn cứ.\n- Chỉ luận đại hạn ở mức dữ liệu đã có. ${result.viewYearCanChi ? 'Chỉ có 5 sao lưu niên được liệt kê của năm đã chọn; chưa có tiểu hạn hay hệ thống hạn đầy đủ, không suy diễn thêm.' : 'Chưa có tiểu hạn/lưu niên nên không dự đoán chi tiết theo năm.'}\n- Nội dung cần có: Tổng quan, Phân tích chủ đề/câu hỏi, Điểm thuận lợi và thách thức, 3 lời khuyên thực tế. Không khẳng định số phận chắc chắn.\n${structured ? '- Đưa các mục luận giải vào sections theo định dạng JSON được yêu cầu bên dưới.' : '- Kết thúc bằng dòng ---SUGGESTED_QUESTIONS--- và 3 câu hỏi đào sâu, mỗi câu một dòng.'}`;
}

export function splitSuggestions(content) {
  const [answer, tail = ''] = content.split('---SUGGESTED_QUESTIONS---');
  return { answer: answer.trim(), suggestions: tail.split('\n').map(s => s.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').trim()).filter(Boolean).slice(0, 3) };
}
