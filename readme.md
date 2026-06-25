# 易 IChingNow — Webapp Lập Quẻ Kinh Dịch

Công cụ lập quẻ / gieo quẻ Kinh Dịch theo phương pháp 3 đồng xu. Chỉ lập quẻ — không luận giải.

## Tính năng

- **Gieo nhanh**: Bấm 1 nút → random đủ 6 hào theo xác suất 3 đồng xu
- **Gieo từng hào**: Stepper 6 bước, mỗi bước tung xu hoặc nhập tay
- Hiển thị quẻ chủ + quẻ biến (khi có hào động)
- Bảng chi tiết 6 hào: âm/dương, loại hào, hào động, đồng xu
- Metadata: việc cần xem, ngày/giờ, tiết khí, động tâm
- Xuất plaintext → copy hoặc download `.txt`
- Xuất JSON → copy hoặc download `.json`

## Cài đặt & Chạy

```bash
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

## Công nghệ

- React 18 + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Vanilla CSS (animations, tokens)

## Kiến trúc

```
src/
  components/       # UI components
  data/             # 64 quẻ, địa chi, tiết khí
  logic/            # Thuật toán gieo quẻ, build kết quả, clipboard
  App.jsx           # Root component
  index.css         # Global styles
```

## Phương pháp 3 đồng xu

| Tổng | Tên     | Ký hiệu     |
|------|---------|-------------|
| 6    | Lão âm  | ═══ x ═══  |
| 7    | Thiếu dương | ═══════ |
| 8    | Thiếu âm  | ═══   ═══ |
| 9    | Lão dương | ═══○═══   |

Ngửa = 3 điểm, Sấp = 2 điểm. Hào 6 (lão âm) và hào 9 (lão dương) là **hào động**.
