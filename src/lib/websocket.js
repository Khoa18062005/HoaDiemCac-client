import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { env } from '../config/env';

/**
 * Trình quản lý kết nối STOMP Client qua SockJS kết nối Spring Boot WebSocket
 * Hỗ trợ tự động kết nối lại (reconnect) và lắng nghe các topic an toàn, không gây crash UI.
 */
class WebSocketManager {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connectCallbacks = [];
    this.isConnected = false;
  }

  /**
   * Khởi tạo kết nối STOMP tới Backend
   */
  connect(onConnectCallback, onErrorCallback) {
    if (this.isConnected && this.client?.connected) {
      if (onConnectCallback) onConnectCallback();
      return;
    }

    if (onConnectCallback) {
      this.connectCallbacks.push(onConnectCallback);
    }

    if (this.client && this.client.active) {
      // Đang trong tiến trình kết nối (handshake), chờ onConnect kích hoạt các callbacks
      return;
    }

    try {
      this.client = new Client({
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
          // Thực thi toàn bộ callbacks đang chờ
          const callbacks = [...this.connectCallbacks];
          this.connectCallbacks = [];
          callbacks.forEach((cb) => {
            try {
              cb(frame);
            } catch (err) {
              console.warn('[STOMP]: Callback onConnect error:', err);
            }
          });
        },
        onStompError: (frame) => {
          this.isConnected = false;
          console.warn('[STOMP Error]:', frame?.headers?.message || 'Connection error');
          if (onErrorCallback) onErrorCallback(frame);
        },
        onWebSocketClose: () => {
          this.isConnected = false;
        },
      });

      this.client.activate();
    } catch (e) {
      console.warn('[STOMP]: Không thể khởi tạo WebSocket:', e.message);
    }
  }

  /**
   * Đăng ký lắng nghe một Topic (Subscription)
   * @param {string} destination - Ví dụ: /topic/kitchen/orders
   * @param {function} callback - Nhận dữ liệu parsed JSON
   * @returns {function} unsubscribe function
   */
  subscribe(destination, callback) {
    if (!this.isConnected || !this.client?.connected) {
      // Hẹn khi có kết nối thật sự thì mới thực hiện subscribe
      this.connect(() => {
        this.doSubscribe(destination, callback);
      });
      return () => this.unsubscribe(destination);
    }

    return this.doSubscribe(destination, callback);
  }

  doSubscribe(destination, callback) {
    if (this.subscriptions.has(destination)) {
      try {
        this.subscriptions.get(destination).unsubscribe();
      } catch (e) {}
    }

    if (!this.client || !this.client.connected) {
      return () => this.unsubscribe(destination);
    }

    try {
      const sub = this.client.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body);
          callback(payload);
        } catch (err) {
          callback(message.body);
        }
      });

      this.subscriptions.set(destination, sub);
    } catch (err) {
      console.warn('[STOMP]: Lỗi khi subscribe topic:', destination, err.message);
    }

    return () => this.unsubscribe(destination);
  }

  /**
   * Hủy đăng ký một Topic
   */
  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      try {
        this.subscriptions.get(destination).unsubscribe();
      } catch (e) {}
      this.subscriptions.delete(destination);
    }
  }

  /**
   * Gửi message lên Server qua prefix /app
   */
  send(destination, body = {}) {
    if (this.client && this.client.connected) {
      try {
        this.client.publish({
          destination,
          body: JSON.stringify(body),
        });
      } catch (e) {
        console.warn('[STOMP]: Lỗi gửi message:', e.message);
      }
    } else {
      console.warn('[STOMP]: Client chưa kết nối, không thể gửi message:', destination);
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {}
      this.isConnected = false;
      this.subscriptions.clear();
      this.connectCallbacks = [];
    }
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
