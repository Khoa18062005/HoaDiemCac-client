import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import TableManagePage from '@/pages/admin/TableManagePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
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
        element: (
          <div className="p-8 text-center text-gold font-serif text-lg">
            Trang Quản Lý Thực Đơn (Đang xây dựng)
          </div>
        ),
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
