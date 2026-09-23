import React from 'react';
import {
  Edit3,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { SYSTEM_PERMISSIONS } from '../data/mockEmployees';

export default function AdminEmployeeTableRow({
  employee,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetPassword,
}) {
  const {
    id,
    code,
    fullName,
    email,
    phone,
    role,
    permissions = [],
    status,
    createdAt,
    lastLoginAt,
  } = employee;

  // Lấy 2 chữ cái viết tắt cho avatar
  const initials = fullName
    ? fullName
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'NV';

  const isActive = status === 'ACTIVE';

  // Format ngày tháng hiển thị
  const formatDate = (isoString) => {
    if (!isoString) return 'Chưa đăng nhập';
    try {
      const d = new Date(isoString);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  return (
    <tr className="border-b border-surface-border hover:bg-surface-elevated/40 transition-colors group">
      {/* 1. Tên nhân viên & Avatar */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border shadow-sm ${
              isActive
                ? 'bg-gradient-to-br from-gold/20 to-crimson/20 border-gold/40 text-gold'
                : 'bg-surface-elevated border-surface-border text-[#6A6A74]'
            }`}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate group-hover:text-gold transition-colors">
                {fullName}
              </span>
              {code && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181F] text-gold/80 border border-gold/20 font-mono">
                  {code}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#8E8E93] flex items-center gap-2 mt-0.5">
              <span>{role || 'Nhân viên'}</span>
            </div>
          </div>
        </div>
      </td>

      {/* 2. Email & Số điện thoại */}
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="text-xs">
          <div className="flex items-center gap-1.5 text-[#EDEDED]">
            <Mail className="w-3.5 h-3.5 text-gold/80 flex-shrink-0" />
            <span className="font-mono">{email}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] mt-1">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{phone}</span>
            </div>
          )}
        </div>
      </td>

      {/* 3. Danh sách phân quyền chức năng */}
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5 max-w-xs">
          {permissions.length === 0 ? (
            <span className="text-[11px] text-[#6E6E78] italic">Chưa cấp quyền</span>
          ) : (
            permissions.map((permId) => {
              const perm = SYSTEM_PERMISSIONS.find((p) => p.id === permId);
              if (!perm) return null;
              return (
                <span
                  key={permId}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#1C1C22] border border-surface-border text-[#C5C5CE] whitespace-nowrap inline-flex items-center gap-1"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: perm.color }}
                  ></span>
                  {perm.label}
                </span>
              );
            })
          )}
        </div>
      </td>

      {/* 4. Trạng thái hoạt động */}
      <td className="px-5 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isActive
              ? 'bg-jade/15 text-jade-bright border-jade/30'
              : 'bg-crimson/15 text-red-400 border-crimson/30'
          }`}
        >
          {isActive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-jade-bright animate-pulse"></span>
              <span>Đang hoạt động</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              <span>Tạm khóa</span>
            </>
          )}
        </span>
      </td>

      {/* 5. Lần đăng nhập cuối */}
      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#8E8E93]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#6E6E78]" />
          <span>{formatDate(lastLoginAt)}</span>
        </div>
      </td>

      {/* 6. Thao tác quản trị */}
      <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
        <div className="flex items-center justify-end gap-1.5">
          {/* Nút Chỉnh sửa quyền & thông tin */}
          <button
            type="button"
            onClick={() => onEdit(employee)}
            className="p-1.5 rounded-lg text-[#A0A0A5] hover:text-gold hover:bg-surface-elevated transition-colors"
            title="Chỉnh sửa thông tin & phân quyền"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Nút Cấp lại / Đổi mật khẩu tự động */}
          <button
            type="button"
            onClick={() => onResetPassword(employee)}
            className="p-1.5 rounded-lg text-[#A0A0A5] hover:text-amber-400 hover:bg-surface-elevated transition-colors"
            title="Cấp lại mật khẩu mới tự động"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Nút Khóa / Mở khóa tài khoản */}
          <button
            type="button"
            onClick={() => onToggleStatus(employee)}
            className={`p-1.5 rounded-lg border transition-all duration-150 ${
              isActive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                : 'text-red-400 bg-red-500/15 border-red-500/30 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40'
            }`}
            title={isActive ? `Tạm khóa tài khoản ${fullName}` : `Mở khóa tài khoản ${fullName}`}
          >
            {isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>

          {/* Nút Xóa nhân viên */}
          <button
            type="button"
            onClick={() => onDelete(employee)}
            className="p-1.5 rounded-lg text-[#A0A0A5] hover:text-crimson-glow hover:bg-surface-elevated transition-colors"
            title="Xóa tài khoản nhân viên"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
