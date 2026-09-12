# Thư mục: src/layouts/ (Khung Giao Diện Cố Định)

## 1. Mục đích
Chứa các bộ khung vỏ bọc (Layout Shells) cố định cấu trúc trang web, bao bọc nội dung thay đổi thông qua thẻ `<Outlet />` của React Router. Giúp duy trì Header/Sidebar không bị load lại (re-mount) khi chuyển trang.

## 2. Danh sách các file JSX cần có:

### 📄 `CustomerLayout.jsx`
- **Mục đích:** Khung hiển thị tối ưu cho khách hàng quét mã tại bàn trên thiết bị di động.
- **Cấu trúc:** Cố định `<CustomerHeader />` phía trên, vùng nội dung cuộn `<Outlet />` ở giữa, và nút giỏ hàng nổi `<CartFloatingButton />` cố định góc dưới.

### 📄 `KitchenLayout.jsx`
- **Mục đích:** Khung toàn màn hình chuyên dụng cho nhà bếp (màn hình ngang Tablet hoặc Smart TV).
- **Cấu trúc:** Theme tối (Dark mode) giảm mỏi mắt, cố định `<KitchenHeader />` và vùng hiển thị lưới thẻ đơn món `<Outlet />`.

### 📄 `AdminLayout.jsx`
- **Mục đích:** Khung quản trị 2 cột tiêu chuẩn cho máy tính để bàn (Desktop).
- **Cấu trúc:** Cột trái là `<AdminSidebar />`, cột phải gồm `<AdminHeader />` ở trên và vùng nội dung quản trị `<Outlet />` bên dưới.
