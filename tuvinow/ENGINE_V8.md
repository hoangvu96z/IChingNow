# Thuật toán an lá số v8 (lịch sử)

Tài liệu lịch sử; phiên bản hiện tại là v11, xem `ENGINE_V11.md`.

Nguồn tích hợp: `tu-vi-an-so-v8 (1).js` do người dùng cung cấp.

SHA-256 nguồn: `0ebaa8c29b9fa43880277cc6a52edf2129637dc1c4e3d563d46154895a41bf31`.

`src/utils/tuViEngineV8.js` giữ nguyên phần tính toán của file nguồn; chỉ phần xuất CommonJS được đổi thành ESM để Vite sử dụng. Bản nguồn nguyên văn được lưu ở `test/fixtures/tuvi-v8-user.cjs` để đối chiếu. Core v8 hiện không còn được adapter runtime sử dụng.

Ở thời điểm phát hành v8, adapter `src/utils/tuViEngine.js` dùng `user-v8`. Adapter hiện tại ghi `user-v11` và dùng core chung tại `../shared/src/utils/tuViEngineV11.js`; xem `ENGINE_V11.md`.

Các thay đổi v8 được áp dụng nguyên trạng gồm Khôi–Việt, Hỏa–Linh theo chiều Âm Dương, Tuần Không, Thiên Sứ/Thiên Thương cố định theo cung, Tứ Hóa Can Canh và bộ sao lưu niên mở rộng kèm Tứ Hóa lưu niên. Không sửa lại công thức hoặc tự bổ sung sao ngoài file nguồn.

Ở phiên bản v8, phần luận đoán miễn phí dùng file luận đoán v5 người dùng đã cung cấp và đọc lá số v8 mà không tự an sao lần nữa. Runtime hiện tại vẫn dùng phần luận đoán v5 đó với dữ liệu lá số v11.

Kiểm tra lịch sử cho v8: đối chiếu nguyên bản trên 5.400 lá số, 60 năm lưu niên, kiểm tra Thiên Phúc đủ 10 can, kiểm tra sáu phần luận đoán trên 1.440 lá số, render component và build TuViNow.
