import React, { useMemo } from 'react';
import { Layers, Clock, Check, Utensils, AlertTriangle } from 'lucide-react';

export default function KdsAggregatedView({ orders, onToggleItemStatus }) {
  // Gom nhóm các món đang ở trạng thái 'COOKING' theo menuItemId hoặc tên món
  const aggregatedItems = useMemo(() => {
    const itemMap = new Map();

    orders.forEach((order) => {
      const createdTime = new Date(order.createdAt).getTime();

      order.items.forEach((item) => {
        if (item.status === 'COOKING') {
          const key = item.name;
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              menuItemId: item.menuItemId,
              name: item.name,
              category: item.category,
              unit: item.unit,
              totalQuantity: 0,
              oldestTime: createdTime,
              tables: [],
            });
          }

          const entry = itemMap.get(key);
          entry.totalQuantity += item.quantity;
          if (createdTime < entry.oldestTime) {
            entry.oldestTime = createdTime;
          }

          entry.tables.push({
            orderId: order.id,
            itemId: item.id,
            tableCode: order.tableCode,
            quantity: item.quantity,
            note: item.note,
            createdAt: order.createdAt,
          });
        }
      });
    });

    // Sắp xếp theo món có thời gian chờ lâu nhất lên trước
    return Array.from(itemMap.values()).sort((a, b) => a.oldestTime - b.oldestTime);
  }, [orders]);

  if (aggregatedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-[#8E8E93]">
        <Check className="w-12 h-12 text-jade mb-3" />
        <h3 className="text-base font-semibold text-white">Bếp Đã Hoàn Thành Toàn Bộ Món</h3>
        <p className="text-xs text-[#8E8E93] mt-1">Hiện không còn món nào đang chờ chế biến trong hàng đợi.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {aggregatedItems.map((group) => {
        const elapsedMins = Math.floor((Date.now() - group.oldestTime) / (60 * 1000));
        const isOverdue = elapsedMins >= 20;
        const isWarning = elapsedMins >= 15 && elapsedMins < 20;

        return (
          <div
            key={group.name}
            className={`rounded-xl border bg-[#141417] p-4 flex flex-col justify-between shadow-md transition-all ${
              isOverdue
                ? 'border-crimson animate-border-pulse-crimson'
                : isWarning
                ? 'border-amber/40'
                : 'border-surface-border'
            }`}
          >
            {/* 1. Tiêu đề món & Tổng số lượng cần làm */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-gold/80 uppercase tracking-wider block truncate">
                    {group.category}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {group.name}
                  </h3>
                </div>

                {/* Tổng số lượng nổi bật */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="font-mono text-2xl font-black text-gold bg-gold/15 border border-gold/40 px-3 py-0.5 rounded-lg">
                    {group.totalQuantity}
                  </span>
                  <span className="text-[10px] text-[#8E8E93] mt-0.5 uppercase font-medium">Tổng phần</span>
                </div>
              </div>

              {/* Thời gian chờ lâu nhất */}
              <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5] mb-3">
                <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-400' : isWarning ? 'text-amber' : 'text-jade'}`} />
                <span>Chờ lâu nhất:</span>
                <span
                  className={`font-mono font-bold ${
                    isOverdue ? 'text-red-400 font-black' : isWarning ? 'text-amber' : 'text-jade-bright'
                  }`}
                >
                  {elapsedMins} phút trước
                </span>
                {isOverdue && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-crimson text-white font-bold">
                    KHẨN CẤP
                  </span>
                )}
              </div>

              {/* 2. Chi tiết từng bàn đang chờ món này */}
              <div className="space-y-1.5 border-t border-surface-border/60 pt-3">
                <p className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wide">
                  Danh sách bàn đặt ({group.tables.length} đơn):
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {group.tables.map((t, idx) => (
                    <div
                      key={`${t.orderId}-${t.itemId}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-card border border-surface-border hover:border-gold/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-mono font-bold text-xs text-white px-2 py-0.5 rounded bg-white/10">
                          {t.tableCode}
                        </span>
                        <span className="font-mono text-xs font-semibold text-gold">
                          x{t.quantity}
                        </span>
                        {t.note && (
                          <span className="text-[11px] font-medium text-amber-300 max-w-[160px] truncate" title={t.note}>
                            {t.note}
                          </span>
                        )}
                      </div>

                      {/* Nút ra món cho riêng bàn này */}
                      <button
                        type="button"
                        onClick={() => onToggleItemStatus(t.orderId, t.itemId)}
                        className="px-2.5 py-1 rounded bg-jade/15 hover:bg-jade text-jade-bright hover:text-white border border-jade/30 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                        title="Đánh dấu ra món cho bàn này"
                      >
                        <Check className="w-3 h-3" />
                        <span>Xong</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
