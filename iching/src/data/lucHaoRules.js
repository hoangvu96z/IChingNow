/**
 * Bộ quy tắc Lục Hào dùng cho chế độ Học (phổ biến, theo Tăng San Bốc Dịch / Bốc Phệ Chính Tông).
 * Tách riêng khỏi logic để dễ chỉnh theo trường phái.
 */

/** Chủ đề hỏi → Dụng Thần (Lục Thân) */
export const TOPICS = {
  career:   { label: 'Sự nghiệp, công danh',      dungThan: 'Quan Quỷ' },
  wealth:   { label: 'Tài lộc, kinh doanh',       dungThan: 'Thê Tài'  },
  love:     { label: 'Tình duyên (nam hỏi)',      dungThan: 'Thê Tài'  },
  love_f:   { label: 'Tình duyên (nữ hỏi)',       dungThan: 'Quan Quỷ' },
  study:    { label: 'Học hành, thi cử, giấy tờ', dungThan: 'Phụ Mẫu'  },
  children: { label: 'Con cái',                   dungThan: 'Tử Tôn'   },
  siblings: { label: 'Anh em, bạn bè',            dungThan: 'Huynh Đệ' },
  health:   { label: 'Sức khỏe (bản thân)',       dungThan: 'Thế'      },
  general:  { label: 'Việc chung',                dungThan: 'Thế'      },
};

/** Lục Xung của Địa Chi */
export const LUC_XUNG = {
  Tý: 'Ngọ', Ngọ: 'Tý', Sửu: 'Mùi', Mùi: 'Sửu', Dần: 'Thân', Thân: 'Dần',
  Mão: 'Dậu', Dậu: 'Mão', Thìn: 'Tuất', Tuất: 'Thìn', Tỵ: 'Hợi', Hợi: 'Tỵ',
};

/** Hóa Tiến Thần (chi gốc → chi biến cùng hành, đi tới) */
export const TIEN_THAN = {
  Hợi: 'Tý', Dần: 'Mão', Tỵ: 'Ngọ', Thân: 'Dậu',
  Sửu: 'Thìn', Thìn: 'Mùi', Mùi: 'Tuất', Tuất: 'Sửu',
};

/** Điểm Vượng/Suy theo quan hệ với Nguyệt kiến / Nhật thần */
export const SCORE = {
  month: { same: 3, sinhHao: 3, haoSinh: -1, haoKhac: -1, khacHao: -3 },
  day:   { same: 2, sinhHao: 2, haoSinh: -1, haoKhac: -1, khacHao: -2 },
  nguyetPha: -3,
  nhatXung: -2,
  khongVong: -2,
  hoiDauSinh: 2,
  hoiDauKhac: -3,
  hoaTien: 1,
  hoaThoai: -1,
};

/** Ngưỡng kết luận */
export const VERDICT = { cat: 3, hung: -3 };
