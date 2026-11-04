/**
 * ============================================================================
 * THUẬT TOÁN LUẬN ĐOÁN LÁ SỐ TỬ VI TỰ ĐỘNG (Zi Wei Dou Shu Engine - v6)
 * ============================================================================
 * Bản nâng cấp v6 (Đã vá lỗi logic & chuẩn hóa học thuật Nam Phái):
 * 1. Sửa lỗi cắt chuỗi tên cung (`split(" ")[0]` làm cụt tên cung 2 chữ như Phụ Mẫu, Thiên Di, Tử Tức).
 * 2. Chuẩn hóa thuật toán nhận diện Cách Cục Tam Hợp (evalStep3_TamHopCáchCục):
 *    - Khắc phục lỗi 100% lá số thuộc tam hợp Tử-Vũ-Liêm (kể cả Liêm Tham hãm, Vũ Phá hãm, Tử Tham, Liêm Phá) bị nhận nhầm thành "Tử Phủ Vũ Tướng Hoàng Kim".
 *    - Nhận diện chính xác các cách cục phối hợp: Tử Vũ Liêm hội Sát Phá Tham, Cự Cơ, Đồng Cự, Nhật Lương, Nhật Nguyệt, Mệnh Vô Chính Diệu mượn sao xung chiếu.
 * 3. Phân tích sâu Mệnh Vô Chính Diệu (tự động mượn và giải nghĩa Chính Tinh cung Thiên Di) & phân biệt Tuần/Triệt khi gặp Miếu/Vượng vs Hãm Địa/VCD.
 * 4. Nâng cấp đánh giá Sát Tinh & Cát Tinh (evalStep4_SatTinhTuHoa):
 *    - Xét cả Sát Tinh tại bản cung Mệnh lẫn Sát Tinh hội chiếu từ Tam Phương Tứ Chính (Tài - Quan - Di).
 *    - Xét thêm các Hình/Ám/Bại tinh (Thiên Không, Thiên Hình, Kiếp Sát, Cô Quả) và khả năng Cát Tinh / Tuần Triệt chế hóa.
 * 5. Thay thế `.slice(0, 6)` ở Bước 5 bằng bộ lọc ưu tiên Phụ Tinh quan trọng (luôn hiển thị Tứ Hóa, Lục Cát, Lục Sát).
 * 6. Tích hợp đầy đủ Cân Lượng (Viên Thiên Cương), Đại Hạn hiện tại, Lưu Đại Hạn, Tiểu Hạn, 12 cung Lưu Niên (LN.Mệnh...) và L.Khôi/L.Việt từ Engine An Số v12.
 * ============================================================================
 */

const NGU_HANH_ELEMENT = {
    "Kim": { sinh: "Thủy", khac: "Mộc", duocSinh: "Thổ", biKhac: "Hỏa" },
    "Mộc": { sinh: "Hỏa", khac: "Thổ", duocSinh: "Thủy", biKhac: "Kim" },
    "Thủy": { sinh: "Mộc", khac: "Hỏa", duocSinh: "Kim", biKhac: "Thổ" },
    "Hỏa": { sinh: "Thổ", khac: "Kim", duocSinh: "Mộc", biKhac: "Thủy" },
    "Thổ": { sinh: "Kim", khac: "Thủy", duocSinh: "Hỏa", biKhac: "Mộc" }
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

function cleanCungName(chucNangStr) {
    if (!chucNangStr) return "";
    return chucNangStr.replace(" <THÂN>", "").trim();
}

function findCungByName(palates, baseName) {
    return palates.find(p => cleanCungName(p.chucNang) === baseName);
}

// ----------------------------------------------------------------------------
// BƯỚC 1: ĐÁNH GIÁ THIÊN BÀN, MỆNH - CỤC & CÂN LƯỢNG
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
        res.push(`• **Âm Dương Nghịch Lý**: Bạn là ${amDuongNamNu}, Cung Mệnh an tại ${menhCungChi} (${amDuongCung} Cung). Âm Dương nghịch lý khiến tiền vận dễ gặp nghịch cảnh, trắc trở, cần nhiều nỗ lực vươn lên bằng thực lực.`);
    }

    const hanhMenh = getHanhNapAm(laSo.banMenhNapAm);
    const hanhCuc = CUC_NGU_HANH[laSo.cucNumber];

    if (hanhMenh === hanhCuc) {
        res.push(`• **Mệnh Cục Tương Hòa**: Bản Mệnh (${laSo.banMenhNapAm}) và Cục (${laSo.cucName}) đồng hành ${hanhMenh}. Cuộc sống tương đối bình hòa, dễ thích nghi với môi trường xung quanh.`);
    } else if (NGU_HANH_ELEMENT[hanhCuc].sinh === hanhMenh) {
        res.push(`• **Cục Sinh Mệnh** (${hanhCuc} sinh ${hanhMenh}): RẤT TỐT! Cục (${laSo.cucName}) tương sinh cho Bản Mệnh (${laSo.banMenhNapAm}). Môi trường và hoàn cảnh bên ngoài luôn tạo điều kiện, quý nhân giúp đỡ, dễ gặt hái thành công.`);
    } else if (NGU_HANH_ELEMENT[hanhMenh].sinh === hanhCuc) {
        res.push(`• **Mệnh Sinh Cục** (${hanhMenh} sinh ${hanhCuc}): Bản Mệnh phải vất vả tiêu tốn năng lượng để cống hiến cho công việc và hoàn cảnh. Phải lao tâm khổ tứ, làm nhiều mới được hưởng.`);
    } else if (NGU_HANH_ELEMENT[hanhMenh].khac === hanhCuc) {
        res.push(`• **Mệnh Khắc Cục** (${hanhMenh} khắc ${hanhCuc}): Bản Mệnh tự lực cánh sinh, vượt qua nghịch cảnh để vươn lên. Cuộc đời hay gặp thử thách nhưng có bản lĩnh làm chủ hoàn cảnh.`);
    } else {
        res.push(`• **Cục Khắc Mệnh** (${hanhCuc} khắc ${hanhMenh}): Cục (${laSo.cucName}) khắc Bản Mệnh (${laSo.banMenhNapAm}). Hoàn cảnh xung quanh hay gây cản trở, áp lực lớn, cần kiên trì bền chí.`);
    }

    const menhPalate = laSo.palates.find(p => p.chiName === laSo.menhCung);
    if (menhPalate) {
        res.push(`• **Thế Cung Mệnh tại ${laSo.menhCung}**: Vòng Tràng Sinh đóng tại **${menhPalate.trangSinh}**. (${getTrangSinhDetail(menhPalate.trangSinh)})`);
    }

    if (laSo.canLuongStr) {
        res.push(`• **Cân Xương Đoán Số (Viên Thiên Cương)**: Trọng lượng lá số đạt **${laSo.canLuongStr}**. (${getCanLuongComment(laSo.canLuongStr)})`);
    }

    return res.join("\n");
}

