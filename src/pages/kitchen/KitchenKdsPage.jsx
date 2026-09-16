import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  KitchenHeader,
  KdsOrderCard,
  KdsAggregatedView,
  OutOfStockModal,
  initialKitchenOrders,
  kitchenApi,
  useKitchenSocket,
} from '@/features/kitchen';
import { ChefHat, CheckCircle, BellRing, X } from 'lucide-react';
import useKdsStore from '@/stores/useKdsStore';

export default function KitchenKdsPage() {
  // 1. Quản lý trạng thái danh sách order hàng đợi từ Store đồng bộ KDS - Waiter
  const orders = useKdsStore((state) => state.orders);
  const toggleKitchenItemStatus = useKdsStore((state) => state.toggleKitchenItemStatus);
  const completeAllKitchenItems = useKdsStore((state) => state.completeAllKitchenItems);
  const addNewOrder = useKdsStore((state) => state.addNewOrder);
  const simulateNewOrderStore = useKdsStore((state) => state.simulateNewOrder);

  // 2. Quản lý bộ lọc & Chế độ xem
  const [viewMode, setViewMode] = useState('tickets'); // 'tickets' | 'aggregated'
  const [areaFilter, setAreaFilter] = useState('all'); // 'all' | 'COMMON' | 'VIP'

  // 3. Modal Báo Hết Món (UC19) & Toast
  const [isOutOfStockOpen, setIsOutOfStockOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('info'); // 'info' | 'success' | 'warning'

  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // 4. WebSocket & Chuông Báo Ting-ting
  const handleNewOrderReceived = useCallback((newOrder) => {
    addNewOrder(newOrder);
    showToast(`🔔 ĐƠN MỚI TỪ ${newOrder.tableCode}!`, 'warning');
  }, [addNewOrder, showToast]);

  const {
    isAudioMuted,
    toggleAudio,
    simulateNewOrder: simulateSocketOrder,
  } = useKitchenSocket({
    onNewOrder: handleNewOrderReceived,
  });

  const handleSimulate = useCallback(() => {
    const res = simulateNewOrderStore();
    showToast(res.message, 'warning');
  }, [simulateNewOrderStore, showToast]);

  // 5. Thao tác một chạm (One-tap) cập nhật trạng thái từng món (UC18)
  const handleToggleItemStatus = useCallback(async (orderId, itemId) => {
    const result = toggleKitchenItemStatus(orderId, itemId);
    showToast(result.message, 'success');

    // Gửi cập nhật lên Backend
    await kitchenApi.updateOrderItemStatus(itemId, result.nextStatus);
  }, [toggleKitchenItemStatus, showToast]);

  // 6. Hoàn thành toàn bộ đợt order của bàn
  const handleCompleteAllItems = useCallback(async (orderId) => {
    const result = completeAllKitchenItems(orderId);
    showToast(result.message, 'success');
    await kitchenApi.updateOrderStatus(orderId, 'COMPLETED');
  }, [completeAllKitchenItems, showToast]);

  // 7. Lọc danh sách order theo khu vực bàn
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (areaFilter !== 'all' && order.area !== areaFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders, areaFilter]);

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
        onShowToast={showToast}
      />

      {/* 5. Thông báo Toast nổi bật thời gian thực */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
              toastType === 'warning'
                ? 'bg-crimson/95 border-red-500 text-white shadow-red-950/50'
                : toastType === 'success'
                ? 'bg-jade/95 border-emerald-500 text-white shadow-emerald-950/50'
                : 'bg-surface-elevated/95 border-gold/50 text-gold shadow-black/80'
            }`}
          >
            <BellRing className="w-4 h-4 flex-shrink-0 animate-spin" />
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
