import React, { useEffect } from 'react';
import { ChefHat, X, AlertCircle, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

/**
 * ConfirmSendOrderModal
 * Hộp thoại popup xác nhận trước khi thực hiện gửi đơn vào bếp (UC11 / KDS workflow).
 * Hiển thị tóm tắt danh sách món, số lượng, ghi chú bếp và tổng tiền đợt gọi.
 */
export default function ConfirmSendOrderModal({
  isOpen,
  onClose,
  onConfirm,
  tableNumber = '',
  items = [],
  totalAmount = 0,
}) {
  // Đóng modal khi nhấn phím Escape
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

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const calculatedTotal =
    totalAmount ||
    items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#18181C] border border-[rgba(212,175,55,0.4)] w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative text-[#FDFBF7] animate-scaleIn max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nền hoa văn trang trí hoàng gia */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-600/15 via-[#D4AF37]/15 to-transparent rounded-bl-full pointer-events-none" />

        {/* 1. Header */}
        <div className="p-4 sm:p-5 pb-3 flex items-start gap-3.5 relative z-10 border-b border-white/10 bg-[#16161A]">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#990000] to-[#C41E3A] border border-[#D4AF37]/60 flex items-center justify-center text-[#FFD54F] shadow-lg flex-shrink-0">
            <ChefHat className="w-6 h-6 text-[#FFD54F]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FFD54F] font-bold block mb-0.5">
              HỎA DIỆM CÁC • XÁC NHẬN ĐƠN MÓN
            </span>
            <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
              Xác Nhận Gửi Đơn Vào Bếp
            </h3>
            <p className="text-[11.5px] text-[#A39E93] mt-0.5">
              Bàn {tableNumber} • {totalItemsCount} phần món ({items.length} món ăn)
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

        {/* 2. Danh sách món ăn đang đặt */}
        <div className="p-4 sm:p-5 space-y-3.5 relative z-10 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center justify-between text-xs text-[#D6D3CD] px-1 font-semibold uppercase tracking-wider">
            <span>Món ăn đã chọn</span>
            <span>Thành tiền</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {items.map((item, idx) => {
              const itemTotal = (item.price || 0) * (item.quantity || 1);
              return (
                <div
                  key={item.id || item.menuItemId || idx}
                  className="p-2.5 sm:p-3 rounded-2xl bg-[#131316] border border-white/5 hover:border-[rgba(212,175,55,0.2)] transition-all flex items-start gap-2.5"
                >
                  {/* Số lượng */}
                  <span className="w-7 h-7 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-inner">
                    x{item.quantity || 1}
                  </span>

                  {/* Thông tin món */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#A39E93]">
                      <span>{formatPrice(item.price)} ₫ / phần</span>
                    </div>

                    {/* Ghi chú bếp nếu có */}
                    {item.note && (
                      <p className="text-[11px] text-amber-300/90 italic flex items-center gap-1 mt-1 truncate bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <ChefHat className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span>Ghi chú: {item.note}</span>
                      </p>
                    )}
                  </div>

                  {/* Giá tiền */}
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="text-xs sm:text-sm font-bold text-[#FFD54F]">
                      {formatPrice(itemTotal)}
                    </span>
                    <span className="text-[10px] text-[#FFD54F] ml-0.5 font-bold">₫</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tổng tiền đợt gọi */}
          <div className="p-3.5 rounded-2xl bg-[#141418] border border-white/10 flex items-center justify-between">
            <span className="text-xs sm:text-sm text-[#D6D3CD] font-bold uppercase tracking-wider">
              Tổng tiền đợt gửi này:
            </span>
            <div className="flex items-baseline">
              <span className="text-lg sm:text-xl font-black text-[#FFD54F] tracking-tight">
                {formatPrice(calculatedTotal)}
              </span>
              <span className="text-xs font-bold text-[#FFD54F] ml-1">₫</span>
            </div>
          </div>

          {/* Lời nhắc nhở */}
          <div className="p-3 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 flex items-start gap-2.5 text-[11.5px] text-amber-200/90 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Món ăn sau khi gửi vào bếp sẽ được chuyển ngay đến Trạm Bếp KDS để chuẩn bị. Quý khách vui lòng kiểm tra kỹ danh sách món trước khi xác nhận.
            </p>
          </div>
        </div>

        {/* 3. Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-[#141418] border-t border-white/10 flex items-center justify-end gap-2.5 sm:gap-3 relative z-10 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl border border-white/15 text-xs sm:text-sm font-bold text-[#D6D3CD] hover:text-white hover:bg-white/5 active:scale-95 transition-all text-center"
          >
            Kiểm Tra Lại
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#990000] via-[#C41E3A] to-[#E63946] border border-[#FFE699]/40 shadow-[0_4px_16px_rgba(196,30,58,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 select-none"
          >
            <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
            <span>Xác Nhận Gửi Bếp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
