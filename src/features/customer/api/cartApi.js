import { apiClient } from '@/lib/axios';

/**
 * Service API giao tiếp nghiệp vụ giỏ hàng cộng tác theo thời gian thực (UC04).
 */
export const cartApi = {
  /**
   * Lấy giỏ hàng nháp hiện tại của bàn từ server (UC04)
   * @param {string} tableNumber
   */
  getCart: async (tableNumber) => {
    try {
      const response = await apiClient.get(`/customer/cart/${encodeURIComponent(tableNumber)}`);
      return Array.isArray(response) ? response : (response?.result || []);
    } catch (err) {
      console.warn('Lỗi khi lấy giỏ hàng từ server:', err);
      return [];
    }
  },

  /**
   * Cập nhật danh sách món trong giỏ hàng chung của bàn (UC04)
   * Server sẽ lưu vào MySQL và broadcast WebSocket tới các thiết bị cùng bàn
   * @param {string} tableNumber
   * @param {Array} items
   */
  updateCart: async (tableNumber, items) => {
    try {
      const payload = (items || []).map((item) => ({
        menuItemId: typeof item.id === 'number' ? item.id : (item.numericId || null),
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        note: item.note || '',
        image: item.image,
        unit: item.unit,
      }));
      const response = await apiClient.put(`/customer/cart/${encodeURIComponent(tableNumber)}`, payload);
      return Array.isArray(response) ? response : (response?.result || items);
    } catch (err) {
      console.warn('Lỗi khi đồng bộ giỏ hàng lên server:', err);
      return items;
    }
  },

  /**
   * Làm rỗng giỏ hàng nháp của bàn (UC04, UC05)
   * @param {string} tableNumber
   */
  clearCart: async (tableNumber) => {
    try {
      await apiClient.delete(`/customer/cart/${encodeURIComponent(tableNumber)}`);
    } catch (err) {
      console.warn('Lỗi khi xóa giỏ hàng trên server:', err);
    }
  },
};

export default cartApi;
