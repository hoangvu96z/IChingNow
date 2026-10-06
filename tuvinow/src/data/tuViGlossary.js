/**
 * Từ điển tra cứu nhanh Tử Vi Đẩu Số (Tap-to-learn)
 * Cung cấp giải nghĩa chi tiết cho:
 * 1. 14 Chính Tinh (với ý nghĩa cơ bản, ngũ hành, đắc hãm M/V/Đ/B/H)
 * 2. Tứ Hóa (Khoa, Quyền, Lộc, Kỵ)
 * 3. Lục Sát Tinh & Cát Tinh, Phụ Tinh phổ biến
 * 4. 12 Cung chức năng
 * 5. Vòng Tràng Sinh (12 sao)
 * 6. Tuần Không, Triệt Lộ, Thân cư
 */

export const TUVI_GLOSSARY = {
  // ── 14 CHÍNH TINH ───────────────────────────────────────────────
  'Tử Vi': {
    title: 'Tử Vi',
    han: '紫微',
    type: 'Chính tinh (Đế Tinh)',
    element: 'Thổ (Âm Thổ)',
    constellation: 'Bắc Đẩu Tinh',
    short: 'Vua của các vì sao, chủ về quyền uy, lãnh đạo, danh vọng và quý hiển.',
    detail: 'Tử Vi là sao đứng đầu trong Tử Vi Đẩu Số, tượng trưng cho bậc minh quân, người có bản lĩnh cầm trịch và tự trọng cao. Cần có quần thần phò tá (Tả Phụ, Hữu Bật, Thiên Khôi, Thiên Việt, Văn Xương, Văn Khúc) để thi thố tài năng trọn vẹn.',
    mieuVuong: 'Miếu/Vượng: Uy nghi, tài năng quản lý xuất chúng, phúc thọ song toàn, có tiếng tăm lớn.',
    hamDia: 'Hãm địa: Dễ rơi vào cô độc, tự phụ, lý tưởng cao nhưng thiếu người trợ lực, sự nghiệp nhiều thăng trầm.',
    tip: 'Tử Vi ngộ Tứ Hóa (Lộc, Quyền, Khoa) là đại quý; kỵ gặp Không Kiếp, Kình Đà hội tụ mà thiếu cát tinh cứu giải.',
  },
  'Thiên Cơ': {
    title: 'Thiên Cơ',
    han: '天機',
    type: 'Chính tinh (Thiện Tinh / Trí Tinh)',
    element: 'Mộc (Âm Mộc)',
    constellation: 'Nam Đẩu Tinh',
    short: 'Chủ về trí tuệ, mưu lược, sự linh hoạt, cơ mưu và chuyển động.',
    detail: 'Thiên Cơ tượng trưng cho quân sư, mưu sĩ. Người có Thiên Cơ tính toán nhanh nhạy, giỏi thích ứng, đa tài, khéo tay và có đầu óc chiến lược sắc sảo.',
    mieuVuong: 'Miếu/Vượng: Thông minh mẫn tiệp, túc trí đa mưu, khéo ngoại giao và xử lý tình huống linh hoạt.',
    hamDia: 'Hãm địa: Hay suy nghĩ viển vông, thần kinh căng thẳng, tính khí dễ dao động, toan tính nhiều nhưng khó thành việc lớn.',
    tip: 'Thiên Cơ ưa đi cùng Hóa Khoa hoặc Xương Khúc để phát huy trí tuệ tột bậc; kỵ Hóa Kỵ gây đau đầu, mất ngủ.',
  },
  'Thái Dương': {
    title: 'Thái Dương',
    han: '太陽',
    type: 'Chính tinh (Nhật Tinh / Quý Tinh)',
    element: 'Hỏa (Dương Hỏa)',
    constellation: 'Trung Thiên Tinh',
    short: 'Mặt trời chiếu sáng, chủ về quang minh, danh tiếng, vị tha và người cha/chồng.',
    detail: 'Thái Dương đại diện cho sự xông xáo, tính cách khẳng khái, trượng nghĩa, thích cống hiến cho tập thể và cộng đồng. Đại diện cho cha hoặc chồng trong lá số.',
    mieuVuong: 'Miếu/Vượng (Dần đến Ngọ): Rực rỡ, danh vọng lẫy lừng, tấm lòng bao dung, làm việc lớn có tiếng vang.',
    hamDia: 'Hãm địa (Thân đến Tý): Ánh sáng bị che khuất, làm nhiều hưởng ít, vất vả lo toan cho người khác, mắt kém.',
    tip: 'Thái Dương cần sáng (sinh ban ngày, đắc địa từ Dần đến Ngọ) thì mới tối ưu hóa sự nghiệp và tài lộc.',
  },
  'Vũ Khúc': {
    title: 'Vũ Khúc',
    han: '武曲',
    type: 'Chính tinh (Tài Tinh / Quả Tinh)',
    element: 'Kim (Âm Kim)',
    constellation: 'Bắc Đẩu Tinh',
    short: 'Chủ về tài chính, tiền tài thực tế, sự quả cảm, cương trực và quyết đoán.',
    detail: 'Vũ Khúc là đại tài tinh thứ nhất trong tử vi, tượng trưng cho tiền bạc tích lũy, kinh doanh buôn bán, đồng thời mang tính chất cô quả (cứng cỏi, ít bộc lộ cảm xúc).',
    mieuVuong: 'Miếu/Vượng: Nhạy bén kinh tài, tích lũy điền sản dồi dào, lời nói chắc nịch, hành động kiên quyết.',
    hamDia: 'Hãm địa: Quản lý tiền bạc trắc trở, tính cách cô độc cứng nhắc, dễ hao tài do liều lĩnh hoặc bị lừa gạt.',
    tip: 'Vũ Khúc rất ưa Hóa Lộc, Lộc Tồn để vượng tài lộc; kỵ Không Kiếp làm hao tán kho tiền.',
  },
  'Thiên Đồng': {
    title: 'Thiên Đồng',
    han: '天同',
    type: 'Chính tinh (Phúc Tinh)',
    element: 'Thủy (Dương Thủy)',
    constellation: 'Nam Đẩu Tinh',
    short: 'Chủ về phúc đức, sự an nhàn, hài hòa, có duyên và tâm hồn trẻ trung.',
    detail: 'Thiên Đồng có tính trẻ con, thích thanh nhàn hưởng lạc, dễ gần, có lòng trắc ẩn, tính tình ôn nhu và thích nghệ thuật ẩm thực.',
    mieuVuong: 'Miếu/Vượng: Hưởng phúc trường thọ, gặp hung hóa cát, quý nhân phù trợ, cuộc sống thảnh thơi.',
    hamDia: 'Hãm địa: Hay chán nản, thiếu ý chí kiên định, dễ thay đổi lập trường, vất vả bươn chải buổi đầu.',
    tip: 'Thiên Đồng cần chút kích hoạt (như Hóa Quyền hoặc Sát tinh đắc) để có động lực phấn đấu, tránh ỷ lại an phận.',
  },
  'Liêm Trinh': {
    title: 'Liêm Trinh',
    han: '廉貞',
    type: 'Chính tinh (Thứ Đào Hoa / Tù Tinh)',
    element: 'Hỏa (Âm Hỏa)',
    constellation: 'Bắc Đẩu Tinh',
    short: 'Chủ về nguyên tắc, kỷ luật, lòng tự trọng, bản lĩnh, quan trường và đào hoa.',
    detail: 'Liêm Trinh là sao vừa có nét đào hoa duyên dáng, vừa có sự cương trực khó lay chuyển. Rất nghiêm khắc với bản thân và người khác, có năng lực lãnh đạo hành chính.',
    mieuVuong: 'Miếu/Vượng: Có uy quyền chức vị lớn, giữ vững kỷ cương, bản lĩnh phi thường trong nghịch cảnh.',
    hamDia: 'Hãm địa: Tính tình nóng nảy, cố chấp, dễ vướng kiện tụng pháp luật (Tù Tinh), thị phi hoặc tai nạn hình thương.',
    tip: 'Liêm Trinh tối kỵ Hóa Kỵ hoặc Bạch Hổ ngộ hãm địa dễ vướng lao lý; ưa Hóa Lộc chuyển hóa thành sự nghiệp thành đạt.',
  },
  'Thiên Phủ': {
    title: 'Thiên Phủ',
    han: '天府',
    type: 'Chính tinh (Lệnh Tinh / Kho Tinh)',
    element: 'Thổ (Dương Thổ)',
    constellation: 'Nam Đẩu Tinh',
    short: 'Kho tàng tài chính của trời đất, chủ về tích lũy, bao dung, chu toàn và ổn định.',
    detail: 'Thiên Phủ đại diện cho hoàng hậu, người quản lý ngân khố quốc gia. Tính tình cẩn trọng, đôn hậu, giỏi thu vén, thích cuộc sống an toàn và ổn định.',
    mieuVuong: 'Miếu/Vượng: Tài lộc dồi dào, nhà cửa đề huề, giữ tiền xuất sắc, phúc hậu và có uy tín cao.',
    hamDia: 'Thiên Phủ luôn Miếu/Vượng/Đắc (không có vị trí hãm tuyệt đối), nhưng kỵ gặp Tuần Triệt (kho bị thủng/khóa) hoặc Không Kiếp (kho bị cướp).',
    tip: 'Thiên Phủ gặp Lộc Tồn hoặc Hóa Lộc là kho đầy ắp tiền tài; kỵ gặp Triệt làm hao tài tán của.',
  },
  'Thái Âm': {
    title: 'Thái Âm',
    han: '太陰',
    type: 'Chính tinh (Nguyệt Tinh / Phú Tinh)',
    element: 'Thủy (Âm Thủy)',
    constellation: 'Trung Thiên Tinh',
    short: 'Mặt trăng dịu mát, chủ về phú quý, sự tinh tế, điền sản và người mẹ/vợ.',
    detail: 'Thái Âm tượng trưng cho sự dịu dàng, nội tâm sâu sắc, gu thẩm mỹ cao, lãng mạn, giỏi tích lũy bất động sản. Đại diện cho mẹ hoặc vợ.',
    mieuVuong: 'Miếu/Vượng (Dậu đến Sửu): Giàu có lớn, gia sản hưng vượng, dung mạo thanh tú, nội tâm an nhiên.',
    hamDia: 'Hãm địa (Mão đến Mùi): Tình cảm nhiều ưu tư trắc trở, ý chí thiếu kiên định, tài chính bấp bênh, sức khỏe mẹ/vợ kém.',
    tip: 'Thái Âm miếu vượng ở cung Tài/Điền chủ về giàu sang nứt đố đổ vách; sinh ban đêm là hợp cách nhất.',
  },
  'Tham Lang': {
    title: 'Tham Lang',
    han: '貪狼',
    type: 'Chính tinh (Đại Đào Hoa / Dục Vọng)',
    element: 'Thủy - Mộc (Âm Thủy đới Âm Mộc)',
    constellation: 'Bắc Đẩu Tinh',
    short: 'Chủ về giao tế, dục vọng, nghệ thuật, sự nhạy bén thời cuộc và duyên tâm linh.',
    detail: 'Tham Lang là ngôi sao đa tài đa nghệ, ngoại giao giỏi, thích trải nghiệm cái mới, nhiều tham vọng. Về già thường bén duyên sâu sắc với tôn giáo, huyền học.',
    mieuVuong: 'Miếu/Vượng: Ngoại giao đắc lực, tài ba xuất chúng, kinh doanh tài ba, phất lên nhanh chóng (cách Hỏa Tham/Linh Tham phú quý).',
    hamDia: 'Hãm địa: Ham vui phóng túng, thiếu định hướng thực tế, dễ sa đà cờ bạc rượu chè, tình duyên sóng gió.',
    tip: 'Tham Lang gặp Hỏa Tinh hoặc Linh Tinh đồng cung/hội chiếu tạo thành cách "Hỏa Tham / Linh Tham" chủ phát tài bất ngờ.',
  },
  'Cự Môn': {
    title: 'Cự Môn',
    han: '巨門',
    type: 'Chính tinh (Ám Tinh / Thần Ngôn Luận)',
    element: 'Thủy (Âm Thủy)',
    constellation: 'Bắc Đẩu Tinh',
    short: 'Chủ về ngôn ngữ, khả năng phản biện, lập luận, bí mật và thị phi.',
    detail: 'Cự Môn là cái cổng lớn (nghĩa bóng là miệng lưỡi). Người có Cự Môn giỏi quan sát, sắc sảo trong lời ăn tiếng nói, thích hợp làm luật sư, giáo viên, diễn giả, nghiên cứu.',
    mieuVuong: 'Miếu/Vượng: Hùng biện tài tình, lý luận sắc bén thuyết phục, kiến thức sâu rộng, tiếng tăm vang dội.',
    hamDia: 'Hãm địa: Dễ buông lời cay độc, thị phi bủa vây, hay hoài nghi người khác, hiểu lầm và tranh chấp.',
    tip: 'Cự Môn rất ưa gặp Thái Dương miếu vượng chiếu để hóa giải tính "Ám" (tối tăm), biến thị phi thành danh tiếng.',
  },
  'Thiên Tướng': {
    title: 'Thiên Tướng',
    han: '天相',
    type: 'Chính tinh (Ấn Tinh)',
    element: 'Thủy (Dương Thủy)',
    constellation: 'Nam Đẩu Tinh',
    short: 'Tể tướng quốc gia, chủ về quyền bính, lòng trắc ẩn, sự đàng hoàng và trượng nghĩa.',
    detail: 'Thiên Tướng là con dấu quyền lực (Ấn), người phò tá đắc lực cho bậc lãnh đạo. Tính tình trượng nghĩa, chu đáo, thích giúp người, ăn mặc lịch thiệp.',
    mieuVuong: 'Miếu/Vượng: Uy quyền hiển hách, đáng tin cậy, sự nghiệp vững chắc, được mọi người kính trọng.',
    hamDia: 'Hãm địa: Dễ cả tin vào người khác, thiếu quyết đoán, dễ bị hoàn cảnh xô đẩy hoặc mang vạ vì người khác.',
    tip: 'Thiên Tướng chịu ảnh hưởng cực lớn từ 2 cung giáp bên cạnh (cách Giáp Lộc hay Giáp Kỵ).',
  },
  'Thiên Lương': {
    title: 'Thiên Lương',
    han: '天梁',
    type: 'Chính tinh (Ấm Tinh / Thọ Tinh)',
    element: 'Thổ (Dương Thổ)',
    constellation: 'Nam Đẩu Tinh',
    short: 'Chủ về sự che chở, lòng nhân hậu, thọ trường, nguyên tắc đạo đức và giải ách.',
    detail: 'Thiên Lương tượng trưng cho người già, bậc trưởng bối đức độ. Có khả năng biến nguy thành an, thích cứu giúp người khác, công chính liêm minh và có năng khiếu y dược, sư phạm.',
    mieuVuong: 'Miếu/Vượng: Trường thọ phúc lộc, quý nhân phò trợ lúc ngặt nghèo, danh vọng thanh cao, con cháu hiếu thuận.',
    hamDia: 'Hãm địa: Hay thích dạy đời, bảo thủ, lòng tốt đặt nhầm chỗ, vất vả vì gánh vác việc thiên hạ.',
    tip: 'Thiên Lương là sao giải ách, nhưng thường phải "gặp nạn rồi mới giải" nên đời sống có phen kinh qua thử thách.',
  },
  'Thất Sát': {
    title: 'Thất Sát',
    han: '七殺',
    type: 'Chính tinh (Tướng Tinh / Sát Tinh)',
    element: 'Kim (Dương Kim đới Hỏa)',
    constellation: 'Nam Đẩu Tinh',
    short: 'Vị đại tướng quân tiền phương, chủ về dũng mãnh, quyết đoán, khai phá và bứt phá.',
    detail: 'Thất Sát đại diện cho tinh thần thép, dám nghĩ dám làm, thích xông pha nơi gian khó, hành động nhanh lẹ, độc lập tự chủ và không ngại va chạm.',
    mieuVuong: 'Miếu/Vượng: Uy danh lẫy lừng, lập đại công nghiệp, biến nguy cơ thành thời cơ, phong thái dũng tướng.',
    hamDia: 'Hãm địa: Tính khí nóng nảy hung hăng, cô độc khắc nghiệt, dễ gặp hình thương tai nạn, đời sống biến động dữ dội.',
    tip: 'Thất Sát không sợ Tứ Sát (Kình Đà Hỏa Linh) nếu miếu vượng; nhưng rất cần Tử Vi hoặc Lộc Tồn kiềm chế bớt tính sát.',
  },
  'Phá Quân': {
    title: 'Phá Quân',
    han: '破軍',
    type: 'Chính tinh (Hao Tinh / Tiên Phong)',
    element: 'Thủy (Âm Thủy)',
    constellation: 'Bắc Đẩu Tinh',
    short: 'Chủ về sự đổi mới, phá bỏ cái cũ để dựng cái mới, tính tiên phong và phiêu lưu.',
    detail: 'Phá Quân là dũng sĩ mở đường, không chịu gò bó theo khuôn mẫu truyền thống. Dám mạo hiểm, thích cải cách, cuộc đời thường trải qua nhiều bước ngoặt lớn.',
    mieuVuong: 'Miếu/Vượng: Khai sáng cơ nghiệp từ đống đổ nát, đổi mới ngoạn mục, tài năng xuất chúng trong lĩnh vực mới.',
    hamDia: 'Hãm địa: Tính khí thất thường, phá tán tiền của, sự nghiệp chìm nổi, gia đạo bất an, dễ gặp thất bại lớn.',
    tip: 'Phá Quân ưa Hóa Lộc, Hóa Quyền để biến năng lượng "hao tán" thành năng lượng "tái thiết thành công".',
  },

  // ── TỨ HÓA ───────────────────────────────────────────────────────
  'Hóa Lộc': {
    title: 'Hóa Lộc',
    han: '化祿',
    type: 'Tứ Hóa (Cát Tinh)',
    element: 'Mộc (Âm Mộc)',
    short: 'Chủ về tài lộc, cơ hội may mắn, sự hanh thông, lạc quan và duyên lành.',
    detail: 'Hóa Lộc mang lại nguồn năng lượng trù phú, sự gia tăng của cải, khả năng kiếm tiền dễ dàng và thái độ sống vui vẻ, hòa đồng.',
    tip: 'Hóa Lộc ở Mệnh/Tài/Điền: Kinh doanh phát đạt, tiền của tự nhiên đến; gặp Lộc Tồn tạo thế "Song Lộc" đại phú.',
  },
  'Hóa Quyền': {
    title: 'Hóa Quyền',
    han: '化權',
    type: 'Tứ Hóa (Cát Tinh)',
    element: 'Hỏa (Dương Hỏa)',
    short: 'Chủ về quyền lực, địa vị, sự thăng tiến, năng lực tự chủ và uy thế.',
    detail: 'Hóa Quyền mang lại bản lĩnh lãnh đạo, ý chí vươn lên mãnh liệt, năng lực nắm giữ quyền hành và tiếng nói có trọng lượng trong tập thể.',
    tip: 'Hóa Quyền ở Mệnh/Quan: Dễ làm sếp, thăng chức nhanh, lời nói khiến người khác nể sợ.',
  },
  'Hóa Khoa': {
    title: 'Hóa Khoa',
    han: '化科',
    type: 'Tứ Hóa (Cát Tinh - Đệ Nhất Cứu Giải)',
    element: 'Thủy (Dương Thủy)',
    short: 'Chủ về khoa bảng, danh tiếng, trí tuệ thanh cao và năng lực giải ách đệ nhất.',
    detail: 'Hóa Khoa giúp thi cử đỗ đạt, có danh dự uy tín, kiến thức sâu rộng. Đặc biệt, Hóa Khoa có thể cứu giải hung họa từ các sát tinh, biến đại sự thành tiểu sự.',
    tip: 'Hóa Khoa chiếu Mệnh/Tật: Gặp hung hóa cát, được thầy thuốc giỏi cứu chữa, tiếng thơm vang xa.',
  },
  'Hóa Kỵ': {
    title: 'Hóa Kỵ',
    han: '化忌',
    type: 'Tứ Hóa (Hung Tinh / Bế Tắc)',
    element: 'Thủy (Dương Thủy)',
    short: 'Chủ về sự trở ngại, thị phi, đố kỵ, dính mắc, lo toan và trắc trở.',
    detail: 'Hóa Kỵ như đám mây đen che khuất, làm giảm đi vẻ đẹp của các sao đi cùng. Gây ra hiểu lầm, tranh cãi, bế tắc tâm lý hoặc tổn hao tình cảm/tài chính.',
    tip: 'Hóa Kỵ ở Cung nào thì cung đó là nơi ta phải trả nợ ân tình hoặc dốc nhiều tâm sức nhất cuộc đời.',
  },

  // ── LỤC SÁT TINH & HUNG TINH ─────────────────────────────────────
  'Kình Dương': {
    title: 'Kình Dương',
    han: '擎羊',
    type: 'Sát tinh (Lục Sát)',
    element: 'Kim (Dương Kim)',
    short: 'Mũi kiếm bén nhọn, chủ về sự cương liệt, quả cảm, hung hăng, phẫu thuật và hình thương.',
    detail: 'Kình Dương mang năng lượng công kích trực diện, tính khí bộc trực, không ngại va chạm. Khi đắc địa ở Thìn/Tuất/Sửu/Mùi thì trở thành người có chí khí anh hùng, quả quyết.',
    tip: 'Kình Dương hãm địa dễ bị tai nạn đao kiếm, mổ xẻ hoặc tranh chấp gay gắt; cần học cách kiềm chế nóng giận.',
  },
  'Đà La': {
    title: 'Đà La',
    han: '陀羅',
    type: 'Sát tinh (Lục Sát)',
    element: 'Kim (Âm Kim)',
    short: 'Mũi tên ngầm, chủ về sự trì trệ, dây dưa, âm thầm phá hoại, thù dai và bế tắc.',
    detail: 'Trái ngược với Kình Dương công khai, Đà La là sự trở ngại kéo dài, việc làm dở dang, nội tâm hay dằn vặt lo toan.',
    tip: 'Đà La gặp Hóa Kỵ gọi là cách "Kỵ Đà hội", việc gì cũng chậm trễ, khó dứt điểm.',
  },
  'Hỏa Tinh': {
    title: 'Hỏa Tinh',
    han: '火星',
    type: 'Sát tinh (Lục Sát)',
    element: 'Hỏa (Dương Hỏa)',
    short: 'Ngọn lửa dữ dội bùng cháy, chủ về tính khí nóng vội, bộc phát, tai họa bất ngờ.',
    detail: 'Hỏa Tinh làm tăng tốc độ của mọi sự việc. Người có Hỏa Tinh làm việc hăng hái nhưng thiếu kiên nhẫn, dễ bốc đồng làm đổ vỡ đại sự.',
    tip: 'Hội cùng Tham Lang miếu vượng tạo thành cách "Hỏa Tham bạo phát", giàu nhanh bất ngờ.',
  },
  'Linh Tinh': {
    title: 'Linh Tinh',
    han: '鈴星',
    type: 'Sát tinh (Lục Sát)',
    element: 'Hỏa (Âm Hỏa)',
    short: 'Ngọn lửa âm ỉ, chủ về sự thâm trầm, lo nghĩ trong lòng, sự cố bất ngờ kéo dài.',
    detail: 'Linh Tinh mang tính chất nhẫn nại hơn Hỏa Tinh nhưng dễ để bụng, nội tâm sâu kín và có trực giác nhạy bén.',
    tip: 'Hội cùng Tham Lang tạo thành "Linh Tham tương hội", phát tài về kinh doanh, bất động sản.',
  },
  'Địa Không': {
    title: 'Địa Không',
    han: '地空',
    type: 'Sát tinh (Đại Sát Tinh)',
    element: 'Hỏa (Âm Hỏa)',
    short: 'Hư không, sự tan biến, tư duy phá cách phi truyền thống, tổn thất tài chính.',
    detail: 'Địa Không chủ về sự rỗng không, tư tưởng bay bổng dị biệt, không màng danh lợi tầm thường. Thích hợp cho triết học, nghệ thuật, tôn giáo, công nghệ sáng tạo đột phá.',
    tip: 'Địa Không ngộ Tài Tinh (Vũ Khúc, Thiên Phủ) dễ khiến tiền tài trôi tuột; nhưng đắc địa có thể thành bậc kỳ tài.',
  },
  'Địa Kiếp': {
    title: 'Địa Kiếp',
    han: '地劫',
    type: 'Sát tinh (Đại Sát Tinh)',
    element: 'Hỏa (Dương Hỏa)',
    short: 'Sóng gió dữ dội, cướp đoạt, sự biến động đột ngột, tai ương và thăng trầm lớn.',
    detail: 'Địa Kiếp như cơn sóng thần cuốn trôi mọi thành quả tích lũy. Cuộc đời thường có những bước ngoặt thăng giáng kịch tính.',
    tip: 'Địa Kiếp đắc địa ở Tỵ/Hợi tạo nên mẫu người dám nghĩ dám làm phi thường, nhưng cần giữ đạo đức chí công vô tư.',
  },

  // ── LỤC CÁT TINH & CÁT PHỤ TINH ─────────────────────────────────
  'Tả Phụ': {
    title: 'Tả Phụ',
    han: '左輔',
    type: 'Cát tinh (Phò Tá)',
    element: 'Thổ (Dương Thổ)',
    short: 'Cánh tay phải đắc lực, chủ về bạn bè, đồng nghiệp trợ giúp, sự nghiệp hưng thịnh.',
    detail: 'Tả Phụ là phụ tá nhiệt tình, giúp mở rộng mối quan hệ, tăng thêm vượng khí cho các chính tinh.',
    tip: 'Cùng Hữu Bật giáp Mệnh hoặc đồng cung là cách "Tả Hữu triều củng", làm việc gì cũng có người phò trợ.',
  },
  'Hữu Bật': {
    title: 'Hữu Bật',
    han: '右弼',
    type: 'Cát tinh (Phò Tá)',
    element: 'Thủy (Âm Thủy)',
    short: 'Cánh tay trái trung thành, chủ về sự giúp đỡ thầm lặng, cơ mưu khéo léo và hòa nhã.',
    detail: 'Hữu Bật mềm mỏng hơn Tả Phụ, đem lại thiện cảm trong đối nhân xử thế và sự trợ giúp kịp thời.',
    tip: 'Tả Hữu gặp sao xấu có thể trở thành "giúp kẻ xấu", nên cần đi cùng chính tinh vững vàng.',
  },
  'Văn Xương': {
    title: 'Văn Xương',
    han: '文昌',
    type: 'Cát tinh (Khoa Giáp)',
    element: 'Kim (Dương Kim)',
    short: 'Chủ về thi cử, bằng cấp chính quy, văn chương sắc sảo và danh tiếng học thuật.',
    detail: 'Văn Xương thông minh, thích đọc sách, có bằng cấp cao và năng lực viết lách truyền cảm hứng.',
    tip: 'Văn Xương hóa Kỵ cần đề phòng lỗi giấy tờ, hợp đồng, bằng cấp hoặc trục trặc chữ ký.',
  },
  'Văn Khúc': {
    title: 'Văn Khúc',
    han: '文曲',
    type: 'Cát tinh (Khoa Giáp / Nghệ Thuật)',
    element: 'Thủy (Âm Thủy)',
    short: 'Chủ về tài hoa nghệ thuật, ăn nói có duyên, trực giác và sự lãng mạn.',
    detail: 'Văn Khúc thiên về năng khiếu cảm thụ nghệ thuật, âm nhạc, hội họa và khả năng thuyết phục lòng người.',
    tip: 'Đi cùng Đào Hoa hoặc Tham Lang làm tăng tính phong lưu, đào hoa duyên dáng.',
  },
  'Thiên Khôi': {
    title: 'Thiên Khôi',
    han: '天魁',
    type: 'Cát tinh (Quý Nhân - Dương Quý)',
    element: 'Hỏa (Dương Hỏa)',
    short: 'Đứng đầu bảng, chủ về quý nhân là nam giới hoặc cấp trên nâng đỡ công khai.',
    detail: 'Thiên Khôi mang khí chất đàng hoàng, đi đâu cũng được người có địa vị để mắt nâng đỡ, thi cử đỗ đầu.',
    tip: 'Khôi Việt ở Mệnh/Quan: Mẫu người có tôn ti trật tự, dễ trở thành người tiên phong đứng đầu.',
  },
  'Thiên Việt': {
    title: 'Thiên Việt',
    han: '天鉞',
    type: 'Cát tinh (Quý Nhân - Âm Quý)',
    element: 'Hỏa (Âm Hỏa)',
    short: 'Chủ về quý nhân là nữ giới hoặc sự giúp đỡ thầm kín phía sau.',
    detail: 'Thiên Việt giúp hóa giải bế tắc một cách êm đẹp thông qua sự tác động của người có thiện chí.',
    tip: 'Cùng Thiên Khôi tạo thành bộ "Khôi Việt" đệ nhất quý nhân trong tử vi.',
  },
  'Lộc Tồn': {
    title: 'Lộc Tồn',
    han: '祿存',
    type: 'Cát tinh (Thiên Lộc)',
    element: 'Thổ (Âm Thổ)',
    short: 'Kho lộc trời ban, chủ về tiền tài tự nhiên, tích lũy vững chắc và thọ phúc.',
    detail: 'Lộc Tồn đại diện cho phước báu tiền kiếp mang lại tài sản. Luôn bị kẹp giữa Kình Dương và Đà La nên người có Lộc Tồn thường cẩn trọng giữ của.',
    tip: 'Lộc Tồn không ưa gặp Không Kiếp (cướp lộc); rất ưa gặp Tử Vi, Thiên Phủ, Vũ Khúc.',
  },
  'Thiên Mã': {
    title: 'Thiên Mã',
    han: '天馬',
    type: 'Cát tinh (Dịch Động)',
    element: 'Hỏa (Dương Hỏa)',
    short: 'Con ngựa chiến, chủ về sự di chuyển, năng động, đi xa lập nghiệp và thăng tiến.',
    detail: 'Thiên Mã mang năng lượng của sự dịch chuyển, công tác, xuất ngoại, xe cộ. Gặp Lộc gọi là cách "Lộc Mã giao trì" phát tài nơi đất khách.',
    tip: 'Kỵ gặp Triệt (ngựa gãy chân) hoặc Đà La (ngựa què chậm bước).',
  },

  // ── ĐẶC BIỆT: TUẦN - TRIỆT - THÂN ────────────────────────────────
  'Tuần': {
    title: 'Tuần Không (Tuần Trung Không Vong)',
    type: 'Hư không / Điều chỉnh',
    element: 'Hỏa',
    short: 'Lưới trời bao phủ, làm chậm lại, giảm bớt cả tốt lẫn xấu một cách từ từ.',
    detail: 'Tuần tác động êm dịu nhưng kéo dài suốt đời, mạnh hơn ở giai đoạn trung niên và hậu vận. Gặp sao tốt làm giảm 50-70% độ tốt; gặp sao xấu thì lại có tác dụng che chắn, giảm bớt hung họa.',
    tip: 'Cung có Tuần thường khiến việc phát triển chậm mà chắc, không thể nóng vội.',
  },
  'Triệt': {
    title: 'Triệt Lộ (Triệt Lộ Không Vong)',
    type: 'Cắt đứt / Chặn đứng',
    element: 'Kim',
    short: 'Lưỡi kiếm chặt đứt, tác động mạnh mẽ và đột ngột ở tiền vận (trước 30-35 tuổi).',
    detail: 'Triệt như bức tường thành chặn đứng lối đi. Tác động rất mạnh ở tuổi trẻ, làm trắc trở công danh hoặc gia đạo lúc đầu, nhưng từ sau 35 tuổi ảnh hưởng sẽ nhẹ dần đi.',
    tip: 'Triệt đóng ở cung nào thì tiền vận cung đó hay có sự đứt gãy hoặc phải làm lại từ đầu.',
  },
  'Thân': {
    title: 'Cung Thân',
    type: 'Hậu vận & Hành động thực tế',
    short: 'Đại diện cho nửa đời sau (từ ngoài 30 tuổi) và hành vi thực tế của đương số.',
    detail: 'Mệnh là cái gốc tiên thiên khi sinh ra; Thân là hành động thực tế và đích đến của hậu vận. Thân cư cung nào thì tâm trí và nguồn lực cuộc đời sẽ đổ dồn vào cung đó.',
    tip: 'Thân cư Mệnh: Tự lập; Thân cư Phúc: Hưởng phúc tổ tiên; Thân cư Quan: Hết lòng vì sự nghiệp; Thân cư Tài: Thực tế vì tiền của; Thân cư Thê: Nặng lòng với gia đình.',
  },

  // ── 12 CUNG CHỨC NĂNG ────────────────────────────────────────────
  'Cung Mệnh': {
    title: 'Cung Mệnh',
    type: 'Cung vị nòng cốt',
    short: 'Cung quan trọng nhất, biểu thị bản tính, tài năng, tướng mạo và vận mệnh chung.',
    detail: 'Cung Mệnh là hạt nhân của cả lá số. Nó quyết định tư chất bẩm sinh, tính cách, sức chịu đựng nghịch cảnh và tiềm năng phát triển tổng thể của con người.',
    tip: 'Mệnh tốt gặp vận xấu vẫn vượt qua được; Mệnh yếu gặp vận tốt cũng khó giữ được lâu bền.',
  },
  'Cung Phụ Mẫu': {
    title: 'Cung Phụ Mẫu',
    type: 'Cung vị',
    short: 'Quan hệ với cha mẹ, cấp trên, di truyền và sự che chở của dòng tộc.',
    detail: 'Cho biết tình cảm với đấng sinh thành, sự thọ khang của cha mẹ, đồng thời biểu thị mối quan hệ với cấp trên và cơ quan pháp luật.',
    tip: 'Cát tinh hội tụ: Được cha mẹ yêu thương nâng đỡ; Sát tinh xâm phạm: Sớm xa cách gia đình.',
  },
  'Cung Phúc Đức': {
    title: 'Cung Phúc Đức',
    type: 'Cung vị nòng cốt',
    short: 'Đời sống tinh thần, phúc phận tổ tiên, thọ trường và sự thanh thản nội tâm.',
    detail: 'Chiếu thẳng sang cung Tài Bạch, là gốc rễ của tiền tài và sự an lạc. Phúc Đức tốt thì dù sóng gió bên ngoài tâm hồn vẫn vững vàng.',
    tip: 'Cung Phúc Đức còn cho biết sự phát đạt của dòng họ và nơi an táng mồ mả tổ tiên.',
  },
  'Cung Điền Trạch': {
    title: 'Cung Điền Trạch',
    type: 'Cung vị',
    short: 'Nhà cửa, đất đai, bất động sản, cơ sở làm việc và tài sản tích lũy chìm.',
    detail: 'Biểu thị khả năng sở hữu nhà đất, thừa kế di sản và môi trường sống trong gia đình có ấm êm thuận hòa hay không.',
    tip: 'Ưa gặp Thái Âm, Thiên Phủ, Hóa Lộc, Tử Vi; kỵ Không Kiếp, Hóa Kỵ gây tranh chấp nhà đất.',
  },
  'Cung Quan Lộc': {
    title: 'Cung Quan Lộc',
    type: 'Tam Hợp Mệnh - Tài - Quan',
    short: 'Sự nghiệp, con đường công danh, vị trí trong xã hội và cách thức làm việc.',
    detail: 'Thể hiện môi trường làm việc phù hợp (hành chính, kinh doanh, tự do hay nghệ thuật) và đỉnh cao danh vọng đương số có thể đạt được.',
    tip: 'Cùng Mệnh và Tài Bạch tạo nên tam giác vận mệnh chi phối toàn bộ năng lực hành động.',
  },
  'Cung Nô Bộc': {
    title: 'Cung Nô Bộc',
    type: 'Cung vị',
    short: 'Bạn bè, đồng nghiệp, cấp dưới, đối tác và mạng lưới quan hệ xã hội.',
    detail: 'Cho biết bạn bè là trợ lực hay gánh nặng, cấp dưới có trung thành phò tá hay bội phản, mạng lưới quan hệ rộng hay hẹp.',
    tip: 'Nô Bộc quá mạnh mà Mệnh yếu dễ bị bạn bè lấn lướt hoặc làm việc cho người khác hưởng.',
  },
  'Cung Thiên Di': {
    title: 'Cung Thiên Di',
    type: 'Xung chiếu Cung Mệnh',
    short: 'Môi trường bên ngoài, đối ngoại, xuất hành, đi xa và cách xã hội nhìn nhận bạn.',
    detail: 'Cung Thiên Di chiếu thẳng vào Mệnh. Khi ra ngoài xã hội, gặp ai, có được quý nhân nâng đỡ hay gặp tai ương đều biểu hiện rõ ở cung này.',
    tip: 'Thiên Di sáng hơn Mệnh thì nên đi xa lập nghiệp, càng xuất ngoại càng phát đạt.',
  },
  'Cung Tật Ách': {
    title: 'Cung Tật Ách',
    type: 'Cung vị',
    short: 'Sức khỏe, bệnh tật bẩm sinh, tai ương rủi ro và nơi ẩn giấu nghiệp lực.',
    detail: 'Phản ánh các cơ quan nội tạng dễ suy yếu, xu hướng tai nạn và khả năng phục hồi sau ốm đau bệnh tật.',
    tip: 'Ưa gặp sao cứu giải như Hóa Khoa, Thiên Lương, Bác Sỹ, Triệt để tiêu trừ bệnh tật.',
  },
  'Cung Tài Bạch': {
    title: 'Cung Tài Bạch',
    type: 'Tam Hợp Mệnh - Tài - Quan',
    short: 'Tiền tài, khả năng kiếm tiền, dòng tiền lưu chuyển và thái độ với của cải.',
    detail: 'Không chỉ là giàu hay nghèo, mà còn là phương thức kiếm tiền: bằng trí tuệ, mồ hôi công sức, đầu cơ hay may mắn bất ngờ.',
    tip: 'Tài Bạch ưa Lộc Tồn, Vũ Khúc, Hóa Lộc, Thái Âm; kỵ gặp Kiếp Sát, Không Kiếp làm tiền vào tay này ra tay kia.',
  },
  'Cung Tử Tức': {
    title: 'Cung Tử Tức',
    type: 'Cung vị',
    short: 'Con cái, học trò, hậu bối kế nghiệp và khả năng sinh sản.',
    detail: 'Biểu thị số lượng con cái, tính cách và sự thành đạt của con, cũng như sự hiếu thuận giữa con cái với cha mẹ.',
    tip: 'Có Thiên Đồng, Thiên Phủ, Tràng Sinh là đông con cháu ngoan ngoãn; gặp Tuyệt, Kình Đà thì muộn con.',
  },
  'Cung Phu Thê': {
    title: 'Cung Phu Thê',
    type: 'Xung chiếu Cung Quan Lộc',
    short: 'Hôn nhân, hình bóng người bạn đời, duyên nợ và mức độ hòa hợp lứa đôi.',
    detail: 'Cho biết ngoại hình, tính cách, hoàn cảnh gia đình của người vợ/chồng, cũng như những biến động vui buồn trong đời sống hôn nhân.',
    tip: 'Phu Thê chiếu Quan Lộc nên người bạn đời có tác động quyết định đến sự thành bại công danh.',
  },
  'Cung Huynh Đệ': {
    title: 'Cung Huynh Đệ',
    type: 'Cung vị',
    short: 'Anh chị em ruột thịt, bạn bè thân như ruột thịt và khả năng hợp tác.',
    detail: 'Phản ánh tình cảm gắn kết hay tranh chấp giữa anh em trong gia đình, đồng thời biểu thị khả năng vay mượn tài chính ngắn hạn.',
    tip: 'Hội cát tinh thì anh em đùm bọc thành đạt; hội Hóa Kỵ hay Cô Quả thì tình cảm xa cách.',
  },

  // ── VÒNG TRÀNG SINH ──────────────────────────────────────────────
  'Tràng Sinh': {
    title: 'Tràng Sinh',
    type: 'Vòng Tràng Sinh',
    short: 'Giai đoạn sinh sôi, nảy nở mầm sống mới, sức sống dồi dào, thọ trường.',
    detail: 'Là trạng thái khởi đầu tràn đầy sinh khí, đem lại sức khỏe dẻo dai, con cháu đông đúc và sự trường tồn cho cung vị đóng.',
    tip: 'Đóng ở Mệnh hoặc Thân chủ về nhân hậu, sức bền tốt, dễ thích nghi.',
  },
  'Mộc Dục': {
    title: 'Mộc Dục',
    type: 'Vòng Tràng Sinh',
    short: 'Tắm gội, rũ bỏ cái cũ, chủ về sự chải chuốt, đào hoa, thay đổi thất thường.',
    detail: 'Tượng trưng cho đứa trẻ mới sinh được tắm rửa. Tính tình thích chưng diện, dễ sa vào chuyện phong lưu hoặc công việc hay thay đổi.',
    tip: 'Đi cùng sao đào hoa thì tăng thêm duyên dáng nhưng cần giữ gìn tiết chế.',
  },
  'Quan Đới': {
    title: 'Quan Đới',
    type: 'Vòng Tràng Sinh',
    short: 'Đội mũ thắt đai, chủ về sự trưởng thành, tham vọng công danh sự nghiệp.',
    detail: 'Giai đoạn thanh niên đĩnh đạc bước vào đời, có ý chí học hỏi vươn lên nắm giữ địa vị xã hội.',
    tip: 'Đóng ở Quan Lộc hay Mệnh rất tốt cho sự thăng tiến công việc.',
  },
  'Lâm Quan': {
    title: 'Lâm Quan',
    type: 'Vòng Tràng Sinh',
    short: 'Lên chức làm quan, phong độ đỉnh cao, tự lập và khẳng định tên tuổi.',
    detail: 'Đại diện cho sự phát triển vững vàng, tiếng tăm vang xa, tài năng được công nhận thực tế.',
    tip: 'Là một trong các cung vị cát lợi nhất của vòng Tràng Sinh.',
  },
  'Đế Vượng': {
    title: 'Đế Vượng',
    type: 'Vòng Tràng Sinh',
    short: 'Cực thịnh, đỉnh cao của quyền lực và năng lượng, dồi dào sức sống.',
    detail: 'Tượng trưng cho sự thịnh vượng tột bậc về cả thể chất lẫn tài lộc danh vọng.',
    tip: 'Vượng quá thì dễ sinh tự mãn, sau đỉnh cao cần chuẩn bị tích lũy đề phòng suy thoái.',
  },
  'Suy': {
    title: 'Suy',
    type: 'Vòng Tràng Sinh',
    short: 'Năng lượng bắt đầu giảm dần, thoái trào, cần sự cẩn trọng và tĩnh tại.',
    detail: 'Khí lực không còn sung mãn như trước, nên duy trì ổn định thay vì mạo hiểm mở rộng.',
    tip: 'Thích hợp cho việc củng cố hậu phương và gìn giữ thành quả.',
  },
  'Bệnh': {
    title: 'Bệnh',
    type: 'Vòng Tràng Sinh',
    short: 'Dễ suy nhược, tinh thần mệt mỏi, hay lo lắng ưu phiền.',
    detail: 'Biểu thị sự mệt mỏi về thể chất hoặc tâm lý, cần chú ý chăm sóc chế độ nghỉ ngơi sinh hoạt.',
    tip: 'Đóng ở Tật Ách cần chủ động khám sức khỏe định kỳ.',
  },
  'Tử': {
    title: 'Tử',
    type: 'Vòng Tràng Sinh',
    short: 'Ngưng đọng, khép kín, tĩnh mịch, chiều sâu tư duy và sự kín đáo.',
    detail: 'Không mang nghĩa tử vong tiêu cực mà là sự kết thúc của một chu kỳ hoạt động, thích hợp cho sự nghiên cứu kín kẽ.',
    tip: 'Người có sao Tử thường kín tiếng, suy nghĩ chín chắn trước khi nói.',
  },
  'Mộ': {
    title: 'Mộ',
    type: 'Vòng Tràng Sinh',
    short: 'Chôn cất tích trữ, kho tàng khép lại, tiết kiệm và chắc chắn.',
    detail: 'Chủ về sự tích lũy của cải, tính cách cần cù tiết kiệm, có xu hướng tích sản lâu dài.',
    tip: 'Mộ đóng ở Tài hoặc Điền là điềm tốt cho việc tích lũy bất động sản.',
  },
  'Tuyệt': {
    title: 'Tuyệt',
    type: 'Vòng Tràng Sinh',
    short: 'Rỗng tuyệt, đáy vực trước khi chuyển hóa, sự biến động đổi chiều.',
    detail: 'Năng lượng xuống mức thấp nhất để chuẩn bị bước sang một chu kỳ phôi thai mới.',
    tip: 'Cần sự nhẫn nại vượt qua giai đoạn chuyển giao để tái sinh.',
  },
  'Thai': {
    title: 'Thai',
    type: 'Vòng Tràng Sinh',
    short: 'Thụ thai, hình thành mầm mống ý tưởng mới, hy vọng và sự khởi sắc.',
    detail: 'Tượng trưng cho ý tưởng đang thai nghén, những dự án mới bắt đầu hình thành trong tương lai.',
    tip: 'Chủ về sự sáng tạo, thích ấp ủ những kế hoạch mới mẻ.',
  },
  'Dưỡng': {
    title: 'Dưỡng',
    type: 'Vòng Tràng Sinh',
    short: 'Nuôi dưỡng, bồi đắp, chuẩn bị nội lực để chờ ngày ra đời.',
    detail: 'Giai đoạn tích lũy tri thức, dưỡng dục, được chăm sóc và chuẩn bị nền móng vững vàng.',
    tip: 'Rất tốt cho việc học tập, tu dưỡng đạo đức và tích lũy kinh nghiệm.',
  },
};

