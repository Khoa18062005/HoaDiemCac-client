export const ACTIVE_PAYMENT_FLOW_KEY = 'hoadiemcat_active_payment_flow';

/**
 * Đọc tiến trình thanh toán đang dở dang (nếu có) từ localStorage
 */
export function getActivePaymentFlow() {
  try {
    const raw = localStorage.getItem(ACTIVE_PAYMENT_FLOW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.tableId || parsed.tableNumber)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Lỗi đọc active payment flow từ localStorage:', e);
  }
  return null;
}

/**
 * Lưu / cập nhật tiến trình thanh toán vào localStorage để bảo toàn khi F5 tải lại trang
 */
export function saveActivePaymentFlow(data) {
  try {
    if (!data) {
      localStorage.removeItem(ACTIVE_PAYMENT_FLOW_KEY);
      return;
    }
    const current = getActivePaymentFlow() || {};
    const merged = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };
    localStorage.setItem(ACTIVE_PAYMENT_FLOW_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Lỗi lưu active payment flow vào localStorage:', e);
  }
}

/**
 * Xóa tiến trình thanh toán khỏi localStorage khi hoàn tất hoặc hủy bỏ
 */
export function clearActivePaymentFlow() {
  try {
    localStorage.removeItem(ACTIVE_PAYMENT_FLOW_KEY);
  } catch (e) {
    console.warn('Lỗi xóa active payment flow:', e);
  }
}
