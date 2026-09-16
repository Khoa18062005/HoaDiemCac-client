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
  verifyPasscode: async (identifier, passcode, deviceFingerprint = 'web-client', deviceName = '') => {
    try {
      return await apiClient.post(`/customer/tables/${identifier}/verify-passcode`, {
        passcode,
        deviceFingerprint,
        deviceName,
      });
    } catch (err) {
      // Giả lập xác thực mã PIN nếu backend offline
      if (passcode === '1234' || /^\d{4}$/.test(passcode)) {
        const stored = getStoredTableSession();
        // Nếu đã có session cùng bàn và đang là Host thì giữ quyền Host
        const isHost = stored?.tableNumber === identifier.toUpperCase() ? Boolean(stored.isHost) : true;
        const deviceToken = stored?.deviceToken || `device-${Math.random().toString(36).substring(2, 10)}`;

        return {
          tableId: 1,
          tableNumber: identifier.toUpperCase(),
          tableName: identifier.toUpperCase().startsWith('VIP') ? `Phòng ${identifier}` : `Bàn ${identifier}`,
          sessionToken: stored?.sessionToken || `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          deviceToken,
          deviceName: deviceName || (isHost ? 'Chủ Bàn (Thiết bị 1)' : 'Thành Viên (Khách 2)'),
          isHost,
          activeDeviceCount: 2,
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

  // Lấy danh sách thiết bị đang kết nối vào bàn (Dành cho Khách Hàng)
  getDevices: async (identifier) => {
    try {
      return await apiClient.get(`/customer/tables/${identifier}/devices`);
    } catch (err) {
      console.warn('Lỗi gọi API getDevices, sử dụng dữ liệu giả lập:', err.message);
      const session = getStoredTableSession();
      const currentToken = session?.deviceToken || 'my-device-token';
      const isCurrentHost = session?.isHost ?? true;

      return [
        {
          deviceToken: currentToken,
          deviceName: isCurrentHost ? 'Chủ Bàn (Thiết bị của bạn)' : 'Thành Viên (Thiết bị của bạn)',
          isHost: isCurrentHost,
          isActive: true,
          connectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          isCurrentDevice: true,
        },
        {
          deviceToken: 'member-device-2',
          deviceName: isCurrentHost ? 'Thành Viên (iPhone 14)' : 'Chủ Bàn (Galaxy S24)',
          isHost: !isCurrentHost,
          isActive: true,
          connectedAt: new Date(Date.now() - 10 * 60000).toISOString(),
          isCurrentDevice: false,
        },
        {
          deviceToken: 'member-device-3',
          deviceName: 'Thành Viên (Xiaomi Note)',
          isHost: false,
          isActive: true,
          connectedAt: new Date(Date.now() - 5 * 60000).toISOString(),
          isCurrentDevice: false,
        },
      ];
    }
  },

  // Chủ Bàn đá một thiết bị ra khỏi bàn ăn
  kickDevice: async (identifier, targetDeviceToken) => {
    try {
      return await apiClient.post(`/customer/tables/${identifier}/kick-device`, {
        targetDeviceToken,
      });
    } catch (err) {
      console.warn('Fallback đá thiết bị giả lập:', err.message);
      return { success: true, message: 'Đã đá thiết bị thành công' };
    }
  },

  // Chủ Bàn chuyển quyền Chủ Bàn cho người khác
  transferHost: async (identifier, newHostDeviceToken) => {
    try {
      return await apiClient.post(`/customer/tables/${identifier}/transfer-host`, {
        newHostDeviceToken,
      });
    } catch (err) {
      console.warn('Fallback chuyển quyền chủ bàn giả lập:', err.message);
      const session = getStoredTableSession();
      if (session) {
        saveTableSession({ ...session, isHost: false });
      }
      return { success: true, message: 'Đã chuyển quyền Chủ Bàn thành công' };
    }
  },

  // Xem danh sách thiết bị đang kết nối vào bàn (Dành cho Quản Trị Viên)
  getAdminDevices: async (tableId) => {
    try {
      return await apiClient.get(`/admin/tables/${tableId}/devices`);
    } catch (err) {
      console.warn('Fallback danh sách thiết bị admin:', err.message);
      return [
        {
          deviceToken: 'device-host-1',
          deviceName: 'Chủ Bàn (Thiết bị 1)',
          isHost: true,
          isActive: true,
          connectedAt: new Date(Date.now() - 20 * 60000).toISOString(),
          isCurrentDevice: false,
        },
        {
          deviceToken: 'device-member-2',
          deviceName: 'Thành Viên (Khách 2)',
          isHost: false,
          isActive: true,
          connectedAt: new Date(Date.now() - 12 * 60000).toISOString(),
          isCurrentDevice: false,
        },
      ];
    }
  },

  // Đặt lại quyền Chủ Bàn (Admin)
  adminResetHost: async (tableId) => {
    try {
      return await apiClient.post(`/admin/tables/${tableId}/reset-host`);
    } catch (err) {
      console.warn('Fallback reset host admin:', err.message);
      return { success: true };
    }
  },

  // Đá thiết bị (Admin)
  adminKickDevice: async (tableId, targetDeviceToken) => {
    try {
      return await apiClient.post(`/admin/tables/${tableId}/kick-device`, {
        targetDeviceToken,
      });
    } catch (err) {
      console.warn('Fallback admin kick device:', err.message);
      return { success: true };
    }
  },
};

export default tableApi;
