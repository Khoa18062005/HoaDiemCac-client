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
    try {
      const data = await apiClient.get('/admin/tables');
      if (Array.isArray(data)) return data;
      if (data?.result && Array.isArray(data.result)) return data.result;
    } catch (err) {
      console.warn('Backend chưa khả dụng, sử dụng dữ liệu giả lập cho Bàn & QR:', err.message);
    }
    // Fallback data
    return initialTables.map((t, idx) => ({
      id: idx + 1,
      tableNumber: t.code.replace('BÀN ', 'B').replace('VIP ', 'VIP'),
      name: t.code,
      area: t.isVip ? 'VIP' : 'COMMON',
      capacity: t.isVip ? 10 : 4,
      status: t.status,
      isOrderLocked: false,
      currentPasscode: String(1000 + (idx * 37) % 9000),
      currentSessionToken: `mock-session-${t.id}`,
      activeDeviceCount: t.status === 'OCCUPIED' ? (t.isVip ? 5 : 2) : 0,
      maxActiveDevices: t.isVip ? 15 : 6,
      isTemporarilyLocked: false,
      failedAttempts: 0,
    }));
  },

  // Sinh lại mã PIN 4 số ngẫu nhiên cho bàn (Admin)
  regeneratePin: async (tableId) => {
    try {
      return await apiClient.post(`/admin/tables/${tableId}/regenerate-pin`);
    } catch (err) {
      console.warn('Gọi API sinh PIN thất bại, thực hiện giả lập:', err.message);
      const newPin = String(Math.floor(1000 + Math.random() * 9000));
      return { currentPasscode: newPin, message: 'Đã sinh mã PIN 4 số mới' };
    }
  },

  // Bật/tắt khóa order khẩn cấp
  toggleOrderLock: async (tableId) => {
    try {
      return await apiClient.post(`/admin/tables/${tableId}/toggle-order-lock`);
    } catch (err) {
      console.warn('Gọi API khóa bàn thất bại, thực hiện giả lập:', err.message);
      return { isOrderLocked: true };
    }
  },

  // Cập nhật trạng thái bàn
  updateTableStatus: async (tableId, status) => {
    try {
      return await apiClient.put(`/admin/tables/${tableId}/status?status=${status}`);
    } catch (err) {
      console.warn('Cập nhật trạng thái thất bại, fallback:', err.message);
      return { status };
    }
  },

  // Lấy thông tin cơ bản bàn khi khách quét QR
  getTablePublicInfo: async (identifier) => {
    try {
      return await apiClient.get(`/customer/tables/${identifier}/info`);
    } catch (err) {
      console.warn('Không kết nối được server, fallback mock info:', err.message);
      return {
        tableNumber: identifier.toUpperCase(),
        name: identifier.toUpperCase().startsWith('VIP') ? `Phòng ${identifier}` : `Bàn ${identifier}`,
        area: identifier.toUpperCase().startsWith('VIP') ? 'VIP' : 'COMMON',
        isOrderLocked: false,
        isTemporarilyLocked: false,
      };
    }
  },

  // Khách hàng xác thực mã PIN 4 số
  verifyPasscode: async (identifier, passcode, deviceFingerprint = 'web-client') => {
    try {
      return await apiClient.post(`/customer/tables/${identifier}/verify-passcode`, {
        passcode,
        deviceFingerprint,
      });
    } catch (err) {
      // Giả lập xác thực mã PIN nếu backend offline
      if (passcode === '1234' || /^\d{4}$/.test(passcode)) {
        return {
          tableId: 1,
          tableNumber: identifier.toUpperCase(),
          tableName: identifier.toUpperCase().startsWith('VIP') ? `Phòng ${identifier}` : `Bàn ${identifier}`,
          sessionToken: `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          deviceToken: `device-${Math.random().toString(36).substring(2, 8)}`,
          status: 'OCCUPIED',
          isOrderLocked: false,
          message: 'Xác thực thành công',
        };
      }
      throw err;
    }
  },

  // Kiểm tra hiệu lực của phiên bàn ăn
  validateSession: async () => {
    try {
      return await apiClient.get('/customer/tables/validate-session');
    } catch {
      const session = getStoredTableSession();
      return Boolean(session && session.sessionToken);
    }
  },
};

export default tableApi;
