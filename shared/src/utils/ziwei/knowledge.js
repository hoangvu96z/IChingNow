/**
 * Kho Tri Thức Tử Vi Đẩu Số Toàn Diện:
 * 1. 14 Chính Tinh Chuyên Sâu (`MAJOR_STAR_DETAILS`) — Cổ Phú + Thiên Kỷ Nghê Hải Hạ + Đông Y Nhân Kỷ
 * 2. Hợp Hôn & Hợp Tác Chuyên Sâu (`HEMING_KNOWLEDGE`, `STAR_IN_FUQI_GU`, `SIHUA_IN_FUQI_GU`)
 * 3. Thơ & Luận Giải Cân Xương Đoán Số Viên Thiên Cương (`CAN_LUONG_POEMS`, `getCanLuongPoem`)
 * 4. Thư Viện Cổ Thư & Thiên Kỷ (`CLASSICS_LIBRARY`, `searchClassics`)
 * 5. 12 Lá Số Danh Nhân & Cách Cục Kinh Điển (`FAMOUS_CHARTS`)
 */

// ─── 1. 14 CHÍNH TINH CHUYÊN SÂU (CỔ PHÚ + THIÊN KỶ NGHÊ HẢI HẠ + ĐÔNG Y) ─────
export const MAJOR_STAR_DETAILS = {
  'Tử Vi': {
    name: 'Tử Vi',
    nameZh: '紫微',
    element: 'Kỷ Thổ (Âm Thổ)',
    yinYang: 'Âm Thổ',
    huaQi: 'Tôn Quý · Đế Tọa',
    keywords: ['Đế Vương', 'Tôn Quý', 'Thống Lĩnh', 'Độc Lập'],
    classicQuote: 'Cổ quyết: "Tử Vi Đế tọa lâm Mệnh chủ tôn quý, thống lĩnh chúng tinh, giải ách diên thọ." Nam Bắc Sơn Nhân chú: "Tử Vi thủ Mệnh hội Tả Phụ Hữu Bật, tài quan song mỹ, xuất tướng nhập tương; nhược độc tọa vô phụ tắc vi cô quân."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng trong 《Thiên Kỷ》: Tử Vi là Đế tinh (Sao Vua), người có Tử Vi thủ Mệnh khí chất tự tôn, điềm tĩnh, không thích bị người khác áp đặt. Tử Vi bắt buộc phải có Tả Phụ, Hữu Bật hội họp hoặc giáp cung mới thành bậc Quân Vương thực thụ; nếu không có Phụ Bật thì gọi là "Cô Quân Tại Dã" (vua cô độc). Tử Vi sợ nhất Không Kiếp, Kình Đà đồng độ.',
    bestPalaces: 'Cung Mệnh (Ngọ, Thìn, Tuất, Dần, Thân), Cung Quan Lộc',
    worstPalaces: 'Cung Tật Ách, Cung Phu Thê (dễ muộn duyên nếu thiếu Phụ Bật)',
    career: 'Chính giới, lãnh đạo cấp cao, quản trị chiến lược, tự làm chủ doanh nghiệp hoặc đứng đầu tổ chức.',
    relationship: 'Trọng danh dự và sự tôn trọng lẫn nhau, đôi khi hơi cao ngạo hoặc giữ khoảng cách; hợp kết hôn muộn với người chín chắn.',
    wealth: 'Tài lộc bền vững nhờ vị thế và uy tín, giỏi giữ gìn cơ nghiệp và đầu tư giá trị dài hạn.',
    health: 'Thuộc hành Thổ — theo Đông Y Nhân Kỷ cần chú ý hệ Tỳ Vị, tiêu hóa và căng thẳng thần kinh do suy nghĩ đại cuộc.',
  },
  'Thiên Cơ': {
    name: 'Thiên Cơ',
    nameZh: '天机',
    element: 'Ất Mộc (Âm Mộc)',
    yinYang: 'Âm Mộc',
    huaQi: 'Thiện Tinh · Trí Tuệ',
    keywords: ['Mưu Lược', 'Linh Hoạt', 'Tham Mưu', 'Nhạy Bén'],
    classicQuote: 'Cổ quyết: "Thiên Cơ vi thiện tinh, chủ trí tuệ cơ biến, hiếu học đa năng." Toàn Thư viết: "Thiên Cơ cư miếu vượng địa, tinh minh cơ xảo, thiện hoạch định mưu lược."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thiên Cơ là sao Quân Sư, Tham Mưu — ngôi sao thông minh và biến báo nhanh nhạy nhất. Thiên Cơ thuộc Mộc, chủ về vận động của trí não và tứ chi. Nhưng Thiên Cơ Hóa Kỵ lại dễ rơi vào cảnh "nghĩ quá nhiều thành tự trói mình", cần học cách buông bỏ bớt lo âu.',
    bestPalaces: 'Cung Mệnh (Tý, Ngọ, Mão, Dậu), Cung Quan Lộc',
    worstPalaces: 'Cung Phu Thê (nếu gặp Hóa Kỵ hoặc sát tinh)',
    career: 'Chuyên gia công nghệ, kiến trúc sư hệ thống, cố vấn chiến lược, nghiên cứu, tài chính định lượng, quy hoạch.',
    relationship: 'Tâm tư tinh tế nhưng hay suy nghĩ nhiều, cần bạn đời bao dung và cùng chia sẻ đời sống tinh thần.',
    wealth: 'Kiếm tiền bằng chất xám, chuyên môn và giải pháp sáng tạo; dòng tiền luân chuyển linh hoạt.',
    health: 'Thuộc hành Mộc — theo Đông Y chủ về Can Đởm (gan mật), hệ thần kinh, giấc ngủ và gân cơ tứ chi.',
  },
  'Thái Dương': {
    name: 'Thái Dương',
    nameZh: '太阳',
    element: 'Bính Hỏa (Dương Hỏa)',
    yinYang: 'Dương Hỏa',
    huaQi: 'Quý Tinh · Quang Minh',
    keywords: ['Quang Minh', 'Bác Ái', 'Quan Quý', 'Công Chúng'],
    classicQuote: 'Cổ quyết: "Thái Dương cư Ngọ vị nhập miếu, Nhật lệ trung thiên, quang huy đại phóng; cư Mão vị viết Nhật chiếu Lôi Môn, phú quý vinh hiển."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thái Dương là vầng mặt trời chiếu sáng muôn nơi without đòi hỏi báo đáp, đại diện cho người cha, người chồng, con trai và sự nghiệp công chúng. Thái Dương từ cung Dần đến cung Ngọ là mặt trời ban ngày rực rỡ; từ Thân đến Sửu là mặt trời chiều tối cần nỗ lực nhiều hơn.',
    bestPalaces: 'Cung Mệnh (Mão, Thìn, Tỵ, Ngọ), Cung Quan Lộc',
    worstPalaces: 'Cung Phu Thê (nữ mệnh nếu Thái Dương lạc hãm Hóa Kỵ), Cung Tật Ách',
    career: 'Ngoại giao, chính trị, quản lý công, truyền thông, giáo dục, luật pháp, lãnh đạo cộng đồng.',
    relationship: 'Nam mệnh hào sảng trọng nghĩa khí; nữ mệnh có Thái Dương sáng thường độc lập, năng lực mạnh mẽ, hợp bạn đời điềm đạm.',
    wealth: 'Trước trọng danh tiếng và uy tín, tài lộc tự khắc theo sau ("khai sáng cho người trước, lộc đến với mình sau").',
    health: 'Thuộc Dương Hỏa — Đông Y chủ về Tâm mạch (tim, huyết áp),双目 (đôi mắt) và hệ tuần hoàn.',
  },
  'Vũ Khúc': {
    name: 'Vũ Khúc',
    nameZh: '武曲',
    element: 'Tân Kim (Âm Kim)',
    yinYang: 'Âm Kim',
    huaQi: 'Tài Tinh · Quả Quyết',
    keywords: ['Chính Tài', 'Cương Nghị', 'Thực Thi', 'Quyết Đoán'],
    classicQuote: 'Cổ quyết: "Vũ Khúc thuộc Kim, Bắc Đẩu chính tài tinh, tính cương quả quyết, thủ Mệnh tại Thìn Tuất Sửu Mùi tứ mộ địa đại phát tài quan."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Vũ Khúc là Chính Tài Tinh kiêm Tướng Tinh, tính cách thẳng thắn, nói một là một, hành động dứt khoát. Vũ Khúc đóng ở Tài Bạch hay Mệnh tại Thìn Tuất Sửu Mùi cực kỳ vượng tài, nhưng vì tính Kim cương cứng nên đường tình cảm nên kết hôn muộn để đôi bên thấu hiểu nhau.',
    bestPalaces: 'Cung Tài Bạch, Cung Mệnh (Thìn, Tuất, Sửu, Mùi), Cung Quan Lộc',
    worstPalaces: 'Cung Phu Thê (nên muộn lập gia đình)',
    career: 'Tài chính, ngân hàng, đầu tư, kiểm toán, kỹ thuật công nghiệp, quân đội, quản trị vận hành.',
    relationship: 'Thẳng thắn, thực tế, ít nói lời hoa mỹ nhưng hành động có trách nhiệm; hợp người ôn nhu thấu hiểu.',
    wealth: 'Bậc thầy về quản trị dòng tiền và tạo dựng tài sản thực tế, càng làm thực nghiệp càng giàu.',
    health: 'Thuộc hành Kim — Đông Y chủ về Phế (phổi), hệ hô hấp, mũi họng và xương khớp.',
  },
  'Thiên Đồng': {
    name: 'Thiên Đồng',
    nameZh: '天同',
    element: 'Nhâm Thủy (Dương Thủy)',
    yinYang: 'Dương Thủy',
    huaQi: 'Phúc Tinh · Ôn Hòa',
    keywords: ['Phúc Hậu', 'Nhân Hòa', 'Thung Dung', 'Nghệ Thuật'],
    classicQuote: 'Cổ quyết: "Thiên Đồng vi Phúc Đức chi tinh, thủ Mệnh chủ hưởng phúc vô ưu, vi nhân khiêm tốn ôn lương, hảo văn nghệ."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thiên Đồng là Phúc Tinh, người có Thiên Đồng thủ Mệnh tính tình hiền hòa, không thích tranh đoạt gay gắt, đi đến đâu cũng được mọi người quý mến. Thiên Đồng Hóa Lộc là phúc lộc tự nhiên nhất, nhưng cũng cần một chút áp lực để kích phát chí tiến thủ.',
    bestPalaces: 'Cung Phúc Đức, Cung Mệnh, Cung Tử Tức',
    worstPalaces: 'Cung Quan Lộc (nếu thiếu sao Quyền/Lộc kích phát)',
    career: 'Dịch vụ cao cấp, văn hóa nghệ thuật, ẩm thực, du lịch, tâm lý học, y tế cộng đồng, nhân sự.',
    relationship: 'Ngọt ngào, giàu cảm xúc, biết lắng nghe và nhường nhịn; hợp bạn đời có bản lĩnh dẫn dắt.',
    wealth: 'Lộc đến tự nhiên, cơm áo phong lưu, hợp tích lũy an toàn hơn là mạo hiểm.',
    health: 'Thuộc hành Thủy — Đông Y chủ về Thận thủy, bàng quang, nội tiết và tai.',
  },
  'Liêm Trinh': {
    name: 'Liêm Trinh',
    nameZh: '廉贞',
    element: 'Đinh Hỏa (Đới Mộc)',
    yinYang: 'Âm Hỏa',
    huaQi: 'Tù Tinh · Thứ Đào Hoa',
    keywords: ['Chính Trực', 'Quyền Biến', 'Đào Hoa', 'Kỷ Luật'],
    classicQuote: 'Cổ quyết: "Liêm Trinh tại Quan Lộc vi Quan Lộc chủ, tại Mệnh Thân vi thứ đào hoa; hội Thiên Tướng tắc hóa tù vi ấn, chưởng hành chính đại quyền."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Liêm Trinh vừa là sao Quan Lộc (chủ kỷ cương, hành chính), vừa là Thứ Đào Hoa (duyên dáng, nghệ thuật). Liêm Trinh gặp Lộc Tồn hoặc Thiên Phủ, Thiên Tướng thì cực kỳ thanh liêm đắc lực; ngược lại nếu Liêm Trinh Hóa Kỵ gặp sát tinh thì cần tuyệt đối cẩn trọng pháp lý và sức khỏe.',
    bestPalaces: 'Cung Quan Lộc, Cung Mệnh (đồng cung Thiên Phủ hoặc Thiên Tướng)',
    worstPalaces: 'Cung Phu Thê, Cung Tật Ách (khi Hóa Kỵ)',
    career: 'Luật pháp, kiểm sát, quản trị công, thiết kế, nghệ thuật biểu diễn, ngoại giao, công nghệ.',
    relationship: 'Sức hút cá nhân mạnh, yêu ghét rõ ràng; cần giữ sự điềm tĩnh và bao dung trong hôn nhân.',
    wealth: 'Tài lộc gắn liền với chức vụ, chuyên môn và uy tín cá nhân; Liêm Trinh Hóa Lộc cực vượng tài.',
    health: 'Thuộc Âm Hỏa — Đông Y chủ về Tâm huyết, hệ tuần hoàn máu, miễn dịch và nhiệt độc.',
  },
  'Thiên Phủ': {
    name: 'Thiên Phủ',
    nameZh: '天府',
    element: 'Mậu Thổ (Dương Thổ)',
    yinYang: 'Dương Thổ',
    huaQi: 'Lệnh Tinh · Tài Khố',
    keywords: ['Tài Khố', 'Vững Chãi', 'Bao Dung', 'Bảo Toàn'],
    classicQuote: 'Cổ quyết: "Thiên Phủ vi Nam Đẩu chi chủ, nãi Lộc khố chi tinh; thủ Mệnh giả ôn lương đôn hậu, thiện thủ thành tích tài."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thiên Phủ là Nam Đẩu Đế Tinh kiêm Kho Tài Lộc (Tài Khố). Người Thiên Phủ thủ Mệnh chín chắn, trọng chữ tín, giỏi quản lý tài sản và giữ gìn đại cuộc. Thiên Phủ thích nhất gặp Lộc Tồn (kho đầy lộc) và kỵ nhất gặp Địa Không, Địa Kiếp ("Lộ Không Khố" — kho rỗng).',
    bestPalaces: 'Cung Tài Bạch, Cung Điền Trạch, Cung Mệnh',
    worstPalaces: 'Cung nào gặp Địa Không, Địa Kiếp đồng độ',
    career: 'Ngân hàng, quản lý quỹ, bất động sản, giám đốc tài chính (CFO), quản trị hành chính cấp cao.',
    relationship: 'Trọng gia đình, chung thủy, mang lại cảm giác an toàn vững chắc cho người bạn đời.',
    wealth: 'Kho tiền của trời — cực kỳ giỏi tích lũy tài sản, bất động sản và quỹ dự phòng.',
    health: 'Thuộc Dương Thổ — Đông Y chủ về Vị (dạ dày), hệ tiêu hóa và cơ bắp.',
  },
  'Thái Âm': {
    name: 'Thái Âm',
    nameZh: '太阴',
    element: 'Quý Thủy (Âm Thủy)',
    yinYang: 'Âm Thủy',
    huaQi: 'Phú Tinh · Nhu Mỹ',
    keywords: ['Tài Phú', 'Điền Sản', 'Tinh Tế', 'Nội Tâm'],
    classicQuote: 'Cổ quyết: "Thái Âm vi Thủy chi tinh, hóa khí viết Phú, vi Tài Bạch Điền Trạch chủ; cư Dậu Tuất Hợi Tý đắc viên hàm quang."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thái Âm là vầng trăng, chủ về Phú (sự giàu có tích lũy) và đại diện cho người mẹ, người vợ, con gái. Thái Âm từ cung Dậu đến cung Sửu là trăng ban đêm sáng vằng vặc, chủ về giàu có điền sản và tâm hồn thanh nhã.',
    bestPalaces: 'Cung Điền Trạch, Cung Tài Bạch, Cung Mệnh (Dậu, Tuất, Hợi, Tý)',
    worstPalaces: 'Cung Mệnh / Phu Thê (nếu lạc hãm tại Mão, Thìn, Tỵ, Ngọ gặp Hóa Kỵ)',
    career: 'Đầu tư tài chính, bất động sản, văn học nghệ thuật, thiết kế nội thất, chăm sóc sức khỏe, giáo dục.',
    relationship: 'Dịu dàng, sâu sắc, giàu lòng trắc ẩn; nam mệnh đắc Thái Âm miếu vượng dễ cưới được hiền thê.',
    wealth: 'Chủ về tích lũy tài sản tĩnh (bất động sản, cổ phần dài hạn), giàu ngầm và bền vững.',
    health: 'Thuộc Âm Thủy — Đông Y chủ về Thận âm, huyết dịch, nội tiết tố và mắt trái/phải.',
  },
  'Tham Lang': {
    name: 'Tham Lang',
    nameZh: '贪狼',
    element: 'Giáp Mộc (Căn Thủy)',
    yinYang: 'Dương Mộc đới Thủy',
    huaQi: 'Đào Hoa · Đa Nghệ',
    keywords: ['Đa Tài', 'Giao Tế', 'Khát Vọng', 'Biến Hóa'],
    classicQuote: 'Cổ quyết: "Tham Lang Bắc Đẩu đệ nhất tinh, giải ách chi thần, đa tài đa nghệ; ngộ Hỏa Linh tắc hoạnh phát danh chấn chư bang."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Tham Lang là ngôi sao đa tài đa nghệ, giỏi giao tế ứng xử, hiểu lòng người và có sức hút lớn. Tham Lang đồng cung Vũ Khúc hoặc gặp Hỏa Tinh, Linh Tinh thì phát đạt cực mạnh từ sau tuổi trung niên; tuổi trẻ nên tập trung rèn luyện chuyên môn.',
    bestPalaces: 'Cung Mệnh (Sửu, Mùi, Thìn, Tuất), Cung Quan Lộc, Cung Tài Bạch (khi hội Hỏa/Linh)',
    worstPalaces: 'Cung Phu Thê (dễ đào hoa nhiều mối nếu không muộn hôn)',
    career: 'Quan hệ công chúng (PR), giải trí, truyền thông, thương mại, ngoại giao, nghệ thuật, nghiên cứu huyền học.',
    relationship: 'Duyên dáng, lãng mạn, nhiều người theo đuổi; kết hôn muộn và chọn bạn đời chín chắn sẽ bền lâu.',
    wealth: 'Nhạy bén với xu hướng thị trường, dễ có nguồn thu đột phá khi gặp vận Hỏa Tham / Linh Tham.',
    health: 'Gốc Thủy ngọn Mộc — Đông Y chủ về Can Thận đồng nguyên, cần giữ sinh hoạt điều độ.',
  },
  'Cự Môn': {
    name: 'Cự Môn',
    nameZh: '巨门',
    element: 'Quý Thủy (Đới Kim)',
    yinYang: 'Âm Thủy',
    huaQi: 'Ám Tinh · Ngôn Ngữ',
    keywords: ['Hùng Biện', 'Phân Tích', 'Chuyên Sâu', 'Ngôn Từ'],
    classicQuote: 'Cổ quyết: "Cự Môn Bắc Đẩu đệ nhị tinh, hóa khí vi Ám, chủ khẩu tài biện luận; đắc Thái Dương chiếu diệu tắc ám khí tiêu tán."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Cự Môn chủ về ngôn ngữ, phản biện và khả năng đào sâu tìm tòi chân tướng. Nếu Cự Môn Hóa Lộc, Hóa Quyền hoặc gặp Thái Dương sáng chiếu thì biến thành tài ăn nói xuất chúng (luật sư, giảng viên, diễn giả); nếu Hóa Kỵ thì cần tránh tranh cãi thị phi.',
    bestPalaces: 'Cung Mệnh (Tý, Ngọ, Dần,卯), Cung Quan Lộc',
    worstPalaces: 'Cung Huynh Đệ / Nô Bộc / Phu Thê (khi Hóa Kỵ dễ lời qua tiếng lại)',
    career: 'Luật sư, thẩm phán, giáo sư, nhà báo, MC, chuyên gia đàm phán, ngoại ngữ, kiểm định chất lượng.',
    relationship: 'Thẳng thắn và hay phân tích lý lẽ; trong tình cảm nên dùng lời nói ấm áp khích lệ thay vì bắt lỗi.',
    wealth: 'Kiếm tiền bằng khẩu tài, uy tín chuyên gia và tri thức độc quyền ("khẩu thiệt sinh tài").',
    health: 'Đông Y chủ về đường tiêu hóa trên (thực quản, dạ dày), vòm họng và hô hấp.',
  },
  'Thiên Tướng': {
    name: 'Thiên Tướng',
    nameZh: '天相',
    element: 'Nhâm Thủy (Dương Thủy)',
    yinYang: 'Dương Thủy',
    huaQi: 'Ấn Tinh · Chưởng Ấn',
    keywords: ['Ấn Tín', 'Công Minh', 'Điều Phối', 'Trọng Nghĩa'],
    classicQuote: 'Cổ quyết: "Thiên Tướng Nam Đẩu ti tước chi tinh, hóa khí vi Ấn, chủ y thực phong túc, ngôn ngữ thành thực, sự bất hư ngụy."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thiên Tướng là Ấn Tinh (người giữ ấn tín của nhà vua), phong thái đĩnh đạc, công bằng, giữ chữ tín và luôn sẵn lòng giúp đỡ người khác. Thiên Tướng hợp nhất làm phó tướng đắc lực, giám đốc điều hành hoặc nắm giữ con dấu pháp nhân.',
    bestPalaces: 'Cung Quan Lộc, Cung Mệnh, Cung Phu Thê',
    worstPalaces: 'Khi bị Hình Kỵ giáp Ấn mà thiếu cát tinh cứu giải',
    career: 'Quản trị nhân sự, chánh văn phòng, thẩm định, hành chính công, ngoại giao, dịch vụ tài chính.',
    relationship: 'Chung thủy, biết chăm lo cho gia đình, thường nên duyên từ bạn bè hoặc đồng nghiệp thân thiết.',
    wealth: 'Thu nhập ổn định, lộc ăn mặc đầy đủ, tài chính vững vàng nhờ chữ tín.',
    health: 'Thuộc Dương Thủy — Đông Y chủ về hệ bài tiết, bàng quang, thận và da.',
  },
  'Thiên Lương': {
    name: 'Thiên Lương',
    nameZh: '天梁',
    element: 'Mậu Thổ (Dương Thổ)',
    yinYang: 'Dương Thổ',
    huaQi: 'Ấm Tinh · Thọ Tinh',
    keywords: ['Che Chở', 'Thanh Cao', 'Y Dược', 'Trưởng Bối'],
    classicQuote: 'Cổ quyết: "Thiên Lương Nam Đẩu ti thọ chi tinh, hóa khí vi Ấm, chủ phùng hung hóa cát, thọ nguyên trường cửu."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thiên Lương là Ấm Tinh (bóng cây đại thụ che chở) và Thọ Tinh, đại diện cho y đức, tôn giáo, giáo dục và sự thanh liêm. Người có Thiên Lương thủ Mệnh có nguyên tắc đạo đức cao, gặp nguy hiểm thường có quý nhân hoặc phúc ấm tổ tiên hóa giải.',
    bestPalaces: 'Cung Mệnh (Ngọ, Tý, Dần, Thân, Mão), Cung Phúc Đức, Cung Phụ Mẫu',
    worstPalaces: 'Cung Tài Bạch (vì Thiên Lương trọng danh dự hơn tiền bạc, hợp làm chuyên môn hơn đầu cơ)',
    career: 'Bác sĩ, dược sĩ, giáo viên, thanh tra, kiểm toán, công tác xã hội, nghiên cứu học thuật.',
    relationship: 'Chín chắn, giàu trách nhiệm, thích che chở cho bạn đời; hợp kết hôn với người chững chạc.',
    wealth: 'Tài lộc đến từ danh tiếng chuyên môn và phúc đức tích lũy, không hợp đầu cơ lướt sóng.',
    health: 'Thuộc Dương Thổ — Đông Y chủ về Tỳ Vị, lồng ngực và sức đề kháng tổng thể (sao giải bệnh).',
  },
  'Thất Sát': {
    name: 'Thất Sát',
    nameZh: '七杀',
    element: 'Canh Kim (Đới Hỏa)',
    yinYang: 'Dương Kim đới Hỏa',
    huaQi: 'Tướng Tinh · Quyền Bính',
    keywords: ['Quả Quyết', 'Uy Dũng', 'Tiên Phong', 'Độc Lập'],
    classicQuote: 'Cổ quyết: "Thất Sát Nam Đẩu đệ lục tinh, nãi thượng tướng chi tinh, chủ uy vũ cương liệt; cư Dần Thân Tý Ngọ vi Thất Sát triều đẩu, tước lộc vinh xương."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Thất Sát là vị Đại Tướng ngoài chiến trường, tính cách cương nghị, quyết đoán, càng gặp nghịch cảnh càng mạnh mẽ. Thất Sát thủ Mệnh miếu vượng lại hội Lộc Quyền Khoa thì lập nên đại nghiệp hiển hách; nhưng trong tình cảm cần học cách lắng nghe nhẹ nhàng.',
    bestPalaces: 'Cung Mệnh (Dần, Thân, Tý, Ngọ), Cung Quan Lộc',
    worstPalaces: 'Cung Phu Thê (nên kết hôn muộn sau 30 tuổi)',
    career: 'Quân đội, công an, CEO khởi nghiệp, phẫu thuật ngoại khoa, quản lý dự án đột phá, kỹ thuật nặng.',
    relationship: 'Yêu nhanh, dứt khoát, trọng hành động hơn lời nói; cần không gian độc lập và sự tôn trọng.',
    wealth: 'Dám đánh lớn thắng lớn, tạo dựng tài sản qua những thương vụ hoặc bước ngoặt chiến lược.',
    health: 'Thuộc Kim đới Hỏa — Đông Y chủ về Phế (phổi), Đại trường (ruột già) và cần phòng tránh chấn thương.',
  },
  'Phá Quân': {
    name: 'Phá Quân',
    nameZh: '破军',
    element: 'Quý Thủy (Âm Thủy)',
    yinYang: 'Âm Thủy',
    huaQi: 'Hao Tinh · Tiên Phong',
    keywords: ['Phá Cũ Lập Mới', 'Đột Phá', 'Sáng Tạo', 'Khai Hoang'],
    classicQuote: 'Cổ quyết: "Phá Quân Bắc Đẩu đệ thất tinh, hóa khí viết Hao, vi tiền bộ tiên phong; cư Tý Ngọ miếu địa viết Anh Tinh Nhập Miếu."',
    niHaixiaQuote: 'Nghê Hải Hạ giảng: Phá Quân là đội quân tiên phong mở đường — "không phá cái cũ thì không lập được cái mới". Phá Quân sợ nhất sự trì trệ lặp đi lặp lại; khi Phá Quân đắc Hóa Lộc hoặc Hóa Quyền tại Tý/Ngọ thì biến thành bậc kỳ tài cải cách, đổi mới sáng tạo.',
    bestPalaces: 'Cung Mệnh (Tý, Ngọ), Cung Quan Lộc (khi Hóa Lộc / Hóa Quyền)',
    worstPalaces: 'Cung Phu Thê, Cung Phúc Đức (dễ vất vả lo toan)',
    career: 'Đổi mới sáng tạo (R&D), tái cấu trúc doanh nghiệp, công nghệ đột phá, logistics, nghệ thuật đương đại.',
    relationship: 'Giàu cá tính, không thích sự ràng buộc khuôn sáo; hợp kết hôn muộn với người cùng chí hướng.',
    wealth: 'Tài chính theo chu kỳ "tiền phá hậu thành" — đầu tư lớn vào dự án mới rồi thu hoạch thành quả lớn.',
    health: 'Thuộc Âm Thủy — Đông Y chủ về Thận thủy, hệ sinh dục - tiết niệu và tủy xương.',
  },
};

