import React from 'react';
import { CheckCircle2, Trash2, X } from 'lucide-react';

/**
 * CartToastNotification
 * Thông báo nổi ở góc dưới cùng bên phải khi xóa món hoặc xóa toàn bộ giỏ hàng.
 * Tự động biến mất sau 3 giây hoặc có thể đóng thủ công.
 */
export default function CartToastNotification({
  isVisible,
  title = 'Đã Xóa Thành Công',
  message = '',
  onClose,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[90] max-w-sm sm:max-w-md bg-[#18181C]/95 border border-[#D4AF37]/40 text-[#FDFBF7] px-4 py-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center gap-3 transition-all duration-300 select-none ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* Icon thùng rác / thành công */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7A0C16] to-[#C41E3A] border border-red-500/50 flex items-center justify-center text-[#FFD54F] shadow-sm flex-shrink-0">
        <Trash2 className="w-4 h-4 text-[#FFD54F]" />
      </div>

      {/* Nội dung thông báo */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold text-[#FFE699] leading-tight">
          {title}
        </p>
        <p className="text-[11.5px] text-[#D6D3CD] truncate mt-0.5 leading-snug">
          {message}
        </p>
      </div>

      {/* Nút đóng nhanh */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[#9E9AA0] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
