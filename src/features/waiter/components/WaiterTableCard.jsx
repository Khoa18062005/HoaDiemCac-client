import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';

/**
 * Format thời gian chờ (elapsed time) sang định dạng MM:SS hoặc HH:MM:SS
 */
function formatElapsed(seconds) {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function WaiterTableCard({
  order,
  onDeliverItem,
  onDeliverAllReady,
}) {
  // Bộ đếm thời gian trôi qua thực tế
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const createdTime = new Date(order.createdAt).getTime();
    return Math.max(0, Math.floor((Date.now() - createdTime) / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const createdTime = new Date(order.createdAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - createdTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const minutes = Math.floor(elapsedSeconds / 60);

  // Phân loại mức độ cảnh báo thời gian chờ giống KDS:
  // - Dưới 15 phút: Xanh lá (Jade)
  // - 15 - 20 phút: Vàng cam (Amber)
  // - Từ 20 phút trở lên: Đỏ đế vương (Crimson) kèm viền nhấp nháy
  const isOverdue = minutes >= 20;
  const isWarning = minutes >= 15 && minutes < 20;

  const totalItems = order.items.length;
  const readyItemsCount = order.items.filter((i) => i.status === 'SERVED').length;
  const deliveredItemsCount = order.items.filter((i) => i.status === 'DELIVERED').length;
  const isAllDelivered = totalItems > 0 && deliveredItemsCount === totalItems;

  // Sắp xếp các món:
  // 1. Món Bếp đã nấu xong (SERVED - SÁNG ĐÈN) lên đầu để nhân viên thấy bưng ngay
  // 2. Món đang nấu (COOKING) ở giữa
  // 3. Món đã bưng (DELIVERED) trôi xuống đáy
  const sortedItems = useMemo(() => {
    return [...order.items].sort((a, b) => {
      const getPriority = (status) => {
        if (status === 'SERVED') return 1;
        if (status === 'COOKING') return 2;
        return 3;
      };
      return getPriority(a.status) - getPriority(b.status);
    });
  }, [order.items]);

  // Màu viền và màu thẻ đồng bộ với giao diện Bếp
  let cardBorderColor = 'border-surface-border';
  let headerBgColor = 'bg-[#18181C]';
  let badgeColor = 'bg-jade/15 text-jade-bright border-jade/30';

  if (isAllDelivered) {
    cardBorderColor = 'border-jade/40 opacity-70';
    headerBgColor = 'bg-jade/10';
  } else if (readyItemsCount > 0) {
    cardBorderColor = 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]';
    headerBgColor = 'bg-emerald-950/40';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (isOverdue) {
    cardBorderColor = 'border-crimson animate-border-pulse-crimson';
    headerBgColor = 'bg-crimson/20';
    badgeColor = 'bg-crimson text-white font-bold border-crimson/60';
  } else if (isWarning) {
    cardBorderColor = 'border-amber/50';
    headerBgColor = 'bg-amber/10';
    badgeColor = 'bg-amber/20 text-amber border-amber/40';
  }

  const isVip = order.area === 'VIP' || order.tableCode?.startsWith('VIP');

  return (
    <div
      className={`rounded-xl border ${cardBorderColor} bg-[#141417] flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-md`}
    >
      {/* 1. Header thẻ đơn: Số bàn & Timer (Phong cách chuẩn Bếp KDS) */}
      <div className={`${headerBgColor} px-3.5 py-2.5 border-b border-surface-border flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {/* Huy hiệu số bàn */}
          <span
            className={`font-mono font-bold text-sm sm:text-base px-2.5 py-0.5 rounded border ${
              isVip
                ? 'bg-gold/20 text-gold border-gold/40'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            {order.tableCode}
          </span>
        </div>

        {/* Bộ đếm thời gian trôi qua (Elapsed Timer) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${badgeColor}`}
          title={`Thời gian chờ từ lúc gửi đơn: ${formatElapsed(elapsedSeconds)}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>

      {/* 2. Danh sách món ăn (Tối đa 5 món, từ món thứ 6 cuộn trong thanh cuộn) */}
      <div className="p-3 divide-y divide-surface-border/50 flex-1 space-y-1 max-h-[285px] overflow-y-auto pr-1">
        {sortedItems.map((item) => {
          const isReady = item.status === 'SERVED';
          const isDelivered = item.status === 'DELIVERED';

          return (
            <div
              key={item.id}
              onClick={() => isReady && onDeliverItem(order.id, item.id)}
              className={`py-2 px-2 rounded-lg cursor-pointer transition-all duration-150 flex items-start justify-between gap-3 group select-none ${
                isDelivered
                  ? 'bg-surface/40 text-[#8E8E93] line-through'
                  : isReady
                  ? 'animate-dish-glow-ready text-white'
                  : 'hover:bg-surface-elevated/70 text-white'
              }`}
              title={
                isReady
                  ? 'Bếp đã làm xong! Bấm một chạm để xác nhận ĐÃ BƯNG BÀN'
                  : isDelivered
                  ? 'Đã giao cho khách'
                  : 'Bếp đang chế biến...'
              }
            >
              {/* Bên trái: Số lượng & Tên món */}
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {/* Số lượng */}
                <span
                  className={`flex-shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded border transition-colors ${
                    isDelivered
                      ? 'bg-gray-800 text-gray-500 border-gray-700'
                      : isReady
                      ? 'bg-jade text-white border-jade shadow-sm'
                      : 'bg-gold/15 text-gold border-gold/40 group-hover:bg-gold group-hover:text-black'
                  }`}
                >
                  x{item.quantity}
                </span>

                {/* Tên món & Ghi chú */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-medium leading-tight ${
                      isDelivered ? 'text-[#707075]' : isReady ? 'text-white font-bold' : 'text-[#EDEDED]'
                    }`}
                  >
                    {item.name}
                  </p>

                  {/* Ghi chú món (chữ thuần, không viền, không icon) */}
                  {item.note && (
                    <p
                      className={`text-[11px] mt-0.5 leading-tight break-words font-medium ${
                        isDelivered ? 'text-[#707075]' : 'text-amber-300'
                      }`}
                    >
                      {item.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Bên phải: Nút thao tác một chạm (One-tap action) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isReady) onDeliverItem(order.id, item.id);
                }}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
                  isDelivered
                    ? 'bg-jade/20 border-jade/40 text-jade-bright'
                    : isReady
                    ? 'bg-jade hover:bg-jade-bright text-white border-jade shadow-[0_0_10px_rgba(52,168,83,0.6)] active:scale-95'
                    : 'bg-surface-card border-surface-border text-[#444] cursor-default'
                }`}
                title={
                  isReady
                    ? 'Bếp đã làm xong! Bấm để xác nhận ĐÃ BƯNG BÀN'
                    : isDelivered
                    ? 'Đã bưng cho khách'
                    : 'Bếp đang nấu...'
                }
              >
                {isDelivered ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : isReady ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Check className="w-4 h-4 text-[#444]" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Footer: Thời gian đặt, Tiến độ & Nút "Bưng Cả Bàn" (Chuẩn KDS) */}
      <div className="p-3 bg-[#111114] border-t border-surface-border flex items-center justify-between gap-2">
        <div className="overflow-hidden">
          <span className="font-mono text-[11px] text-[#8E8E93] block truncate">
            {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-gold/80 block">
            Tiến độ: {deliveredItemsCount}/{totalItems} món
          </span>
        </div>

        {/* Nút bưng cả bàn */}
        <button
          type="button"
          onClick={() => onDeliverAllReady(order.id)}
          disabled={isAllDelivered || readyItemsCount === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isAllDelivered
              ? 'bg-jade/10 text-jade-bright border-jade/30 cursor-default'
              : readyItemsCount > 0
              ? 'bg-jade/20 hover:bg-jade text-jade-bright hover:text-white border-jade/40 shadow-sm active:scale-95'
              : 'bg-gold/15 text-gold/50 border-gold/20 cursor-default'
          }`}
        >
          {isAllDelivered ? (
            <>
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã Xong</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Bưng Cả Bàn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
