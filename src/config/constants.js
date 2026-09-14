/**
 * Hệ thống hằng số và Enum chuẩn hóa toàn bộ dự án Frontend Hỏa Diệm Các.
 * Khớp 100% với các Enums tại Backend (com.hoadiemcat.entity.enums).
 */

/**
 * Trạng thái bàn ăn theo Quy định QĐ7
 */
export const TABLE_STATUS = {
  AVAILABLE: 'AVAILABLE', // Bàn trống
  OCCUPIED: 'OCCUPIED',   // Đang có khách
  CLEANING: 'CLEANING',   // Đang dọn dẹp
};

/**
 * Phân khu vực bàn ăn
 */
export const TABLE_AREA = {
  COMMON: 'COMMON', // Sảnh chung (B01 - B10)
  VIP: 'VIP',       // Phòng VIP Hoàng Gia (VIP11 - VIP20)
};

/**
 * Trạng thái của một đợt gọi món (Order Round) gửi bếp (UC05)
 */
export const ORDER_STATUS = {
  PENDING: 'PENDING',     // Chờ tiếp nhận
  COOKING: 'COOKING',     // Đang chuẩn bị
  COMPLETED: 'COMPLETED', // Đã hoàn thành đợt
  CANCELLED: 'CANCELLED', // Đã hủy
};

/**
 * Trạng thái tiến độ chế biến từng món ăn theo Quy định QĐ8
 */
export const ORDER_ITEM_STATUS = {
  COOKING: 'COOKING',     // Đang chuẩn bị / Đang nấu (UC17)
  SERVED: 'SERVED',       // Đã phục vụ ra bàn (UC18)
  CANCELLED: 'CANCELLED', // Đã hủy món (UC13)
};

/**
 * Phương thức thanh toán hóa đơn (UC30, UC31)
 */
export const PAYMENT_METHOD = {
  CASH: 'CASH',     // Tiền mặt
  VIETQR: 'VIETQR', // Chuyển khoản VietQR Napas247
};

/**
 * Trạng thái thanh toán hóa đơn
 */
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',     // Chờ thanh toán
  PAID: 'PAID',           // Đã thanh toán
  CANCELLED: 'CANCELLED', // Đã hủy
  FAILED: 'FAILED',       // Thất bại
};

/**
 * Loại chuông gọi phục vụ / yêu cầu hỗ trợ từ khách (UC07, UC08)
 */
export const CALL_STAFF_TYPE = {
  CALL_STAFF: 'CALL_STAFF',           // Gọi chung
  PAYMENT_REQUEST: 'PAYMENT_REQUEST', // Yêu cầu tính tiền
  ICE_WATER: 'ICE_WATER',             // Thêm đá / nước
  UTENSILS: 'UTENSILS',               // Thêm chén đũa
  OTHER: 'OTHER',                     // Hỗ trợ khác
};

/**
 * Trạng thái xử lý chuông gọi nhân viên (UC14)
 */
export const CALL_STAFF_STATUS = {
  PENDING: 'PENDING',   // Chờ xử lý
  RESOLVED: 'RESOLVED', // Đã xử lý xong
  CANCELLED: 'CANCELLED',
};

/**
 * Phân quyền tài khoản trong hệ thống quản trị (UC09)
 */
export const USER_ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  KITCHEN: 'KITCHEN',
  STAFF: 'STAFF',
  USER: 'USER',
};

/**
 * Mã phản hồi chuẩn từ Backend ApiResponse<T>
 */
export const API_RESPONSE_CODE = {
  SUCCESS: 1000,
};

/**
 * Ràng buộc số lượng món ăn theo Quy định QĐ9
 */
export const ORDER_QUANTITY_LIMIT = {
  MIN: 1,
  MAX: 99,
};

/**
 * Tên Header chuẩn để gửi Token phiên bàn ăn lên Backend
 */
export const TABLE_SESSION_HEADER = 'X-Table-Session-Token';
