# Thư mục: src/stores/ (Quản Lý Trạng Thái Toàn Cục)

## 1. Mục đích
Chứa các Global State Store được xây dựng bằng Zustand (siêu nhẹ, tối ưu re-render).

## 2. Danh sách các file JS cần có:

### 📄 `useCartStore.js`
- **Mục đích:** Quản lý giỏ hàng tại bàn.
- **State & Actions:** `items`, `addItem(item)`, `removeItem(id)`, `updateQuantity(id, qty)` (ràng buộc $1 \le N \le 99$), `clearCart()`, `getTotalPrice()`.

### 📄 `useAuthStore.js`
- **Mục đích:** Quản lý phiên đăng nhập nội bộ (User info, JWT Token, Roles, hàm `login()`, `logout()`).

### 📄 `useTableSessionStore.js`
- **Mục đích:** Lưu trữ mã phiên bàn (`sessionToken`) và số bàn được parse từ URL khi quét mã QR.
