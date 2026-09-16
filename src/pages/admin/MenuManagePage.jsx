import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, AlertCircle, Database } from 'lucide-react';
import {
  MENU_CATEGORIES,
  initialMenuItems,
  menuApi,
  AdminMenuHeader,
  MenuSummaryControlBar,
  CategoryFilterRibbon,
  MenuItemRow,
  MenuItemModal,
  CategoryModal,
  CategoryManageSection,
  KdsToastNotification,
  MenuPagination,
} from '@/features/menu';

export default function MenuManagePage() {
  // Điều hướng giữa 2 tab: 'dishes' (Quản lý món ăn) và 'categories' (Quản lý danh mục)
  const [activeTab, setActiveTab] = useState('dishes');

  // Dữ liệu Món Ăn & Danh Mục từ Database
  const [menuItems, setMenuItems] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Bộ lọc cho Món Ăn
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State Món Ăn
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Modal State Danh Mục
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Realtime Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3200);
  };

  // Hàm tải toàn bộ dữ liệu thực đơn & danh mục từ Database
  const fetchMenuData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [itemsData, catsData] = await Promise.all([
        menuApi.getMenuItems(),
        menuApi.getCategories().catch((catErr) => {
          console.warn('Lỗi tải danh mục:', catErr);
          return [];
        }),
      ]);

      if (Array.isArray(itemsData)) {
        setMenuItems(itemsData);
      }

      if (Array.isArray(catsData)) {
        setCategoryList(catsData);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực đơn từ Database:', err);
      setError(err.message || 'Không thể kết nối đến cơ sở dữ liệu');
      setMenuItems((prev) => (prev.length > 0 ? prev : initialMenuItems));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Thống kê Món Ăn
  const dishStats = useMemo(() => {
    return {
      total: menuItems.length,
      active: menuItems.filter((m) => m.isAvailable).length,
      locked: menuItems.filter((m) => !m.isAvailable).length,
    };
  }, [menuItems]);

  // Thống kê Danh Mục
  const categoryStats = useMemo(() => {
    return {
      totalCats: categoryList.length,
      activeCats: categoryList.filter((c) => c.isActive).length,
      hiddenCats: categoryList.filter((c) => !c.isActive).length,
    };
  }, [categoryList]);

  // Danh mục hiển thị trên dải Ribbon lọc món ăn
  const ribbonCategories = useMemo(() => {
    if (categoryList.length > 0) {
      return [
        { id: 'all', label: 'Tất Cả' },
        ...categoryList.map((c) => ({ id: c.slug, label: c.name })),
      ];
    }
    return MENU_CATEGORIES;
  }, [categoryList]);

  // Đếm số lượng món ăn theo từng danh mục
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    ribbonCategories.forEach((c) => {
      if (c.id !== 'all') {
        counts[c.id] = menuItems.filter((m) => m.categoryId === c.id).length;
      }
    });
    return counts;
  }, [menuItems, ribbonCategories]);

  // Bộ lọc danh sách món ăn
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      if (statusFilter === 'active' && !item.isAvailable) return false;
      if (statusFilter === 'locked' && item.isAvailable) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(query);
        const matchCat = item.categoryName?.toLowerCase().includes(query);
        const matchCode = item.code?.toLowerCase().includes(query);
        return matchName || matchCat || matchCode;
      }
      return true;
    });
  }, [menuItems, selectedCategory, statusFilter, searchQuery]);

  // Phân trang món ăn
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // ==========================================
  // XỬ LÝ NGHIỆP VỤ MÓN ĂN
  // ==========================================

  // Bật/tắt trạng thái phục vụ món ăn
  const handleToggleStatus = async (itemId) => {
    const itemToToggle = menuItems.find((m) => m.id === itemId);
    if (!itemToToggle) return;

    const previousState = itemToToggle.isAvailable;
    const nextState = !previousState;

    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isAvailable: nextState } : item
      )
    );

    triggerToast(
      nextState
        ? `Đã mở bán: ${itemToToggle.name}`
        : `Đã tạm khóa phục vụ: ${itemToToggle.name}`
    );

    try {
      await menuApi.toggleMenuItemStatus(itemId);
    } catch (err) {
      console.error('Lỗi khi đồng bộ trạng thái món ăn vào DB:', err);
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: previousState } : item
        )
      );
      triggerToast(`⚠️ Lỗi cập nhật Database: ${err.message}`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Lưu món ăn (Tạo mới hoặc Cập nhật vào Database)
  const handleSaveItem = async (itemData) => {
    try {
      if (editingItem) {
        // Cập nhật món ăn và link CDN ảnh vào Database
        const updated = await menuApi.updateMenuItem(editingItem.id, itemData);
        setMenuItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? { ...item, ...updated } : item))
        );
        triggerToast(`Đã cập nhật món vào Database: ${itemData.name}`);
      } else {
        // Tạo mới món ăn vào Database
        const created = await menuApi.createMenuItem(itemData);
        setMenuItems((prev) => [created, ...prev]);
        triggerToast(`Đã thêm món mới vào Database: ${itemData.name}`);
      }
      setIsModalOpen(false);
      // Tải lại dữ liệu từ Database ở chế độ ngầm để đảm bảo đồng bộ
      fetchMenuData(true);
    } catch (err) {
      console.error('Lỗi khi lưu món ăn vào Database:', err);
      triggerToast(`⚠️ Không thể lưu vào Database: ${err.message || 'Lỗi hệ thống'}`);
      throw err;
    }
  };

  // Xóa món ăn khỏi thực đơn trong Database
  const handleDeleteItem = async (itemId) => {
    const itemToDelete = menuItems.find((m) => m.id === itemId);
    if (!itemToDelete) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${itemToDelete.name}" khỏi thực đơn không?`)) {
      try {
        await menuApi.deleteMenuItem(itemId);
        setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
        triggerToast(`Đã xóa món ăn khỏi Database: ${itemToDelete.name}`);
        fetchMenuData(true);
      } catch (err) {
        console.error('Lỗi khi xóa món ăn khỏi Database:', err);
        triggerToast(`⚠️ Lỗi khi xóa món ăn: ${err.message || 'Thất bại'}`);
      }
    }
  };

  // ==========================================
  // XỬ LÝ NGHIỆP VỤ DANH MỤC (CATEGORY)
  // ==========================================

  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  // Lưu Danh Mục (Tạo mới hoặc Cập nhật)
  const handleSaveCategory = async (catData) => {
    try {
      if (editingCategory) {
        await menuApi.updateCategory(editingCategory.id, catData);
        triggerToast(`✅ Đã cập nhật danh mục: ${catData.name}`);
      } else {
        await menuApi.createCategory(catData);
        triggerToast(`✅ Đã thêm danh mục mới: ${catData.name}`);
      }
      fetchMenuData(true);
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      triggerToast(`❌ Lỗi: ${err.message || 'Không thể lưu danh mục'}`);
      throw err;
    }
  };

  // Xóa danh mục
  const handleDeleteCategory = async (category) => {
    if (category.isSystem) {
      alert('Không thể xóa danh mục mặc định của hệ thống');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}" khỏi cơ sở dữ liệu không?`)) {
      try {
        await menuApi.deleteCategory(category.id);
        setCategoryList((prev) => prev.filter((c) => c.id !== category.id));
        triggerToast(`🗑️ Đã xóa danh mục: ${category.name}`);
        fetchMenuData(true);
      } catch (err) {
        console.error('Lỗi khi xóa danh mục:', err);
        triggerToast(`❌ Lỗi khi xóa: ${err.message}`);
      }
    }
  };

  // Bật/tắt trạng thái hiển thị danh mục
  const handleToggleCategoryStatus = async (categoryId) => {
    const targetCat = categoryList.find((c) => c.id === categoryId);
    if (!targetCat) return;

    const previousStatus = targetCat.isActive;
    const nextStatus = !previousStatus;

    setCategoryList((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, isActive: nextStatus } : c))
    );

    triggerToast(
      nextStatus
        ? `Đã kích hoạt hiển thị: ${targetCat.name}`
        : `Đã tạm ẩn danh mục: ${targetCat.name}`
    );

    try {
      await menuApi.toggleCategoryStatus(categoryId);
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái danh mục:', err);
      setCategoryList((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, isActive: previousStatus } : c))
      );
      triggerToast(`⚠️ Lỗi cập nhật Database: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian font-sans">
      {/* 1. Header Quản lý Thực Đơn tích hợp thanh chuyển Tab (Món Ăn vs Danh Mục) */}
      <AdminMenuHeader
        stats={dishStats}
        categoryStats={categoryStats}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
      />

      {/* 2. Vùng nội dung cuộn chính */}
      <div className="flex-1 px-8 py-6 overflow-y-scroll [scrollbar-gutter:stable] space-y-6 relative">
        {/* Banner trạng thái kết nối Database / Làm mới */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-card border border-surface-border text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-jade-bright animate-pulse"></span>
            <span className="text-[#A0A0A5] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-gold" />
              Nguồn dữ liệu: <strong className="text-white">Aiven MySQL Database</strong>
            </span>
            <span className="text-[#656569] hidden md:inline">• Đồng bộ thời gian thực</span>
          </div>

          <button
            type="button"
            onClick={() => fetchMenuData(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 text-gold hover:text-gold-light border border-surface-border text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách từ Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang tải...' : 'Làm mới từ DB'}</span>
          </button>
        </div>

        {/* Cảnh báo nếu lỗi kết nối */}
        {error && (
          <div className="p-3 rounded-xl bg-crimson/15 border border-crimson/40 text-[#ff8080] text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Lỗi kết nối cơ sở dữ liệu: {error}.</span>
            </div>
            <button
              onClick={() => fetchMenuData()}
              className="px-2.5 py-1 rounded-lg bg-crimson/30 hover:bg-crimson/50 text-white font-semibold transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2A. TAB 1: QUẢN LÝ MÓN ĂN                                                */}
        {/* ========================================================================= */}
        {activeTab === 'dishes' && (
          <>
            {/* 2A.1. Thanh điều khiển tổng quan & Tìm kiếm món ăn */}
            <MenuSummaryControlBar
              searchQuery={searchQuery}
              onSearchChange={(query) => {
                setSearchQuery(query);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              onStatusFilterChange={(filter) => {
                setStatusFilter(filter);
                setCurrentPage(1);
              }}
              onOpenAddModal={handleOpenAddModal}
            />

            {/* 2A.2. Dải băng phân loại danh mục (Category Ribbon) */}
            <CategoryFilterRibbon
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setCurrentPage(1);
              }}
              categoryCounts={categoryCounts}
              categories={ribbonCategories}
            />

            {/* 2A.3. Bảng danh sách món ăn */}
            <div className="bg-surface-card rounded-2xl border border-surface-border shadow-xl overflow-hidden">
              <div className="px-6 py-3.5 bg-surface-elevated/70 border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Danh Sách Món Ăn Trong Database
                  </span>
                  <span className="text-xs text-[#8E8E93] hidden sm:inline">• Sắp xếp theo ID</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#A0A0A5]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-jade-bright"></span> Đang bán ({dishStats.active})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-crimson-glow"></span> Tạm khóa ({dishStats.locked})
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-gold">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs text-[#8E8E93] font-medium tracking-wide">
                    Đang nạp thực đơn từ Database Hỏa Diệm Các...
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-surface-border/60">
                  {paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        onToggleStatus={handleToggleStatus}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteItem}
                      />
                    ))
                  ) : (
                    <div className="py-16 text-center text-xs text-[#8E8E93] italic">
                      Không tìm thấy món ăn nào phù hợp với bộ lọc hiện tại
                    </div>
                  )}
                </div>
              )}

              {!loading && (
                <MenuPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredItems.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 2B. TAB 2: QUẢN LÝ DANH MỤC RIÊNG BIỆT (CATEGORY MANAGEMENT)             */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <CategoryManageSection
            categories={categoryList}
            onOpenAddModal={handleOpenAddCategoryModal}
            onEditCategory={handleOpenEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
            onToggleStatus={handleToggleCategoryStatus}
            loading={loading}
          />
        )}
      </div>

      {/* 3. Modal Thêm / Chỉnh Sửa Món Ăn */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
        categories={categoryList}
      />

      {/* 4. Modal Thêm / Chỉnh Sửa Danh Mục */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialData={editingCategory}
      />

      {/* 5. Realtime KDS Toast Notification */}
      <KdsToastNotification
        message={toastMessage}
        isVisible={isToastVisible}
      />
    </div>
  );
}