export const MINOR_STAR_DETAILS = {
  'Văn Xương': {
    name: 'Văn Xương',
    element: 'Tân Kim',
    type: 'Cát Tinh (Lục Cát)',
    description: 'Chủ về khoa giáp, học thuật chính quy, văn chương, lý luận và hợp đồng văn thư. Cổ quyết: "Văn Xương khoa giáp, chủ văn chương hiển đạt."',
  },
  'Văn Khúc': {
    name: 'Văn Khúc',
    element: 'Quý Thủy',
    type: 'Cát Tinh (Lục Cát)',
    description: 'Chủ về tài hoa nghệ thuật, hùng biện, cảm thụ âm nhạc, ngoại ngữ và trí tuệ linh hoạt. Cổ quyết: "Văn Khúc biện tài, đa học đa năng."',
  },
  'Tả Phụ': {
    name: 'Tả Phụ',
    element: 'Mậu Thổ',
    type: 'Cát Tinh (Lục Cát)',
    description: 'Sao phò tá Dương Thổ, chủ về đồng nghiệp, cấp dưới và quý nhân đồng trang lứa trợ lực đắc lực.',
  },
  'Hữu Bật': {
    name: 'Hữu Bật',
    element: 'Quý Thủy',
    type: 'Cát Tinh (Lục Cát)',
    description: 'Sao phò tá Âm Thủy, chủ về sự hỗ trợ tinh tế, hòa giải và nhân duyên tốt đẹp trong tập thể.',
  },
  'Thiên Khôi': {
    name: 'Thiên Khôi',
    element: 'Bính Hỏa',
    type: 'Quý Tinh (Lục Cát)',
    description: 'Thiên Ất Quý Nhân (Dương quý), chủ về cơ hội nâng đỡ trực tiếp từ cấp trên, trưởng bối và thi cử đỗ đạt.',
  },
  'Thiên Việt': {
    name: 'Thiên Việt',
    element: 'Đinh Hỏa',
    type: 'Quý Tinh (Lục Cát)',
    description: 'Ngọc Đường Quý Nhân (Âm quý), chủ về quý nhân ngầm giúp đỡ, hóa giải nguy nan đúng thời khắc quan trọng.',
  },
  'Lộc Tồn': {
    name: 'Lộc Tồn',
    element: 'Kỷ Thổ',
    type: 'Tài Lộc Tinh',
    description: 'Thiên Lộc của trời ban, chủ về tích lũy tài sản bền vững, điềm đạm, cẩn trọng và giải trừ tai ách.',
  },
  'Thiên Mã': {
    name: 'Thiên Mã',
    element: 'Bính Hỏa',
    type: 'Dịch Mã Tinh',
    description: 'Chủ về dịch chuyển, xuất ngoại, nhạy bén thời cuộc; gặp Lộc Tồn / Hóa Lộc thành cách Lộc Mã Giao Trì đại phát.',
  },
  'Kình Dương': {
    name: 'Kình Dương',
    element: 'Canh Kim',
    type: 'Sát Tinh (Lục Sát)',
    description: 'Chủ về cạnh tranh quyết liệt, hành động sắc bén; nhập miếu tại Thìn Tuất Sửu Mùi phát võ quý, lạc hãm cần phòng xung đột.',
  },
  'Đà La': {
    name: 'Đà La',
    element: 'Tân Kim',
    type: 'Sát Tinh (Lục Sát)',
    description: 'Chủ về sự kiên trì bền bỉ hoặc trì hoãn ngầm; hợp nghiên cứu kỹ thuật sâu, cần tránh để tâm tư dây dưa muộn phiền.',
  },
  'Hỏa Tinh': {
    name: 'Hỏa Tinh',
    element: 'Bính Hỏa',
    type: 'Sát Tinh (Lục Sát)',
    description: 'Chủ về bộc phát nhanh mạnh, nhiệt huyết; hội Tham Lang thành Hỏa Tham Cách hoạnh phát.',
  },
  'Linh Tinh': {
    name: 'Linh Tinh',
    element: 'Đinh Hỏa',
    type: 'Sát Tinh (Lục Sát)',
    description: 'Chủ về phản ứng nhạy bén, mưu tính sâu; hội Tham Lang thành Linh Tham Cách phát đạt bất ngờ.',
  },
  'Địa Không': {
    name: 'Địa Không',
    element: 'Đinh Hỏa',
    type: 'Không Vong (Lục Sát)',
    description: 'Chủ về tư duy vượt khuôn mẫu, triết lý và sáng tạo đột phá; cần quản trị rủi ro tài chính thực tế.',
  },
  'Địa Kiếp': {
    name: 'Địa Kiếp',
    element: 'Bính Hỏa',
    type: 'Không Vong (Lục Sát)',
    description: 'Chủ về hành động táo bạo, phá cách; hợp lĩnh vực công nghệ mới hoặc nghệ thuật độc bản, tránh đầu cơ mạo hiểm.',
  },
};

