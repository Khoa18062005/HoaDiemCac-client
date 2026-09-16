import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  WaiterHeader,
  WaiterTableCard,
} from '@/features/waiter';
import useKdsStore, { playChimeSound } from '@/stores/useKdsStore';
import {
  Sparkles,
  BellRing,
  X,
  CheckCircle,
} from 'lucide-react';

export default function WaiterDisplayPage() {
  const orders = useKdsStore((state) => state.orders);
  const deliverItem = useKdsStore((state) => state.deliverItem);
  const deliverAllReadyItems = useKdsStore((state) => state.deliverAllReadyItems);
  const simulateNewOrder = useKdsStore((state) => state.simulateNewOrder);
  const lastBroadcastEvent = useKdsStore((state) => state.lastBroadcastEvent);

  // Bộ lọc khu vực
  const [areaFilter, setAreaFilter] = useState('all'); // 'all' | 'COMMON' | 'VIP'

  // Âm thanh chuông báo
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    return localStorage.getItem('waiter_audio_muted') === 'true';
  });

  const toggleAudio = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      localStorage.setItem('waiter_audio_muted', String(next));
      return next;
    });
  }, []);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info'); // 'info' | 'success' | 'ready'

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Lắng nghe sự kiện từ Bếp để phát chuông & báo toast
  useEffect(() => {
    if (!lastBroadcastEvent) return;

    if (
      lastBroadcastEvent.type === 'KITCHEN_ITEM_STATUS_TOGGLED' &&
      lastBroadcastEvent.nextStatus === 'SERVED'
    ) {
      showToast(lastBroadcastEvent.message, 'ready');
      if (!isAudioMuted) {
        playChimeSound();
      }
    } else if (lastBroadcastEvent.type === 'KITCHEN_ALL_ITEMS_COMPLETED') {
      showToast(lastBroadcastEvent.message, 'ready');
      if (!isAudioMuted) {
        playChimeSound();
      }
    } else if (lastBroadcastEvent.type === 'NEW_ORDER_RECEIVED') {
      showToast(lastBroadcastEvent.message, 'info');
    }
  }, [lastBroadcastEvent, isAudioMuted, showToast]);

  // Đếm tổng số món đang chờ bưng (Bếp đã xong)
  const totalReadyDishes = useMemo(() => {
    return orders.reduce((acc, order) => {
      return (
        acc +
        order.items.filter((item) => item.status === 'SERVED').length
      );
    }, 0);
  }, [orders]);

  // Thao tác bưng 1 món
  const handleDeliverItem = useCallback(
    (orderId, itemId) => {
      const res = deliverItem(orderId, itemId);
      showToast(res.message, 'success');
    },
    [deliverItem, showToast]
  );

  // Thao tác bưng toàn bộ món sẵn sàng của bàn
  const handleDeliverAllReady = useCallback(
    (orderId) => {
      const res = deliverAllReadyItems(orderId);
      showToast(res.message, 'success');
    },
    [deliverAllReadyItems, showToast]
  );

  // Giả lập đơn mới
  const handleSimulate = useCallback(() => {
    const res = simulateNewOrder();
    showToast(res.message, 'info');
  }, [simulateNewOrder, showToast]);

  // Lọc và sắp xếp các bàn
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Lọc khu vực
        if (areaFilter !== 'all' && order.area !== areaFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Ưu tiên đưa bàn có món chờ bưng (SÁNG ĐÈN) lên trước
        const aReady = a.items.some((i) => i.status === 'SERVED') ? 1 : 0;
        const bReady = b.items.some((i) => i.status === 'SERVED') ? 1 : 0;
        if (bReady !== aReady) {
          return bReady - aReady;
        }
        // Sau đó sắp xếp theo thời gian gọi
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [orders, areaFilter]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0C0C0F]">
      {/* 1. Header Màn hình phục vụ */}
      <WaiterHeader
        areaFilter={areaFilter}
        onChangeAreaFilter={setAreaFilter}
        isAudioMuted={isAudioMuted}
        onToggleAudio={toggleAudio}
        onSimulateNewOrder={handleSimulate}
      />

      {/* 2. Vùng lưới hiển thị các bàn phục vụ */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#09090C]">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Không Có Món Nào Cần Bưng
            </h2>
            <p className="text-xs text-[#8E8E93] max-w-sm">
              Tất cả các món theo bộ lọc hiện tại đã được giao đến bàn của thực khách hoặc bếp đang chuẩn bị.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredOrders.map((order) => (
              <WaiterTableCard
                key={order.id}
                order={order}
                onDeliverItem={handleDeliverItem}
                onDeliverAllReady={handleDeliverAllReady}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. Toast thông báo thời gian thực */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
              toastType === 'ready'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-emerald-950/70'
                : toastType === 'success'
                ? 'bg-jade/95 border-emerald-500 text-white shadow-emerald-950/50'
                : 'bg-surface-elevated/95 border-gold/50 text-gold shadow-black/80'
            }`}
          >
            {toastType === 'ready' ? (
              <Sparkles className="w-4 h-4 text-emerald-300 animate-spin" />
            ) : (
              <BellRing className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 p-1 rounded hover:bg-white/10 text-white/80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
