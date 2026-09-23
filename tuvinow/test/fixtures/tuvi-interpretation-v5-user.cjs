/**
 * ============================================================================
 * THUẬT TOÁN LUẬN ĐOÁN LÁ SỐ TỬ VI TỰ ĐỘNG (Zi Wei Dou Shu Engine - v5)
 * ============================================================================
 * Nâng cấp & Sửa lỗi logic chuyên môn theo phản hồi thực tế:
 * 1. Tinh chỉnh nhận diện Cách Cục Tam Hợp (evalStep3_TamHopCáchCục):
 *    - Phân biệt rõ "Thiên Tướng độc tọa (Hãm địa)" với bộ "Tử Phủ Vũ Tướng hoàng kim".
 *    - Bộ "Tử Phủ Vũ Tướng" chỉ kích hoạt khi Mệnh có Tử/Phủ HOẶC tam hợp hội tụ >= 3 sao và có ít nhất 1 sao Miếu/Vượng.
 * 2. Tái thiết kế diễn giải Chính Tinh Hãm Địa (getChinhTinhMeaning):
 *    - Cung cấp nghĩa thực tế sát với thực tế hãm địa cho từng chính tinh (ví dụ: Thiên Tướng hãm = cả tin, thiếu dứt khoát).
 * 3. Đánh giá sát thực mức độ nguy hại khi Mệnh có Sát Tinh + Chính Tinh Hãm Địa (evalStep4_SatTinhTuHoa):
 *    - Cảnh báo rõ nguy cơ trắc trở công danh, hao tốn tài sản, bị lừa gạt khi gặp cách "Tướng ngộ Kiếp" / Sát tinh hãm.
 * ============================================================================
 */

const NGU_HANH_ELEMENT = {
    "Kim": { sinh: "Thủy", khac: "Mộc", duocSinh: "Thổ", bịKhac: "Hỏa" },
    "Mộc": { sinh: "Hỏa", khac: "Thổ", duocSinh: "Thủy", bịKhac: "Kim" },
    "Thủy": { sinh: "Mộc", khac: "Hỏa", duocSinh: "Kim", bịKhac: "Thổ" },
    "Hỏa": { sinh: "Thổ", khac: "Kim", duocSinh: "Mộc", bịKhac: "Thủy" },
    "Thổ": { sinh: "Kim", khac: "Thủy", duocSinh: "Hỏa", bịKhac: "Mộc" }
};

const CUNG_AM_DUONG = {
    "Tý": "Dương", "Sửu": "Âm", "Dần": "Dương", "Mão": "Âm",
    "Thìn": "Dương", "Tỵ": "Âm", "Ngọ": "Dương", "Mùi": "Âm",
    "Thân": "Dương", "Dậu": "Âm", "Tuất": "Dương", "Hợi": "Âm"
};

const CUC_NGU_HANH = {
    2: "Thủy", 3: "Mộc", 4: "Kim", 5: "Thổ", 6: "Hỏa"
};

function getHanhNapAm(napAmStr) {
    if (!napAmStr) return "Mộc";
    const str = String(napAmStr).toLowerCase();
    if (str.includes("kim")) return "Kim";
    if (str.includes("mộc") || str.includes("moc")) return "Mộc";
    if (str.includes("thủy") || str.includes("thuy")) return "Thủy";
    if (str.includes("hỏa") || str.includes("hoa")) return "Hỏa";
    if (str.includes("thổ") || str.includes("tho")) return "Thổ";
    return "Mộc";
}

function parseStar(starStr) {
    if (!starStr) return { name: "", code: "" };
    const parts = starStr.split("(");
    const name = parts[0].trim();
    const code = parts[1] ? parts[1].replace(")", "").trim() : "";
    return { name, code };
}

