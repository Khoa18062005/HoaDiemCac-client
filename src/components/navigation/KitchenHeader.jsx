import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Flame,
  PackageX,
  LogOut,
  LayoutGrid,
  Layers,
  BellRing,
} from 'lucide-react';
import logoImg from '@/assets/images/logo.png';
import { useAuthStore } from '@/stores/useAuthStore';

export default function KitchenHeader({
  viewMode = 'tickets',
  onChangeViewMode,
  areaFilter = 'all',
  onChangeAreaFilter,
  isAudioMuted = false,
  onToggleAudio,
  onOpenOutOfStockModal,
  onSimulateNewOrder,
}) {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Fallback user if not loaded from store
  const effectiveUser = authUser || (() => {
    try {
      const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const rawRole = (effectiveUser?.role || 'KITCHEN').replace(/^ROLE_/, '');
  const isAdminOrManager = rawRole === 'ADMIN' || rawRole === 'MANAGER';

  // Digital Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleLogout = () => {
    logout();
    try {
      sessionStorage.clear();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('hoadiemcat_auth');
    } catch {}
    navigate('/login');
  };

  const formattedTime = currentTime.toLocaleTimeString('vi-VN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <header className="h-16 bg-[#101012] border-b border-surface-border px-4 flex items-center justify-between select-none z-30 flex-shrink-0 shadow-lg">
      {/* 1. Bên Trái: Logo, Tiêu đề Trạm Bếp & Live Clock */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img
            src={logoImg}
            alt="Hỏa Diệm Các"
            className="h-10 sm:h-11 w-auto object-contain cursor-pointer drop-shadow-[0_2px_10px_rgba(212,175,55,0.2)] hover:scale-105 transition-transform"
            onClick={() => navigate('/admin')}
            title="Hỏa Diệm Các - Nhấn để quay về Admin"
          />
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap pl-2 border-l border-white/20">
            Màn hình bếp
          </span>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-card border border-surface-border">
          <Clock className="w-3.5 h-3.5 text-gold" />
          <span className="font-mono text-xs font-semibold text-white tracking-widest">{formattedTime}</span>
          <span className="text-[10px] text-[#8E8E93] uppercase">({formattedDate})</span>
        </div>
      </div>

      {/* 2. Ở Giữa: Chuyển chế độ xem (View Mode) & Bộ lọc khu vực */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Toggle Chế độ xem: Thẻ đơn bàn vs Gom món */}
        {onChangeViewMode && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-card border border-surface-border h-9">
            <button
              type="button"
              onClick={() => onChangeViewMode('tickets')}
              className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'tickets'
                  ? 'bg-crimson text-white shadow-sm'
                  : 'text-[#A0A0A5] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Theo Đơn Bàn</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeViewMode('aggregated')}
              className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'aggregated'
                  ? 'bg-crimson text-white shadow-sm'
                  : 'text-[#A0A0A5] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gom Món Nấu</span>
            </button>
          </div>
        )}

        {/* Lọc Khu Vực: Tất Cả / Sảnh / VIP */}
        {onChangeAreaFilter && (
          <div className="flex items-center gap-1 bg-surface-card p-1 rounded-lg border border-surface-border h-9">
            <button
              type="button"
              onClick={() => onChangeAreaFilter('all')}
              className={`h-7 flex items-center justify-center px-3 rounded-md text-xs font-medium transition-all ${
                areaFilter === 'all'
                  ? 'bg-gold/20 text-gold font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Tất Cả
            </button>
            <button
              type="button"
              onClick={() => onChangeAreaFilter('COMMON')}
              className={`h-7 flex items-center justify-center px-3 rounded-md text-xs font-medium transition-all ${
                areaFilter === 'COMMON'
                  ? 'bg-gold/20 text-gold font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Sảnh Chung
            </button>
            <button
              type="button"
              onClick={() => onChangeAreaFilter('VIP')}
              className={`h-7 flex items-center justify-center px-3 rounded-md text-xs font-medium transition-all ${
                areaFilter === 'VIP'
                  ? 'bg-gold/20 text-gold font-bold'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Phòng VIP
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Nút Giả lập nhận đơn mới (Demo Simulator) */}
        <button
          onClick={onSimulateNewOrder}
          className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-crimson-subtle border border-crimson-border text-xs text-white hover:bg-crimson/30 hover:border-crimson transition-all font-medium active:scale-95"
          title="Bấm để thử nhận 1 đơn món mới kèm chuông báo"
        >
          <Flame className="w-3.5 h-3.5 text-crimson-glow" />
          <span className="hidden xl:inline">Thử Đơn Mới</span>
        </button>

        {/* Nút Báo Hết Món Khẩn Cấp (UC19) */}
        <button
          onClick={onOpenOutOfStockModal}
          className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-amber-subtle border border-amber/30 text-amber hover:bg-amber/20 transition-all text-xs font-medium active:scale-95"
          title="Báo hết món khẩn cấp giữa ca (UC19)"
        >
          <PackageX className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Báo Hết Món</span>
        </button>

        {/* Bật/Tắt Âm Thanh Chuông Báo */}
        <button
          onClick={onToggleAudio}
          className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all ${
            isAudioMuted
              ? 'bg-surface-card border-surface-border text-[#8E8E93] hover:text-white'
              : 'bg-gold/10 border-gold/40 text-gold hover:bg-gold/20'
          }`}
          title={isAudioMuted ? 'Đang tắt chuông. Nhấn để bật âm thanh Ting-ting' : 'Đang bật chuông. Nhấn để tắt âm thanh'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Nút Chế Độ Toàn Màn Hình */}
        <button
          onClick={toggleFullscreen}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-card border border-surface-border text-[#A0A0A5] hover:text-white hover:bg-surface-elevated transition-colors hidden sm:flex"
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình KDS'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Nút Chuyển Về Menu Quản Trị (Nếu là Admin/Manager) */}
        {isAdminOrManager && (
          <button
            onClick={() => navigate('/admin')}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-card border border-surface-border text-gold hover:bg-gold/10 transition-colors"
            title="Mở giao diện Quản Trị / Sơ đồ bàn"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        )}

        {/* Nút Đăng Xuất */}
        <button
          onClick={handleLogout}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-card border border-surface-border text-[#8E8E93] hover:text-crimson hover:bg-surface-elevated transition-colors"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
