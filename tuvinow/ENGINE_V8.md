# Thuật toán an lá số v8

Tài liệu lịch sử; phiên bản hiện tại là v11, xem `ENGINE_V11.md`.

Nguồn tích hợp: `tu-vi-an-so-v8 (1).js` do người dùng cung cấp.

SHA-256 nguồn: `0ebaa8c29b9fa43880277cc6a52edf2129637dc1c4e3d563d46154895a41bf31`.

`src/utils/tuViEngineV8.js` giữ nguyên phần tính toán của file nguồn; chỉ phần xuất CommonJS được đổi thành ESM để Vite sử dụng. Bản nguồn nguyên văn được lưu ở `test/fixtures/tuvi-v8-user.cjs` để đối chiếu.

Adapter `src/utils/tuViEngine.js` hiện dùng `user-v8`, nên lá số mới, tổng quan, xuất dữ liệu, prompt AI, căn cứ và luận đoán miễn phí đều nhận cùng một kết quả an sao v8.

Các thay đổi v8 được áp dụng nguyên trạng gồm Khôi–Việt, Hỏa–Linh theo chiều Âm Dương, Tuần Không, Thiên Sứ/Thiên Thương cố định theo cung, Tứ Hóa Can Canh và bộ sao lưu niên mở rộng kèm Tứ Hóa lưu niên. Không sửa lại công thức hoặc tự bổ sung sao ngoài file nguồn.

Phần luận đoán miễn phí vẫn dùng file luận đoán v5 người dùng đã cung cấp; nó đọc lá số v8 mới và không tự an sao lần nữa.

Kiểm tra: đối chiếu nguyên bản trên 5.400 lá số, 60 năm lưu niên, kiểm tra Thiên Phúc đủ 10 can, kiểm tra sáu phần luận đoán trên 1.440 lá số, render component và build TuViNow.