function getCanLuongComment(canLuongStr) {
    const match = String(canLuongStr).match(/(\d+)\s*lượng\s*(\d+)\s*chỉ/);
    if (!match) return "Tham khảo thêm về phúc lộc tiên thiên.";
    const totalChi = parseInt(match[1], 10) * 10 + parseInt(match[2], 10);
    if (totalChi < 28) return "Số phần vất vả, tiền vận bươn chải tự thân lập nghiệp, nên tích phúc hành thiện để cải vận.";
    if (totalChi <= 37) return "Số trung bình khá, tiền vận phải nỗ lực kiên trì, từ trung vận trở đi sự nghiệp và tài lộc dần ổn định.";
    if (totalChi <= 48) return "Số khá giả, có năng lực và quý nhân trợ giúp, hậu vận sung túc, danh lộc song toàn.";
    return "Số đại phú quý, phúc lộc dồi dào, có mệnh làm nên nghiệp lớn và hưởng vinh hoa.";
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
// BƯỚC 2: PHÂN TÍCH MỆNH & THÂN (HỖ TRỢ ĐẦY ĐỦ VÔ CHÍNH DIỆU & TUẦN/TRIỆT)
// ----------------------------------------------------------------------------
function evalStep2_MenhThan(laSo) {
    const res = [];
    const menhPalate = findCungByName(laSo.palates, "Mệnh");
    const thanPalate = laSo.palates.find(p => p.chucNang.includes("<THÂN>"));
    const diPalate = findCungByName(laSo.palates, "Thiên Di") || laSo.palates[(menhPalate.chiIndex + 6) % 12];

    const menhParsed = menhPalate.chinhTinh.map(parseStar);
    const isVCD = menhParsed.length === 0;
    const hasHamStar = menhParsed.some(s => s.code === "H");

    res.push(`### 1. Cung Mệnh (An tại ${laSo.menhCung})`);
    if (isVCD) {
        res.push(`• **Cách cục Vô Chính Diệu**: Cung Mệnh không có Chính Tinh tọa thủ. Bạn là người thông minh, nhạy bén, khả năng thích nghi và ứng biến cao. Tiền vận dễ biến động, cần lấy Chính Tinh xung chiếu tại Cung Thiên Di (${diPalate.chiName}) làm nòng cốt định hướng.`);
        if (diPalate.chinhTinh.length > 0) {
            res.push(`• **Chính Tinh Xung Chiếu từ Thiên Di (${diPalate.chiName})**: ${diPalate.chinhTinh.join(", ")} (ảnh hưởng khoảng 70-80% tính cách và vận thế).`);
            diPalate.chinhTinh.forEach(star => {
                res.push(`  - **${star} (Xung chiếu)**: ${getChinhTinhMeaning(star, diPalate.chiName)}`);
            });
        } else {
            res.push(`• **Mệnh - Di đồng Vô Chính Diệu**: Cả Mệnh và Thiên Di đều không có Chính Tinh, cuộc đời phụ thuộc rất lớn vào các bộ Phụ Tinh hội hợp và Chính Tinh tại tam hợp Tài Bạch - Quan Lộc.`);
        }
    } else {
        res.push(`• **Chính Tinh Tọa Thủ**: ${menhPalate.chinhTinh.join(", ")}.`);
        menhPalate.chinhTinh.forEach(star => {
            res.push(`  - **${star}**: ${getChinhTinhMeaning(star, menhPalate.chiName)}`);
        });
    }

    // Luận Tuần / Triệt theo trạng thái Chính Tinh (Miếu/Vượng vs Hãm/VCD)
    if (menhPalate.isTuan || menhPalate.isTriet) {
        const ttName = (menhPalate.isTuan && menhPalate.isTriet) ? "Tuần - Triệt đồng cung" : (menhPalate.isTriet ? "Triệt Không" : "Tuần Không");
        if (isVCD) {
            res.push(`• **Đắc ${ttName} Án Ngữ (Mệnh Vô Chính Diệu đắc Không Vong)**: Rất tốt ("Vô Chính Diệu đắc Tam Không"). ${ttName} giúp giữ vững nền tảng, ngăn chặn sát tinh xâm phạm, biến hư thành thực, giúp vượt qua nghịch cảnh để làm nên sự nghiệp.`);
        } else if (hasHamStar) {
            res.push(`• **Có ${ttName} Cứu Giải Hãm Địa**: Chính tinh tại Mệnh đang hãm địa gặp ${ttName} ("Triệt/Tuần đương đầu") giúp triệt giảm tính chất xấu của sao hãm và cản bớt hung sát tinh. Dù tiền vận bươn chải vất vả nhưng trung và hậu vận sẽ chuyển mình tốt đẹp.`);
        } else {
            res.push(`• **Có ${ttName} Án Ngữ**: Do Chính Tinh tại Mệnh đang sáng sủa (Miếu/Vượng/Đắc), ${ttName} gây chiết giảm năng lượng ở tiền vận (trước 30 tuổi hay trắc trở, phải lập nghiệp xa quê hoặc đổi hướng), nhưng từ sau 30 tuổi trở đi sẽ phát huy trọn vẹn thực lực.`);
        }
    }

    res.push(`\n### 2. Cung Thân (An tại ${laSo.thanCung})`);
    res.push(`• **Vị trí Cung Thân**: ${thanPalate.chucNang}`);
    res.push(`  - **Ý nghĩa**: ${getThanPositionMeaning(thanPalate.chucNang)}`);
    if (thanPalate.chinhTinh.length > 0) {
        res.push(`• **Chính Tinh Cung Thân**: ${thanPalate.chinhTinh.join(", ")}.`);
        if (thanPalate.chiIndex !== menhPalate.chiIndex) {
            thanPalate.chinhTinh.forEach(star => {
                res.push(`  - **${star}**: ${getChinhTinhMeaning(star, thanPalate.chiName)}`);
            });
        }
    } else {
        const xungThanPalate = laSo.palates[(thanPalate.chiIndex + 6) % 12];
        const xungStars = xungThanPalate.chinhTinh.length > 0 ? xungThanPalate.chinhTinh.join(", ") : "Vô Chính Diệu";
        res.push(`• **Chính Tinh Cung Thân**: Vô Chính Diệu (Chịu ảnh hưởng xung chiếu từ cung ${cleanCungName(xungThanPalate.chucNang)} tại ${xungThanPalate.chiName}: ${xungStars}).`);
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
        "Cự Môn": "Ám tinh chủ ngôn luận, có khả năng giao tiếp, lập luận và phản biện sắc bén.",
        "Thiên Tướng": "Ấn tinh, chủ về sự đàng hoàng, lòng tự trọng, có tinh thần trách nhiệm.",
        "Thiên Lương": "Ấm tinh & Thọ tinh, chủ về lòng nhân hậu, thích giúp đỡ, có duyên tâm linh.",
        "Thất Sát": "Tướng tinh, chủ về sự quyết đoán, dũng cảm, xông xáo, bứt phá.",
        "Phá Quân": "Hao tinh & Tướng tinh, chủ về tính tiên phong, đổi mới, dám nghĩ dám làm."
    };

    const hamMap = {
        "Tử Vi": "Đế tinh hãm địa: Dễ sinh tâm lý tự cao, cô độc, thiếu quý nhân phò tá, công danh trắc trở.",
        "Thiên Cơ": "Thiện tinh hãm địa: Hay lo nghĩ viễn vông, tính toán thiếu thực tế, tâm lý bất an, dễ chao đảo.",
        "Thái Dương": "Nhật tinh hãm địa: Chí khí dễ bị che lấp, làm nhiều hưởng ít, vất vả vì người khác, chú ý thị lực và tim mạch.",
        "Vũ Khúc": "Tài tinh hãm địa: Quản lý tài chính gặp khó khăn, cô độc, tính tình cứng nhắc, dễ hao tài.",
        "Thiên Đồng": "Phúc tinh hãm địa: Tính tình hay đổi thay, thiếu kiên nhẫn, dễ chán nản, vất vả bươn chải.",
        "Liêm Trinh": "Đào hoa & Quyền tinh hãm địa: Nóng nảy, dễ vướng thị phi, hình hại, quan tụng hoặc tai ương bất ngờ.",
        "Thiên Phủ": "Kho đống hãm địa: Tích lũy khó khăn, dễ bị xáo trộn tài chính, thiếu sự chủ động.",
        "Thái Âm": "Nguyệt tinh hãm địa: Tình cảm dễ phiền muộn, ý chí yếu mềm, tài chính trồi sụt, vất vả bươn chải.",
        "Tham Lang": "Đào hoa tinh hãm địa: Dễ sa đà vào ham muốn, thiếu định hướng rõ ràng, tình duyên trắc trở.",
        "Cự Môn": "Ngôn luận tinh hãm địa: Dễ vướng thị phi, khẩu thiệt, hiểu lầm, tranh chấp, nói nhiều hóa hỏng.",
        "Thiên Tướng": "Ấn tinh hãm địa: Tính tình nhẹ dạ cả tin, thiếu dứt khoát, dễ bị tác động bởi môi trường và hoàn cảnh.",
        "Thiên Lương": "Ấm tinh hãm địa: Lòng tốt đặt nhầm chỗ, hay ôm đồm việc người khác, dễ mang tai tiếng, phiền muộn.",
        "Thất Sát": "Tướng tinh hãm địa: Tính khí nóng nảy, cô độc, xông xáo nhưng dễ gặp tai rủi hoặc thăng trầm lớn.",
        "Phá Quân": "Hao tinh hãm địa: Tính nết thất thường, dễ làm đổ vỡ, tiêu xài lãng phí, sự nghiệp nhiều biến động."
    };

    if (code === "H" && hamMap[name]) {
        return hamMap[name] + " (Hãm địa: Cần Cát Tinh/Tuần Triệt cứu giải hoặc rèn luyện bản lĩnh để vượt khó).";
    }

    let evalStr = baseMap[name] || "Sao nòng cốt.";
    if (code === "M") evalStr += " (Miếu địa: Phát huy 100% năng lượng tốt đẹp nhất).";
    if (code === "V") evalStr += " (Vượng địa: Rất tốt đẹp, năng lượng mạnh mẽ).";
    if (code === "Đ") evalStr += " (Đắc địa: Khá tốt, có năng lực vươn lên).";
    if (code === "B") evalStr += " (Bình hòa: Trung bình, tùy thuộc vào sự hội hợp của phụ tinh).";
    return evalStr;
}

function getThanPositionMeaning(chucNangStr) {
    if (chucNangStr.includes("Mệnh")) return "Thân cư Mệnh: Mẫu người tự lực, kiên định với lý tưởng cá nhân, giữ vững lập trường từ trẻ đến già.";
    if (chucNangStr.includes("Phúc Đức")) return "Thân cư Phúc Đức: Hậu vận phụ thuộc nhiều vào phúc đức dòng họ, đời sống tinh thần và tâm linh, hay lo cho họ hàng.";
    if (chucNangStr.includes("Quan Lộc")) return "Thân cư Quan Lộc: Mẫu người của công việc, hết lòng vì sự nghiệp, hậu vận gắn liền với danh tiếng và địa vị.";
    if (chucNangStr.includes("Thiên Di")) return "Thân cư Thiên Di: Mẫu người năng động, hay di chuyển, càng ra ngoài xã hội càng phát triển sự nghiệp.";
    if (chucNangStr.includes("Tài Bạch")) return "Thân cư Tài Bạch: Mẫu người thực tế, nhạy bén tiền bạc, hậu vận đặt trọng tâm vào quản lý tài chính và tích lũy.";
    if (chucNangStr.includes("Phu Thê")) return "Thân cư Phu Thê: Hậu vận gắn liền và chịu ảnh hưởng lớn từ người phối ngẫu (vợ/chồng) cũng như đời sống gia đạo.";
    return "Hậu vận phát triển theo duyên số.";
}

// ----------------------------------------------------------------------------
// BƯỚC 3: ĐÁNH GIÁ TAM HỢP MỆNH - TÀI - QUAN & CÁCH CỤC (CHUẨN HÓA NAM PHÁI)
// ----------------------------------------------------------------------------
function evalStep3_TamHopCáchCục(laSo) {
    const res = [];
    const menhP = findCungByName(laSo.palates, "Mệnh");
    const taiP = findCungByName(laSo.palates, "Tài Bạch");
    const quanP = findCungByName(laSo.palates, "Quan Lộc");
    const diP = findCungByName(laSo.palates, "Thiên Di") || laSo.palates[(menhP.chiIndex + 6) % 12];

    const menhParsed = menhP.chinhTinh.map(parseStar);
    const diParsed = diP.chinhTinh.map(parseStar);
    const tamHopParsed = [...menhP.chinhTinh, ...taiP.chinhTinh, ...quanP.chinhTinh].map(parseStar);

    // Nếu Mệnh Vô Chính Diệu, mượn thêm sao xung chiếu từ Thiên Di để định danh cách cục
    const effectiveMenh = menhParsed.length > 0 ? menhParsed : diParsed;
    const effectivePool = menhParsed.length > 0 ? tamHopParsed : [...tamHopParsed, ...diParsed];
    const isVCD = menhParsed.length === 0;

    res.push(`### Bộ Cách Cục Tam Hợp (Mệnh - Tài - Quan):`);

    if (isVCD) {
        res.push(`• **Nền tảng Mệnh Vô Chính Diệu**: Tam hợp Mệnh (${menhP.chiName}) - Tài (${taiP.chiName}) - Quan (${quanP.chiName}) kết hợp với cung Thiên Di (${diP.chiName}) xung chiếu để định hình cách cục:`);
    }

    const tuPhuSet = ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng", "Liêm Trinh"];
    const satPhaSet = ["Thất Sát", "Phá Quân", "Tham Lang"];
    const coNguyetSet = ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"];
    const cuNhatSet = ["Cự Môn", "Thái Dương"];

    const menhNames = effectiveMenh.map(s => s.name);
    const poolNames = effectivePool.map(s => s.name);

    const hasMenhIn = (arr) => menhNames.some(n => arr.includes(n));
    const countPoolIn = (arr) => poolNames.filter(n => arr.includes(n)).length;

    const hasTuPhuMenh = hasMenhIn(tuPhuSet);
    const hasSatPhaMenh = hasMenhIn(satPhaSet);
    const hasCoNguyetMenh = hasMenhIn(coNguyetSet);
    const hasCuNhatMenh = hasMenhIn(cuNhatSet);

    const tuPhuCount = countPoolIn(tuPhuSet);
    const satPhaCount = countPoolIn(satPhaSet);
    const coNguyetCount = countPoolIn(coNguyetSet);
    const cuNhatCount = countPoolIn(cuNhatSet);

    const allEffectiveHam = effectiveMenh.length > 0 && effectiveMenh.every(s => s.code === "H");

    // 1. Trường hợp đặc biệt: Thiên Tướng độc tọa tại Cung Mệnh
    if (!isVCD && menhParsed.length === 1 && menhParsed[0].name === "Thiên Tướng") {
        const code = menhParsed[0].code;
        if (code === "H" || ["Mão", "Dậu"].includes(laSo.menhCung)) {
            res.push(`• **Cách Cục Thiên Tướng Độc Tọa (Hãm Địa) - Hội Tử Vũ Liêm & Sát Phá Tham**: Cung Mệnh có Thiên Tướng độc tọa hãm địa tại ${laSo.menhCung} (xung chiếu Liêm Phá, tam hợp Vũ Sát và Tử Tham). Thiên Tướng lúc này mang tính chất thụ động, dễ bị tác động bởi môi trường và phụ tinh hội chiếu, cần rèn luyện sự quyết đoán và tránh cả tin.`);
        } else {
            res.push(`• **Cách Cục Phủ Tướng Triều Viên (Thiên Tướng Độc Tọa ${code})**: Cung Mệnh có Thiên Tướng sáng sủa tọa thủ, hội hợp cùng bộ Tử Phủ Vũ Tướng. Chủ về người đàng hoàng, trọng chữ tín, có năng lực tổ chức, phò tá và quản lý tài chính vững vàng.`);
        }
        return res.join("\n");
    }

    // 2. Cách Cục Tử Vũ Liêm hội Sát Phá Tham (khi cả 2 nhóm cùng đóng hoặc hội đầy đủ trong tam hợp)
    if ((hasTuPhuMenh && hasSatPhaMenh) || (tuPhuCount >= 3 && satPhaCount >= 3)) {
        if (allEffectiveHam) {
            res.push(`• **Cách Cục Tử Vũ Liêm Hội Sát Phá Tham (Thế Hãm Địa tại ${laSo.menhCung})**: Mệnh mang bộ sao (${menhNames.join(" - ")}) ở thế hãm địa. Đây là cách cục biến động mạnh, nhiều tham vọng nhưng đường đời dễ gặp sóng gió, thăng trầm hoặc thị phi nếu nóng vội. Rất cần Tuần/Triệt hoặc Cát Tinh chế hóa, nên đi theo hướng chuyên môn kỹ thuật, kinh doanh thực chiến và quản trị rủi ro chặt chẽ.`);
        } else {
            res.push(`• **Cách Cục Tử Vũ Liêm Hội Sát Phá Tham (Văn Võ Kết Hợp)**: Sự giao thoa giữa bộ sao quản lý quy củ (Tử - Vũ - Liêm) và bộ sao hành động quyết liệt (Sát - Phá - Tham). Bạn vừa có tư duy tổ chức, vừa có bản lĩnh đột phá, hợp với môi trường cạnh tranh, kinh doanh, kỹ thuật hoặc lực lượng vũ trang.`);
        }
        return res.join("\n");
    }

    // 3. Cách Cục Tử Phủ Vũ Tướng thuần túy (Không bị Sát Phá Tham lấn át)
    if (hasTuPhuMenh && satPhaCount === 0) {
        res.push(`• **Cách Cục Tử Phủ Vũ Tướng**: Bộ sao Hoàng Kim chủ về quản lý, tổ chức, tài chính và năng lực lãnh đạo. Bộ sao này đem lại sự đĩnh đạc, vững vàng và khả năng gánh vác trọng trách lớn.`);
        return res.join("\n");
    }

    // 4. Cách Cục Sát Phá Tham thuần túy (Thất Sát, Phá Quân, Tham Lang cư Mệnh, không đồng cung Tử Vũ Liêm)
    if (hasSatPhaMenh) {
        if (allEffectiveHam) {
            res.push(`• **Cách Cục Sát Phá Tham (Thế Hãm Địa)**: Bộ sao hành động và biến đổi đang ở thế hãm địa. Tính tình mạnh mẽ, độc lập nhưng tiền vận dễ vất vả, bôn ba hoặc trải qua biến cố lớn rồi mới thành danh. Nên rèn tính kiên nhẫn và tránh đầu cơ mạo hiểm.`);
        } else {
            res.push(`• **Cách Cục Sát Phá Tham (Đắc/Miếu/Vượng)**: Bộ sao Quyền uy & Bứt phá. Mẫu người giàu nhiệt huyết, xông xáo, dám nghĩ dám làm, thường tạo dựng sự nghiệp qua những bước ngoặt lớn và thử thách thực tế.`);
        }
        return res.join("\n");
    }

    // 5. Cách Cục Giao Thoa giữa Cơ Nguyệt Đồng Lương và Cự Nhật (Cự Cơ, Đồng Cự, Nhật Lương, Nhật Nguyệt)
    if (hasCuNhatMenh && hasCoNguyetMenh) {
        if (menhNames.includes("Cự Môn") && menhNames.includes("Thiên Cơ")) {
            res.push(`• **Cách Cục Cự Cơ (${laSo.menhCung})**: Sự kết hợp giữa trí tuệ mưu lược của Thiên Cơ và tài hùng biện, phân tích sắc bén của Cự Môn. Rất hợp với nghiên cứu, tư vấn, thương mại, luật pháp hoặc truyền thông.`);
        } else if (menhNames.includes("Thái Dương") && menhNames.includes("Thái Âm")) {
            res.push(`• **Cách Cục Nhật Nguyệt Đồng Lâm (${laSo.menhCung})**: Thái Dương và Thái Âm đồng cung, kết hợp cả sự quang minh năng động lẫn nét tinh tế, nhạy bén tài chính. Đa tài, linh hoạt, dễ thành công ở nhiều lĩnh vực.`);
        } else if (menhNames.includes("Thái Dương") && menhNames.includes("Thiên Lương")) {
            res.push(`• **Cách Cục Nhật Lương (${laSo.menhCung})**: Chủ về danh tiếng, học thức, sự thanh cao và chính trực. Rất hợp với công tác giáo dục, y dược, nghiên cứu, quản lý hoặc cố vấn.`);
        } else if (menhNames.includes("Thiên Đồng") && menhNames.includes("Cự Môn")) {
            res.push(`• **Cách Cục Đồng Cự (${laSo.menhCung})**: Nội tâm giàu cảm xúc, tư duy kín kẽ, có tài ăn nói và thuyết phục nhưng đời sống tình cảm dễ có nỗi niềm riêng.`);
        } else {
            res.push(`• **Cách Cục Cơ Nguyệt Đồng Lương Hội Cự Nhật**: Kết hợp giữa trí tuệ văn đoàn, tài năng ngôn luận và danh tiếng xã hội.`);
        }
        return res.join("\n");
    }

    // 6. Cách Cục Cự Nhật (Cự Môn, Thái Dương độc tọa hoặc đồng cung, hoặc tam hợp Cự Nhật chiếu)
    if (hasCuNhatMenh || (cuNhatCount === 2 && coNguyetCount <= 2)) {
        if (allEffectiveHam) {
            res.push(`• **Cách Cục Cự Nhật (Thế Hãm Địa)**: Chủ về tài ăn nói và giao tiếp xã hội nhưng vì sao hãm địa nên dễ vất vả tâm trí, làm ơn mắc oán hoặc vướng thị phi khẩu thiệt. Cần giữ sự minh bạch và đi sâu vào chuyên môn thực chất.`);
        } else {
            res.push(`• **Cách Cục Cự Nhật**: Chủ về quang minh, danh tiếng, ngoại giao, hùng biện và khả năng lan tỏa ảnh hưởng sâu rộng trong xã hội.`);
        }
        return res.join("\n");
    }

    // 7. Cách Cục Cơ Nguyệt Đồng Lương thuần túy
    if (hasCoNguyetMenh || coNguyetCount >= 2) {
        res.push(`• **Cách Cục Cơ Nguyệt Đồng Lương**: Bộ sao Trí tuệ & Văn chức ("Cơ Nguyệt Đồng Lương tác lại nhân"). Thích hợp cho môi trường quy củ, tham mưu, cố vấn, chuyên gia, giáo dục, y tế, tài chính hoặc hành chính.`);
        return res.join("\n");
    }

    res.push(`• **Cách Cục Biến Hóa Phối Hợp**: Các chính tinh phối hợp linh hoạt giữa văn và võ theo từng giai đoạn vận hạn.`);
    return res.join("\n");
}

// ----------------------------------------------------------------------------
// BƯỚC 4: ĐÁNH GIÁ TỨ HÓA, SÁT TINH (BẢN CUNG + HỘI CHIẾU) & CÁT TINH CỨU GIẢI
// ----------------------------------------------------------------------------
function evalStep4_SatTinhTuHoa(laSo) {
    const res = [];
    const menhP = findCungByName(laSo.palates, "Mệnh");
    const taiP = findCungByName(laSo.palates, "Tài Bạch");
    const quanP = findCungByName(laSo.palates, "Quan Lộc");
    const diP = findCungByName(laSo.palates, "Thiên Di") || laSo.palates[(menhP.chiIndex + 6) % 12];
    
    res.push(`### 1. Phân Bổ Bộ Tứ Hóa Nguyên Cục (Lộc, Quyền, Khoa, Kỵ)`);
    laSo.palates.forEach(p => {
        const tuHoaInP = p.phuTinh.filter(s => ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"].includes(s));
        if (tuHoaInP.length > 0) {
            const cName = cleanCungName(p.chucNang);
            res.push(`• **Cung ${cName} (${p.chiName})**: Có **${tuHoaInP.join(", ")}**.`);
            tuHoaInP.forEach(th => {
                if (th === "Hóa Lộc") res.push(`  - *Hóa Lộc*: Đem lại cơ hội tài lộc, nhân duyên tốt và sự hanh thông tại cung ${cName}.`);
                if (th === "Hóa Quyền") res.push(`  - *Hóa Quyền*: Gia tăng vị thế, quyền lực, sự chủ động và khả năng kiểm soát tại cung ${cName}.`);
                if (th === "Hóa Khoa") res.push(`  - *Hóa Khoa*: Đệ nhất giải thần, gia tăng học vấn, uy tín, hóa giải tai ương tại cung ${cName}.`);
                if (th === "Hóa Kỵ") res.push(`  - *Hóa Kỵ*: Chủ về sự chấp trước (nặng lòng), cần cẩn trọng thị phi, hiểu lầm hoặc rắc rối giấy tờ tại cung ${cName}.`);
            });
        }
    });

    const lucSatNames = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"];
    const baiTinhNames = ["Thiên Không", "Thiên Hình", "Kiếp Sát", "Cô Thần", "Quả Tú", "Hóa Kỵ", "Đại Hao"];
    const catTinhNames = ["Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa"];

    const satInMenh = menhP.phuTinh.filter(s => lucSatNames.includes(s));
    const baiInMenh = menhP.phuTinh.filter(s => baiTinhNames.includes(s));
    const satInTamPhuong = [
        ...taiP.phuTinh.filter(s => lucSatNames.includes(s)).map(s => `${s} (Tài)`),
        ...quanP.phuTinh.filter(s => lucSatNames.includes(s)).map(s => `${s} (Quan)`),
        ...diP.phuTinh.filter(s => lucSatNames.includes(s)).map(s => `${s} (Di)`)
    ];
    const catInTamPhuong = [...new Set(
        [...menhP.phuTinh, ...taiP.phuTinh, ...quanP.phuTinh, ...diP.phuTinh].filter(s => catTinhNames.includes(s))
    )];

    const menhParsed = menhP.chinhTinh.map(parseStar);
    const hasHamStar = menhParsed.some(s => s.code === "H");
    const isVCD = menhP.chinhTinh.length === 0;
    const hasTuanTriet = menhP.isTuan || menhP.isTriet;

    res.push(`\n### 2. Sát Tinh, Bại Tinh & Cát Tinh Hội Hợp Cung Mệnh`);
    if (satInMenh.length === 0) {
        if (satInTamPhuong.length === 0 && baiInMenh.length === 0) {
            res.push(`• **Bản cung & Tam phương trong sạch**: Cung Mệnh không bị Lục Sát Tinh xâm phạm trực tiếp lẫn hội chiếu. Bản mệnh êm đềm, ít gặp biến cố bất ngờ.`);
        } else {
            res.push(`• **Bản cung Mệnh không có Lục Sát Tinh tọa thủ trực tiếp**, tuy nhiên:`);
            if (baiInMenh.length > 0) {
                res.push(`  - Tại Mệnh có các Hình/Ám/Bại tinh (**${baiInMenh.join(", ")}**): Cần chú ý giữ gìn tâm lý, cẩn trọng lời ăn tiếng nói, thủ tục pháp lý hoặc cảm giác cô đơn nội tâm.`);
            }
            if (satInTamPhuong.length > 0) {
                res.push(`  - Tam phương tứ chính có Sát Tinh hội chiếu (**${satInTamPhuong.join(", ")}**): Khi ra ngoài xã hội (Thiên Di), mưu cầu công danh (Quan Lộc) hoặc tiền bạc (Tài Bạch) vẫn phải đối mặt với sự cạnh tranh và áp lực nhất định.`);
            }
        }
    } else {
        if (hasHamStar) {
            const mainStarNames = menhParsed.map(s => s.name).join("-");
            res.push(`• **CẢNH BÁO QUAN TRỌNG**: Cung Mệnh hội Lục Sát Tinh (**${satInMenh.join(", ")}**) trong khi Chính Tinh lại ở thế **Hãm Địa** (cách '${mainStarNames} ngộ ${satInMenh.join("-")}').`);
            res.push(`  - *Ảnh hưởng*: Dễ gặp trắc trở công danh, hao tán tài sản, bị tiểu nhân lừa gạt hoặc gặp biến cố bất ngờ. Cần hết sức tỉnh táo trong hợp tác, minh bạch tài chính, tránh tin người quá đà và tuyệt đối không đầu cơ liều lĩnh.`);
            if (hasTuanTriet || catInTamPhuong.length >= 2) {
                res.push(`  - *Điểm sáng cứu giải*: Nhờ có ${hasTuanTriet ? "Tuần/Triệt án ngữ " : ""}${catInTamPhuong.length > 0 ? `cùng các Cát Tinh (${catInTamPhuong.join(", ")}) hội hợp` : ""}, nếu biết tu dưỡng đạo đức, làm việc cẩn trọng thì vẫn hóa giải được phần lớn hung hiểm.`);
            }
        } else if (isVCD) {
            res.push(`• **Cảnh báo Mệnh Vô Chính Diệu gặp Sát Tinh (${satInMenh.join(", ")})**: Dễ tạo ra những bước ngoặt hoặc xáo trộn bất ngờ trong cuộc sống.`);
            if (hasTuanTriet) {
                res.push(`  - *Đã có Tuần/Triệt chế hóa*: Nhờ Tuần/Triệt đóng tại Mệnh nên Sát Tinh bị chế phục, biến hung thành quyền ("Hoạnh phát"), tuy vất vả nhưng có thể lập nên thành tựu đột phá.`);
            } else {
                res.push(`  - *Lưu ý*: Do Mệnh không có Tuần/Triệt che chắn, cần rèn luyện bản lĩnh kiên định, sống minh bạch và chú ý giữ gìn sức khỏe.`);
            }
        } else {
            res.push(`• **Chính Tinh Miếu/Vượng/Đắc chế hóa Sát Tinh (${satInMenh.join(", ")})**: Nhờ Chính Tinh vững vàng, các Sát Tinh đóng vai trò kích phát ý chí chiến đấu, sự quyết đoán và năng lượng bứt phá, song vẫn cần kiềm chế sự nóng nảy.`);
        }
    }

    if (catInTamPhuong.length > 0) {
        res.push(`• **Hệ thống Cát Tinh phò tá Mệnh - Tài - Quan - Di**: Hội được **${catInTamPhuong.join(", ")}** giúp gia tăng quý nhân, năng lực chuyên môn và phúc lộc.`);
    }

    return res.join("\n");
}

// ----------------------------------------------------------------------------
// BƯỚC 5: TỔNG QUAN 12 CUNG CHỨC NĂNG & ĐẠI HẠN (HIỂN THỊ ĐẦY ĐỦ SAO QUAN TRỌNG)
// ----------------------------------------------------------------------------
function getImportantPhuTinh(phuTinhList) {
    const prioritySet = new Set([
        "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ",
        "Lộc Tồn", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp",
        "Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt",
        "Thiên Mã", "Đào Hoa", "Hồng Loan", "Thiên Hỷ", "Thiên Hình", "Thiên Diêu",
        "Thiên Không", "Cô Thần", "Quả Tú", "Kiếp Sát", "Thái Tuế", "Bạch Hổ", "Tang Môn",
        "Đại Hao", "Tiểu Hao", "Ân Quang", "Thiên Quý", "Quốc Ấn", "Đường Phù", "Thiên Trù"
    ]);
    // Không lấy sao Lưu ở phần tóm tắt nguyên cục (sao Lưu sẽ luận riêng ở Bước 6)
    const basePhuTinh = phuTinhList.filter(s => !s.startsWith("L."));
    const important = basePhuTinh.filter(s => prioritySet.has(s));
    const others = basePhuTinh.filter(s => !prioritySet.has(s));
    return [...important, ...others].slice(0, 10);
}

function evalStep5_12CungAndVanHan(laSo) {
    const res = [];
    
    res.push(`### 1. Tóm Tắt 12 Cung Chức Năng & Đại Hạn 10 Năm`);
    laSo.palates.forEach(p => {
        const isCurrentDaiHan = laSo.tuoiAm !== null && laSo.tuoiAm !== undefined && p.daiHan <= laSo.tuoiAm && laSo.tuoiAm < p.daiHan + 10;
        const dhBadge = isCurrentDaiHan ? ` [ĐẠI HẠN HIỆN TẠI: ${p.daiHan} - ${p.daiHan + 9} tuổi]` : ` [Đại Hạn ${p.daiHan} - ${p.daiHan + 9} tuổi]`;
        const title = `• **Cung ${p.chucNang} (${p.canName || ""} ${p.chiName})**${dhBadge}`;
        const ctStr = p.chinhTinh.length > 0 ? p.chinhTinh.join(", ") : "Vô Chính Diệu";
        const ptStr = getImportantPhuTinh(p.phuTinh).join(", ");
        const tuanTriet = (p.isTuan ? " <TUẦN>" : "") + (p.isTriet ? " <TRIỆT>" : "");
        res.push(`${title}${tuanTriet}:`);
        res.push(`  - Chính Tinh: ${ctStr} | Vòng Tràng Sinh: ${p.trangSinh}`);
        res.push(`  - Phụ Tinh Nổi Bật: ${ptStr}`);
    });

    res.push(`\n### 2. Chiều Di Chuyển Đại Hạn`);
    res.push(`• Đại Hạn khởi từ Cung Mệnh (${laSo.menhCung}) lúc **${laSo.cucNumber} tuổi** (theo ${laSo.cucName}).`);
    res.push(`• Chiều di chuyển Đại Hạn: **${laSo.amDuongNamNu.includes("Dương Nam") || laSo.amDuongNamNu.includes("Âm Nữ") ? "Thuận chiều Kim đồng hồ" : "Nghịch chiều Kim đồng hồ"}**.`);

    if (laSo.tuoiAm !== null && laSo.tuoiAm !== undefined) {
        const currentDH = laSo.palates.find(p => p.daiHan <= laSo.tuoiAm && laSo.tuoiAm < p.daiHan + 10);
        if (currentDH) {
            const dhName = cleanCungName(currentDH.chucNang);
            const dhStars = currentDH.chinhTinh.length > 0 ? currentDH.chinhTinh.join(", ") : "Vô Chính Diệu";
            res.push(`• **Đại Hạn Đương Thời (${laSo.tuoiAm} tuổi âm)**: Bạn đang nằm trong Đại Hạn **${currentDH.daiHan} - ${currentDH.daiHan + 9} tuổi** tại **Cung ${dhName} (${currentDH.chiName})** (Chính tinh: ${dhStars}).`);
        }
    }

    return res.join("\n");
}

// ----------------------------------------------------------------------------
// BƯỚC 6: LUẬN GIẢI VẬN HẠN NĂM XEM (ĐẠI HẠN, LƯU ĐẠI HẠN, TIỂU HẠN & SAO LƯU)
// ----------------------------------------------------------------------------
function evalStep6_LuuNienVanHan(laSo) {
    if (!laSo.viewYearStr && (laSo.tuoiAm === null || laSo.tuoiAm === undefined)) {
        return "• Chưa nhập năm xem hạn (namXem hoặc viewYear). Vui lòng truyền namXem hoặc viewYearCanIndex / viewYearChiIndex để luận giải chi tiết vận hạn năm.";
    }

    const res = [];
    const headerYear = laSo.viewYearStr ? `Năm ${laSo.viewYearStr}` : "Năm Xem Hạn";
    const headerAge = laSo.tuoiAm ? ` (${laSo.tuoiAm} tuổi âm)` : "";
    res.push(`### 1. Trọng Tâm Hạn Năm Xem: ${headerYear}${headerAge}`);

    // Thông tin Đại Hạn, Lưu Đại Hạn, Tiểu Hạn & Lưu Niên Mệnh
    if (laSo.tuoiAm !== null && laSo.tuoiAm !== undefined) {
        const currentDH = laSo.palates.find(p => p.daiHan <= laSo.tuoiAm && laSo.tuoiAm < p.daiHan + 10);
        if (currentDH) {
            res.push(`• **Gốc Đại Hạn 10 Năm (${currentDH.daiHan}-${currentDH.daiHan + 9} tuổi)**: Đóng tại **Cung ${cleanCungName(currentDH.chucNang)} (${currentDH.chiName})** - Chính tinh: ${currentDH.chinhTinh.length ? currentDH.chinhTinh.join(", ") : "Vô Chính Diệu"}.`);
        }
    }

    const ldhPalate = laSo.palates.find(p => p.isLuuDaiHan) || (laSo.luuDaiHanCung ? laSo.palates.find(p => p.chiName === laSo.luuDaiHanCung) : null);
    if (ldhPalate) {
        res.push(`• **Cung Lưu Đại Hạn**: Rơi vào **Cung ${cleanCungName(ldhPalate.chucNang)} (${ldhPalate.chiName})** - Chính tinh: ${ldhPalate.chinhTinh.length ? ldhPalate.chinhTinh.join(", ") : "Vô Chính Diệu"}.`);
    }

    const thPalate = laSo.palates.find(p => p.isTieuHan) || (laSo.tieuHanCung ? laSo.palates.find(p => p.chiName === laSo.tieuHanCung) : null);
    if (thPalate) {
        res.push(`• **Cung Tiểu Hạn (1 Năm)**: Rơi vào **Cung ${cleanCungName(thPalate.chucNang)} (${thPalate.chiName})** - Chính tinh: ${thPalate.chinhTinh.length ? thPalate.chinhTinh.join(", ") : "Vô Chính Diệu"}.`);
    }

    const lnMenhPalate = laSo.palates.find(p => p.luuNienChucNang === "LN.Mệnh");
    if (lnMenhPalate) {
        res.push(`• **Cung Lưu Niên Mệnh (LN.Mệnh / Thái Tuế Lưu Niên)**: Trùng với **Cung ${cleanCungName(lnMenhPalate.chucNang)} (${lnMenhPalate.chiName})**. Đây là môi trường trực tiếp chi phối các biến chuyển bên ngoài trong năm.`);
    }

    res.push(`\n### 2. Phân Tích Chi Tiết Sao Lưu Niên & Lưu Tứ Hóa Nhập Các Cung`);
    let hasLuu = false;
    laSo.palates.forEach(p => {
        const luuStars = p.phuTinh.filter(s => s.startsWith("L."));
        if (luuStars.length > 0) {
            hasLuu = true;
            const cungName = cleanCungName(p.chucNang);
            const lnTag = p.luuNienChucNang ? ` - ${p.luuNienChucNang}` : "";
            const thTag = p.isTieuHan ? " [TIỂU HẠN]" : "";
            const ldhTag = p.isLuuDaiHan ? " [LƯU ĐẠI HẠN]" : "";
            res.push(`• **Cung ${cungName} (${p.chiName}${lnTag})${ldhTag}${thTag}** có sao Lưu: **${luuStars.join(", ")}**.`);
            
            luuStars.forEach(star => {
                if (star === "L.Thái Tuế") {
                    res.push(`  - *L.Thái Tuế tại Cung ${cungName}*: Tâm điểm biến động lớn nhất trong năm. Các quyết định và sự kiện trọng đại sẽ xoay quanh phương diện ${cungName}.`);
                }
                if (star === "L.Lộc Tồn") {
                    res.push(`  - *L.Lộc Tồn tại Cung ${cungName}*: Đem lại nguồn lộc tài, sự tích lũy và may mắn thực tế liên quan đến Cung ${cungName}.`);
                }
                if (star === "L.Thiên Khôi" || star === "L.Thiên Việt") {
                    res.push(`  - *${star} tại Cung ${cungName}*: Có quý nhân nâng đỡ, cơ hội thăng tiến hoặc gặp người giúp sức kịp thời tại phương diện ${cungName}.`);
                }
                if (star === "L.Kình Dương") {
                    res.push(`  - *L.Kình Dương tại Cung ${cungName}*: Cẩn trọng sự cạnh tranh gay gắt, va chạm, xích mích hoặc biến động đột ngột tại Cung ${cungName}.`);
                }
                if (star === "L.Đà La") {
                    res.push(`  - *L.Đà La tại Cung ${cungName}*: Đề phòng sự trì trệ, cản trở ngầm, thị phi dây dưa kéo dài tại Cung ${cungName}.`);
                }
                if (star === "L.Thiên Mã") {
                    res.push(`  - *L.Thiên Mã tại Cung ${cungName}*: Chủ về sự dịch chuyển, thay đổi, đi xa, bận rộn năng nổ hoặc đổi mới liên quan đến Cung ${cungName}.`);
                }
                if (star === "L.Tang Môn") {
                    res.push(`  - *L.Tang Môn tại Cung ${cungName}*: Dễ có chuyện lo âu, trăn trở tâm lý hoặc cần quan tâm chăm sóc sức khỏe người thân.`);
                }
                if (star === "L.Bạch Hổ") {
                    res.push(`  - *L.Bạch Hổ tại Cung ${cungName}*: Cẩn trọng sức khỏe, áp lực công việc cao hoặc các vấn đề liên quan thủ tục, giấy tờ pháp lý.`);
                }
                if (star === "L.Thiên Khốc" || star === "L.Thiên Hư") {
                    res.push(`  - *${star} tại Cung ${cungName}*: Dễ có lúc cảm xúc trùng xuống, hao tổn tâm sức hoặc lo nghĩ nhiều về phương diện ${cungName}.`);
                }
                if (star === "L.Hóa Lộc") res.push(`  - *L.Hóa Lộc*: Cơ hội tài lộc, dòng tiền và nhân duyên khởi sắc mạnh tại Cung ${cungName}.`);
                if (star === "L.Hóa Quyền") res.push(`  - *L.Hóa Quyền*: Khẳng định uy tín, nắm quyền tự quyết và mở rộng tầm ảnh hưởng tại Cung ${cungName}.`);
                if (star === "L.Hóa Khoa") res.push(`  - *L.Hóa Khoa*: Thuận lợi về thi cử, học hành, danh tiếng, đồng thời hóa giải tai ách tại Cung ${cungName}.`);
                if (star === "L.Hóa Kỵ") res.push(`  - *L.Hóa Kỵ*: Đề phòng thị phi, hiểu lầm, trục trặc cam kết hoặc áp lực tâm lý tại Cung ${cungName}.`);
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

// ESM exports — calculation and interpretation text above are unchanged.
export {
    luanSoTuViToanDien,
    evalStep1_ThienBan,
    evalStep2_MenhThan,
    evalStep3_TamHopCáchCục,
    evalStep3_TamHopCáchCục as evalStep3_TamHopCachCuc,
    evalStep4_SatTinhTuHoa,
    evalStep5_12CungAndVanHan,
    evalStep6_LuuNienVanHan
};
