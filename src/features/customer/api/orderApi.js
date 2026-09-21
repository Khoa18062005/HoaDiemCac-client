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
      const response = await apiClient.get(`/customer/orders/${tableNumber}`);
      return Array.isArray(response) ? response : [];
    } catch (err) {
      console.warn('Lỗi khi lấy danh sách order của bàn:', err);
      return [];
    }
  },
};

export default orderApi;
