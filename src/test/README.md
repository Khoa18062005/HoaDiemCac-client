# Thư mục: src/test/ (Môi Trường Kiểm Thử Tự Động)

## 1. Mục đích
Thiết lập môi trường và công cụ hỗ trợ viết Unit Test & Component Test với Vitest cho môn Kiểm thử phần mềm.

## 2. Danh sách các file cần có:

### 📄 `setup.js`
- **Mục đích:** Khởi chạy cấu hình cho Vitest, import `@testing-library/jest-dom` để sử dụng các hàm kiểm tra DOM (`toBeInTheDocument()`, `toHaveTextContent()`).

### 📄 `test-utils.jsx`
- **Mục đích:** Cung cấp hàm render tùy biến (`customRender`) bọc sẵn `BrowserRouter` và các Store cần thiết, giúp test các Component giao diện một cách nhanh chóng và độc lập.