export function getStarDetail(starName) {
  if (!starName) return null;
  const clean = String(starName).replace(/^L\./, '').split('(')[0].trim();
  return MAJOR_STAR_DETAILS[clean] || MINOR_STAR_DETAILS[clean] || null;
}

// ─── 2. HỢP HÔN & HỢP TÁC CHUYÊN SÂU (`HEMING_KNOWLEDGE`) ────────────────────
export const STAR_IN_FUQI_GU = {
  'Tử Vi': {
    summary: 'Bạn đời khí chất tự chủ, có năng lực, hôn nhân bền vững trên nền tảng tôn trọng lẫn nhau.',
    good: 'Tam phương hội Tả Phụ Hữu Bật: bạn đời tài đức vẹn toàn, sau kết hôn sự nghiệp cùng thăng tiến.',
    bad: 'Cô quân thiếu Phụ Bật: đôi bên dễ giữ cái tôi cao; cần chủ động chia sẻ thay vì im lặng.',
    spouseTraits: 'Phong thái đĩnh đạc, có chính kiến, trọng danh dự và có năng lực quản lý.',
    timing: 'Hợp kết hôn muộn (nam từ 29–30 tuổi, nữ từ 27 tuổi trở lên) để cả hai đủ độ chín.',
    niQuote: 'Nghê Sư: "Tử Vi cư Phu Thê, kết hôn muộn thì vợ chồng tôn kính nhau như khách quý, tình nghĩa bền lâu."',
  },
  'Thiên Cơ': {
    summary: 'Bạn đời thông minh, linh hoạt; hợp phối ngẫu có khoảng cách tuổi tác để bù trừ.',
    good: 'Hội Lộc Tồn, Hóa Lộc hoặc Thái Âm: đời sống tinh thần phong phú, thấu hiểu tâm ý nhau.',
    bad: 'Gặp Hóa Kỵ hoặc Tứ Sát: dễ suy nghĩ nhiều sinh hiểu lầm, cần đối thoại thẳng thắn.',
    spouseTraits: 'Nhạy bén, hiếu học, nhiều ý tưởng sáng tạo, yêu thích triết lý và nghệ thuật.',
    timing: 'Hợp bạn đời chênh lệch từ 4–6 tuổi trở lên để tăng tính ổn định.',
    niQuote: 'Nghê Sư: "Thiên Cơ linh động, chọn người bạn đời chênh tuổi sẽ giữ được sự cân bằng tuyệt vời."',
  },
  'Thái Dương': {
    summary: 'Nam mệnh được vợ hiền đảm đang, nữ mệnh gặp chồng quang minh hào sảng.',
    good: 'Miếu vượng (từ Mão đến Ngọ): bạn đời thành đạt, rộng lượng, nâng đỡ gia đạo.',
    bad: 'Lạc hãm gặp Hóa Kỵ: cần quan tâm chăm sóc sức khỏe của người bạn đời và tránh áp đặt.',
    spouseTraits: 'Cởi mở, nhiệt tình, trọng chữ tín, có trách nhiệm với gia đình và xã hội.',
    timing: 'Giữ sự lãng mạn và tôn trọng không gian riêng giúp hôn nhân luôn ấm áp.',
    niQuote: 'Nghê Sư: "Thái Dương miếu vượng ở Phu Thê là ánh nắng ấm áp chiếu vào gia đình."',
  },
  'Vũ Khúc': {
    summary: 'Bạn đời thực tế, giỏi tài chính, tính cách độc lập; rất hợp kết hôn muộn.',
    good: 'Đắc Hóa Lộc, Hóa Quyền hoặc Lộc Tồn: vợ chồng đồng lòng làm giàu, kinh tế vững vàng.',
    bad: 'Vũ Khúc Hóa Kỵ hoặc gặp sát tinh: lời nói quá thẳng dễ làm tổn thương cảm xúc nhau.',
    spouseTraits: 'Nghị lực, quyết đoán, giỏi kiếm tiền và quản lý tài sản, trọng hành động thực tế.',
    timing: 'Nên kết hôn sau 29–30 tuổi khi sự nghiệp đã định hình.',
    niQuote: 'Nghê Sư: "Hệ Vũ Khúc ở Phu Thê cứ muộn lập gia đình thì tài lộc và tình nghĩa đều vẹn toàn."',
  },
  'Thiên Đồng': {
    summary: 'Bạn đời hiền hòa, giàu tình cảm, gia đạo êm ấm vui vẻ.',
    good: 'Hội Hóa Lộc, Lộc Tồn hoặc Thái Âm: hôn nhân ngọt ngào, gia đình hạnh phúc sung túc.',
    bad: 'Gặp Hóa Kỵ hoặc sát tinh: đôi khi thiếu quyết đoán, cần cùng nhau lập kế hoạch rõ ràng.',
    spouseTraits: 'Nhân hậu, lạc quan, yêu đời, biết chiều chuộng và giữ hòa khí trong nhà.',
    timing: 'Hợp phối ngẫu chênh lệch tuổi hoặc tính cách một cương một nhu bổ trợ.',
  },
  'Liêm Trinh': {
    summary: 'Tình cảm mãnh liệt, bạn đời có cá tính và sức hút riêng; cần sự điềm đạm để giữ lửa.',
    good: 'Đồng cung Thiên Phủ hoặc Thiên Tướng: bạn đời chín chắn, biết dung hòa cảm xúc và lý trí.',
    bad: 'Gặp Hóa Kỵ hoặc sát tinh: dễ xảy ra ghen tuông hoặc tranh chấp; cần bao dung và tin tưởng.',
    spouseTraits: 'Ngoại hình thu hút, tài hoa, giao tiếp giỏi, trọng tình cảm.',
    timing: 'Kết hôn muộn hoặc chọn người bạn đời điềm tĩnh sẽ hóa giải mọi sóng gió.',
    niQuote: 'Nghê Sư: "Liêm Trinh gặp Thiên Phủ, Thiên Tướng ở Phu Thê thì tình nghĩa vợ chồng gắn bó bền chặt."',
  },
  'Thiên Phủ': {
    summary: 'Bạn đời đôn hậu, giỏi vun vén tài chính, hôn nhân ổn định lâu dài.',
    good: 'Hội Lộc Tồn, Hóa Lộc, Tả Hữu: gia sản sung túc, vợ chồng tương trợ đắc lực.',
    bad: 'Gặp Không Kiếp: cần thống nhất kế hoạch chi tiêu và đầu tư chung.',
    spouseTraits: 'Điềm đạm, bao dung, coi trọng sự an toàn của gia đình và giỏi tích lũy.',
    timing: 'Tình duyên bền bỉ, càng chung sống lâu năm càng gắn kết.',
  },
  'Thái Âm': {
    summary: 'Bạn đời dịu dàng, tinh tế, biết chăm chút tổ ấm và tích lũy điền sản.',
    good: 'Miếu vượng (Dậu đến Sửu) hội cát tinh: nam đắc hiền thê mỹ mạo, nữ đắc lương phu tinh tế.',
    bad: 'Lạc hãm gặp Hóa Kỵ: cần khéo léo dung hòa mối quan hệ giữa đôi bên gia đình.',
    spouseTraits: 'Nhẹ nhàng, sâu sắc, giàu cảm xúc nghệ thuật và chu đáo với con cái.',
    timing: 'Rất hợp cùng nhau tích lũy bất động sản và xây dựng tổ ấm.',
    niQuote: 'Nghê Sư: "Thái Âm nhập miếu ở Phu Thê là phúc khí lớn của gia đạo."',
  },
  'Tham Lang': {
    summary: 'Bạn đời đa tài, duyên dáng, giỏi giao际; cần cùng nhau làm mới đời sống hôn nhân.',
    good: 'Hội Hóa Lộc, Hóa Quyền hoặc Hỏa/Linh: bạn đời năng động, mang lại nguồn lực xã hội lớn.',
    bad: 'Nhiều sao đào hoa hội họp: cần giữ sự minh bạch và tin cậy trong quan hệ xã hội.',
    spouseTraits: 'Hoạt bát, nghệ thuật, giỏi ngoại giao và nắm bắt xu hướng.',
    timing: 'Kết hôn muộn sau khi đã trải nghiệm cuộc sống giúp hôn nhân vững bền.',
    niQuote: 'Nghê Sư: "Tham Lang ở Ngọ là văn tinh võ cách, bạn đời rất có bản lĩnh sự nghiệp."',
  },
  'Cự Môn': {
    summary: 'Bạn đời sắc sảo, có tài ngôn ngữ; chìa khóa hạnh phúc nằm ở sự lắng nghe.',
    good: 'Đồng cung hoặc hội Thái Dương sáng, Hóa Lộc, Hóa Quyền: vợ chồng cùng bàn bạc thấu đáo mọi việc.',
    bad: 'Cự Môn Hóa Kỵ: tránh tranh luận hơn thua chuyện nhỏ nhặt trong gia đình.',
    spouseTraits: 'Tư duy phản biện tốt, thẳng thắn, giỏi chuyên môn nhưng nội tâm sâu nặng tình nghĩa.',
    timing: 'Hợp người bạn đời làm nghề giáo dục, luật, truyền thông hoặc nghiên cứu.',
  },
  'Thiên Tướng': {
    summary: 'Lương duyên "thân càng thêm thân", vợ chồng đồng hành như tri kỷ.',
    good: 'Hội Tả Hữu, Khôi Việt, Hóa Lộc: hôn nhân mẫu mực, bạn đời trọng chữ tín và chu toàn.',
    bad: 'Gặp Hình Kỵ giáp: cần chia sẻ áp lực công việc để tránh dồn nén cảm xúc.',
    spouseTraits: 'Công bằng, lịch thiệp, ưa hòa bình, là hậu phương cực kỳ đáng tin cậy.',
    timing: 'Thường quen biết qua học tập, công việc hoặc người thân giới thiệu.',
  },
  'Thiên Lương': {
    summary: 'Bạn đời chín chắn, giàu lòng nhân ái và tinh thần trách nhiệm cao.',
    good: 'Hội Thái Dương sáng, Hóa Lộc, Hóa Khoa: vợ chồng tương kính, gắn bó vượt qua mọi thử thách.',
    bad: 'Gặp Hóa Kỵ hoặc sát tinh: đôi khi hơi nguyên tắc, cần thêm sự mềm mỏng lãng mạn.',
    spouseTraits: 'Đức độ, điềm tĩnh, thích chăm sóc và bảo vệ người thân.',
    timing: 'Sau những thử thách ban đầu, khi đã thành hôn thì vô cùng bền chặt.',
  },
  'Thất Sát': {
    summary: 'Bạn đời bản lĩnh, độc lập, quyết đoán; cần tôn trọng không gian sự nghiệp của nhau.',
    good: 'Miếu vượng hội Lộc Quyền: bạn đời là người tiên phong thành đạt, gánh vác việc lớn.',
    bad: 'Gặp nhiều sát tinh: tránh nóng nảy áp đặt; đôi bên nên giữ nhịp sống năng động.',
    spouseTraits: 'Mạnh mẽ, dám nghĩ dám làm, trọng chữ tín và ghét sự giả dối.',
    timing: 'Nên kết hôn muộn sau tuổi 30 hoặc chọn công việc thường xuyên đổi mới.',
    niQuote: 'Nghê Sư: "Thất Sát cư Phu Thê hợp với người bạn đời có sự nghiệp độc lập, tôn trọng tự do của nhau."',
  },
  'Phá Quân': {
    summary: 'Tình yêu nồng nhiệt, dám vượt qua định kiến; hợp phong cách sống hiện đại.',
    good: 'Đắc Hóa Lộc, Hóa Quyền: cùng nhau khởi nghiệp hoặc vượt qua biến cố để dựng xây cơ đồ.',
    bad: 'Gặp Hóa Kỵ hoặc sát tinh: cần kiên nhẫn vun đắp sự ổn định sau giai đoạn nhiệt huyết ban đầu.',
    spouseTraits: 'Cá tính mạnh, sáng tạo, dám đột phá và hết lòng vì người mình yêu.',
    timing: 'Trải qua thời gian tìm hiểu kỹ lưỡng trước khi kết hôn sẽ giữ được hạnh phúc lâu dài.',
  },
};

