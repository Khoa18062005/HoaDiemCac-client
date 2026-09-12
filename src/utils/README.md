# Thư mục: src/utils/ (Hàm Tiện Ích & Ràng Buộc)

## 1. Mục đích
Chứa các hàm thuần túy (Pure Functions) phục vụ định dạng và kiểm tra tính hợp lệ của dữ liệu. Cực kỳ thuận lợi để viết Unit Test trong môn Kiểm thử phần mềm.

## 2. Danh sách các file JS cần có:

### 📄 `formatters.js`
- **Mục đích:** Định dạng dữ liệu hiển thị.
- **Các hàm:**
  - `formatCurrencyVND(amount)`: Chuyển số `150000` -> `"150.000 ₫"`.
  - `formatDateTime(isoString)`: Chuyển chuỗi ISO sang giờ Việt Nam (`HH:mm DD/MM/YYYY`).
  - `formatWaitTime(minutes)`: Định dạng chuỗi hiển thị thời gian chờ món tại bếp.

### 📄 `validators.js`
- **Mục đích:** Kiểm tra tính hợp lệ của dữ liệu đầu vào.
- **Các hàm:**
  - `isValidQuantity(qty)`: Kiểm tra số lượng món phải là số nguyên trong khoảng $1 \le qty \le 99$.
  - `isValidSessionToken(token)`: Kiểm tra định dạng mã phiên bàn UUID v4.
