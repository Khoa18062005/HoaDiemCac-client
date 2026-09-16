import { useState, useEffect, useCallback, useRef } from 'react';
import { wsManager } from '@/lib/websocket';

/**
 * Tạo âm thanh chuông "Ting-ting" hoàng gia bằng Web Audio API
 * Tự động tạo âm thanh thuần không phụ thuộc vào tải file MP3 từ server.
 */
function playDualChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Tiếng chuông 1 (880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Tiếng chuông 2 (1320Hz - E6, trễ 0.12s)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Trình duyệt có thể block âm thanh nếu chưa có user gesture
  }
}

/**
 * Hook kết nối STOMP WebSocket cho trạm Bếp KDS
 * Lắng nghe Topic: /topic/kitchen/orders
 */
export function useKitchenSocket({ onNewOrder, onOrderCancelled }) {
  const [isAudioMuted, setIsAudioMuted] = useState(() => {
    return localStorage.getItem('kds_audio_muted') === 'true';
  });
  const [lastNotification, setLastNotification] = useState(null);

  const toggleAudio = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      localStorage.setItem('kds_audio_muted', String(next));
      return next;
    });
  }, []);

  const triggerChime = useCallback(() => {
    if (!isAudioMuted) {
      playDualChime();
    }
  }, [isAudioMuted]);

  useEffect(() => {
    // Đăng ký nhận order mới từ WebSocket
    const unsubscribe = wsManager.subscribe('/topic/kitchen/orders', (payload) => {
      if (!payload) return;

      // Xử lý đơn mới hoặc cập nhật
      if (payload.type === 'NEW_ORDER' || payload.orderCode) {
        setLastNotification({
          type: 'NEW_ORDER',
          tableCode: payload.tableCode || 'BÀN MỚI',
          time: new Date().toLocaleTimeString('vi-VN'),
        });
        triggerChime();
        if (onNewOrder) onNewOrder(payload);
      } else if (payload.type === 'CANCEL_ITEM' && onOrderCancelled) {
        onOrderCancelled(payload);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onNewOrder, onOrderCancelled, triggerChime]);

  /**
   * Hàm giả lập nhận đơn mới tức thời phục vụ kiểm thử giao diện & âm thanh
   */
  const simulateNewOrder = useCallback(() => {
    const tableOptions = ['BÀN 01', 'BÀN 03', 'BÀN 06', 'VIP 11', 'VIP 14', 'VIP 18'];
    const randomTable = tableOptions[Math.floor(Math.random() * tableOptions.length)];
    const isVip = randomTable.startsWith('VIP');

    const mockNewOrder = {
      id: `ord-${Date.now()}`,
      orderCode: `OD-${Math.floor(10000 + Math.random() * 90000)}`,
      tableCode: randomTable,
      tableId: randomTable.toLowerCase().replace(/\s+/g, ''),
      area: isVip ? 'VIP' : 'COMMON',
      orderRound: Math.floor(Math.random() * 3) + 1,
      createdAt: new Date().toISOString(),
      status: 'COOKING',
      priority: 'NORMAL',
      items: [
        {
          id: `oi-${Date.now()}-1`,
          menuItemId: 'm02',
          name: 'Bò Wagyu A5 Cánh Sen Hoàng Triều',
          category: 'Bò Thượng Hạng & Wagyu',
          quantity: Math.floor(Math.random() * 2) + 1,
          unit: 'Khay 250g',
          note: 'Mới gửi từ bàn khách',
          status: 'COOKING',
          servedAt: null,
        },
        {
          id: `oi-${Date.now()}-2`,
          menuItemId: 'm07',
          name: 'Mực Trứng Phú Quốc Tươi Nhúng Cay',
          category: 'Hải Sản Tươi Sống',
          quantity: 1,
          unit: 'Đĩa 300g',
          note: '',
          status: 'COOKING',
          servedAt: null,
        },
      ],
    };

    setLastNotification({
      type: 'NEW_ORDER',
      tableCode: randomTable,
      time: new Date().toLocaleTimeString('vi-VN'),
    });
    triggerChime();

    if (onNewOrder) {
      onNewOrder(mockNewOrder);
    }
    return mockNewOrder;
  }, [onNewOrder, triggerChime]);

  return {
    isAudioMuted,
    toggleAudio,
    triggerChime,
    lastNotification,
    clearNotification: () => setLastNotification(null),
    simulateNewOrder,
  };
}

export default useKitchenSocket;
