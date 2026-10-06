/**
 * Từ điển thuật ngữ Lục Hào cho tap-to-learn.
 * Mỗi mục: { title, short, detail, tip }
 */
export const GLOSSARY = {
  'the': {
    title: 'Hào Thế',
    short: 'Đại diện cho chính bạn (người hỏi).',
    detail: 'Hào Thế là vị trí của bản thân trong quẻ. Xem Thế vượng hay suy, bị sinh hay bị khắc để biết hoàn cảnh của mình.',
    tip: 'Thế được Nhật/Nguyệt sinh hay vượng thì bản thân có thế chủ động.',
  },
  'ung': {
    title: 'Hào Ứng',
    short: 'Đại diện đối phương hoặc đối tượng sự việc.',
    detail: 'Hào Ứng luôn cách Thế hai hào (Thế 1 → Ứng 4, Thế 2 → Ứng 5, Thế 3 → Ứng 6...). Thế sinh/khắc Ứng cho biết ai chủ động.',
    tip: 'Ứng sinh hoặc hợp Thế: đối phương có thiện chí.',
  },
  'Phụ Mẫu': {
    title: 'Phụ Mẫu',
    short: 'Cha mẹ, giấy tờ, nhà cửa, văn bản, học hành.',
    detail: 'Hào sinh ra Cung. Là Dụng Thần khi hỏi thi cử, hợp đồng, nhà xe, giấy tờ. Phụ Mẫu khắc Tử Tôn nên không tốt cho con cái.',
    tip: 'Hỏi thi cử: Phụ Mẫu vượng và không bị Tài khắc là tốt.',
  },
  'Tử Tôn': {
    title: 'Tử Tôn',
    short: 'Con cái, phúc đức, giải trí, thuốc chữa bệnh.',
    detail: 'Cung sinh hào này. Là Dụng Thần khi hỏi con cái. Tử Tôn khắc Quan Quỷ nên giải được tai họa, chữa được bệnh, nhưng bất lợi cho công danh.',
    tip: 'Hỏi bệnh: Tử Tôn vượng thường là có thuốc chữa.',
  },
  'Quan Quỷ': {
    title: 'Quan Quỷ',
    short: 'Công danh, chồng, quan chức, tai họa, bệnh.',
    detail: 'Hào khắc Cung. Với nam là công việc, quyền lực, rủi ro; với nữ là chồng/người yêu. Hỏi bệnh thì Quỷ là bệnh tật.',
    tip: 'Hỏi công việc: Quan Quỷ vượng, được sinh là tốt.',
  },
  'Thê Tài': {
    title: 'Thê Tài',
    short: 'Tiền bạc, vợ (nam hỏi), tài sản, hàng hóa.',
    detail: 'Cung khắc hào này. Là Dụng Thần khi hỏi tài lộc, kinh doanh, hoặc tình duyên của nam giới.',
    tip: 'Thê Tài gặp Huynh Đệ động thì dễ hao tài.',
  },
  'Huynh Đệ': {
    title: 'Huynh Đệ',
    short: 'Anh em, bạn bè, đồng nghiệp, cạnh tranh, hao tài.',
    detail: 'Hào cùng hành với Cung. Khắc Thê Tài nên thường bị coi là tranh giành, tốn kém.',
    tip: 'Huynh Đệ vượng, động: cẩn thận hao tiền, tranh chấp.',
  },
  'khongVong': {
    title: 'Tuần Không (Không Vong)',
    short: 'Hào bị "rỗng", tạm thời mất lực.',
    detail: 'Mỗi ngày Can Chi có hai Địa Chi bị Tuần Không. Hào Dụng Thần gặp Không thì việc chưa thành hoặc hư danh. Hào động hay vượng khi gặp Không vẫn có thể thực lực.',
    tip: 'Không gặp xung, gặp thực (hết tuần) thì thành thực.',
  },
  'phucThan': {
    title: 'Phục Thần',
    short: 'Lục Thân ẩn bên dưới, vì quẻ thiếu thần đó.',
    detail: 'Khi quẻ không có Dụng Thần, tìm trong quẻ Bát Thuần của Cung. Phục Thần được Phi Thần (hào bên trên) sinh hoặc vượng thì có thể dùng được.',
    tip: 'Phục Thần bị Phi Thần khắc là khó thành.',
  },
  'moving': {
    title: 'Hào động',
    short: 'Hào đang biến, cho thấy việc đang chuyển động.',
    detail: 'Hào động làm quẻ biến sang quẻ khác. Xem hào động sinh/khắc Dụng Thần, và hào động biến thành hào gì (Hồi Đầu Sinh/Khắc, Hóa Tiến/Thoái).',
    tip: 'Quẻ không có hào động thì chủ yếu xem Nhật/Nguyệt tác động lên Dụng Thần.',
  },
  'nguyetKien': {
    title: 'Nguyệt kiến',
    short: 'Địa Chi của tháng, quyết định mạnh yếu của các hào.',
    detail: 'Nguyệt kiến có quyền lực lớn nhất. Hào trùng Chi tháng hoặc được tháng sinh là vượng; bị tháng khắc là suy; bị tháng xung gọi là Nguyệt Phá.',
    tip: 'Nguyệt Phá thường rất yếu, trừ khi hào động hoặc gặp Nhật sinh.',
  },
  'nhatThan': {
    title: 'Nhật thần',
    short: 'Địa Chi của ngày hỏi, tác động trực tiếp lên các hào.',
    detail: 'Nhật thần sinh, khắc, xung hoặc hợp các hào. Hào tĩnh bị Nhật xung gọi là Ám Động, hào động bị Nhật xung là Nhật Phá.',
    tip: 'Nhật thần là "chủ" quyết định trong ngày xem quẻ.',
  },
  'hoiDauSinh': {
    title: 'Hồi Đầu Sinh',
    short: 'Hào động biến ra hào sinh lại chính nó: rất tốt.',
    detail: 'Hào động biến thành hào có Ngũ Hành sinh cho hào gốc. Dụng Thần Hồi Đầu Sinh thì mạnh thêm.',
    tip: 'Hồi Đầu Sinh trên Dụng Thần là điềm cát.',
  },
  'hoiDauKhac': {
    title: 'Hồi Đầu Khắc',
    short: 'Hào động biến ra hào khắc lại chính nó: xấu.',
    detail: 'Hào động biến thành hào có Ngũ Hành khắc hào gốc. Dụng Thần gặp thì bị phá.',
    tip: 'Hồi Đầu Khắc trên Dụng Thần thường báo việc khó thành.',
  },
  'hoaTien': {
    title: 'Hóa Tiến Thần',
    short: 'Hào động biến sang chi cùng hành đi lên: sức mạnh tăng.',
    detail: 'Các cặp Hợi→Tý, Dần→Mão, Tỵ→Ngọ, Thân→Dậu, Sửu→Thìn, Thìn→Mùi, Mùi→Tuất, Tuất→Sửu.',
    tip: 'Hóa Tiến Thần: việc đang tiến triển.',
  },
  'hoaThoai': {
    title: 'Hóa Thoái Thần',
    short: 'Hào động biến sang chi cùng hành đi lùi: sức yếu dần.',
    detail: 'Ngược lại với Hóa Tiến: Tý→Hợi, Mão→Dần, Ngọ→Tỵ, Dậu→Thân, Thìn→Sửu, Mùi→Thìn, Tuất→Mùi, Sửu→Tuất.',
    tip: 'Hóa Thoái Thần: việc dần lụi, nên dừng.',
  },
  'Thanh Long': { title: 'Thanh Long', short: 'Vui mừng, may mắn, quý nhân.', detail: 'Lục Thú Mộc. Gặp Dụng Thần là cát lợi.', tip: 'Thanh Long ở hào Tài là tin vui về tiền.' },
  'Chu Tước': { title: 'Chu Tước', short: 'Lời nói, văn thư, tranh cãi.', detail: 'Lục Thú Hỏa. Chủ chuyện miệng lưỡi, tin tức, kiện tụng.', tip: 'Chu Tước động: có tin tức hoặc tranh cãi.' },
  'Câu Trận': { title: 'Câu Trận', short: 'Chậm trễ, vướng mắc, đất đai.', detail: 'Lục Thú Thổ. Chủ sự trì trệ, ràng buộc.', tip: 'Câu Trận ở Dụng Thần: việc chậm.' },
  'Đằng Xà': { title: 'Đằng Xà', short: 'Lo lắng, mơ mộng, lừa dối.', detail: 'Lục Thú Thổ. Chủ nỗi lo, ảo tưởng, việc rối rắm.', tip: 'Đằng Xà động: coi chừng thông tin không thật.' },
  'Bạch Hổ': { title: 'Bạch Hổ', short: 'Tang tóc, bệnh, tranh chấp mạnh.', detail: 'Lục Thú Kim. Chủ tai nạn, phẫu thuật, máu me.', tip: 'Bạch Hổ cũng là uy quyền khi gặp quan chức.' },
  'Huyền Vũ': { title: 'Huyền Vũ', short: 'Mờ ám, trộm cắp, che giấu.', detail: 'Lục Thú Thủy. Chủ việc kín, bí mật, thất thoát.', tip: 'Huyền Vũ ở Tài: coi chừng thất thoát.' },

  // ── 8 BÁT QUÁI ĐƠN ─────────────────────────────────────────────
  'Càn': {
    title: 'Quái Càn ☰',
    short: 'Trời (Thiên), Dương Kim, Cương kiện, sáng tạo, dẫn dắt.',
    detail: 'Ba hào dương thuần khiết. Tượng trưng cho người cha, bậc lãnh đạo, trời xanh, năng lượng khởi nguyên mạnh mẽ, tính quyết đoán cao.',
    tip: 'Gặp Càn là lúc cần giữ vững chính đạo, kiên định nhưng tránh tự phụ độc đoán.',
  },
  'Khôn': {
    title: 'Quái Khôn ☷',
    short: 'Đất (Địa), Âm Thổ, Nhu thuận, bao dung, tích lũy.',
    detail: 'Ba hào âm thuần khiết. Tượng trưng cho người mẹ, đất đai, đức tính khiêm hạ, khả năng chịu đựng và nuôi dưỡng muôn loài.',
    tip: 'Gặp Khôn nên theo sau thay vì đi đầu, lấy nhu thắng cương, thuận theo hoàn cảnh.',
  },
  'Chấn': {
    title: 'Quái Chấn ☳',
    short: 'Sấm (Lôi), Dương Mộc, Khởi động, chấn động, bứt phá.',
    detail: 'Hào dương dưới 2 hào âm. Tượng trưng cho tiếng sấm đầu xuân, năng lượng thức tỉnh, người con trai trưởng, hành động dũng cảm.',
    tip: 'Chấn động gây sợ hãi ban đầu nhưng mở ra cơ hội đổi mới mạnh mẽ.',
  },
  'Tốn': {
    title: 'Quái Tốn ☴',
    short: 'Gió / Cây (Phong), Âm Mộc, Thẩm thấu, uyển chuyển, tiến vào.',
    detail: 'Hào âm dưới 2 hào dương. Tượng trưng cho ngọn gió thổi khắp nơi, rễ cây đâm sâu, người con gái cả, sự linh hoạt khéo léo.',
    tip: 'Như gió thổi qua kẽ lá, dùng sự kiên trì và mềm mỏng để đạt mục tiêu.',
  },
  'Khảm': {
    title: 'Quái Khảm ☵',
    short: 'Nước (Thủy), Dương Thủy, Hiểm trở, sâu sắc, thử thách.',
    detail: 'Hào dương kẹp giữa 2 hào âm. Tượng trưng cho dòng sông hiểm hóc, hố sâu thử thách, người con trai thứ, trí tuệ kiên định trong gian khó.',
    tip: 'Gặp hiểm không nản lòng, giữ đức tin vững vàng như nước chảy không ngừng.',
  },
  'Ly': {
    title: 'Quái Ly ☲',
    short: 'Lửa (Hỏa), Âm Hỏa, Sáng tỏ, văn minh, gắn kết, bám tựa.',
    detail: 'Hào âm kẹp giữa 2 hào dương. Tượng trưng cho ngọn lửa chiếu sáng, mặt trời, người con gái thứ, sự minh bạch và cái đẹp.',
    tip: 'Lửa cần có củi để cháy, muốn sáng suốt phải biết gắn kết và dựa vào điều đúng đắn.',
  },
  'Cấn': {
    title: 'Quái Cấn ☶',
    short: 'Núi (Sơn), Dương Thổ, Ngưng nghỉ, tĩnh lặng, vững vàng.',
    detail: 'Hào dương trên 2 hào âm. Tượng trưng cho ngọn núi sừng sững, sự dừng lại đúng lúc, người con trai út, nội tâm bất động trước cám dỗ.',
    tip: 'Dừng lại khi cần dừng, giữ tâm tĩnh lặng để nhìn thấu bản chất vấn đề.',
  },
  'Đoài': {
    title: 'Quái Đoài ☱',
    short: 'Đầm nước (Trạch), Âm Kim, Vui vẻ, hòa nhã, trao đổi ngôn từ.',
    detail: 'Hào âm trên 2 hào dương. Tượng trưng cho mặt đầm tươi mát, niềm vui giao tiếp, người con gái út, sự trao đổi cởi mở.',
    tip: 'Lấy sự chân thành làm gốc của niềm vui, tránh buôn chuyện khẩu thiệt vô ích.',
  },

  // ── KHÁI NIỆM KINH DỊCH CỐT LÕI ─────────────────────────────────
  'queChu': {
    title: 'Quẻ Chủ (Quẻ Gốc)',
    short: 'Quẻ ban đầu khi vừa gieo được, phản ánh thực trạng hiện tại.',
    detail: 'Quẻ Chủ là xuất phát điểm của sự việc, thể hiện hoàn cảnh, tâm thế của người hỏi và nguồn cơn của vấn đề đang xét.',
    tip: 'Xem kỹ quái trên và quái dưới của Quẻ Chủ để nắm bắt bức tranh toàn cảnh lúc này.',
  },
  'queBien': {
    title: 'Quẻ Biến (Quẻ Chiêm)',
    short: 'Quẻ sinh ra sau khi các hào động biến đổi, báo trước tương lai.',
    detail: 'Khi các hào lão dương (9) biến thành âm, hoặc lão âm (6) biến thành dương, quẻ sẽ biến đổi sang hình thái mới, chỉ rõ kết quả và lời khuyên kết cục.',
    tip: 'Nếu không có hào động, sự việc giữ nguyên tính chất của Quẻ Chủ.',
  },
  'thoanTu': {
    title: 'Thoán Từ (Lời Thoán)',
    short: 'Lời phán quyết tổng quan về toàn thể một quẻ do Chu Văn Vương đặt.',
    detail: 'Thoán Từ đúc kết đạo lý lớn nhất của quẻ, cho biết tình thế chung là Hanh (thông suốt), Cát (tốt), Hung (xấu), hay Lợi kiến đại nhân.',
    tip: 'Đọc Thoán Từ để định hướng chiến lược tổng thể trước khi soi chi tiết từng hào.',
  },
  'haoTu': {
    title: 'Hào Từ (Lời Hào)',
    short: 'Lời luận giải cho từng vị trí hào cụ thể do Chu Công đặt.',
    detail: 'Mỗi quẻ có 6 hào từ Hào Sơ đến Hào Thượng. Hào Từ chỉ ra từng bước hành động phù hợp với vị trí và thời điểm.',
    tip: 'Khi gieo quẻ, chỉ hào nào ĐỘNG mới cần đọc Hào Từ của hào đó.',
  },
  'hoQuai': {
    title: 'Hỗ Quái (Quẻ Hỗ)',
    short: 'Quẻ tiềm ẩn bên trong, lấy hào 2-3-4 làm dưới, hào 3-4-5 làm trên.',
    detail: 'Hỗ Quái tiết lộ diễn biến ngầm ở giai đoạn giữa của sự việc mà mắt thường chưa thấy rõ ở bề mặt.',
    tip: 'Hỗ Quái giúp nhìn thấy các yếu tố nội tại đang âm thầm chuyển dịch.',
  },
  'batThuan': {
    title: 'Quẻ Bát Thuần',
    short: 'Quẻ có quái trên và quái dưới giống nhau (cùng một hành).',
    detail: 'Có 8 quẻ Bát Thuần: Càn, Khôn, Chấn, Tốn, Khảm, Ly, Cấn, Đoài. Quẻ Bát Thuần năng lượng thuần khiết nhưng thái quá, việc gì cũng diễn ra quyết liệt.',
    tip: 'Bát Thuần chủ về sự kiên định, việc lặp đi lặp lại hoặc nội bộ tự giải quyết.',
  },
  'duHon': {
    title: 'Quẻ Du Hồn',
    short: 'Quẻ thế ở hào 4 của mỗi họ quẻ: tâm trí trôi dạt, dễ dời đổi.',
    detail: 'Du Hồn mang tính chất trôi nổi, bất định, đi xa, chuyển nhà hoặc tâm lý hay thay đổi ý định.',
    tip: 'Xem quẻ hỏi đi xa thì thuận, hỏi việc an cư thì bấp bênh.',
  },
  'quyHon': {
    title: 'Quẻ Quy Hồn',
    short: 'Quẻ thế ở hào 3 của mỗi họ quẻ: sự việc quay về nguồn cội.',
    detail: 'Quy Hồn báo hiệu mọi sự xáo trộn sẽ kết thúc, người đi sẽ trở về, công việc quy về ổn định.',
    tip: 'Hỏi đi xa thì khó đi, hỏi việc hòa giải hay kết thúc thì rất tốt.',
  },
};

export function getGlossary(key) {
  if (!key) return null;
  if (GLOSSARY[key]) return GLOSSARY[key];

  // Tìm kiếm theo tên quái đơn (Càn, Khảm, Ly...)
  for (const trigram of ['Càn', 'Khôn', 'Chấn', 'Tốn', 'Khảm', 'Ly', 'Cấn', 'Đoài']) {
    if (key.includes(trigram) && GLOSSARY[trigram]) {
      return GLOSSARY[trigram];
    }
  }

  // Tìm kiếm linh hoạt
  const normalized = key.toLowerCase();
  for (const [k, v] of Object.entries(GLOSSARY)) {
    if (k.toLowerCase() === normalized || v.title.toLowerCase().includes(normalized)) {
      return v;
    }
  }

  return null;
}
