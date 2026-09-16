import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * KitchenLayout
 * Khung toàn màn hình tối ưu chuyên dụng cho trạm Bếp KDS (Kitchen Display System).
 * Tương thích tốt với Tablet ngang, Màn hình cảm ứng POS hoặc Smart TV treo tường trong bếp.
 * Theme nền tối chống chói (Dark mode) và hiệu năng hiển thị cao.
 */
export default function KitchenLayout() {
  return (
    <div className="h-screen w-screen bg-[#0A0A0D] text-[#EDEDED] flex flex-col overflow-hidden select-none font-sans">
      <Outlet />
    </div>
  );
}