// ----------------------------------------------------------------------------
// BƯỚC 1: ĐÁNH GIÁ THIÊN BÀN & MỆNH - CỤC
// ----------------------------------------------------------------------------
function evalStep1_ThienBan(laSo) {
    const res = [];
    const amDuongNamNu = laSo.amDuongNamNu;
    const menhCungChi = laSo.menhCung;
    const amDuongCung = CUNG_AM_DUONG[menhCungChi];
    
    const isDuongNguoi = amDuongNamNu.includes("Dương");
    const isDuongCung = amDuongCung === "Dương";
    
    if (isDuongNguoi === isDuongCung) {
        res.push(`• **Âm Dương Thuận Lý**: Bạn là ${amDuongNamNu}, Cung Mệnh an tại ${menhCungChi} (${amDuongCung} Cung). Âm Dương thuận lý giúp cuộc đời gặp nhiều may mắn, hoàn cảnh thuận lợi, nhân duyên và quý nhân trợ lực.`);
    } else {
        res.push(`• **Âm Dương Nghịch Lý**: Bạn là ${amDuongNamNu}, Cung Mệnh an tại ${menhCungChi} (${amDuongCung} Cung). Âm Dương nghịch lý khiến tiền vận dễ gặp nghịch cảnh, trắc trở, cần nhiều nỗ lực vươn lên.`);
    }

    const hanhMenh = getHanhNapAm(laSo.banMenhNapAm);
    const hanhCuc = CUC_NGU_HANH[laSo.cucNumber];

    if (hanhMenh === hanhCuc) {
        res.push(`• **Mệnh Cục Tương Hòa**: Bản Mệnh (${laSo.banMenhNapAm}) và Cục (${laSo.cucName}) đồng hành ${hanhMenh}. Cuộc sống tương đối bình hòa, dễ thích nghi với môi trường xung quanh.`);
    } else if (NGU_HANH_ELEMENT[hanhCuc].sinh === hanhMenh) {
        res.push(`• **Cục Sinh Mệnh** (${hanhCuc} sinh ${hanhMenh}): RẤT TỐT! Cục (${laSo.cucName}) tương sinh cho Bản Mệnh (${laSo.banMenhNapAm}). Môi trường và hoàn cảnh bên ngoài luôn tạo điều kiện, quý nhân giúp đỡ, dễ gặt hái thành công.`);
    } else if (NGU_HANH_ELEMENT[hanhMenh].sinh === hanhCuc) {
        res.push(`• **Mệnh Sinh Cục** (${hanhMenh} sinh ${hanhCuc}): Bản Mệnh phải vất vả tiêu tốn năng lượng để cống hiến cho công việc và hoàn cảnh. Phải làm nhiều mới được hưởng.`);
    } else if (NGU_HANH_ELEMENT[hanhMenh].khac === hanhCuc) {
        res.push(`• **Mệnh Khắc Cục** (${hanhMenh} khắc ${hanhCuc}): Bản Mệnh tự lực cánh sinh, vượt qua nghịch cảnh để vươn lên. Cuộc đời hay gặp thử thách nhưng bản lĩnh có thể làm chủ hoàn cảnh.`);
    } else {
        res.push(`• **Cục Khắc Mệnh** (${hanhCuc} khắc ${hanhMenh}): Cục (${laSo.cucName}) khắc Bản Mệnh (${laSo.banMenhNapAm}). Hoàn cảnh xung quanh hay gây cản trở, áp lực lớn, cần kiên trì bền chí.`);
    }

    const menhPalate = laSo.palates.find(p => p.chiName === laSo.menhCung);
    if (menhPalate) {
        res.push(`• **Thế Cung Mệnh tại ${laSo.menhCung}**: Vòng Tràng Sinh đóng tại **${menhPalate.trangSinh}**. (${getTrangSinhDetail(menhPalate.trangSinh)})`);
    }

    return res.join("\n");
}

function getTrangSinhDetail(tsName) {
    const map = {
        "Tràng Sinh": "Giai đoạn khởi phát, sinh lực dồi dào, có sức sống mãnh liệt.",
        "Mộc Dục": "Thích cái đẹp, lãng mạn, dễ thay đổi hoặc có duyên nghệ thuật.",
        "Quan Đới": "Đang trên đà phát triển sự nghiệp, có chí tiến thủ cao.",
        "Lâm Quan": "Sự nghiệp và bản lĩnh vững vàng, có uy danh, độc lập.",
        "Đế Vượng": "Đỉnh cao tài năng và khí lực, thịnh vượng, tố chất lãnh đạo.",
        "Suy": "Khí lực bắt đầu trầm lắng, nên giữ vững thành quả thay vì mạo hiểm.",
        "Bệnh": "Tâm tính hay suy tư, nhạy cảm, cần chú ý sức khỏe.",
        "Tử": "Kín đáo, trầm lặng, thích nghiên cứu chuyên sâu, cẩn trọng.",
        "Mộ": "Thích tích lũy, kín kẽ, giữ tài sản tốt, có chiều sâu nội tâm.",
        "Tuyệt": "Sự biến động lớn, hay thay đổi môi trường hoặc tư tưởng.",
        "Thai": "Mầm sống mới, nhiều ý tưởng ấp ủ, có tính sáng tạo.",
        "Dưỡng": "Được chăm sóc, bồi dưỡng, tính tình ôn hòa, kiên nhẫn."
    };
    return map[tsName] || "Cơ bản bình hòa.";
}

