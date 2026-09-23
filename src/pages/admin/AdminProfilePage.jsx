import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  Camera,
  Briefcase,
  Copy,
  Check,
  Building2,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  BadgeCheck,
  CheckCircle2
} from 'lucide-react';
import { SYSTEM_PERMISSIONS } from '@/features/employee';

import { useAuthStore } from '@/stores/useAuthStore';

export default function AdminProfilePage() {
  const { user } = useAuthStore();

  // 1. Dữ liệu nhân viên đang đăng nhập (Lấy từ hệ thống Backend + fallback fake data cho phần chưa có API)
  const [profile, setProfile] = useState(() => {
    return {
      id: user?.id || 'NV-001',
      code: user?.id ? `HDC-NV${user.id.toString().padStart(3, '0')}` : 'HDC-QL01',
      username: user?.username || 'admin',
      fullName: user?.fullName || 'Nguyễn Quốc Khoa',
      roleName: user?.role === 'ADMIN' ? 'Quản Trị Viên' : (user?.role || 'Quản lý nhà hàng'),
      rolePreset: user?.role || 'MANAGER',
      email: user?.email || 'kqtthings@gmail.com',
      phone: '',
      dob: '', // Empty for date input, placeholder can be 'Chưa cập nhật' or handled in UI
      gender: 'Chưa cập nhật',
      branch: 'Hỏa Diệm Các - Chi nhánh Tràng Tiền, Hoàn Kiếm',
      bio: 'Phụ trách điều phối vận hành bàn ăn, kiểm soát chất lượng phục vụ và xử lý sự cố.',
      joinedDate: '15/01/2023',
      shift: 'Ca tối (16:00 - 23:30)',
      lastLogin: 'Hôm nay',
      avatarUrl: user?.avatarUrl || '',
      permissions: user?.permissions || ['TABLES', 'KITCHEN', 'WAITER', 'MENU', 'EMPLOYEES', 'PROFILE', 'TABLES_QR', 'INVOICES', 'DASHBOARD'],
    };
  });

  // State Tabs: 'info' | 'security' | 'permissions'
  const [activeTab, setActiveTab] = useState('security');

  // Form State
  const [formData, setFormData] = useState({ ...profile });
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // Security / Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Toast Notification
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Tính chữ cái viết tắt cho avatar
  const initials = useMemo(() => {
    const parts = (formData.fullName || 'Admin').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (formData.fullName || 'AD').substring(0, 2).toUpperCase();
  }, [formData.fullName]);

  // Copy mã nhân viên
  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.code);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
    showToast('Đã sao chép mã nhân sự vào bộ nhớ tạm');
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showToast('Họ và tên không được để trống', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Email liên hệ không được để trống', 'error');
      return;
    }

    const updatedProfile = { ...formData };
    setProfile(updatedProfile);

    // Lưu vào sessionStorage & localStorage
    try {
      const stored = JSON.stringify(updatedProfile);
      sessionStorage.setItem('currentUser', stored);
      localStorage.setItem('currentUser', stored);
      // Phát sự kiện để Sidebar cập nhật ngay
      window.dispatchEvent(new Event('currentUserUpdated'));
    } catch {
      // Ignore
    }

    showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
  };

  // Đổi mật khẩu
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (!passwordForm.newPassword) {
      showToast('Vui lòng nhập mật khẩu mới', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    // Reset form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    showToast('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.', 'success');
  };

  // Đổi ảnh đại diện giả lập
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
        setProfile((prev) => {
          const upd = { ...prev, avatarUrl: result };
          sessionStorage.setItem('currentUser', JSON.stringify(upd));
          localStorage.setItem('currentUser', JSON.stringify(upd));
          window.dispatchEvent(new Event('currentUserUpdated'));
          return upd;
        });
        showToast('Đã cập nhật ảnh đại diện thành công');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian font-sans">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-sm animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === 'error'
              ? 'bg-[#1C1214] border-red-500/50 text-red-400'
              : 'bg-[#121A14] border-emerald-500/50 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header nhỏ gọn chuẩn theo hình số 2 */}
      <header className="h-20 border-b border-surface-border px-8 py-4 flex items-center justify-between bg-surface/80 backdrop-blur-md flex-shrink-0 z-20">
        {/* Cột trái: Tiêu đề trang & Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white tracking-wide">
            Hồ Sơ Nhân Sự
          </h1>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-gold/90 border border-gold/30">
            Imperial Profile
          </span>
        </div>

        {/* Cột phải: Trạng thái & Mã nhân sự */}
        <div className="flex items-center gap-4 text-xs text-[#A0A0A5]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-jade-bright shadow-sm shadow-jade-bright/40"></span>
            <span className="font-medium text-white">Đang hoạt động</span>
          </span>

        </div>
      </header>

      {/* Vùng nội dung cuộn chính */}
      <div className="flex-1 px-8 py-6 overflow-y-scroll [scrollbar-gutter:stable] space-y-6 relative pb-20">
        {/* Main Grid Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===================== CỘT TRÁI: THẺ TỔNG QUAN (4 CỘT) ===================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity Card */}
          <div className="rounded-xl bg-[#121214] border border-surface-border p-6 relative overflow-hidden shadow-lg">
            {/* Background Accent Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#2A2010] to-[#161208] border-2 border-gold/60 p-0.5 shadow-xl flex items-center justify-center overflow-hidden">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={formData.fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#1F1912] flex items-center justify-center text-gold text-2xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Upload Avatar Overlay Button */}
                <label
                  htmlFor="avatar-upload-input"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-gold text-black hover:bg-gold-light transition-transform active:scale-95 shadow-md cursor-pointer group-hover:scale-105"
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {formData.fullName}
                </h2>
                <p className="text-xs text-gold font-medium mt-1">
                  {formData.roleName}
                </p>
              </div>
            </div>

            {/* Profile Form (Moved from right side) */}
            <div className="mt-6 pt-5 border-t border-surface-border/20">
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-4">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-[#A0A0A5] font-medium flex items-center gap-1.5">
                      <span>Họ và tên</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white placeholder-[#555] focus:outline-none focus:border-gold transition-colors"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[#A0A0A5] font-medium flex items-center gap-1.5">
                      <span>Email công vụ</span>
                      <Lock className="w-3 h-3 text-[#8E8E93]" />
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181C] border border-surface-border text-[#777] cursor-not-allowed"
                      placeholder="email@hoadiemcat.vn"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="text-[#A0A0A5] font-medium flex items-center gap-1.5">
                      <span>Số điện thoại</span>
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white placeholder-[#555] focus:outline-none focus:border-gold transition-colors"
                      placeholder="Chưa cập nhật"
                    />
                  </div>

                    <div className="grid grid-cols-2 gap-4">
                    {/* Ngày sinh */}
                    <div className="space-y-1.5">
                      <label className="text-[#A0A0A5] font-medium">Ngày sinh</label>
                      <input
                        type={formData.dob ? "date" : "text"}
                        placeholder={!formData.dob ? "Chưa cập nhật" : ""}
                        onFocus={(e) => { e.target.type = 'date'; }}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>

                    {/* Giới tính */}
                    <div className="space-y-1.5">
                      <label className="text-[#A0A0A5] font-medium">Giới tính</label>
                      <select
                        value={formData.gender || "Chưa cập nhật"}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white focus:outline-none focus:border-gold transition-colors"
                      >
                        <option value="Chưa cập nhật">Chưa cập nhật</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border mt-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...profile })}
                    className="px-4 py-2.5 rounded-lg border border-surface-border text-[#A0A0A5] hover:text-white hover:bg-surface-hover transition-colors"
                  >
                    Khôi phục
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-transform active:scale-95 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Thay Đổi</span>
                  </button>
                </div>
              </form>
            </div>


          </div>
        </div>

        {/* ===================== CỘT PHẢI: NỘI DUNG TABS (8 CỘT) ===================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation Buttons */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121214] border border-surface-border">


            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-gold text-black shadow-md'
                  : 'text-[#A0A0A5] hover:text-white hover:bg-surface-hover'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Đổi Mật Khẩu & Bảo Mật</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'permissions'
                  ? 'bg-gold text-black shadow-md'
                  : 'text-[#A0A0A5] hover:text-white hover:bg-surface-hover'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Quyền Hạn Hệ Thống</span>
            </button>
          </div>



          {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT */}
          {activeTab === 'security' && (
            <div className="rounded-xl bg-[#121214] border border-surface-border p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-gold" />
                    <span>Thiết Lập Mật Khẩu Bảo Mật</span>
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Để đảm bảo an toàn, nên sử dụng mật khẩu có độ dài từ 8 ký tự kết hợp chữ hoa, chữ thường và số
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs w-full">
                {/* Mật khẩu hiện tại */}
                <div className="space-y-1.5">
                  <label className="text-[#A0A0A5] font-medium">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white placeholder-[#555] focus:outline-none focus:border-gold transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
                    >
                      {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="space-y-1.5">
                  <label className="text-[#A0A0A5] font-medium">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white placeholder-[#555] focus:outline-none focus:border-gold transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
                    >
                      {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="space-y-1.5">
                  <label className="text-[#A0A0A5] font-medium">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-surface-card border border-surface-border text-white placeholder-[#555] focus:outline-none focus:border-gold transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
                    >
                      {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Gợi ý quy định bảo mật */}
                <div className="p-3 rounded-lg bg-[#18181C] border border-surface-border space-y-1 text-[11px] text-[#8E8E93]">
                  <p className="text-[#A0A0A5] font-medium">Quy tắc bảo mật nội bộ Hỏa Diệm Các:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Không chia sẻ mật khẩu ca trực cho nhân viên thử việc.</li>
                    <li>Mọi giao dịch hủy món hoặc chiết khấu bill sẽ ghi nhận tên người dùng này.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold transition-transform active:scale-95 shadow-md"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Cập Nhật Mật Khẩu</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: QUYỀN HẠN HỆ THỐNG */}
          {activeTab === 'permissions' && (
            <div className="rounded-xl bg-[#121214] border border-surface-border p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    <span>Quyền Hạn Được Phân Bổ</span>
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Danh mục các chức năng nghiệp vụ mà tài khoản của bạn được cấp phép truy cập và vận hành
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-semibold">
                  Toàn quyền Quản lý ({formData.permissions.length} quyền)
                </span>
              </div>

              {/* Grid Permissions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SYSTEM_PERMISSIONS.map((perm) => {
                  const isGranted = (formData.permissions || []).some(
                    (p) => p.toUpperCase() === perm.id.toUpperCase() || p.toLowerCase() === perm.code.toLowerCase()
                  );
                  return (
                    <div
                      key={perm.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isGranted
                          ? 'bg-surface-card border-surface-border hover:border-gold/40'
                          : 'bg-[#18181C]/50 border-surface-border/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${perm.color}20`, color: perm.color }}
                          >
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-white">{perm.label}</h4>
                            <span className="text-[10px] text-gold font-medium">{perm.category}</span>
                          </div>
                        </div>

                        {isGranted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                            Đã kích hoạt
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#222] text-[#777]">
                            Chưa cấp
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#8E8E93] mt-2.5 line-clamp-2 leading-relaxed">
                        {perm.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
