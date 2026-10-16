import React, { useEffect } from 'react';
import { Trash2, X, AlertCircle, ChefHat } from 'lucide-react';

/**
 * ConfirmRemoveItemModal
 * Hộp thoại popup xác nhận khi ấn vào icon thùng rác kế bên mỗi món ăn.
 * Cho phép hủy bỏ hoặc xác nhận xóa món đó khỏi giỏ hàng.
 */
export default function ConfirmRemoveItemModal({
  isOpen,
  onClose,
  onConfirm,
  tableNumber = '',
  item = null,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const itemTotal = (item.price || 0) * (item.quantity || 1);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#18181C] border border-[rgba(212,175,55,0.4)] w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative text-[#FDFBF7] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nền hiệu ứng trang trí */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-600/15 via-[#D4AF37]/15 to-transparent rounded-bl-full pointer-events-none" />

        {/* 1. Header */}
        <div className="p-4 sm:p-5 pb-3 flex items-start gap-3.5 relative z-10 border-b border-white/10 bg-[#16161A]">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7A0C16] to-[#C41E3A] border border-red-500/50 flex items-center justify-center text-[#FFD54F] shadow-lg flex-shrink-0">
            <Trash2 className="w-5 h-5 text-[#FFD54F]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FFD54F] font-bold block mb-0.5">
              HỎA DIỆM CÁC • GIỎ HÀNG
            </span>
            <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
              Xác Nhận Xóa Món Ăn
            </h3>
            <p className="text-[11.5px] text-[#A39E93] mt-0.5">
              Bàn {tableNumber} • Món chưa gửi bếp
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#9E9AA0] hover:text-white hover:bg-white/10 transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Nội dung chi tiết món xóa */}
        <div className="p-4 sm:p-5 space-y-4 relative z-10">
          <p className="text-xs sm:text-[13px] text-[#D6D3CD] leading-relaxed">
            Bạn có chắc chắn muốn xóa món này khỏi giỏ hàng của <span className="font-bold text-amber-300">Bàn {tableNumber}</span>?
          </p>

          {/* Chi tiết món ăn */}
          <div className="p-3 rounded-2xl bg-[#131316] border border-white/10 flex items-start gap-3">
            <img
              src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}
              alt={item.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-[#2A2A2E] border border-white/10"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
              }}
            />

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                {item.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  x{item.quantity} phần
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-[#FFD54F]">
                  {formatPrice(itemTotal)} ₫
                </span>
              </div>

              {item.note && (
                <p className="text-[11px] text-amber-300/80 italic flex items-center gap-1 mt-1.5 truncate">
                  <ChefHat className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span>Ghi chú: {item.note}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-[#141418] border-t border-white/10 flex items-center justify-end gap-2.5 sm:gap-3 relative z-10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl border border-white/15 text-xs sm:text-sm font-bold text-[#D6D3CD] hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center"
          >
            Giữ Lại Món
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#990000] via-[#C41E3A] to-[#DC2626] border border-red-400/40 shadow-[0_4px_16px_rgba(196,30,58,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 select-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xác Nhận Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
