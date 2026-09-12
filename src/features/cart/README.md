# Module: src/features/cart/

## 1. Mục đích
Xử lý toàn bộ nghiệp vụ Giỏ hàng dùng chung theo thời gian thực (Collaborative Realtime Cart).

## 2. Danh sách các file cần có:
- 📄 `api/cartApi.js`: API lấy dữ liệu giỏ hàng theo bàn (`GET /cart`), cập nhật số lượng món (`PUT /cart/items`), và gửi đơn vào bếp (`POST /cart/submit`).
- 📄 `components/CartItem.jsx`: Dòng hiển thị từng món trong giỏ kèm bộ điều khiển tăng giảm số lượng ($1 \le N \le 99$) và nút xóa.
- 📄 `components/CartDrawer.jsx`: Ngăn kéo trượt từ dưới lên (Bottom Sheet) hiển thị danh sách món đã chọn và tổng tiền tạm tính.
- 📄 `components/CartFloatingButton.jsx`: Nút tròn nổi góc dưới màn hình hiển thị tổng số món và tổng tiền tạm tính.
- 📄 `hooks/useCartSync.js`: Custom Hook kết nối WebSocket STOMP kênh `/topic/table/{sessionToken}/cart`, đồng bộ tức thì thao tác giỏ hàng của tất cả mọi người tại cùng một bàn (<300ms).
- 📄 `index.js`: Barrel export module cart.
