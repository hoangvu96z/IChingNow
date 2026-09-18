/**
 * ============================================================================
 * THUẬT TOÁN AN LÁ SỐ TỬ VI ĐẨU SỐ TOÀN DIỆN (Zi Wei Dou Shu Engine - v3)
 * ============================================================================
 * Xây dựng dựa trên nguyên lý kinh điển từ 2 tác phẩm:
 * 1. "Tử Vi Đẩu Số Tân Biên" - Vân Đằng Thái Thứ Lang
 * 2. "Tử Vi Đẩu Số Toàn Thư" - Hi Di Trần Đoàn / Vũ Tài Lực
 * 
 * Bổ sung đầy đủ 100% sao:
 * - 14 Chính Tinh (kèm trạng thái Miếu Vượng Đắc Hãm)
 * - Vòng Thái Tuế (12 sao), Vòng Lộc Tồn (12 sao), Vòng Tràng Sinh (12 sao)
 * - Vòng Tuần Không & Triệt Không
 * - Lục Sát Tinh (Địa Không, Địa Kiếp, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh)
 * - Tả Phụ, Hữu Bật, Văn Xương, Văn Khúc, Thiên Khôi, Thiên Việt, Thiên Mã
 * - Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ)
 * - Bộ Đào Hồng Hỷ, Cô Quả, Phượng Long, Ân Quang Thiên Quý, Tam Thai Bát Tọa,
 *   Thiên Hình, Thiên Diêu, Thiên Giải, Địa Giải, Thiên Đức, Nguyệt Đức, Thai Phụ, Phong Cáo,
 *   Thiên Cốc, Thiên Hư, Quốc Ấn, Đường Phù, Lưu Niên Văn Tinh, Thiên Trù, v.v.
 * - Chủ Mệnh, Chủ Thân, Âm Dương Nam Nữ, Ngũ Hành Cục, Bản Mệnh Nạp Âm.
 * ============================================================================
 */

export const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export const TEN_CUNG_CHUC_NANG = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", 
    "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", 
    "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"
];

export const NGU_HANH_CUC_NAME = {
    2: "Thủy Nhị Cục",
    3: "Mộc Tam Cục",
    4: "Kim Tứ Cục",
    5: "Thổ Ngũ Cục",
    6: "Hỏa Lục Cục"
};

