# Module: src/features/payment/

## 1. Mục đích
Xử lý yêu cầu thanh toán hóa đơn bằng tiền mặt hoặc quét mã chuyển khoản VietQR tự động.

## 2. Danh sách các file cần có:
- 📄 `api/paymentApi.js`: API gửi yêu cầu thanh toán (`POST /payment/request`), API lấy thông tin VietQR động (`GET /payment/vietqr`).
- 📄 `components/VietQrModal.jsx`: Hộp thoại hiển thị mã VietQR động chuẩn Napas247 kèm số tiền chính xác và nội dung chuyển khoản tự động đối soát.
- 📄 `index.js`: Barrel export module payment.
