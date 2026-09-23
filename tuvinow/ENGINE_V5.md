# Thuật toán Tử Vi v5 (lịch sử)

Nguồn: `tu-vi-an-so-v5.js` do người dùng cung cấp, lưu nguyên văn tại `test/fixtures/tuvi-v5-user.cjs`. Phiên bản đang dùng là v8; tài liệu này giữ lại để đối chiếu lịch sử.
SHA-256: `c4ef28c5a6b03a4b35f4a1f33af3a207312adf5972827b84470c50e8be480fd0`.

So với nguồn v4, file mới chỉ đổi ba phần tử của `thienPhucMap`:

| Can năm sinh | v4 | v5 |
| --- | --- | --- |
| Ất | Mùi (7) | Thân (8) |
| Bính | Hợi (11) | Tý (0) |
| Nhâm | Tỵ (5) | Ngọ (6) |

Toàn bộ phần tính toán trong `src/utils/tuViEngineV5.js` giống nguồn được gửi; chỉ phần xuất CommonJS được đổi sang ESM. Adapter không còn dùng core v5 cho lá số mới.

Lá số, tổng quan, xuất dữ liệu, prompt AI và căn cứ dùng chung kết quả engine. Không bổ sung công thức hoặc thay đổi cách tính khác. Kết quả lịch sử đã lưu giữ nguyên phiên bản; lập lá số mới để dùng v5.

Kiểm tra `npm test --prefix tuvinow`: đối chiếu nguồn nguyên văn trên 5.400 lá số, 60 năm lưu niên, cùng vị trí Thiên Phúc cho đủ 10 can. `npm run build:tuvi` kiểm tra đóng gói ứng dụng.
