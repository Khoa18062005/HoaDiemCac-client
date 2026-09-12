import React from 'react';

export function formatCurrencyVND(amount) {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export default function TableCard({ table, onSelect }) {
  const {
    code,
    isVip,
    status,
    timeSpent,
    amount,
    hasCallStaff,
    isPaying,
  } = table;

  // 1. Trường hợp: BÀN TRỐNG (AVAILABLE)
  if (status === 'AVAILABLE') {
    return (
      <div
        onClick={() => onSelect && onSelect(table)}
        className="bg-[#171A18] rounded-xl p-4 border border-jade/40 hover:border-jade-bright transition-all flex flex-col justify-between min-h-[120px] cursor-pointer group shadow-sm font-sans"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-bold tracking-wide text-white group-hover:text-jade-bright transition-colors">
              {code}
            </span>
            {isVip && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-sans bg-gold/15 text-gold border border-gold/40">
                VIP
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-border/40 font-sans">
          <span className="text-xs font-medium text-jade-bright flex items-center gap-1.5">
            ✓ Sẵn Sàng
          </span>
          <span className="w-2 h-2 rounded-full bg-jade-bright"></span>
        </div>
      </div>
    );
  }

  // 2. Trường hợp: ĐANG DỌN DẸP (CLEANING)
  if (status === 'CLEANING') {
    return (
      <div
        onClick={() => onSelect && onSelect(table)}
        className="bg-surface-card rounded-xl p-4 border border-[#EAB308]/40 hover:border-[#EAB308] transition-all flex flex-col justify-between min-h-[120px] cursor-pointer group shadow-sm font-sans"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-bold tracking-wide text-white group-hover:text-[#EAB308] transition-colors">
              {code}
            </span>
            {isVip && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-sans bg-gold/15 text-gold border border-gold/40">
                VIP
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-border/40 font-sans">
          <span className="text-xs font-medium text-[#EAB308] flex items-center gap-1.5">
            🧹 Đang Dọn Dẹp
          </span>
          <span className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse"></span>
        </div>
      </div>
    );
  }

  // 3. Trường hợp: ĐANG PHỤC VỤ (OCCUPIED) - Cả phòng thường và phòng VIP đều có viền đỏ
  const borderClass = "border-crimson-border/60 hover:border-crimson";

  return (
    <div
      onClick={() => onSelect && onSelect(table)}
      className={`bg-surface-card rounded-xl p-4 border ${borderClass} transition-all flex flex-col justify-between min-h-[120px] relative cursor-pointer group shadow-sm font-sans`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm font-bold tracking-wide text-white group-hover:text-gold transition-colors">
            {code}
          </span>
          {isVip && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-sans bg-gold/15 text-gold border border-gold/40">
              VIP
            </span>
          )}
        </div>

        {/* Huy hiệu Gọi phục vụ rung lắc */}
        {hasCallStaff && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-crimson border border-crimson-glow text-white shadow-md shadow-crimson-glow/60 animate-badge-shake font-sans">
            <span className="text-xs">🛎️</span>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Gọi PV</span>
          </div>
        )}

        {/* Huy hiệu Đang thanh toán */}
        {isPaying && (
          <div className="flex items-center px-2.5 py-0.5 rounded-full bg-blue-600/90 border border-blue-400 text-white shadow-md shadow-blue-500/40 font-sans">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">PAYING</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-[#A0A0A5] font-normal">⏱️ {timeSpent}</span>
          <span className="text-gold font-bold">{formatCurrencyVND(amount)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-surface-border/40 font-sans">
          <span className="text-xs text-[#ff8080] font-medium">Đang phục vụ</span>
          <span className="w-2 h-2 rounded-full bg-crimson-glow"></span>
        </div>
      </div>
    </div>
  );
}
