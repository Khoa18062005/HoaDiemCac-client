# Thư mục: src/components/navigation/

## 1. Mục đích
Chứa các thành phần điều hướng và thanh tiêu đề (Header / Sidebar / Topbar) dùng chung, phục vụ cho từng nhóm đối tượng người dùng riêng biệt.

## 2. Danh sách các file JSX cần có:

### 📄 `CustomerHeader.jsx`
- **Mục đích:** Thanh Header cố định trên điện thoại của thực khách tại bàn.
- **Thành phần:** 
  - Hiển thị tên nhà hàng và số bàn hiện tại (ví dụ: "Bàn 04 - Tầng 1").
  - Nút **Chuông Gọi Phục Vụ**: Gửi yêu cầu gọi nhân viên kèm bộ đếm ngược 30 giây (Rate Limiting) chống spam.
  - Icon giỏ hàng kèm huy hiệu số lượng món đang chọn.

### 📄 `KitchenHeader.jsx`
- **Mục đích:** Thanh Header của màn hình Bếp KDS (Kitchen Display System).
- **Thành phần:** Đồng hồ thời gian thực (Giờ : Phút : Giây), tổng số món đang chờ trong hàng đợi FIFO, nút Bật/Tắt âm thanh chuông báo "Ting-ting".

### 📄 `AdminHeader.jsx`
- **Mục đích:** Thanh Topbar của trang quản trị.
- **Thành phần:** Thanh tìm kiếm, chuông cảnh báo sự cố từ các bàn, thông tin Admin và nút Đăng xuất (Logout).

### 📄 `AdminSidebar.jsx`
- **Mục đích:** Thanh menu bên trái giúp quản trị viên chuyển đổi linh hoạt giữa các phân hệ: Dashboard (Doanh thu), Bàn ăn & Mã QR, Thực đơn món ăn, Lịch sử hóa đơn.
