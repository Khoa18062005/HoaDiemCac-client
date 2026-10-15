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

/**
 * Ngăn chặn người dùng gõ ký tự chữ cái, chỉ cho phép phím số (0-9) và các phím điều khiển
 */
export function handleNumericKeyDown(e) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];
  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
    return;
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Lọc sạch mọi ký tự không phải số và giới hạn độ dài số điện thoại
 */
export function sanitizeNumericInput(val, maxLength = 10) {
  if (!val) return '';
  const digits = val.toString().replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

