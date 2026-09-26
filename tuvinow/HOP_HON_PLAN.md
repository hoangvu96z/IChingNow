# Trang Hợp hôn trong TuViNow

## Phạm vi đã yêu cầu

Trang riêng trong TuViNow, nhập thông tin hai người, kết quả theo bốn tiêu chí Ngũ hành / Phu Thê / Tứ Hóa chéo / Đào hoa, tổng kết và AI chuyên sâu với câu hỏi tiếp nối. Dùng hệ thống màu sáng/tối hiện tại, bố cục hai cột trên desktop và một cột trên mobile. Giữ cách điều hướng gọn, không thêm nhiều nút trên navbar.

## Phần cần nguồn bổ sung

File `gemini-code-1790427160831.md` nhận ngày 26/09/2026 chỉ dài 978 byte, gồm tiêu đề, mục lục và kết thúc tại “Hệ thống hoạt động qua 5 bước tuần tự:”. Chưa có engine chấm điểm, trọng số, ngưỡng tổng kết, định nghĩa Tứ Hóa chéo hoặc danh sách sao Đào hoa. Ảnh minh họa không đủ xác định những quy tắc này. Chưa triển khai công thức hoặc điểm số giả định.

## Cách tích hợp

1. Tách trang Hợp hôn với đường dẫn điều hướng có thể quay lại sau đăng nhập SSO. Không thay đổi trạng thái lá số riêng lẻ khi chuyển trang.
2. Hai hồ sơ A/B có tên, lịch âm/dương, ngày tháng năm, giờ sinh và giới tính phục vụ thuật toán. Dùng chuyển lịch và engine an số đang có; kiểm tra ngày thực, giờ, tháng nhuận; không sửa các thay đổi người dùng đang làm trong bộ chuyển lịch.
3. Module chấm điểm riêng nhận hai lá số đã tính. Mỗi tiêu chí trả điểm, trọng số, dữ kiện nguồn của từng người và diễn giải đúng thuật toán được cung cấp. Không trộn kết quả chấm điểm với nội dung do AI sinh.
4. Kết quả gồm điểm tổng, bốn tiêu chí, dữ kiện đối chiếu và tổng kết. Không dùng màu sắc làm dấu hiệu duy nhất; mọi điểm và trạng thái có nhãn chữ. Không gán vai trò tính cách dựa vào giới tính từ ảnh mẫu.
5. AI nhận cả hai lá số đầy đủ, kết quả từng tiêu chí và câu hỏi. Mã căn cứ phải phân biệt A/B để không ghép sao hoặc cung người này sang người kia. Giữ hội thoại trong đúng cặp hồ sơ; thay người phải bắt đầu phiên mới.
6. Đăng nhập bắt buộc. Dùng cơ chế quyền/gói của TuViNow; AI gọi qua SSO `/plans/tuvi-ai`, server kiểm tra phiên và quota `tuvinow`, không gọi nhà cung cấp từ trình duyệt. Nếu yêu cầu quyền Hợp hôn riêng ngoài gói hiện tại, cần bổ sung entitlement ở backend và kiểm tra tại endpoint, không chỉ ẩn nút ở frontend.
7. Tự lưu cặp hồ sơ, kết quả và hội thoại bằng loại reading riêng `tuvi-hop-hon`; phân biệt với `tuvi-laso` trong lịch sử. Lưu dữ liệu cá nhân theo cơ chế mã hóa hiện có, tránh để cặp hồ sơ bị đọc như lá số riêng lẻ.

## Kiểm tra trước bàn giao

- Đối chiếu điểm theo ví dụ chuẩn của nguồn đầy đủ, các ranh giới và chiều A/B khi công thức có hướng.
- Khách, phiên hết hạn, gói không đủ quyền/lượt, lỗi cấu hình AI và lỗi mạng.
- AI nhận đúng hai lá số, hỏi tiếp có đủ ngữ cảnh, không trừ lượt hai lần; tự lưu, mở lịch sử và chuyển tài khoản không lẫn dữ liệu.
- Responsive, bàn phím, dark/light và luồng lá số riêng lẻ không bị ảnh hưởng.

Chưa sửa ứng dụng hoặc backend trong bước kiểm tra plan này; chờ phần thuật toán đầy đủ hoặc lựa chọn cho phép đề xuất quy tắc để duyệt.
