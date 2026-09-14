import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store quản lý trạng thái xác thực và phân quyền nhân sự/quản trị viên (UC09, UC20).
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, jwtToken) =>
        set({
          user: userData,
          token: jwtToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      hasRole: (requiredRole) => {
        const { user } = get();
        if (!user || !user.role) return false;
        // Chuẩn hóa so sánh không phân biệt tiền tố ROLE_
        const currentRole = user.role.replace(/^ROLE_/, '');
        const targetRole = requiredRole.replace(/^ROLE_/, '');
        return currentRole === targetRole;
      },
    }),
    {
      name: 'hoadiemcat_auth',
    }
  )
);

export default useAuthStore;
