import React, { useState, useMemo } from 'react';
import {
  MENU_CATEGORIES,
  initialMenuItems,
  AdminMenuHeader,
  MenuSummaryControlBar,
  CategoryFilterRibbon,
  MenuItemRow,
  MenuItemModal,
  KdsToastNotification,
  MenuPagination,
} from '@/features/menu';

export default function MenuManagePage() {
  const [menuItems, setMenuItems] = useState(initialMenuItems);
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

  // Thống kê số lượng tổng quan
  const stats = useMemo(() => {
    return {
      total: menuItems.length,
      active: menuItems.filter(m => m.isAvailable).length,
      locked: menuItems.filter(m => !m.isAvailable).length,
    };
  }, [menuItems]);

  // Đếm số lượng món ăn theo từng danh mục
  const categoryCounts = useMemo(() => {
    const counts = { all: menuItems.length };
    MENU_CATEGORIES.forEach(c => {
      if (c.id !== 'all') {
        counts[c.id] = menuItems.filter(m => m.categoryId === c.id).length;
      }
    });
    return counts;
  }, [menuItems]);

  // Bộ lọc danh sách món
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Lọc danh mục
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Lọc trạng thái
      if (statusFilter === 'active' && !item.isAvailable) return false;
      if (statusFilter === 'locked' && item.isAvailable) return false;
      // Lọc tìm kiếm theo tên
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCat = item.categoryName.toLowerCase().includes(query);
        return matchName || matchCat;
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

  // Xử lý bật/tắt phục vụ (Stock Toggle)
  const handleToggleStatus = (itemId) => {
    setMenuItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const nextState = !item.isAvailable;
          triggerToast(
            nextState
              ? `Đã mở bán: ${item.name}`
              : `Đã tạm khóa phục vụ: ${item.name}`
          );
          return { ...item, isAvailable: nextState };
        }
        return item;
      })
    );
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
      setMenuItems(prev =>
        prev.map(item => (item.id === editingItem.id ? { ...item, ...itemData } : item))
      );
      triggerToast(`Đã cập nhật món: ${itemData.name}`);
    } else {
      // Thêm mới
      const newItem = {
        ...itemData,
        id: 'm_' + Date.now(),
      };
      setMenuItems(prev => [newItem, ...prev]);
      triggerToast(`Đã thêm món mới: ${itemData.name}`);
    }
  };

  // Xóa món
  const handleDeleteItem = (itemId) => {
    const itemToDelete = menuItems.find(m => m.id === itemId);
    if (!itemToDelete) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${itemToDelete.name}" khỏi thực đơn không?`)) {
      setMenuItems(prev => prev.filter(m => m.id !== itemId));
      triggerToast(`Đã xóa món: ${itemToDelete.name}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian font-sans">
      {/* 1. Header Quản lý Thực Đơn */}
      <AdminMenuHeader stats={stats} />

      {/* 2. Vùng nội dung cuộn chính */}
      <div className="flex-1 px-8 py-6 overflow-y-scroll [scrollbar-gutter:stable] space-y-6 relative">
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
        />

        {/* 2.3. Bảng danh sách món ăn */}
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-xl overflow-hidden">
          {/* Header bảng */}
          <div className="px-6 py-3.5 bg-surface-elevated/70 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Danh Sách Món Ăn
              </span>
              <span className="text-xs text-[#8E8E93] hidden sm:inline">• Sắp xếp theo vị trí hiển thị</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#A0A0A5]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-jade-bright"></span> Đang bán
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-crimson-glow"></span> Tạm khóa
              </span>
            </div>
          </div>

          {/* Danh sách các hàng món */}
          <div className="divide-y divide-surface-border/60">
            {paginatedItems.length > 0 ? (
              paginatedItems.map(item => (
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

          {/* Phân trang */}
          <MenuPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
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
