import React, { useState } from 'react';
import { PackageX, X, Loader2 } from 'lucide-react';

/**
 * Modal Xác Nhận Báo Hết Món Khẩn Cấp từ Bếp KDS (UC19)
 * Khi xác nhận:
 * - Cập nhật trạng thái món ăn trong DB thành hết hàng (isAvailable = false)
 * - Hiển thị watermark SOLD OUT trên menu khách hàng theo thời gian thực
 * - Tự động xóa món khỏi order của các bàn đã đặt và gửi thông báo lịch thiệp
 */
export default function ConfirmOutOfStockModal({
  isOpen,
  onClose,
  target, // { order, item }
  onConfirm,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !target || !target.item) return null;

  const { order, item } = target;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(order, item);
      onClose();
    } catch (err) {
      console.error('Lỗi khi xác nhận báo hết món:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-[#141418] border border-amber/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#19191E] border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber flex-shrink-0">
              <PackageX className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                Xác Nhận Báo Hết Món
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                Hệ thống Bếp KDS • Hỏa Diệm Các
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung xác nhận */}
        <div className="p-5 space-y-4">
          {/* Thông tin món ăn */}
          <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border/80 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-black border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={item.image || 'https://placehold.co/100x100/1e1e22/d4af37?text=MÓN'}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/100x100/1e1e22/d4af37?text=MÓN';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-amber font-mono font-medium block">
                Phát hiện từ: {order?.tableCode || 'Bàn khách'}
              </span>
              <h4 className="text-sm font-bold text-white truncate">
                {item.name}
              </h4>
              <p className="text-xs text-gold/80 font-mono">
                Số lượng trên bàn: x{item.quantity}
              </p>
            </div>
          </div>

          {/* Câu hỏi xác nhận ngắn gọn */}
          <p className="text-xs text-[#A0A0A5] leading-relaxed">
            Bạn có chắc chắn muốn báo hết món <span className="font-semibold text-white">"{item.name}"</span> trên toàn hệ thống không?
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-[#101014] border-t border-surface-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-white bg-surface-card hover:bg-surface-elevated border border-surface-border transition-all"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-crimson to-red-700 hover:brightness-110 shadow-lg shadow-red-950/50 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <PackageX className="w-3.5 h-3.5" />
                <span>Xác Nhận Hết Món</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
