import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Check,
  CheckCheck,
  RotateCcw,
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
  onUndeliverItem,
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

  // Set lưu trữ các itemId đang trong quá trình chuyển trạng thái (debounce & disable)
  const [processingItemIds, setProcessingItemIds] = useState(() => new Set());
  const lastItemClickRef = useRef({});

  // Debounce cho nút Bưng Cả Bàn
  const [isDeliveringAll, setIsDeliveringAll] = useState(false);
  const lastDeliverAllRef = useRef(0);

  const handleItemClick = (e, item) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const isReady = item.status === 'SERVED';
    const isDelivered = item.status === 'DELIVERED';
    if (!isReady && !isDelivered) return; // Món đang nấu COOKING thì không làm gì

    const itemId = item.id;
    const now = Date.now();
    const lastClick = lastItemClickRef.current[itemId] || 0;

    // Cơ chế Debounce: Bỏ qua click dồn dập trong 600ms
    if (now - lastClick < 600 || processingItemIds.has(itemId)) {
      return;
    }

    lastItemClickRef.current[itemId] = now;
    setProcessingItemIds((prev) => new Set(prev).add(itemId));

    try {
      if (isReady && onDeliverItem) {
        // SERVED -> DELIVERED (Đánh dấu đã bưng)
        onDeliverItem(order.id, itemId);
      } else if (isDelivered && onUndeliverItem) {
        // DELIVERED -> SERVED (Hoàn tác món bưng nhầm về sẵn sàng)
        onUndeliverItem(order.id, itemId);
      }
    } finally {
      setTimeout(() => {
        setProcessingItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 600);
    }
  };

  const handleDeliverAllClick = () => {
    const readyCount = order.items?.filter((i) => i.status === 'SERVED').length || 0;
    const totalCount = order.items?.length || 0;
    const deliveredCount = order.items?.filter((i) => i.status === 'DELIVERED').length || 0;
    const isCompleted = totalCount > 0 && deliveredCount === totalCount;
    if (isCompleted || readyCount === 0 || isDeliveringAll) return;

    const now = Date.now();
    if (now - lastDeliverAllRef.current < 600) return;
    lastDeliverAllRef.current = now;

    setIsDeliveringAll(true);
    try {
      if (onDeliverAllReady) {
        onDeliverAllReady(order.id);
      }
    } finally {
      setTimeout(() => setIsDeliveringAll(false), 600);
    }
  };

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
          const isProcessing = processingItemIds.has(item.id);
          const isClickable = isReady || isDelivered;
          const isButtonDisabled = !isClickable || isProcessing;

          return (
            <div
              key={item.id}
              onClick={(e) => {
                if (isButtonDisabled) return;
                handleItemClick(e, item);
              }}
              className={`py-2 px-2 rounded-lg transition-all duration-150 flex items-start justify-between gap-3 group select-none ${
                isDelivered
                  ? 'bg-surface/30 hover:bg-surface-elevated/40 border border-transparent hover:border-amber-500/30 cursor-pointer'
                  : isReady
                  ? 'animate-dish-glow-ready text-white cursor-pointer hover:bg-surface-elevated/70'
                  : 'hover:bg-surface-elevated/70 text-white cursor-default'
              }`}
              title={
                isReady
                  ? 'Bếp đã làm xong! Bấm một chạm để xác nhận ĐÃ BƯNG BÀN'
                  : isDelivered
                  ? 'Đã bưng cho khách. Bấm dòng món hoặc nút Hoàn tác để khôi phục về Chờ phục vụ (SERVED)'
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
                      isDelivered ? 'text-[#707075] line-through' : isReady ? 'text-white font-bold' : 'text-[#EDEDED]'
                    }`}
                  >
                    {item.name}
                  </p>

                  {/* Ghi chú món (chữ thuần, không viền, không icon) */}
                  {item.note && (
                    <p
                      className={`text-[11px] mt-0.5 leading-tight break-words font-medium ${
                        isDelivered ? 'text-[#707075] line-through' : 'text-amber-300'
                      }`}
                    >
                      {item.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Bên phải: Nút thao tác một chạm (One-tap action) */}
              {isDelivered ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isProcessing) handleItemClick(e, item);
                  }}
                  className={`px-2 py-1 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1 text-[11px] font-semibold active:scale-95 shadow-2xs flex-shrink-0 ${
                    isProcessing ? 'cursor-not-allowed opacity-60 pointer-events-none' : 'cursor-pointer'
                  }`}
                  title="Chạm nhầm? Bấm để HOÀN TÁC về trạng thái Sẵn sàng bưng (SERVED)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hoàn tác</span>
                </button>
              ) : isReady ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isProcessing) handleItemClick(e, item);
                  }}
                  className={`p-1.5 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 bg-jade hover:bg-jade-bright text-white border-jade shadow-[0_0_10px_rgba(52,168,83,0.6)] active:scale-95 ${
                    isProcessing ? 'cursor-not-allowed opacity-60 pointer-events-none' : 'cursor-pointer'
                  }`}
                  title="Bếp đã làm xong! Bấm để xác nhận ĐÃ BƯNG BÀN"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-1.5 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 bg-surface-card border-surface-border text-[#444] cursor-default"
                  title="Bếp đang nấu..."
                >
                  <Check className="w-4 h-4 text-[#444]" />
                </button>
              )}
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
          onClick={handleDeliverAllClick}
          disabled={isAllDelivered || readyItemsCount === 0 || isDeliveringAll}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isAllDelivered
              ? 'bg-jade/10 text-jade-bright border-jade/30 cursor-default'
              : readyItemsCount > 0
              ? 'bg-jade/20 hover:bg-jade text-jade-bright hover:text-white border-jade/40 shadow-sm active:scale-95 cursor-pointer'
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

