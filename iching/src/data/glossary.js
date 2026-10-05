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
};

export function getGlossary(key) {
  return GLOSSARY[key] || null;
}
