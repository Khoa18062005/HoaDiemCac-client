import apiClient from '@/lib/axios';

/**
 * Menu API Service kết nối backend Spring Boot Hỏa Diệm Các.
 * Cung cấp các thao tác truy vấn thực đơn từ Database, danh mục và cập nhật trạng thái phục vụ.
 */
export const menuApi = {
  /**
   * Lấy toàn bộ danh sách món ăn từ Database
   * @returns {Promise<Array>} Danh sách các MenuItemResponse
   */
  getMenuItems: async () => {
    const data = await apiClient.get('/menu-items');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Lấy danh sách nhóm danh mục món ăn từ Database
   * @returns {Promise<Array>} Danh sách các CategoryResponse
   */
  getCategories: async () => {
    const data = await apiClient.get('/menu-items/categories');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Lấy chi tiết một món ăn theo ID
   * @param {number|string} id - ID món ăn
   * @returns {Promise<Object>} Chi tiết món ăn
   */
  getMenuItemDetail: async (id) => {
    return await apiClient.get(`/menu-items/${id}`);
  },

  /**
   * Bật/Tắt trạng thái phục vụ (Còn hàng / Hết hàng) của món ăn theo thời gian thực
   * @param {number|string} id - ID món ăn
   * @returns {Promise<Object>} Dữ liệu món ăn sau khi cập nhật
   */
  toggleMenuItemStatus: async (id) => {
    return await apiClient.patch(`/menu-items/${id}/toggle-status`);
  },
};

export default menuApi;