/**
 * Tra cứu thông tin theo tên sao hoặc từ khóa
 * Hỗ trợ tìm kiếm thông minh (bỏ ký tự phụ như mã đắc hãm M/V/Đ/B/H, dấu gạch, prefix L.)
 */
export function lookupTuViTerm(rawTerm) {
  if (!rawTerm) return null;
  const cleaned = String(rawTerm).trim();

  // 1. Thử khớp trực tiếp
  if (TUVI_GLOSSARY[cleaned]) {
    return { ...TUVI_GLOSSARY[cleaned], originalKey: cleaned };
  }

  // 2. Tách tên sao từ chuỗi dạng "Tử Vi (M)" hoặc "Thái Dương (H)"
  const starMatch = cleaned.match(/^([^(]+)(?:\s*\(([MVĐBH])\))?/);
  const baseName = starMatch ? starMatch[1].trim() : cleaned;
  const statusCode = starMatch && starMatch[2] ? starMatch[2] : null;

  if (TUVI_GLOSSARY[baseName]) {
    const item = TUVI_GLOSSARY[baseName];
    return {
      ...item,
      statusCode,
      statusLabel: getStatusDescription(statusCode),
      originalKey: cleaned,
    };
  }

  // 3. Xử lý các tiền tố Lưu (L.Kình Dương, L.Thiên Mã...)
  if (baseName.startsWith('L.')) {
    const withoutL = baseName.replace(/^L\.\s*/, '').trim();
    if (TUVI_GLOSSARY[withoutL]) {
      const item = TUVI_GLOSSARY[withoutL];
      return {
        ...item,
        title: `Lưu ${item.title} (L.${withoutL})`,
        short: `Sao Lưu niên hàng năm của ${item.title}. Tác động mạnh trong năm xét vận hạn.`,
        detail: `Hàng năm khi Thái Tuế lưu chuyển, sao Lưu ${item.title} sẽ kích hoạt năng lượng tại cung vị tương ứng, tạo nên biến động thời vận trong 12 tháng.`,
        originalKey: cleaned,
      };
    }
  }

  // 4. Tìm kiếm tương đối trong các Cung (ví dụ: "Mệnh <THÂN>" -> "Cung Mệnh")
  for (const key of Object.keys(TUVI_GLOSSARY)) {
    if (key.startsWith('Cung ') && cleaned.includes(key.replace('Cung ', ''))) {
      return { ...TUVI_GLOSSARY[key], originalKey: cleaned };
    }
  }

  return null;
}

function getStatusDescription(code) {
  switch (code) {
    case 'M': return 'Miếu địa (M) — Tốt nhất, phát huy 100% năng lượng cát lợi';
    case 'V': return 'Vượng địa (V) — Rất tốt, năng lượng mạnh mẽ sáng sủa';
    case 'Đ': return 'Đắc địa (Đ) — Khá tốt, có năng lực vươn lên thành tựu';
    case 'B': return 'Bình hòa (B) — Trung bình, sức mạnh phụ thuộc vào phụ tinh đi kèm';
    case 'H': return 'Hãm địa (H) — Năng lượng bị che mờ, dễ gặp trắc trở hoặc biến động';
    default: return '';
  }
}
