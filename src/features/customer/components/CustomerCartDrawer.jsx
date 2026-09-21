import React, { useState } from 'react';
import {
  X,
  Trash2,
  ChefHat,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Minus,
  Clock,
  UtensilsCrossed,
  Crown,
  Lock,
} from 'lucide-react';

/**
 * CustomerCartDrawer
 * Ngăn kéo trượt từ dưới lên (Bottom Sheet) hiển thị chi tiết giỏ hàng trên Mobile & iPad:
 * - 2 danh mục: "Chọn món" (các món đang chọn chưa gửi bếp) và "Tất cả" (toàn bộ món đã gửi bếp).
 * - Món gửi thêm ở các lần sau hiển thị tách biệt thành từng thẻ riêng (kèm giờ gọi, trạng thái), không gộp vào lần trước.
 */
export default function CustomerCartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  orderedItems = [],
  tableNumber = '08',
  isHost = true,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
  onUpdateNote,
}) {
  const [activeTab, setActiveTab] = useState('draft'); // 'draft' ('Chọn món') | 'all' ('Tất cả')
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const draftCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const draftAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalOrderedCount = orderedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalOrderedAmount = orderedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handleConfirmSubmit = () => {
    if (cartItems.length === 0) return;
    setIsSuccess(true);

    setTimeout(() => {
      if (onSubmitOrder) {
        onSubmitOrder({
          tableNumber,
          items: cartItems,
          totalAmount: draftAmount,
        });
      }
      setIsSuccess(false);
      setActiveTab('all');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-up Container constrained to mobile & tablet width */}
      <div className="relative w-full max-w-lg bg-[#16161A] border-t border-[rgba(212,175,55,0.4)] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-200 select-none">
        {/* Drawer Pull Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1.5 flex-shrink-0" />

        {/* 1. Header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#18181C]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#2A050A] border border-[#D4AF37]/60 flex items-center justify-center text-[#FFD54F] shadow-inner flex-shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 text-[#FFD54F] stroke-[2]" />
            </div>
            <h2 className="font-serif text-base font-bold text-[#FFE699]">
              Giỏ Hàng Bàn {tableNumber}
            </h2>
            <span className="text-[10px] bg-[#2A1014] text-[#FFB4AB] border border-[#C41E3A]/40 px-2 py-0.5 rounded-full font-bold">
              {activeTab === 'draft' ? `${draftCount} món` : `${totalOrderedCount} món`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full bg-white/5 text-[#D6D3CD] flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Segmented Tab Bar: Chọn món vs Tất cả (Hiệu ứng trượt lướt mượt mà) */}
        <div className="relative border-b border-white/10 bg-[#18181C] px-4 pt-1 flex-shrink-0">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('draft')}
              className={`w-1/2 pb-2 text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'draft'
                  ? 'text-[#FFE088]'
                  : 'text-[#9E9AA0] hover:text-[#D6D3CD]'
              }`}
            >
              <span>Chọn món</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  activeTab === 'draft'
                    ? 'bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white shadow-xs'
                    : 'bg-white/10 text-[#A39E93]'
                }`}
              >
                {draftCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`w-1/2 pb-2 text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'text-[#FFE088]'
                  : 'text-[#9E9AA0] hover:text-[#D6D3CD]'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white shadow-xs'
                    : 'bg-white/10 text-[#A39E93]'
                }`}
              >
                {totalOrderedCount}
              </span>
            </button>
          </div>

          {/* Thanh ngang trượt qua trượt lại mượt mà (Smooth Sliding Indicator) */}
          <div className="relative w-full h-0.5">
            <div
              className={`absolute top-0 bottom-0 w-1/2 px-3 transition-transform duration-300 ease-out ${
                activeTab === 'draft' ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-r from-[#C41E3A] via-[#FFD54F] to-[#C41E3A] shadow-[0_0_8px_rgba(255,213,79,0.6)] rounded-full" />
            </div>
          </div>
        </div>

        {/* 3. Content */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            <h3 className="font-serif text-lg font-bold text-[#FFE699]">
              Đã Gửi Đơn Vào Bếp Thành Công!
            </h3>
            <p className="text-xs text-[#D6D3CD] max-w-xs">
              Các đầu bếp tại Hỏa Diệm Các đang chuẩn bị những món lẩu ngon lành nhất cho Bàn {tableNumber}.
            </p>
          </div>
        ) : activeTab === 'draft' ? (
          /* TAB 1: CHỌN MÓN */
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-[#9E9AA0] space-y-2">
                  <ShoppingBag className="w-12 h-12 text-[#D4AF37]/40 stroke-[1.5]" />
                  <p className="text-sm font-medium text-[#D6D3CD]">
                    Chưa có món nào đang chọn
                  </p>
                  <p className="text-xs max-w-xs text-[#9E9AA0]">
                    Vui lòng duyệt qua thực đơn và nhấn dấu (+) để chọn những món ăn hấp dẫn.
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#1D1D22] rounded-xl p-2.5 border border-white/5 space-y-2"
                  >
                    <div className="flex gap-2.5 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-[#2A2A2E]"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#FDFBF7] truncate">
                          {item.name}
                        </h4>
                        <div className="text-[12px] font-bold text-[#FFD54F] mt-1">
                          {formatPrice(item.price * item.quantity)} ₫
                        </div>
                      </div>

                      {/* Stepper + Remove */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 bg-[#141418] px-1.5 py-0.5 rounded-full border border-[rgba(212,175,55,0.25)]">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-5 h-5 rounded-full bg-[#2A2A30] text-[#D6D3CD] flex items-center justify-center active:scale-90"
                          >
                            <Minus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-bold text-[#FDFBF7] px-1 min-w-[14px] text-center leading-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-5 h-5 rounded-full bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white flex items-center justify-center active:scale-90"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          aria-label="Xóa món"
                          className="w-7 h-7 rounded-lg text-[#FFB4AB]/70 hover:text-[#FFB4AB] hover:bg-[#3E1118] flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Ghi chú riêng cho từng món */}
                    <div className="pt-1.5 border-t border-white/5 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-[#FFD54F]/70 flex-shrink-0" />
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => onUpdateNote && onUpdateNote(item.id, e.target.value)}
                        placeholder="Ghi chú cho đầu bếp (VD: ít cay, không hành...)"
                        className="flex-1 bg-[#141418] border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-[#FDFBF7] placeholder-[#6A655C] focus:border-[#C41E3A] outline-none transition-colors"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Submit */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-[#18181C] space-y-3 flex-shrink-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#D6D3CD] uppercase tracking-wider font-semibold">
                    Tổng cộng:
                  </span>
                  <div className="flex items-baseline">
                    <span className="text-lg font-black text-[#FFD54F] tracking-tight">
                      {formatPrice(draftAmount)}
                    </span>
                    <span className="text-xs font-bold text-[#FFD54F] ml-0.5">₫</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="px-3 py-2.5 rounded-xl border border-white/10 text-xs text-[#A39E93] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                  >
                    Xóa hết
                  </button>

                  {isHost ? (
                    <button
                      type="button"
                      onClick={handleConfirmSubmit}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#990000] via-[#C41E3A] to-[#E63946] text-white font-extrabold text-xs shadow-[0_4px_16px_rgba(196,30,58,0.5)] active:scale-95 transition-transform flex items-center justify-center space-x-1.5 border border-[#FFE699]/30 hover:brightness-110 select-none"
                    >
                      <Crown className="w-3.5 h-3.5 text-gold" />
                      <span>Xác Nhận Gửi Bếp ({draftCount} món)</span>
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => alert('Bạn đang là Thành viên của bàn. Chỉ Chủ Bàn mới có quyền bấm Gửi Bếp để tránh đặt nhầm hoặc quậy phá.')}
                        className="w-full py-2.5 px-3 rounded-xl bg-zinc-800/90 text-zinc-300 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90 shadow-sm select-none"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chờ Chủ Bàn Gửi Bếp ({draftCount} món)</span>
                      </button>
                      <p className="text-[10px] text-amber-400/90 mt-1 italic">
                        Chỉ Chủ Bàn mới có quyền gửi đơn vào bếp
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* TAB 2: TẤT CẢ (Toàn bộ món đã gửi bếp, tách biệt từng lần gọi) */
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
              {orderedItems.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-[#9E9AA0] space-y-2">
                  <UtensilsCrossed className="w-12 h-12 text-[#D4AF37]/40 stroke-[1.5]" />
                  <p className="text-sm font-medium text-[#D6D3CD]">
                    Chưa có món nào được gửi bếp
                  </p>
                  <p className="text-xs max-w-xs text-[#9E9AA0]">
                    Các món sau khi bấm "Gửi Vào Bếp" sẽ hiển thị tại đây để bạn tiện theo dõi trạng thái chế biến.
                  </p>
                </div>
              ) : (
                orderedItems.map((item) => (
                  <div
                    key={item.entryId}
                    className="bg-[#1D1D22] rounded-xl p-2.5 border border-white/5 space-y-2"
                  >
                    <div className="flex gap-2.5 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-[#2A2A2E]"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-[#FDFBF7] truncate">
                            {item.name}
                          </h4>
                          <span className="text-[12px] font-bold text-[#FFD54F] flex-shrink-0">
                            {formatPrice(item.price * item.quantity)} ₫
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-[10.5px]">
                          <div className="flex items-center gap-1.5 text-[#A39E93]">
                            <span className="bg-[#2A2A30] text-[#D6D3CD] font-bold px-1.5 py-0.2 rounded text-[10px]">
                              x{item.quantity}
                            </span>
                            {item.orderedAt && (
                              <span className="flex items-center gap-0.5 text-[#9E9AA0] text-[10px]">
                                <Clock className="w-2.5 h-2.5" />
                                {item.orderedAt}
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          {item.status === 'served' || item.status === 'SERVED' || item.status === 'DELIVERED' || item.status === 'delivered' ? (
                            <span className="bg-[#0A2E1D] text-[#59DE9B] border border-[#007448]/60 px-2 py-0.5 rounded-full font-bold text-[9.5px] flex items-center gap-1 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#59DE9B]" />
                              Đã phục vụ
                            </span>
                          ) : (
                            <span className="bg-[#2A1508] text-[#FFB74D] border border-[#FF9800]/50 px-2 py-0.5 rounded-full font-bold text-[9.5px] flex items-center gap-1 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB74D] animate-pulse" />
                              Đang chế biến
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ghi chú riêng nếu có */}
                    {item.note && (
                      <div className="pt-1.5 border-t border-white/5 flex items-center gap-1.5 text-[10.5px] text-[#FFE088]">
                        <ChefHat className="w-3 h-3 text-[#FFD54F]/80 flex-shrink-0" />
                        <span className="truncate italic">Ghi chú: {item.note}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary for Tab Tất cả */}
            {orderedItems.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-[#18181C] space-y-2 flex-shrink-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#D6D3CD] uppercase tracking-wider font-semibold">
                    Tổng tạm tính ({totalOrderedCount} món):
                  </span>
                  <div className="flex items-baseline">
                    <span className="text-lg font-black text-[#FFD54F] tracking-tight">
                      {formatPrice(totalOrderedAmount)}
                    </span>
                    <span className="text-xs font-bold text-[#FFD54F] ml-0.5">₫</span>
                  </div>
                </div>
                <p className="text-[10.5px] text-[#A39E93] text-center italic">
                  Món ăn đã gửi vào bếp. Vui lòng gọi nhân viên nếu cần hỗ trợ.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
