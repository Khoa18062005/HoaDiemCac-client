import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  X,
  Copy,
  Check,
  Sparkles,
  KeyRound
} from 'lucide-react';
import {
  AdminEmployeeHeader,
  AdminEmployeeControlBar,
  AdminEmployeeRoleRibbon,
  AdminEmployeeAccountModal,
  AdminEmployeeTableRow,
  EMPLOYEE_ROLES,
  loadEmployeesFromStorage,
  saveEmployeesToStorage,
  generateEmployeePassword,
} from '@/features/employee';

export default function AdminEmployeeManagePage() {
  const [employees, setEmployees] = useState(loadEmployeesFromStorage);
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked'

  // Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Quick Password Reset Modal State
  const [resetModalData, setResetModalData] = useState(null);
  const [copiedResetPass, setCopiedResetPass] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Tự động lưu vào localStorage mỗi khi danh sách thay đổi
  useEffect(() => {
    saveEmployeesToStorage(employees);
  }, [employees]);

  // Thống kê tổng quan cho AdminEmployeeHeader
  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === 'ACTIVE').length,
      locked: employees.filter((e) => e.status !== 'ACTIVE').length,
    };
  }, [employees]);

  // Đếm số lượng nhân viên theo từng nhóm vai trò cho Ribbon
  const roleCounts = useMemo(() => {
    const counts = { all: employees.length };
    EMPLOYEE_ROLES.forEach((r) => {
      if (r.id !== 'all') {
        counts[r.id] = employees.filter((e) => e.rolePreset === r.id).length;
      }
    });
    return counts;
  }, [employees]);

  // Bộ lọc danh sách nhân viên
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Lọc theo dải Ribbon vai trò
      if (selectedRole !== 'all' && emp.rolePreset !== selectedRole) {
        return false;
      }

      // 2. Lọc theo trạng thái 3 nút
      if (statusFilter === 'active' && emp.status !== 'ACTIVE') return false;
      if (statusFilter === 'locked' && emp.status === 'ACTIVE') return false;

      // 3. Lọc theo thanh tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.fullName?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchPhone = emp.phone?.toLowerCase().includes(q);
        const matchCode = emp.code?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchCode) return false;
      }

      return true;
    });
  }, [employees, selectedRole, statusFilter, searchQuery]);

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setIsAccountModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setIsAccountModalOpen(true);
  };

  // Lưu tài khoản (Tạo mới hoặc Sửa)
  const handleSaveAccount = (accountData) => {
    if (editingEmployee) {
      // Cập nhật
      setEmployees((prev) =>
        prev.map((item) => (item.id === editingEmployee.id ? { ...item, ...accountData } : item))
      );
      showToast(`Đã cập nhật thông tin tài khoản ${accountData.fullName}!`);
    } else {
      // Tạo mới
      const newId = `emp-${Date.now().toString().slice(-4)}`;
      const newCode = `NV-${(employees.length + 1).toString().padStart(2, '0')}`;
      const newEmp = {
        id: newId,
        code: newCode,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        ...accountData,
      };
      setEmployees((prev) => [newEmp, ...prev]);
      showToast(`Đã tạo tài khoản nhân viên ${accountData.fullName} thành công!`);
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleStatus = (emp) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setEmployees((prev) =>
      prev.map((item) => (item.id === emp.id ? { ...item, status: nextStatus } : item))
    );
    showToast(
      nextStatus === 'ACTIVE'
        ? `Đã kích hoạt lại tài khoản ${emp.fullName}!`
        : `Đã tạm khóa tài khoản ${emp.fullName}!`,
      nextStatus === 'ACTIVE' ? 'success' : 'info'
    );
  };

  // Xóa tài khoản nhân viên
  const handleDeleteEmployee = (emp) => {
    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn tài khoản của nhân viên "${emp.fullName}"?`)) {
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      showToast(`Đã xóa tài khoản ${emp.fullName}!`, 'info');
    }
  };

  // Cấp lại mật khẩu tự động nhanh
  const handleOpenResetPassword = (emp) => {
    const freshPassword = generateEmployeePassword();
    setResetModalData({
      employee: emp,
      newPassword: freshPassword,
    });
    setCopiedResetPass(false);
  };

  const handleConfirmResetPassword = () => {
    if (!resetModalData) return;
    const { employee, newPassword } = resetModalData;
    setEmployees((prev) =>
      prev.map((item) =>
        item.id === employee.id ? { ...item, password: newPassword } : item
      )
    );
    setResetModalData(null);
    showToast(`Đã cấp mật khẩu mới cho ${employee.fullName}: ${newPassword}`);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian font-sans">
      
      {/* 1. Header Quản Lý Nhân Viên (Cố định chuẩn như Quản Lý Thực Đơn) */}
      <AdminEmployeeHeader stats={stats} />

      {/* 2. Vùng nội dung cuộn chính */}
      <div className="flex-1 px-8 py-6 overflow-y-scroll [scrollbar-gutter:stable] space-y-6 relative">
        
        {/* 2.1. Thanh điều khiển tìm kiếm, lọc trạng thái 3 tab & Nút tạo tài khoản */}
        <AdminEmployeeControlBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenAddModal={handleOpenCreateModal}
        />

        {/* 2.2. Dải băng phân loại vai trò / vị trí (Category Ribbon) */}
        <AdminEmployeeRoleRibbon
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          roleCounts={roleCounts}
        />

        {/* 2.3. Bảng danh sách nhân viên */}
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-xl overflow-hidden">
          
          {/* Tiêu đề bảng */}
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated/50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                DANH SÁCH NHÂN VIÊN
              </h3>
              <span className="text-xs text-[#8E8E93] hidden sm:inline">
                • Sắp xếp theo ngày tạo mới nhất
              </span>
            </div>

            {/* Chú giải trạng thái */}
            <div className="flex items-center gap-4 text-xs text-[#8E8E93]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-jade-bright shadow-sm shadow-jade-bright/40"></span>
                Đang hoạt động
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-crimson-glow shadow-sm shadow-crimson-glow/40"></span>
                Tạm khóa
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#18181D] border-b border-surface-border text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Nhân Viên</th>
                  <th className="px-5 py-3.5">Email &amp; Liên Lạc</th>
                  <th className="px-5 py-3.5">Chức Năng Được Phân Quyền</th>
                  <th className="px-5 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5">Đăng Nhập Gần Nhất</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#8E8E93]">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center text-[#6A6A74]">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium">Không tìm thấy nhân viên nào phù hợp</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedRole('all');
                            setStatusFilter('all');
                          }}
                          className="text-xs text-gold hover:underline"
                        >
                          Đặt lại bộ lọc tìm kiếm
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <AdminEmployeeTableRow
                      key={emp.id}
                      employee={emp}
                      onEdit={handleOpenEditModal}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDeleteEmployee}
                      onResetPassword={handleOpenResetPassword}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Chân bảng: Thống kê số lượng */}
          <div className="px-6 py-3.5 border-t border-surface-border bg-[#141418] flex items-center justify-between text-xs text-[#8E8E93]">
            <span>
              Hiển thị <strong className="text-white">{filteredEmployees.length}</strong> / {employees.length} tài khoản nhân sự
            </span>
            <span className="text-[11px] text-[#6E6E78]">
              * Nhấn biểu tượng chìa khóa để cấp lại mật khẩu tự động 6 ký tự
            </span>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL TẠO / SỬA TÀI KHOẢN NHÂN VIÊN (2 CỘT PHÂN QUYỀN)                */}
      {/* ========================================================================= */}
      <AdminEmployeeAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
        initialData={editingEmployee}
      />

      {/* ========================================================================= */}
      {/* 4. MODAL CẤP LẠI MẬT KHẨU TỰ ĐỘNG NHANH                                   */}
      {/* ========================================================================= */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141418] border border-gold/40 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setResetModalData(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8E8E93] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cấp Mật Khẩu Mới</h3>
                <p className="text-xs text-[#8E8E93]">
                  Nhân viên: <strong className="text-gold">{resetModalData.employee.fullName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#B5B5BE] mb-3">
              Mật khẩu tự động 6 ký tự (Viết hoa đầu, chữ thường, số &amp; ký tự đặc biệt):
            </p>

            {/* Khung mật khẩu hiển thị */}
            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-gold/40 flex items-center justify-between mb-4">
              <span className="font-mono text-lg font-bold text-white tracking-widest">
                {resetModalData.newPassword}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(resetModalData.newPassword);
                  setCopiedResetPass(true);
                  setTimeout(() => setCopiedResetPass(false), 2000);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  copiedResetPass
                    ? 'bg-jade text-white'
                    : 'bg-gold/20 text-gold hover:bg-gold/30 border border-gold/40'
                }`}
              >
                {copiedResetPass ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedResetPass ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const fresh = generateEmployeePassword();
                  setResetModalData((prev) => ({ ...prev, newPassword: fresh }));
                  setCopiedResetPass(false);
                }}
                className="py-2.5 px-3 rounded-xl border border-surface-border text-xs text-gold hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đổi mã khác</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#990000] via-[#C41E3A] to-[#B22222] text-white text-xs font-bold hover:brightness-110 shadow-lg"
              >
                Xác nhận cấp lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TOAST NOTIFICATION                                                     */}
      {/* ========================================================================= */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div className="px-4 py-3 rounded-xl bg-[#1C1C22] border border-gold/40 shadow-2xl flex items-center gap-3 text-xs text-white">
            <CheckCircle className="w-4 h-4 text-jade-bright flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