export const SIHUA_IN_FUQI_GU = {
  'Hóa Lộc': 'Duyên tiền định ngọt ngào, bạn đời lạc quan, sau khi kết hôn tài vận của cả hai cùng khởi sắc.',
  'Hóa Quyền': 'Bạn đời có bản lĩnh chủ động và năng lực quyết đoán; đôi bên nên phân công rõ vai trò trong gia đình.',
  'Hóa Khoa': 'Vợ chồng tôn trọng nhau, nói chuyện hợp ý, bạn đời có học thức và mang lại quý nhân cho gia đạo.',
  'Hóa Kỵ': 'Mối duyên sâu nặng nhiều trăn trở (nợ duyên tiền kiếp), càng quan tâm càng dễ lo lắng; cần học cách bao dung và buông bớt cầu toàn.',
};

export const HEMING_METHODOLOGY = [
  {
    step: 1,
    title: 'Tam Cung Liên Tham (Mệnh · Phu Thê · Phúc Đức)',
    principle: 'Khẩu quyết Thiên Kỷ: "Xem hôn nhân chỉ nhìn cung Phu Thê là thiếu sót lớn, bắt buộc phải tham chiếu đồng thời cung Phúc Đức và cung Mệnh." Cung Phu Thê cho biết hình mẫu và cách tương tác với bạn đời; cung Phúc Đức quyết định chiều sâu tâm hồn và độ bền vững trọn đời.',
  },
  {
    step: 2,
    title: 'Chính Tinh Tương Chiếu (Thiên Tác Chi Hợp)',
    principle: 'Nếu Chính Tinh cung Phu Thê của người A trùng hoặc cùng hệ với Chính Tinh cung Mệnh/Tam Phương của người B (và ngược lại), đó là dấu hiệu "Thiên Tác Chi Hợp" — hai người sinh ra đã mang tần số năng lượng khớp với hình mẫu lý tưởng của nhau.',
  },
  {
    step: 3,
    title: 'Nhật Nguyệt & Âm Dương Điều Hòa',
    principle: 'Xem trạng thái miếu/hãm của Thái Dương và Thái Âm trên hai lá số cùng sự tương sinh Ngũ Hành Bản Mệnh Nạp Âm và Ngũ Hành Cục để đánh giá nền tảng sinh khí dài hạn.',
  },
  {
    step: 4,
    title: 'Phi Hóa Tương Tham (Tứ Hóa Bay Qua Lại Giữa 2 Lá Số)',
    principle: 'Kiểm tra Can Năm Sinh, Can Cung Mệnh và Can Cung Phu Thê của người A phi Hóa Lộc / Hóa Quyền / Hóa Khoa / Hóa Kỵ vào cung Mệnh, Phu Thê, Phúc Đức, Tài Bạch của người B và ngược lại. Hóa Lộc/Khoa nhập Mệnh/Phu Thê đối phương là trợ duyên lớn; Hóa Kỵ nhập thì cần thấu hiểu để hóa giải áp lực.',
  },
  {
    step: 5,
    title: 'Đồng Bộ Đại Hạn & Lưu Niên',
    principle: 'So sánh nhịp vận hạn 10 năm (Đại Hạn) và năm xem (Lưu Niên) của hai người: khi một người gặp vận thử thách mà người kia đang ở Đại Hạn đắc Lộc/Quyền thì người kia chính là điểm tựa nâng đỡ cả gia đình.',
  },
];

