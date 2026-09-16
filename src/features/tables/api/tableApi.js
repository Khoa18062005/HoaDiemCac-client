import { apiClient } from '@/lib/axios';
import { initialTables } from '../data/mockTables';

// Key lưu trữ phiên bàn ăn tại localStorage của khách hàng
export const TABLE_SESSION_KEY = 'hoadiemcat_table_session';

export const getStoredTableSession = () => {
  try {
    const raw = localStorage.getItem(TABLE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveTableSession = (sessionData) => {
  try {
    localStorage.setItem(TABLE_SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error('Lỗi khi lưu table session vào localStorage:', err);
  }
};

export const clearTableSession = () => {
  try {
    localStorage.removeItem(TABLE_SESSION_KEY);
  } catch (err) {
    console.error('Lỗi khi xóa table session:', err);
  }
};

export const tableApi = {
  // Lấy danh sách toàn bộ bàn kèm QR và PIN (Admin)
  getAllTables: async () => {
    const data = await apiClient.get('/admin/tables');
    if (Array.isArray(data)) return data;
    if (data?.result && Array.isArray(data.result)) return data.result;
    return [];
  },

  // Sinh lại mã PIN 4 số ngẫu nhiên cho bàn (Admin)
  regeneratePin: async (tableId) => {
    const res = await apiClient.post(`/admin/tables/${tableId}/regenerate-pin`);
    return res?.result !== undefined ? res.result : res;
  },

  // Bật/tắt khóa order khẩn cấp
  toggleOrderLock: async (tableId) => {
    const res = await apiClient.post(`/admin/tables/${tableId}/toggle-order-lock`);
    return res?.result !== undefined ? res.result : res;
  },

  // Cập nhật trạng thái bàn
  updateTableStatus: async (tableId, status) => {
    const res = await apiClient.put(`/admin/tables/${tableId}/status?status=${status}`);
    return res?.result !== undefined ? res.result : res;
  },

  // Lấy thông tin cơ bản bàn khi khách quét QR
  getTablePublicInfo: async (identifier) => {
    const res = await apiClient.get(`/customer/tables/${identifier}/info`);
    return res?.result !== undefined ? res.result : res;
  },

  // Khách hàng xác thực mã PIN 4 số
  verifyPasscode: async (identifier, passcode, deviceFingerprint = 'web-client', deviceName = '') => {
    const res = await apiClient.post(`/customer/tables/${identifier}/verify-passcode`, {
      passcode,
      deviceFingerprint,
      deviceName,
    });
    return res?.result !== undefined ? res.result : res;
  },

  // Kiểm tra hiệu lực của phiên bàn ăn
  validateSession: async () => {
    try {
      const res = await apiClient.get('/customer/tables/validate-session');
      return res?.result !== undefined ? Boolean(res.result) : Boolean(res);
    } catch {
      const session = getStoredTableSession();
      return Boolean(session && session.sessionToken);
    }
  },

  // Lấy danh sách thiết bị đang kết nối vào bàn (Dành cho Khách Hàng)
  getDevices: async (identifier) => {
    try {
      const tableId = identifier || getStoredTableSession()?.tableNumber || 'B01';
      const data = await apiClient.get(`/customer/tables/${tableId}/devices`);
      return Array.isArray(data) ? data : (data?.result || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thiết bị khách hàng từ server:', err.message);
      return [];
    }
  },

  // Chủ Bàn đá một thiết bị ra khỏi bàn ăn
  kickDevice: async (identifier, targetDeviceToken) => {
    const tableId = identifier || getStoredTableSession()?.tableNumber || 'B01';
    return await apiClient.post(`/customer/tables/${tableId}/kick-device`, {
      targetDeviceToken,
    });
  },

  // Chủ Bàn chuyển quyền Chủ Bàn cho người khác
  transferHost: async (identifier, newHostDeviceToken) => {
    const tableId = identifier || getStoredTableSession()?.tableNumber || 'B01';
    return await apiClient.post(`/customer/tables/${tableId}/transfer-host`, {
      newHostDeviceToken,
    });
  },

  // Xem danh sách thiết bị đang kết nối vào bàn (Dành cho Quản Trị Viên)
  getAdminDevices: async (tableId) => {
    try {
      const data = await apiClient.get(`/admin/tables/${tableId}/devices`);
      return Array.isArray(data) ? data : (data?.result || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thiết bị bàn quản trị từ server:', err.message);
      return [];
    }
  },

  // Đặt lại quyền Chủ Bàn (Admin)
  adminResetHost: async (tableId) => {
    return await apiClient.post(`/admin/tables/${tableId}/reset-host`);
  },

  // Đá thiết bị (Admin)
  adminKickDevice: async (tableId, targetDeviceToken) => {
    return await apiClient.post(`/admin/tables/${tableId}/kick-device`, {
      targetDeviceToken,
    });
  },
};

export default tableApi;
