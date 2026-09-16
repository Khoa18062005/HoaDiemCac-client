import { create } from 'zustand';
import { initialKitchenOrders } from '@/features/kitchen/data/mockKitchenOrders';

// Unique Tab ID để phân biệt các tab/cửa sổ khác nhau
const tabId = typeof window !== 'undefined' ? `tab_${Math.random().toString(36).substring(2, 9)}` : 'server';

// BroadcastChannel cho phép các tab trình duyệt đồng bộ ngay tức thì (0ms latency)
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('hoadiemcat_kds_sync_channel')
  : null;

/**
 * Âm thanh chuông báo Ting-ting hoàng gia nhẹ nhàng khi Bếp ra món
 */
export function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Nốt 1: 987Hz (B5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987, ctx.currentTime);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Nốt 2: 1318Hz (E6, ngân vang)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.75);
  } catch (e) {
    // Trình duyệt chặn âm thanh nếu chưa tương tác
  }
}

// Khôi phục orders từ localStorage nếu có
function loadInitialOrders() {
  if (typeof window === 'undefined') return initialKitchenOrders;
  try {
    const saved = localStorage.getItem('hoadiemcat_kds_orders_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading saved KDS orders:', err);
  }
  return initialKitchenOrders;
}

function saveOrdersToStorage(orders) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('hoadiemcat_kds_orders_v2', JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving KDS orders:', err);
  }
}

function broadcastUpdate(orders, eventData = null) {
  saveOrdersToStorage(orders);
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'ORDERS_SYNC',
        senderTabId: tabId,
        orders,
        eventData,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('BroadcastChannel postMessage error:', err);
    }
  }
}

