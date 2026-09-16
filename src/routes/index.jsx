import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import TableManagePage from '@/pages/admin/TableManagePage';
import MenuManagePage from '@/pages/admin/MenuManagePage';
import AdminEmployeeManagePage from '@/pages/admin/AdminEmployeeManagePage';
import AdminProfilePage from '@/pages/admin/AdminProfilePage';
import CustomerLayout from '@/layouts/CustomerLayout';
import KitchenLayout from '@/layouts/KitchenLayout';
import MenuPage from '@/pages/customer/MenuPage';
import KitchenKdsPage from '@/pages/kitchen/KitchenKdsPage';
import WaiterDisplayPage from '@/pages/waiter/WaiterDisplayPage';
import LoginPage from '@/pages/auth/LoginPage';

import useAuthStore from '@/stores/useAuthStore';

function PermissionRoute({ permission, adminOnly = false, children }) {
  const user = useAuthStore((state) => state.user);
  const rawRole = (user?.role || 'KITCHEN').replace(/^ROLE_/, '');
  const isAdmin = rawRole === 'ADMIN';

  if (isAdmin) return children;
  const fallbackRedirect = rawRole === 'KITCHEN' ? '/kitchen' : '/admin';

  if (adminOnly) return <Navigate to={fallbackRedirect} replace />;

  const permissions = user?.permissions || (
    rawRole === 'MANAGER' ? ['TABLES', 'MENU', 'KITCHEN', 'WAITER'] :
    rawRole === 'KITCHEN' ? ['KITCHEN', 'MENU'] :
    ['TABLES', 'KITCHEN', 'WAITER']
  );

  // Trạm Bếp KDS và Màn hình Phục Vụ cho phép truy cập trực tiếp
  if (permission === 'KITCHEN' || permission === 'WAITER') {
    return children;
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to={fallbackRedirect} replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin/login',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/menu',
    element: <CustomerLayout />,
    children: [
      {
        index: true,
        element: <MenuPage />,
      },
    ],
  },
  {
    path: '/table/:tableId',
    element: <CustomerLayout />,
    children: [
      {
        index: true,
        element: <MenuPage />,
      },
    ],
  },
  {
    path: '/customer',
    element: <CustomerLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="menu" replace />,
      },
      {
        path: 'menu',
        element: <MenuPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: (
          <PermissionRoute permission="TABLES">
            <TableManagePage />
          </PermissionRoute>
        ),
      },
      {
        path: 'menu',
        element: (
          <PermissionRoute permission="MENU">
            <MenuManagePage />
          </PermissionRoute>
        ),
      },
      {
        path: 'employees',
        element: (
          <PermissionRoute adminOnly>
            <AdminEmployeeManagePage />
          </PermissionRoute>
        ),
      },
      {
        path: 'profile',
        element: <AdminProfilePage />,
      },
      {
        path: 'staff',
        element: <Navigate to="/admin/employees" replace />,
      },
      {
        path: 'tables-qr',
        element: (
          <PermissionRoute adminOnly>
            <div className="p-8 text-center text-gold font-sans text-lg">
              Trang Quản Lý Bàn & QR (Đang xây dựng)
            </div>
          </PermissionRoute>
        ),
      },
      {
        path: 'invoices',
        element: (
          <PermissionRoute adminOnly>
            <div className="p-8 text-center text-gold font-sans text-lg">
              Trang Lịch Sử Hóa Đơn (Đang xây dựng)
            </div>
          </PermissionRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <PermissionRoute adminOnly>
            <div className="p-8 text-center text-gold font-sans text-lg">
              Trang Báo Cáo Doanh Thu (Đang xây dựng)
            </div>
          </PermissionRoute>
        ),
      },
      {
        path: 'kitchen',
        element: <Navigate to="/kitchen" replace />,
      },
      {
        path: 'waiter',
        element: <Navigate to="/waiter" replace />,
      },
    ],
  },
  {
    path: '/kitchen',
    element: (
      <PermissionRoute permission="KITCHEN">
        <KitchenLayout />
      </PermissionRoute>
    ),
    children: [
      {
        index: true,
        element: <KitchenKdsPage />,
      },
    ],
  },
  {
    path: '/waiter',
    element: (
      <PermissionRoute permission="WAITER">
        <KitchenLayout />
      </PermissionRoute>
    ),
    children: [
      {
        index: true,
        element: <WaiterDisplayPage />,
      },
    ],
  },
]);
