import { apiClient } from '@/lib/axios';

/**
 * Service API giao tiếp nghiệp vụ đặt món từ bàn khách hàng (Customer Ordering).
 */
export const orderApi = {
  /**
   * Khách hàng gửi đợt món ăn vào bếp chế biến (UC05)
   * @param {Object} orderData
   * @param {string} orderData.tableNumber - Mã bàn (VD: "B01")
   * @param {string} [orderData.sessionToken] - Token phiên bàn
   * @param {string} [orderData.note] - Ghi chú đơn
   * @param {number} [orderData.totalAmount] - Tổng tiền đợt gọi
   * @param {Array} orderData.items - Danh sách các món ăn kèm số lượng và ghi chú
   */
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/customer/orders', orderData);
      return response;
    } catch (err) {
      console.warn('Lỗi khi gửi order lên server:', err);
      throw err;
    }
  },

  /**
   * Lấy danh sách toàn bộ các đợt order của một bàn ăn (UC06)
   * @param {string} tableNumber - Mã bàn (VD: "B01")
   */
  getTableOrders: async (tableNumber) => {
    try {
      const response = await apiClient.get(`/customer/orders/${encodeURIComponent(tableNumber)}`);
      return Array.isArray(response) ? response : (response ? [response] : []);
    } catch (err) {
      console.warn('Lỗi khi lấy danh sách order của bàn:', err);
      return [];
    }
  },

  /**
   * Quản lý lấy danh sách toàn bộ các đợt order của bàn để điều chỉnh (UC13)
   * @param {string} tableIdentifier - Mã bàn hoặc ID bàn
   */
  getAdminTableOrders: async (tableIdentifier) => {
    try {
      const response = await apiClient.get(`/admin/orders/tables/${encodeURIComponent(tableIdentifier)}`);
      return Array.isArray(response) ? response : (response ? [response] : []);
    } catch (err) {
      console.warn('Lỗi khi lấy order bàn (Admin):', err);
      return [];
    }
  },

  /**
   * Quản lý sửa số lượng món ăn đã gửi bếp (UC13)
   * @param {number|string} orderItemId - ID của OrderItem
   * @param {number} quantity - Số lượng mới (1 - 99)
   */
  updateItemQuantity: async (orderItemId, quantity) => {
    return apiClient.patch(`/admin/orders/items/${orderItemId}/quantity`, { quantity });
  },

  /**
   * Quản lý sửa ghi chú món ăn đã gửi bếp (UC13)
   * @param {number|string} orderItemId - ID của OrderItem
   * @param {string} note - Ghi chú mới
   */
  updateItemNote: async (orderItemId, note) => {
    return apiClient.patch(`/admin/orders/items/${orderItemId}/note`, { note });
  },

  /**
   * Quản lý hủy/xóa món ăn khỏi order kèm lý do bắt buộc (UC13, BR13.1)
   * @param {number|string} orderItemId - ID của OrderItem
   * @param {string} reason - Lý do hủy món
   */
  cancelOrderItem: async (orderItemId, reason) => {
    return apiClient.post(`/admin/orders/items/${orderItemId}/cancel`, { reason });
  },
};

export default orderApi;
