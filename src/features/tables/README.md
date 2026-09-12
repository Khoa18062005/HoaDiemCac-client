# Module: src/features/tables/

## 1. Mục đích
Quản trị sơ đồ bàn ăn và vòng đời bảo mật của mã QR động (Dynamic Session Token).

## 2. Danh sách các file cần có:
- 📄 `api/tableApi.js`: API lấy danh sách bàn (`GET /tables`), tạo mã QR động mới (`POST /tables/{id}/generate-qr`), và thu hồi mã QR khi đóng bàn (`POST /tables/{id}/revoke-qr`).
- 📄 `components/TableGrid.jsx`: Sơ đồ trực quan các bàn theo 3 trạng thái màu sắc: Trống (Xanh lá), Đang có khách (Đỏ), Đang dọn dẹp (Vàng).
- 📄 `components/QrCodeModal.jsx`: Hộp thoại tạo và tải ảnh mã QR chứa Dynamic Session Token (UUID v4 + băm) dán tại bàn.
- 📄 `index.js`: Barrel export module tables.
