import React from 'react';
import { LayoutGrid, Layers } from 'lucide-react';

export default function KdsFilterBar({
  viewMode,
  onChangeViewMode,
  areaFilter,
  onChangeAreaFilter,
}) {
  return (
    <div className="bg-[#121215] border-b border-surface-border px-4 py-2.5 flex items-center justify-between gap-3 select-none flex-shrink-0">
      {/* Nút chuyển chế độ xem (View Mode Switcher) & Bộ lọc khu vực */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Toggle Chế độ xem: Thẻ đơn bàn vs Gom món */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-card border border-surface-border h-9">
          <button
            type="button"
            onClick={() => onChangeViewMode('tickets')}
            className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'tickets'
                ? 'bg-crimson text-white shadow-sm'
                : 'text-[#A0A0A5] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Theo Đơn Bàn</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('aggregated')}
            className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'aggregated'
                ? 'bg-crimson text-white shadow-sm'
                : 'text-[#A0A0A5] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gom Món Nấu</span>
          </button>
        </div>

        {/* Lọc Khu Vực: Tất Cả / Sảnh / VIP */}
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-lg border border-surface-border h-9">
          <button
            type="button"
            onClick={() => onChangeAreaFilter('all')}
            className={`h-7 flex items-center justify-center px-3 rounded-md text-xs font-medium transition-all ${
              areaFilter === 'all'
                ? 'bg-gold/20 text-gold font-bold'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Tất Cả
          </button>
          <button
            type="button"
            onClick={() => onChangeAreaFilter('COMMON')}
            className={`h-7 flex items-center justify-center px-3 rounded-md text-xs font-medium transition-all ${
              areaFilter === 'COMMON'
                ? 'bg-gold/20 text-gold font-bold'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Sảnh Chung
          </button>
          <button
            type="button"
            onClick={() => onChangeAreaFilter('VIP')}
            className={`h-7 flex items-center justify-center px-3 rounded-md text-xs font-medium transition-all ${
              areaFilter === 'VIP'
                ? 'bg-gold/20 text-gold font-bold'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Phòng VIP
          </button>
        </div>
      </div>
    </div>
  );
}
