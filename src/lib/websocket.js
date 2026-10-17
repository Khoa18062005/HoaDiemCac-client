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

          // Tự động tái đăng ký (re-subscribe) toàn bộ các topic đang có listeners khi kết nối lại
          this.subscriptions.forEach((entry, destination) => {
            if (entry.callbacks.size > 0 && this.client?.connected) {
              try {
                if (entry.stompSub) {
                  try {
                    entry.stompSub.unsubscribe();
                  } catch (e) {}
                }
                entry.stompSub = this.client.subscribe(destination, (message) => {
                  let payload;
                  try {
                    payload = JSON.parse(message.body);
                  } catch (err) {
                    payload = message.body;
                  }
                  entry.callbacks.forEach((cb) => {
                    try {
                      cb(payload);
                    } catch (cbErr) {
                      console.warn(`[STOMP]: Lỗi trong callback topic ${destination}:`, cbErr);
                    }
                  });
                });
              } catch (reSubErr) {
                console.warn('[STOMP]: Re-subscribe error:', destination, reSubErr);
              }
            }
          });

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
   * Hỗ trợ đa components cùng lắng nghe 1 topic mà không đè hay hủy của nhau.
   * @param {string} destination - Ví dụ: /topic/kitchen/orders
   * @param {function} callback - Nhận dữ liệu parsed JSON
   * @returns {function} unsubscribe function dành riêng cho callback này
   */
  subscribe(destination, callback) {
    if (!callback) return () => {};

    if (!this.isConnected || !this.client?.connected) {
      let active = true;
      let cleanup = null;
      this.connect(() => {
        if (active) {
          cleanup = this.doSubscribe(destination, callback);
        }
      });
      return () => {
        active = false;
        if (typeof cleanup === 'function') {
          cleanup();
        } else {
          this.removeCallback(destination, callback);
        }
      };
    }

    return this.doSubscribe(destination, callback);
  }

  doSubscribe(destination, callback) {
    if (!callback) return () => {};

    // Nếu đã có subscription trên destination này -> Thêm callback vào Set
    if (this.subscriptions.has(destination)) {
      const entry = this.subscriptions.get(destination);
      entry.callbacks.add(callback);
      return () => this.removeCallback(destination, callback);
    }

    const callbacks = new Set([callback]);

    if (!this.client || !this.client.connected) {
      this.subscriptions.set(destination, { stompSub: null, callbacks });
      return () => this.removeCallback(destination, callback);
    }

    try {
      const stompSub = this.client.subscribe(destination, (message) => {
        let payload;
        try {
          payload = JSON.parse(message.body);
        } catch (err) {
          payload = message.body;
        }

        const currentEntry = this.subscriptions.get(destination);
        if (currentEntry) {
          currentEntry.callbacks.forEach((cb) => {
            try {
              cb(payload);
            } catch (cbErr) {
              console.warn(`[STOMP]: Lỗi trong callback topic ${destination}:`, cbErr);
            }
          });
        }
      });

      this.subscriptions.set(destination, { stompSub, callbacks });
    } catch (err) {
      console.warn('[STOMP]: Lỗi khi subscribe topic:', destination, err.message);
      this.subscriptions.set(destination, { stompSub: null, callbacks });
    }

    return () => this.removeCallback(destination, callback);
  }

  /**
   * Hủy một callback cụ thể khỏi topic, chỉ đóng STOMP sub khi không còn ai nghe
   */
  removeCallback(destination, callback) {
    if (!this.subscriptions.has(destination)) return;
    const entry = this.subscriptions.get(destination);
    entry.callbacks.delete(callback);

    if (entry.callbacks.size === 0) {
      if (entry.stompSub) {
        try {
          entry.stompSub.unsubscribe();
        } catch (e) {}
      }
      this.subscriptions.delete(destination);
    }
  }

  /**
   * Hủy đăng ký toàn bộ một Topic
   */
  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      const entry = this.subscriptions.get(destination);
      if (entry.stompSub) {
        try {
          entry.stompSub.unsubscribe();
        } catch (e) {}
      }
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
