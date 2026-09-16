import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/images/logo.png';
import DbConnectionCheckButton from '../feedback/DbConnectionCheckButton';
import { useAuthStore } from '@/stores/useAuthStore';

const LOGO_URL = logoImg;

export default function AdminSidebar() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Fallback if authUser not yet loaded from store
  const effectiveUser = authUser || (() => {
    try {
      const stored = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const rawRole = (effectiveUser?.role || 'STAFF').replace(/^ROLE_/, '');
  const isAdmin = rawRole === 'ADMIN';

  // Lấy danh sách quyền hạn
  const permissions = effectiveUser?.permissions || (
    isAdmin ? ['TABLES', 'MENU', 'EMPLOYEES', 'PROFILE', 'TABLES_QR', 'INVOICES', 'DASHBOARD'] :
    rawRole === 'MANAGER' ? ['TABLES', 'MENU'] :
    rawRole === 'KITCHEN' ? ['MENU'] :
    ['TABLES']
  );

  const fullName = effectiveUser?.fullName || effectiveUser?.username || 'Nhân Viên';
  const nameParts = fullName.trim().split(' ');
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (effectiveUser?.username || 'NV').substring(0, 2).toUpperCase();

  const roleName = isAdmin ? 'Quản Trị Viên' :
    rawRole === 'MANAGER' ? 'Quản Lý Ca' :
    rawRole === 'KITCHEN' ? 'Bếp / Pha Chế' :
    rawRole === 'STAFF' ? 'Phục Vụ Bàn' : (effectiveUser?.role || 'Nhân Viên');

  const handleLogout = () => {
    logout();
    try {
      sessionStorage.clear();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('hoadiemcat_auth');
    } catch {}
    navigate('/login');
  };

  const allNavItems = [
    {
      to: '/admin',
      label: 'Sơ Đồ Bàn Ăn',
      permission: 'TABLES',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect height="7" rx="1.5" width="7" x="3" y="3"></rect>
          <rect height="7" rx="1.5" width="7" x="14" y="3"></rect>
          <rect height="7" rx="1.5" width="7" x="14" y="14"></rect>
          <rect height="7" rx="1.5" width="7" x="3" y="14"></rect>
        </svg>
      ),
    },
    {
      to: '/admin/menu',
      label: 'Quản Lý Thực Đơn',
      permission: 'MENU',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
          <path d="M7 2v20"></path>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
        </svg>
      ),
    },
    {
      to: '/admin/employees',
      label: 'Quản Lý Nhân Viên',
      permission: 'EMPLOYEES',
      adminOnly: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      to: '/admin/profile',
      label: 'Hồ Sơ Cá Nhân',
      permission: 'PROFILE',
      adminOnly: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
    },
    {
      to: '/admin/tables-qr',
      label: 'Quản Lý Bàn & QR',
      permission: 'TABLES_QR',
      adminOnly: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect height="5" rx="1" width="5" x="3" y="3"></rect>
          <rect height="5" rx="1" width="5" x="16" y="3"></rect>
          <rect height="5" rx="1" width="5" x="3" y="16"></rect>
          <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
          <path d="M21 21v.01"></path>
          <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
          <path d="M3 12h.01"></path>
          <path d="M12 3h.01"></path>
          <path d="M12 16v.01"></path>
          <path d="M16 12h1"></path>
          <path d="M21 12v.01"></path>
          <path d="M12 21v-1"></path>
        </svg>
      ),
    },
    {
      to: '/admin/invoices',
      label: 'Lịch Sử Hóa Đơn',
      permission: 'INVOICES',
      adminOnly: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
          <path d="M14 8H8"></path>
          <path d="M16 12H8"></path>
          <path d="M13 16H8"></path>
        </svg>
      ),
    },
    {
      to: '/admin/dashboard',
      label: 'Báo Cáo Doanh Thu',
      permission: 'DASHBOARD',
      adminOnly: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <line x1="12" x2="12" y1="20" y2="10"></line>
          <line x1="18" x2="18" y1="20" y2="4"></line>
          <line x1="6" x2="6" y1="20" y2="16"></line>
        </svg>
      ),
    },
  ];

  const navItems = allNavItems.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    return permissions.includes(item.permission);
  });

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#121214] border-r border-surface-border flex flex-col justify-between z-20 h-screen select-none">
      <div>
        {/* Imperial Crest / Branding Header */}
        <div className="h-20 px-4 border-b border-surface-border flex items-center justify-center">
          <img
            src={LOGO_URL}
            alt="Hỏa Diệm Các Logo"
            className="h-14 w-auto object-contain max-w-full"
          />
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-xs border outline-none focus:outline-none focus:ring-0 select-none transition-colors duration-150 group ${
                  isActive
                    ? "bg-crimson-subtle text-white border-crimson-border shadow-sm"
                    : "border-transparent text-[#A0A0A5] hover:text-[#EDEDED] hover:bg-surface-hover"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors duration-150 ${isActive ? 'text-gold' : 'text-[#8E8E93]'}`}>
                    {item.icon}
                  </div>
                  <span className={`flex-1 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Database Connection Check & User Profile at Bottom */}
      <div className="p-3 border-t border-surface-border bg-[#0E0E10]/50 space-y-2.5">
        <DbConnectionCheckButton />

        <div
          onClick={() => navigate('/admin/profile')}
          className="p-2 rounded-lg bg-surface-card border border-surface-border hover:border-gold/50 hover:bg-surface-elevated transition-all cursor-pointer flex items-center justify-between group select-none"
          title="Xem & Chỉnh sửa hồ sơ cá nhân"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-[#EDEDED] group-hover:text-gold transition-colors truncate">{fullName}</p>
              <p className="text-[10px] text-[#8E8E93] truncate">{roleName}</p>
            </div>
          </div>
          <button
            className="p-1.5 rounded hover:bg-surface-card text-[#8E8E93] hover:text-crimson transition-colors"
            title="Đăng xuất khỏi hệ thống"
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