// ----------------------------------------------------------------------------
// BƯỚC 2: PHÂN TÍCH MỆNH & THÂN (CẬP NHẬT Ý NGHĨA CHÍNH TINH HÃM ĐỊA)
// ----------------------------------------------------------------------------
function evalStep2_MenhThan(laSo) {
    const res = [];
    const menhPalate = laSo.palates.find(p => p.chucNang.includes("Mệnh"));
    const thanPalate = laSo.palates.find(p => p.chucNang.includes("<THÂN>"));

    res.push(`### 1. Cung Mệnh (An tại ${laSo.menhCung})`);
    if (menhPalate.chinhTinh.length === 0) {
        const diPalate = laSo.palates.find(p => p.chucNang.includes("Thiên Di"));
        const diChiName = diPalate ? diPalate.chiName : laSo.palates[(menhPalate.chiIndex + 6) % 12].chiName;
        res.push(`• **Cách cục Vô Chính Diệu**: Cung Mệnh không có Chính Tinh tọa thủ. Bạn là người thông minh, linh hoạt, khả năng ứng biến cao. Tiền vận hay chao đảo, nên lấy Chính Tinh xung chiếu tại Cung Thiên Di (${diChiName}) làm nòng cốt.`);
    } else {
        res.push(`• **Chính Tinh Tọa Thủ**: ${menhPalate.chinhTinh.join(", ")}.`);
        menhPalate.chinhTinh.forEach(star => {
            res.push(`  - **${star}**: ${getChinhTinhMeaning(star, menhPalate.chiName)}`);
        });
    }

    if (menhPalate.isTuan) res.push(`• **Có Tuần Không Án Ngữ**: Tuần mang lại tính cẩn trọng, kín kẽ, tiền vận vất vả nhưng hậu vận bền vững.`);
    if (menhPalate.isTriet) res.push(`• **Có Triệt Không Án Ngữ**: Triệt án ngữ tiền vận hay gặp trắc trở, lập nghiệp xa quê hoặc thay đổi hướng đi trước năm 30 tuổi.`);

    res.push(`\n### 2. Cung Thân (An tại ${laSo.thanCung})`);
    res.push(`• **Vị trí Cung Thân**: ${thanPalate.chucNang}`);
    res.push(`  - **Ý nghĩa**: ${getThanPositionMeaning(thanPalate.chucNang)}`);
    if (thanPalate.chinhTinh.length > 0) {
        res.push(`• **Chính Tinh Cung Thân**: ${thanPalate.chinhTinh.join(", ")}.`);
    }

    res.push(`• **Chủ Mệnh**: ${laSo.chuMenh} | **Chủ Thân**: ${laSo.chuThan}`);

    return res.join("\n");
}

