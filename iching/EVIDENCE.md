# Căn cứ luận giải AI

Tính năng hoạt động trong màn hình kết quả Lục Hào và Mai Hoa, dùng API AI/quota hiện có. Không cần migration hoặc endpoint SSO mới.

## Dữ liệu và định dạng

`src/logic/interpretationEvidence.js` tạo catalog từ kết quả engine:

- `hex.primary`, `hex.changed`, `hex.mutual`: các quẻ thực sự có trong kết quả.
- `line.primary.1` … `.6`, `line.changed.1` … `.6`: dữ kiện từng hào trong bảng Lục Hào.
- `maihoa.the-dung`: Thể–Dụng và hào động của Mai Hoa.

Không tạo quẻ biến cho quẻ tĩnh, không tạo Thể–Dụng cho kết quả gieo xu và không tạo liên kết hào cho bản Mai Hoa cũ thiếu bảng Lục Hào.

AI được yêu cầu trả JSON version 1 gồm `sections: [{ title, text, references }]` và `questions`. Markdown được phép trong `text`. Frontend chỉ liên kết mã tồn tại trong catalog; mã lạ bị bỏ và có thông báo. Việc kiểm tra mã không xác nhận diễn giải của AI là đúng về chuyên môn.

Raw response tiếp tục nằm trong `initialInterpretation` / `followUps[].answer`; hội thoại có thêm `evidenceVersion: 1`, vẫn được mã hóa bởi hook lịch sử hiện có. Lịch sử cũ dạng Markdown được hiển thị như trước. JSON thiếu phiên bản hợp lệ chỉ hiển thị nội dung, không tạo liên kết. JSON bị cắt được phục hồi các trường văn bản hoàn chỉnh khi có thể; nếu không thì hiển thị nguyên nội dung.

## Tương tác

Bấm “Xem căn cứ” để mở bảng dữ kiện và đánh dấu nguồn. “Xem trên quẻ” cuộn/focus đến nguồn. Căn cứ hào tự mở tab bảng Lục Hào. Escape hoặc nút đóng bỏ đánh dấu và trả focus về nút đã mở. Mobile dùng bảng ở đáy màn hình; desktop ở cạnh phải. Màu sử dụng biến theme của IChing.

Provider gắn theo dữ liệu quẻ và tài khoản. Đổi quẻ/tài khoản sẽ đóng căn cứ, hủy request AI đang chạy và không lưu câu trả lời cũ sang quẻ mới. Một request lock ngăn bấm lặp gây trùng yêu cầu trong cùng panel.

## Kiểm tra

```sh
npm run test:evidence --prefix iching
npm run build:iching
npm run lint:iching
```

Kiểm thử trình duyệt đã thực hiện bằng API mô phỏng: SSE → luận có căn cứ → mở tab bảng → highlight/focus → hỏi tiếp → lưu hội thoại mã hóa → reload lịch sử; Mai Hoa mobile; lịch sử Markdown cũ; hủy khi đổi phương pháp. Chưa gọi provider AI thật hoặc triển khai production.
