import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/axios';

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

      logout: () => {
        try {
          localStorage.removeItem('currentUser');
          sessionStorage.removeItem('currentUser');
        } catch {}
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      syncUserProfile: async () => {
        const { token, isAuthenticated, logout, user } = get();
        if (!token || !isAuthenticated) return;

        try {
          const freshUser = await apiClient.get('/auth/me');
          if (freshUser) {
            // Nếu tài khoản bị khóa hoặc vô hiệu hóa, tự động đăng xuất
            if (freshUser.status === 'INACTIVE') {
              logout();
              if (
                window.location.pathname.startsWith('/admin') ||
                window.location.pathname.startsWith('/kitchen') ||
                window.location.pathname.startsWith('/waiter')
              ) {
                window.location.href = '/login?reason=locked';
              }
              return;
            }

            // Cập nhật lại thông tin user mới nhất bao gồm role & permissions
            const isChanged = JSON.stringify(freshUser) !== JSON.stringify(user);
            if (isChanged) {
              set({
                user: {
                  ...user,
                  ...freshUser,
                },
              });
            }
          }
        } catch (err) {
          // Nếu lỗi xác thực (401), đăng xuất người dùng
          if (
            err.response?.status === 401 ||
            err.message?.includes('401') ||
            err.message?.includes('Chưa xác thực')
          ) {
            logout();
            if (
              window.location.pathname.startsWith('/admin') ||
              window.location.pathname.startsWith('/kitchen') ||
              window.location.pathname.startsWith('/waiter')
            ) {
              window.location.href = '/login';
            }
          }
        }
      },

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
