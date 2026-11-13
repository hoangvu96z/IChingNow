/**
 * Bộ quy tắc Lục Hào thực chiến (theo Tăng San Bốc Dịch — Dã Hạc Lão Nhân & Bốc Phệ Chính Tông).
 * Tách riêng khỏi logic để dễ kiểm chứng và mở rộng.
 */

/** Chủ đề hỏi → Dụng Thần (Lục Thân) */
export const TOPICS = {
  career:   { label: 'Sự nghiệp, công danh',      dungThan: 'Quan Quỷ', interpersonal: true  },
  wealth:   { label: 'Tài lộc, kinh doanh',       dungThan: 'Thê Tài',  interpersonal: true  },
  love:     { label: 'Tình duyên (nam hỏi)',      dungThan: 'Thê Tài',  interpersonal: true  },
  love_f:   { label: 'Tình duyên (nữ hỏi)',       dungThan: 'Quan Quỷ', interpersonal: true  },
  study:    { label: 'Học hành, thi cử, giấy tờ', dungThan: 'Phụ Mẫu',  interpersonal: true  },
  children: { label: 'Con cái',                   dungThan: 'Tử Tôn',   interpersonal: false },
  siblings: { label: 'Anh em, bạn bè, hợp tác',   dungThan: 'Huynh Đệ', interpersonal: true  },
  health:   { label: 'Sức khỏe (bản thân)',       dungThan: 'Thế',      interpersonal: false },
  lawsuit:  { label: 'Kiện tụng, tranh chấp',     dungThan: 'Quan Quỷ', interpersonal: true  },
  general:  { label: 'Việc chung',                dungThan: 'Thế',      interpersonal: false },
};

/** Ánh xạ bí danh chủ đề tiếng Việt / tiếng Anh sang khóa chuẩn trong TOPICS */
export const TOPIC_ALIASES = {
  'tinh-cam':     'love',
  'tinh-duyen':   'love',
  'hon-nhan':     'love',
  'tinh-cam-nu':  'love_f',
  'cong-viec':    'career',
  'su-nghiep':    'career',
  'cong-danh':    'career',
  'tai-loc':      'wealth',
  'kinh-doanh':   'wealth',
  'tien-bac':     'wealth',
  'thi-cu':       'study',
  'hoc-hanh':     'study',
  'giay-to':      'study',
  'hop-dong':     'study',
  'con-cai':      'children',
  'anh-em':       'siblings',
  'ban-be':       'siblings',
  'suc-khoe':     'health',
  'benh-tat':     'health',
  'kien-tung':    'lawsuit',
  'tranh-chap':   'lawsuit',
  'viec-chung':   'general',
};

/** Chuẩn hóa khóa chủ đề hỏi */
export function resolveTopicKey(topicKey = 'general') {
  if (!topicKey) return 'general';
  const normalized = String(topicKey).trim();
  if (TOPICS[normalized]) return normalized;
  const lower = normalized.toLowerCase();
  if (TOPICS[lower]) return lower;
  if (TOPIC_ALIASES[lower]) return TOPIC_ALIASES[lower];
  return 'general';
}

/** Gợi ý chủ đề tự động từ nội dung câu hỏi tiếng Việt / tiếng Anh */
export function inferTopicFromQuestion(question = '') {
  const q = String(question || '').toLowerCase();
  if (!q) return 'general';
  if (/(kiện|tranh chấp|tòa|pháp lý|lawsuit|dispute|court)/.test(q)) return 'lawsuit';
  if (/(bệnh|sức khỏe|khám|phẫu thuật|đau|health|illness|medical)/.test(q)) return 'health';
  if (/(thi cử|điểm thi|học|bằng cấp|giấy tờ|hợp đồng|visa|nhà đất|study|exam|contract)/.test(q)) return 'study';
  if (/(con cái|mang thai|sinh con|children|pregnancy)/.test(q)) return 'children';
  if (/(chồng|bạn trai|boyfriend|husband)/.test(q)) return 'love_f';
  if (/(tình cảm|tình duyên|người yêu|hôn nhân|cưới|chia tay|quay lại|vợ|bạn gái|love|relationship|marriage)/.test(q)) return 'love';
  if (/(tiền|tài lộc|kinh doanh|buôn bán|đầu tư|lãi|lỗ|bán hàng|nợ|wealth|money|profit|invest)/.test(q)) return 'wealth';
  if (/(công việc|sự nghiệp|thăng chức|xin việc|phỏng vấn|nhảy việc|sếp|dự án|career|job|promotion)/.test(q)) return 'career';
  if (/(anh em|bạn bè|đồng nghiệp|đối tác|sibling|friend)/.test(q)) return 'siblings';
  return 'general';
}