export const HEMING_KNOWLEDGE = {
  STAR_IN_FUQI_GU,
  SIHUA_IN_FUQI_GU,
  HEMING_METHODOLOGY,
};

// ─── 3. THƠ & GIẢI NGHĨA CÂN XƯƠNG ĐOÁN SỐ VIÊN THIÊN CƯƠNG ─────────────────
export const CAN_LUONG_POEMS = {
  '2.1': {
    poem: 'Nhị lượng nhất chỉ mệnh cô hàn, y thực bôn ba sự sự nan. Nhược đắc khổ tâm cần kiệm thủ, vãn niên phương đắc bảo bình an.',
    meaning: 'Mệnh 2 lượng 1 chỉ tiền vận vất vả bôn ba, tự lực cánh sinh. Nhờ ý chí kiên cường, chăm chỉ tích lũy và giữ tâm thiện lành nên hậu vận an ổn.',
    tier: 'Tự Lập Kiên Cường',
  },
  '2.2': {
    poem: 'Thân hàn cốt lạnh khổ linh đinh, nhật nhật bôn ba sự bất thành. Đợi đến trung niên vận chuyển thái, y lương phương đắc túc bình sinh.',
    meaning: 'Tiền vận nhiều thử thách, phải tự tay bươn chải. Từ trung niên trở đi vận thế chuyển biến sáng sủa, cơm áo đủ đầy.',
    tier: 'Tiền Khổ Hậu An',
  },
  '2.5': {
    poem: 'Thử mệnh sinh lai tổ nghiệp vi, gia môn vô lực tự trì trì. Lục thân cốt nhục như băng thán, nhất thế tự lập thắng tổ cơ.',
    meaning: 'Ít nhờ cậy tổ nghiệp hay họ hàng, một tay tự lập gây dựng sự nghiệp bền vững bằng chính sức mình.',
    tier: 'Bạch Thủ Thành Gia',
  },
  '2.8': {
    poem: 'Nhất sinh tác sự tự thương lượng, tổ nghiệp tuy hữu như mộng trường. Nhược bất tự thân cần nỗ lực, như hà đắc kiến phúc vinh xương.',
    meaning: 'Mọi việc đều do bản thân tự lo liệu tính toán; càng chủ động học hỏi và đổi mới càng sớm đón phúc lộc.',
    tier: 'Chủ Động Đổi Mới',
  },
  '3.0': {
    poem: 'Lao tâm lao lực mệnh trung cầu, tổ nghiệp vi sơ tự miễn sầu. Đợi đắc tam tuần vận khai thái, tài nguyên cổn cổn nhập gia lâu.',
    meaning: 'Thời trẻ chịu khó rèn luyện tâm trí, ngoài 30 tuổi vận trình hanh thông, tài lộc dồi dào đổ về.',
    tier: 'Trung Vận Khai Thái',
  },
  '3.2': {
    poem: 'Sơ niên vận hạn sự nan mưu, biến hảo thành không vị tất cầu. Đợi đắc trung niên thời vận đến, tài nguyên như thủy nhập giang lưu.',
    meaning: 'Tiền vận mưu sự cần kiên nhẫn, sang trung vận gặp thời cơ thuận lợi, tài lộc như nước chảy về sông lớn.',
    tier: 'Hậu Phát Tài Lộc',
  },
  '3.4': {
    poem: 'Thử mệnh phúc khí quả như hà, tăng đạo môn trung phúc lộc đa. Ly tổ xuất gia phương đắc vượng, triều tịch lễ Phật niệm Di Đà.',
    meaning: 'Tâm tính thanh cao, có duyên với học thuật, triết lý, đi xa lập nghiệp hoặc đổi mới môi trường sống sẽ rất vượng.',
    tier: 'Tâm Đạo Thanh Cao',
  },
  '3.6': {
    poem: 'Bất tu lao lực dữ lao tâm, tự hữu phúc tinh chiếu mệnh lâm. Nhất sinh y lộc giai thiên định, bách sự hanh thông thắng vạn câm.',
    meaning: 'Có phúc tinh chiếu mệnh, không phải quá lao lực cực nhọc mà việc lớn nhỏ đều có quý nhân giúp sức, phúc lộc vẹn toàn.',
    tier: 'Phúc Tinh Chiếu Mệnh',
  },
  '3.8': {
    poem: 'Nhất thân cốt nhục tối thanh cao, tảo nhập khoa môn tính danh hào. Đợi đắc niên đăng tam thập lục, lam bào thoát khước hoán hồng bào.',
    meaning: 'Cốt cách thanh cao, thông minh hiếu học; ngoài 36 tuổi công danh sự nghiệp bước lên tầm cao rực rỡ.',
    tier: 'Khoa Giáp Hiển Đạt',
  },
  '4.0': {
    poem: 'Bình sinh phúc lộc tự miên trường, tiền hậu vinh hoa thọ mệnh khương. Nhược vấn thử sinh chân tạo hóa, nhân nhân khâm kính tính danh hương.',
    meaning: 'Phúc lộc绵trường bền vững, tiền vận rèn luyện, hậu vận vinh hoa trường thọ, được mọi người kính trọng.',
    tier: 'Phúc Lộc Miên Trường',
  },
  '4.2': {
    poem: 'Đắc khoan hoài xứ thả khoan hoài, hà dụng song mi trứu bất khai. Trung niên tự hữu phong vân hội, tài lộc công danh cổn cổn lai.',
    meaning: 'Hãy mở rộng tấm lòng lạc quan; đến trung niên gặp hội phong vân, tài lộc và công danh cùng lúc hội tụ.',
    tier: 'Phong Vân Tế Hội',
  },
  '4.5': {
    poem: 'Danh lợi suy lai vị tất nhiên, tiền đồ tân khổ hậu đoàn viên. Trung niên vận chí tài nguyên vượng, tử hiếu tôn hiền phúc lộc toàn.',
    meaning: 'Tiền vận dày công vun đắp, trung và hậu vận tài nguyên hưng vượng, con cháu hiếu thảo hiền tài, gia đạo viên mãn.',
    tier: 'Gia Đạo Viên Mãn',
  },
  '4.6': {
    poem: 'Đông tây nam bắc tận giai thông, xuất tính canh danh cánh hữu công. Trung vận lộc nguyên đa phú túc, vãn niên vinh quý tự hưng long.',
    meaning: 'Số có duyên đi xa, đổi mới môi trường hoặc lập nghiệp phương xa rất đắc lợi; trung vận tài lộc sung túc, hậu vận vinh hiển hưng vượng.',
    tier: 'Phương Xa Đắc Lộc',
  },
  '4.7': {
    poem: 'Bình sinh tính vượng tại hậu niên, tảo tuế bôn ba vị đắc nhàn. Thời vận nhất lai hoan hỷ chí, tài nguyên cổn cổn tự thiên ban.',
    meaning: 'Vượng khí tụ mạnh ở trung và hậu vận; tuổi trẻ năng động bươn chải, đến khi gặp thời thì tài lộc cuồn cuộn tự nhiên tới.',
    tier: 'Hậu Vận Đại Vượng',
  },
  '4.8': {
    poem: 'Sơ niên vận đạo vị từng thông, kỷ độ bôn ba kỷ độ không. Hậu vận tự nhiên hưng gia nghiệp, vinh hoa phú quý nhập môn trung.',
    meaning: 'Tuổi trẻ trải qua vài phen thử thách để trui rèn bản lĩnh; trung hậu vận tự tay hưng khởi đại nghiệp, phú quý đầy nhà.',
    tier: 'Đại Nghiệp Hưng Khởi',
  },
  '5.0': {
    poem: 'Vi lợi vi danh chung nhật lao, trung niên phúc lộc dã đa hào. Tự hữu tài tinh chiếu mạng thượng, nhất sinh y lộc tự phong cao.',
    meaning: 'Luôn nỗ lực vì mục tiêu lớn, có Tài tinh chiếu mệnh nên trung và hậu vận phúc lộc dồi dào, địa vị cao sang.',
    tier: 'Tài Tinh Chiếu Mệnh',
  },
  '5.2': {
    poem: 'Nhất thế hanh thông sự sự năng, bất tu lao tứ tự nhiên hưng. Gia tư tích tụ như sơn nhạc, tử quý tôn vinh phúc lộc tăng.',
    meaning: 'Tài năng toàn diện, mưu sự hanh thông, gia sản tích lũy vững như núi, con cháu vinh hiển nối tiếp phúc ấm.',
    tier: 'Phú Quý Song Toàn',
  },
  '5.5': {
    poem: 'Tẩu mã dương鞭 tranh lợi danh, thiếu niên tác sự phí tâm tình. Nhất triều thời vận phong vân hội, kim ngọc mãn đường lộc tự sinh.',
    meaning: 'Tuổi trẻ chí lớn xông pha, một khi gặp vận hội thì vàng ngọc đầy nhà, công thành danh toại.',
    tier: 'Kim Ngọc Mãn Đường',
  },
  '5.8': {
    poem: 'Bình sinh y lộc tự nhiên lai, danh lợi kiêm toàn phúc thọ giai. Chiếm đắc thử trung chân diệu lý, quan cao tước trọng đống lương tài.',
    meaning: 'Phúc lộc tự nhiên hội tụ, danh lợi song toàn, là bậc trụ cột đống lương, sự nghiệp và uy vọng lớn lao.',
    tier: 'Đống Lương Chi Tài',
  },
  '6.0': {
    poem: 'Nhất triều kim bảng đệ danh âm, vạn hộc minh châu lộc tự lâm. Gia nghiệp hưng륭 vinh tổ khảo, tử tôn kế thế chưởng triều trâm.',
    meaning: 'Bảng vàng đề danh, tài lộc và danh vọng đều ở bậc thượng cách, làm rạng danh gia tộc.',
    tier: 'Kim Bảng Đề Danh',
  },
  '6.5': {
    poem: 'Tế thế an bang đại trượng phu, công thành danh toại vạn nhân phù. Vinh hoa phú quý thiên nhiên định, phúc lộc miên trường thế thượng vô.',
    meaning: 'Bậc đại khí kinh bang tế thế, công thành danh toại, được muôn người ngưỡng mộ, phúc lộc trường cửu.',
    tier: 'Kinh Bang Tế Thế',
  },
  '7.0': {
    poem: 'Thử mệnh thôi lai phúc bất khinh, bất tu sầu lự tự quang minh. Nhất sinh y lộc thiên nhiên định, vinh hiển giàu sang hưởng thái bình.',
    meaning: 'Đại phúc đại quý, cuộc đời quang minh rạng rỡ, bổng lộc và uy tín ở đỉnh cao.',
    tier: 'Đại Phú Đại Quý',
  },
  '7.2': {
    poem: 'Thử cách thiên hạ hãn hữu chi, đế vương khanh tướng đại cơ nghi. Nhất hô bách ứng uy thiên hạ, vạn cổ lưu phương vạn thế tri.',
    meaning: 'Thượng cách hiếm có trong thiên hạ, khí chất thống lĩnh xuất chúng, công nghiệp và danh tiếng lưu truyền.',
    tier: 'Thượng Cách Cực Phẩm',
  },
};

