import React from 'react';
import { ArrowRight, ShoppingBag, ChefHat, CheckCircle2, Bell } from 'lucide-react';

/**
 * CustomerBottomCartBar
 * Thanh giỏ hàng nổi chân trang cố định (Floating Bar).
 * - Khi có món trong giỏ: Hiển thị tổng số món, tiền và nút Gửi Bếp.
 * - Khi giỏ rỗng nhưng bàn đã có món gửi bếp: Hiển thị tiến độ 3 giai đoạn: Đang chế biến -> Chờ phục vụ -> Đã phục vụ.
 */
export default function CustomerBottomCartBar({
  totalCount = 0,
  totalAmount = 0,
  orderedCount = 0,
  activeCookingCount = 0,
  waitingServeCount = 0,
  deliveredCount = 0,
  isHost = true,
  onOpenCart,
}) {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  // 1. Khi có món đang chọn trong giỏ nháp (Draft Cart)
  if (totalCount > 0) {
    return (
      <footer className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-lg sm:mx-auto sm:left-0 sm:right-0">
        <div className="bg-gradient-to-r from-[#8B0000] via-[#A81324] to-[#C41E3A] text-white p-2 pl-3 pr-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] border border-[rgba(212,175,55,0.6)] flex items-center justify-between backdrop-blur-md">
          {/* Left: Cart Icon + Total Amount */}
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

  // 2. Khi giỏ nháp rỗng nhưng bàn đã có món gửi bếp: Hiển thị thanh tiến độ chế biến (3 trạng thái)
  if (orderedCount > 0) {
    let title = 'Tất cả món đã phục vụ';
    let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    let iconBg = 'bg-[#0A2E1D] border-emerald-500/40';

    if (activeCookingCount > 0) {
      title = 'Bếp đang chế biến';
      icon = <ChefHat className="w-5 h-5 text-amber-400 animate-pulse" />;
      iconBg = 'bg-[#2A1808] border-amber-500/40';
    } else if (waitingServeCount > 0) {
      title = 'Món đang chờ phục vụ';
      icon = <Bell className="w-5 h-5 text-sky-400 animate-bounce" />;
      iconBg = 'bg-[#0C233A] border-sky-500/40';
    }

    const parts = [];
    if (activeCookingCount > 0) parts.push(`${activeCookingCount} đang nấu`);
    if (waitingServeCount > 0) parts.push(`${waitingServeCount} chờ phục vụ`);
    if (deliveredCount > 0) parts.push(`${deliveredCount} đã phục vụ`);
    const statusSubtitle = parts.length > 0 ? parts.join(' • ') : `${orderedCount} món đã lên bàn`;

    return (
      <footer className="lg:hidden fixed bottom-3 left-3 right-3 z-40 max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-lg sm:mx-auto sm:left-0 sm:right-0">
        <div
          onClick={onOpenCart}
          className="bg-gradient-to-r from-[#18181C] via-[#1F1F24] to-[#18181C] text-white p-2.5 px-3.5 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.85)] border border-[rgba(212,175,55,0.45)] flex items-center justify-between backdrop-blur-md cursor-pointer select-none hover:border-[rgba(212,175,55,0.7)] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#FFE699]">
                  {title}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#2A1508] text-[#FFB74D] border border-[#FF9800]/40">
                  {orderedCount} món
                </span>
              </div>
              <p className="text-[10px] text-[#A39E93]">
                {statusSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-[#FFD54F] bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </footer>
    );
  }

  return null;
}
