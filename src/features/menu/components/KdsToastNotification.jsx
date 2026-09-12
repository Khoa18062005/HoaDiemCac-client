import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function KdsToastNotification({ message, isVisible }) {
  return (
    <div
      className={`fixed bottom-6 right-8 bg-surface-elevated/95 border border-gold/40 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all duration-300 z-50 font-sans ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-12 opacity-0 pointer-events-none'
      }`}
    >
      <CheckCircle2 className="w-5 h-5 text-jade-bright flex-shrink-0" />
      <div className="flex flex-col text-xs">
        <span className="font-bold text-white">Đồng Bộ KDS Thành Công</span>
        <span className="text-[#A0A0A5]">{message}</span>
      </div>
    </div>
  );
}