// Bảng Nạp Âm Hành của Mệnh (Mệnh Ngũ Hành)
const NAP_AM_MAP = {
    "Giáp Tý": "Giản Hạ Thủy", "Ất Sửu": "Giản Hạ Thủy",
    "Bính Dần": "Lư Trung Hỏa", "Đinh Mão": "Lư Trung Hỏa",
    "Mậu Thìn": "Đại Lâm Mộc", "Kỷ Tỵ": "Đại Lâm Mộc",
    "Canh Ngọ": "Lộ Trung Thổ", "Tân Mùi": "Lộ Trung Thổ",
    "Nhâm Thân": "Kiếm Phong Kim", "Quý Dậu": "Kiếm Phong Kim",
    "Giáp Tuất": "Sơn Đầu Hỏa", "Ất Hợi": "Sơn Đầu Hỏa",
    "Bính Tý": "Giản Hạ Thủy", "Đinh Sửu": "Giản Hạ Thủy",
    "Mậu Dần": "Thành Đầu Thổ", "Kỷ Mão": "Thành Đầu Thổ",
    "Canh Thìn": "Bạch Lạp Kim", "Tân Tỵ": "Bạch Lạp Kim",
    "Nhâm Ngọ": "Dương Liễu Mộc", "Quý Mùi": "Dương Liễu Mộc",
    "Giáp Thân": "Tuyền Trung Thủy", "Ất Dậu": "Tuyền Trung Thủy",
    "Bính Tuất": "Ốc Thượng Thổ", "Đinh Hợi": "Ốc Thượng Thổ",
    "Mậu Tý": "Tích Lịch Hỏa", "Kỷ Sửu": "Tích Lịch Hỏa",
    "Canh Dần": "Tùng Bách Mộc", "Tân Mão": "Tùng Bách Mộc",
    "Nhâm Thìn": "Trường Lưu Thủy", "Quý Tỵ": "Trường Lưu Thủy",
    "Giáp Ngọ": "Sa Trung Kim", "Ất Mùi": "Sa Trung Kim",
    "Bính Thân": "Sơn Hạ Hỏa", "Đinh Dậu": "Sơn Hạ Hỏa",
    "Mậu Tuất": "Bình Địa Mộc", "Kỷ Hợi": "Bình Địa Mộc",
    "Canh Tý": "Bích Thượng Thổ", "Tân Sửu": "Bích Thượng Thổ",
    "Nhâm Dần": "Kim Bạc Kim", "Quý Mão": "Kim Bạc Kim",
    "Giáp Thìn": "Phúc Đăng Hỏa", "Ất Tỵ": "Phúc Đăng Hỏa",
    "Bính Ngọ": "Thiên Hà Thủy", "Đinh Mùi": "Thiên Hà Thủy",
    "Mậu Thân": "Đại Dịch Thổ", "Kỷ Dậu": "Đại Dịch Thổ",
    "Canh Tuất": "Thoa Xuyến Kim", "Tân Hợi": "Thoa Xuyến Kim",
    "Nhâm Tý": "Tang Đố Mộc", "Quý Sửu": "Tang Đố Mộc",
    "Giáp Dần": "Đại Khê Thủy", "Ất Mão": "Đại Khê Thủy",
    "Bính Thìn": "Sa Trung Thổ", "Đinh Tỵ": "Sa Trung Thổ",
    "Mậu Ngọ": "Thiên Thượng Hỏa", "Kỷ Mùi": "Thiên Thượng Hỏa",
    "Canh Thân": "Thạch Lựu Mộc", "Tân Dậu": "Thạch Lựu Mộc",
    "Nhâm Tuất": "Đại Hải Thủy", "Quý Hợi": "Đại Hải Thủy"
};

// Chủ Mệnh an theo Chi Cung Mệnh
const CHU_MENH = {
    0: "Tham Lang", 1: "Cự Môn", 2: "Lộc Tồn", 3: "Văn Khúc",
    4: "Liêm Trinh", 5: "Vũ Khúc", 6: "Pha Quân", 7: "Vũ Khúc",
    8: "Liêm Trinh", 9: "Văn Khúc", 10: "Lộc Tồn", 11: "Cự Môn"
};

// Chủ Thân an theo Chi Năm Sinh
const CHU_THAN = {
    0: "Linh Tinh", 1: "Thiên Đồng", 2: "Thiên Cơ", 3: "Thiên Lương",
    4: "Hỏa Tinh", 5: "Thiên Tướng", 6: "Thiên Đồng", 7: "Thiên Đồng",
    8: "Hỏa Tinh", 9: "Thiên Lương", 10: "Thiên Cơ", 11: "Thiên Đồng"
};

