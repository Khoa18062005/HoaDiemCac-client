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
  KdsToastNotification,
  MenuPagination,
} from '@/features/menu';

export default function MenuManagePage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(MENU_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Realtime Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  // Hàm tải dữ liệu thực đơn từ Database qua REST API
  const fetchMenuData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [itemsData, catsData] = await Promise.all([
        menuApi.getMenuItems(),
        menuApi.getCategories().catch((catErr) => {
          console.warn('Không tải được danh mục động, sử dụng mặc định:', catErr);
          return [];
        }),
      ]);

      if (Array.isArray(itemsData)) {
        setMenuItems(itemsData);
      }

      if (Array.isArray(catsData) && catsData.length > 0) {
        const dynamicCats = [
          { id: 'all', label: 'Tất Cả' },
          ...catsData.map((c) => ({ id: c.slug, label: c.name })),
        ];
        setCategories(dynamicCats);
      }
    } catch (err) {
      console.error('Lỗi khi tải thực đơn từ Database:', err);
      setError(err.message || 'Không thể kết nối đến cơ sở dữ liệu');
      // Dự phòng hiển thị dữ liệu mẫu nếu DB chưa khả dụng để không vỡ giao diện
      setMenuItems((prev) => (prev.length > 0 ? prev : initialMenuItems));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Thống kê số lượng tổng quan
  const stats = useMemo(() => {
    return {
      total: menuItems.length,
      active: menuItems.filter((m) => m.isAvailable).length,
      locked: menuItems.filter((m) => !m.isAvailable).length,
    };
  }, [menuItems]);

  // Đếm số lượng món ăn theo từng danh mục
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    categories.forEach((c) => {
      if (c.id !== 'all') {
        counts[c.id] = menuItems.filter((m) => m.categoryId === c.id).length;
      }
    });
    return counts;
  }, [menuItems, categories]);

  // Bộ lọc danh sách món
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Lọc danh mục
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Lọc trạng thái
      if (statusFilter === 'active' && !item.isAvailable) return false;
      if (statusFilter === 'locked' && item.isAvailable) return false;
      // Lọc tìm kiếm theo tên hoặc danh mục
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

  // Phân trang
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Xử lý bật/tắt phục vụ (Stock Toggle) và đồng bộ trực tiếp Database
  const handleToggleStatus = async (itemId) => {
    const itemToToggle = menuItems.find((m) => m.id === itemId);
    if (!itemToToggle) return;

    const previousState = itemToToggle.isAvailable;
    const nextState = !previousState;

    // Cập nhật giao diện tức thì (Optimistic UI)
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

    // Đồng bộ gọi API xuống Database Backend
    try {
      await menuApi.toggleMenuItemStatus(itemId);
    } catch (err) {
      console.error('Lỗi khi đồng bộ trạng thái món ăn vào DB:', err);
      // Khôi phục trạng thái cũ nếu API thất bại
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: previousState } : item
        )
      );
      triggerToast(`⚠️ Lỗi cập nhật Database: ${err.message}`);
    }
  };

  // Mở modal Thêm món
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Mở modal Sửa món
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Lưu món (Thêm mới hoặc Cập nhật)
  const handleSaveItem = (itemData) => {
    if (editingItem) {
      // Cập nhật
      setMenuItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...item, ...itemData } : item))
      );
      triggerToast(`Đã cập nhật món: ${itemData.name}`);
    } else {
      // Thêm mới
      const newItem = {
        ...itemData,
        id: 'm_' + Date.now(),
      };
      setMenuItems((prev) => [newItem, ...prev]);
      triggerToast(`Đã thêm món mới: ${itemData.name}`);
    }
  };

  // Xóa món
  const handleDeleteItem = (itemId) => {
    const itemToDelete = menuItems.find((m) => m.id === itemId);
    if (!itemToDelete) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${itemToDelete.name}" khỏi thực đơn không?`)) {
      setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
      triggerToast(`Đã xóa món: ${itemToDelete.name}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian font-sans">
      {/* 1. Header Quản lý Thực Đơn */}
      <AdminMenuHeader stats={stats} />

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
              <span>Lỗi kết nối cơ sở dữ liệu: {error}. Đang sử dụng dữ liệu bộ đệm.</span>
            </div>
            <button
              onClick={() => fetchMenuData()}
              className="px-2.5 py-1 rounded-lg bg-crimson/30 hover:bg-crimson/50 text-white font-semibold transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 2.1. Thanh điều khiển tổng quan & Tìm kiếm */}
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

        {/* 2.2. Dải băng phân loại danh mục (Category Ribbon) */}
        <CategoryFilterRibbon
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setCurrentPage(1);
          }}
          categoryCounts={categoryCounts}
          categories={categories}
        />

        {/* 2.3. Bảng danh sách món ăn */}
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-xl overflow-hidden">
          {/* Header bảng */}
          <div className="px-6 py-3.5 bg-surface-elevated/70 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Danh Sách Món Ăn Trong Database
              </span>
              <span className="text-xs text-[#8E8E93] hidden sm:inline">• Sắp xếp theo ID</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#A0A0A5]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-jade-bright"></span> Đang bán ({stats.active})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-crimson-glow"></span> Tạm khóa ({stats.locked})
              </span>
            </div>
          </div>

          {/* Danh sách các hàng món hoặc Trạng thái Loading */}
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

          {/* Phân trang */}
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
      </div>

      {/* 3. Modal Thêm / Chỉnh Sửa Món */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {/* 4. Realtime KDS Toast Notification */}
      <KdsToastNotification
        message={toastMessage}
        isVisible={isToastVisible}
      />
    </div>
  );
}
