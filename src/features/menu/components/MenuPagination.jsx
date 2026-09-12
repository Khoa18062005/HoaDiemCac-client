import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MenuPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 6,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="px-6 py-3.5 bg-surface-card/90 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-xs">
      <div className="text-[#A0A0A5]">
        Hiển thị <span className="text-white font-semibold">{startIdx} - {endIdx}</span> của{' '}
        <span className="text-gold font-bold">{totalItems}</span> món ăn
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed text-[#EDEDED] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => {
          const page = idx + 1;
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors duration-150 outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                isActive
                  ? 'bg-crimson text-white shadow-sm'
                  : 'bg-surface-elevated hover:bg-surface-hover text-[#A0A0A5] hover:text-white'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed text-[#EDEDED] flex items-center justify-center transition-colors duration-150 outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
