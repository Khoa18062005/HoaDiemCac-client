# Module: src/features/auth/

## 1. Mục đích
Quản lý toàn bộ nghiệp vụ xác thực tài khoản quản trị viên và nhân viên.

## 2. Danh sách các file cần có:
- 📄 `api/authApi.js`: Các hàm gọi API `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`.
- 📄 `components/LoginForm.jsx`: Form nhập username/password kèm validate dữ liệu trước khi gửi API.
- 📄 `index.js`: Public API (Barrel export) xuất khẩu các thành phần dùng chung của module ra bên ngoài.
