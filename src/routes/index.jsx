import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import TableManagePage from '@/pages/admin/TableManagePage';
import MenuManagePage from '@/pages/admin/MenuManagePage';
import AdminEmployeeManagePage from '@/pages/admin/AdminEmployeeManagePage';
import AdminProfilePage from '@/pages/admin/AdminProfilePage';
import AdminTablesQrPage from '@/pages/admin/AdminTablesQrPage';
import AdminInvoicesPage from '@/pages/admin/AdminInvoicesPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import CustomerLayout from '@/layouts/CustomerLayout';
import KitchenLayout from '@/layouts/KitchenLayout';
import MenuPage from '@/pages/customer/MenuPage';
import TableEntryPage from '@/pages/customer/TableEntryPage';
import KitchenKdsPage from '@/pages/kitchen/KitchenKdsPage';
import WaiterDisplayPage from '@/pages/waiter/WaiterDisplayPage';
import LoginPage from '@/pages/auth/LoginPage';
import ProtectedRoute from '@/routes/ProtectedRoute';

import useAuthStore from '@/stores/useAuthStore';

function PermissionRoute({ permission, adminOnly = false, children }) {
  const { user, token, isAuthenticated } = useAuthStore();
  const isUserAuthenticated = Boolean(isAuthenticated && token && user);

  // Nếu chưa đăng nhập, bắt buộc chuyển hướng về trang /login
  if (!isUserAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const rawRole = (user?.role || 'STAFF').replace(/^ROLE_/, '');
  const isAdmin = rawRole === 'ADMIN';

  if (isAdmin) return children;

  const permissions = user?.permissions || (
    rawRole === 'MANAGER' ? ['DASHBOARD', 'INVOICES', 'MENU', 'KITCHEN', 'WAITER', 'TABLES_QR'] :
    rawRole === 'KITCHEN' ? ['KITCHEN'] :
    ['WAITER']
  );

  const getFallbackRedirect = () => {
    if (permissions.includes('TABLES')) return '/admin';
    if (permissions.includes('KITCHEN')) return '/kitchen';
    if (permissions.includes('WAITER')) return '/waiter';
    if (permissions.includes('MENU')) return '/admin/menu';
    if (permissions.includes('TABLES_QR')) return '/admin/tables-qr';
    if (permissions.includes('INVOICES')) return '/admin/invoices';
    if (permissions.includes('DASHBOARD')) return '/admin/dashboard';
    return '/admin/profile';
  };

  const fallbackRedirect = getFallbackRedirect();

  if (adminOnly) return <Navigate to={fallbackRedirect} replace />;

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
    element: <TableEntryPage />,
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
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
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
          <PermissionRoute permission="TABLES_QR">
            <AdminTablesQrPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'invoices',
        element: (
          <PermissionRoute permission="INVOICES">
            <AdminInvoicesPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <PermissionRoute permission="DASHBOARD">
            <AdminDashboardPage />
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
      <ProtectedRoute>
        <PermissionRoute permission="KITCHEN">
          <KitchenLayout />
        </PermissionRoute>
      </ProtectedRoute>
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
      <ProtectedRoute>
        <PermissionRoute permission="WAITER">
          <KitchenLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <WaiterDisplayPage />,
      },
    ],
  },
]);
