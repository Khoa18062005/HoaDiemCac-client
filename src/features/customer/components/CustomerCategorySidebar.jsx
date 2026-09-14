import React, { useRef, useEffect } from 'react';
import { Flame, CookingPot, Beef, Fish, Salad, CupSoda } from 'lucide-react';

export const CATEGORY_ICONS = {
  flame: <Flame className="w-5 h-5" strokeWidth={2} />,
  pot: <CookingPot className="w-5 h-5" strokeWidth={2} />,
  beef: <Beef className="w-5 h-5" strokeWidth={2} />,
  seafood: <Fish className="w-5 h-5" strokeWidth={2} />,
  meatball: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="14.5" r="3.5" />
      <circle cx="16.5" cy="14.5" r="3.5" />
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M12 2v2" />
      <path d="M7.5 3.5v1.5" />
      <path d="M16.5 3.5v1.5" />
    </svg>
  ),
  veggie: <Salad className="w-5 h-5" strokeWidth={2} />,
  drink: <CupSoda className="w-5 h-5" strokeWidth={2} />,
};

/**
 * CustomerCategorySidebar
 * Thanh điều hướng danh mục thích ứng:
 * - Mobile & Tablet (< lg): Cột dọc gọn gàng 80px - 88px.
 * - Laptop / Desktop (lg+): Mở rộng 220px - 240px với hàng ngang sang trọng, icon + tên + badge.
 */
export default function CustomerCategorySidebar({
  categories = [],
  activeCategoryId,
  onSelectCategory,
}) {
  const sidebarRef = useRef(null);

  // Tự động cuộn nhẹ tab đang active vào tầm mắt khi người dùng cuộn thực đơn
  useEffect(() => {
    if (!sidebarRef.current) return;
    const activeBtn = sidebarRef.current.querySelector(`[data-category-btn="${activeCategoryId}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeCategoryId]);

  return (
    <aside
      ref={sidebarRef}
      className="w-[80px] sm:w-[88px] lg:w-56 xl:w-60 flex-shrink-0 bg-[#16161A] border-r border-[rgba(212,175,55,0.15)] overflow-y-auto no-scrollbar pb-24 lg:pb-6 text-xs select-none"
    >
      {/* Title trên Desktop */}
      <div className="hidden lg:block px-4 pt-4 pb-2 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
          Danh Mục Thực Đơn
        </span>
      </div>

      <nav className="flex flex-col lg:p-2 lg:space-y-1">
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              data-category-btn={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`relative transition-all duration-150 border-b lg:border-none border-white/5 ${
                /* Responsive Styling: Mobile vs Desktop */
                isActive
                  ? 'bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white font-bold shadow-[0_0_12px_rgba(196,30,58,0.4)] lg:rounded-xl'
                  : 'bg-transparent text-[#D6D3CD] font-medium hover:bg-white/5 lg:rounded-xl'
              } 
              /* Mobile: căn giữa, icon trên chữ dưới */
              py-3.5 px-1.5 flex flex-col items-center justify-center text-center
              /* Desktop: căn trái, hàng ngang, icon cạnh chữ */
              lg:py-3 lg:px-3 lg:flex-row lg:items-center lg:justify-start lg:text-left lg:gap-3
              `}
            >
              {/* Active Gold Indicator Bar (chỉ hiện trên Mobile) */}
              {isActive && (
                <div className="lg:hidden absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFD54F]"></div>
              )}

              {/* Category Icon */}
              <div
                className={`flex-shrink-0 ${
                  isActive
                    ? 'text-[#FFD54F]'
                    : cat.id === 'rau-nam'
                    ? 'text-[#78FBB6]'
                    : 'text-[#FFE088]'
                }`}
              >
                {CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.flame}
              </div>

              {/* Category Label */}
              <div className="flex-1 min-w-0">
                <span
                  className={`block text-[11px] lg:text-xs leading-tight truncate ${
                    isActive ? 'text-[#FFE699] font-bold' : 'text-[#D6D3CD]'
                  }`}
                >
                  {cat.name}
                </span>
              </div>

            </button>
          );
        })}
      </nav>
    </aside>
  );
}
