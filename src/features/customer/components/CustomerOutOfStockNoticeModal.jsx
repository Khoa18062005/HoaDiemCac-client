import React from 'react';
import { ChefHat, AlertCircle, CheckCircle2, UtensilsCrossed, X } from 'lucide-react';

/**
 * CustomerOutOfStockNoticeModal
 * Modal thông báo lịch thiệp gửi đến bàn khách khi Bếp báo hết món (UC19).
 * Tự động xóa món khỏi order của bàn và giỏ hàng của khách.
 */
export default function CustomerOutOfStockNoticeModal({
  isOpen,
  onClose,
  noticeData, // { menuItemName, message }
}) {
  if (!isOpen || !noticeData) return null;

  const dishName = noticeData.menuItemName || 'Món ăn';
  const customMessage = noticeData.message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="bg-[#1A1A20] border border-[rgba(212,175,55,0.4)] w-full max-w-md rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative text-[#FDFBF7]">
        {/* Nền hoa văn trang trí hoàng gia */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-600/10 via-gold/10 to-transparent rounded-bl-full pointer-events-none" />

        {/* Header Thông Báo */}
        <div className="p-5 pb-3 flex items-start gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#990000] to-[#C41E3A] border border-gold/40 flex items-center justify-center text-gold shadow-lg flex-shrink-0">
            <ChefHat className="w-6 h-6 text-gold" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[11px] font-mono tracking-widest uppercase text-gold font-bold block mb-0.5">
              HỎA DIỆM CÁC • THÔNG BÁO
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              Thành Thật Cáo Lỗi Quý Khách
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[#9E9AA0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội Dung Thông Báo */}
        <div className="p-5 pt-2 space-y-4 relative z-10">
          {/* Món Ăn Bị Hết */}
          <div className="p-3.5 rounded-2xl bg-[#141418] border border-red-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10.5px] text-red-400 font-semibold uppercase tracking-wider block">
                Món Đã Tạm Hết Nguyên Liệu
              </span>
              <p className="text-sm font-bold text-white truncate">
                {dishName}
              </p>
            </div>
          </div>

          {/* Lời Cáo Lỗi Trang Trọng */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[12.5px] sm:text-xs text-[#D6D3CD] leading-relaxed space-y-2">
            <p>
              {customMessage || (
                <>
                  Kính thưa Quý khách, Nhà hàng Hỏa Diệm Các thành thật cáo lỗi: Món <strong className="text-gold">"{dishName}"</strong> hiện tại bếp đã tạm hết nguyên liệu tươi ngon nhất.
                </>
              )}
            </p>
            <p className="text-amber-200/90 text-[11.5px] font-medium">
              ✨ Món ăn này đã được tự động gỡ khỏi đơn gọi và hóa đơn của bàn để Quý khách không phải chờ đợi. Kính mong Quý khách lượng thứ và hoan hỷ lựa chọn món thơm ngon khác trong thực đơn!
            </p>
          </div>
        </div>

        {/* Nút Xác Nhận */}
        <div className="p-4 bg-[#141418] border-t border-white/5 flex items-center justify-end relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-[#141418] bg-gradient-to-r from-[#D4AF37] via-[#FFE088] to-[#D4AF37] hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Xác Nhận & Tiếp Tục Chọn Món</span>
          </button>
        </div>
      </div>
    </div>
  );
}
