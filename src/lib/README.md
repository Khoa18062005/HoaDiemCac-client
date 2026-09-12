# Thư mục: src/lib/

## 1. Mục đích
Khởi tạo và cấu hình các thư viện bên thứ ba (Third-party clients) phục vụ giao tiếp mạng và thời gian thực.

## 2. Danh sách các file cần có:

### 📄 `axios.js`
- **Mục đích:** Cấu hình instance Axios tập trung.
- **Tính năng:**
  - `baseURL` lấy từ biến môi trường.
  - **Request Interceptor:** Tự động gắn `Authorization: Bearer <token>` (nếu có từ Auth Store) và header `X-Table-Session` (mã phiên bàn).
  - **Response Interceptor:** Bắt lỗi 401 tự động chuyển về `/login`, chuẩn hóa dữ liệu trả về `response.data`.

### 📄 `websocket.js`
- **Mục đích:** Quản lý kết nối giao thức WebSocket STOMP (Spring Boot WebSocket) qua SockJS.
- **Hàm cung cấp:**
  - `connectWebSocket(onConnected, onError)`: Khởi tạo STOMP client và tự động kết nối lại khi đứt mạng.
  - `subscribeTopic(topic, callback)`: Lắng nghe kênh cụ thể (`/topic/table/{tableId}/cart`, `/topic/kitchen/orders`).
  - `sendMessage(destination, body)`: Gửi payload lên STOMP broker.
