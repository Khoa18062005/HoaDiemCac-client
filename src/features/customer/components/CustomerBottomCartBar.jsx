import React from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';

/**
 * CustomerBottomCartBar
 * Thanh giỏ hàng nổi chân trang cố định (Floating Bar).
 * Luôn hiển thị tổng số món đã chọn, tổng tiền và nút CTA mở giỏ hàng / gửi bếp.
 */
export default function CustomerBottomCartBar({
  totalCount = 0,
  totalAmount = 0,
  isHost = true,
  onOpenCart,
}) {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // Ẩn thanh bottom bar nếu chưa có món nào trong giỏ
  if (totalCount === 0) {
    return null;
  }

  return (
    <footer className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-lg sm:mx-auto sm:left-0 sm:right-0">
      <div className="bg-gradient-to-r from-[#8B0000] via-[#A81324] to-[#C41E3A] text-white p-2 pl-3 pr-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] border border-[rgba(212,175,55,0.6)] flex items-center justify-between backdrop-blur-md">
        {/* Left: Hotpot Cauldron Icon + Total Amount */}
        <div
          onClick={onOpenCart}
          className="flex items-center space-x-2.5 cursor-pointer select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-[#2A050A] border border-[#D4AF37]/60 flex items-center justify-center text-[#FFD54F] shadow-inner">
            <ShoppingBag className="w-5 h-5 text-[#FFD54F] stroke-[2]" />
            {/* Dynamic Count Badge */}
            <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-[#FFE088] to-[#D4AF37] text-[#5A0808] font-black text-[10px] px-1.5 py-0.2 rounded-full border border-[#FFE699] shadow-sm whitespace-nowrap">
              {totalCount} món
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9.5px] uppercase tracking-wider text-[#FFE088]/90 font-medium">
              Tổng giỏ hàng
            </span>
            <div className="flex items-baseline">
              <span className="text-base font-extrabold text-[#FFD54F] tracking-tight">
                {formatPrice(totalAmount)}
              </span>
              <span className="text-xs font-bold text-[#FFD54F] ml-0.5">₫</span>
            </div>
          </div>
        </div>

        {/* Right: Order Confirmation CTA */}
        <button
          type="button"
          onClick={onOpenCart}
          aria-label={isHost ? 'Xem giỏ hàng và gửi bếp' : 'Xem giỏ hàng'}
          className="bg-gradient-to-r from-[#FFD54F] via-[#F3C649] to-[#D4AF37] text-[#5A0808] font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-[0_2px_10px_rgba(212,175,55,0.4)] flex items-center space-x-1.5 active:scale-95 transition-transform hover:brightness-105 select-none"
        >
          <span>{isHost ? 'Gửi Bếp' : 'Xem Giỏ'}</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </footer>
  );
}
