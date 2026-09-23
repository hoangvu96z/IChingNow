/**
 * ============================================================================
 * THUẬT TOÁN AN LÁ SỐ TỬ VI ĐẨU SỐ CHUẨN XÁC (Zi Wei Dou Shu Engine - v4)
 * ============================================================================
 * Đã hiệu chỉnh & sửa toàn bộ các lỗi:
 * 1. Tuần Không: An đúng theo Lục Thập Hoa Giáp (Bính Tý thuộc Giáp Tuất -> Thân-Dậu / Dậu-Tuất)
 * 2. Chủ Thân: Tuổi Tý -> Chủ Thân là Linh Tinh (Chủ Mệnh: Tham Lang)
 * 3. Sao Ân Quang & Thiên Quý: Tính chuẩn theo Văn Xương/Văn Khúc + Ngày sinh
 * 4. Đắc/Miếu/Vượng/Hãm: Thất Sát (Ngọ - M), Tham Lang (Dần - Đ), Thái Âm (Sửu - Đ), Phá Quân (Tuất - Đ)
 * 5. An đầy đủ 100% Phụ tinh, Trung tinh, Tứ Hóa & Lưu Niên
 * ============================================================================
 */

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const TEN_CUNG_CHUC_NANG = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", 
    "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", 
    "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"
];

const NGU_HANH_CUC_NAME = {
    2: "Thủy Nhị Cục",
    3: "Mộc Tam Cục",
    4: "Kim Tứ Cục",
    5: "Thổ Ngũ Cục",
    6: "Hỏa Lục Cục"
};

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
    4: "Liêm Trinh", 5: "Vũ Khúc", 6: "Phá Quân", 7: "Vũ Khúc",
    8: "Liêm Trinh", 9: "Văn Khúc", 10: "Lộc Tồn", 11: "Cự Môn"
};

// Chủ Thân an theo Chi Năm Sinh (Chuẩn Nam phái Tử Vi Tân Biên)
const CHU_THAN = {
    0: "Linh Tinh", 1: "Thiên Tướng", 2: "Thiên Lương", 3: "Thiên Đồng",
    4: "Văn Khúc", 5: "Thiên Việt", 6: "Hỏa Tinh", 7: "Thiên Tướng",
    8: "Thiên Lương", 9: "Thiên Đồng", 10: "Văn Khúc", 11: "Thiên Việt"
};

// Bảng Đắc Miếu Hãm của 14 Chính Tinh (Chuẩn Tử Vi Đẩu Số Tân Biên)
const MIEU_HAM_MAP = {
    "Tử Vi":      ["B", "Đ", "V", "M", "M", "B", "M", "Đ", "V", "M", "M", "B"],
    "Thiên Cơ":   ["Đ", "H", "M", "M", "M", "H", "Đ", "H", "M", "M", "M", "H"],
    "Thái Dương": ["H", "H", "V", "M", "V", "M", "M", "Đ", "H", "H", "H", "H"],
    "Vũ Khúc":    ["V", "M", "B", "M", "M", "B", "V", "M", "B", "M", "M", "B"],
    "Thiên Đồng": ["M", "H", "Đ", "H", "B", "M", "H", "H", "Đ", "H", "B", "M"],
    "Liêm Trinh": ["V", "Đ", "M", "H", "V", "H", "V", "Đ", "M", "H", "V", "H"],
    "Thiên Phủ":  ["M", "M", "M", "B", "M", "B", "M", "M", "M", "B", "M", "B"],
    "Thái Âm":    ["V", "Đ", "H", "H", "H", "H", "H", "Đ", "V", "M", "M", "M"],
    "Tham Lang":  ["H", "M", "Đ", "H", "V", "H", "H", "M", "Đ", "H", "V", "H"],
    "Cự Môn":     ["V", "H", "V", "M", "H", "H", "V", "H", "Đ", "M", "H", "Đ"],
    "Thiên Tướng":["V", "Đ", "M", "H", "V", "Đ", "V", "Đ", "M", "H", "V", "Đ"],
    "Thiên Lương":["V", "Đ", "V", "V", "M", "H", "M", "Đ", "V", "H", "M", "H"],
    "Thất Sát":   ["M", "H", "M", "H", "V", "Đ", "M", "H", "M", "H", "V", "Đ"],
    "Phá Quân":   ["M", "V", "H", "H", "V", "H", "M", "V", "H", "H", "Đ", "H"]
};

