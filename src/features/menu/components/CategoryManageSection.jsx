import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2, Layers, CheckCircle, XCircle } from 'lucide-react';

export default function CategoryManageSection({
  categories = [],
  onOpenAddModal,
  onEditCategory,
  onDeleteCategory,
  onToggleStatus,
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden'

  // Lọc danh mục theo tìm kiếm & trạng thái
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // 1. Lọc theo trạng thái
      if (statusFilter === 'active' && !cat.isActive) return false;
      if (statusFilter === 'hidden' && cat.isActive) return false;

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = cat.name?.toLowerCase().includes(q);
        const matchSlug = cat.slug?.toLowerCase().includes(q);
        const matchDesc = cat.description?.toLowerCase().includes(q);
        return matchName || matchSlug || matchDesc;
      }
      return true;
    });
  }, [categories, statusFilter, searchQuery]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: categories.length,
      active: categories.filter((c) => c.isActive).length,
      hidden: categories.filter((c) => !c.isActive).length,
    };
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* 1. Thanh điều khiển: Tìm kiếm + Lọc trạng thái + Nút Thêm Danh Mục */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Khung tìm kiếm danh mục */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên, slug, mô tả..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-surface-border rounded-xl text-xs text-white placeholder:text-[#6E6E78] focus:border-gold/60 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Cụm lọc trạng thái & Nút thêm danh mục */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bộ lọc 3 tab: Tất cả / Đang hiển thị / Tạm ẩn */}
          <div className="flex items-center p-1 bg-surface-card rounded-xl border border-surface-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-surface-elevated text-white font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              • Tất Cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-jade-bright/20 text-jade-bright font-bold border border-jade-bright/40'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              • Hiển Thị ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('hidden')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'hidden'
                  ? 'bg-crimson/20 text-[#ff8080] font-bold border border-crimson/40'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              • Tạm Ẩn ({stats.hidden})
            </button>
          </div>

          {/* Nút Thêm Danh Mục Riêng */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-crimson to-crimson-glow text-white text-xs font-bold shadow-lg shadow-crimson/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Mục Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Bảng danh sách danh mục */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-xl overflow-hidden font-sans">
        {/* Tiêu đề bảng */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              DANH SÁCH DANH MỤC THỰC ĐƠN TRONG DATABASE
            </h3>
            <span className="text-xs text-[#8E8E93] hidden sm:inline">
              • Sắp xếp theo thứ tự hiển thị ưu tiên
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#8E8E93]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-jade-bright shadow-sm shadow-jade-bright/40"></span>
              Đang hiển thị
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-crimson-glow shadow-sm shadow-crimson-glow/40"></span>
              Tạm ẩn
            </span>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#18181D] border-b border-surface-border text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                <th className="px-5 py-3.5 w-16 text-center">Thứ Tự</th>
                <th className="px-5 py-3.5">Tên Danh Mục &amp; Slug</th>
                <th className="px-5 py-3.5">Mô Tả Danh Mục</th>
                <th className="px-5 py-3.5 text-center">Số Món</th>
                <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-[#8E8E93]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-[#6A6A74]">
                        <Layers className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">Không tìm thấy danh mục nào phù hợp</p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-gold hover:underline"
                        >
                          Xóa từ khóa tìm kiếm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.id || cat.slug}
                    className="hover:bg-surface-elevated/40 transition-colors"
                  >
                    {/* Thứ tự hiển thị */}
                    <td className="px-5 py-4 text-center font-mono font-bold text-gold">
                      #{cat.displayOrder ?? 0}
                    </td>

                    {/* Tên danh mục & Slug */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-[13px]">{cat.name}</span>
                          {cat.isSystem && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gold/15 text-gold border border-gold/30">
                              Hệ thống
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[#8E8E93]">
                          slug: <span className="text-gold/80">{cat.slug}</span>
                        </span>
                      </div>
                    </td>

                    {/* Mô tả */}
                    <td className="px-5 py-4 max-w-xs text-[#A0A0A5] line-clamp-2">
                      {cat.description || <span className="italic text-[#6E6E78]">Chưa có mô tả</span>}
                    </td>

                    {/* Số món trực thuộc */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-surface-elevated text-white font-bold text-[11px] border border-surface-border">
                        {cat.totalItems ?? 0} món
                      </span>
                    </td>

                    {/* Trạng thái Bật / Tắt */}
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(cat.id)}
                        role="switch"
                        aria-checked={cat.isActive}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                          cat.isActive
                            ? 'bg-jade-bright shadow-sm shadow-jade-bright/40'
                            : 'bg-surface-elevated border border-surface-border'
                        }`}
                        title={cat.isActive ? 'Đang hiển thị (Bấm để ẩn)' : 'Đang ẩn (Bấm để hiện)'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                            cat.isActive ? 'translate-x-6' : 'translate-x-1 bg-crimson'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Thao tác Sửa & Xóa */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditCategory(cat)}
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!cat.isSystem && (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(cat)}
                            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-crimson hover:bg-crimson/10 transition-colors"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Chân bảng: Thống kê số lượng */}
        <div className="px-6 py-3.5 border-t border-surface-border bg-[#141418] flex items-center justify-between text-xs text-[#8E8E93]">
          <span>
            Hiển thị <strong className="text-white">{filteredCategories.length}</strong> / {categories.length} danh mục thực đơn
          </span>
          <span className="text-[11px] text-[#6E6E78]">
            * Khách hàng sẽ thấy các danh mục ở trạng thái Đang hiển thị
          </span>
        </div>
      </div>
    </div>
  );
}
