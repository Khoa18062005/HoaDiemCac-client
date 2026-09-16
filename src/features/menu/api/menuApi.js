import apiClient from '@/lib/axios';

/**
 * Menu API Service kết nối backend Spring Boot Hỏa Diệm Các.
 * Cung cấp các thao tác truy vấn thực đơn từ Database, danh mục và cập nhật trạng thái phục vụ.
 */
export const menuApi = {
  // ==========================================
  // MÓN ĂN (MENU ITEMS)
  // ==========================================

  /**
   * Lấy toàn bộ danh sách món ăn từ Database
   * @returns {Promise<Array>} Danh sách các MenuItemResponse
   */
  getMenuItems: async () => {
    const data = await apiClient.get('/menu-items');
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

  /**
   * Tạo mới món ăn và lưu vào Database
   * @param {Object} itemData - Thông tin món ăn kèm link CDN
   * @returns {Promise<Object>} MenuItemResponse vừa tạo
   */
  createMenuItem: async (itemData) => {
    return await apiClient.post('/menu-items', itemData);
  },

  /**
   * Cập nhật thông tin món ăn và link CDN ảnh trong Database
   * @param {number|string} id - ID món ăn
   * @param {Object} itemData - Dữ liệu cập nhật
   * @returns {Promise<Object>} MenuItemResponse sau khi cập nhật
   */
  updateMenuItem: async (id, itemData) => {
    return await apiClient.put(`/menu-items/${id}`, itemData);
  },

  /**
   * Xóa mềm món ăn khỏi Database thực đơn
   * @param {number|string} id - ID món ăn
   */
  deleteMenuItem: async (id) => {
    return await apiClient.delete(`/menu-items/${id}`);
  },

  // ==========================================
  // DANH MỤC (CATEGORIES)
  // ==========================================

  /**
   * Lấy danh sách nhóm danh mục món ăn từ Database
   * @returns {Promise<Array>} Danh sách các CategoryResponse
   */
  getCategories: async () => {
    const data = await apiClient.get('/menu-items/categories');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Tạo mới danh mục món ăn
   * @param {Object} categoryData - { name, slug, description, displayOrder, isActive }
   * @returns {Promise<Object>} Category vừa tạo
   */
  createCategory: async (categoryData) => {
    return await apiClient.post('/menu-items/categories', categoryData);
  },

  /**
   * Cập nhật thông tin danh mục món ăn
   * @param {number|string} id - ID danh mục
   * @param {Object} categoryData - { name, slug, description, displayOrder, isActive }
   * @returns {Promise<Object>} Category sau khi cập nhật
   */
  updateCategory: async (id, categoryData) => {
    return await apiClient.put(`/menu-items/categories/${id}`, categoryData);
  },

  /**
   * Xóa danh mục món ăn
   * @param {number|string} id - ID danh mục
   */
  deleteCategory: async (id) => {
    return await apiClient.delete(`/menu-items/categories/${id}`);
  },

  /**
   * Bật/Tắt trạng thái hiển thị của danh mục món ăn
   * @param {number|string} id - ID danh mục
   * @returns {Promise<Object>} Category sau khi cập nhật
   */
  toggleCategoryStatus: async (id) => {
    return await apiClient.patch(`/menu-items/categories/${id}/toggle-status`);
  },
};

export default menuApi;