/**
 * Tra cứu bài thơ & luận giải Cân Xương Đoán Số từ chuỗi `canLuongStr` (ví dụ `"4 lượng 5 chỉ"`).
 */
export function getCanLuongPoem(canLuongStr) {
  if (!canLuongStr || typeof canLuongStr !== 'string') return null;
  const m = canLuongStr.match(/(\d+)\s*lượng\s*(\d+)\s*chỉ/i);
  if (!m) return null;
  const luong = Number(m[1]);
  const chi = Number(m[2]);
  const totalChi = luong * 10 + chi;
  const key = `${luong}.${chi}`;

  if (CAN_LUONG_POEMS[key]) {
    const entry = CAN_LUONG_POEMS[key];
    return {
      canLuongStr,
      luong,
      chi,
      totalChi,
      ...entry,
      title: entry.tier,
      poemHanViet: entry.poem,
      interpretation: entry.meaning,
    };
  }

  // Tìm mốc gần nhất trong bảng CAN_LUONG_POEMS
  const availableKeys = Object.keys(CAN_LUONG_POEMS);
  let closestKey = availableKeys[0];
  let minDiff = Infinity;
  for (const k of availableKeys) {
    const [l, c] = k.split('.').map(Number);
    const diff = Math.abs(l * 10 + c - totalChi);
    if (diff < minDiff) {
      minDiff = diff;
      closestKey = k;
    }
  }

  const base = CAN_LUONG_POEMS[closestKey];
  const tier = totalChi >= 50 ? 'Thượng Cách Phúc Hậu' : totalChi >= 38 ? 'Trung Thượng Cách Khởi Phát' : 'Tự Lập Tiền Khổ Hậu Thành';
  return {
    canLuongStr,
    luong,
    chi,
    totalChi,
    poem: base.poem,
    meaning: base.meaning,
    tier,
    title: tier,
    poemHanViet: base.poem,
    interpretation: base.meaning,
  };
}

