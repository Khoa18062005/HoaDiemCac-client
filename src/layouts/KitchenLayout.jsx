import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/navigation/AdminSidebar';

/**
 * KitchenLayout
 * Khung hiển thị cho trạm Bếp KDS (Kitchen Display System) và Màn hình Phục Vụ (Waiter).
 * - Mặc định: Hiển thị thanh điều hướng Admin (AdminSidebar) bên trái như trang quản trị.
 * - Chế độ toàn màn hình (Fullscreen): Tự động ẩn AdminSidebar và mở rộng 100% màn hình,
 *   tối ưu cho màn hình cảm ứng POS, Smart TV hoặc Tablet trong bếp.
 */
export default function KitchenLayout() {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && !isFullscreen) {
      const docEl = document.documentElement;
      const req =
        docEl.requestFullscreen ||
        docEl.webkitRequestFullscreen ||
        docEl.mozRequestFullScreen ||
        docEl.msRequestFullscreen;
      if (req) {
        req.call(docEl).then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      if (document.fullscreenElement && exit) {
        exit.call(document).then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian select-none">
      {/* Cột 1: Admin Left Sidebar - ẩn khi ở chế độ xem toàn màn hình */}
      {!isFullscreen && <AdminSidebar />}

      {/* Cột 2: Nội dung chính KDS / Waiter */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0A0A0D] text-[#EDEDED] relative">
        <Outlet context={{ isFullscreen, toggleFullscreen }} />
      </main>
    </div>
  );
}
