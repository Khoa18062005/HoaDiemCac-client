import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { env } from '../config/env';

/**
 * Trình quản lý kết nối STOMP Client qua SockJS kết nối Spring Boot WebSocket
 * Hỗ trợ tự động kết nối lại (reconnect) và lắng nghe các topic:
 * - /topic/table/{sessionToken}/cart
 * - /topic/kitchen/orders
 * - /topic/table/{sessionToken}/status
 */
class WebSocketManager {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.isConnected = false;
  }

  /**
   * Khởi tạo kết nối STOMP tới Backend
   */
  connect(onConnectCallback, onErrorCallback) {
    if (this.client && this.client.active) {
      if (onConnectCallback) onConnectCallback();
      return;
    }

    this.client = new Client({
      // Sử dụng SockJS fallback tương thích Spring Boot
      webSocketFactory: () => new SockJS(env.WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => {
        if (import.meta.env.DEV) {
          // console.debug('[STOMP]:', msg);
        }
      },
      onConnect: (frame) => {
        this.isConnected = true;
        if (onConnectCallback) onConnectCallback(frame);
      },
      onStompError: (frame) => {
        this.isConnected = false;
        console.error('[STOMP Error]:', frame.headers['message']);
        if (onErrorCallback) onErrorCallback(frame);
      },
      onWebSocketClose: () => {
        this.isConnected = false;
      },
    });

    this.client.activate();
  }

  /**
   * Đăng ký lắng nghe một Topic (Subscription)
   * @param {string} destination - Ví dụ: /topic/table/xyz/cart
   * @param {function} callback - Nhận dữ liệu parsed JSON
   * @returns {function} unsubscribe function
   */
  subscribe(destination, callback) {
    if (!this.client || !this.client.connected) {
      // Nếu chưa kết nối xong, hẹn kết nối rồi đăng ký
      this.connect(() => {
        this.doSubscribe(destination, callback);
      });
      return () => this.unsubscribe(destination);
    }

    return this.doSubscribe(destination, callback);
  }

  doSubscribe(destination, callback) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
    }

    const sub = this.client.subscribe(destination, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        callback(message.body);
      }
    });

    this.subscriptions.set(destination, sub);

    return () => this.unsubscribe(destination);
  }

  /**
   * Hủy đăng ký một Topic
   */
  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  /**
   * Gửi message lên Server qua prefix /app
   */
  send(destination, body = {}) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.warn('[STOMP]: Client chưa kết nối, không thể gửi message:', destination);
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
      this.subscriptions.clear();
    }
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
