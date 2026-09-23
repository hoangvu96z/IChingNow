# An lá số v11

Nguồn: `tu-vi-an-so-v11.js` do người dùng cung cấp. Bản nguyên văn nằm tại `test/fixtures/tuvi-v11-user.cjs`; core ESM `src/utils/tuViEngineV11.js` chỉ đổi phần export. Adapter ghi `engineVersion: user-v11`.

## Thay đổi từ v8

- Cân lượng từ năm, tháng, ngày âm lịch và giờ sinh.
- Tuổi âm, cung Tiểu hạn và 12 nhãn cung lưu niên đại hạn.
- Cung gốc luôn tiến theo chiều Địa Chi, chỉ Đại hạn đổi chiều theo Âm Dương Nam Nữ. Thay đổi này ảnh hưởng cả dữ liệu cung cho luận đoán và AI.

Adapter ánh xạ `lunarYear` sang `namSinh`, `viewYear` sang `namXem`. Chỉ truyền năm sinh vào nhánh tính hạn khi có năm xem cụ thể, tránh fallback phụ thuộc ngày hiện tại trong nguồn. Năm xem trước năm sinh bị từ chối. Khi chỉ có Can/Chi năm xem ở dữ liệu cũ, các sao lưu niên vẫn có nhưng tuổi/Tiểu hạn chưa có. Lá số lịch sử đã lưu không bị tự an lại.

## Giao diện và dữ liệu

Cân lượng, tuổi âm và Tiểu hạn có trong tổng quan, giữa lá số và bản xuất ảnh. Mỗi cung hiển thị Tiểu hạn và nhãn LN. khi có. Dùng các biến màu chung cho sáng/tối, nhãn có chữ và không chỉ dựa vào màu. Trường hợp tuổi chưa nằm trong Đại hạn của nguồn, UI giải thích vì sao chưa có nhãn LN.

Prompt sao chép/AI chứa dữ liệu mới; đã bỏ giới hạn cũ “chỉ 5 sao lưu niên”. Danh mục căn cứ AI có Tiểu hạn và cung lưu niên. Luận đoán miễn phí tiếp tục dùng đúng file luận đoán v5 đã được cung cấp; không tự thêm lời giải nghĩa Cân lượng hoặc các công thức luận mới.

## Kiểm tra

22 bài kiểm thử và build thành công. Đối chiếu nguyên văn phần tính toán, 5.400 lá số cơ bản, 60 năm lưu niên, 1.440 tổ hợp giới tính/tuổi ở ranh giới Đại hạn, cùng kiểm tra render nhãn và tổng quan. Chưa kiểm tra trực quan bằng trình duyệt hoặc triển khai production trong lần cập nhật này.
