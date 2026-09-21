import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  KitchenHeader,
  KdsOrderCard,
  KdsAggregatedView,
  OutOfStockModal,
  kitchenApi,
  useKitchenSocket,
} from '@/features/kitchen';
import { ChefHat, CheckCircle } from 'lucide-react';
import useKdsStore from '@/stores/useKdsStore';

export default function KitchenKdsPage() {
  // 1. Quản lý trạng thái danh sách order hàng đợi từ Store đồng bộ KDS - Waiter
  const orders = useKdsStore((state) => state.orders);
  const setOrders = useKdsStore((state) => state.setOrders);
  const toggleKitchenItemStatus = useKdsStore((state) => state.toggleKitchenItemStatus);
  const completeAllKitchenItems = useKdsStore((state) => state.completeAllKitchenItems);
  const addNewOrder = useKdsStore((state) => state.addNewOrder);
  const simulateNewOrderStore = useKdsStore((state) => state.simulateNewOrder);

  // Luôn đồng bộ hàng đợi thực tế từ Backend khi mở màn hình bếp & polling định kỳ
  useEffect(() => {
    let isMounted = true;
    const loadQueue = () => {
      kitchenApi
        .getKitchenQueue()
        .then((queue) => {
          if (isMounted && Array.isArray(queue)) {
            setOrders(queue);
          }
        })
        .catch((err) => {
          console.warn('Lỗi khi tải hàng đợi bếp từ backend:', err);
        });
    };

    loadQueue();
    const interval = setInterval(loadQueue, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [setOrders]);

  // 2. Quản lý bộ lọc & Chế độ xem
  const [viewMode, setViewMode] = useState('tickets'); // 'tickets' | 'aggregated'
  const [areaFilter, setAreaFilter] = useState('all'); // 'all' | 'COMMON' | 'VIP'

  // 3. Modal Báo Hết Món (UC19)
  const [isOutOfStockOpen, setIsOutOfStockOpen] = useState(false);

  // 4. WebSocket & Chuông Báo Ting-ting
  const handleNewOrderReceived = useCallback((newOrder) => {
    addNewOrder(newOrder);
  }, [addNewOrder]);

  const {
    isAudioMuted,
    toggleAudio,
    simulateNewOrder: simulateSocketOrder,
  } = useKitchenSocket({
    onNewOrder: handleNewOrderReceived,
  });

  const handleSimulate = useCallback(() => {
    simulateNewOrderStore();
  }, [simulateNewOrderStore]);

  // 5. Thao tác một chạm (One-tap) cập nhật trạng thái từng món (UC18)
  const handleToggleItemStatus = useCallback(async (orderId, itemId) => {
    const result = toggleKitchenItemStatus(orderId, itemId);

    // Gửi cập nhật lên Backend
    await kitchenApi.updateOrderItemStatus(itemId, result.nextStatus);
  }, [toggleKitchenItemStatus]);

  // 6. Hoàn thành toàn bộ đợt order của bàn
  const handleCompleteAllItems = useCallback(async (orderId) => {
    completeAllKitchenItems(orderId);
    await kitchenApi.updateOrderStatus(orderId, 'COMPLETED');
  }, [completeAllKitchenItems]);

  // 7. Quản lý danh sách ID đơn hàng đã hoàn thành và hết 10 giây đệm để ẩn
  const [hiddenOrderIds, setHiddenOrderIds] = useState(() => new Set());
  const completedTimersRef = useRef({});

  // Đếm ngược 10 giây sau khi bàn/đơn hoàn thành tất cả các món rồi mới ẩn
  useEffect(() => {
    orders.forEach((order) => {
      const isAllDone =
        Array.isArray(order.items) &&
        order.items.length > 0 &&
        order.items.every(
          (i) => i.status === 'SERVED' || i.status === 'DELIVERED' || i.status === 'CANCELLED'
        );

      if (isAllDone) {
        if (hiddenOrderIds.has(order.id)) return;

        // Nếu chưa có timer đếm ngược cho đơn này
        if (!completedTimersRef.current[order.id]) {
          // Tính thời gian đã trôi qua kể từ khi món cuối cùng hoàn thành
          const latestServedTime = order.items.reduce((max, item) => {
            const t = item.servedAt ? new Date(item.servedAt).getTime() : 0;
            return Math.max(max, t);
          }, 0);

          const now = Date.now();
          const elapsed = latestServedTime > 0 ? now - latestServedTime : 0;

          if (elapsed >= 10000) {
            // Đã hoàn thành hơn 10s trước -> ẩn ngay
            setHiddenOrderIds((prev) => new Set(prev).add(order.id));
          } else {
            // Chưa đủ 10s (hoặc vừa bấm xong) -> đếm ngược khoảng thời gian còn lại (tối đa 10s)
            const remaining = Math.max(1000, 10000 - elapsed);
            completedTimersRef.current[order.id] = setTimeout(() => {
              setHiddenOrderIds((prev) => new Set(prev).add(order.id));
              delete completedTimersRef.current[order.id];
            }, remaining);
          }
        }
      } else {
        // Nếu đơn chưa hoàn thành (hoặc đầu bếp bấm hoàn tác 1 món lại thành COOKING)
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

  // 8. Lọc danh sách order theo khu vực bàn & ẩn đơn sau khi hoàn thành 10 giây
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (areaFilter !== 'all' && order.area !== areaFilter) {
          return false;
        }
        // Ẩn đơn hàng sau khi hoàn tất và đã hết 10 giây delay
        if (hiddenOrderIds.has(order.id)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, areaFilter, hiddenOrderIds]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0C0C0F]">
      {/* 1. Header trạm bếp chuyên dụng tích hợp bộ điều phối chế độ xem & khu vực */}
      <KitchenHeader
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        areaFilter={areaFilter}
        onChangeAreaFilter={setAreaFilter}
        isAudioMuted={isAudioMuted}
        onToggleAudio={toggleAudio}
        onOpenOutOfStockModal={() => setIsOutOfStockOpen(true)}
        onSimulateNewOrder={handleSimulate}
      />

      {/* 3. Vùng nội dung chính KDS */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#09090C]">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-gold mb-4 shadow-inner">
              <ChefHat className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Không Có Đơn Món Nào Phù Hợp
            </h2>
            <p className="text-xs text-[#8E8E93] max-w-sm">
              Tất cả các món theo bộ lọc hiện tại đã được phục vụ hoặc chưa có đơn order mới.
            </p>
          </div>
        ) : viewMode === 'tickets' ? (
          /* Chế độ xem theo Thẻ đơn bàn (Ticket FIFO Grid) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredOrders.map((order) => (
              <KdsOrderCard
                key={order.id}
                order={order}
                onToggleItemStatus={handleToggleItemStatus}
                onCompleteAllItems={handleCompleteAllItems}
              />
            ))}
          </div>
        ) : (
          /* Chế độ xem Gom món tổng hợp (Aggregated View) */
          <KdsAggregatedView
            orders={filteredOrders}
            onToggleItemStatus={handleToggleItemStatus}
          />
        )}
      </main>

      {/* 4. Modal Báo Hết Món Khẩn Cấp (UC19) */}
      <OutOfStockModal
        isOpen={isOutOfStockOpen}
        onClose={() => setIsOutOfStockOpen(false)}
      />
    </div>
  );
}