function getChinhTinhMeaning(starStr, chiName) {
    const { name, code } = parseStar(starStr);
    
    const baseMap = {
        "Tử Vi": "Đế tinh, chủ về uy quyền, tài năng quản lý, tự trọng cao.",
        "Thiên Cơ": "Thiện tinh, chủ về trí tuệ, mưu lược, sự linh hoạt, khéo léo.",
        "Thái Dương": "Nhật tinh, chủ về danh tiếng, quang minh, xông xáo, vị tha.",
        "Vũ Khúc": "Tài tinh, chủ về tài chính, sự quyết đoán, thực tế, quả cảm.",
        "Thiên Đồng": "Phúc tinh, chủ về sự ôn hòa, may mắn, thích an nhàn, có duyên.",
        "Liêm Trinh": "Đào hoa & Quyền tinh, chủ về bản lĩnh, nguyên tắc, trung thành.",
        "Thiên Phủ": "Kho đống & Đại tài tinh, chủ về quản lý tiền bạc, chu đáo, vượng tài.",
        "Thái Âm": "Nguyệt tinh & Tài tinh, chủ về phú quý, sự tinh tế, nhu hòa, bất động sản.",
        "Tham Lang": "Đào hoa & Uy quyền tinh, chủ về ham học hỏi, ngoại giao, nhiều tham vọng.",
        "Cự Môn": "Thần ngôn luận, chủ về khả năng giao tiếp, lập luận, lý luận sắc bén.",
        "Thiên Tướng": "Ấn tinh, chủ về sự đàng hoàng, lòng tự trọng, có tinh thần trách nhiệm.",
        "Thiên Lương": "Ấm tinh & Thọ tinh, chủ về lòng nhân hậu, thích giúp đỡ, có duyên tâm linh.",
        "Thất Sát": "Tướng tinh, chủ về sự quyết đoán, dũng cảm, xông xáo, bứt phá.",
        "Phá Quân": "Hao tinh & Tướng tinh, chủ về tính tiên phong, đổi mới, dám nghĩ dám làm."
    };

    const hamMap = {
        "Tử Vi": "Đế tinh hãm địa: Dễ sinh tâm lý tự cao, cô độc, thiếu quý nhân phò tá, công danh trắc trở.",
        "Thiên Cơ": "Thiện tinh hãm địa: Hay lo nghĩ viễn vông, tính toán thiếu thực tế, tâm lý bất an, dễ chao đảo.",
        "Thái Dương": "Nhật tinh hãm địa: Chí khí dễ bị che lấp, làm nhiều hưởng ít, vất vả vì người khác, chú ý sức khỏe.",
        "Vũ Khúc": "Tài tinh hãm địa: Quản lý tài chính gặp khó khăn, cô độc, tính tình cứng nhắc, dễ hao tài.",
        "Thiên Đồng": "Phúc tinh hãm địa: Tính tình hay đổi thay, thiếu kiên nhẫn, dễ chán nản, vất vả bươn chải.",
        "Liêm Trinh": "Đào hoa & Quyền tinh hãm địa: Nóng nảy, dễ vướng thị phi, hình hại, quan tụng hoặc tai vướng bất ngờ.",
        "Thiên Phủ": "Kho đống hãm địa: Tích lũy khó khăn, dễ bị xáo trộn tài chính, thiếu sự chủ động.",
        "Thái Âm": "Nguyệt tinh hãm địa: Tình cảm dễ phiền muộn, ý chí yếu mềm, tài chính trồi sụt, vất vả về đêm.",
        "Tham Lang": "Đào hoa tinh hãm địa: Dễ sa đà vào ham muốn, thiếu định hướng rõ ràng, tình duyên trắc trở.",
        "Cự Môn": "Thần ngôn luận hãm địa: Dễ vướng thị phi, khẩu tongue, hiểu lầm, tranh chấp, nói nhiều hóa hỏng.",
        "Thiên Tướng": "Ấn tinh hãm địa: Tính tình nhẹ cả tin, thiếu dứt khoát, dễ bị tác động bởi môi trường và hoàn cảnh.",
        "Thiên Lương": "Ấm tinh hãm địa: Lòng tốt đặt nhầm chỗ, dễ mang tai tiếng, vất vả vì người khác.",
        "Thất Sát": "Tướng tinh hãm địa: Tính khí nóng nảy, cô độc, xông xáo nhưng dễ gặp tai rủi hoặc thất bại bứt phá.",
        "Phá Quân": "Hao tinh hãm địa: Tính nết thất thường, dễ làm đổ vỡ, tiêu xài lãng phí, sự nghiệp nhiều biến động."
    };

    if (code === "H" && hamMap[name]) {
        return hamMap[name] + " (Hãm địa: Cần cát tinh hội chiếu hoặc rèn luyện bản lĩnh để vượt khó).";
    }

    let evalStr = baseMap[name] || "Sao nòng cốt.";
    if (code === "M") evalStr += " (Miếu địa: Phát huy 100% năng lượng tốt đẹp nhất).";
    if (code === "V") evalStr += " (Vượng địa: Rất tốt đẹp, năng lượng mạnh mẽ).";
    if (code === "Đ") evalStr += " (Đắc địa: Khá tốt, có năng lực vươn lên).";
    if (code === "B") evalStr += " (Bình hòa: Trung bình, tùy thuộc vào phụ tinh).";
    return evalStr;
}

