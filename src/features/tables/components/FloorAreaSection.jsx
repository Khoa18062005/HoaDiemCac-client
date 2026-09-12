import React from 'react';

export default function FloorAreaSection({ title, capacityInfo, countLabel, isVip = false, children }) {
  return (
    <section>
      {/* Thanh tiêu đề phân khu tinh gọn & sang trọng */}
      <div className={`flex items-center justify-between mb-4 pb-2.5 border-b ${
        isVip ? 'border-gold/25' : 'border-surface-border'
      }`}>
        <div className="flex items-center gap-3">
          {/* Chấm tròn phát sáng */}
          <span className={`w-2 h-2 rounded-full ${
            isVip ? 'bg-gold shadow-sm shadow-gold/60' : 'bg-gold'
          }`} />

          <div className="flex items-center gap-2.5">
            <h3 className={`font-sans text-xs font-bold uppercase tracking-wider ${
              isVip ? 'text-gold' : 'text-white'
            }`}>
              {title}
            </h3>

            {/* Badge sức chứa gọn gàng */}
            {capacityInfo && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium tracking-normal ${
                isVip
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'bg-surface-elevated text-[#A0A0A5] border border-surface-border'
              }`}>
                {capacityInfo}
              </span>
            )}
          </div>
        </div>

        {/* Badge đếm số lượng bên phải */}
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-sans font-medium ${
          isVip
            ? 'bg-gold/15 text-gold border border-gold/30'
            : 'bg-surface-elevated text-[#A0A0A5] border border-surface-border'
        }`}>
          {countLabel}
        </span>
      </div>

      {/* Lưới 5 cột hiển thị thẻ bàn */}
      <div className="grid grid-cols-5 gap-4">
        {children}
      </div>
    </section>
  );
}
