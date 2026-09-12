# Thư mục: src/config/

## 1. Mục đích
Quản lý tập trung các cấu hình môi trường và các hằng số tĩnh nghiệp vụ của toàn bộ ứng dụng.

## 2. Danh sách các file cần có:

### 📄 `env.js`
- **Mục đích:** Đọc và kiểm tra tính hợp lệ của các biến môi trường từ `import.meta.env`.
- **Hằng số xuất ra:** `API_BASE_URL`, `WS_URL`, `CALL_STAFF_COOLDOWN` (30.000 ms).

### 📄 `constants.js`
- **Mục đích:** Khai báo các Enum nghiệp vụ nhằm chuẩn hóa dữ liệu, loại bỏ Magic Strings.
- **Các Enum cốt lõi:**
  - `ORDER_STATUS`: `{ PENDING: 'PENDING', COOKING: 'COOKING', SERVED: 'SERVED', CANCELLED: 'CANCELLED' }`
  - `TABLE_STATUS`: `{ AVAILABLE: 'AVAILABLE', OCCUPIED: 'OCCUPIED', CLEANING: 'CLEANING' }`
  - `PAYMENT_METHOD`: `{ CASH: 'CASH', VIETQR: 'VIETQR' }`
  - `USER_ROLE`: `{ ADMIN: 'ROLE_ADMIN', STAFF: 'ROLE_STAFF', KITCHEN: 'ROLE_KITCHEN' }`
