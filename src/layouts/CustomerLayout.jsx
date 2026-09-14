import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * CustomerLayout
 * Layout thích ứng đa nền tảng cho thực khách quét mã gọi món tại bàn:
 * - Điện thoại (Mobile): Chiếm trọn 100dvh mượt mà.
 * - Máy tính bảng (iPad): Mở rộng toàn diện màn hình tablet cảm ứng.
 * - Máy tính/Laptop (Desktop): Hiển thị bố cục Banquet Suite cao cấp (max-w-[1600px]).
 */
export default function CustomerLayout() {
  return (
    <div className="min-h-screen w-full bg-[#0A0A0D] flex justify-center items-stretch overflow-hidden selection:bg-crimson selection:text-white">
      {/* Khung Container Thích Ứng 3 Nền Tảng */}
      <div className="w-full lg:max-w-[1600px] h-[100dvh] flex flex-col bg-[#0F0F12] text-[#E5E1E4] overflow-hidden relative lg:shadow-[0_0_60px_rgba(0,0,0,0.9)] lg:border-x lg:border-[rgba(212,175,55,0.2)]">
        <Outlet />
      </div>
    </div>
  );
}
