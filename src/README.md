# Thư mục: src/ (Mã nguồn chính)

## 1. Mục đích
Điểm vào khởi tạo ứng dụng React và bọc các Providers cấp cao nhất.

## 2. Danh sách các file cần có:

### 📄 `main.jsx`
- **Mục đích:** Bootstrap Entry Point của ứng dụng.
- **Nội dung:** Khởi tạo React 19 root thông qua `createRoot(document.getElementById('root'))`, nạp file CSS toàn cục `index.css`, và render component gốc `<App />` trong `<React.StrictMode>`.

### 📄 `App.jsx`
- **Mục đích:** Root Component bao bọc các Providers dùng chung.
- **Nội dung:** Bọc `<RouterProvider router={router} />`, `<ToastContainer />` thông báo nổi, và thiết lập các Provider trạng thái toàn cục.

### 📄 `index.css`
- **Mục đích:** File CSS toàn cục chính.
- **Nội dung:** Khai báo chỉ thị nạp Tailwind CSS (`@import "tailwindcss";`), thiết lập font chữ mặc định (Inter), tối ưu hóa thanh cuộn trên thiết bị di động.

### 📄 `App.css`
- **Mục đích:** Chứa các style CSS tùy biến riêng cho hiệu ứng chuyển động (animations, keyframes chuông rung khi gọi nhân viên).
