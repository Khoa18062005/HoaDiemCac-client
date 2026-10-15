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

/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không phân biệt dấu.
 * Ví dụ: "Lẩu Cay Tê" -> "lau cay te", "Đĩa Ba Chỉ" -> "dia ba chi"
 */
export function removeVietnameseTones(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra xem chuỗi text có khớp với từ khóa tìm kiếm query hay không,
 * hỗ trợ:
 * 1. Khớp nguyên bản có dấu (case-insensitive)
 * 2. Khớp tiếng Việt không dấu (gõ "lau cay" tìm ra "Lẩu Cay")
 * 3. Khớp các từ phân tách bởi khoảng trắng (gõ "bo a5" tìm ra "Bò Wagyu A5")
 */
export function matchesVietnameseSearch(text, query) {
  if (!query || !query.trim()) return true;
  if (!text) return false;

  const lowerText = text.toString().toLowerCase();
  const lowerQuery = query.toString().toLowerCase().trim();

  // 1. Khớp có dấu trực tiếp
  if (lowerText.includes(lowerQuery)) return true;

  // 2. Khớp không dấu
  const rawText = removeVietnameseTones(text.toString());
  const rawQuery = removeVietnameseTones(query.toString());

  if (!rawQuery) return true;
  if (rawText.includes(rawQuery)) return true;

  // 3. Khớp từng từ khóa nếu gõ nhiều từ cách nhau bởi khoảng trắng
  const words = rawQuery.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.every((w) => rawText.includes(w));
  }

  return false;
}

