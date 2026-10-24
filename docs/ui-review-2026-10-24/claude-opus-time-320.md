# UI Review — maihoa-time-320-final.png (viewport 320px)

Phạm vi: chỉ đánh giá hình ảnh `output/verify/maihoa-time-320-final.png`. Không đọc source, không test.

| # | Mức độ | Lỗi | Evidence trong ảnh | Đề xuất |
|---|--------|-----|--------------------|---------|
| 1 | **Cao** | Hàng input ngày/giờ bị tràn ngang ra ngoài card và viewport | Label "GIỜ ĐỘNG TÂ…" bị cắt ở mép phải; ô giờ "07:34" và icon đồng hồ bị cắt, vượt khỏi viền card trắng | Ở màn hẹp, xếp 2 trường thành 1 cột hoặc dùng `min-width: 0` / grid `minmax(0,1fr)` |
| 2 | Trung bình | Tiêu đề bị đầu trang cố định che một phần | Dòng "🕐 Mai Hoa — Ngày giờ" sát/đè dưới header, viền trên của card không nhìn thấy | Thêm khoảng cách scroll (scroll-margin-top) hoặc padding-top cho nội dung |
| 3 | Trung bình | Chữ "Năm: Bính Ngọ (# 7)" bị ngắt dòng giữa giá trị | "Bính" ở dòng 1, "Ngọ (# 7)" xuống dòng 2, lệch hàng với "Tháng: 9" | Cho giá trị năm chiếm cả hàng hoặc dùng `white-space: nowrap` cho can-chi |
| 4 | Trung bình | Dòng Số thượng/Số hạ ngắt dòng khó đọc | "Số hạ =" ở cuối dòng 1, "+5 = 36" ở dòng 2 → biểu thức bị tách | Đặt Số thượng và Số hạ trên 2 dòng riêng |
| 5 | Thấp | Công thức xuống dòng sau dấu "=" | "Thượng quái =" / "(Năm + Tháng + Ngày) mod 8" tách 2 dòng; tương tự Hạ quái, Hào động | Chấp nhận được; có thể thêm thụt lề cho dòng công thức để phân cấp rõ hơn |

Không thấy lỗi rõ ràng khác (nút "Lập quẻ Mai Hoa", "Đổi phương pháp gieo" hiển thị đầy đủ).
