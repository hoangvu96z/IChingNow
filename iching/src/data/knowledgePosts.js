/**
 * 60 thẻ kiến thức Lục Hào — "Dịch Học mỗi ngày"
 * Mỗi thẻ: { id, type, title, body, tag, hexId?, quizOptions?, quizAnswer? }
 * type: 'concept' | 'tip' | 'quiz' | 'hexOfDay'
 */

export const KNOWLEDGE_POSTS = [
  // ── CONCEPT (20 thẻ) ─────────────────────────────────────────────
  {
    id: 'c01', type: 'concept', tag: 'Nền tảng',
    title: 'Ngũ Hành là gì?',
    body: 'Ngũ Hành gồm Kim · Mộc · Thủy · Hỏa · Thổ — năm dạng năng lượng vận hành tuần hoàn trong vũ trụ. Tương sinh: Mộc→Hỏa→Thổ→Kim→Thủy. Tương khắc: Mộc→Thổ→Thủy→Hỏa→Kim→Mộc.'
  },
  {
    id: 'c02', type: 'concept', tag: 'Nền tảng',
    title: 'Bát Quái — 8 quẻ đơn',
    body: 'Càn ☰ Đoài ☱ Ly ☲ Chấn ☳ Tốn ☴ Khảm ☵ Cấn ☶ Khôn ☷. 8 quái đơn, mỗi quái 3 hào. Chồng 2 quái đơn tạo thành một quẻ kép (64 quẻ).'
  },
  {
    id: 'c03', type: 'concept', tag: 'Lục Hào',
    title: 'Dụng Thần là gì?',
    body: 'Dụng Thần là hào đại diện cho sự việc bạn hỏi. Hỏi tài lộc → Thê Tài; sự nghiệp → Quan Quỷ; học hành → Phụ Mẫu; con cái → Tử Tôn; anh em → Huynh Đệ. Xác định đúng Dụng Thần là bước quan trọng nhất!'
  },
  {
    id: 'c04', type: 'concept', tag: 'Lục Hào',
    title: 'Thế hào & Ứng hào',
    body: 'Thế hào đại diện cho chính bạn (người hỏi). Ứng hào đại diện cho đối phương / sự việc bên ngoài. Mối quan hệ Thế-Ứng phản ánh tương tác giữa bạn và hoàn cảnh.'
  },
  {
    id: 'c05', type: 'concept', tag: 'Lục Hào',
    title: 'Lục Thân — 5 mối quan hệ',
    body: 'Mỗi hào mang một Lục Thân: Phụ Mẫu (sinh ta), Huynh Đệ (cùng hành), Tử Tôn (ta sinh), Thê Tài (ta khắc), Quan Quỷ (khắc ta). Lục Thân xác định vai trò của từng hào trong quẻ.'
  },
  {
    id: 'c06', type: 'concept', tag: 'Lục Hào',
    title: 'Nguyệt kiến & Nhật thần',
    body: 'Nguyệt kiến (Chi tháng) cho biết xu thế chung, mạnh hay yếu suốt tháng. Nhật thần (Chi ngày) cho biết tình hình ngay lúc xem quẻ. Hai yếu tố này quyết định Vượng/Suy của các hào.'
  },
  {
    id: 'c07', type: 'concept', tag: 'Lục Hào',
    title: 'Vượng · Tướng · Hưu · Tù · Tử',
    body: '5 trạng thái sức mạnh của hào: Vượng (cực mạnh) → Tướng (mạnh) → Hưu (nghỉ) → Tù (yếu) → Tử (cực yếu). Ngũ Hành nào được Nguyệt kiến sinh thì Vượng, cùng hành thì Tướng, sinh Nguyệt kiến thì Hưu...'
  },
  {
    id: 'c08', type: 'concept', tag: 'Lục Hào',
    title: 'Hào Động & Hào Tĩnh',
    body: 'Hào Động (biến hào) có sức ảnh hưởng mạnh, có thể sinh/khắc các hào khác. Hào Tĩnh chỉ chịu ảnh hưởng, không chủ động tác động. "Động tất hữu biến" — động thì phải biến.'
  },
  {
    id: 'c09', type: 'concept', tag: 'Lục Hào',
    title: 'Nạp Giáp — Can Chi của mỗi hào',
    body: 'Mỗi hào được gán một cặp Thiên Can + Địa Chi theo quy tắc cố định. Can Chi của hào quyết định Ngũ Hành của hào, từ đó xác định Lục Thân. Ví dụ: Càn nạp Giáp, quái dưới Càn hào 1 = Giáp Tý (Thủy).'
  },
  {
    id: 'c10', type: 'concept', tag: 'Lục Hào',
    title: 'Lục Thú — 6 thú linh',
    body: 'Thanh Long (may mắn), Chu Tước (khẩu thiệt), Câu Trần (chậm trễ), Đằng Xà (lo âu), Bạch Hổ (hung hiểm), Huyền Vũ (mập mờ). Lục Thú bổ sung ý nghĩa cho mỗi hào.'
  },
  {
    id: 'c11', type: 'concept', tag: 'Lục Hào',
    title: 'Tuần Không là gì?',
    body: 'Trong 10 ngày (một Tuần), 2 Chi "không" được sử dụng → gọi là Tuần Không (Không Vong). Hào Tuần Không nghĩa là "chưa hiện, chưa rõ" — có thể sẽ ứng khi xuất Không.'
  },
  {
    id: 'c12', type: 'concept', tag: 'Lục Hào',
    title: 'Phục Thần',
    body: 'Khi Dụng Thần không có mặt trên quẻ → phải tìm Phục Thần ẩn bên dưới. Phục Thần yếu hơn hào trên mặt quẻ, cần được sinh hay trợ giúp mới phát huy tác dụng.'
  },
  {
    id: 'c13', type: 'concept', tag: 'Lục Hào',
    title: 'Nguyệt Phá',
    body: 'Hào bị Nguyệt kiến xung (Chi xung nhau) gọi là Nguyệt Phá — vô lực, sự việc tan vỡ. Ví dụ: Nguyệt kiến Tý xung Ngọ → hào Ngọ bị Nguyệt Phá.'
  },
  {
    id: 'c14', type: 'concept', tag: 'Lục Hào',
    title: 'Nhật Xung — Ám Động & Xung Tán',
    body: 'Nhật thần xung hào Tĩnh → Ám Động (kích hoạt âm thầm). Nhật thần xung hào Suy → Xung Tán (phá tan). Cùng là xung nhưng kết quả khác nhau tùy sức mạnh hào.'
  },
  {
    id: 'c15', type: 'concept', tag: 'Lục Hào',
    title: 'Hồi Đầu Sinh & Hồi Đầu Khắc',
    body: 'Khi hào Động biến, hào Biến quay lại sinh hào Động → Hồi Đầu Sinh (tốt). Hào Biến quay lại khắc hào Động → Hồi Đầu Khắc (xấu). Đây là yếu tố quan trọng khi hào Dụng Thần là hào Động.'
  },
  {
    id: 'c16', type: 'concept', tag: 'Lục Hào',
    title: 'Tiến Thần & Thoái Thần',
    body: 'Hào Động biến sang Chi tiến lên trong bộ Tam Hợp → Tiến Thần (sự việc tiến triển). Biến sang Chi lùi lại → Thoái Thần (sự việc suy thoái). Ví dụ: Dần → Mão là Tiến, Mão → Dần là Thoái.'
  },
  {
    id: 'c17', type: 'concept', tag: 'Lục Hào',
    title: 'Tam Hợp Cục',
    body: 'Ba Chi hợp thành một Ngũ Hành: Thân-Tý-Thìn (Thủy), Hợi-Mão-Mùi (Mộc), Dần-Ngọ-Tuất (Hỏa), Tỵ-Dậu-Sửu (Kim). Tam Hợp tăng lực đáng kể cho hào.'
  },
  {
    id: 'c18', type: 'concept', tag: 'Nền tảng',
    title: 'Lục Xung — 6 cặp xung',
    body: 'Tý↔Ngọ, Sửu↔Mùi, Dần↔Thân, Mão↔Dậu, Thìn↔Tuất, Tỵ↔Hợi. Xung = đối kháng, mâu thuẫn, tan rã. Nắm 6 cặp xung là nền tảng xem Nguyệt Phá, Nhật Xung.'
  },
  {
    id: 'c19', type: 'concept', tag: 'Nền tảng',
    title: 'Lục Hợp — 6 cặp hợp',
    body: 'Tý-Sửu (Thổ), Dần-Hợi (Mộc), Mão-Tuất (Hỏa), Thìn-Dậu (Kim), Tỵ-Thân (Thủy), Ngọ-Mùi (Hỏa). Hợp = gắn kết, ràng buộc, hào bị hợp có thể "bị khoá".'
  },
  {
    id: 'c20', type: 'concept', tag: 'Lục Hào',
    title: 'Quẻ Chủ & Quẻ Biến',
    body: 'Quẻ Chủ (Bản Quẻ) phản ánh tình hình hiện tại. Quẻ Biến (nếu có hào Động) cho thấy xu hướng tương lai. Đọc Quẻ Chủ trước, rồi xem Quẻ Biến để hiểu diễn tiến.'
  },

  // ── TIP (20 thẻ) ──────────────────────────────────────────────────
  {
    id: 't01', type: 'tip', tag: 'Mẹo xem',
    title: 'Tâm tĩnh trước khi gieo',
    body: '🧘 Trước khi gieo quẻ, hãy ngồi yên 1-2 phút, tập trung vào câu hỏi. Tâm không tĩnh, quẻ sẽ "nhiễu". Đây là nguyên tắc cốt lõi mà mọi thầy đều nhấn mạnh.'
  },
  {
    id: 't02', type: 'tip', tag: 'Mẹo xem',
    title: 'Hỏi một câu — chỉ một',
    body: '🎯 Mỗi lần gieo chỉ hỏi MỘT câu duy nhất. Câu hỏi rõ ràng → quẻ rõ ràng. Đừng hỏi "thi có đậu không và tình duyên thế nào" trong cùng một lần.'
  },
  {
    id: 't03', type: 'tip', tag: 'Mẹo xem',
    title: 'Xác định Dụng Thần trước',
    body: '📌 Sau khi gieo xong, việc đầu tiên là xác định Dụng Thần (hào đại diện cho việc bạn hỏi). Không tìm được Dụng Thần → không thể phân tích đúng.'
  },
  {
    id: 't04', type: 'tip', tag: 'Mẹo xem',
    title: 'Nguyệt kiến mạnh hơn Nhật thần',
    body: '📊 Nguyệt kiến ảnh hưởng cả tháng, Nhật thần chỉ ảnh hưởng trong ngày. Khi đánh giá Vượng/Suy, Nguyệt kiến được ưu tiên hơn. Tuy nhiên, Nhật xung vẫn rất mạnh.'
  },
  {
    id: 't05', type: 'tip', tag: 'Mẹo xem',
    title: 'Hào Động ưu tiên hơn Hào Tĩnh',
    body: '⚡ Hào Động có năng lượng mạnh, ảnh hưởng các hào khác. Nếu Dụng Thần là hào Tĩnh, tìm xem có hào Động nào sinh/khắc nó không — đó là manh mối quan trọng.'
  },
  {
    id: 't06', type: 'tip', tag: 'Mẹo xem',
    title: 'Tuần Không ≠ xấu',
    body: '🔮 Nhiều người mới hay sợ Tuần Không, nhưng không phải lúc nào cũng xấu. Tuần Không chỉ là "chưa hiện" — khi xuất Không (qua ngày), sự việc sẽ rõ. Đôi khi Tuần Không còn bảo vệ hào khỏi bị khắc!'
  },
  {
    id: 't07', type: 'tip', tag: 'Mẹo xem',
    title: 'Thế Ứng sinh hợp = thuận lợi',
    body: '🤝 Thế hào và Ứng hào sinh nhau hoặc hợp nhau → hai bên hòa thuận, sự việc thuận lợi. Thế khắc Ứng → bạn chiếm ưu thế. Ứng khắc Thế → đối phương gây khó.'
  },
  {
    id: 't08', type: 'tip', tag: 'Mẹo xem',
    title: 'Đừng gieo lại nếu không thích',
    body: '🚫 Quẻ đầu tiên là chính xác nhất. Gieo lại vì "không thích kết quả" sẽ cho quẻ sai. Nếu muốn gieo lại, đợi ít nhất 1 ngày và tĩnh tâm trở lại.'
  },
  {
    id: 't09', type: 'tip', tag: 'Mẹo xem',
    title: 'Xem thêm Lục Thú',
    body: '🐉 Lục Thú không quyết định cát hung, nhưng bổ sung sắc thái: Thanh Long = vui, Chu Tước = tranh cãi, Câu Trần = chậm, Đằng Xà = lo, Bạch Hổ = hung, Huyền Vũ = gian.'
  },
  {
    id: 't10', type: 'tip', tag: 'Mẹo xem',
    title: 'Phân biệt "Sinh" và "Phù"',
    body: '🌱 Nguyệt kiến/Nhật thần cùng hành với hào → Phù (nâng đỡ, hỗ trợ). Nguyệt kiến/Nhật thần sinh hào → Sinh (tạo ra sức mạnh). Sinh mạnh hơn Phù.'
  },
  {
    id: 't11', type: 'tip', tag: 'Mẹo xem',
    title: 'Hào 1-3 là "trong", 4-6 là "ngoài"',
    body: '🏠 Quái dưới (hào 1-3) đại diện cho bên trong, bản thân. Quái trên (hào 4-6) đại diện cho bên ngoài, xã hội. Hào 2 = nhà, hào 5 = quân vương / cấp trên.'
  },
  {
    id: 't12', type: 'tip', tag: 'Mẹo xem',
    title: 'Xung không luôn xấu',
    body: '💥 Xung có thể là "phá vỡ bế tắc". Ví dụ: hào bị hợp mà bị xung → giải phóng khỏi ràng buộc, sự việc được khai thông. Ngữ cảnh rất quan trọng!'
  },
  {
    id: 't13', type: 'tip', tag: 'Mẹo xem',
    title: 'Quẻ nhiều hào Động = biến động',
    body: '🌪️ Quẻ có 3+ hào Động cho thấy tình hình rối ren, nhiều biến động. Khi đó cần dựa vào Thế hào và Dụng Thần làm trọng tâm, không phân tích tất cả hào Động.'
  },
  {
    id: 't14', type: 'tip', tag: 'Mẹo xem',
    title: 'Hóa Tuyệt ≠ hết hy vọng',
    body: '☠️ Hào Động hóa Tuyệt nghĩa là sức mạnh giảm, nhưng nếu được Nguyệt kiến hoặc Nhật thần sinh phù thì vẫn ổn. Đừng vội kết luận "hết cứu" — phải xem toàn cục.'
  },
  {
    id: 't15', type: 'tip', tag: 'Mẹo xem',
    title: 'Ghi lại quẻ & ứng nghiệm',
    body: '📓 Ghi lại ngày gieo, câu hỏi, quẻ và kết quả thực tế. Đối chiếu lại sau 1-3 tháng sẽ giúp bạn hiểu cách quẻ "nói" — đây là cách học nhanh nhất!'
  },
  {
    id: 't16', type: 'tip', tag: 'Mẹo xem',
    title: 'Kiên nhẫn với "Hưu Tù"',
    body: '⏳ Dụng Thần Hưu/Tù không có nghĩa là "tuyệt vọng". Nó chỉ yếu ở thời điểm hiện tại. Khi đến tháng/ngày được Sinh hoặc Vượng, sự việc sẽ khá lên.'
  },
  {
    id: 't17', type: 'tip', tag: 'Mẹo xem',
    title: 'Hào 5 = vị trí "Quân"',
    body: '👑 Hào 5 là vị trí tôn quý nhất. Hỏi về sếp, cơ quan, nhà nước → xem hào 5. Hào 5 Vượng và sinh Thế → được trên ủng hộ.'
  },
  {
    id: 't18', type: 'tip', tag: 'Mẹo xem',
    title: 'Tam Hợp tạo Cục = cực mạnh',
    body: '🔺 Nếu 3 hào Tam Hợp đều Động → tạo thành Tam Hợp Cục, lực rất mạnh. Nếu thiếu 1 hào → chưa thành Cục, chỉ có ý nghĩa Hợp nhẹ.'
  },
  {
    id: 't19', type: 'tip', tag: 'Mẹo xem',
    title: 'Ứng kỳ — khi nào ứng nghiệm?',
    body: '📅 Quẻ Cát thường ứng vào ngày Sinh (ngày mà Chi sinh Dụng Thần). Quẻ Hung ứng vào ngày Xung hoặc ngày Khắc. Tuần Không ứng khi xuất Không. Đây là "timing" của quẻ.'
  },
  {
    id: 't20', type: 'tip', tag: 'Mẹo xem',
    title: 'Học từ quẻ sai',
    body: '❌ Không ai xem đúng 100%. Khi quẻ "sai" → quay lại phân tích: có bỏ sót yếu tố nào không? Nguyệt Phá? Tuần Không? Hồi Đầu Khắc? Đây là bài học quý giá nhất.'
  },

  // ── QUIZ (10 thẻ) ──────────────────────────────────────────────────
  {
    id: 'q01', type: 'quiz', tag: 'Mini Quiz',
    title: 'Hỏi tài lộc → Dụng Thần là?',
    body: 'Khi hỏi về tiền bạc, thu nhập, tài lộc, Dụng Thần sẽ là Lục Thân nào?',
    quizOptions: ['Quan Quỷ', 'Thê Tài', 'Phụ Mẫu', 'Tử Tôn'],
    quizAnswer: 1,
    quizExplain: 'Thê Tài = hào bị "ta" (quẻ Chủ) khắc. Ta khắc → ta được → Tài lộc.'
  },
  {
    id: 'q02', type: 'quiz', tag: 'Mini Quiz',
    title: 'Kim sinh hành nào?',
    body: 'Trong vòng tương sinh Ngũ Hành, Kim sinh ra hành nào?',
    quizOptions: ['Mộc', 'Thủy', 'Hỏa', 'Thổ'],
    quizAnswer: 1,
    quizExplain: 'Kim sinh Thủy (kim loại tan chảy thành nước). Vòng sinh: Mộc→Hỏa→Thổ→Kim→Thủy→Mộc.'
  },
  {
    id: 'q03', type: 'quiz', tag: 'Mini Quiz',
    title: 'Tý xung Chi nào?',
    body: 'Trong Lục Xung, Địa Chi Tý (🐀) xung với Chi nào?',
    quizOptions: ['Mão', 'Ngọ', 'Dậu', 'Sửu'],
    quizAnswer: 1,
    quizExplain: 'Tý ↔ Ngọ. 6 cặp xung: Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi.'
  },
  {
    id: 'q04', type: 'quiz', tag: 'Mini Quiz',
    title: 'Hào Thế đại diện cho ai?',
    body: 'Trong quẻ Lục Hào, hào Thế đại diện cho:',
    quizOptions: ['Đối phương', 'Chính bạn (người hỏi)', 'Trời đất', 'Tổ tiên'],
    quizAnswer: 1,
    quizExplain: 'Thế hào = chính mình. Ứng hào = đối phương, sự việc bên ngoài.'
  },
  {
    id: 'q05', type: 'quiz', tag: 'Mini Quiz',
    title: 'Nguyệt Phá nghĩa là gì?',
    body: 'Hào bị Nguyệt Phá có nghĩa là:',
    quizOptions: ['Hào rất mạnh', 'Hào bị xung bởi Nguyệt kiến → vô lực', 'Hào được Tháng sinh', 'Hào hóa Tiến Thần'],
    quizAnswer: 1,
    quizExplain: 'Nguyệt Phá = hào bị Chi tháng xung → mất sức, sự việc tan rã.'
  },
  {
    id: 'q06', type: 'quiz', tag: 'Mini Quiz',
    title: 'Thanh Long thuộc Lục Thú nào?',
    body: 'Thanh Long (🐉) mang ý nghĩa gì trong Lục Thú?',
    quizOptions: ['Hung hiểm, tang tóc', 'Vui mừng, may mắn', 'Lo âu, quái dị', 'Tranh cãi, kiện tụng'],
    quizAnswer: 1,
    quizExplain: 'Thanh Long = vui mừng, tốt lành. Bạch Hổ = hung. Chu Tước = khẩu thiệt. Đằng Xà = lo.'
  },
  {
    id: 'q07', type: 'quiz', tag: 'Mini Quiz',
    title: 'Hào Động hóa Hồi Đầu Khắc?',
    body: 'Hào Động biến mà hào Biến khắc lại hào Động, gọi là gì?',
    quizOptions: ['Hồi Đầu Sinh', 'Tiến Thần', 'Hồi Đầu Khắc', 'Thoái Thần'],
    quizAnswer: 2,
    quizExplain: 'Hồi Đầu Khắc: hào biến quay lại khắc hào gốc → bất lợi, sự việc bị cản trở.'
  },
  {
    id: 'q08', type: 'quiz', tag: 'Mini Quiz',
    title: 'Hỏi sự nghiệp → Dụng Thần?',
    body: 'Khi hỏi về công việc, thăng tiến, sự nghiệp, Dụng Thần là Lục Thân nào?',
    quizOptions: ['Phụ Mẫu', 'Thê Tài', 'Quan Quỷ', 'Huynh Đệ'],
    quizAnswer: 2,
    quizExplain: 'Quan Quỷ = khắc ta. Quan = quan chức, công việc, sự nghiệp, cấp trên.'
  },
  {
    id: 'q09', type: 'quiz', tag: 'Mini Quiz',
    title: 'Thân-Tý-Thìn hợp thành?',
    body: 'Tam Hợp Cục: Thân - Tý - Thìn hợp thành Ngũ Hành gì?',
    quizOptions: ['Kim Cục', 'Thủy Cục', 'Mộc Cục', 'Hỏa Cục'],
    quizAnswer: 1,
    quizExplain: 'Thân-Tý-Thìn = Thủy Cục. Hợi-Mão-Mùi = Mộc. Dần-Ngọ-Tuất = Hỏa. Tỵ-Dậu-Sửu = Kim.'
  },
  {
    id: 'q10', type: 'quiz', tag: 'Mini Quiz',
    title: 'Tuần Không xảy ra khi?',
    body: 'Hào bị Tuần Không khi nào?',
    quizOptions: ['Hào bị Nguyệt kiến khắc', 'Địa Chi hào nằm trong 2 Chi trống của Tuần', 'Hào bị Nhật thần xung', 'Hào Động hóa Tuyệt'],
    quizAnswer: 1,
    quizExplain: 'Trong 10 ngày (1 Tuần), có 10 Can và 12 Chi → 2 Chi "trống" = Tuần Không. Hào có Chi trùng thì bị Không Vong.'
  },

  // ── HEX OF DAY (10 thẻ) ───────────────────────────────────────────
  {
    id: 'h01', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 1,
    title: 'Quẻ Thuần Càn ☰☰',
    body: '乾 Càn — Trời. 6 hào dương, sức mạnh thuần khiết. "Thiên hành kiện, quân tử dĩ tự cường bất tức" — Trời vận hành mạnh mẽ, người quân tử không ngừng tự rèn luyện.'
  },
  {
    id: 'h02', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 2,
    title: 'Quẻ Thuần Khôn ☷☷',
    body: '坤 Khôn — Đất. 6 hào âm, sức chứa đựng bao la. "Địa thế Khôn, quân tử dĩ hậu đức tải vật" — Đất rộng lớn, người quân tử lấy đức dày nâng đỡ muôn vật.'
  },
  {
    id: 'h03', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 3,
    title: 'Quẻ Thủy Lôi Truân ☵☳',
    body: '屯 Truân — Khó khăn ban đầu. Mây sấm gặp nhau, mọi thứ đang hình thành. Kiên nhẫn gieo mầm, đừng vội hành động lớn. Thuận theo tự nhiên, sẽ hanh thông.'
  },
  {
    id: 'h04', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 4,
    title: 'Quẻ Sơn Thủy Mông ☶☵',
    body: '蒙 Mông — Mông muội, học hỏi. Núi dưới có suối, nước chảy mà chưa biết đường. Hãy khiêm tốn cầu học, như học trò tìm thầy.'
  },
  {
    id: 'h05', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 11,
    title: 'Quẻ Địa Thiên Thái ☷☰',
    body: '泰 Thái — Hanh thông. Trời dưới đất trên, âm dương giao hòa. Vạn vật tốt tươi, sự việc thuận buồm xuôi gió. Đây là một trong những quẻ tốt nhất.'
  },
  {
    id: 'h06', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 12,
    title: 'Quẻ Thiên Địa Bĩ ☰☷',
    body: '否 Bĩ — Bế tắc. Trời trên đất dưới, âm dương cách biệt. Tiểu nhân đắc thời, quân tử thu mình chờ đợi. "Bĩ cực thái lai" — khó qua rồi sẽ tốt.'
  },
  {
    id: 'h07', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 63,
    title: 'Quẻ Thủy Hỏa Ký Tế ☵☲',
    body: '既濟 Ký Tế — Đã thành. Mọi hào đều đúng vị → sự việc hoàn thành. Nhưng cẩn thận: đỉnh cao rồi thì dễ xuống. "Cuối cùng rối loạn" — hãy biết giữ gìn.'
  },
  {
    id: 'h08', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 64,
    title: 'Quẻ Hỏa Thủy Vị Tế ☲☵',
    body: '未濟 Vị Tế — Chưa thành. Quẻ cuối cùng trong 64 quẻ nhưng không phải kết thúc — mà là khởi đầu mới. Mọi thứ đang vận động, hãy kiên trì và cẩn trọng.'
  },
  {
    id: 'h09', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 29,
    title: 'Quẻ Thuần Khảm ☵☵',
    body: '坎 Khảm — Nước, hiểm trở. Nước chảy vào hố sâu, không ngại khó mà tiến. Gặp nguy hiểm hãy bình tĩnh, giữ lòng tin — nước rồi sẽ tìm được đường.'
  },
  {
    id: 'h10', type: 'hexOfDay', tag: 'Quẻ của ngày', hexId: 30,
    title: 'Quẻ Thuần Ly ☲☲',
    body: '離 Ly — Lửa, sáng tỏ. Ánh sáng bám vào vật mà chiếu rọi. Trí tuệ soi sáng u tối. Hãy nương theo điều chính đáng, lấy đức hạnh làm nền tảng.'
  },
];

/**
 * Lấy thẻ kiến thức theo ngày (seed từ ngày, luân phiên qua 60 thẻ).
 */
export function postOfTheDay(dateStr) {
  // Simple hash
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = ((h << 5) - h + dateStr.charCodeAt(i)) | 0;
  }
  const idx = ((h % KNOWLEDGE_POSTS.length) + KNOWLEDGE_POSTS.length) % KNOWLEDGE_POSTS.length;
  return KNOWLEDGE_POSTS[idx];
}