function getThanPositionMeaning(chucNangStr) {
    if (chucNangStr.includes("Mệnh")) return "Thân cư Mệnh: Mẫu người tự lực, kiên định với lý tưởng cá nhân, giữ vững lập trường từ trẻ đến già.";
    if (chucNangStr.includes("Phúc Đức")) return "Thân cư Phúc Đức: Hậu vận phụ thuộc nhiều vào phúc đức dòng họ, đời sống tinh thần, hay lo cho họ hàng.";
    if (chucNangStr.includes("Quan Lộc")) return "Thân cư Quan Lộc: Mẫu người của công việc, hết lòng vì sự nghiệp, hậu vận gặt hái danh tiếng.";
    if (chucNangStr.includes("Thiên Di")) return "Thân cư Thiên Di: Mẫu người năng động, hay di chuyển, càng ra ngoài xã hội càng phát triển sự nghiệp.";
    if (chucNangStr.includes("Tài Bạch")) return "Thân cư Tài Bạch: Mẫu người thực tế, coi trọng quản lý tài chính, hậu vận chú trọng tích lũy.";
    if (chucNangStr.includes("Phu Thê")) return "Thân cư Phu Thê: Hậu vận gắn liền và chịu ảnh hưởng lớn từ người phối ngẫu (vợ/chồng).";
    return "Hậu vận phát triển theo duyên số.";
}

// ----------------------------------------------------------------------------
// BƯỚC 3: ĐÁNH GIÁ TAM HỢP MỆNH - TÀI - QUAN & CÁCH CỤC (TINH CHỈNH CHUẨN XÁC)
// ----------------------------------------------------------------------------
function evalStep3_TamHopCáchCục(laSo) {
    const res = [];
    const menhP = laSo.palates.find(p => p.chucNang.includes("Mệnh"));
    const taiP = laSo.palates.find(p => p.chucNang.includes("Tài Bạch"));
    const quanP = laSo.palates.find(p => p.chucNang.includes("Quan Lộc"));

    const menhParsed = menhP.chinhTinh.map(parseStar);
    const tamHopParsed = [...menhP.chinhTinh, ...taiP.chinhTinh, ...quanP.chinhTinh].map(parseStar);

    res.push(`### Bộ Cách Cục Tam Hợp (Mệnh - Tài - Quan):`);
    
    let detected = false;

    // 1. Trường hợp đặc biệt: Thiên Tướng độc tọa tại Cung Mệnh
    if (menhParsed.length === 1 && menhParsed[0].name === "Thiên Tướng") {
        const code = menhParsed[0].code;
        if (code === "H" || ["Mão", "Dậu"].includes(laSo.menhCung)) {
            res.push(`• **Cách Cục Thiên Tướng Độc Tọa (Hãm Địa)**: Cung Mệnh có Thiên Tướng độc tọa hãm địa tại ${laSo.menhCung}. Thiên Tướng mang tính chất trung lập, thụ động, dễ bị tác động bởi môi trường và các phụ tinh hội chiếu. Cần môi trường nâng đỡ và cẩn trọng xáo trộn, tránh vội vã phán là bộ Tử Phủ Vũ Tướng hoàng kim.`);
        } else {
            res.push(`• **Cách Cục Thiên Tướng Độc Tọa**: Cung Mệnh Thiên Tướng độc tọa miếu/vượng. Thiên Tướng mang tính chất ấn tinh đàng hoàng, đứng vị trí hỗ trợ, phò tá đắc lực.`);
        }
        detected = true;
    }

    // 2. Nhận diện Cách Cục "Tử Phủ Vũ Tướng Liêm" thuần túy
    const tuPhuSet = ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng", "Liêm Trinh"];
    const hasTuOrPhuInMenh = menhParsed.some(s => s.name === "Tử Vi" || s.name === "Thiên Phủ");
    const tuPhuCount = tamHopParsed.filter(s => tuPhuSet.includes(s.name)).length;
    const hasMieuVuong = tamHopParsed.some(s => tuPhuSet.includes(s.name) && (s.code === "M" || s.code === "V"));

    if (!detected && (hasTuOrPhuInMenh || (tuPhuCount >= 3 && hasMieuVuong))) {
        res.push(`• **Cách Cục Tử Phủ Vũ Tướng**: Bộ sao Hoàng Kim chủ về quản lý, tổ chức, tài chính và năng lực lãnh đạo. Bộ sao này đem lại sự vững vàng, khả năng gánh vác việc lớn.`);
        detected = true;
    }

    // 3. Nhận diện Cách Cục "Sát Phá Tham"
    const satPhaSet = ["Thất Sát", "Phá Quân", "Tham Lang"];
    const hasSatPhaInMenh = menhParsed.some(s => satPhaSet.includes(s.name));
    const satPhaCount = tamHopParsed.filter(s => satPhaSet.includes(s.name)).length;

    if (!detected && (hasSatPhaInMenh || satPhaCount >= 2)) {
        res.push(`• **Cách Cục Sát Phá Tham**: Bộ sao Quyền uy & Bứt phá. Mẫu người giàu nhiệt huyết, xông xáo, dám nghĩ dám làm, hay tạo nên những bước ngoặt lớn trong sự nghiệp.`);
        detected = true;
    }

    // 4. Nhận diện Cách Cục "Cơ Nguyệt Đồng Lương"
    const coNguyetSet = ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"];
    const hasCoNguyetInMenh = menhParsed.some(s => coNguyetSet.includes(s.name));
    const coNguyetCount = tamHopParsed.filter(s => coNguyetSet.includes(s.name)).length;

    if (!detected && (hasCoNguyetInMenh || coNguyetCount >= 2)) {
        res.push(`• **Cách Cục Cơ Nguyệt Đồng Lương**: Bộ sao Trí tuệ & Văn chức. Thích hợp cho môi trường công sở, cố vấn, chuyên gia, giáo dục, tài chính hoặc hành chính.`);
        detected = true;
    }

    // 5. Nhận diện Cách Cục "Cự Nhật"
    const cuNhatSet = ["Cự Môn", "Thái Dương"];
    const hasCuNhatInMenh = menhParsed.some(s => cuNhatSet.includes(s.name));
    const cuNhatCount = tamHopParsed.filter(s => cuNhatSet.includes(s.name)).length;

    if (!detected && (hasCuNhatInMenh || cuNhatCount >= 2)) {
        res.push(`• **Cách Cục Cự Nhật**: Chủ về quang minh, danh tiếng, ngoại giao, hùng biện và khả năng lan tỏa ảnh hưởng.`);
        detected = true;
    }

    // 6. Trường hợp hội chiếu tam hợp nếu chưa chốt ở Mệnh
    if (!detected) {
        if (tuPhuCount >= 2) {
            res.push(`• **Hội Chiếu Bộ Tử Phủ Vũ Tướng**: Tam hợp Mệnh - Tài - Quan hội chiếu bộ sao quản lý, tổ chức và tài chính.`);
        } else if (satPhaCount >= 2) {
            res.push(`• **Hội Chiếu Bộ Sát Phá Tham**: Tam hợp Mệnh - Tài - Quan hội chiếu bộ sao hành động, bứt phá.`);
        } else if (coNguyetCount >= 2) {
            res.push(`• **Hội Chiếu Bộ Cơ Nguyệt Đồng Lương**: Tam hợp Mệnh - Tài - Quan hội chiếu bộ sao trí tuệ, mưu lược.`);
        } else {
            res.push(`• **Cách Cục Biến Hóa Phối Hợp**: Các chính tinh phối hợp linh hoạt giữa văn và võ.`);
        }
    }

    return res.join("\n");
}

