import React from 'react';
import { Search, UserPlus } from 'lucide-react';

export default function AdminEmployeeControlBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenAddModal,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 font-sans">
      {/* Cột trái: Thanh tìm kiếm dài rộng rãi */}
      <div className="relative w-full sm:w-[480px] lg:w-[540px] flex-shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên, email, SĐT hoặc mã NV..."
          className="w-full pl-9 pr-8 py-2 bg-surface-card hover:bg-surface-elevated text-[#EDEDED] rounded-lg text-xs placeholder:text-[#8E8E93] border border-surface-border focus:border-gold/60 outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:outline-none focus-visible:ring-0 transition-colors duration-150"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93] hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Cột phải: Nút lọc trạng thái & Nút Tạo Tài Khoản */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
        {/* Nút lọc trạng thái: Grid 3 cột cố định 285px x h-9 */}
        <div className="grid grid-cols-3 w-[285px] h-9 rounded-lg bg-surface-card border border-surface-border p-0.5 text-xs flex-shrink-0 box-border">
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={`w-full h-full rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-75 outline-none focus:outline-none focus:ring-0 select-none border ${
              statusFilter === 'all'
                ? 'bg-surface-elevated text-white border-white/20'
                : 'text-[#A0A0A5] hover:text-[#EDEDED] border-transparent hover:bg-surface-hover'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors flex-shrink-0 ${
                statusFilter === 'all' ? 'bg-white' : 'bg-[#6E6E73]'
              }`}
            />
            Tất Cả
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('active')}
            className={`w-full h-full rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-75 outline-none focus:outline-none focus:ring-0 select-none border ${
              statusFilter === 'active'
                ? 'bg-jade-bright/20 text-jade-bright border-jade-bright/40'
                : 'text-[#A0A0A5] hover:text-[#EDEDED] border-transparent hover:bg-surface-hover'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors flex-shrink-0 ${
                statusFilter === 'active' ? 'bg-jade-bright' : 'bg-[#6E6E73]'
              }`}
            />
            Đang Hoạt Động
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('locked')}
            className={`w-full h-full rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-75 outline-none focus:outline-none focus:ring-0 select-none border ${
              statusFilter === 'locked'
                ? 'bg-crimson/20 text-[#ff8080] border-crimson/40'
                : 'text-[#A0A0A5] hover:text-[#EDEDED] border-transparent hover:bg-surface-hover'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors flex-shrink-0 ${
                statusFilter === 'locked' ? 'bg-crimson-glow' : 'bg-[#6E6E73]'
              }`}
            />
            Tạm Khóa
          </button>
        </div>

        {/* Nút Tạo Tài Khoản Nhân Viên Mới */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-crimson hover:bg-crimson-glow text-white text-xs font-bold shadow-md shadow-crimson/30 active:scale-95 transition-all whitespace-nowrap outline-none flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo Tài Khoản</span>
        </button>
      </div>
    </div>
  );
}