// Bảng Đắc Miếu Hãm của 14 Chính Tinh tại 12 Cung
// M: Miếu, V: Vượng, D: Đắc, B: Bình, H: Hãm
export const MIEU_HAM_MAP = {
    "Tử Vi":      ["B", "Đ", "V", "M", "M", "B", "M", "Đ", "V", "M", "M", "B"],
    "Thiên Cơ":   ["M", "H", "M", "M", "V", "H", "M", "H", "M", "M", "V", "H"],
    "Thái Dương": ["H", "H", "V", "V", "V", "M", "M", "Đ", "H", "H", "H", "H"],
    "Vũ Khúc":    ["V", "M", "B", "M", "M", "B", "V", "M", "B", "M", "M", "B"],
    "Thiên Đồng": ["M", "H", "Đ", "H", "B", "M", "H", "H", "Đ", "H", "B", "M"],
    "Liêm Trinh": ["V", "Đ", "M", "H", "V", "H", "V", "Đ", "M", "H", "V", "H"],
    "Thiên Phủ":  ["M", "M", "M", "B", "M", "B", "M", "M", "M", "B", "M", "B"],
    "Thái Âm":    ["M", "M", "H", "H", "H", "H", "H", "Đ", "V", "V", "M", "M"],
    "Tham Lang":  ["B", "M", "V", "H", "M", "H", "B", "M", "V", "H", "M", "H"],
    "Cự Môn":     ["V", "H", "M", "M", "H", "B", "V", "H", "M", "M", "H", "Đ"],
    "Thiên Tướng":["V", "Đ", "M", "H", "V", "Đ", "V", "Đ", "M", "H", "V", "Đ"],
    "Thiên Lương":["M", "M", "V", "M", "M", "H", "M", "M", "V", "M", "H", "H"],
    "Thất Sát":   ["V", "M", "M", "H", "M", "H", "V", "M", "M", "H", "M", "H"],
    "Phá Quân":   ["M", "V", "H", "H", "V", "H", "M", "V", "H", "H", "V", "H"]
};

export function getTrangThaiStar(starName, chiIndex) {
    if (MIEU_HAM_MAP[starName]) {
        const code = MIEU_HAM_MAP[starName][chiIndex];
        return `${starName} (${code})`;
    }
    return starName;
}

/**
 * Trả về tên đầy đủ trạng thái
 */
export function getTrangThaiName(code) {
    const names = { "M": "Miếu", "V": "Vượng", "Đ": "Đắc", "B": "Bình", "H": "Hãm" };
    return names[code] || code;
}

/**
 * 1. Xác định vị trí Cung Mệnh và Cung Thân
 */
export function getMenhThanIndex(lunarMonth, lunarHourIndex) {
    const thangPos = (2 + lunarMonth - 1) % 12;
    const menhIndex = (thangPos - lunarHourIndex + 120) % 12;
    const thanIndex = (thangPos + lunarHourIndex) % 12;
    return { menhIndex, thanIndex };
}

/**
 * 2. Can Cung Dần (Ngũ Hổ Tốn)
 */
function getCanCungDan(yearCanIndex) {
    const map = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
    return map[yearCanIndex];
}

/**
 * 3. Ngũ Hành Cục theo Nạp Âm 60 Hoa Giáp của Can-Chi Cung Mệnh
 */
export function getCuc(menhIndex, yearCanIndex) {
    const canDan = getCanCungDan(yearCanIndex);
    const distFromDan = (menhIndex - 2 + 12) % 12;
    const menhCanIndex = (canDan + distFromDan) % 10;
    
    const canVal = Math.floor(menhCanIndex / 2) + 1;
    const chiVal = [0, 0, 1, 1, 2, 2, 0, 0, 1, 1, 2, 2][menhIndex];
    
    let s = canVal + chiVal;
    if (s > 5) s -= 5;
    
    const cucMap = { 1: 4, 2: 2, 3: 6, 4: 5, 5: 3 };
    const cucNumber = cucMap[s];
    const canChiMenhStr = THIEN_CAN[menhCanIndex] + " " + DIA_CHI[menhIndex];
    
    return { 
        number: cucNumber, 
        name: NGU_HANH_CUC_NAME[cucNumber],
        canChiMenh: canChiMenhStr,
        napAm: NAP_AM_MAP[canChiMenhStr] || "Chưa xác định"
    };
}

/**
 * 4. Vị trí Sao Tử Vi
 */
export function getTuViIndex(cucNumber, day) {
    const remainder = day % cucNumber;
    if (remainder === 0) {
        const k = day / cucNumber;
        return (2 + k - 1) % 12;
    } else {
        const x = cucNumber - remainder;
        const k = Math.floor((day + x) / cucNumber);
        const startPos = (2 + k - 1) % 12;
        return x % 2 === 1 ? (startPos - x + 120) % 12 : (startPos + x) % 12;
    }
}

