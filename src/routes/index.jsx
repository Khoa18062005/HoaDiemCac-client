import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import TableManagePage from '@/pages/admin/TableManagePage';
import MenuManagePage from '@/pages/admin/MenuManagePage';
import AdminEmployeeManagePage from '@/pages/admin/AdminEmployeeManagePage';
import AdminProfilePage from '@/pages/admin/AdminProfilePage';
import CustomerLayout from '@/layouts/CustomerLayout';
import MenuPage from '@/pages/customer/MenuPage';
import LoginPage from '@/pages/auth/LoginPage';

import useAuthStore from '@/stores/useAuthStore';

function PermissionRoute({ permission, adminOnly = false, children }) {
  const user = useAuthStore((state) => state.user);
  const rawRole = (user?.role || 'STAFF').replace(/^ROLE_/, '');
  const isAdmin = rawRole === 'ADMIN';

  if (isAdmin) return children;
  if (adminOnly) return <Navigate to="/admin" replace />;

  const permissions = user?.permissions || (
    rawRole === 'MANAGER' ? ['TABLES', 'MENU'] :
    rawRole === 'KITCHEN' ? ['MENU'] :
    ['TABLES']
  );

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/admin" replace />;
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
            <div className="p-8 text-center text-gold font-serif text-lg">
              Trang Quản Lý Bàn & QR (Đang xây dựng)
            </div>
          </PermissionRoute>
        ),
      },
      {
        path: 'invoices',
        element: (
          <PermissionRoute adminOnly>
            <div className="p-8 text-center text-gold font-serif text-lg">
              Trang Lịch Sử Hóa Đơn (Đang xây dựng)
            </div>
          </PermissionRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <PermissionRoute adminOnly>
            <div className="p-8 text-center text-gold font-serif text-lg">
              Trang Báo Cáo Doanh Thu (Đang xây dựng)
            </div>
          </PermissionRoute>
        ),
      },
    ],
  },
]);
