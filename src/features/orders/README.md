# Module: src/features/orders/

## 1. Mục đích
Theo dõi lịch sử gọi món theo từng đợt và kiểm tra tiến độ phục vụ từng món ăn.

## 2. Danh sách các file cần có:
- 📄 `api/orderApi.js`: API truy vấn lịch sử các đợt gọi món của bàn (`GET /orders/history`).
- 📄 `components/OrderTimeline.jsx`: Dòng thời gian hiển thị từng đợt gọi món (Đợt 1: 11h30, Đợt 2: 12h05).
- 📄 `components/OrderItemStatus.jsx`: Hiển thị trạng thái chi tiết của từng món: "Đang nấu" (⏳) hay "Đã phục vụ" (✅).
- 📄 `index.js`: Barrel export module orders.
