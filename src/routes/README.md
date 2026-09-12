# Thư mục: src/routes/ (Cấu hình Định Tuyến)

## 1. Mục đích
Quản lý cây định tuyến URL toàn ứng dụng bằng React Router, kết hợp phân quyền bảo vệ tuyến đường.

## 2. Danh sách các file JSX cần có:

### 📄 `index.jsx`
- **Mục đích:** Định nghĩa cây Route thông qua `createBrowserRouter`.
- **Cấu trúc tuyến đường:**
  - Nhánh khách tại bàn: `/table/:token` -> `<CustomerLayout />` (MenuPage, CartPage, OrderStatusPage).
  - Nhánh bếp: `/kitchen` -> `<KitchenLayout />` (KitchenKdsPage - bọc bởi `<ProtectedRoute />`).
  - Nhánh quản trị: `/admin` -> `<AdminLayout />` (DashboardPage, TableManagePage, MenuManagePage - bọc bởi `<ProtectedRoute />`).
  - Tuyến đăng nhập: `/login` -> LoginPage.
  - Tuyến fallback: `*` -> NotFoundPage.

### 📄 `ProtectedRoute.jsx`
- **Mục đích:** Component bảo vệ: Kiểm tra Access Token và quyền hạn (`roles`) từ `useAuthStore`. Nếu chưa đăng nhập hoặc không đủ quyền, tự động chuyển hướng về `/login`.
