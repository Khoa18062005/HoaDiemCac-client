# Module: src/features/kitchen/

## 1. Mục đích
Phục vụ màn hình điều phối bếp KDS (Kitchen Display System) theo nguyên tắc FIFO (First In, First Out).

## 2. Danh sách các file cần có:
- 📄 `api/kitchenApi.js`: API lấy hàng đợi món cần nấu (`GET /kitchen/queue`), cập nhật trạng thái món (`PATCH /kitchen/items/{id}/status`), và báo hết món (`POST /kitchen/items/{id}/out-of-stock`).
- 📄 `components/KdsOrderCard.jsx`: Thẻ hiển thị đơn món gồm số bàn, tên món, ghi chú, bộ đếm thời gian chờ thực tế (chuyển đỏ nếu quá 15 phút), nút bấm một chạm đổi sang "ĐÃ XONG".
- 📄 `components/OutOfStockButton.jsx`: Nút bấm nhanh báo hết nguyên liệu để hệ thống tự động khóa món trên menu của khách.
- 📄 `hooks/useKitchenSocket.js`: Hook lắng nghe kênh WebSocket `/topic/kitchen/orders`, tự chèn order mới vào đuôi hàng đợi FIFO và phát chuông âm thanh `ting-ting.mp3`.
- 📄 `index.js`: Barrel export module kitchen.
