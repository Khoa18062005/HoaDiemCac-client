import React, { useState, useEffect } from 'react';
import {
  Clock,
  Check,
  RotateCcw,
  CheckCheck,
  AlertCircle,
  Flame,
  Sparkles,
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

export default function KdsOrderCard({
  order,
  onToggleItemStatus,
  onCompleteAllItems,
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

  // Phân loại mức độ cảnh báo thời gian chờ theo FIFO:
  // - Dưới 15 phút: Bình thường (Xanh lá - Jade)
  // - 15 - 20 phút: Cần chú ý (Vàng cam - Amber)
  // - Từ 20 phút trở lên: Cảnh báo khẩn cấp (Đỏ đế vương - Crimson)
  const isOverdue = minutes >= 20;
  const isWarning = minutes >= 15 && minutes < 20;

  const totalItems = order.items.length;
  const completedItemsCount = order.items.filter(
    (i) => i.status === 'SERVED' || i.status === 'DELIVERED'
  ).length;
  const isAllServed = totalItems > 0 && completedItemsCount === totalItems;

  // Sắp xếp các món: Món chưa chế biến (COOKING) đưa lên trên, món đã hoàn thành (SERVED hoặc DELIVERED) trôi xuống dưới
  const sortedItems = [...order.items].sort((a, b) => {
    const aDone = a.status === 'SERVED' || a.status === 'DELIVERED';
    const bDone = b.status === 'SERVED' || b.status === 'DELIVERED';
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;
    return 0;
  });

  // Màu viền và màu thẻ theo trạng thái
  let cardBorderColor = 'border-surface-border';
  let headerBgColor = 'bg-[#18181C]';
  let badgeColor = 'bg-jade/15 text-jade-bright border-jade/30';

  if (isAllServed) {
    cardBorderColor = 'border-jade/40 opacity-70';
    headerBgColor = 'bg-jade/10';
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
      {/* 1. Header thẻ đơn: Số bàn, Khu vực, Đợt & Timer */}
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

      {/* 2. Danh sách món ăn trong đợt order (Tối đa 5 món, từ món thứ 6 cuộn trong thanh cuộn) */}
      <div className="p-3 divide-y divide-surface-border/50 flex-1 space-y-1 max-h-[285px] overflow-y-auto pr-1">
        {sortedItems.map((item) => {
          const isServed = item.status === 'SERVED';
          const isDelivered = item.status === 'DELIVERED';
          const isDone = isServed || isDelivered;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isDelivered) return; // Món đã bưng cho khách thì không hoàn tác về COOKING
                onToggleItemStatus(order.id, item.id);
              }}
              className={`py-2 px-2 rounded-lg cursor-pointer transition-all duration-150 flex items-start justify-between gap-3 group select-none ${
                isDone
                  ? 'bg-surface/40 text-[#8E8E93] line-through'
                  : 'hover:bg-surface-elevated/70 text-white'
              }`}
              title={
                isDelivered
                  ? 'Món đã được phục vụ bưng lên bàn cho khách'
                  : isServed
                  ? 'Bếp đã nấu xong (Chờ phục vụ bưng). Nhấn để hoàn tác (COOKING)'
                  : 'Nhấn một chạm để ĐÁNH DẤU HOÀN THÀNH'
              }
            >
              {/* Bên trái: Số lượng & Tên món */}
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                {/* Số lượng */}
                <span
                  className={`flex-shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded border transition-colors ${
                    isDone
                      ? 'bg-gray-800 text-gray-500 border-gray-700'
                      : 'bg-gold/15 text-gold border-gold/40 group-hover:bg-gold group-hover:text-black'
                  }`}
                >
                  x{item.quantity}
                </span>

                {/* Tên món & Ghi chú */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium leading-tight ${isDone ? 'text-[#707075]' : 'text-[#EDEDED]'}`}>
                    {item.name}
                  </p>

                  {/* Ghi chú bếp (dạng chữ thuần, không khung, không icon) */}
                  {item.note && (
                    <p className={`text-[11px] mt-0.5 leading-tight break-words font-medium ${isDone ? 'text-[#707075]' : 'text-amber-300'}`}>
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
                  if (isDelivered) return;
                  onToggleItemStatus(order.id, item.id);
                }}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
                  isDelivered
                    ? 'bg-jade/25 border-jade/50 text-jade-bright cursor-default'
                    : isServed
                    ? 'bg-jade/20 border-jade/40 text-jade-bright hover:bg-jade/30'
                    : 'bg-surface-card border-surface-border text-[#8E8E93] hover:border-gold hover:text-gold hover:bg-surface-elevated'
                }`}
                title={
                  isDelivered
                    ? 'Đã bưng lên bàn'
                    : isServed
                    ? 'Đã nấu xong. Bấm để hoàn tác'
                    : 'Bấm để đánh dấu đã chế biến xong'
                }
              >
                {isDelivered ? (
                  <CheckCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                ) : isServed ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Footer: Mã đơn, Thời gian đặt & Nút "Hoàn thành toàn bộ đợt" */}
      <div className="p-3 bg-[#111114] border-t border-surface-border flex items-center justify-between gap-2">
        <div className="overflow-hidden">
          <span className="font-mono text-[11px] text-[#8E8E93] block truncate">
            {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-gold/80 block">
            Tiến độ: {completedItemsCount}/{totalItems} món
          </span>
        </div>

        {/* Nút hoàn thành toàn bộ đợt */}
        <button
          type="button"
          onClick={() => onCompleteAllItems(order.id)}
          disabled={isAllServed}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isAllServed
              ? 'bg-jade/10 text-jade-bright border-jade/30 cursor-default'
              : 'bg-gold/15 hover:bg-gold text-gold hover:text-black border-gold/40 active:scale-95'
          }`}
        >
          {isAllServed ? (
            <>
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã Xong</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Ra Cả Bàn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
