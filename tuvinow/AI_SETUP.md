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

Khi chạy `NODE_ENV=production`, SSO đọc `.env` trước rồi bổ sung biến còn thiếu từ `.env.production`. Biến môi trường của tiến trình được ưu tiên cao nhất. Đặt các file tại thư mục gốc SSO; PM2 đã cố định `cwd` tại thư mục chứa ecosystem config. Không để `TUVI_AI_API_KEY` rỗng trong nguồn ưu tiên cao hơn. Sau khi cập nhật biến môi trường, khởi động lại PM2 với `--update-env`.

Kiểm tra `GET /plans/tuvi-ai/config`: `configured: true` xác nhận đã nạp key, chưa xác nhận upstream hoạt động. Nếu trả `false`, backend không gọi upstream và không trừ quota. UI sẽ hiện trạng thái chưa sẵn sàng và cho kiểm tra lại. Frontend chỉ gọi SSO, không gọi trực tiếp upstream hay dùng key `VITE_AI_API_KEY` để vượt lỗi SSO.

Frontend cần `VITE_SSO_URL` trỏ đến SSO (cùng cấu hình đăng nhập hiện có). Nếu biến này trống trong dev, Vite proxy `/sso`, `/ui`, `/plans`, `/readings` đến `https://sso.vunph.click`. Production phải dùng SSO URL thực, không dựa vào Vite proxy. Đảm bảo `ALLOWED_ORIGINS` của SSO cho phép origin chạy TuViNow.

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
# Evidence-linked interpretation

In-app AI requests use JSON version 1: `sections` containing `title`, `text`, and `references`, plus `questions`. References `palace.0` through `palace.11` use the engine's `chiIndex`. Only existing palace IDs become links. The evidence panel displays the original computed stars, decade, and palace flags. Its locate button scrolls and focuses the palace; Escape closes it and restores button focus.

Raw responses remain in saved conversations. Copy exports readable prose; legacy Markdown remains supported. Questions-only responses are rejected instead of saved as successful interpretations. The provider resets with the reading/account session. Styles use existing light/dark theme tokens.

Deploy TuViNow together with the system-prompt update in `vInfiSSO/src/plans/plans.controller.ts`, which allows the requested JSON format. No database migration is needed. Manual prompt export continues to request Markdown.

Validation: `npm test --prefix tuvinow`, `npm run build:tuvi`, and the SSO `plans.tuvi-ai.spec.ts` suite. Component rendering tests use synthetic responses; live provider output has not been verified.
