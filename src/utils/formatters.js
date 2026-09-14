/**
 * Các hàm tiện ích định dạng dữ liệu hiển thị trên toàn bộ ứng dụng Client.
 */

/**
 * Định dạng số tiền thành chuỗi tiền tệ VND (VD: 890.000 đ)
 */
export function formatCurrencyVND(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 đ';
  }
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (VD: 14/09/2026 15:30)
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Định dạng chỉ giờ phút (VD: 15:30)
 */
export function formatTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
