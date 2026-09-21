# AI Tử Vi

## Hoạt động

- Copy prompt và dữ liệu lá số dùng được khi chưa đăng nhập.
- Luận giải AI cần phiên SSO hợp lệ. Frontend gọi `POST /plans/tuvi-ai`; API key chỉ nằm ở SSO.
- Quota dùng app `tuvinow`; lịch sử dùng app `tuvi`, giữ hợp đồng của các hook cũ.
- Mỗi yêu cầu AI trừ một lượt trước khi gọi upstream, theo chính sách SSO hiện có. Backend thử lại tối đa một lần khi mất kết nối, HTTP 429 hoặc 5xx, không trừ thêm lượt. Lỗi/hủy chờ không hoàn lượt.
- Lần luận giải thành công tự lưu lá số và hội thoại. Có nút Lưu để lưu riêng lá số hoặc thử lưu lại khi lỗi. Tối đa 5 câu hỏi thêm mỗi luận giải.
- Ngày sinh và hội thoại được mã hóa theo tiện ích AES hiện có của project trước khi lưu; đây không phải mã hóa với khóa bí mật do người dùng tự giữ.

## Cấu hình SSO

Trên máy chủ chạy vInfiSSO, đặt:

```dotenv
TUVI_AI_BASE_URL=http://43.128.116.69:20128/v1
TUVI_AI_API_KEY=<API key của upstream đang dùng>
TUVI_AI_MODELS=combo1
```

Có thể liệt kê nhiều model, phân cách bằng dấu phẩy. Frontend chỉ chọn trong danh sách này. Không đưa API key vào biến `VITE_` hoặc commit credential vào repo.

`.env` local của SSO đã được cấu hình từ upstream đang có ở app IChing. Môi trường production cần đặt key qua biến môi trường/secret trên server; `.env.production` trong repo không được bổ sung key mới.

Frontend cần `VITE_SSO_URL` trỏ đến SSO (cùng cấu hình đăng nhập hiện có). Nếu biến này trống trong dev, Vite proxy `/sso`, `/ui`, `/plans`, `/readings` đến `http://localhost:3000`. Production phải dùng SSO URL thực, không dựa vào Vite proxy. Đảm bảo `ALLOWED_ORIGINS` của SSO cho phép origin chạy TuViNow.

Triển khai backend SSO trước, rồi build/deploy TuViNow. Không cần migration database. Hai app TarotNow và IChing không đổi luồng gọi AI.

## Kiểm thử

```sh
# Tại IChingNow
node --test tuvinow/test/*.test.js
npm run build:tuvi
npm run lint:tuvi

# Tại vInfiSSO
npm test -- --runInBand plans.tuvi-ai.spec.ts
npx nest build
```

Kiểm tra thực tế sau deploy: đăng nhập → lập lá số → copy prompt → luận giải → hỏi tiếp → tải lại trang → mở lịch sử. Kiểm tra tài khoản hết quota và cấu hình AI không hợp lệ. Không gọi AI thật trong bộ test; upstream được mock để không tiêu quota/chi phí.
