import React from 'react';

export const EMPLOYEE_ROLES = [
  { id: 'all', label: 'Tất Cả' },
  { id: 'ADMIN', label: 'Quản Trị Viên' },
  { id: 'MANAGER', label: 'Quản Lý' },
  { id: 'KITCHEN', label: 'Bếp' },
  { id: 'STAFF', label: 'Phục Vụ' },
];

export default function AdminEmployeeRoleRibbon({
  selectedRole = 'all',
  onSelectRole,
  roleCounts = {},
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-border font-sans no-scrollbar">
      {EMPLOYEE_ROLES.map((role) => {
        const isActive = selectedRole === role.id;
        const count = roleCounts[role.id] ?? 0;

        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:outline-none focus-visible:ring-0 cursor-pointer select-none border ${
              isActive
                ? 'bg-crimson text-white font-bold shadow-md shadow-crimson/40 border-crimson-glow'
                : 'bg-surface-card hover:bg-surface-elevated text-[#A0A0A5] hover:text-[#EDEDED] border-surface-border'
            }`}
          >
            <span>{role.label}</span>
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
