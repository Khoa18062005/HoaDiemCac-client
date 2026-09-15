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
        element: <TableManagePage />,
      },
      {
        path: 'menu',
        element: <MenuManagePage />,
      },
      {
        path: 'employees',
        element: <AdminEmployeeManagePage />,
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
          <div className="p-8 text-center text-gold font-serif text-lg">
            Trang Quản Lý Bàn & QR (Đang xây dựng)
          </div>
        ),
      },
      {
        path: 'invoices',
        element: (
          <div className="p-8 text-center text-gold font-serif text-lg">
            Trang Lịch Sử Hóa Đơn (Đang xây dựng)
          </div>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <div className="p-8 text-center text-gold font-serif text-lg">
            Trang Báo Cáo Doanh Thu (Đang xây dựng)
          </div>
        ),
      },
    ],
  },
]);
