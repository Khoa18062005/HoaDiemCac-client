# Thư mục: src/components/ui/ (Shared UI Components)

## 1. Mục đích
Chứa các UI Components cơ bản, độc lập và dùng chung cho toàn bộ các màn hình (Generic / Dumb Components), được tạo kiểu bằng Tailwind CSS.

## 2. Danh sách các file JSX cần có:

### 📄 `Button.jsx`
- **Mục đích:** Nút bấm chuẩn hóa với nhiều biến thể (`variant`: primary, secondary, outline, danger, ghost), kích cỡ (`size`: sm, md, lg), hỗ trợ trạng thái `isLoading` (hiển thị Spinner) và gắn icon Lucide.

### 📄 `Input.jsx`
- **Mục đích:** Ô nhập dữ liệu có nhãn (label), placeholder, icon tìm kiếm và thông báo lỗi validation.

### 📄 `Modal.jsx`
- **Mục đích:** Hộp thoại pop-up dùng chung, hỗ trợ đóng bằng phím ESC hoặc bấm vùng ngoài overlay, khóa cuộn trang nền.

### 📄 `Badge.jsx`
- **Mục đích:** Nhãn huy hiệu hiển thị trạng thái màu sắc: Xanh dương (Đang chờ), Vàng (Đang nấu), Xanh lá (Đã phục vụ), Đỏ (Hết món / Đang có khách).

### 📄 `Spinner.jsx`
- **Mục đích:** Vòng tròn xoay hiển thị trạng thái đang tải (Loading indicator).

### 📄 `Card.jsx`
- **Mục đích:** Khung chứa thẻ nội dung với bo góc và đổ bóng đồng bộ.
