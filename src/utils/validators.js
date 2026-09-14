import { ORDER_QUANTITY_LIMIT } from '../config/constants';

/**
 * Các hàm xác thực dữ liệu đầu vào cho ứng dụng Client.
 */

/**
 * Kiểm tra số lượng món ăn có nằm trong khoảng hợp lệ theo Quy định QĐ9 (1 <= N <= 99)
 */
export function isValidQuantity(quantity) {
  const num = Number(quantity);
  return Number.isInteger(num) && num >= ORDER_QUANTITY_LIMIT.MIN && num <= ORDER_QUANTITY_LIMIT.MAX;
}

/**
 * Kẹp giá trị số lượng vào khoảng hợp lệ [MIN, MAX]
 */
export function clampQuantity(quantity) {
  const num = parseInt(quantity, 10);
  if (isNaN(num) || num < ORDER_QUANTITY_LIMIT.MIN) {
    return ORDER_QUANTITY_LIMIT.MIN;
  }
  if (num > ORDER_QUANTITY_LIMIT.MAX) {
    return ORDER_QUANTITY_LIMIT.MAX;
  }
  return num;
}

/**
 * Kiểm tra token phiên bàn ăn có định dạng chuỗi hợp lệ không
 */
export function isValidSessionToken(token) {
  return typeof token === 'string' && token.trim().length >= 8;
}
