import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Copy,
  Check,
  ShieldAlert,
  Users2
} from 'lucide-react';
import { tableApi } from '@/features/tables/api/tableApi';
import { env } from '@/config/env';

export default function TableTransferModal({
  isOpen,
  onClose,
  tableNumber = 'B01',
  isHost = true,
  cartItems = [],
  onTransferSuccess,
  onActiveTransferChange,
}) {
  const [transferType, setTransferType] = useState('MOVE'); // 'MOVE' | 'MERGE'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Dữ liệu mã chuyển hiện tại
  const [transferData, setTransferData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Popup xác nhận hủy tiến trình chuyển bàn (thay thế window.confirm để đảm bảo thẩm mỹ theme Hỏa Diệm Các)
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [confirmCancelSource, setConfirmCancelSource] = useState(null); // 'CLOSE_BUTTON' | 'CANCEL_BUTTON'

  // Phím Escape để đóng popup xác nhận
  useEffect(() => {
    if (!isConfirmCancelOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsConfirmCancelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmCancelOpen]);

  // Thông báo ra component cha khi có mã chuyển bàn đang active
  useEffect(() => {
    if (onActiveTransferChange) {
      onActiveTransferChange(Boolean(transferData));
    }
  }, [transferData, onActiveTransferChange]);

  // Đếm ngược TTL
  useEffect(() => {
    if (!transferData || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTransferData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [transferData, countdown]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  // Lắng nghe sự kiện F5 / Rời trang để cảnh báo khi tiến trình chuyển bàn đang hoạt động
  useEffect(() => {
    if (!transferData?.transferCode) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Tiến trình chuyển bàn đang diễn ra. Bạn có chắc chắn muốn rời khỏi trang?';
      return e.returnValue;
    };

    const handlePageHide = () => {
      if (transferData?.transferCode) {
        let deviceToken = '';
        try {
          const stored = localStorage.getItem('hoadiemcat_table_session');
          if (stored) {
            const parsed = JSON.parse(stored);
            deviceToken = parsed?.deviceToken || '';
          }
        } catch (e) {}

        const url = `${env.API_URL}/customer/tables/transfers/cancel?transferCode=${encodeURIComponent(transferData.transferCode)}`;
        const headers = { 'Content-Type': 'application/json' };
        if (deviceToken) {
          headers['X-Device-Token'] = deviceToken;
        }

        try {
          fetch(url, {
            method: 'POST',
            headers,
            keepalive: true,
          }).catch(() => {});
        } catch (err) {}
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [transferData]);

  const handleRequestTransfer = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await tableApi.requestTransfer(tableNumber, transferType, reason, cartItems);
      setTransferData(res);
      const ttl = res.ttlSeconds || 300;
      setCountdown(ttl);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tạo mã chuyển bàn. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!transferData?.transferCode || loading) return false;
    setLoading(true);
    setErrorMsg('');
    try {
      await tableApi.cancelTransfer(transferData.transferCode);
      setTransferData(null);
      setCountdown(0);
      if (onTransferSuccess) onTransferSuccess();
      return true;
    } catch (err) {
      setErrorMsg(err.message || 'Không thể hủy yêu cầu chuyển bàn.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mở popup xác nhận hủy trước khi gọi API hủy (dùng cho nút Hủy Yêu Cầu Chuyển Bàn)
  const handleCancelWithConfirm = () => {
    setConfirmCancelSource('CANCEL_BUTTON');
    setIsConfirmCancelOpen(true);
  };

  // Đóng modal bằng nút 'X' kèm xác nhận hủy nếu có mã đang active
  const handleCloseWithConfirm = () => {
    if (transferData) {
      setConfirmCancelSource('CLOSE_BUTTON');
      setIsConfirmCancelOpen(true);
    } else {
      onClose();
    }
  };

  // Xử lý khi người dùng chọn "Đồng ý hủy" trên popup xác nhận
  const handleConfirmCancelAction = async () => {
    setIsConfirmCancelOpen(false);
    const success = await handleCancelTransfer();
    if (success && confirmCancelSource === 'CLOSE_BUTTON') {
      onClose();
    }
  };

  const handleCopyCode = () => {
    if (!transferData?.transferCode) return;
    navigator.clipboard?.writeText(transferData.transferCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181C] border border-[rgba(212,175,55,0.4)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#2A1014] to-[#1A1215] border-b border-[rgba(212,175,55,0.25)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#C41E3A]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#FFD54F]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FFE699] font-serif tracking-wide">
                Đổi Bàn / Ghép Bàn
              </h2>
              <p className="text-[11px] text-[#A09B95]">Bàn hiện tại: <span className="text-[#FFD54F] font-bold">{tableNumber}</span></p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseWithConfirm}
            className="text-[#9E9AA0] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng hộp thoại chuyển bàn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!transferData ? (
            // Trạng thái 1: Chưa tạo mã chuyển bàn
            <>
              {!isHost ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <ShieldAlert className="w-4 h-4" />
                    Chỉ Chủ Bàn mới có quyền chuyển bàn
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Bạn hiện đang là Thành viên. Vui lòng nhờ Chủ Bàn hoặc gọi nhân viên phục vụ để hỗ trợ chuyển/ghép bàn.
                  </p>
                </div>
              ) : (
                <>
                  {/* Lựa chọn loại điều chuyển */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D6D3CD]">
                      Hình thức thực hiện:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTransferType('MOVE')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          transferType === 'MOVE'
                            ? 'bg-[#C41E3A]/20 border-[#D4AF37] text-[#FFE699]'
                            : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          Chuyển Bàn (1:1)
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          Đổi sang bàn trống khác (bảo lưu toàn bộ giỏ)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferType('MERGE')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          transferType === 'MERGE'
                            ? 'bg-[#C41E3A]/20 border-[#D4AF37] text-[#FFE699]'
                            : 'bg-[#121215] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Users2 className="w-3.5 h-3.5" />
                          Ghép Bàn (N:1)
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          Nhập nhóm vào bàn bạn bè đang ngồi
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Lý do tùy chọn */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#D6D3CD]">
                      Lý do chuyển/ghép (tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="VD: Cần bàn rộng hơn, đổi khu máy lạnh..."
                      className="w-full px-3 py-2 bg-[#121215] border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-[#D4AF37] outline-none"
                    />
                  </div>

                  {/* Cam kết bảo toàn giỏ hàng */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong>Bảo toàn 100% món ăn:</strong> {cartItems.length > 0 ? `${cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} món trong giỏ hàng và các đơn đã gọi được lưu an toàn lên máy chủ.` : 'Giỏ hàng và các đơn đã gọi được lưu an toàn trên hệ thống.'} Nếu không sử dụng mã trong 5 phút, bàn sẽ tự động mở khóa bình thường.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestTransfer}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white font-bold text-xs tracking-wider border border-[#FFE699]/50 shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFE699]" />
                        <span>Đang tạo mã chuyển...</span>
                      </>
                    ) : (
                      <>
                        <span>Tạo Mã {transferType === 'MOVE' ? 'Chuyển Bàn' : 'Ghép Bàn'}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </>
          ) : (
            // Trạng thái 2: Đã có mã chuyển bàn, đếm ngược TTL
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#2A1518] to-[#161214] border border-[#D4AF37]/50 space-y-3">
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  Mã Chuyển Bàn Của Bạn
                </span>

                <div className="flex items-center justify-center gap-2">
                  <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-[#FFD54F] drop-shadow-md">
                    {transferData.transferCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#FFE699] transition-all"
                    title="Sao chép mã"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Đồng hồ đếm ngược */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Hiệu lực còn: <strong>{formatCountdown(countdown)}</strong></span>
                </div>
              </div>

              {/* Hướng dẫn các bước */}
              <div className="text-left p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                <p className="font-bold text-[#FFE699]">Các bước tiếp theo:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-300">
                  <li>Di chuyển sang bàn mới của bạn.</li>
                  <li>Quét mã QR tại bàn mới trên điện thoại.</li>
                  <li>Chọn tab <strong>"Nhận chuyển bàn"</strong> và điền mã <span className="text-[#FFD54F] font-mono font-bold">{transferData.transferCode}</span>.</li>
                  {transferType === 'MERGE' && (
                    <li className="text-amber-300 font-medium">
                      Nhập thêm <strong>mã PIN 4 số của bàn đích</strong> (xin từ bạn bè) để xác thực ghép bàn an toàn.
                    </li>
                  )}
                  <li>Toàn bộ giỏ hàng và đơn đã đặt sẽ lập tức xuất hiện tại bàn mới!</li>
                </ol>
              </div>

              {/* Nút hủy chuyển bàn */}
              <button
                type="button"
                onClick={handleCancelWithConfirm}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs tracking-wider border border-zinc-700 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Hủy Yêu Cầu Chuyển Bàn</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Popup Xác Nhận Hủy Chuyển Bàn (Theme Hỏa Diệm Các) */}
      {isConfirmCancelOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => !loading && setIsConfirmCancelOpen(false)}
        >
          <div
            className="bg-[#18181C] border border-[rgba(212,175,55,0.4)] w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative text-[#FDFBF7] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hiệu ứng ánh sáng nền */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-red-600/20 via-[#D4AF37]/15 to-transparent rounded-bl-full pointer-events-none" />

            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 flex items-start gap-3.5 relative z-10 border-b border-white/10 bg-[#16161A]">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7A0C16] to-[#C41E3A] border border-red-500/50 flex items-center justify-center text-[#FFD54F] shadow-lg flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#FFD54F]" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FFD54F] font-bold block mb-0.5">
                  HỎA DIỆM CÁC • BÀN {tableNumber}
                </span>
                <h3 className="text-base font-serif font-bold text-white leading-tight">
                  Xác Nhận Hủy Chuyển Bàn
                </h3>
                <p className="text-[11px] text-[#A39E93] mt-0.5">
                  {confirmCancelSource === 'CLOSE_BUTTON' ? 'Đóng hộp thoại chuyển bàn' : 'Hủy tiến trình đổi/ghép bàn'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !loading && setIsConfirmCancelOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-[#9E9AA0] hover:text-white hover:bg-white/10 transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-3 relative z-10 text-xs sm:text-[13px] leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 text-red-200/90 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p>
                  Bạn có chắc chắn muốn hủy yêu cầu chuyển bàn này không?
                </p>
              </div>

              {transferData?.transferCode && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Mã chuyển hiện tại:</span>
                    <span className="font-mono font-bold text-amber-300">{transferData.transferCode}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Mã sẽ bị hủy bỏ ngay lập tức và bàn sẽ mở lại quyền gọi món bình thường.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-[#141416] border-t border-white/10 flex items-center justify-end gap-2.5 relative z-10">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsConfirmCancelOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-[#D6D3CD] font-bold text-xs hover:bg-white/5 active:scale-95 transition-all"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelAction}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Đồng ý hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
