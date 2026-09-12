import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/navigation/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian">
      {/* Cột 1: Slim Left Navigation Sidebar (Rộng: 220px) */}
      <AdminSidebar />

      {/* Cột 2: Vùng nội dung chính thay đổi theo từng trang */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian border-r border-surface-border">
        <Outlet />
      </main>
    </div>
  );
}
