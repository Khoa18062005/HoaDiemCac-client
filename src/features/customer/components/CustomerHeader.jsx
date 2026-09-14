import React, { useState } from 'react';
import { ShoppingBag, Search, Bell, X, Check } from 'lucide-react';

/**
 * CustomerHeader
 * Header thích ứng đa nền tảng (Mobile, Tablet, Laptop):
 * - Mobile: Brand seal, Tên nhà hàng, Bàn XX, Nút giỏ hàng, Nút chuông gọi phục vụ.
 * - Tablet & Laptop: Mở rộng thanh tìm kiếm món ăn, nút gọi phục vụ có chữ, chỉ báo bàn VIP.
 */
export default function CustomerHeader({
  tableNumber = '08',
  cartCount = 0,
  onOpenCart,
  searchQuery = '',
  onSearchChange,
}) {
  const [calledService, setCalledService] = useState(false);

  const handleCallWaiter = () => {
    setCalledService(true);
    setTimeout(() => setCalledService(false), 3000);
  };

  return (
    <header className="flex-shrink-0 z-30 bg-[#18181C]/95 backdrop-blur-md shadow-md border-b border-[rgba(212,175,55,0.25)]">
      <div className="h-14 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. Brand Seal & Insignia */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C41E3A] to-[#8B0000] flex flex-col items-center justify-center text-[#FFE699] border border-[#D4AF37]/70 shadow-inner">
            <span className="text-[9px] font-serif font-black tracking-widest leading-tight">火燄</span>
            <span className="text-[7px] font-sans text-amber-200 font-bold uppercase tracking-tighter">閣</span>
          </div>
          <div>
            <h1 className="font-serif text-[13px] sm:text-sm font-bold tracking-tight text-[#FFD54F] leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              HỎA DIỆM CÁC
            </h1>
            <p className="text-[8px] font-semibold text-[#D4AF37]/80 uppercase tracking-widest hidden xs:block">
              Imperial Hotpot
            </p>
          </div>
        </div>

        {/* 2. Responsive Search Bar (Hiển thị trên Tablet & Laptop) */}
        {onSearchChange && (
          <div className="hidden sm:flex items-center flex-1 max-w-sm lg:max-w-md mx-2 relative">
            <Search className="w-3.5 h-3.5 text-[#D4AF37]/70 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm món lẩu, thịt bò, hải sản..."
              className="w-full h-8 pl-8 pr-7 bg-[#121215] border border-[rgba(212,175,55,0.25)] rounded-full text-xs text-[#E5E1E4] placeholder-[#7E7A75] focus:border-[#D4AF37] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-[#9E9AA0] hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 3. Actions: Call Waiter, Table Status, Cart Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
          {/* Nút Gọi Nhân Viên / Phục Vụ */}
          <button
            type="button"
            onClick={handleCallWaiter}
            title="Gọi nhân viên phục vụ tại bàn"
            className={`py-1.5 px-2 sm:px-2.5 rounded-full border text-xs font-medium flex items-center space-x-1.5 active:scale-95 transition-all select-none ${
              calledService
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-[#22181A] border-[rgba(212,175,55,0.3)] text-[#D6D3CD] hover:border-[#D4AF37]/70 hover:text-[#FFE699]'
            }`}
          >
            {calledService ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">Đã gọi!</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden md:inline text-[11px] text-[#FFE699]">Gọi phục vụ</span>
              </>
            )}
          </button>

          {/* Table Status Pill */}
          <div className="bg-[#2A1014] text-[#FFB4AB] font-bold px-2.5 py-1 rounded-full border border-[rgba(212,175,55,0.4)] flex items-center gap-1.5 shadow-xs select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[11px] font-extrabold tracking-tight text-[#FFE699] whitespace-nowrap">
              Bàn {tableNumber}
            </span>
          </div>

          {/* Quick Cart Button (chỉ hiện trên Mobile & Tablet, ẩn trên Laptop vì đã có docked sidebar) */}
          <button
            onClick={onOpenCart}
            aria-label="Giỏ Hàng"
            className="lg:hidden relative py-1.5 px-2.5 rounded-full bg-[#2A1014] text-[#FFE088] border border-[#D4AF37]/60 flex items-center space-x-1.5 active:scale-95 transition-transform shadow-xs hover:border-[#D4AF37] select-none"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span className="text-[10.5px] font-bold tracking-tight text-[#FFE699]">Giỏ</span>
            {cartCount > 0 && (
              <span className="bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-[#FFE699]/60 shadow-xs animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
