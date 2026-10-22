# AI Tử Vi

## Hoạt động

- Copy prompt và dữ liệu lá số dùng được khi chưa đăng nhập.
- Luận giải AI cần phiên SSO hợp lệ. Frontend dùng helper `requestAiChat` để gọi `POST /plans/ai` trên SSO; không gọi trực tiếp provider.
- Quota dùng app `tuvinow`; lịch sử dùng app `tuvi`, giữ hợp đồng của các hook cũ.
- Mỗi yêu cầu AI giữ chỗ một lượt trước khi gọi provider. Nếu request tới provider hoặc stream provider lỗi, backend hoàn lại lượt đã giữ. Ngắt kết nối/hủy từ client sau khi yêu cầu bắt đầu không hoàn lượt vì provider có thể đã xử lý và tính phí.
- Lần luận giải thành công tự lưu lá số và hội thoại. Có nút Lưu để lưu riêng lá số hoặc thử lưu lại khi lỗi. Tối đa 5 câu hỏi thêm mỗi luận giải.
- Ngày sinh và hội thoại được mã hóa theo tiện ích AES hiện có của project trước khi lưu; đây không phải mã hóa với khóa bí mật do người dùng tự giữ.

## Cấu hình SSO

Frontend gửi yêu cầu AI qua proxy dùng chung `POST /plans/ai` của vInfiSSO. Chỉ cấu hình `AI_API_KEY` và `AI_BASE_URL` trong môi trường runtime của SSO; không đặt giá trị của chúng trong biến `VITE_*`, frontend bundle, tài liệu hoặc source control. Proxy chỉ chấp nhận dịch vụ AI chạy local và từ chối base URL public.

Trên production, SSO đọc `.env` trước rồi bổ sung biến còn thiếu từ `.env.production`; biến môi trường của tiến trình được ưu tiên cao nhất. Đặt cấu hình tại thư mục gốc SSO. Sau khi cập nhật biến môi trường, khởi động lại PM2 với `--update-env`.

Frontend cần `VITE_SSO_URL` trỏ đến SSO và cấu hình origin tương ứng trong `ALLOWED_ORIGINS`. Khi phát triển local, dùng cấu hình Vite proxy hiện có; production phải gọi SSO trực tiếp.

Triển khai backend SSO trước rồi build/deploy TuViNow. Không cần migration database. Luồng AI của các app dùng chung proxy SSO.

## Kiểm thử

```sh
# Tại IChingNow
node --test tuvinow/test/*.test.js
npm run build:tuvi
npm run lint:tuvi

# Tại vInfiSSO
npm test -- --runInBand src/plans/plans.ai.spec.ts
npx nest build
```

Kiểm tra thực tế sau deploy: đăng nhập → lập lá số → copy prompt → luận giải → hỏi tiếp → tải lại trang → mở lịch sử. Kiểm tra tài khoản hết quota và cấu hình AI không hợp lệ. Không gọi AI thật trong bộ test; upstream được mock để không tiêu quota/chi phí.
# Evidence-linked interpretation

In-app AI requests use JSON version 1: `sections` containing `title`, `text`, and `references`, plus `questions`. References `palace.0` through `palace.11` use the engine's `chiIndex`. Only existing palace IDs become links. The evidence panel displays the original computed stars, decade, and palace flags. Its locate button scrolls and focuses the palace; Escape closes it and restores button focus.

Raw responses remain in saved conversations. Copy exports readable prose; legacy Markdown remains supported. Questions-only responses are rejected instead of saved as successful interpretations. The provider resets with the reading/account session. Styles use existing light/dark theme tokens.

Deploy TuViNow together with the system-prompt update in `vInfiSSO/src/plans/plans.controller.ts`, which allows the requested JSON format. No database migration is needed. Manual prompt export continues to request Markdown.

Validation: `npm test --prefix tuvinow`, `npm run build:tuvi`, and the SSO `plans.tuvi-ai.spec.ts` suite. Component rendering tests use synthetic responses; live provider output has not been verified.