export const useKdsStore = create((set, get) => ({
  orders: loadInitialOrders(),
  lastBroadcastEvent: null,

  // 1. Thao tác từ BẾP: Hoàn thành hoặc Hoàn tác món (COOKING <-> SERVED)
  toggleKitchenItemStatus: (orderId, itemId) => {
    let affectedItemName = '';
    let affectedTableCode = '';
    let nextStatus = 'SERVED';

    const currentOrders = get().orders;
    const nextOrders = currentOrders.map((order) => {
      if (order.id !== orderId) return order;
      affectedTableCode = order.tableCode;

      const updatedItems = order.items.map((item) => {
        if (item.id !== itemId) return item;
        affectedItemName = item.name;
        const isDone = item.status === 'SERVED' || item.status === 'DELIVERED';
        nextStatus = isDone ? 'COOKING' : 'SERVED';

        return {
          ...item,
          status: nextStatus,
          servedAt: nextStatus === 'SERVED' ? new Date().toISOString() : null,
        };
      });

      const allCompleted = updatedItems.every(
        (i) => i.status === 'SERVED' || i.status === 'DELIVERED'
      );

      return {
        ...order,
        items: updatedItems,
        status: allCompleted ? 'COMPLETED' : 'COOKING',
      };
    });

    const eventData = {
      type: 'KITCHEN_ITEM_STATUS_TOGGLED',
      orderId,
      itemId,
      nextStatus,
      affectedItemName,
      affectedTableCode,
      message:
        nextStatus === 'SERVED'
          ? `⚡ Bếp đã ra món: ${affectedItemName} (${affectedTableCode})`
          : `↩️ Đã hoàn tác: ${affectedItemName} (${affectedTableCode})`,
    };

    set({ orders: nextOrders, lastBroadcastEvent: eventData });
    broadcastUpdate(nextOrders, eventData);

    return eventData;
  },

  // 2. Thao tác từ BẾP: Bếp làm xong toàn bộ món của bàn (Ra Cả Bàn)
  completeAllKitchenItems: (orderId) => {
    let affectedTable = '';
    const currentOrders = get().orders;
    const nextOrders = currentOrders.map((order) => {
      if (order.id !== orderId) return order;
      affectedTable = order.tableCode;

      const updatedItems = order.items.map((item) => {
        if (item.status === 'DELIVERED') return item;
        return {
          ...item,
          status: 'SERVED',
          servedAt: item.servedAt || new Date().toISOString(),
        };
      });

      return {
        ...order,
        items: updatedItems,
        status: 'COMPLETED',
      };
    });

    const eventData = {
      type: 'KITCHEN_ALL_ITEMS_COMPLETED',
      orderId,
      affectedTable,
      message: `🎉 Bếp đã ra toàn bộ món cho ${affectedTable}!`,
    };

    set({ orders: nextOrders, lastBroadcastEvent: eventData });
    broadcastUpdate(nextOrders, eventData);

    return eventData;
  },

  // 3. Thao tác từ PHỤC VỤ: Nhân viên bưng 1 món lên bàn (SERVED -> DELIVERED)
  deliverItem: (orderId, itemId) => {
    let affectedItemName = '';
    let affectedTableCode = '';

    const currentOrders = get().orders;
    const nextOrders = currentOrders.map((order) => {
      if (order.id !== orderId) return order;
      affectedTableCode = order.tableCode;

      const updatedItems = order.items.map((item) => {
        if (item.id !== itemId) return item;
        affectedItemName = item.name;
        return {
          ...item,
          status: 'DELIVERED',
          deliveredAt: new Date().toISOString(),
        };
      });

      const allDelivered = updatedItems.every((i) => i.status === 'DELIVERED');

      return {
        ...order,
        items: updatedItems,
        status: allDelivered ? 'DELIVERED' : order.status,
      };
    });

    const eventData = {
      type: 'WAITER_ITEM_DELIVERED',
      orderId,
      itemId,
      affectedItemName,
      affectedTableCode,
      message: `✅ Đã bưng món ${affectedItemName} lên ${affectedTableCode}`,
    };

    set({ orders: nextOrders, lastBroadcastEvent: eventData });
    broadcastUpdate(nextOrders, eventData);

    return eventData;
  },

  // 4. Thao tác từ PHỤC VỤ: Bưng tất cả các món đang sẵn sàng của bàn
  deliverAllReadyItems: (orderId) => {
    let affectedTable = '';
    let count = 0;
    const currentOrders = get().orders;
    const nextOrders = currentOrders.map((order) => {
      if (order.id !== orderId) return order;
      affectedTable = order.tableCode;

      const updatedItems = order.items.map((item) => {
        if (item.status === 'SERVED') {
          count++;
          return {
            ...item,
            status: 'DELIVERED',
            deliveredAt: new Date().toISOString(),
          };
        }
        return item;
      });

      const allDelivered = updatedItems.every((i) => i.status === 'DELIVERED');

      return {
        ...order,
        items: updatedItems,
        status: allDelivered ? 'DELIVERED' : order.status,
      };
    });

    const eventData = {
      type: 'WAITER_ALL_READY_DELIVERED',
      orderId,
      affectedTable,
      count,
      message: `✅ Đã bưng toàn bộ ${count} món sẵn sàng cho ${affectedTable}`,
    };

    set({ orders: nextOrders, lastBroadcastEvent: eventData });
    broadcastUpdate(nextOrders, eventData);

    return eventData;
  },

  // 5. Thêm order mới
  addNewOrder: (newOrder) => {
    const currentOrders = get().orders;
    const existingIndex = currentOrders.findIndex(
      (o) => o.tableCode === newOrder.tableCode && o.status !== 'DELIVERED'
    );

    let nextOrders;
    if (existingIndex !== -1) {
      nextOrders = [...currentOrders];
      const existing = nextOrders[existingIndex];
      nextOrders[existingIndex] = {
        ...existing,
        items: [...existing.items, ...newOrder.items],
        status: 'COOKING',
      };
    } else {
      nextOrders = [...currentOrders, newOrder];
    }

    const eventData = {
      type: 'NEW_ORDER_RECEIVED',
      order: newOrder,
      message: `🔔 Đơn mới từ ${newOrder.tableCode}!`,
    };

    set({ orders: nextOrders, lastBroadcastEvent: eventData });
    broadcastUpdate(nextOrders, eventData);

    return eventData;
  },

  // 6. Giả lập đơn mới
  simulateNewOrder: () => {
    const tableOptions = ['BÀN 01', 'BÀN 03', 'BÀN 06', 'VIP 11', 'VIP 14', 'VIP 18'];
    const randomTable = tableOptions[Math.floor(Math.random() * tableOptions.length)];
    const isVip = randomTable.startsWith('VIP');

    const sampleItems = [
      {
        id: `oi-${Date.now()}-1`,
        menuItemId: 'm02',
        name: 'Bò Wagyu A5 Cánh Sen Hoàng Triều',
        category: 'Bò Thượng Hạng & Wagyu',
        quantity: Math.floor(Math.random() * 2) + 1,
        note: 'Mới gọi từ bàn khách',
        status: 'COOKING',
        servedAt: null,
      },
      {
        id: `oi-${Date.now()}-2`,
        menuItemId: 'm07',
        name: 'Mực Trứng Phú Quốc Tươi Nhúng Cay',
        category: 'Hải Sản Tươi Sống',
        quantity: 1,
        note: '',
        status: 'COOKING',
        servedAt: null,
      },
    ];

    const newOrder = {
      id: `ord-${Date.now()}`,
      orderCode: `OD-${Math.floor(10000 + Math.random() * 90000)}`,
      tableCode: randomTable,
      tableId: randomTable.toLowerCase().replace(/\s+/g, ''),
      area: isVip ? 'VIP' : 'COMMON',
      orderRound: Math.floor(Math.random() * 3) + 1,
      createdAt: new Date().toISOString(),
      status: 'COOKING',
      priority: 'NORMAL',
      items: sampleItems,
    };

    return get().addNewOrder(newOrder);
  },

  // 7. Khôi phục dữ liệu gốc
  resetToDefault: () => {
    localStorage.removeItem('hoadiemcat_kds_orders_v2');
    set({ orders: initialKitchenOrders, lastBroadcastEvent: null });
    broadcastUpdate(initialKitchenOrders, { type: 'RESET_ORDERS', message: 'Đã thiết lập lại dữ liệu' });
  },
}));

// Lắng nghe đồng bộ từ các tab khác qua BroadcastChannel
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const data = event.data;
    if (!data || data.senderTabId === tabId) return;

    if (data.type === 'ORDERS_SYNC' && Array.isArray(data.orders)) {
      useKdsStore.setState({
        orders: data.orders,
        lastBroadcastEvent: data.eventData,
      });

      // Nếu có sự kiện Bếp ra món và tab hiện tại là tab khác, phát chuông
      if (
        data.eventData?.type === 'KITCHEN_ITEM_STATUS_TOGGLED' &&
        data.eventData.nextStatus === 'SERVED'
      ) {
        playChimeSound();
      }
    }
  };
}

// Hỗ trợ dự phòng qua sự kiện storage
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'hoadiemcat_kds_orders_v2' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) {
          useKdsStore.setState({ orders: parsed });
        }
      } catch {}
    }
  });
}

export default useKdsStore;
