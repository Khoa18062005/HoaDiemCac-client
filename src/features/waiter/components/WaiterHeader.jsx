import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChefHat,
} from 'lucide-react';
import logoImg from '@/assets/images/logo.png';
import { useAuthStore } from '@/stores/useAuthStore';

export default function WaiterHeader({
  areaFilter = 'all',
  onChangeAreaFilter,
  isAudioMuted = false,
  onToggleAudio,
  onSimulateNewOrder,
  isFullscreen: propIsFullscreen,
  onToggleFullscreen: propToggleFullscreen,
}) {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  // Digital Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [internalFullscreen, setInternalFullscreen] = useState(Boolean(document.fullscreenElement));
  const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : internalFullscreen;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (propToggleFullscreen) {
      propToggleFullscreen();
      return;
    }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setInternalFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setInternalFullscreen(false)).catch(() => {});
      }
    }
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
    <header className="h-20 bg-[#101012] border-b border-surface-border px-4 flex items-center justify-between select-none z-30 flex-shrink-0 shadow-lg">
      {/* 1. Bên Trái: Logo & Màn hình phục vụ & Live Clock */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isFullscreen && (
            <img
              src={logoImg}
              alt="Hỏa Diệm Các"
              className="h-10 sm:h-11 w-auto object-contain cursor-pointer drop-shadow-[0_2px_10px_rgba(212,175,55,0.2)] hover:scale-105 transition-transform"
              onClick={() => navigate('/admin')}
              title="Hỏa Diệm Các - Nhấn để quay về Sơ đồ bàn"
            />
          )}
          <span
            className={`text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap ${
              isFullscreen ? 'pl-2 border-l border-white/20' : ''
            }`}
          >
            Màn hình phục vụ
          </span>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-card border border-surface-border">
          <Clock className="w-3.5 h-3.5 text-gold" />
          <span className="font-mono text-xs font-semibold text-white tracking-widest">{formattedTime}</span>
          <span className="text-[10px] text-[#8E8E93] uppercase">({formattedDate})</span>
        </div>
      </div>

      {/* 2. Ở Giữa: Lọc khu vực */}
      <div className="flex items-center gap-2 sm:gap-3">
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

      {/* 3. Bên Phải: Nút Chuyển Màn Hình Bếp & Tiện Ích */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Nút Chuyển sang Màn hình Bếp */}
        <button
          onClick={() => navigate('/kitchen')}
          className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-crimson-subtle border border-crimson-border text-xs text-white hover:bg-crimson/30 hover:border-crimson transition-all font-semibold active:scale-95"
          title="Nhấn để mở Màn hình Bếp (KDS)"
        >
          <ChefHat className="w-4 h-4 text-crimson-glow" />
          <span className="hidden md:inline">Màn Hình Bếp</span>
        </button>


        {/* Bật / Tắt âm thanh */}
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

        {/* Toàn màn hình */}
        <button
          onClick={toggleFullscreen}
          className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-colors select-none ${
            isFullscreen
              ? 'bg-gold/15 border-gold/40 text-gold hover:bg-gold/25'
              : 'bg-surface-card border-surface-border text-[#A0A0A5] hover:text-white hover:bg-surface-elevated'
          }`}
          title={isFullscreen ? 'Thu nhỏ (Hiện thanh Menu)' : 'Toàn màn hình (Ẩn thanh Menu)'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          <span className="hidden md:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>


      </div>
    </header>
  );
}
