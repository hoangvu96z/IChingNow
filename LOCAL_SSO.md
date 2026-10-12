# Chạy và kiểm thử SSO ở local

Mỗi app dùng Vite proxy cho API, còn trang đăng nhập mở trên `https://sso.vunph.click`. Sau khi đăng nhập, SSO trả về đúng URL localhost ban đầu, gồm query và hash. Token được nhận, xóa khỏi thanh địa chỉ và gửi dưới dạng Bearer qua proxy.

| App | Lệnh ở thư mục gốc | URL |
| --- | --- | --- |
| IChingNow | `npm run dev:iching` | http://localhost:5173/kinhdich/ |
| TarotNow | `npm run dev:tarot` | http://localhost:5174/tarot/ |
| TuViNow | `npm run dev:tuvi` | http://localhost:5175/tuvi/ |
| TalkWithMe | `npm run dev:talk` | http://localhost:5176/talk/ |
| NoteNow | `npm run dev:note` | http://localhost:5177/note/ |

Không cần chạy backend port 3000 để dùng cấu hình mặc định. API local kết nối SSO và dữ liệu thật trên server; lưu ghi chú/lịch sử hoặc gọi AI vẫn sử dụng tài khoản và quota thật. TalkWithMe là form liên hệ không yêu cầu đăng nhập.

Muốn dùng backend riêng, đặt `VITE_SSO_URL=http://localhost:3000` trong `.env.local` của app và chạy backend có UI SSO ở địa chỉ đó. Khởi động lại Vite sau khi đổi cấu hình. Không đặt giá trị này thành URL frontend của app.

Các link chuyển app ở header/footer dùng các port trong bảng khi chạy dev. Mỗi origin (gồm port) có localStorage riêng: app mới sẽ cần đi qua SSO để nhận token của nó, nhưng dùng lại phiên đăng nhập hiện có trên SSO. Lỗi mạng/5xx không xóa token; server trả 401/403 hoặc phiên không hợp lệ mới yêu cầu đăng nhập lại.

Kiểm tra: mở từng URL, bấm đăng nhập, kiểm tra quay về đúng URL và tài khoản hiển thị; reload để xác nhận phiên được giữ; kiểm tra lịch sử/quota. TuViNow có thể kiểm tra URL `http://localhost:5175/tuvi/#hop-hon` để xác nhận hash được giữ.

Chạy regression bằng `npm run test:sso`; kiểm tra các build bằng `npm run build:all`.
