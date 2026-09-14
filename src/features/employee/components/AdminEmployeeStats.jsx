import React from 'react';
import { Users, UserCheck, UserX, ShieldAlert } from 'lucide-react';

export default function AdminEmployeeStats({ employees }) {
  const total = employees.length;
  const active = employees.filter((e) => e.status === 'ACTIVE').length;
  const inactive = employees.filter((e) => e.status !== 'ACTIVE').length;
  const managers = employees.filter(
    (e) => (e.permissions || []).includes('EMPLOYEES') || (e.permissions || []).length >= 5
  ).length;

  const statCards = [
    {
      title: 'Tổng Nhân Sự',
      count: total,
      subtext: 'Tài khoản trong hệ thống',
      icon: Users,
      color: '#D4AF37',
      bgClass: 'from-gold/10 to-transparent',
      borderClass: 'border-gold/30',
    },
    {
      title: 'Đang Hoạt Động',
      count: active,
      subtext: 'Có thể đăng nhập phục vụ',
      icon: UserCheck,
      color: '#34A853',
      bgClass: 'from-jade/10 to-transparent',
      borderClass: 'border-jade/30',
    },
    {
      title: 'Tài Khoản Tạm Khóa',
      count: inactive,
      subtext: 'Đã tạm ngưng truy cập',
      icon: UserX,
      color: '#C41E3A',
      bgClass: 'from-crimson/10 to-transparent',
      borderClass: 'border-crimson/30',
    },
    {
      title: 'Quản Lý / Toàn Quyền',
      count: managers,
      subtext: 'Có thẩm quyền quản trị',
      icon: ShieldAlert,
      color: '#FFD54F',
      bgClass: 'from-amber/10 to-transparent',
      borderClass: 'border-amber/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-surface-card border ${card.borderClass} bg-gradient-to-b ${card.bgClass} flex items-center justify-between shadow-sm`}
          >
            <div>
              <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider">
                {card.title}
              </p>
              <h4 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1">
                {card.count}
              </h4>
              <p className="text-[10px] text-[#A0A0A5] mt-0.5">{card.subtext}</p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: `${card.color}15`,
                color: card.color,
                border: `1px solid ${card.color}35`,
              }}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
