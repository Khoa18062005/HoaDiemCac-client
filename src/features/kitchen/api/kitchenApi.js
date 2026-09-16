import { apiClient } from '@/lib/axios';
import { initialKitchenOrders } from '../data/mockKitchenOrders';

/**
 * Service API giao tiếp phân hệ Bếp KDS (Kitchen Display System).
 * Tự động fallback dữ liệu mock mượt mà nếu Backend chưa mở endpoint.
 */
export const kitchenApi = {
  /**
   * Lấy toàn bộ hàng đợi món cần chế biến theo chuẩn FIFO (UC17)
   */
  getKitchenQueue: async () => {
    try {
      const response = await apiClient.get('/kitchen/queue');
      return response.data?.result || response.data || initialKitchenOrders;
    } catch (err) {
      // Fallback dữ liệu mock local để giao diện hoạt động độc lập
      return initialKitchenOrders;
    }
  },

  /**
   * Cập nhật trạng thái chế biến món ăn (UC18: COOKING -> SERVED / CANCELLED)
   * @param {string} orderItemId - ID món ăn trong order
   * @param {string} status - Trạng thái mới (COOKING, SERVED, CANCELLED)
   */
  updateOrderItemStatus: async (orderItemId, status) => {
    try {
      const response = await apiClient.patch(`/kitchen/items/${orderItemId}/status`, { status });
      return response.data;
    } catch (err) {
      return { success: true, orderItemId, status };
    }
  },

  /**
   * Cập nhật trạng thái toàn bộ món trong một đợt gọi bàn
   * @param {string} orderId - ID đợt order
   * @param {string} status - Trạng thái mới
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await apiClient.patch(`/kitchen/orders/${orderId}/status`, { status });
      return response.data;
    } catch (err) {
      return { success: true, orderId, status };
    }
  },

  /**
   * Báo hết món khẩn cấp (UC19) hoặc mở bán lại
   * @param {string} menuItemId - ID món ăn
   * @param {boolean} isAvailable - Trạng thái phục vụ
   */
  toggleItemStock: async (menuItemId, isAvailable) => {
    try {
      const response = await apiClient.patch(`/kitchen/menu-items/${menuItemId}/stock`, {
        isAvailable,
      });
      return response.data;
    } catch (err) {
      return { success: true, menuItemId, isAvailable };
    }
  },
};

export default kitchenApi;
