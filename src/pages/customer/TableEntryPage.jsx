import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Delete,
  Lock,
  ArrowRight,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import logoTabImg from '@/assets/images/logo_tab.png';
import {
  tableApi,
  getStoredTableSession,
  saveTableSession
} from '@/features/tables/api/tableApi';

export default function TableEntryPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableInfo, setTableInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLockedCountdown, setIsLockedCountdown] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const normalizedTableCode = (tableId || 'B01').toUpperCase();

  // Kiểm tra phiên đăng nhập sẵn trong localStorage
  useEffect(() => {
    const existingSession = getStoredTableSession();
    if (existingSession && existingSession.tableNumber === normalizedTableCode && existingSession.sessionToken) {
      // Đã có phiên, chuyển thẳng vào thực đơn
      navigate(`/menu?table=${normalizedTableCode}`);
      return;
    }

    // Tải thông tin công khai của bàn
    const fetchInfo = async () => {
      try {
        const info = await tableApi.getTablePublicInfo(normalizedTableCode);
        setTableInfo(info);
      } catch (err) {
        console.error('Lỗi khi tải thông tin bàn:', err);
      }
    };
    fetchInfo();
  }, [normalizedTableCode, navigate]);

  // Bộ đếm ngược khóa 60s khi nhập sai 5 lần
  useEffect(() => {
    if (isLockedCountdown <= 0) return;
    const timer = setInterval(() => {
      setIsLockedCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLockedCountdown]);

  const handleKeyPress = (num) => {
    if (isLockedCountdown > 0 || loading) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      // Tự động submit khi đã nhập đủ 4 số
      if (nextPin.length === 4) {
        handleSubmitPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isLockedCountdown > 0 || loading) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    if (isLockedCountdown > 0 || loading) return;
    setPin('');
    setErrorMsg('');
  };

  const handleSubmitPin = async (passcodeToVerify) => {
    const code = passcodeToVerify || pin;
    if (code.length !== 4) {
      setErrorMsg('Vui lòng nhập đúng 4 chữ số');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await tableApi.verifyPasscode(normalizedTableCode, code);

      // Lưu thông tin phiên hợp lệ vào localStorage
      saveTableSession({
        tableNumber: res.tableNumber || normalizedTableCode,
        tableName: res.tableName || `Bàn ${normalizedTableCode}`,
        sessionToken: res.sessionToken,
        deviceToken: res.deviceToken,
        verifiedAt: new Date().toISOString(),
      });

      // Chuyển hướng vào thực đơn gọi món
      navigate(`/menu?table=${normalizedTableCode}`);
    } catch (err) {
      const newFailed = failedCount + 1;
      setFailedCount(newFailed);
      setPin('');

      if (newFailed >= 5) {
        setIsLockedCountdown(60);
        setErrorMsg('Bạn đã nhập sai 5 lần. Tạm khóa nhập trong 60 giây để chống quét phá!');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Mã PIN không chính xác. Vui lòng kiểm tra lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe bàn phím vật lý
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isLockedCountdown, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181212] via-[#121214] to-[#0A0A0C] text-[#EDEDED] flex flex-col justify-between items-center px-4 pt-2 pb-4 selection:bg-gold selection:text-black">
      {/* 1. Header Thương Hiệu (Đã nhích lên phía trên) */}
      <div className="w-full max-w-sm flex flex-col items-center pt-2 pb-1">
        <img
          src={logoTabImg}
          alt="Hỏa Diệm Các"
          className="w-14 h-14 object-contain drop-shadow-[0_4px_14px_rgba(212,175,55,0.35)] mb-1.5"
        />
        <h1 className="text-lg font-bold font-serif text-gold tracking-wide">
          HỎA DIỆM CÁC
        </h1>
        <p className="text-[10px] text-[#A0A0A5] tracking-widest uppercase mt-0.5">
          Mỹ Vị Lẩu Hoàng Triều
        </p>

        {/* Thông tin Bàn */}
        <div className="mt-2.5 px-4 py-1.5 rounded-full bg-crimson-subtle border border-crimson-border text-center shadow-lg">
          <p className="text-[11px] text-[#A0A0A5]">Quý khách đang ngồi tại</p>
          <p className="text-sm font-bold text-gold font-serif">
            {tableInfo?.name || `Bàn ${normalizedTableCode}`}
            {tableInfo?.area === 'VIP' && ' • Phòng VIP'}
          </p>
        </div>
      </div>

      {/* 2. Form Nhập PIN 4 Số */}
      <div className="w-full max-w-xs flex flex-col items-center my-auto">
        <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5] mb-4">
          <Lock className="w-3.5 h-3.5 text-gold" />
          <span>Nhập mã PIN 4 chữ số để vào thực đơn</span>
        </div>

        {/* 4 Ô hiển thị số PIN */}
        <div className="flex items-center justify-center gap-3.5 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const digit = pin[index];
            const isCurrent = pin.length === index;
            return (
              <div
                key={index}
                className={`w-14 h-14 min-w-[56px] rounded-2xl border-2 flex items-center justify-center text-3xl font-bold font-mono transition-all duration-200 shadow-lg ${
                  digit
                    ? 'border-gold bg-[#221C16] text-gold scale-105 shadow-gold/20'
                    : isCurrent
                    ? 'border-gold/70 bg-[#1A1A1E] ring-4 ring-gold/20'
                    : 'border-[#2E2E34] bg-[#141417] text-transparent'
                }`}
              >
                {digit ? '•' : ''}
              </div>
            );
          })}
        </div>

        {/* Thông báo lỗi hoặc đếm ngược */}
        {errorMsg && (
          <div className="w-full mb-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLockedCountdown > 0 && (
          <div className="w-full mb-4 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs text-center flex items-center justify-center gap-1.5">
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>Tạm khóa nhập: Còn {isLockedCountdown} giây...</span>
          </div>
        )}

        {/* Bàn phím số ảo (Keypad) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(String(num))}
              disabled={isLockedCountdown > 0 || loading}
              className="h-14 rounded-xl bg-[#1C1C20] hover:bg-[#27272A] active:scale-95 border border-[#27272A] hover:border-gold/40 text-xl font-medium font-mono text-[#EDEDED] transition-all flex items-center justify-center shadow-md disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Nút Xóa Hết (C) */}
          <button
            onClick={handleClear}
            disabled={isLockedCountdown > 0 || loading}
            className="h-14 rounded-xl bg-[#1C1C20]/70 hover:bg-[#27272A] active:scale-95 border border-[#27272A] text-xs font-semibold text-[#8E8E93] hover:text-[#EDEDED] transition-all flex items-center justify-center disabled:opacity-50"
          >
            XÓA
          </button>

          {/* Phím 0 */}
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isLockedCountdown > 0 || loading}
            className="h-14 rounded-xl bg-[#1C1C20] hover:bg-[#27272A] active:scale-95 border border-[#27272A] hover:border-gold/40 text-xl font-medium font-mono text-[#EDEDED] transition-all flex items-center justify-center shadow-md disabled:opacity-50"
          >
            0
          </button>

          {/* Nút Backspace */}
          <button
            onClick={handleDelete}
            disabled={isLockedCountdown > 0 || loading}
            className="h-14 rounded-xl bg-[#1C1C20]/70 hover:bg-[#27272A] active:scale-95 border border-[#27272A] text-xs text-[#8E8E93] hover:text-rose-400 transition-all flex items-center justify-center disabled:opacity-50"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Footer Hướng Dẫn & Bảo Mật */}
      <div className="w-full max-w-sm pb-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8E8E93]">
          <HelpCircle className="w-3.5 h-3.5 text-gold" />
          <span>Mã PIN hiển thị trên bàn hoặc do nhân viên phục vụ cấp</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Hệ thống bảo vệ phiên bàn ăn & chống truy cập trái phép</span>
        </div>
      </div>
    </div>
  );
}