// ─── 4. THƯ VIỆN CỔ THƯ & THIÊN KỶ (`CLASSICS_LIBRARY` & `searchClassics`) ───
export const CLASSICS_LIBRARY = [
  {
    id: 'cot-tuy-phu',
    title: 'Đẩu Số Cốt Tủy Phú',
    titleZh: '斗数骨髓赋',
    era: 'Minh Đại · Trần Đoàn Lão Tổ truyền',
    summary: 'Khẩu quyết cốt lõi cô đọng nhất của Tử Vi Đẩu Số, được Nghê Hải Hạ viện dẫn xuyên suốt bộ giảng Thiên Kỷ.',
    passages: [
      {
        id: 'ctp-1',
        title: 'Thái Cực Tinh Diệu & Đế Tọa Quân Thần',
        hanViet: 'Thái cực tinh diệu, nãi quần tinh chi chủ. Tử Vi Đế tọa, vi chúng tinh chi tôn. Tử Vi vi quân, dĩ Tả Phụ Hữu Bật vi tướng; Thiên Phủ vi thần, dĩ Lộc Tồn vi phủ khố.',
        translation: 'Sao Thái Cực là chủ của muôn sao; Tử Vi là ngôi Đế Tọa tôn quý nhất. Tử Vi làm Vua, lấy Tả Phụ Hữu Bật làm Tể tướng phò tá; Thiên Phủ làm bề tôi giữ kho, lấy Lộc Tồn làm ngân khố.',
        tags: ['Tử Vi', 'Thiên Phủ', 'Tả Phụ', 'Hữu Bật', 'Lộc Tồn', 'Quân Thần Khánh Hội'],
      },
      {
        id: 'ctp-2',
        title: 'Bản Mệnh & Tam Phương Tứ Chính',
        hanViet: 'Khán mệnh chi yếu, tiên khán Mệnh cung. Mệnh cung chủ tinh định kỳ cách cục, Tam Phương Tứ Chính định kỳ dụng võ. Thứ khán Thân cung, định kỳ vãn cảnh dữ y quy.',
        translation: 'Phép cốt yếu khi xem mệnh là trước tiên xét cung Mệnh để định cách cục và khí chất bẩm sinh; kế đến xét Tam Phương Tứ Chính (Tài - Quan - Di) để biết đất dụng võ ngoài đời; sau đó xét cung Thân để biết hậu vận và nơi gửi gắm tâm lực.',
        tags: ['Mệnh', 'Thân', 'Tam Phương Tứ Chính', 'Tài Bạch', 'Quan Lộc', 'Thiên Di'],
      },
      {
        id: 'ctp-3',
        title: 'Thất Sát Triều Đẩu & Sát Phá Lang',
        hanViet: 'Thất Sát triều đẩu, tước lộc vinh xương. Thất Sát, Phá Quân, Tham Lang hội Mệnh Tài Quan, chủ nhất sinh khai sáng biến động, đắc Lộc Quyền tắc thành đại khí.',
        translation: 'Thất Sát triều đẩu tại Dần Thân Tý Ngọ thì tước lộc vinh hiển. Bộ Sát Phá Lang hội hợp ở Mệnh Tài Quan chủ về cuộc đời khai sáng và đột phá; gặp Hóa Lộc, Hóa Quyền thì lập nên đại nghiệp.',
        tags: ['Thất Sát', 'Phá Quân', 'Tham Lang', 'Sát Phá Lang', 'Thất Sát Triều Đẩu'],
      },
      {
        id: 'ctp-4',
        title: 'Cơ Nguyệt Đồng Lương & Nhật Nguyệt Giáp Mệnh',
        hanViet: 'Cơ Nguyệt Đồng Lương tác lại nhân. Nhật Nguyệt giáp Mệnh, bất quyền tắc phú. Phủ Tướng triều viên, thiên chung thực lộc.',
        translation: 'Cơ Nguyệt Đồng Lương hội đủ 4 sao hợp làm quan chức, chuyên gia, quản trị. Nhật Nguyệt giáp cung Mệnh không nắm quyền cao cũng giàu sang lớn. Phủ Tướng chầu về Mệnh thì bổng lộc ngàn chung.',
        tags: ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương', 'Cơ Nguyệt Đồng Lương', 'Nhật Nguyệt Giáp Mệnh', 'Phủ Tướng Triều Viên'],
      },
      {
        id: 'ctp-5',
        title: 'Hỏa Tham · Linh Tham & Vũ Tham Hậu Phát',
        hanViet: 'Tham Hỏa tương phùng, danh chấn chư bang. Vũ Tham bất phát thiếu niên nhân, tam thập chi hậu phương vi đại phát.',
        translation: 'Tham Lang gặp Hỏa Tinh hoặc Linh Tinh thì danh tiếng và tài lộc bộc phát vang dội. Cách Vũ Khúc Tham Lang không phát sớm ở thời niên thiếu, sau tuổi 30 mới bộc phát mạnh mẽ và bền vững.',
        tags: ['Tham Lang', 'Vũ Khúc', 'Hỏa Tinh', 'Linh Tinh', 'Hỏa Tham Cách', 'Vũ Tham Cách'],
      },
    ],
  },
  {
    id: 'toan-thu',
    title: 'Tử Vi Đẩu Số Toàn Thư',
    titleZh: '紫微斗数全书',
    era: 'Minh Đại · La Hồng Tiên biên soạn',
    summary: 'Bộ điển tịch hoàn chỉnh nhất về luận tinh diệu, thập nhị cung, Tứ Hóa và vận hạn trong Tử Vi Đẩu Số.',
    passages: [
      {
        id: 'tt-1',
        title: 'Luận Tứ Hóa Tinh (Lộc · Quyền · Khoa · Kỵ)',
        hanViet: 'Hóa Lộc chủ tài lộc dữ cơ duyên; Hóa Quyền chủ uy quyền dữ quyết đoán; Hóa Khoa chủ thanh danh dữ quý nhân giải ách; Hóa Kỵ chủ chấp niệm dữ khảo nghiệm.',
        translation: 'Hóa Lộc chủ về tài lộc, nhân duyên và sự hanh thông; Hóa Quyền chủ về quyền lực, năng lực kiểm soát và quyết đoán; Hóa Khoa chủ về danh tiếng, học vấn và quý nhân giải ách; Hóa Kỵ chủ về sự chuyên tâm sâu sắc, thử thách cần vượt qua.',
        tags: ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ', 'Tam Kỳ Gia Hội'],
      },
      {
        id: 'tt-2',
        title: 'Luận Vô Chính Diệu & Tuần Triệt Không Vong',
        hanViet: 'Phàm cung vô chính diệu, tất tá đối cung tinh diệu dĩ tham luận. Nhược đắc Tuần trung Không Vong hoặc Triệt lộ Không Vong án thủ, phản vi đắc lực.',
        translation: 'Phàm cung Vô Chính Diệu (không có chính tinh tọa thủ) thì mượn chính tinh của cung Xung Chiếu đối diện để luận đoán. Nếu cung Vô Chính Diệu đắc Tuần Không hoặc Triệt Không trấn giữ thì ngăn được xung sát, biến hư thành thực.',
        tags: ['Vô Chính Diệu', 'Tuần Không', 'Triệt Không'],
      },
    ],
  },
  {
    id: 'thien-ky-nghe-hai-ha',
    title: 'Thiên Kỷ Nghê Hải Hạ — Tinh Hoa Tử Vi Tam Hợp Phái',
    titleZh: '倪海厦《天纪》紫微斗数讲义',
    era: 'Hiện Đại · Nghê Hải Hạ (1994)',
    summary: 'Hệ thống giảng giải thực chiến kết hợp Tử Vi Đẩu Số, Dịch Lý và Đông Y Nhân Kỷ với triết lý "Đại Đạo Chí Giản" và "2/3 Nhân Sự Thắng 1/3 Thiên Mệnh".',
    passages: [
      {
        id: 'tk-1',
        title: 'Thuyết 2/3 Lớn Hơn 1/3 (Nhân Sự + Địa Lý Thắng Thiên Mệnh)',
        hanViet: 'Thiên mệnh chiếm 1/3, Địa lý phong thủy chiếm 1/3, Nhân sự nỗ lực chiếm 1/3. Nhân sự cộng Địa lý là 2/3, nhất định lớn hơn 1/3 Thiên mệnh!',
        translation: 'Nghê Sư nhấn mạnh: Lá số Tử Vi cho ta biết 1/3 Thiên Mệnh (điểm mạnh, điểm yếu và thời điểm có sóng gió) không phải để cam chịu số phận, mà để dùng 1/3 Nỗ Lực Nhân Sự + 1/3 Điều Chỉnh Môi Trường Sống hợp thành 2/3 thắng được định mệnh.',
        tags: ['Thiên Kỷ', 'Nghê Hải Hạ', 'Cải Mệnh', 'Phong Thủy'],
      },
      {
        id: 'tk-2',
        title: 'Luận Tật Ách Cung Theo Đông Y Ngũ Hành',
        hanViet: 'Mộc chủ Can Đởm, Hỏa chủ Tâm Tiểu Trường, Thổ chủ Tỳ Vị, Kim chủ Phế Đại Trường, Thủy chủ Thận Bàng Quang.',
        translation: 'Cung Tật Ách trên lá số Tử Vi tương ứng trực tiếp với Tạng Phủ Đông Y: Thiên Cơ/Tham Lang (Mộc) ứng Gan Mật; Thái Dương/Liêm Trinh (Hỏa) ứng Tim Mạch; Tử Vi/Thiên Phủ/Thiên Lương (Thổ) ứng Tỳ Vị Tiêu Hóa; Vũ Khúc/Thất Sát (Kim) ứng Phổi Hô Hấp; Thái Âm/Thiên Đồng/Phá Quân/Cự Môn (Thủy) ứng Thận Tiết Niệu.',
        tags: ['Tật Ách', 'Đông Y', 'Ngũ Hành', 'Sức Khỏe'],
      },
    ],
  },
];

