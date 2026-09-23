import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Component bảo vệ tuyến đường (Route Guard):
 * Kiểm tra trạng thái đăng nhập (token & user).
 * Tự động đồng bộ quyền hạn (permissions) và trạng thái tài khoản từ server khi đổi route, focus tab hoặc định kỳ.
 * Nếu chưa đăng nhập, tự động chuyển hướng về trang /login và lưu lại đường dẫn gốc.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, token, user, syncUserProfile } = useAuthStore();

  const isUserAuthenticated = Boolean(isAuthenticated && token && user);

  // Tự động đồng bộ phân quyền từ máy chủ theo thời gian thực
  useEffect(() => {
    if (!isUserAuthenticated || !syncUserProfile) return;

    // 1. Đồng bộ ngay khi đổi trang / tuyến đường
    syncUserProfile();

    // 2. Đồng bộ khi quay lại tab trình duyệt
    const handleFocus = () => {
      syncUserProfile();
    };
    window.addEventListener('focus', handleFocus);

    // 3. Polling ngầm mỗi 15 giây để cập nhật quyền ngay tức thì khi Admin cấp quyền
    const intervalId = setInterval(() => {
      syncUserProfile();
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [location.pathname, isUserAuthenticated, syncUserProfile]);

  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
}
