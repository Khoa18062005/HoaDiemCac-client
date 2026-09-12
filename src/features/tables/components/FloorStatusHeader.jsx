import React, { useRef, useState, useEffect, useCallback } from 'react';

const TABS = [
  {
    id: 'ALL',
    label: 'Tất Cả',
    countKey: 'total',
    color: '#E5E7EB', // Bạc / Trắng
    dotColor: 'bg-[#E5E7EB] shadow-sm shadow-white/50',
  },
  {
    id: 'AVAILABLE',
    label: 'Bàn Trống',
    countKey: 'available',
    color: '#34A853', // Ngọc Bích
    dotColor: 'bg-jade-bright shadow-sm shadow-jade-bright/40',
  },
  {
    id: 'OCCUPIED',
    label: 'Đang Phục Vụ',
    countKey: 'occupied',
    color: '#c41e3a', // Xích Diễm
    dotColor: 'bg-crimson-glow shadow-sm shadow-crimson-glow/40',
  },
  {
    id: 'CLEANING',
    label: 'Đang Dọn Dẹp',
    countKey: 'cleaning',
    color: '#EAB308', // Hổ Phách
    dotColor: 'bg-[#EAB308] shadow-sm shadow-[#EAB308]/40',
  },
  {
    id: 'PAYING',
    label: 'Chờ Thanh Toán',
    countKey: 'paying',
    color: '#3B82F6', // Xanh Dương
    icon: '💵',
  },
  {
    id: 'CALL_STAFF',
    label: 'Có Chuông Gọi',
    countKey: 'callStaff',
    color: '#c41e3a', // Xích Diễm
    icon: '🛎️',
  },
];

export default function FloorStatusHeader({
  stats = {},
  activeTab = 'ALL',
  onSelectTab,
}) {
  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  const updateSlider = useCallback(() => {
    const container = containerRef.current;
    const currentTabEl = tabRefs.current[activeTab];
    if (container && currentTabEl) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = currentTabEl.getBoundingClientRect();

      // Căn chỉnh thanh trượt nằm gọn gàng bên dưới chữ & icon (chừa lề 8px mỗi bên)
      const inset = 8;
      const calculatedWidth = Math.max(tabRect.width - inset * 2, 24);
      const calculatedLeft = tabRect.left - containerRect.left + inset;

      setSliderStyle({
        left: calculatedLeft,
        width: calculatedWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateSlider();
    const timeoutId = setTimeout(updateSlider, 50);
    return () => clearTimeout(timeoutId);
  }, [updateSlider, stats]);

  useEffect(() => {
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [updateSlider]);

  return (
    <header className="h-20 border-b border-surface-border px-8 py-4 flex items-center bg-surface/80 backdrop-blur-md flex-shrink-0 justify-end">
      {/* Container nhóm các button tabs trạng thái với thanh trượt indicator */}
      <div
        ref={containerRef}
        className="relative flex items-center gap-1 sm:gap-2 pb-1.5"
        role="tablist"
        aria-label="Lọc trạng thái bàn ăn"
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = stats[tab.countKey] ?? 0;

          return (
            <button
              key={tab.id}
              ref={el => (tabRefs.current[tab.id] = el)}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`group relative px-3 py-2 text-xs transition-all duration-200 flex items-center gap-2 rounded-lg outline-none cursor-pointer select-none ${
                isActive
                  ? 'text-white font-semibold bg-surface-elevated/40'
                  : 'text-[#A0A0A5] hover:text-[#EDEDED] hover:bg-surface-hover font-medium'
              }`}
              title={`Lọc theo: ${tab.label}`}
            >
              {/* Dot trạng thái hoặc Icon chuông */}
              {tab.dotColor && (
                <span className={`w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${tab.dotColor}`} />
              )}
              {tab.icon && (
                <span
                  className={`text-xs inline-block ${
                    count > 0 && tab.id === 'CALL_STAFF' ? 'animate-bell-shake' : ''
                  }`}
                >
                  {tab.icon}
                </span>
              )}

              {/* Tên trạng thái */}
              <span className="tracking-wide">{tab.label}</span>

              {/* Số lượng bàn */}
              <span
                className={`font-mono text-xs transition-colors ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-[#8E8E93] group-hover:text-[#C5C5CA]'
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}

        {/* Thanh trượt màu chuyển động mượt mà (smooth sliding indicator) nằm bên dưới chữ */}
        <span
          className="absolute bottom-0 h-[3px] rounded-full transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${sliderStyle.left}px`,
            width: `${sliderStyle.width}px`,
            backgroundColor: activeTabObj.color,
            boxShadow: `0 0 12px ${activeTabObj.color}99`,
            opacity: sliderStyle.width > 0 ? 1 : 0,
          }}
        />
      </div>
    </header>
  );
}