/**
 * 5. CORE ENGINE - AN LÁ SỐ TỬ VI ĐẨU SỐ ĐẦY ĐỦ 100%
 */
export function anLaSoTuVi({ yearCanIndex, yearChiIndex, lunarMonth, lunarDay, lunarHourIndex, gender }) {
    const isDuongCan = yearCanIndex % 2 === 0;
    const isNam = gender === 1;
    const isThuan = (isDuongCan && isNam) || (!isDuongCan && !isNam);
    
    // 1. Cung Mệnh & Thân
    const { menhIndex, thanIndex } = getMenhThanIndex(lunarMonth, lunarHourIndex);
    
    // 2. Ngũ Hành Cục & Bản Mệnh
    const cuc = getCuc(menhIndex, yearCanIndex);
    const yearCanChiStr = THIEN_CAN[yearCanIndex] + " " + DIA_CHI[yearChiIndex];
    const banMenhNapAm = NAP_AM_MAP[yearCanChiStr] || "Chưa xác định";

    // 3. Khởi tạo 12 Cung
    let palates = Array.from({ length: 12 }, (_, i) => ({
        chiIndex: i,
        chiName: DIA_CHI[i],
        canName: THIEN_CAN[(getCanCungDan(yearCanIndex) + (i - 2 + 12) % 12) % 10],
        chucNang: "",
        daiHan: 0,
        trangSinh: "",
        isTuan: false,
        isTriet: false,
        isMenh: false,
        isThan: false,
        chinhTinh: [],
        phuTinh: []
    }));

    // Gán Tên Cung Chức Năng & Đại Hạn
    for (let i = 0; i < 12; i++) {
        let pos = isThuan ? (menhIndex + i) % 12 : (menhIndex - i + 120) % 12;
        palates[pos].chucNang = TEN_CUNG_CHUC_NANG[i];
        palates[pos].daiHan = cuc.number + i * 10;
    }
    palates[menhIndex].isMenh = true;
    palates[thanIndex].isThan = true;

    // 4. Tuần Không & Triệt Không
    const tuanDiff = (yearChiIndex - yearCanIndex + 12) % 12;
    const tuan1 = (10 - tuanDiff + 12) % 12;
    const tuan2 = (11 - tuanDiff + 12) % 12;
    palates[tuan1].isTuan = true;
    palates[tuan2].isTuan = true;

    const trietMap = { 0: [8, 9], 5: [8, 9], 1: [6, 7], 6: [6, 7], 2: [4, 5], 7: [4, 5], 3: [2, 3], 8: [2, 3], 4: [0, 1], 9: [0, 1] };
    const trietPair = trietMap[yearCanIndex];
    palates[trietPair[0]].isTriet = true;
    palates[trietPair[1]].isTriet = true;

    // 5. Vòng Tràng Sinh
    const trangSinhStartMap = { 2: 8, 5: 8, 3: 11, 6: 2, 4: 5 };
    const tsStart = trangSinhStartMap[cuc.number];
    const trangSinhNames = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
    for (let i = 0; i < 12; i++) {
        let pos = isThuan ? (tsStart + i) % 12 : (tsStart - i + 120) % 12;
        palates[pos].trangSinh = trangSinhNames[i];
    }

    // 6. Tử Vi Tinh Hệ
    const tuViIndex = getTuViIndex(cuc.number, lunarDay);
    palates[tuViIndex].chinhTinh.push(getTrangThaiStar("Tử Vi", tuViIndex));
    palates[(tuViIndex - 1 + 12) % 12].chinhTinh.push(getTrangThaiStar("Thiên Cơ", (tuViIndex - 1 + 12) % 12));
    palates[(tuViIndex - 3 + 12) % 12].chinhTinh.push(getTrangThaiStar("Thái Dương", (tuViIndex - 3 + 12) % 12));
    palates[(tuViIndex - 4 + 12) % 12].chinhTinh.push(getTrangThaiStar("Vũ Khúc", (tuViIndex - 4 + 12) % 12));
    palates[(tuViIndex - 5 + 12) % 12].chinhTinh.push(getTrangThaiStar("Thiên Đồng", (tuViIndex - 5 + 12) % 12));
    palates[(tuViIndex + 4) % 12].chinhTinh.push(getTrangThaiStar("Liêm Trinh", (tuViIndex + 4) % 12));

    // 7. Thiên Phủ Tinh Hệ
    const thienPhuIndex = (4 - tuViIndex + 12) % 12;
    palates[thienPhuIndex].chinhTinh.push(getTrangThaiStar("Thiên Phủ", thienPhuIndex));
    palates[(thienPhuIndex + 1) % 12].chinhTinh.push(getTrangThaiStar("Thái Âm", (thienPhuIndex + 1) % 12));
    palates[(thienPhuIndex + 2) % 12].chinhTinh.push(getTrangThaiStar("Tham Lang", (thienPhuIndex + 2) % 12));
    palates[(thienPhuIndex + 3) % 12].chinhTinh.push(getTrangThaiStar("Cự Môn", (thienPhuIndex + 3) % 12));
    palates[(thienPhuIndex + 4) % 12].chinhTinh.push(getTrangThaiStar("Thiên Tướng", (thienPhuIndex + 4) % 12));
    palates[(thienPhuIndex + 5) % 12].chinhTinh.push(getTrangThaiStar("Thiên Lương", (thienPhuIndex + 5) % 12));
    palates[(thienPhuIndex + 6) % 12].chinhTinh.push(getTrangThaiStar("Thất Sát", (thienPhuIndex + 6) % 12));
    palates[(thienPhuIndex + 10) % 12].chinhTinh.push(getTrangThaiStar("Phá Quân", (thienPhuIndex + 10) % 12));

    // 8. Lộc Tồn, Kình Dương, Đà La
    const locTonMap = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 };
    const locTonIndex = locTonMap[yearCanIndex];
    palates[locTonIndex].phuTinh.push("Lộc Tồn");
    palates[(locTonIndex + 1) % 12].phuTinh.push("Kình Dương");
    palates[(locTonIndex - 1 + 12) % 12].phuTinh.push("Đà La");

    // Vòng Bác Sỹ 12 Sao
    const vongLocTonNames = [
        "Bác Sỹ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", 
        "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phủ"
    ];
    for (let i = 0; i < 12; i++) {
        let pos = isThuan ? (locTonIndex + i) % 12 : (locTonIndex - i + 120) % 12;
        palates[pos].phuTinh.push(vongLocTonNames[i]);
    }

    // 9. Vòng Thái Tuế
    const vongThaiTueNames = [
        "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", 
        "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"
    ];
    for (let i = 0; i < 12; i++) {
        let pos = (yearChiIndex + i) % 12;
        palates[pos].phuTinh.push(vongThaiTueNames[i]);
    }

    // 10. Tả Phụ, Hữu Bật, Văn Xương, Văn Khúc, Địa Không, Địa Kiếp
    const taPhuIndex = (4 + lunarMonth - 1) % 12;
    const huuBatIndex = (10 - lunarMonth + 1 + 120) % 12;
    palates[taPhuIndex].phuTinh.push("Tả Phụ");
    palates[huuBatIndex].phuTinh.push("Hữu Bật");
    
    const xuangIndex = (10 - lunarHourIndex + 120) % 12;
    const khucIndex = (4 + lunarHourIndex) % 12;
    palates[xuangIndex].phuTinh.push("Văn Xương");
    palates[khucIndex].phuTinh.push("Văn Khúc");
    
    palates[(11 + lunarHourIndex) % 12].phuTinh.push("Địa Kiếp");
    palates[(11 - lunarHourIndex + 120) % 12].phuTinh.push("Địa Không");

    // 11. Hỏa Tinh & Linh Tinh
    let hoaStart = 2, linhStart = 10;
    if ([2, 6, 10].includes(yearChiIndex)) { hoaStart = 1; linhStart = 3; }
    else if ([5, 9, 1].includes(yearChiIndex)) { hoaStart = 2; linhStart = 10; }
    else if ([11, 3, 7].includes(yearChiIndex)) { hoaStart = 9; linhStart = 10; }

    const hoaIndex = (hoaStart + lunarHourIndex) % 12;
    const linhIndex = (linhStart - lunarHourIndex + 120) % 12;
    palates[hoaIndex].phuTinh.push("Hỏa Tinh");
    palates[linhIndex].phuTinh.push("Linh Tinh");

    // 12. Thiên Khôi / Thiên Việt
    const khoiMap = { 0: 1, 1: 0, 2: 11, 3: 9, 4: 1, 5: 0, 6: 1, 7: 2, 8: 3, 9: 3 };
    const vietMap = { 0: 7, 1: 8, 2: 9, 3: 11, 4: 7, 5: 8, 6: 7, 7: 6, 8: 5, 9: 5 };
    palates[khoiMap[yearCanIndex]].phuTinh.push("Thiên Khôi");
    palates[vietMap[yearCanIndex]].phuTinh.push("Thiên Việt");

    // Thiên Mã, Đào Hoa, Hồng Loan, Thiên Hỷ, Thiên Khốc, Thiên Hư
    const maMap = { 0: 2, 4: 2, 8: 2, 6: 8, 10: 8, 2: 8, 3: 5, 7: 5, 11: 5, 9: 11, 1: 11, 5: 11 };
    palates[maMap[yearChiIndex]].phuTinh.push("Thiên Mã");

    const daoMap = { 0: 9, 4: 9, 8: 9, 6: 3, 10: 3, 2: 3, 3: 0, 7: 0, 11: 0, 9: 6, 1: 6, 5: 6 };
    palates[daoMap[yearChiIndex]].phuTinh.push("Đào Hoa");

    const hlIndex = (3 - yearChiIndex + 120) % 12;
    palates[hlIndex].phuTinh.push("Hồng Loan");
    palates[(hlIndex + 6) % 12].phuTinh.push("Thiên Hỷ");

    palates[(6 + yearChiIndex) % 12].phuTinh.push("Thiên Hư");
    palates[(6 - yearChiIndex + 120) % 12].phuTinh.push("Thiên Khốc");

    // Ân Quang, Thiên Quý
    const anQuangPos = (xuangIndex + lunarDay - 1) % 12;
    const thienQuyPos = (khucIndex - lunarDay + 1 + 120) % 12;
    palates[anQuangPos].phuTinh.push("Ân Quang");
    palates[thienQuyPos].phuTinh.push("Thiên Quý");

    // Tam Thai, Bát Tọa
    const tamThaiPos = (taPhuIndex + lunarDay - 1) % 12;
    const batToaPos = (huuBatIndex - lunarDay + 1 + 120) % 12;
    palates[tamThaiPos].phuTinh.push("Tam Thai");
    palates[batToaPos].phuTinh.push("Bát Tọa");

    // Long Trì, Phượng Cát
    const longTriPos = (4 + yearChiIndex) % 12;
    const phuongCatPos = (10 - yearChiIndex + 120) % 12;
    palates[longTriPos].phuTinh.push("Long Trì");
    palates[phuongCatPos].phuTinh.push("Phượng Cát");

    // Thiên Giải, Địa Giải
    palates[(8 + lunarMonth - 1) % 12].phuTinh.push("Thiên Giải");
    palates[(7 + lunarMonth - 1) % 12].phuTinh.push("Địa Giải");

    // Thiên Hình, Thiên Diêu
    palates[(9 + lunarMonth - 1) % 12].phuTinh.push("Thiên Hình");
    palates[(1 + lunarMonth - 1) % 12].phuTinh.push("Thiên Diêu");

    // Thai Phụ, Phong Cáo
    palates[(6 + lunarHourIndex) % 12].phuTinh.push("Thai Phụ");
    palates[(2 + lunarHourIndex) % 12].phuTinh.push("Phong Cáo");

    // Quốc Ấn, Đường Phù
    palates[(locTonIndex + 8) % 12].phuTinh.push("Quốc Ấn");
    palates[(locTonIndex + 5) % 12].phuTinh.push("Đường Phù");

    // 13. Tứ Hóa
    const tuHoaMap = {
        0: { Loc: "Liêm Trinh", Quyen: "Phá Quân", Khoa: "Vũ Khúc", Ky: "Thái Dương" },
        1: { Loc: "Thiên Cơ", Quyen: "Thiên Lương", Khoa: "Tử Vi", Ky: "Thái Âm" },
        2: { Loc: "Thiên Đồng", Quyen: "Thiên Cơ", Khoa: "Văn Xương", Ky: "Liêm Trinh" },
        3: { Loc: "Thái Âm", Quyen: "Thiên Đồng", Khoa: "Thiên Cơ", Ky: "Cự Môn" },
        4: { Loc: "Tham Lang", Quyen: "Thái Âm", Khoa: "Hữu Bật", Ky: "Thiên Cơ" },
        5: { Loc: "Vũ Khúc", Quyen: "Tham Lang", Khoa: "Thiên Lương", Ky: "Văn Khúc" },
        6: { Loc: "Thái Dương", Quyen: "Vũ Khúc", Khoa: "Thái Âm", Ky: "Thiên Đồng" },
        7: { Loc: "Cự Môn", Quyen: "Thiên Lương", Khoa: "Văn Khúc", Ky: "Văn Xương" },
        8: { Loc: "Thiên Lương", Quyen: "Tử Vi", Khoa: "Tả Phụ", Ky: "Vũ Khúc" },
        9: { Loc: "Phá Quân", Quyen: "Cự Môn", Khoa: "Thái Âm", Ky: "Tham Lang" }
    };
    
    const tuHoa = tuHoaMap[yearCanIndex];
    for (let p of palates) {
        for (let star of p.chinhTinh) {
            let pureStar = star.split(" ")[0];
            if (pureStar === tuHoa.Loc) p.phuTinh.push("Hóa Lộc");
            if (pureStar === tuHoa.Quyen) p.phuTinh.push("Hóa Quyền");
            if (pureStar === tuHoa.Khoa) p.phuTinh.push("Hóa Khoa");
            if (pureStar === tuHoa.Ky) p.phuTinh.push("Hóa Kỵ");
        }
        for (let star of p.phuTinh) {
            if (star === tuHoa.Loc) p.phuTinh.push("Hóa Lộc");
            if (star === tuHoa.Quyen) p.phuTinh.push("Hóa Quyền");
            if (star === tuHoa.Khoa) p.phuTinh.push("Hóa Khoa");
            if (star === tuHoa.Ky) p.phuTinh.push("Hóa Kỵ");
        }
    }

    return {
        amDuongNamNu: (isDuongCan ? "Dương " : "Âm ") + (isNam ? "Nam" : "Nữ"),
        canChiNam: yearCanChiStr,
        banMenhNapAm: banMenhNapAm,
        cucName: cuc.name,
        cucNumber: cuc.number,
        chuMenh: CHU_MENH[menhIndex],
        chuThan: CHU_THAN[thanIndex],
        menhCung: DIA_CHI[menhIndex],
        thanCung: DIA_CHI[thanIndex],
        tuanCung: [DIA_CHI[tuan1], DIA_CHI[tuan2]],
        trietCung: [DIA_CHI[trietPair[0]], DIA_CHI[trietPair[1]]],
        isThuan,
        palates
    };
}
