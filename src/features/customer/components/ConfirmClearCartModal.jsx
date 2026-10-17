import React, { useEffect } from 'react';
import { Trash2, X, AlertTriangle, ChefHat } from 'lucide-react';

/**
 * ConfirmClearCartModal
 * Hộp thoại popup xác nhận khi nhấn nút "Xóa hết" giỏ hàng.
 * Hiển thị chi tiết danh sách tất cả các món ăn chuẩn bị bị xóa khỏi giỏ hàng.
 */
export default function ConfirmClearCartModal({
  isOpen,
  onClose,
  onConfirm,
  tableNumber = '',
  items = [],
  itemsCount = 0,
  totalPortions = 0,
  totalAmount = 0,
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

  if (!isOpen) return null;

  const displayItems = Array.isArray(items) ? items : [];
  const effectiveCount = itemsCount || displayItems.length;
  const effectivePortions =
    totalPortions || displayItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const effectiveAmount =
    totalAmount ||
    displayItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

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
        {/* Nền hiệu ứng trang trí */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-red-600/15 via-[#D4AF37]/15 to-transparent rounded-bl-full pointer-events-none" />

        {/* 1. Header */}
        <div className="p-4 sm:p-5 pb-3 flex items-start gap-3.5 relative z-10 border-b border-white/10 bg-[#16161A] flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7A0C16] to-[#C41E3A] border border-red-500/50 flex items-center justify-center text-[#FFD54F] shadow-lg flex-shrink-0">
            <Trash2 className="w-5 h-5 text-[#FFD54F]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#FFD54F] font-bold block mb-0.5">
              HỎA DIỆM CÁC • GIỎ HÀNG
            </span>
            <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
              Xác Nhận Xóa Hết Giỏ Hàng
            </h3>
            <p className="text-[11.5px] text-[#A39E93] mt-0.5">
              Bàn {tableNumber} • {effectivePortions} phần món ({effectiveCount} món ăn)
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

        {/* 2. Nội dung cảnh báo & Danh sách món ăn */}
        <div className="p-4 sm:p-5 space-y-3.5 relative z-10 overflow-y-auto flex-1 min-h-0">
          {/* Cảnh báo */}
          <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 flex items-start gap-3 text-red-200/90 leading-relaxed text-xs sm:text-[13px]">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p>
              Bạn có chắc chắn muốn xóa <span className="font-bold text-white">toàn bộ món</span> đang chọn trong giỏ hàng của <span className="font-bold text-amber-300">Bàn {tableNumber}</span>? Thao tác này sẽ làm rỗng giỏ hàng chưa gửi bếp.
            </p>
          </div>

          {/* Tiêu đề danh sách món */}
          {displayItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#D6D3CD] px-1 font-semibold uppercase tracking-wider">
                <span>Danh sách món ăn sẽ xóa ({displayItems.length} món)</span>
                <span>Thành tiền</span>
              </div>

              {/* Danh sách cuộn các món ăn chuẩn bị xóa */}
              <div className="max-h-48 sm:max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {displayItems.map((item, idx) => {
                  const itemTotal = (item.price || 0) * (item.quantity || 1);
                  return (
                    <div
                      key={item.id || item.menuItemId || idx}
                      className="p-2.5 sm:p-3 rounded-2xl bg-[#131316] border border-white/5 hover:border-red-500/30 transition-all flex items-start gap-2.5"
                    >
                      {/* Ảnh đại diện món */}
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-[#2A2A2E] border border-white/10"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

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
                          <p className="text-[11px] text-amber-300/80 italic flex items-center gap-1 mt-1 truncate">
                            <ChefHat className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>Ghi chú: {item.note}</span>
                          </p>
                        )}
                      </div>

                      {/* Thành tiền */}
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
            </div>
          )}

          {/* Hộp tóm tắt tổng số món và tiền bị xóa */}
          <div className="p-3.5 rounded-2xl bg-[#131316] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#A39E93]">
              <span>Tổng số món xóa:</span>
              <span className="font-bold text-white">
                {effectiveCount} món ({effectivePortions} phần)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#A39E93] pt-1.5 border-t border-white/5">
              <span>Tổng tiền tạm tính:</span>
              <span className="font-mono font-bold text-[#FFD54F] text-sm">
                {formatPrice(effectiveAmount)} ₫
              </span>
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
            Giữ Lại Giỏ Hàng
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-[#990000] via-[#C41E3A] to-[#DC2626] border border-red-400/40 shadow-[0_4px_16px_rgba(196,30,58,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 select-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xác Nhận Xóa Hết</span>
          </button>
        </div>
      </div>
    </div>
  );
}
