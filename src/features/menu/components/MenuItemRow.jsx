import React from 'react';
import { Edit3, Trash2, Utensils } from 'lucide-react';
import { formatCurrencyVND } from '@/features/tables';

export default function MenuItemRow({
  item,
  onToggleStatus,
  onEdit,
  onDelete,
}) {
  const {
    id,
    name,
    categoryName,
    description,
    price,
    unit,
    image,
    isAvailable,
    isFeatured,
  } = item;

  return (
    <div
      className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors font-sans ${
        isAvailable
          ? 'hover:bg-surface-elevated/40'
          : 'bg-crimson/[0.12] hover:bg-crimson/[0.18]'
      }`}
    >
      {/* Khối bên trái: Ảnh + Tên + Danh mục + Mô tả */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Ảnh món */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-elevated border border-surface-border flex-shrink-0 flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-all"
              loading="lazy"
            />
          ) : (
            <Utensils className="w-6 h-6 text-gold/60" />
          )}

          {isFeatured && (
            <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-gold/90 text-obsidian text-[9px] font-bold shadow">
              HOT
            </span>
          )}
        </div>

        {/* Thông tin chữ */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-sm font-bold tracking-wide truncate text-white">
              {name}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-[#A0A0A5] border border-surface-border">
              {categoryName}
            </span>
          </div>
          <p className="text-xs text-[#8E8E93] line-clamp-1">
            {description}
          </p>
        </div>
      </div>

      {/* Khối bên phải: Giá tiền + Switch On/Off + Nút Sửa/Xóa */}
      <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0">
        {/* Giá tiền & Đơn vị tính */}
        <div className="flex flex-col text-left sm:text-right">
          <span className="text-sm font-bold text-gold tracking-tight font-sans">
            {formatCurrencyVND(price)}
          </span>
          <span className="text-[11px] text-[#8E8E93]">
            {unit || 'Phần'}
          </span>
        </div>

        {/* Công tắc Bật/Tắt trạng thái phục vụ (Realtime Toggle) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(id)}
            role="switch"
            aria-checked={isAvailable}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer ${
              isAvailable ? 'bg-jade-bright' : 'bg-surface-elevated border border-surface-border'
            }`}
            title={isAvailable ? 'Đang phục vụ (Bấm để tạm khóa)' : 'Tạm khóa (Bấm để mở bán)'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                isAvailable ? 'translate-x-6' : 'translate-x-1 bg-crimson'
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold w-16 text-left hidden sm:inline-block ${
              isAvailable ? 'text-jade-bright' : 'text-[#ff8080]'
            }`}
          >
            {isAvailable ? 'Đang Bán' : 'Tạm Khóa'}
          </span>
        </div>

        {/* Thao tác Sửa & Xóa */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors outline-none"
            title="Chỉnh sửa món ăn"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-crimson hover:bg-crimson/10 transition-colors outline-none"
            title="Xóa món ăn"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
