import React from 'react';

export default function CategoryFilterRibbon({
  selectedCategory = 'all',
  onSelectCategory,
  categoryCounts = {},
  categories = [{ id: 'all', label: 'Tất Cả' }],
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-border font-sans no-scrollbar">
      {categories.map(cat => {
        const isActive = selectedCategory === cat.id;
        const count = categoryCounts[cat.id] ?? 0;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:outline-none focus-visible:ring-0 cursor-pointer select-none border ${
              isActive
                ? 'bg-crimson text-white font-bold shadow-md shadow-crimson/40 border-crimson-glow'
                : 'bg-surface-card hover:bg-surface-elevated text-[#A0A0A5] hover:text-[#EDEDED] border-surface-border'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-surface-elevated text-[#8E8E93]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
