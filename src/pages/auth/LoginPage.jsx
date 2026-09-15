import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  HelpCircle,
  X,
  Flame,
  Sparkles
} from 'lucide-react';
import logoImg from '@/assets/images/logo.png';
import hotpotImg from '@/assets/images/hotpot-banner.jpg';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/stores/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [error, setError] = useState('');

  // Xử lý nộp form đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        usernameOrEmail: email,
        password: password
      });

      const { accessToken, user } = response;
      // Lưu thông tin phiên đăng nhập vào Zustand Auth Store
      login(user, accessToken);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại, vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#08080B] text-[#EDEDED] font-sans flex flex-col lg:grid lg:grid-cols-2 overflow-hidden selection:bg-crimson selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. NỬA BÊN TRÁI: ẢNH NỒI LẨU SÔI SÙN SỤT HOÀNG GIA (Hotpot Showcase Banner) */}
      {/* ========================================================================= */}
      <div className="relative h-56 sm:h-72 lg:h-full w-full overflow-hidden bg-black select-none flex-shrink-0">
        
        {/* Ảnh nồi lẩu sôi sùng sục độ nét cao */}
        <img
          src={hotpotImg}
          alt="Nồi lẩu Hỏa Diệm Các sôi sùng sục"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out hover:scale-100"
        />

        {/* Lớp phủ chuyển màu đen & đỏ đế vương huyền ảo */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-black/30 to-black/60 lg:bg-gradient-to-r lg:from-black/50 lg:via-transparent lg:to-[#08080B]"></div>
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-[#08080B] via-transparent to-black/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(196,30,58,0.25),transparent_60%)]"></div>

        {/* Logo thương hiệu ở góc trên bên trái của ảnh (không chữ dư thừa, to rõ uy nghiêm) */}
        <div className="absolute top-3 left-5 sm:top-4 sm:left-7 lg:top-4 lg:left-8 z-10">
          <img 
            src={logoImg} 
            alt="Hỏa Diệm Các Logo" 
            className="h-14 sm:h-18 lg:h-24 w-auto object-contain drop-shadow-[0_6px_25px_rgba(0,0,0,0.95)] select-none pointer-events-none" 
          />
        </div>

        {/* Khối thông điệp hoàng gia nổi bật ở nửa dưới ảnh (hiển thị trên màn hình Desktop) */}
        <div className="hidden lg:flex absolute bottom-10 left-8 right-12 z-10 flex-col gap-2.5">
          
          {/* Badge trạng thái bếp lửa đang sôi */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-gold/40 backdrop-blur-md w-fit shadow-[0_0_20px_rgba(196,30,58,0.35)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-[#FFE088] uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-crimson-glow" />
              Lửa Lẩu Cung Đình Đang Sôi
            </span>
          </div>

          <h2 className="font-serif text-2xl xl:text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-snug">
            36 Vị Thảo Mộc Cung Đình <br />
            <span className="bg-gradient-to-r from-[#FFD54F] via-[#FFE088] to-[#D4AF37] bg-clip-text text-transparent">
              Sôi Sùng Sục Nồng Say Đậm Vị
            </span>
          </h2>

          <p className="text-xs xl:text-sm text-[#D5D5DC] max-w-md drop-shadow leading-relaxed">
            Nước cốt lẩu hầm 48 giờ cùng ớt hoa tiêu Tứ Xuyên và thảo quả ngự thiện, giữ trọn nhiệt huyết ẩm thực và tinh hoa quản trị nhà hàng.
          </p>

          {/* Dòng chữ Hán triện cổ */}
          <div className="pt-1.5 flex items-center gap-2 text-gold/80 text-xs font-serif tracking-widest opacity-90">
            <span>「 禦 膳 火 鍋 • 登 峰 造 極 」</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NỬA BÊN PHẢI: FORM ĐĂNG NHẬP HOÀNG GIA (Royal Login Form Area)           */}
      {/* ========================================================================= */}
      <div className="relative flex-1 h-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-[#08080B] overflow-hidden">
        
        {/* Hào quang nền huyền ảo & Lớp ánh sáng đỏ đế vương góc dưới cùng bên phải */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[radial-gradient(circle,rgba(196,30,58,0.14),transparent_70%)] blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(196,30,58,0.35),rgba(140,20,35,0.18)_45%,transparent_75%)] blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_70%)] blur-2xl pointer-events-none"></div>

        {/* Khối Thẻ Đăng Nhập Glassmorphism - Cân đối, thoáng đãng */}
        <div className="w-full max-w-[450px] mx-auto relative z-10 -translate-y-2 sm:-translate-y-4 lg:-translate-y-6">
          
          {/* Họa tiết 4 góc cung đình cổ điển ánh vàng */}
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-gold/70 rounded-tl-sm pointer-events-none z-20"></div>
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-gold/70 rounded-tr-sm pointer-events-none z-20"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-gold/70 rounded-bl-sm pointer-events-none z-20"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-gold/70 rounded-br-sm pointer-events-none z-20"></div>

          {/* Vỏ bọc Glassmorphism sang trọng với khoảng đệm rộng rãi */}
          <div className="relative rounded-2xl bg-[#121216]/95 border border-gold/30 backdrop-blur-2xl pt-5 sm:pt-6 pb-7 sm:pb-8 px-7 sm:px-8 lg:px-9 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
            
            {/* Header: Logo trực tiếp to rõ & Tiêu đề hoàng gia */}
            <div className="text-center mb-6 sm:mb-7">
              <div className="relative flex justify-center mb-4 -mt-1 sm:-mt-2 group/logo cursor-pointer">
                {/* Hào quang vàng - đỏ phát sáng dịu êm phía sau logo khi rê chuột */}
                <div className="absolute inset-0 max-w-[190px] mx-auto rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.2),rgba(196,30,58,0.12)_55%,transparent_75%)] blur-xl opacity-0 group-hover/logo:opacity-75 transition-all duration-500 pointer-events-none scale-90 group-hover/logo:scale-110"></div>

                <img 
                  src={logoImg} 
                  alt="Hỏa Diệm Các" 
                  className="relative z-10 w-44 sm:w-52 h-auto object-contain logo-imperial-glow select-none" 
                />
              </div>

              <h1 className="font-serif text-2xl sm:text-[26px] font-bold bg-gradient-to-r from-[#FFF0C2] via-[#FFD54F] to-[#D4AF37] bg-clip-text text-transparent">
                ĐĂNG NHẬP HỆ THỐNG
              </h1>
              <p className="mt-1.5 text-xs text-[#9E9EA6] font-medium">
                Vui lòng nhập thông tin xác thực để truy cập hệ thống quản trị
              </p>
            </div>

            {/* Form Đăng Nhập với khoảng cách trên dưới thoáng đãng */}
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}
              {/* Field: Email */}
              <div>
                <label className="block text-xs font-medium text-[#C8C8CE] mb-2">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7A84] group-hover:text-gold/80 group-focus-within:text-gold transition-colors duration-200">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="input-imperial w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#0D0D11] border border-surface-border text-sm text-[#EDEDED] placeholder-[#5A5A62] outline-none focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50 focus:shadow-[0_0_16px_rgba(212,175,55,0.35)] transition-all duration-200 cursor-text"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Field: Mật khẩu */}
              <div>
                <label className="block text-xs font-medium text-[#C8C8CE] mb-2">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A7A84] group-hover:text-gold/80 group-focus-within:text-gold transition-colors duration-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="input-imperial w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-[#0D0D11] border border-surface-border text-sm text-[#EDEDED] placeholder-[#5A5A62] outline-none focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50 focus:shadow-[0_0_16px_rgba(212,175,55,0.35)] font-sans transition-all duration-200 cursor-text"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A7A84] hover:text-gold transition-colors focus:outline-none"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Hàng tùy chọn: Quên mật khẩu */}
              <div className="flex justify-end text-xs pt-1 sm:pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-gold/90 hover:text-gold hover:underline focus:outline-none transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Nút Submit CTA Đỏ Đế Vương với hiệu ứng động bừng sáng và vệt quét ánh kim */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 sm:mt-4 relative group overflow-hidden rounded-xl bg-gradient-to-r from-[#D4AF37]/50 via-[#C41E3A] to-[#D4AF37]/50 p-px shadow-[0_8px_25px_rgba(196,30,58,0.45)] hover:shadow-[0_12px_35px_rgba(220,38,38,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="relative overflow-hidden px-5 py-3 sm:py-3.5 rounded-[11px] bg-gradient-to-r from-[#8B0000] via-[#C41E3A] to-[#D42B41] group-hover:brightness-110 flex items-center justify-center gap-2 text-white transition-all duration-300">
                  
                  {/* Vệt ánh sáng quét mượt mà khi chạm / rê chuột (Shimmer Light Sweep) */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"></div>

                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-bold tracking-wider text-sm">Đang xác thực bảo mật...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-extrabold tracking-widest text-[14px] sm:text-[15px] uppercase drop-shadow">
                        ĐĂNG NHẬP HỆ THỐNG
                      </span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 group-hover:scale-110 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Modal Hướng dẫn Quên Mật Khẩu */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#15151A] border border-gold/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#EDEDED]">Hỗ Trợ Đăng Nhập</h3>
                <p className="text-xs text-[#8E8E93]">Hệ thống bảo mật nội bộ Hỏa Diệm Các</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#B5B5BE] leading-relaxed">
              <p>
                Để đảm bảo tính an toàn dữ liệu và bảo mật hệ thống nhà hàng, mật khẩu nhân sự được quản lý và cấp phát bởi <strong className="text-gold">Quản Trị Viên Hệ Thống</strong>.
              </p>
              <div className="p-3.5 rounded-xl bg-[#0E0E12] border border-surface-border space-y-1.5 text-[11px]">
                <div className="text-gold font-bold">Tài khoản quản trị mặc định:</div>
                <div className="font-mono text-[#D6D3CD]">• Email: <span className="text-white">admin@hoadiemcac.vn</span></div>
                <div className="font-mono text-[#D6D3CD]">• Mật khẩu: <span className="text-white">hoadiemcac123</span></div>
              </div>
              <p className="text-[11px] text-[#80808A]">
                Nếu cần cấp lại mật khẩu cho tài khoản nhân viên, vui lòng liên hệ Ban Quản Lý ca trực hoặc bộ phận Kỹ thuật HCMUTE.
              </p>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#990000] to-[#C41E3A] text-white text-xs font-semibold hover:brightness-110 transition-all"
            >
              Đã hiểu, quay lại đăng nhập
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
