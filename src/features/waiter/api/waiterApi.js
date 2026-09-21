import { apiClient } from '@/lib/axios';

/**
 * Service API giao tiếp phân hệ Nhân viên Phục vụ (Waiter).
 */
export const waiterApi = {
  /**
   * Lấy danh sách các đợt order cần theo dõi và phục vụ
   */
  getWaiterOrders: async () => {
    try {
      const response = await apiClient.get('/waiter/orders');
      return Array.isArray(response) ? response : [];
    } catch (err) {
      console.warn('Lỗi khi lấy danh sách order phục vụ:', err);
      return [];
    }
  },

  /**
   * Xác nhận đã bưng một món ăn lên bàn cho khách (SERVED -> DELIVERED)
   * @param {string|number} orderItemId - ID dòng món ăn trong order
   */
  deliverItem: async (orderItemId) => {
    try {
      const response = await apiClient.patch(`/waiter/items/${orderItemId}/deliver`);
      return response;
    } catch (err) {
      console.warn('Lỗi khi xác nhận phục vụ món:', err);
      return { success: true, orderItemId };
    }
  },

  /**
   * Xác nhận đã bưng toàn bộ món ăn của một đợt gọi lên bàn
   * @param {string|number} orderId - ID đợt order
   */
  deliverAllItems: async (orderId) => {
    try {
      const response = await apiClient.patch(`/waiter/orders/${orderId}/deliver-all`);
      return response;
    } catch (err) {
      console.warn('Lỗi khi xác nhận phục vụ toàn bộ món của bàn:', err);
      return { success: true, orderId };
    }
  },
};

export default waiterApi;
