import React from 'react';

export default function AdminEmployeeHeader({ stats }) {
  const { total = 0, active = 0, locked = 0 } = stats || {};

  return (
    <header className="h-20 border-b border-surface-border px-8 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md flex-shrink-0 font-sans z-20">
      {/* Cột trái: Tiêu đề trang & Badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-white tracking-wide">
          Quản Lý Nhân Viên
        </h1>
        <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-gold/90 border border-gold/30">
          Imperial Staff
        </span>
      </div>

      {/* Cột phải: Mô tả & Thống kê số lượng */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-[#A0A0A5] tracking-wide">
          Toàn bộ danh sách tài khoản nhân viên &amp; phân quyền hệ thống
        </span>
        <div className="flex items-center gap-3 text-xs text-[#A0A0A5]">
          <span className="flex items-center gap-1.5">
            <span className="font-bold text-white text-[13px]">{total}</span> nhân viên tổng số
          </span>
          <span className="text-surface-border">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-jade-bright shadow-sm shadow-jade-bright/40"></span>
            <span className="font-bold text-jade-bright text-[13px]">{active}</span> đang hoạt động
          </span>
          <span className="text-surface-border">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-crimson-glow shadow-sm shadow-crimson-glow/40"></span>
            <span className="font-bold text-crimson-glow text-[13px]">{locked}</span> tạm khóa
          </span>
        </div>
      </div>
    </header>
  );
}
