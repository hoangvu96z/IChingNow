# Thuật toán Tử Vi v4 do người dùng cung cấp

Nguồn nguyên văn: `test/fixtures/tuvi-v4-user.cjs` (tệp người dùng gửi, không chỉnh sửa).
SHA-256: `1955e5bace37bb9eeac1630728bb9373fce9805999c3e04b56e17e307beed560`.

`src/utils/tuViEngineV4.js` giữ nguyên toàn bộ phần tính toán và các bảng của nguồn, chỉ thay phần xuất CommonJS bằng ESM để chạy trong Vite. `src/utils/tuViEngine.js` kiểm tra phạm vi đầu vào và bổ sung các trường trình bày mà giao diện đã dùng: `isMenh`, `isThan`, `isThuan`, `tuanCung`, `trietCung`, cùng nhãn phiên bản/năm xem. Không an thêm sao ở adapter.

Những lựa chọn giữ đúng nguồn thực thi:

- Bính Tý: bảng `tuanMap[10]` trả Dậu–Tuất. Chú thích đầu tệp có nhắc cả Thân–Dậu; tích hợp tuân theo bảng code.
- Giáp Tý/Ất Sửu giữ nguyên giá trị Nạp Âm trong nguồn, không tự thay bằng bảng khác.
- Vị trí Thiên Sứ/Thiên Thương vẫn theo biểu thức trong nguồn, kể cả trường hợp nghịch hành khi tên cung có thể khác chú thích.
- Không tự bổ sung sao hoặc thay đổi bảng Miếu/Vượng/Đắc/Hãm và Tứ Hóa.
- Năm xem không bắt buộc. Chỉ truyền `viewYearCanIndex`, `viewYearChiIndex` khi người dùng chọn năm; giữ đúng 5 sao `L.` mà mã nguồn thực sự tính. Chưa có tiểu hạn hoặc bộ hạn đầy đủ.
- Tháng nhuận vẫn truyền số tháng âm đã có từ bộ đổi lịch; nguồn v4 không cung cấp quy tắc an riêng cho tháng nhuận, không tự thêm quy tắc.

Giao diện tách các sao có tiền tố `L.` để dễ đọc và ghi năm xem trong lá số xuất ảnh/PDF, dữ liệu xuất, prompt và căn cứ AI. Dấu `<THÂN>` giữ nguyên trong kết quả engine; tên cung trên thẻ ẩn dấu này vì đã có huy hiệu Thân.

Lịch sử có kết quả cũ tiếp tục giữ nguyên. Nếu bản ghi thiếu kết quả và phải tính lại bằng v4 thì bỏ hội thoại cũ khỏi phiên khôi phục để tránh ghép sai dữ liệu. Khi đổi lịch thất bại, giao diện báo lỗi; không dùng ngày dương làm ngày âm ước lượng.

Kiểm tra: `npm test --prefix tuvinow`, `npm run build:tuvi`. Bộ đối chiếu thực thi cả nguồn nguyên văn và adapter, so sánh toàn bộ trường tính toán cho 5.400 đầu vào và 60 năm lưu niên. Đây là xác minh tích hợp khớp nguồn người dùng, không phải chứng nhận học thuật cho các công thức trong nguồn.
