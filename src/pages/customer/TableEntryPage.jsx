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
  RotateCcw,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react';
import logoTabImg from '@/assets/images/logo_tab.png';
import {
  tableApi,
  getStoredTableSession,
  saveTableSession,
  clearTableSession,
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
  const [entryMode, setEntryMode] = useState('PIN'); // 'PIN' | 'TRANSFER'
  const [transferCode, setTransferCode] = useState('');

  const normalizeTableNumber = (raw) => {
    if (!raw) return 'B01';
    const upper = raw.toUpperCase().trim();
    if (/^\d+$/.test(upper)) {
      return `B${upper.padStart(2, '0')}`;
    }
    return upper;
  };

  const normalizedTableCode = normalizeTableNumber(tableId || 'B01');

  // Kiểm tra phiên đăng nhập sẵn trong localStorage và xác thực với server
  useEffect(() => {
    const checkExistingSession = async () => {
      const existingSession = getStoredTableSession();
      if (existingSession && existingSession.tableNumber === normalizedTableCode && existingSession.sessionToken) {
        const isValid = await tableApi.validateSession();
        if (isValid) {
          navigate(`/menu?table=${normalizedTableCode}`);
          return;
        } else {
          clearTableSession();
        }
      }

      // Tải thông tin công khai của bàn
      try {
        const info = await tableApi.getTablePublicInfo(normalizedTableCode);
        setTableInfo(info);
      } catch (err) {
        console.error('Lỗi khi tải thông tin bàn:', err);
      }
    };

    checkExistingSession();
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

      // Lưu thông tin phiên hợp lệ vào localStorage (kèm vai trò Chủ Bàn / Thành Viên)
      saveTableSession({
        tableNumber: res.tableNumber || normalizedTableCode,
        tableName: res.tableName || `Bàn ${normalizedTableCode}`,
        sessionToken: res.sessionToken,
        deviceToken: res.deviceToken,
        deviceName: res.deviceName,
        isHost: res.isHost ?? true,
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

  const handleSubmitTransfer = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = transferCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Vui lòng nhập mã chuyển bàn (VD: TRF-1234)');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const res = await tableApi.confirmTransfer(
        normalizedTableCode,
        cleanCode,
        'web-client',
        'Thiết bị chuyển'
      );

      const targetTable = res.newTableNumber || normalizedTableCode;

      // Đồng bộ giỏ hàng nháp đã hợp nhất/chuyển vào localStorage của bàn mới
      if (Array.isArray(res.cartItems)) {
        try {
          localStorage.setItem(`hoadiemcat_cart_${targetTable}`, JSON.stringify(res.cartItems));
        } catch (e) {
          console.warn('Lỗi lưu giỏ hàng chuyển bàn vào localStorage:', e);
        }
      }

      saveTableSession({
        tableNumber: targetTable,
        tableName: res.newTableName || `Bàn ${targetTable}`,
        sessionToken: res.newSessionToken,
        deviceToken: res.deviceToken,
        deviceName: res.deviceName,
        isHost: res.isHost ?? true,
        verifiedAt: new Date().toISOString(),
      });

      navigate(`/menu?table=${targetTable}`);
    } catch (err) {
      setErrorMsg(err.message || 'Mã chuyển bàn không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe bàn phím vật lý khi đang ở chế độ nhập PIN
  useEffect(() => {
    if (entryMode !== 'PIN') return;

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
  }, [pin, isLockedCountdown, loading, entryMode]);

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

      {/* 2. Khung Nhập Liệu: Tab Switcher (Mã PIN vs Nhận Chuyển Bàn) */}
      <div className="w-full max-w-xs flex flex-col items-center my-auto">
        <div className="flex items-center w-full p-1 bg-[#16161A] border border-zinc-800 rounded-xl mb-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setEntryMode('PIN');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              entryMode === 'PIN'
                ? 'bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Mã PIN Bàn</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEntryMode('TRANSFER');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              entryMode === 'TRANSFER'
                ? 'bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Nhận Chuyển Bàn</span>
          </button>
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

        {entryMode === 'PIN' ? (
          <>
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
          </>
        ) : (
          /* Form Nhập Mã Chuyển Bàn */
          <form onSubmit={handleSubmitTransfer} className="w-full space-y-4">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left space-y-2">
              <p className="text-xs font-semibold text-[#FFE699] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD54F]" />
                Mang giỏ hàng từ bàn cũ sang
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Nhập mã chuyển bàn (VD: <span className="text-[#FFD54F] font-mono font-bold">TRF-8492</span>) đã được tạo tại bàn cũ để tự động chuyển toàn bộ giỏ hàng và đợt order sang bàn này.
              </p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Mã chuyển bàn:
              </label>
              <input
                type="text"
                value={transferCode}
                onChange={(e) => setTransferCode(e.target.value.toUpperCase())}
                placeholder="VD: TRF-8492"
                className="w-full h-12 px-4 rounded-xl bg-[#141417] border-2 border-zinc-700 focus:border-[#D4AF37] text-center font-mono font-extrabold text-xl text-[#FFD54F] tracking-widest placeholder:text-zinc-600 outline-none transition-all shadow-inner"
                maxLength={12}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !transferCode.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white font-bold text-xs tracking-wide border border-[#FFE699]/50 shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFE699]" />
                  <span>Đang đồng bộ dữ liệu...</span>
                </>
              ) : (
                <>
                  <span>Vào Bàn Với Giỏ Hàng Cũ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
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
