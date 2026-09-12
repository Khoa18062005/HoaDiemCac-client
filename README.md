# Thư mục: client/ (Root Frontend)

## 1. Mục đích
Thư mục gốc của ứng dụng Frontend Client (React 19 + Vite), quản lý các cấu hình hệ thống, dependencies và scripts thực thi.

## 2. Danh sách các file cấu hình cần có:

### 📄 `package.json`
- **Mục đích:** Khai báo cấu hình dự án, scripts chạy (`dev`, `build`, `preview`, `lint`, `test`) và dependencies.
- **Thư viện chính:**
  - Core: `react` (^19.x), `react-dom` (^19.x)
  - Routing: `react-router-dom` (^7.x)
  - API & Network: `axios` (^1.x)
  - Realtime: `@stomp/stompjs` (^7.x), `sockjs-client` (^1.x)
  - State Management: `zustand` (^5.x)
  - UI Icons: `lucide-react` (^1.x), `clsx`, `tailwind-merge`
  - Testing (Môn Kiểm thử phần mềm): `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

### 📄 `vite.config.js`
- **Mục đích:** Cấu hình bộ đóng gói Vite.
- **Cấu hình:** Plugins (`@vitejs/plugin-react`, `@tailwindcss/vite`), Path Alias `@` trỏ về `./src`, proxy API sang Spring Boot (`http://localhost:8080`), môi trường test `jsdom` cho Vitest.

### 📄 `tailwind.config.js`
- **Mục đích:** Cấu hình theme giao diện phong cách nhà hàng F&B (Primary: Cam/Đỏ #EA580C; Secondary: Vàng #F59E0B; Success: Xanh lá #10B981; Dark mode cho màn hình Bếp KDS).

### 📄 `eslint.config.js`
- **Mục đích:** Chuẩn hóa quy tắc viết code, bắt lỗi React Hooks (`react-hooks/rules-of-hooks`) và cú pháp JSX.

### 📄 `index.html`
- **Mục đích:** Single Page Application HTML root. Cấu hình viewport di động chống zoom khi quét mã QR (`user-scalable=no`), mount point `<div id="root"></div>`.

### 📄 `.env.example`
- **Mục đích:** Mẫu biến môi trường: `VITE_API_BASE_URL` (API backend), `VITE_WS_URL` (WebSocket STOMP endpoint), `VITE_CALL_STAFF_RATE_LIMIT=30`.
