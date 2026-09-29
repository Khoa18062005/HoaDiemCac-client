import React from 'react';
import { Plus, Minus, Lock } from 'lucide-react';

/**
 * CustomerDishCard
 * Thẻ món ăn tối ưu mobile, tablet và laptop theo chuẩn thiết kế Imperial Hotpot.
 * Đã bỏ hoàn toàn bộ chọn nửa phần / cả phần theo yêu cầu.
 */
export default function CustomerDishCard({
  dish,
  cartQuantity = 0,
  isOrderLocked = false,
  onAddToCart,
  onUpdateQuantity,
}) {
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <article
      className="bg-[#1D1D22] rounded-2xl p-2.5 border border-[rgba(212,175,55,0.2)] shadow-sm flex gap-2.5 sm:gap-3 items-center transition-all hover:border-[rgba(212,175,55,0.35)]"
      data-purpose="dish-card"
    >
      {/* Dish Thumbnail: Khung chứa cố định tương tự Ba Chỉ Bò Mỹ */}
      <div className="w-28 h-[104px] sm:w-32 sm:h-[108px] rounded-xl overflow-hidden flex-shrink-0 relative bg-[#2A2A2E]">
        <img
          src={dish.image}
          alt={dish.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all ${
            dish.isAvailable === false ? 'opacity-40 grayscale-[40%]' : ''
          }`}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* Status Badge */}
        {dish.tag && dish.isAvailable !== false && (
          <span
            className={`absolute top-1 left-1 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs select-none ${
              dish.tagType === 'crimson'
                ? 'bg-gradient-to-r from-[#990000] to-[#C41E3A] text-[#FFE088] border border-[rgba(212,175,55,0.4)]'
                : dish.tagType === 'jade'
                ? 'bg-[#007448] text-[#E5E1E4] border border-[#59DE9B]/40'
                : 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#342800] font-black'
            }`}
          >
            {dish.tag}
          </span>
        )}

        {/* Watermark SOLD OUT Realtime */}
        {dish.isAvailable === false && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[1px] flex items-center justify-center p-1 select-none">
            <div className="border-2 border-dashed border-red-500/90 bg-red-950/90 px-2 py-0.5 rounded shadow-xl transform -rotate-12 flex items-center justify-center">
              <span className="text-[11px] sm:text-xs font-black text-red-200 tracking-wider uppercase drop-shadow-md">
                SOLD OUT
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dish Info & Actions */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-[104px] sm:h-[108px]">
        <div>
          <h3 className={`font-bold text-[13px] sm:text-[14px] leading-snug line-clamp-1 ${
            dish.isAvailable === false ? 'text-[#8E8E93] line-through' : 'text-[#FDFBF7]'
          }`}>
            {dish.name}
          </h3>

          <p className="text-[10.5px] sm:text-[11px] text-[#9E9AA0] line-clamp-2 mt-1.5 sm:mt-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Price & Stepper Button Bar */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
          <div className="flex items-baseline">
            <span className={`text-[14px] font-black tracking-tight ${
              dish.isAvailable === false ? 'text-[#8E8E93]' : 'text-[#FFD54F]'
            }`}>
              {formatPrice(dish.price)}
            </span>
            <span className={`text-[11px] font-bold ml-0.5 ${
              dish.isAvailable === false ? 'text-[#8E8E93]' : 'text-[#FFD54F]'
            }`}>₫</span>
          </div>

          {/* Action: Add Button, Stepper or Out of Stock Tag */}
          <div className="h-[34px] flex items-center flex-shrink-0">
            {dish.isAvailable === false ? (
              <span className="text-[11px] font-bold text-red-400 bg-red-950/50 border border-red-500/30 px-2.5 py-1 rounded-lg select-none shadow-2xs">
                Tạm hết
              </span>
            ) : isOrderLocked ? (
              <div
                title="Bàn đang chốt hóa đơn, order đã được đóng băng"
                className="h-7 px-2.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 text-[10px] font-bold flex items-center gap-1 select-none cursor-not-allowed opacity-75 shadow-xs"
              >
                <Lock className="w-3 h-3 text-amber-400/80" />
                <span>Đã Khóa</span>
              </div>
            ) : cartQuantity === 0 ? (
              <button
                type="button"
                onClick={() => onAddToCart(dish, dish.price)}
                aria-label={`Thêm ${dish.name}`}
                className="w-7 h-7 rounded-full bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white flex items-center justify-center shadow-[0_0_8px_rgba(196,30,58,0.4)] active:scale-90 transition-transform hover:brightness-110"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <div className="h-[34px] flex items-center space-x-1.5 bg-[#141418] p-0.5 rounded-full border border-[rgba(212,175,55,0.25)] select-none box-border">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(dish.id, cartQuantity - 1)}
                  aria-label="Giảm"
                  className="w-7 h-7 rounded-full bg-[#2A2A30] text-[#D6D3CD] flex items-center justify-center shadow-2xs active:scale-90 hover:bg-[#3A3A42] transition-transform"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="text-xs font-bold text-[#FDFBF7] px-1 min-w-[16px] text-center leading-none">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(dish.id, cartQuantity + 1)}
                  aria-label="Tăng"
                  className="w-7 h-7 rounded-full bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white flex items-center justify-center shadow-[0_0_8px_rgba(196,30,58,0.4)] active:scale-90 hover:brightness-110 transition-transform"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
