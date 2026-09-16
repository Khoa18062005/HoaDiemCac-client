import React from 'react';
import { Utensils, Layers } from 'lucide-react';

export default function AdminMenuHeader({
  stats,
  categoryStats,
  activeTab = 'dishes',
  onTabChange,
}) {
  const { total = 0, active = 0, locked = 0 } = stats || {};
  const { totalCats = 0, activeCats = 0, hiddenCats = 0 } = categoryStats || {};

  return (
    <header className="h-20 border-b border-surface-border px-8 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md flex-shrink-0 font-sans z-20 gap-4 flex-wrap">
      {/* Cột trái: Tiêu đề trang & Thanh chuyển Tab */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white tracking-wide whitespace-nowrap">
            Quản Lý Thực Đơn
          </h1>
          <span className="hidden xl:inline-block text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-gold/90 border border-gold/30">
            Imperial Menu
          </span>
        </div>

        {/* Thanh chuyển đổi 2 Tab Quản Lý Món Ăn vs Quản Lý Danh Mục */}
        <div className="flex items-center p-1 bg-surface-card rounded-xl border border-surface-border">
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('dishes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'dishes'
                ? 'bg-gradient-to-r from-crimson to-crimson-glow text-white shadow-md shadow-crimson/30 border border-crimson-glow'
                : 'text-[#8E8E93] hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Món Ăn</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'dishes'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-elevated text-[#8E8E93]'
              }`}
            >
              {total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange && onTabChange('categories')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              activeTab === 'categories'
                ? 'bg-gradient-to-r from-crimson to-crimson-glow text-white shadow-md shadow-crimson/30 border border-crimson-glow'
                : 'text-[#8E8E93] hover:text-white hover:bg-surface-elevated'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Danh Mục</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'categories'
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-elevated text-[#8E8E93]'
              }`}
            >
              {totalCats}
            </span>
          </button>
        </div>
      </div>

      {/* Cột phải: Thống kê số lượng tương ứng với tab đang chọn */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-[#A0A0A5] tracking-wide hidden sm:inline">
          {activeTab === 'dishes'
            ? 'Toàn bộ danh mục món ăn & bảng giá phục vụ tại bàn'
            : 'Các nhóm phân loại thực đơn & thứ tự ưu tiên hiển thị'}
        </span>

        {activeTab === 'dishes' ? (
          <div className="flex items-center gap-3 text-xs text-[#A0A0A5]">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[13px]">{total}</span> món tổng số
            </span>
            <span className="text-surface-border">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-jade-bright shadow-sm shadow-jade-bright/40"></span>
              <span className="font-bold text-jade-bright text-[13px]">{active}</span> đang bán
            </span>
            <span className="text-surface-border">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-crimson-glow shadow-sm shadow-crimson-glow/40"></span>
              <span className="font-bold text-crimson-glow text-[13px]">{locked}</span> tạm khóa
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs text-[#A0A0A5]">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[13px]">{totalCats}</span> nhóm danh mục
            </span>
            <span className="text-surface-border">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-jade-bright shadow-sm shadow-jade-bright/40"></span>
              <span className="font-bold text-jade-bright text-[13px]">{activeCats}</span> đang hiển thị
            </span>
            <span className="text-surface-border">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-crimson-glow shadow-sm shadow-crimson-glow/40"></span>
              <span className="font-bold text-crimson-glow text-[13px]">{hiddenCats}</span> tạm ẩn
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
