import React, { useState } from 'react';
import { BellRing, Clock, Smartphone, Sparkles, Check, Eye, EyeOff, Banknote } from 'lucide-react';

export function formatCurrencyVND(amount) {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export default function TableCard({
  table,
  onSelect,
  onResolveCallStaff,
  onResolvePaying,
}) {
  const [showPin, setShowPin] = useState(false);
  const code = table.name || table.code || table.tableNumber || 'BÀN';
  const status = table.status || 'AVAILABLE';
  const timeSpent = table.timeSpent || null;
  const amount = table.amount || 0;
  const hasCallStaff = Boolean(table.hasCallStaff);
  const isPaying = Boolean(table.isPaying);
  const currentPasscode = table.currentPasscode;
  const activeDeviceCount = table.activeDeviceCount || 0;

  // Nút hiển thị / ẩn mã PIN (dùng chung cho mọi trạng thái bàn)
  const renderPinButton = () => {
    if (!currentPasscode) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPin((prev) => !prev);
        }}
        title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
        className="flex items-center gap-2 font-mono text-xs sm:text-[13px] font-bold tracking-widest text-[#E0DDD5] bg-surface-elevated px-2.5 py-1 rounded-lg border border-surface-border cursor-pointer select-none shadow-xs"
      >
        <span className="leading-none">{showPin ? currentPasscode : '••••'}</span>
        {showPin ? (
          <EyeOff className="w-3.5 h-3.5 text-[#8E8E93] flex-shrink-0" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-[#8E8E93] flex-shrink-0" />
        )}
      </button>
    );
  };

  // 1. Trường hợp: BÀN TRỐNG (AVAILABLE)
  if (status === 'AVAILABLE') {
    return (
      <div
        onClick={() => onSelect && onSelect(table)}
        className="bg-[#171A18] rounded-xl p-4 border border-jade/40 hover:border-jade-bright transition-all flex flex-col justify-between min-h-[120px] cursor-pointer group shadow-sm font-sans"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-bold tracking-wide text-white group-hover:text-jade-bright transition-colors whitespace-nowrap">
              {code}
            </span>
          </div>
          {renderPinButton()}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-border/40 font-sans">
          <span className="text-xs font-medium text-jade-bright">
            Sẵn Sàng
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
            <span className="font-sans text-sm font-bold tracking-wide text-white group-hover:text-[#EAB308] transition-colors whitespace-nowrap">
              {code}
            </span>
          </div>
          {renderPinButton()}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-surface-border/40 font-sans">
          <span className="text-xs font-medium text-[#EAB308]">
            Đang Dọn Dẹp
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-sans text-sm font-bold tracking-wide text-white group-hover:text-gold transition-colors whitespace-nowrap">
            {code}
          </span>
        </div>

        {/* Cụm button Chuông gọi phục vụ, Icon tiền & PIN */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Button Chuông gọi phục vụ rung lắc */}
          {hasCallStaff && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onResolveCallStaff) onResolveCallStaff(table, e);
              }}
              title="Khách đang gọi nhân viên. Nhấn để tắt thông báo"
              className="flex items-center justify-center p-1.5 rounded-full bg-crimson border border-crimson-glow text-white shadow-md shadow-crimson-glow/60 animate-badge-shake font-sans hover:brightness-125 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
            >
              <BellRing className="w-3.5 h-3.5 text-white flex-shrink-0" />
            </button>
          )}

          {/* Button Icon tiền thanh toán */}
          {isPaying && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onResolvePaying) onResolvePaying(table, e);
              }}
              title="Khách đang yêu cầu thanh toán. Nhấn để tắt thông báo"
              className="flex items-center justify-center p-1.5 rounded-full bg-blue-600/90 border border-blue-400 text-white shadow-md shadow-blue-500/40 font-sans hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
            >
              <Banknote className="w-3.5 h-3.5 text-white flex-shrink-0" />
            </button>
          )}

          {renderPinButton()}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-[#A0A0A5] font-normal flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#8E8E93]" />
            <span>{timeSpent || 'Vừa vào'}</span>
          </span>
          <span className="text-gold font-bold">{formatCurrencyVND(amount)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-surface-border/40 font-sans">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#ff8080] font-medium whitespace-nowrap">Đang phục vụ</span>
            {activeDeviceCount > 0 && (
              <span className="text-[10px] text-[#A0A0A5] bg-surface-elevated px-1.5 py-0.5 rounded border border-surface-border/60 flex items-center gap-1">
                <Smartphone className="w-2.5 h-2.5 text-[#8E8E93]" />
                <span>{activeDeviceCount}</span>
              </span>
            )}
          </div>
          <span className="w-2 h-2 rounded-full bg-crimson-glow flex-shrink-0"></span>
        </div>
      </div>
    </div>
  );
}
