# Thư mục: src/features/cart/hooks/

## Danh sách các file JS cần có:
- 📄 `useCartSync.js`: Hook lắng nghe WebSocket STOMP kênh `/topic/table/{sessionToken}/cart`, đồng bộ tức thì thao tác giỏ hàng chung của tất cả thực khách cùng bàn (<300ms).