// ----------------------------------------------------------------------------
// BƯỚC 4: ĐÁNH GIÁ SÁT TINH, TỨ HÓA & CÁC BỘ PHỤ TINH (PHÂN BIỆT RÕ HÃM ĐỊA)
// ----------------------------------------------------------------------------
function evalStep4_SatTinhTuHoa(laSo) {
    const res = [];
    const menhP = laSo.palates.find(p => p.chucNang.includes("Mệnh"));
    
    res.push(`### 1. Phân Bổ Bộ Tứ Hóa (Lộc, Quyền, Khoa, Kỵ)`);
    laSo.palates.forEach(p => {
        const tuHoaInP = p.phuTinh.filter(s => ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"].includes(s));
        if (tuHoaInP.length > 0) {
            res.push(`• **Cung ${p.chucNang.split(" ")[0]} (${p.chiName})**: Có **${tuHoaInP.join(", ")}**.`);
            tuHoaInP.forEach(th => {
                if (th === "Hóa Lộc") res.push(`  - *Hóa Lộc*: Đem lại cơ hội tài lộc, duyên may mắn, sự hanh thông.`);
                if (th === "Hóa Quyền") res.push(`  - *Hóa Quyền*: Gia tăng vị thế, quyền lực, sự chủ động và khả năng nắm giữ.`);
                if (th === "Hóa Khoa") res.push(`  - *Hóa Khoa*: Đệ nhất giải hạn, gia tăng học vấn, danh tiếng, giải trừ bệnh tật.`);
                if (th === "Hóa Kỵ") res.push(`  - *Hóa Kỵ*: Chủ về sự cẩn trọng ngôn từ, tránh thị phi, giữ gìn mối quan hệ.`);
            });
        }
    });

    const satTinhNames = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"];
    const satInMenh = menhP.phuTinh.filter(s => satTinhNames.includes(s));
    
    res.push(`\n### 2. Sát Tinh Tại Cung Mệnh`);
    if (satInMenh.length === 0) {
        res.push(`• Cung Mệnh không bị Lục Sát Tinh trực tiếp xâm phạm. Mệnh tương đối êm đềm, ít sóng gió lớn.`);
    } else {
        const menhParsed = menhP.chinhTinh.map(parseStar);
        const hasHamStar = menhParsed.some(s => s.code === "H");
        const isVCD = menhP.chinhTinh.length === 0;

        if (hasHamStar) {
            const mainStarNames = menhParsed.map(s => s.name).join("-");
            res.push(`• **CẢNH BÁO NGHIÊM TRỌNG**: Cung Mệnh hội Sát Tinh/Bại Tinh (${satInMenh.join(", ")}) trong khi Chính Tinh lại ở thế **Hãm Địa** (như cách '${mainStarNames} ngộ ${satInMenh.join("-")}').`);
            res.push(`  - *Ảnh hưởng*: Rất dễ vướng trắc trở công danh, hao tốn tài sản, bị người khác lừa gạt hoặc gặp biến cố bất ngờ. Cần hết sức cẩn trọng trong hợp tác, minh bạch tài chính, tránh tin người quá đà và hạn chế đầu tư rủi ro.`);
        } else if (isVCD) {
            res.push(`• **Cảnh báo Mệnh Vô Chính Diệu gặp Sát Tinh**: Cung Mệnh Vô Chính Diệu hội (${satInMenh.join(", ")}). Cuộc đời dễ gặp xáo trộn chao đảo bất ngờ, cần giữ vững lập trường, sống minh bạch và rèn luyện bản lĩnh.`);
        } else {
            res.push(`• Cung Mệnh hội **${satInMenh.join(", ")}**: Do Chính Tinh Miếu/Vượng/Đắc chế hóa, sát tinh giúp gia tăng tính bứt phá, năng nổ, nhưng vẫn cần cẩn trọng kiềm chế cảm xúc.`);
        }
    }

    return res.join("\n");
}

// ----------------------------------------------------------------------------
// BƯỚC 5: TỔNG QUAN 12 CUNG CHỨC NĂNG & ĐẠI HẠN
// ----------------------------------------------------------------------------
function evalStep5_12CungAndVanHan(laSo) {
    const res = [];
    
    res.push(`### 1. Tóm Tắt 12 Cung Chức Năng & Đại Hạn 10 Năm`);
    laSo.palates.forEach(p => {
        const title = `• **Cung ${p.chucNang} (${p.chiName})** [Đại Hạn ${p.daiHan} - ${p.daiHan + 9} tuổi]`;
        const ctStr = p.chinhTinh.length > 0 ? p.chinhTinh.join(", ") : "Vô Chính Diệu";
        const ptStr = p.phuTinh.slice(0, 6).join(", ");
        const tuanTriet = (p.isTuan ? " <TUẦN>" : "") + (p.isTriet ? " <TRIỆT>" : "");
        res.push(`${title}${tuanTriet}:`);
        res.push(`  - Chính Tinh: ${ctStr}`);
        res.push(`  - Phụ Tinh Nổi Bật: ${ptStr}`);
    });

    res.push(`\n### 2. Chiều Di Chuyển Đại Hạn`);
    res.push(`• Đại Hạn bắt đầu từ Cung Mệnh (${laSo.menhCung}) với số Cục là **${laSo.cucNumber} tuổi**.`);
    res.push(`• Chiều di chuyển Đại Hạn: **${laSo.amDuongNamNu.includes("Dương Nam") || laSo.amDuongNamNu.includes("Âm Nữ") ? "Thuận chiều Kim đồng hồ" : "Nghịch chiều Kim đồng hồ"}**.`);

    return res.join("\n");
}

// ----------------------------------------------------------------------------
// BƯỚC 6: LUẬN GIẢI VẬN HẠN NĂM XEM (SAO LƯU NIÊN & LƯU TỨ HÓA)
// ----------------------------------------------------------------------------
function evalStep6_LuuNienVanHan(laSo) {
    if (!laSo.viewYearStr) {
        return "• Chưa nhập năm xem hạn (viewYear). Vui lòng truyền viewYearCanIndex và viewYearChiIndex để luận giải chi tiết vận hạn năm.";
    }

    const res = [];
    res.push(`### Luận Giải Vận Hạn Năm Xem (${laSo.viewYearStr}):`);
    
    let hasLuu = false;
    laSo.palates.forEach(p => {
        const luuStars = p.phuTinh.filter(s => s.startsWith("L."));
        if (luuStars.length > 0) {
            hasLuu = true;
            const cungName = p.chucNang.split(" ")[0];
            res.push(`• **Cung ${cungName} (${p.chiName})** có các sao Lưu nhập hạn: **${luuStars.join(", ")}**.`);
            
            luuStars.forEach(star => {
                if (star === "L.Thái Tuế") {
                    res.push(`  - *L.Thái Tuế tại Cung ${cungName}*: Đây là tâm điểm biến động chính trong năm ${laSo.viewYearStr}. Mọi sự kiện quan trọng, mối quan tâm lớn nhất năm nay sẽ tập trung tại Cung ${cungName}.`);
                }
                if (star === "L.Lộc Tồn") {
                    res.push(`  - *L.Lộc Tồn tại Cung ${cungName}*: Mang đến cơ hội lộc tài, may mắn tài chính, thành quả thu hoạch bất ngờ liên quan Cung ${cungName}.`);
                }
                if (star === "L.Kình Dương") {
                    res.push(`  - *L.Kình Dương tại Cung ${cungName}*: Cẩn trọng biến động đột ngột, va chạm, xích mích hoặc rủi ro mổ xẻ/thương tích tại Cung ${cungName}.`);
                }
                if (star === "L.Đà La") {
                    res.push(`  - *L.Đà La tại Cung ${cungName}*: Cẩn trọng sự trì trệ, thị phi, rắc rối âm thầm kéo dài hoặc áp lực lo âu.`);
                }
                if (star === "L.Thiên Mã") {
                    res.push(`  - *L.Thiên Mã tại Cung ${cungName}*: Có sự dịch chuyển, di chuyển nhiều, đi xa, đổi công việc/chỗ ở hoặc hoạt động rất năng nổ.`);
                }
                if (star === "L.Tang Môn") {
                    res.push(`  - *L.Tang Môn tại Cung ${cungName}*: Chú ý sức khỏe người thân, áp lực tinh thần hoặc có chuyện lo nghĩ phiền muộn.`);
                }
                if (star === "L.Bạch Hổ") {
                    res.push(`  - *L.Bạch Hổ tại Cung ${cungName}*: Cẩn trọng rủi ro va chạm, thủ tục pháp lý, tranh chấp hoặc áp lực công việc.`);
                }
                if (star === "L.Thiên Khốc" || star === "L.Thiên Hư") {
                    res.push(`  - *${star} tại Cung ${cungName}*: Tâm lý có lúc bị hao tổn, u uất mệt mỏi nhỏ.`);
                }
                if (star === "L.Hóa Lộc") res.push(`  - *L.Hóa Lộc*: Duyên lộc tài chính hanh thông, gặp may mắn bất ngờ.`);
                if (star === "L.Hóa Quyền") res.push(`  - *L.Hóa Quyền*: Gia tăng quyền hạn, uy thế, nắm quyền chủ động.`);
                if (star === "L.Hóa Khoa") res.push(`  - *L.Hóa Khoa*: Có quý nhân trợ lực, danh tiếng, giải trừ tai ngạch.`);
                if (star === "L.Hóa Kỵ") res.push(`  - *L.Hóa Kỵ*: Đề phòng hiểu lầm, thị phi, trở ngại công việc/quan hệ.`);
            });
        }
    });

    if (!hasLuu) {
        res.push("• Không có sao Lưu Niên nhập hạn trong năm này.");
    }

    return res.join("\n");
}

// ----------------------------------------------------------------------------
// HÀM TỔNG HỢP: TẠO BÁO CÁO LUẬN ĐOÁN TOÀN DIỆN
// ----------------------------------------------------------------------------
function luanSoTuViToanDien(laSoInput) {
    return {
        step1_ThienBan: evalStep1_ThienBan(laSoInput),
        step2_MenhThan: evalStep2_MenhThan(laSoInput),
        step3_TamHop: evalStep3_TamHopCáchCục(laSoInput),
        step4_SatTinhTuHoa: evalStep4_SatTinhTuHoa(laSoInput),
        step5_12CungAndVanHan: evalStep5_12CungAndVanHan(laSoInput),
        step6_LuuNien: evalStep6_LuuNienVanHan(laSoInput)
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        luanSoTuViToanDien,
        evalStep1_ThienBan,
        evalStep2_MenhThan,
        evalStep3_TamHopCáchCục,
        evalStep4_SatTinhTuHoa,
        evalStep5_12CungAndVanHan,
        evalStep6_LuuNienVanHan
    };
}