/**
 * Tìm kiếm toàn văn trong Thư Viện Cổ Thư & Thiên Kỷ (`CLASSICS_LIBRARY`).
 */
export function searchClassics(query, limit = 20) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return CLASSICS_LIBRARY.flatMap(book =>
      book.passages.map(p => ({
        bookId: book.id,
        bookTitle: book.title,
        bookTitleZh: book.titleZh,
        ...p,
      }))
    ).slice(0, limit);
  }
  const q = query.trim().toLowerCase();
  const hits = [];
  for (const book of CLASSICS_LIBRARY) {
    for (const p of book.passages) {
      const haystack = `${book.title} ${p.title} ${p.hanViet} ${p.translation} ${(p.tags || []).join(' ')}`.toLowerCase();
      if (haystack.includes(q)) {
        hits.push({
          bookId: book.id,
          bookTitle: book.title,
          bookTitleZh: book.titleZh,
          ...p,
        });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

// ─── 5. 12 LÁ SỐ DANH NHÂN & MẪU CÁCH CỤC KINH ĐIỂN (`FAMOUS_CHARTS`) ────────
export const FAMOUS_CHARTS = [
  {
    id: 'hung-dao-vuong',
    name: 'Lá Số Mẫu: Quân Thần Khánh Hội',
    category: 'Thượng Cách Đế Tinh',
    subtitle: 'Tử Vi Đế Tọa Hội Tả Hữu · Thống Lĩnh Quần Hùng',
    solarYear: 1984,
    solarMonth: 5,
    solarDay: 15,
    hourIndex: 4, // Giờ Thìn
    gender: 1,
    notable: 'Lá số tiêu biểu cho cách cục Đế tinh tọa thủ hội tụ phụ tá, thể hiện năng lực lãnh đạo chiến lược và quản trị đại cuộc.',
  },
  {
    id: 'steve-jobs',
    name: 'Steve Jobs',
    category: 'Công Nghệ & Đổi Mới',
    subtitle: 'Đồng Sáng Lập Apple · Tiên Phong Cách Mạng Công Nghệ',
    solarYear: 1955,
    solarMonth: 2,
    solarDay: 24,
    hourIndex: 6, // Giờ Ngọ
    gender: 1,
    notable: 'Cách cục Phá Cũ Lập Mới điển hình: cuộc đời nhiều bước ngoặt kịch tính, dùng tư duy thiết kế và công nghệ thay đổi thế giới.',
  },
  {
    id: 'elon-musk',
    name: 'Elon Musk',
    category: 'Công Nghệ & Đổi Mới',
    subtitle: 'Sáng Lập SpaceX & Tesla · Khai Phá Không Gian',
    solarYear: 1971,
    solarMonth: 6,
    solarDay: 28,
    hourIndex: 4, // Giờ Thìn (7:30 sáng)
    gender: 1,
    notable: 'Cách cục Sát Phá Lang kết hợp Dịch Mã tinh cực vượng, suốt đời dấn thân vào những lĩnh vực công nghệ vượt biên giới nhân loại.',
  },
  {
    id: 'li-ka-shing',
    name: 'Lý Gia Thành (Li Ka-shing)',
    category: 'Thương Giới Á Đông',
    subtitle: 'Tỷ Phú Hồng Kông · Huyền Thoại Đầu Tư & Điền Sản',
    solarYear: 1928,
    solarMonth: 7,
    solarDay: 29,
    hourIndex: 3, // Giờ Mão
    gender: 1,
    notable: 'Mẫu lá số kinh điển về Tài Khố và Lộc Tồn thủ tài: khởi nghiệp từ hai bàn tay trắng, tích lũy đế chế bất động sản và cảng biển toàn cầu.',
  },
  {
    id: 'jack-ma',
    name: 'Mã Vân (Jack Ma)',
    category: 'Thương Giới Á Đông',
    subtitle: 'Sáng Lập Alibaba · Biểu Tượng Thương Mại Điện Tử',
    solarYear: 1964,
    solarMonth: 9,
    solarDay: 10,
    hourIndex: 5, // Giờ Tỵ
    gender: 1,
    notable: 'Cung Quan Lộc và Tài Bạch phản ánh rõ tài hùng biện xuất chúng cùng khả năng kết nối mạng lưới thương mại khổng lồ.',
  },
  {
    id: 'ren-zhengfei',
    name: 'Nhậm Chính Phi',
    category: 'Thương Giới Á Đông',
    subtitle: 'Sáng Lập Huawei · Bản Lĩnh Thất Sát Vượt Nghịch Cảnh',
    solarYear: 1944,
    solarMonth: 10,
    solarDay: 25,
    hourIndex: 3, // Giờ Mão
    gender: 1,
    notable: 'Minh họa sống động cho cách cục Thất Sát và Vũ Tham hậu phát: khởi nghiệp ở tuổi 43, càng gặp sức ép càng vươn lên mạnh mẽ.',
  },
  {
    id: 'jay-chou',
    name: 'Châu Kiệt Luân (Jay Chou)',
    category: 'Văn Hóa & Nghệ Thuật',
    subtitle: 'Thiên Vương Âm Nhạc Hoa Ngữ · Tài Hoa Văn Khúc Tham Lang',
    solarYear: 1979,
    solarMonth: 1,
    solarDay: 18,
    hourIndex: 1, // Giờ Sửu
    gender: 1,
    notable: 'Sự kết hợp giữa Văn tinh và Đào Hoa đa nghệ, giải thích khả năng sáng tác đột phá kết hợp âm nhạc cổ điển và Á Đông.',
  },
  {
    id: 'eileen-chang',
    name: 'Trương Ái Linh (Eileen Chang)',
    category: 'Văn Hóa & Nghệ Thuật',
    subtitle: 'Nữ Văn Hào Hiện Đại · Cảm Thụ Nội Tâm Sâu Sắc',
    solarYear: 1920,
    solarMonth: 9,
    solarDay: 30,
    hourIndex: 1, // Giờ Sửu
    gender: 0,
    notable: 'Tổ hợp Văn tinh hội chiếu tạo nên ngòi bút sắc sảo bậc nhất văn đàn, đối chiếu sâu sắc với cuộc đời và tình duyên nhiều thăng trầm.',
  },
  {
    id: 'faye-wong',
    name: 'Vương Phi (Faye Wong)',
    category: 'Văn Hóa & Nghệ Thuật',
    subtitle: 'Huyền Thoại Âm Nhạc Á Đông · Khí Chất Tự Do Thoát Tục',
    solarYear: 1969,
    solarMonth: 8,
    solarDay: 8,
    hourIndex: 4, // Giờ Thìn
    gender: 0,
    notable: 'Lá số thể hiện cá tính nghệ thuật độc lập, thanh cao và nhân duyên đặc biệt thu hút công chúng.',
  },
  {
    id: 'lin-chi-ling',
    name: 'Lâm Chí Linh',
    category: 'Văn Hóa & Nghệ Thuật',
    subtitle: 'Biểu Tượng Nhan Sắc & Học Thức · Thái Âm Thủ Mệnh',
    solarYear: 1974,
    solarMonth: 11,
    solarDay: 29,
    hourIndex: 5, // Giờ Tỵ
    gender: 0,
    notable: 'Hình mẫu kinh điển của Thái Âm dịu dàng, thanh lịch, kết hợp nền tảng học vấn cao và nhân duyên tốt đẹp.',
  },
  {
    id: 'yao-ming',
    name: 'Diêu Minh (Yao Ming)',
    category: 'Thể Thao & Quốc Tế',
    subtitle: 'Huyền Thoại Bóng Rổ NBA · Thiên Lương Thủ Mệnh',
    solarYear: 1980,
    solarMonth: 9,
    solarDay: 12,
    hourIndex: 5, // Giờ Tỵ
    gender: 1,
    notable: 'Thiên Lương tọa thủ kết hợp Thiên Mã, phát triển sự nghiệp đỉnh cao tại nước ngoài và giữ uy tín lớn khi chuyển sang vai trò quản lý.',
  },
  {
    id: 'li-na',
    name: 'Lý Na (Li Na)',
    category: 'Thể Thao & Quốc Tế',
    subtitle: 'Nhà Vô Địch Quần Vợt Grand Slam Châu Á Đầu Tiên',
    solarYear: 1982,
    solarMonth: 2,
    solarDay: 26,
    hourIndex: 2, // Giờ Dần
    gender: 0,
    notable: 'Bản lĩnh cạnh tranh bền bỉ của Thất Sát trên đấu trường quốc tế, bứt phá mạnh mẽ đúng vào Đại Hạn đắc Lộc Quyền.',
  },
];
