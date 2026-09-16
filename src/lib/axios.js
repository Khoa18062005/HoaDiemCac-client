import axios from 'axios';
import { env } from '../config/env';
import { TABLE_SESSION_HEADER, API_RESPONSE_CODE } from '../config/constants';

/**
 * Axios instance cấu hình sẵn Base URL, Request/Response Interceptors
 * Tự động đính kèm JWT Token và Session Token bàn ăn vào Header.
 * Chuẩn hóa bóc tách trường `result` từ ApiResponse<T> của Spring Boot.
 */
export const apiClient = axios.create({
  baseURL: env.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // 1. Gắn JWT Token cho nhân sự / quản lý nếu đã đăng nhập
    const authData = localStorage.getItem('hoadiemcat_auth');
    if (authData) {
      try {
        const { state } = JSON.parse(authData);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        // Parse error ignored
      }
    }

    // 2. Gắn Session Token & Device Token bàn ăn cho khách hàng tại bàn (không gắn vào các request admin)
    const isCustomerRequest = !config.url?.startsWith('/admin') && !config.url?.startsWith('/auth');
    if (isCustomerRequest) {
      const tableData = localStorage.getItem('hoadiemcat_table_session');
      if (tableData) {
        try {
          const parsed = JSON.parse(tableData);
          const sessionToken = parsed?.sessionToken || parsed?.state?.sessionToken;
          const deviceToken = parsed?.deviceToken || parsed?.state?.deviceToken;
          if (sessionToken) {
            config.headers[TABLE_SESSION_HEADER] = sessionToken;
          }
          if (deviceToken) {
            config.headers['X-Device-Token'] = deviceToken;
          }
        } catch (e) {
          // Parse error ignored
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;

    // Nếu dữ liệu trả về theo chuẩn ApiResponse<T> của Backend
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code !== API_RESPONSE_CODE.SUCCESS) {
        const errMessage = data.message || 'Yêu cầu xử lý không thành công';
        return Promise.reject(new Error(errMessage));
      }
      // Trả về trường payload chính là `result`
      return data.result !== undefined ? data.result : data;
    }

    return data;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';

    // Xử lý khi token hết hạn hoặc chưa đăng nhập
    if (status === 401) {
      // Chỉ chuyển hướng nếu đang ở trang quản trị
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('hoadiemcat_auth');
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
