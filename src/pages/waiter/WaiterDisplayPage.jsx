import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  WaiterHeader,
  WaiterTableCard,
} from '@/features/waiter';
import { waiterApi } from '@/features/waiter/api/waiterApi';
import useKdsStore, { playChimeSound } from '@/stores/useKdsStore';
import {
  CheckCircle,
} from 'lucide-react';

export default function WaiterDisplayPage() {
  const orders = useKdsStore((state) => state.orders);
  const setOrders = useKdsStore((state) => state.setOrders);
  const deliverItem = useKdsStore((state) => state.deliverItem);
  const deliverAllReadyItems = useKdsStore((state) => state.deliverAllReadyItems);
  const simulateNewOrder = useKdsStore((state) => state.simulateNewOrder);
  const lastBroadcastEvent = useKdsStore((state) => state.lastBroadcastEvent);

  // Luôn đồng bộ danh sách đơn hàng thực tế từ Backend khi mở màn hình phục vụ
  useEffect(() => {
    waiterApi
      .getWaiterOrders()
      .then((queue) => {
        if (Array.isArray(queue)) {
          setOrders(queue);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh sách phục vụ từ backend:', err);
      });
  }, [setOrders]);

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

  // Lắng nghe sự kiện từ Bếp để phát chuông
  useEffect(() => {
    if (!lastBroadcastEvent) return;

    if (
      lastBroadcastEvent.type === 'KITCHEN_ITEM_STATUS_TOGGLED' &&
      lastBroadcastEvent.nextStatus === 'SERVED'
    ) {
      if (!isAudioMuted) {
        playChimeSound();
      }
    } else if (lastBroadcastEvent.type === 'KITCHEN_ALL_ITEMS_COMPLETED') {
      if (!isAudioMuted) {
        playChimeSound();
      }
    }
  }, [lastBroadcastEvent, isAudioMuted]);

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
      deliverItem(orderId, itemId);
    },
    [deliverItem]
  );

  // Thao tác bưng toàn bộ món sẵn sàng của bàn
  const handleDeliverAllReady = useCallback(
    (orderId) => {
      deliverAllReadyItems(orderId);
    },
    [deliverAllReadyItems]
  );

  // Giả lập đơn mới
  const handleSimulate = useCallback(() => {
    simulateNewOrder();
  }, [simulateNewOrder]);

  // Quản lý danh sách ID đơn hàng đã giao xong và hết 10 giây đệm để ẩn
  const [hiddenOrderIds, setHiddenOrderIds] = useState(() => new Set());
  const completedTimersRef = useRef({});

  // Đếm ngược 10 giây sau khi bàn hoàn thành bưng tất cả các món rồi mới ẩn
  useEffect(() => {
    orders.forEach((order) => {
      const isAllDelivered =
        Array.isArray(order.items) &&
        order.items.length > 0 &&
        order.items.every(
          (i) => i.status === 'DELIVERED' || i.status === 'CANCELLED'
        );

      if (isAllDelivered) {
        if (hiddenOrderIds.has(order.id)) return;

        // Nếu chưa có timer đếm ngược cho đơn này
        if (!completedTimersRef.current[order.id]) {
          // Tính thời gian đã trôi qua kể từ khi món cuối cùng được phục vụ
          const latestDeliveredTime = order.items.reduce((max, item) => {
            const t = item.deliveredAt
              ? new Date(item.deliveredAt).getTime()
              : item.servedAt
              ? new Date(item.servedAt).getTime()
              : 0;
            return Math.max(max, t);
          }, 0);

          const now = Date.now();
          const elapsed = latestDeliveredTime > 0 ? now - latestDeliveredTime : 0;

          if (elapsed >= 10000) {
            // Đã hoàn thành hơn 10s trước -> ẩn ngay
            setHiddenOrderIds((prev) => new Set(prev).add(order.id));
          } else {
            // Chưa đủ 10s (hoặc vừa bấm bưng xong) -> đếm ngược khoảng thời gian còn lại (tối đa 10s)
            const remaining = Math.max(1000, 10000 - elapsed);
            completedTimersRef.current[order.id] = setTimeout(() => {
              setHiddenOrderIds((prev) => new Set(prev).add(order.id));
              delete completedTimersRef.current[order.id];
            }, remaining);
          }
        }
      } else {
        // Nếu đơn chưa hoàn thành (hoặc có món mới)
        if (completedTimersRef.current[order.id]) {
          clearTimeout(completedTimersRef.current[order.id]);
          delete completedTimersRef.current[order.id];
        }
        if (hiddenOrderIds.has(order.id)) {
          setHiddenOrderIds((prev) => {
            const next = new Set(prev);
            next.delete(order.id);
            return next;
          });
        }
      }
    });
  }, [orders, hiddenOrderIds]);

  // Lọc và sắp xếp các bàn
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Lọc khu vực
        if (areaFilter !== 'all' && order.area !== areaFilter) {
          return false;
        }
        // Ẩn đơn hàng sau khi toàn bộ món đã được bưng xong và đã hết 10 giây delay
        if (hiddenOrderIds.has(order.id)) {
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
  }, [orders, areaFilter, hiddenOrderIds]);

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
    </div>
  );
}
