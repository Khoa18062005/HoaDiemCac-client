import React from 'react';
import { formatCurrencyVND } from './TableCard';

export default function FloorBottomBar({ totalSales = 48250000, callStaffCount = 2, onFilterCallStaff, onRefresh }) {
  return (
    <div className="fixed bottom-6 right-8 z-20 flex items-center gap-3 bg-[#19191D]/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-gold/40 shadow-2xl">
      <div className="flex items-center gap-2.5 pr-4 border-r border-surface-border">
        <span className="text-xs text-[#8E8E93]">Tạm tính sảnh:</span>
        <span className="font-mono font-bold text-gold text-sm">
          {formatCurrencyVND(totalSales)}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onFilterCallStaff}
          className="px-3 py-1.5 rounded-full bg-crimson hover:bg-crimson-glow text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <span>🛎️ {callStaffCount} Bàn Gọi Nhân Viên</span>
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-full bg-surface-card hover:bg-surface-elevated text-gold border border-gold/30 text-xs font-medium transition-colors flex items-center gap-1.5 active:scale-95"
        >
          <span>🔄 Làm Mới</span>
        </button>
      </div>
    </div>
  );
}
