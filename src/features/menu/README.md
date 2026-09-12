# Module: src/features/menu/

## 1. Mục đích
Quản lý thực đơn món ăn, danh mục phân loại và hiển thị chi tiết món ăn.

## 2. Danh sách các file cần có:
- 📄 `api/menuApi.js`: Các hàm gọi API lấy danh mục món (`GET /categories`), danh sách món ăn (`GET /menu-items`), chi tiết món (`GET /menu-items/{id}`).
- 📄 `components/CategoryTabs.jsx`: Thanh cuộn ngang các danh mục món (Lẩu, Nướng, Hải sản, Tráng miệng, Đồ uống...).
- 📄 `components/FoodCard.jsx`: Thẻ hiển thị món ăn gồm ảnh, tên, giá tiền VND, nút thêm vào giỏ hàng hoặc tăng/giảm số lượng.
- 📄 `components/FoodDetailModal.jsx`: Hộp thoại xem chi tiết nguyên liệu, mô tả và ghi chú khẩu vị/dị ứng của món.
- 📄 `index.js`: Barrel export module menu.