/** Lục Xung của Địa Chi */
export const LUC_XUNG = {
  Tý: 'Ngọ', Ngọ: 'Tý', Sửu: 'Mùi', Mùi: 'Sửu', Dần: 'Thân', Thân: 'Dần',
  Mão: 'Dậu', Dậu: 'Mão', Thìn: 'Tuất', Tuất: 'Thìn', Tỵ: 'Hợi', Hợi: 'Tỵ',
};

/** Lục Hợp của Địa Chi */
export const LUC_HOP = {
  Tý: 'Sửu', Sửu: 'Tý',
  Dần: 'Hợi', Hợi: 'Dần',
  Mão: 'Tuất', Tuất: 'Mão',
  Thìn: 'Dậu', Dậu: 'Thìn',
  Tỵ: 'Thân', Thân: 'Tỵ',
  Ngọ: 'Mùi', Mùi: 'Ngọ',
};

/** Tứ Cục Tam Hợp Địa Chi (Tăng San Bốc Dịch) */
export const TAM_HOP_CUCS = [
  {
    id: 'thuy',
    branches: ['Thân', 'Tý', 'Thìn'],
    middle: 'Tý',
    element: 'Thủy',
    labelVi: 'Tam Hợp Thủy Cục (Thân – Tý – Thìn)',
    labelEn: 'Water Three-Harmony Bureau (Shen–Zi–Chen)',
  },
  {
    id: 'hoa',
    branches: ['Dần', 'Ngọ', 'Tuất'],
    middle: 'Ngọ',
    element: 'Hỏa',
    labelVi: 'Tam Hợp Hỏa Cục (Dần – Ngọ – Tuất)',
    labelEn: 'Fire Three-Harmony Bureau (Yin–Wu–Xu)',
  },
  {
    id: 'moc',
    branches: ['Hợi', 'Mão', 'Mùi'],
    middle: 'Mão',
    element: 'Mộc',
    labelVi: 'Tam Hợp Mộc Cục (Hợi – Mão – Mùi)',
    labelEn: 'Wood Three-Harmony Bureau (Hai–Mao–Wei)',
  },
  {
    id: 'kim',
    branches: ['Tỵ', 'Dậu', 'Sửu'],
    middle: 'Dậu',
    element: 'Kim',
    labelVi: 'Tam Hợp Kim Cục (Tỵ – Dậu – Sửu)',
    labelEn: 'Metal Three-Harmony Bureau (Si–You–Chou)',
  },
];

/** Hóa Tiến Thần (chi gốc → chi biến cùng hành, đi tới) */
export const TIEN_THAN = {
  Hợi: 'Tý', Dần: 'Mão', Tỵ: 'Ngọ', Thân: 'Dậu',
  Sửu: 'Thìn', Thìn: 'Mùi', Mùi: 'Tuất', Tuất: 'Sửu',
};

/** Mộ Khố theo Ngũ Hành (Lục Hào chính tông: Thủy – Thổ đồng mộ tại Thìn) */
export const TOMB_BY_ELEMENT = {
  Kim:  'Sửu',
  Mộc:  'Mùi',
  Thủy: 'Thìn',
  Thổ:  'Thìn',
  Hỏa:  'Tuất',
};

/** Đất Tuyệt theo Ngũ Hành */
export const TUYET_BY_ELEMENT = {
  Kim:  'Dần',
  Mộc:  'Thân',
  Thủy: 'Tỵ',
  Thổ:  'Tỵ',
  Hỏa:  'Hợi',
};

/** Điểm Vượng/Suy & Tương tác thực chiến theo Tăng San Bốc Dịch */
export const SCORE = {
  month: { same: 3, sinhHao: 3, haoSinh: -1, haoKhac: -1, khacHao: -3 },
  day:   { same: 2, sinhHao: 2, haoSinh: -1, haoKhac: -1, khacHao: -2 },
  nguyetPha: -3,
  nhatXung: -2,
  amDong: 1.5,
  nhatPha: -2.5,
  xungTan: -2.5,
  xungKhoi: -0.5,
  khongVong: -2,
  khongVongMovingOrAmDong: -0.5,
  hoiDauSinh: 2,
  hoiDauKhac: -3,
  hoaTien: 1,
  hoaThoai: -1.5,
  thamSinhVongKhac: 2.5,
  cuuThanChain: -1.5,
  tamHopSinh: 2.5,
  tamHopSame: 2,
  tamHopKhac: -2.5,
  hopTruDT: -0.5,
  hopKhoiDT: 1,
  nhapNhatMoWeak: -1.5,
  nhapNhatMoStrong: -0.5,
  hoaMo: -2,
  nhapDongMo: -1.5,
  hoaTuyet: -2,
  phiSinhPhuc: 1,
  phiKhacPhuc: -2,
  phiKhacPhucRescued: 0.5,
  phucSinhPhi: -1,
  phucKhacPhi: -0.5,
};

/** Ngưỡng kết luận */
export const VERDICT = { cat: 3, hung: -3, daiCat: 5.5, daiHung: -5.5 };
