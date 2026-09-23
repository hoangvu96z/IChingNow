/**
 * ============================================================================
 * THUẬT TOÁN AN LÁ SỐ TỬ VI ĐẨU SỐ TOÀN DIỆN & LƯU NIÊN, CÂN LƯỢNG (Engine v11)
 * ============================================================================
 * Bổ sung 3 thuật toán quan trọng theo yêu cầu:
 * 1. Thuật toán Cân Lượng Chỉ (Cân Xương Đoán Số - Viên Thiên Cương)
 * 2. Thuật toán Xác định Cung TIỂU HẠN (Hạn 1 năm theo Tam Hợp & Chiều Nam/Nữ)
 * 3. Thuật toán An 12 Cung LƯU NIÊN ĐẠI HẠN (LN.Mệnh, LN.Phụ, LN.Phúc...)
 * ============================================================================
 */

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

const TEN_CUNG_CHUC_NANG = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", 
    "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", 
    "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"
];

const TEN_LN_CHUC_NANG = [
    "LN.Mệnh", "LN.Phụ", "LN.Phúc", "LN.Điền", 
    "LN.Quan", "LN.Nô", "LN.Di", "LN.Tật", 
    "LN.Tài", "LN.Tử", "LN.Phối", "LN.Huynh"
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

// ----------------------------------------------------------------------------
// 1. BẢNG DỮ LIỆU VÀ THUẬT TOÁN CÂN LƯỢNG CHỈ (CÂN XƯƠNG ĐOÁN SỐ - VIÊN THIÊN CƯƠNG)
// ----------------------------------------------------------------------------
const CAN_LUONG_YEAR_MAP = {
    "Giáp Tý": 1.2, "Ất Sửu": 0.6, "Bính Dần": 0.6, "Đinh Mão": 0.7, "Mậu Thìn": 1.2,
    "Kỷ Tỵ": 0.5, "Canh Ngọ": 0.9, "Tân Mùi": 0.8, "Nhâm Thân": 0.7, "Quý Dậu": 0.8,
    "Giáp Tuất": 1.5, "Ất Hợi": 0.9, "Bính Tý": 1.6, "Đinh Sửu": 0.8, "Mậu Dần": 0.8,
    "Kỷ Mão": 1.9, "Canh Thìn": 1.2, "Tân Tỵ": 0.6, "Nhâm Ngọ": 0.8, "Quý Mùi": 0.7,
    "Giáp Thân": 0.5, "Ất Dậu": 1.5, "Bính Tuất": 0.6, "Đinh Hợi": 1.6, "Mậu Tý": 1.5,
    "Kỷ Sửu": 0.7, "Canh Dần": 0.9, "Tân Mão": 1.2, "Nhâm Thìn": 1.0, "Quý Tỵ": 0.7,
    "Giáp Ngọ": 1.5, "Ất Mùi": 0.6, "Bính Thân": 0.5, "Đinh Dậu": 1.4, "Mậu Tuất": 1.4,
    "Kỷ Hợi": 0.9, "Canh Tý": 0.7, "Tân Sửu": 0.7, "Nhâm Dần": 1.2, "Quý Mão": 1.2,
    "Giáp Thìn": 0.8, "Ất Tỵ": 0.7, "Bính Ngọ": 1.3, "Đinh Mùi": 0.5, "Mậu Thân": 1.4,
    "Kỷ Dậu": 0.5, "Canh Tuất": 0.9, "Tân Hợi": 1.7, "Nhâm Tý": 0.5, "Quý Sửu": 0.7,
    "Giáp Dần": 1.2, "Ất Mão": 0.8, "Bính Thìn": 0.8, "Đinh Tỵ": 1.6, "Mậu Ngọ": 1.9,
    "Kỷ Mùi": 0.6, "Canh Thân": 1.4, "Tân Dậu": 1.6, "Nhâm Tuất": 1.0, "Quý Hợi": 0.7
};

const CAN_LUONG_MONTH_MAP = {
    1: 0.6, 2: 0.7, 3: 1.8, 4: 0.9, 5: 0.5, 6: 1.6,
    7: 0.9, 8: 1.5, 9: 1.8, 10: 0.8, 11: 0.9, 12: 0.5
};

const CAN_LUONG_DAY_MAP = {
    1: 0.5, 2: 1.0, 3: 0.8, 4: 1.5, 5: 1.6, 6: 1.5, 7: 0.8, 8: 1.6, 9: 0.8, 10: 1.6,
    11: 0.9, 12: 1.7, 13: 0.8, 14: 1.7, 15: 1.0, 16: 0.8, 17: 0.9, 18: 1.8, 19: 0.5, 20: 1.5,
    21: 1.0, 22: 0.9, 23: 0.8, 24: 0.9, 25: 1.5, 26: 1.8, 27: 0.7, 28: 0.8, 29: 1.6, 30: 0.6
};

const CAN_LUONG_HOUR_MAP = {
    0: 1.6, 1: 0.6, 2: 0.7, 3: 1.0, 4: 0.9, 5: 1.6,
    6: 1.0, 7: 0.8, 8: 0.8, 9: 0.9, 10: 0.6, 11: 0.6
};

function tinhCanLuongChi({ yearCanChiStr, lunarMonth, lunarDay, lunarHourIndex }) {
    const wYear = CAN_LUONG_YEAR_MAP[yearCanChiStr] || 1.0;
    const wMonth = CAN_LUONG_MONTH_MAP[lunarMonth] || 0.7;
    const wDay = CAN_LUONG_DAY_MAP[lunarDay] || 1.0;
    const wHour = CAN_LUONG_HOUR_MAP[lunarHourIndex] || 1.0;

    const toChi = (val) => {
        const luong = Math.floor(val);
        const chi = Math.round((val - luong) * 10);
        return luong * 10 + chi;
    };

    const totalChi = toChi(wYear) + toChi(wMonth) + toChi(wDay) + toChi(wHour);
    const luong = Math.floor(totalChi / 10);
    const chi = totalChi % 10;

    return `${luong} lượng ${chi} chỉ`;
}

// ----------------------------------------------------------------------------
// 2. THUẬT TOÁN XÁC ĐỊNH CUNG TIỂU HẠN
// ----------------------------------------------------------------------------
function getTieuHanIndex({ yearChiIndex, gender, tuoiAm }) {
    let startPos = 10;
    if ([2, 6, 10].includes(yearChiIndex)) startPos = 4;      // Dần-Ngọ-Tuất -> Thìn (4)
    else if ([8, 0, 4].includes(yearChiIndex)) startPos = 10; // Thân-Tý-Thìn -> Tuất (10)
    else if ([5, 9, 1].includes(yearChiIndex)) startPos = 7;  // Tỵ-Dậu-Sửu -> Mùi (7)
    else if ([11, 3, 7].includes(yearChiIndex)) startPos = 1; // Hợi-Mão-Mùi -> Sửu (1)

    const isNam = gender === 1;
    let tieuHanIndex;
    if (isNam) {
        tieuHanIndex = (startPos + (tuoiAm - 1)) % 12;
    } else {
        tieuHanIndex = (startPos - (tuoiAm - 1) % 12 + 120) % 12;
    }
    return tieuHanIndex;
}

// ----------------------------------------------------------------------------
// BẢNG VÀ MÃ TRẠNG THÁI CHÍNH TINH
// ----------------------------------------------------------------------------
const CHU_MENH = {
    0: "Tham Lang", 1: "Cự Môn", 2: "Lộc Tồn", 3: "Văn Khúc",
    4: "Liêm Trinh", 5: "Vũ Khúc", 6: "Phá Quân", 7: "Vũ Khúc",
    8: "Liêm Trinh", 9: "Văn Khúc", 10: "Lộc Tồn", 11: "Cự Môn"
};

const CHU_THAN = {
    0: "Linh Tinh", 1: "Thiên Tướng", 2: "Thiên Lương", 3: "Thiên Đồng",
    4: "Văn Khúc", 5: "Thiên Việt", 6: "Hỏa Tinh", 7: "Thiên Tướng",
    8: "Thiên Lương", 9: "Thiên Đồng", 10: "Văn Khúc", 11: "Thiên Việt"
};

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
    const thangPos = (2 + lunarMonth - 1) % 12;
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

// ----------------------------------------------------------------------------
// HÀM CHÍNH: AN LÁ SỐ TỬ VI
// ----------------------------------------------------------------------------
function anLaSoTuVi({ 
    yearCanIndex, 
    yearChiIndex, 
    lunarMonth, 
    lunarDay, 
    lunarHourIndex, 
    gender, 
    namSinh, 
    namXem, 
    viewYearCanIndex, 
    viewYearChiIndex 
}) {
    const isDuongCan = yearCanIndex % 2 === 0;
    const isNam = gender === 1;
    const isThuan = (isDuongCan && isNam) || (!isDuongCan && !isNam);
    
    const { menhIndex, thanIndex } = getMenhThanIndex(lunarMonth, lunarHourIndex);
    const cuc = getCuc(menhIndex, yearCanIndex);
    const yearCanChiStr = THIEN_CAN[yearCanIndex] + " " + DIA_CHI[yearChiIndex];
    const banMenhNapAm = NAP_AM_MAP[yearCanChiStr] || "Chưa xác định";

    // 1. Cân Lượng Chỉ
    const canLuongStr = tinhCanLuongChi({ yearCanChiStr, lunarMonth, lunarDay, lunarHourIndex });

    // 2. Tính tuổi âm (tuổi mụ)
    let tuoiAm = null;
    if (namSinh !== undefined && namXem !== undefined) {
        tuoiAm = namXem - namSinh + 1;
    } else if (namSinh !== undefined && viewYearChiIndex !== undefined) {
        const curYear = new Date().getFullYear();
        let vy = curYear;
        while ((vy % 12) !== ((viewYearChiIndex + 4) % 12)) vy++;
        tuoiAm = vy - namSinh + 1;
    }

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
        isTieuHan: false,
        luuNienChucNang: "",
        chinhTinh: [],
        phuTinh: []
    }));

    // Gán 12 Cung Chức Năng cố định (luôn chạy thuận), chỉ đảo chiều Đại Hạn
    for (let i = 0; i < 12; i++) {
        // Cung chức năng luôn chạy thuận theo chiều Địa Chi
        palates[(menhIndex + i) % 12].chucNang = TEN_CUNG_CHUC_NANG[i];
        
        // Đại hạn mới chạy thuận/nghịch theo Âm Dương Nam Nữ
        let posDaiHan = isThuan ? (menhIndex + i) % 12 : (menhIndex - i + 120) % 12;
        palates[posDaiHan].daiHan = cuc.number + i * 10;
    }
    palates[thanIndex].chucNang += " <THÂN>";

    // 4. Xác Định Cung TIỂU HẠN & 12 CUNG LƯU NIÊN ĐẠI HẠN
    let tieuHanCung = null;
    if (tuoiAm !== null) {
        // Cung Tiểu Hạn
        const tieuHanIndex = getTieuHanIndex({ yearChiIndex, gender, tuoiAm });
        palates[tieuHanIndex].isTieuHan = true;
        tieuHanCung = DIA_CHI[tieuHanIndex];

        // 12 Cung Lưu Niên Đại Hạn
        const daiHanPalate = palates.find(p => p.daiHan <= tuoiAm && tuoiAm < p.daiHan + 10);
        if (daiHanPalate) {
            const startAge = daiHanPalate.daiHan;
            const daiHanIndex = daiHanPalate.chiIndex;
            const offset = tuoiAm - startAge;

            let lnMenhIndex;
            if (isNam) {
                lnMenhIndex = (daiHanIndex + offset) % 12;
            } else {
                lnMenhIndex = (daiHanIndex - offset + 120) % 12;
            }

            for (let i = 0; i < 12; i++) {
                // 12 Cung chức năng Lưu Niên luôn tịnh tiến theo chiều thuận
                palates[(lnMenhIndex + i) % 12].luuNienChucNang = TEN_LN_CHUC_NANG[i];
            }
        }
    }

    // Tuần Không
    const giapHead = (yearChiIndex - yearCanIndex + 12) % 12;
    const tuanMap = { 
        0: [10, 11], // Giáp Tý -> Tuất Hợi
        10: [8, 9],  // Giáp Tuất -> Thân Dậu
        8: [6, 7],   // Giáp Thân -> Ngọ Mùi
        6: [4, 5],   // Giáp Ngọ -> Thìn Tỵ
        4: [2, 3],   // Giáp Thìn -> Dần Mão
        2: [0, 1]    // Giáp Dần -> Tý Sửu
    };
    const tuanPair = tuanMap[giapHead] || [ (giapHead - 2 + 12) % 12, (giapHead - 1 + 12) % 12 ];
    palates[tuanPair[0]].isTuan = true;
    palates[tuanPair[1]].isTuan = true;

    // Triệt Không
    const trietMap = { 0: [8, 9], 5: [8, 9], 1: [6, 7], 6: [6, 7], 2: [4, 5], 7: [4, 5], 3: [2, 3], 8: [2, 3], 4: [0, 1], 9: [0, 1] };
    const trietPair = trietMap[yearCanIndex];
    palates[trietPair[0]].isTriet = true;
    palates[trietPair[1]].isTriet = true;

    // Vòng Tràng Sinh
    const trangSinhStartMap = { 2: 8, 5: 8, 3: 11, 6: 2, 4: 5 };
    const tsStart = trangSinhStartMap[cuc.number];
    const trangSinhNames = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];
    for (let i = 0; i < 12; i++) {
        let pos = isThuan ? (tsStart + i) % 12 : (tsStart - i + 120) % 12;
        palates[pos].trangSinh = trangSinhNames[i];
    }

    // Tử Vi Tinh Hệ
    const tuViIndex = getTuViIndex(cuc.number, lunarDay);
    palates[tuViIndex].chinhTinh.push(getTrangThaiStar("Tử Vi", tuViIndex));
    palates[(tuViIndex - 1 + 12) % 12].chinhTinh.push(getTrangThaiStar("Thiên Cơ", (tuViIndex - 1 + 12) % 12));
    palates[(tuViIndex - 3 + 12) % 12].chinhTinh.push(getTrangThaiStar("Thái Dương", (tuViIndex - 3 + 12) % 12));
    palates[(tuViIndex - 4 + 12) % 12].chinhTinh.push(getTrangThaiStar("Vũ Khúc", (tuViIndex - 4 + 12) % 12));
    palates[(tuViIndex - 5 + 12) % 12].chinhTinh.push(getTrangThaiStar("Thiên Đồng", (tuViIndex - 5 + 12) % 12));
    palates[(tuViIndex + 4) % 12].chinhTinh.push(getTrangThaiStar("Liêm Trinh", (tuViIndex + 4) % 12));

    // Thiên Phủ Tinh Hệ
    const thienPhuIndex = (4 - tuViIndex + 12) % 12;
    palates[thienPhuIndex].chinhTinh.push(getTrangThaiStar("Thiên Phủ", thienPhuIndex));
    palates[(thienPhuIndex + 1) % 12].chinhTinh.push(getTrangThaiStar("Thái Âm", (thienPhuIndex + 1) % 12));
    palates[(thienPhuIndex + 2) % 12].chinhTinh.push(getTrangThaiStar("Tham Lang", (thienPhuIndex + 2) % 12));
    palates[(thienPhuIndex + 3) % 12].chinhTinh.push(getTrangThaiStar("Cự Môn", (thienPhuIndex + 3) % 12));
    palates[(thienPhuIndex + 4) % 12].chinhTinh.push(getTrangThaiStar("Thiên Tướng", (thienPhuIndex + 4) % 12));
    palates[(thienPhuIndex + 5) % 12].chinhTinh.push(getTrangThaiStar("Thiên Lương", (thienPhuIndex + 5) % 12));
    palates[(thienPhuIndex + 6) % 12].chinhTinh.push(getTrangThaiStar("Thất Sát", (thienPhuIndex + 6) % 12));
    palates[(thienPhuIndex + 10) % 12].chinhTinh.push(getTrangThaiStar("Phá Quân", (thienPhuIndex + 10) % 12));

    // Lộc Tồn, Kình Dương, Đà La
    const locTonMap = { 0: 2, 1: 3, 2: 5, 3: 6, 4: 5, 5: 6, 6: 8, 7: 9, 8: 11, 9: 0 };
    const locTonIndex = locTonMap[yearCanIndex];
    palates[locTonIndex].phuTinh.push("Lộc Tồn");
    palates[(locTonIndex + 1) % 12].phuTinh.push("Kình Dương");
    palates[(locTonIndex - 1 + 12) % 12].phuTinh.push("Đà La");

    // Vòng Bác Sỹ
    const vongLocTonNames = [
        "Bác Sỹ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", 
        "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Phục Binh", "Quan Phù"
    ];
    for (let i = 0; i < 12; i++) {
        let pos = isThuan ? (locTonIndex + i) % 12 : (locTonIndex - i + 120) % 12;
        palates[pos].phuTinh.push(vongLocTonNames[i]);
    }

    // Vòng Thái Tuế
    const vongThaiTueNames = [
        "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", 
        "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"
    ];
    for (let i = 0; i < 12; i++) {
        let pos = (yearChiIndex + i) % 12;
        palates[pos].phuTinh.push(vongThaiTueNames[i]);
    }

    // Phụ Tinh Theo Tháng & Giờ
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

    // Hỏa Tinh & Linh Tinh (Chuẩn theo Âm Dương Nam Nữ & Bộ Cung Khởi)
    let hoaStart = 2, linhStart = 10;
    if ([2, 6, 10].includes(yearChiIndex)) { hoaStart = 1; linhStart = 3; }
    else if ([5, 9, 1].includes(yearChiIndex)) { hoaStart = 3; linhStart = 10; }
    else if ([11, 3, 7].includes(yearChiIndex)) { hoaStart = 9; linhStart = 10; }

    const hoaIndex = isThuan ? (hoaStart + lunarHourIndex) % 12 : (hoaStart - lunarHourIndex + 120) % 12;
    const linhIndex = isThuan ? (linhStart - lunarHourIndex + 120) % 12 : (linhStart + lunarHourIndex) % 12;
    palates[hoaIndex].phuTinh.push("Hỏa Tinh");
    palates[linhIndex].phuTinh.push("Linh Tinh");

    // Các Sao Theo Can / Chi Năm (Đã sửa Khôi-Việt cho Can Đinh & Tân)
    const khoiMap = { 0: 1, 1: 0, 2: 11, 3: 11, 4: 1, 5: 0, 6: 1, 7: 6, 8: 3, 9: 3 };
    const vietMap = { 0: 7, 1: 8, 2: 9, 3: 9, 4: 7, 5: 8, 6: 7, 7: 2, 8: 5, 9: 5 };
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

    // Ân Quang, Thiên Quý
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
    const thienPhucMap = { 0: 9, 1: 8, 2: 0, 3: 11, 4: 3, 5: 2, 6: 6, 7: 5, 8: 6, 9: 5 };
    const thienQuanMap = { 0: 7, 1: 4, 2: 5, 3: 2, 4: 3, 5: 9, 6: 11, 7: 9, 8: 10, 9: 6 };
    palates[thienPhucMap[yearCanIndex]].phuTinh.push("Thiên Phúc");
    palates[thienQuanMap[yearCanIndex]].phuTinh.push("Thiên Quan");

    // Thiên Trù, Lưu Hà, Cô Thần, Quả Tú, Kiếp Sát, Phá Toái, Hoa Cái
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

    // Thiên Không
    palates[(yearChiIndex + 1) % 12].phuTinh.push("Thiên Không");

    // Thiên Sứ, Thiên Thương, Thiên La, Địa Võng
    palates[4].phuTinh.push("Thiên La");
    palates[10].phuTinh.push("Địa Võng");
    
    const tatAchPalate = palates.find(p => p.chucNang.includes("Tật Ách"));
    const noBocPalate = palates.find(p => p.chucNang.includes("Nô Bộc"));
    if (tatAchPalate) tatAchPalate.phuTinh.push("Thiên Sứ");
    if (noBocPalate) noBocPalate.phuTinh.push("Thiên Thương");

    // Thiên Tài, Thiên Thọ
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

    // Tứ Hóa Cố Định (Can Canh chuẩn Nam Phái: Nhật - Vũ - Đồng - Âm)
    const tuHoaMap = {
        0: { Loc: "Liêm Trinh", Quyen: "Phá Quân", Khoa: "Vũ Khúc", Ky: "Thái Dương" },
        1: { Loc: "Thiên Cơ", Quyen: "Thiên Lương", Khoa: "Tử Vi", Ky: "Thái Âm" },
        2: { Loc: "Thiên Đồng", Quyen: "Thiên Cơ", Khoa: "Văn Xương", Ky: "Liêm Trinh" },
        3: { Loc: "Thái Âm", Quyen: "Thiên Đồng", Khoa: "Thiên Cơ", Ky: "Cự Môn" },
        4: { Loc: "Tham Lang", Quyen: "Thái Âm", Khoa: "Hữu Bật", Ky: "Thiên Cơ" },
        5: { Loc: "Vũ Khúc", Quyen: "Tham Lang", Khoa: "Thiên Lương", Ky: "Văn Khúc" },
        6: { Loc: "Thái Dương", Quyen: "Vũ Khúc", Khoa: "Thiên Đồng", Ky: "Thái Âm" },
        7: { Loc: "Cự Môn", Quyen: "Thiên Lương", Khoa: "Văn Khúc", Ky: "Văn Xương" },
        8: { Loc: "Thiên Lương", Quyen: "Tử Vi", Khoa: "Tả Phụ", Ky: "Vũ Khúc" },
        9: { Loc: "Phá Quân", Quyen: "Cự Môn", Khoa: "Thái Âm", Ky: "Tham Lang" }
    };
    
    const tuHoa = tuHoaMap[yearCanIndex];
    for (let p of palates) {
        let starsInPalate = [...p.chinhTinh.map(s => s.split("(")[0].trim()), ...p.phuTinh];
        if (starsInPalate.includes(tuHoa.Loc)) p.phuTinh.push("Hóa Lộc");
        if (starsInPalate.includes(tuHoa.Quyen)) p.phuTinh.push("Hóa Quyền");
        if (starsInPalate.includes(tuHoa.Khoa)) p.phuTinh.push("Hóa Khoa");
        if (starsInPalate.includes(tuHoa.Ky)) p.phuTinh.push("Hóa Kỵ");
    }

    // 14. Bộ Sao Lưu Niên & Tứ Hóa Lưu Niên (Khi có viewYear)
    if (viewYearCanIndex !== undefined && viewYearChiIndex !== undefined) {
        // L.Thái Tuế
        palates[viewYearChiIndex].phuTinh.push("L.Thái Tuế");
        
        // L.Lộc Tồn, L.Kình Dương, L.Đà La
        const lLocTon = locTonMap[viewYearCanIndex];
        palates[lLocTon].phuTinh.push("L.Lộc Tồn");
        palates[(lLocTon + 1) % 12].phuTinh.push("L.Kình Dương");
        palates[(lLocTon - 1 + 12) % 12].phuTinh.push("L.Đà La");
        
        // L.Thiên Mã
        palates[maMap[viewYearChiIndex]].phuTinh.push("L.Thiên Mã");
        
        // L.Tang Môn, L.Bạch Hổ
        palates[(viewYearChiIndex + 2) % 12].phuTinh.push("L.Tang Môn");
        palates[(viewYearChiIndex + 8) % 12].phuTinh.push("L.Bạch Hổ");
        
        // L.Thiên Khốc, L.Thiên Hư
        palates[(6 - viewYearChiIndex + 120) % 12].phuTinh.push("L.Thiên Khốc");
        palates[(6 + viewYearChiIndex) % 12].phuTinh.push("L.Thiên Hư");

        // Tứ Hóa Lưu Niên
        const lTuHoa = tuHoaMap[viewYearCanIndex];
        for (let p of palates) {
            let starsInPalate = [...p.chinhTinh.map(s => s.split("(")[0].trim()), ...p.phuTinh];
            if (starsInPalate.includes(lTuHoa.Loc)) p.phuTinh.push("L.Hóa Lộc");
            if (starsInPalate.includes(lTuHoa.Quyen)) p.phuTinh.push("L.Hóa Quyền");
            if (starsInPalate.includes(lTuHoa.Khoa)) p.phuTinh.push("L.Hóa Khoa");
            if (starsInPalate.includes(lTuHoa.Ky)) p.phuTinh.push("L.Hóa Kỵ");
        }
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
        canLuongStr,
        tuoiAm,
        tieuHanCung,
        viewYearStr: (viewYearCanIndex !== undefined && viewYearChiIndex !== undefined) ? (THIEN_CAN[viewYearCanIndex] + " " + DIA_CHI[viewYearChiIndex]) : null,
        palates
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        anLaSoTuVi,
        tinhCanLuongChi,
        getTieuHanIndex,
        getMenhThanIndex,
        getCuc,
        getTuViIndex,
        THIEN_CAN,
        DIA_CHI,
        TEN_CUNG_CHUC_NANG,
        TEN_LN_CHUC_NANG
    };
}
