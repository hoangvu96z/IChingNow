# Luận đoán miễn phí v5

Nguồn: `tu-vi-luan-doan-v5.js` do người dùng cung cấp.
SHA-256: `602e3599cc3e4a686a792bfe57b2b11e54bbfa6ad4993dad4bf9f5953d552123`.

- `src/utils/tuViInterpretationV5.js` giữ nguyên toàn bộ thuật toán và câu chữ, chỉ thay CommonJS export bằng ESM. Bản nguyên gốc nằm ở `test/fixtures/tuvi-interpretation-v5-user.cjs`.
- Adapter kiểm tra dữ liệu đầy đủ trước khi gọi hàm; không thêm sao, không suy đoán Nạp Âm, không lập lại lá số lịch sử. Nhãn Thân lấy từ `thanCung`, năm xem lấy từ metadata năm đã có trên lá số.
- Báo cáo miễn phí chạy ngay trên trình duyệt, không gọi AI, không tiêu hao lượt và không yêu cầu đăng nhập. AI bên dưới vẫn là tính năng độc lập.
- Hiển thị sáu phần mở/thu gọn. Chuyển dấu đầu dòng và escape dấu góc chỉ ở lớp trình bày để không mất nhãn Thân/Tuần/Triệt. Nếu thiếu năm xem, UI dùng hướng dẫn tiếng Việt thay cho thông báo tham số kỹ thuật của nguồn.
- Kết quả được tính từ lá số đang xem, kể cả lá số lịch sử đủ dữ liệu. Không lưu một bản báo cáo riêng; không thay đổi cơ chế tự lưu lá số/hội thoại.
- Không tự sửa câu chữ hoặc quy tắc trong nguồn (kể cả tên cung bị rút gọn trong phần Tứ Hóa/Lưu Niên). Không bổ sung sao lưu mà thuật toán an sao chưa cung cấp.

Kiểm tra: so sánh nguyên bản mã nguồn; đối chiếu cả sáu phần trên 1.440 lá số, có/không năm xem; dữ liệu lịch sử thiếu nhãn Thân và thiếu dữ liệu bắt buộc; render Markdown và component thực tế.