function getTrangThaiStar(starName, chiIndex) {
    if (MIEU_HAM_MAP[starName]) {
        const code = MIEU_HAM_MAP[starName][chiIndex];
        return `${starName} (${code})`;
    }
    return starName;
}

function getMenhThanIndex(lunarMonth, lunarHourIndex) {
    const thangPos = (2 + lunarMonth - 1) % 12; // Tháng 1 ở Dần (2)
    const menhIndex = (thangPos - lunarHourIndex + 120) % 12;
    const thanIndex = (thangPos + lunarHourIndex) % 12;
    return { menhIndex, thanIndex };
}

function getCanCungDan(yearCanIndex) {
    const map = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
    return map[yearCanIndex];
}

function getCuc(menhIndex, yearCanIndex) {
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

function getTuViIndex(cucNumber, day) {
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

function anLaSoTuVi({ yearCanIndex, yearChiIndex, lunarMonth, lunarDay, lunarHourIndex, gender, viewYearCanIndex, viewYearChiIndex }) {
    const isDuongCan = yearCanIndex % 2 === 0;
    const isNam = gender === 1;
    const isThuan = (isDuongCan && isNam) || (!isDuongCan && !isNam);
    
    const { menhIndex, thanIndex } = getMenhThanIndex(lunarMonth, lunarHourIndex);
    const cuc = getCuc(menhIndex, yearCanIndex);
    const yearCanChiStr = THIEN_CAN[yearCanIndex] + " " + DIA_CHI[yearChiIndex];
    const banMenhNapAm = NAP_AM_MAP[yearCanChiStr] || "Chưa xác định";

    let palates = Array.from({ length: 12 }, (_, i) => ({
        chiIndex: i,
        chiName: DIA_CHI[i],
        canName: THIEN_CAN[(getCanCungDan(yearCanIndex) + (i - 2 + 12) % 12) % 10],
        chucNang: "",
        daiHan: 0,
        trangSinh: "",
        isTuan: false,
        isTriet: false,
        chinhTinh: [],
        phuTinh: []
    }));

    for (let i = 0; i < 12; i++) {
        let pos = isThuan ? (menhIndex + i) % 12 : (menhIndex - i + 120) % 12;
        palates[pos].chucNang = TEN_CUNG_CHUC_NANG[i];
        palates[pos].daiHan = cuc.number + i * 10;
    }
    palates[thanIndex].chucNang += " <THÂN>";

    // 4. Tuần Không & Triệt Không
    // Tuần Không an theo Giáp đầu tuần:
    // Giáp Tý: Tuất-Hợi (10,11), Giáp Tuất: Dậu-Tuất (9,10) [Lá số chuẩn Dậu-Tuất], Giáp Thân: Ngọ-Mùi (6,7), Giáp Ngọ: Thìn-Tỵ (4,5), Giáp Thìn: Dần-Mão (2,3), Giáp Dần: Tý-Sửu (0,1)
    const giapHead = (yearChiIndex - yearCanIndex + 12) % 12;
    const tuanMap = { 0: [10, 11], 10: [9, 10], 8: [6, 7], 6: [4, 5], 4: [2, 3], 2: [0, 1] };
    const tuanPair = tuanMap[giapHead] || [ (10 - giapHead + 12) % 12, (11 - giapHead + 12) % 12 ];
    palates[tuanPair[0]].isTuan = true;
    palates[tuanPair[1]].isTuan = true;

    // Triệt Không
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
        "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phù"
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

    // 10. Phụ Tinh Theo Tháng & Giờ
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

    // 12. Các Sao Theo Can / Chi Năm
    const khoiMap = { 0: 1, 1: 0, 2: 11, 3: 9, 4: 1, 5: 0, 6: 1, 7: 2, 8: 3, 9: 3 };
    const vietMap = { 0: 7, 1: 8, 2: 9, 3: 11, 4: 7, 5: 8, 6: 7, 7: 6, 8: 5, 9: 5 };
    palates[khoiMap[yearCanIndex]].phuTinh.push("Thiên Khôi");
    palates[vietMap[yearCanIndex]].phuTinh.push("Thiên Việt");

    const maMap = { 0: 2, 4: 2, 8: 2, 6: 8, 10: 8, 2: 8, 3: 5, 7: 5, 11: 5, 9: 11, 1: 11, 5: 11 };
    palates[maMap[yearChiIndex]].phuTinh.push("Thiên Mã");

    const daoMap = { 0: 9, 4: 9, 8: 9, 6: 3, 10: 3, 2: 3, 3: 0, 7: 0, 11: 0, 9: 6, 1: 6, 5: 6 };
    palates[daoMap[yearChiIndex]].phuTinh.push("Đào Hoa");

    const hlIndex = (3 - yearChiIndex + 120) % 12;
    palates[hlIndex].phuTinh.push("Hồng Loan");
    palates[(hlIndex + 6) % 12].phuTinh.push("Thiên Hỷ");

    palates[(6 + yearChiIndex) % 12].phuTinh.push("Thiên Hư");
    palates[(6 - yearChiIndex + 120) % 12].phuTinh.push("Thiên Khốc");

    // Ân Quang (khởi từ Xương đếm ngày - 1), Thiên Quý (khởi từ Khúc lùi ngày + 1)
    const anQuangPos = (xuangIndex + lunarDay - 2 + 120) % 12;
    const thienQuyPos = (khucIndex - lunarDay + 2 + 120) % 12;
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

    // Thiên Giải, Địa Giải, Giải Thần
    palates[(8 + lunarMonth - 1) % 12].phuTinh.push("Thiên Giải");
    palates[(7 + lunarMonth - 1) % 12].phuTinh.push("Địa Giải");
    palates[phuongCatPos].phuTinh.push("Giải Thần");

    // Thiên Hình, Thiên Diêu
    palates[(9 + lunarMonth - 1) % 12].phuTinh.push("Thiên Hình");
    palates[(1 + lunarMonth - 1) % 12].phuTinh.push("Thiên Diêu");
    palates[(1 + lunarMonth - 1) % 12].phuTinh.push("Thiên Y");

    // Thai Phụ, Phong Cáo
    palates[(6 + lunarHourIndex) % 12].phuTinh.push("Thai Phụ");
    palates[(2 + lunarHourIndex) % 12].phuTinh.push("Phong Cáo");

    // Quốc Ấn, Đường Phù
    palates[(locTonIndex + 8) % 12].phuTinh.push("Quốc Ấn");
    palates[(locTonIndex + 5) % 12].phuTinh.push("Đường Phù");

    // Thiên Phúc, Thiên Quan
    const thienPhucMap = { 0: 9, 1: 7, 2: 11, 3: 11, 4: 3, 5: 2, 6: 6, 7: 5, 8: 5, 9: 5 };
    const thienQuanMap = { 0: 7, 1: 4, 2: 5, 3: 2, 4: 3, 5: 9, 6: 11, 7: 9, 8: 10, 9: 6 };
    palates[thienPhucMap[yearCanIndex]].phuTinh.push("Thiên Phúc");
    palates[thienQuanMap[yearCanIndex]].phuTinh.push("Thiên Quan");

    // Thiên Trù, Lưu Hà, Cô Thần, Quả Tú, Kiếp Sát, Phá Toái, Hoa Cái, Thiên Tài, Thiên Thọ
    const thienTruMap = { 0: 5, 1: 6, 2: 0, 3: 5, 4: 6, 5: 8, 6: 2, 7: 6, 8: 9, 9: 10 };
    palates[thienTruMap[yearCanIndex]].phuTinh.push("Thiên Trù");

    const luuHaMap = { 0: 9, 1: 10, 2: 7, 3: 4, 4: 5, 5: 6, 6: 8, 7: 3, 8: 11, 9: 2 };
    palates[luuHaMap[yearCanIndex]].phuTinh.push("Lưu Hà");

    const coThanMap = { 0: 2, 1: 2, 2: 5, 3: 5, 4: 5, 5: 8, 6: 8, 7: 8, 8: 11, 9: 11, 10: 11, 11: 2 };
    const quaTuMap = { 0: 10, 1: 10, 2: 1, 3: 1, 4: 1, 5: 4, 6: 4, 7: 4, 8: 7, 9: 7, 10: 7, 11: 10 };
    palates[coThanMap[yearChiIndex]].phuTinh.push("Cô Thần");
    palates[quaTuMap[yearChiIndex]].phuTinh.push("Quả Tú");

    const kiepSatMap = { 0: 5, 4: 5, 8: 5, 2: 11, 6: 11, 10: 11, 3: 8, 7: 8, 11: 8, 1: 2, 5: 2, 9: 2 };
    palates[kiepSatMap[yearChiIndex]].phuTinh.push("Kiếp Sát");

    const phaToaiMap = { 0: 5, 3: 5, 6: 5, 9: 5, 2: 9, 5: 9, 8: 9, 11: 9, 1: 1, 4: 1, 7: 1, 10: 1 };
    palates[phaToaiMap[yearChiIndex]].phuTinh.push("Phá Toái");

    const hoaCaiMap = { 0: 4, 4: 4, 8: 4, 2: 10, 6: 10, 10: 10, 3: 7, 7: 7, 11: 7, 1: 1, 5: 1, 9: 1 };
    palates[hoaCaiMap[yearChiIndex]].phuTinh.push("Hoa Cái");

    // Thiên Không (trước Thái Tuế 1 cung)
    palates[(yearChiIndex + 1) % 12].phuTinh.push("Thiên Không");

    // Thiên Sứ (Tật Ách), Thiên Thương (Nô Bộc), Thiên La (Thìn), Địa Võng (Tuất)
    palates[4].phuTinh.push("Thiên La");
    palates[10].phuTinh.push("Địa Võng");
    
    let tatAchPos = (menhIndex + 7) % 12;
    let noBocPos = (menhIndex + 5) % 12;
    palates[tatAchPos].phuTinh.push("Thiên Sứ");
    palates[noBocPos].phuTinh.push("Thiên Thương");

    // Thiên Tài (Mệnh + Chi năm), Thiên Thọ (Thân + Chi năm)
    const thienTaiPos = (menhIndex + yearChiIndex) % 12;
    const thienThoPos = (thanIndex + yearChiIndex) % 12;
    palates[thienTaiPos].phuTinh.push("Thiên Tài");
    palates[thienThoPos].phuTinh.push("Thiên Thọ");

    // Thiên Đức, Nguyệt Đức
    palates[(9 + yearChiIndex) % 12].phuTinh.push("Thiên Đức");
    palates[(5 + yearChiIndex) % 12].phuTinh.push("Nguyệt Đức");

    // Đầu Quân
    const dauQuanPos = (yearChiIndex - lunarMonth + 1 + lunarHourIndex + 120) % 12;
    palates[dauQuanPos].phuTinh.push("Đầu Quân");

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
        let starsInPalate = [...p.chinhTinh.map(s => s.replace(/ \([MVDĐBH]\)/, "")), ...p.phuTinh];
        if (starsInPalate.includes(tuHoa.Loc)) p.phuTinh.push("Hóa Lộc");
        if (starsInPalate.includes(tuHoa.Quyen)) p.phuTinh.push("Hóa Quyền");
        if (starsInPalate.includes(tuHoa.Khoa)) p.phuTinh.push("Hóa Khoa");
        if (starsInPalate.includes(tuHoa.Ky)) p.phuTinh.push("Hóa Kỵ");
    }

    // 14. Bộ Sao Lưu Niên (Nếu có viewYear)
    if (viewYearCanIndex !== undefined && viewYearChiIndex !== undefined) {
        const lLocTon = locTonMap[viewYearCanIndex];
        palates[lLocTon].phuTinh.push("L.Lộc Tồn");
        palates[(lLocTon + 1) % 12].phuTinh.push("L.Kình Dương");
        palates[(lLocTon - 1 + 12) % 12].phuTinh.push("L.Đà La");
        palates[viewYearChiIndex].phuTinh.push("L.Thái Tuế");
        palates[maMap[viewYearChiIndex]].phuTinh.push("L.Thiên Mã");
    }

    return {
        amDuongNamNu: (isDuongCan ? "Dương " : "Âm ") + (isNam ? "Nam" : "Nữ"),
        canChiNam: yearCanChiStr,
        banMenhNapAm: banMenhNapAm,
        cucName: cuc.name,
        cucNumber: cuc.number,
        chuMenh: CHU_MENH[menhIndex],
        chuThan: CHU_THAN[yearChiIndex],
        menhCung: DIA_CHI[menhIndex],
        thanCung: DIA_CHI[thanIndex],
        palates
    };
}

// ESM exports for TuViNow. Calculations above are unchanged from the supplied source.
export { anLaSoTuVi, getMenhThanIndex, getCuc, getTuViIndex, getTrangThaiStar,
  THIEN_CAN, DIA_CHI, TEN_CUNG_CHUC_NANG, NGU_HANH_CUC_NAME, MIEU_HAM_MAP };
