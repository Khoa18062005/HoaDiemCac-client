/**
 * Quản lý tập trung các biến môi trường của ứng dụng Client Hỏa Diệm Các.
 */
const defaultHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';

export const env = {
  /**
   * Base URL của hệ thống REST API Spring Boot
   */
  API_URL: import.meta.env.VITE_API_URL || `http://${defaultHost}:8080/api/v1`,

  /**
   * Endpoint kết nối WebSocket STOMP
   */
  WS_URL: import.meta.env.VITE_WS_URL || `http://${defaultHost}:8080/ws`,

  /**
   * Thời gian chờ chống spam chuông gọi phục vụ (30 giây theo Quy định QĐ10)
   */
  CALL_STAFF_COOLDOWN: Number(import.meta.env.VITE_CALL_STAFF_COOLDOWN) || 30,
};

export default env;
