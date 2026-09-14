import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Copy,
  Check,
  Eye,
  EyeOff,
  Mail,
  User,
  Phone,
  Briefcase,
  LayoutGrid,
  UtensilsCrossed,
  QrCode,
  ChefHat,
  ReceiptText,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  SYSTEM_PERMISSIONS,
  ROLE_PERMISSION_PRESETS,
  generateEmployeePassword
} from '../data/mockEmployees';

const ICON_MAP = {
  LayoutGrid: LayoutGrid,
  UtensilsCrossed: UtensilsCrossed,
  QrCode: QrCode,
  ChefHat: ChefHat,
  ReceiptText: ReceiptText,
  BarChart3: BarChart3,
  ShieldCheck: ShieldCheck,
};

export default function AdminEmployeeAccountModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = Boolean(initialData);

  // Form State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Phục Vụ Bàn');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [selectedPermissions, setSelectedPermissions] = useState(['TABLES', 'KDS_ORDERS']);

  // UI state
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [passwordGenSuccess, setPasswordGenSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form khi mở modal hoặc thay đổi initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setEmail(initialData.email || '');
        setFullName(initialData.fullName || '');
        setPhone(initialData.phone || '');
        setRole(initialData.role || 'Phục Vụ Bàn');
        setPassword(initialData.password || '');
        setStatus(initialData.status || 'ACTIVE');
        setSelectedPermissions(initialData.permissions || ['TABLES']);
      } else {
        // Mặc định tự động sinh 1 mật khẩu mẫu 6 ký tự đạt chuẩn
        const autoPass = generateEmployeePassword();
        setEmail('');
        setFullName('');
        setPhone('');
        setRole('Phục Vụ Bàn');
        setPassword(autoPass);
        setStatus('ACTIVE');
        setSelectedPermissions(['TABLES', 'KDS_ORDERS']);
      }
      setCopied(false);
      setPasswordGenSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Xử lý sinh mật khẩu tự động 6 ký tự
  const handleGeneratePassword = () => {
    const newPass = generateEmployeePassword();
    setPassword(newPass);
    setPasswordGenSuccess(true);
    setShowPassword(true);
    setTimeout(() => {
      setPasswordGenSuccess(false);
    }, 2500);
  };

  // Sao chép mật khẩu vào clipboard
  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard?.writeText(password);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Bật/tắt 1 quyền cụ thể
  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Áp dụng cấu hình phân quyền theo mẫu vai trò
  const applyRolePreset = (preset) => {
    setSelectedPermissions([...preset.permissions]);
    setRole(preset.name);
  };

  // Chọn tất cả quyền
  const selectAllPermissions = () => {
    setSelectedPermissions(SYSTEM_PERMISSIONS.map((p) => p.id));
  };

  // Bỏ chọn tất cả quyền
  const deselectAllPermissions = () => {
    setSelectedPermissions([]);
  };

  // Submit form tạo / sửa tài khoản
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Kiểm tra tính hợp lệ
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập email nhân viên.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Định dạng email không hợp lệ (ví dụ: nhanvien@hoadiemcac.vn).');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên nhân viên.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng tạo hoặc nhập mật khẩu cho tài khoản.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 chức năng phân quyền cho nhân viên ở cột bên trái.');
      return;
    }

    const payload = {
      ...(initialData || {}),
      email: trimmedEmail,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role: role.trim() || 'Nhân Viên',
      password: password.trim(),
      permissions: selectedPermissions,
      status: status,
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian/85 backdrop-blur-md font-sans overflow-y-auto animate-fadeIn">
      <div className="relative bg-[#131317] border border-gold/30 rounded-2xl w-full max-w-5xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-border bg-[#18181D] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson/20 border border-crimson/40 flex items-center justify-center text-crimson-glow shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-serif tracking-wide flex items-center gap-2">
                {isEditing ? 'Chỉnh Sửa Tài Khoản Nhân Viên' : 'Bảng Tạo Tài Khoản Nhân Viên'}
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-sans font-medium">
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </span>
              </h3>
              <p className="text-xs text-[#9E9EA6]">
                Phân quyền truy cập chức năng và thiết lập thông tin đăng nhập bảo mật
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-crimson/15 border border-crimson/40 flex items-center gap-2.5 text-xs text-red-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: 2 Cột Rõ Ràng */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ========================================================================= */}
            {/* CỘT BÊN TRÁI: DANH SÁCH CÁC CHỨC NĂNG ĐỂ ADMIN PHÂN QUYỀN CHO NHÂN VIÊN  */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 bg-[#16161B] border border-surface-border rounded-xl p-4 sm:p-5 flex flex-col space-y-4">
              
              {/* Tiêu đề cột trái */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    Phân Quyền Chức Năng Hệ Thống
                  </h4>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    Tích chọn các tính năng nhân viên được phép xem và thao tác
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated text-gold hover:bg-gold/20 transition-colors border border-surface-border"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllPermissions}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated text-[#8E8E93] hover:text-white transition-colors border border-surface-border"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Nhóm nút gợi ý phân quyền theo vị trí mẫu */}
              <div>
                <span className="text-[11px] font-medium text-[#A0A0A5] block mb-2">
                  Gợi ý quyền theo vị trí:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PERMISSION_PRESETS.map((preset) => (
                    <button
                      key={preset.roleId}
                      type="button"
                      onClick={() => applyRolePreset(preset)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#1C1C22] hover:bg-surface-elevated border border-surface-border hover:border-gold/40 text-[#D1D1D6] hover:text-gold transition-all"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách các chức năng (Permissions Checkboxes) */}
              <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
                {SYSTEM_PERMISSIONS.map((perm) => {
                  const isChecked = selectedPermissions.includes(perm.id);
                  const IconComp = ICON_MAP[perm.icon] || ShieldCheck;

                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-[#1C1A17] border-gold/40 shadow-[0_0_12px_rgba(212,175,55,0.08)]'
                          : 'bg-[#141418] border-surface-border hover:border-[#3A3A42] opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox vuông phong cách hoàng gia */}
                      <div className="pt-0.5 flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-gold border-gold text-obsidian font-bold shadow-sm'
                              : 'border-[#4A4A54] bg-[#1A1A20] group-hover:border-gold/50'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Icon chức năng */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: isChecked ? `${perm.color}22` : '#1E1E24',
                          color: isChecked ? perm.color : '#8E8E93',
                        }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      {/* Nội dung chi tiết chức năng */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span
                            className={`text-xs font-semibold tracking-wide ${
                              isChecked ? 'text-white' : 'text-[#C5C5CC]'
                            }`}
                          >
                            {perm.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-[#8E8E93] border border-surface-border">
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E8E93] leading-relaxed line-clamp-2">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chân cột trái: Tổng số quyền đã cấp */}
              <div className="pt-2 border-t border-surface-border flex items-center justify-between text-xs text-[#8E8E93]">
                <span>Tổng quyền hệ thống:</span>
                <span className="font-bold text-gold">
                  Đã cấp {selectedPermissions.length} / {SYSTEM_PERMISSIONS.length} chức năng
                </span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CỘT BÊN PHẢI: FORM THÔNG TIN TÀI KHOẢN, MẬT KHẨU TỰ ĐỘNG, NÚT TẠO        */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 bg-[#16161B] border border-surface-border rounded-xl p-4 sm:p-5 flex flex-col space-y-4">
              
              <div className="pb-2 border-b border-surface-border">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-crimson-glow" />
                  Thông Tin Tài Khoản Nhân Viên
                </h4>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Tài khoản được ban quản lý cấp phát để đăng nhập hệ thống
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Email nhân viên (Yêu cầu bắt buộc) */}
                <div>
                  <label className="block text-xs font-semibold text-[#D1D1D6] mb-1.5 flex items-center justify-between">
                    <span>
                      Email nhân viên <span className="text-crimson-glow">*</span>
                    </span>
                    <span className="text-[10px] text-[#8E8E93] font-normal">Dùng làm tài khoản đăng nhập</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7A84] group-focus-within:text-gold transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ví dụ: hung.tran@hoadiemcac.vn"
                      className="input-imperial w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0D11] border border-surface-border text-xs text-[#EDEDED] placeholder-[#5A5A62] outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 2. Họ và tên nhân viên */}
                <div>
                  <label className="block text-xs font-semibold text-[#D1D1D6] mb-1.5">
                    Họ và tên nhân viên <span className="text-crimson-glow">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7A84] group-focus-within:text-gold transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ..."
                      className="input-imperial w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0D11] border border-surface-border text-xs text-[#EDEDED] placeholder-[#5A5A62] outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 3. Chức danh / Vị trí hiển thị */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#D1D1D6] mb-1.5">
                      Vị trí công việc
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7A84]">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="VD: Phục Vụ Bàn"
                        className="input-imperial w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0D11] border border-surface-border text-xs text-[#EDEDED] placeholder-[#5A5A62] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#D1D1D6] mb-1.5">
                      Số điện thoại
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A7A84]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09xx xxx xxx"
                        className="input-imperial w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0D0D11] border border-surface-border text-xs text-[#EDEDED] placeholder-[#5A5A62] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. MẬT KHẨU TỰ ĐỘNG (GEN MẬT KHẨU 6 KÝ TỰ: HOA ĐẦU, CHỮ, SỐ, ĐẶC BIỆT)   */}
                {/* ========================================================================= */}
                <div className="p-3.5 rounded-xl bg-[#111116] border border-gold/30 relative">
                  
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Mật khẩu tự động <span className="text-crimson-glow">*</span>
                    </label>

                    {/* Badge quy chuẩn mật khẩu */}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                      Đúng 6 ký tự
                    </span>
                  </div>

                  {/* Input mật khẩu kèm nút Sao chép & Xem/Ẩn */}
                  <div className="relative flex items-center mb-2.5">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu tạo tự động..."
                      className="w-full pl-3 pr-20 py-2 rounded-lg bg-[#08080B] border border-gold/40 text-sm font-mono tracking-wider text-white font-bold outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />

                    <div className="absolute right-1.5 flex items-center gap-1">
                      {/* Nút Ẩn/Hiện */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-[#8E8E93] hover:text-white rounded hover:bg-surface-elevated transition-colors"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Nút Sao chép mật khẩu */}
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs ${
                          copied
                            ? 'bg-jade text-white'
                            : 'text-gold hover:text-white hover:bg-surface-elevated'
                        }`}
                        title="Sao chép mật khẩu gửi nhân viên"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* NÚT SINH MẬT KHẨU TỰ ĐỘNG - YÊU CẦU TRỌNG TÂM */}
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 hover:from-gold/30 hover:to-gold/40 border border-gold/50 text-gold hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
                    <span>Tạo Mật Khẩu Tự Động (6 ký tự ngẫu nhiên)</span>
                  </button>

                  {/* Chú thích định dạng mật khẩu */}
                  <div className="mt-2 text-[10px] text-[#8E8E93] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-jade flex-shrink-0" />
                    <span>Gồm chữ hoa đầu, chữ thường, chữ số &amp; ký tự đặc biệt (!@#$%)</span>
                  </div>

                  {passwordGenSuccess && (
                    <div className="mt-1.5 text-[10px] text-jade font-medium animate-fadeIn">
                      ✓ Đã tạo mới mật khẩu 6 ký tự đạt chuẩn!
                    </div>
                  )}

                  {copied && (
                    <div className="mt-1.5 text-[10px] text-jade font-medium animate-fadeIn">
                      ✓ Đã sao chép mật khẩu vào bộ nhớ tạm!
                    </div>
                  )}
                </div>

                {/* 5. Trạng thái tài khoản */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#111116] border border-surface-border">
                  <div>
                    <span className="text-xs font-semibold text-white block">Trạng thái tài khoản</span>
                    <span className="text-[11px] text-[#8E8E93]">Cho phép nhân viên đăng nhập hệ thống</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStatus((prev) => (prev === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      status === 'ACTIVE' ? 'bg-jade' : 'bg-[#2A2A32]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Nút hành động */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-semibold text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
                  >
                    Hủy bỏ
                  </button>

                  {/* NÚT TẠO TÀI KHOẢN */}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#990000] via-[#C41E3A] to-[#B22222] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(196,30,58,0.4)] transition-all active:scale-[0.98] border border-gold/30 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isEditing ? 'Lưu Thông Tin' : 'Tạo Tài Khoản'}</span>
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
