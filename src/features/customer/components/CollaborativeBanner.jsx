import React from 'react';
import { Users, Flame } from 'lucide-react';

/**
 * CollaborativeBanner
 * Thanh thông báo tương tác thời gian thực giữa các thực khách ngồi cùng một bàn.
 */
export default function CollaborativeBanner({
  collaboratorCount = 3,
  latestAction = '',
}) {
  return (
    <div className="bg-[#1C1C22] border-b border-[rgba(212,175,55,0.15)] py-1.5 px-3.5 flex items-center justify-between text-xs text-[#D6D3CD] flex-shrink-0 select-none">
      <div className="flex items-center space-x-2">
        {/* Overlapping User Avatars */}
        <div className="flex -space-x-2 overflow-hidden">
          <div className="inline-block h-5 w-5 rounded-full ring-1.5 ring-[#1C1C22] bg-[#C41E3A] text-white font-bold text-[9px] flex items-center justify-center uppercase shadow-xs">
            T
          </div>
          <div className="inline-block h-5 w-5 rounded-full ring-1.5 ring-[#1C1C22] bg-[#B8860B] text-white font-bold text-[9px] flex items-center justify-center uppercase shadow-xs">
            N
          </div>
          <div className="inline-block h-5 w-5 rounded-full ring-1.5 ring-[#1C1C22] bg-[#007448] text-white font-bold text-[9px] flex items-center justify-center uppercase shadow-xs">
            L
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-medium text-[#E5E1E4] truncate max-w-[200px]">
            {collaboratorCount} người đang cùng gọi món...
          </span>
          {latestAction && (
            <span className="hidden xs:inline text-[10px] text-[#D4AF37]/90 italic truncate max-w-[140px]">
              ({latestAction})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center text-[10px] text-[#59DE9B] font-medium bg-[#007448]/20 px-1.5 py-0.5 rounded border border-[#59DE9B]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
        Live
      </div>
    </div>
  );
}
