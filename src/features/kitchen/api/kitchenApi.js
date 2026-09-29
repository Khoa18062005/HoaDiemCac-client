import { apiClient } from '@/lib/axios';

/**
 * Service API giao tiếp phân hệ Bếp KDS (Kitchen Display System).
 */
export const kitchenApi = {
  /**
   * Lấy toàn bộ hàng đợi món cần chế biến theo chuẩn FIFO (UC17)
   */
  getKitchenQueue: async () => {
    try {
      const response = await apiClient.get('/kitchen/queue');
      return Array.isArray(response) ? response : (response?.data?.result || response?.data || response?.result || []);
    } catch (err) {
      console.warn('Lỗi khi tải hàng đợi bếp từ server:', err);
      return [];
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
      return response;
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
      return response;
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
      return response;
    } catch (err) {
      return { success: true, menuItemId, isAvailable };
    }
  },

  /**
   * Báo hết món khẩn cấp từ Bếp KDS (UC19): Khóa món trên thực đơn (SOLD OUT) & tự động xóa món khỏi đơn các bàn đang đặt
   * @param {Object} params
   * @param {number|string} params.orderItemId - ID món trong order (nếu ấn từ thẻ bàn)
   * @param {number|string} params.menuItemId - ID món ăn trên thực đơn
   * @param {string} params.reason - Lý do hết món
   */
  reportOutOfStock: async ({ orderItemId, menuItemId, reason = 'Bếp trưởng báo hết nguyên liệu' }) => {
    try {
      const response = await apiClient.post('/kitchen/out-of-stock', {
        orderItemId,
        menuItemId,
        reason,
      });
      return response?.data || response;
    } catch (err) {
      console.warn('Lỗi khi gọi API báo hết món:', err);
      return { success: false, error: err };
    }
  },

  /**
   * Mở bán lại món ăn (Restock) từ Bếp KDS (UC19)
   * @param {number|string} menuItemId - ID món ăn trên thực đơn
   */
  restockItem: async (menuItemId) => {
    try {
      const response = await apiClient.post('/kitchen/restock', { menuItemId });
      return response?.data || response;
    } catch (err) {
      console.warn('Lỗi khi mở bán lại món:', err);
      return { success: false, error: err };
    }
  },
};

export default kitchenApi;
