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

export default function TableTransferModal({
  isOpen,
  onClose,
  tableNumber = 'B01',
  isHost = true,
  cartItems = [],
  onTransferSuccess,
}) {
  const [transferType, setTransferType] = useState('MOVE'); // 'MOVE' | 'MERGE'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Dữ liệu mã chuyển hiện tại
  const [transferData, setTransferData] = useState(null);
  const [countdown, setCountdown] = useState(0);

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

  if (!isOpen) return null;

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

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
    if (!transferData?.transferCode || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await tableApi.cancelTransfer(transferData.transferCode);
      setTransferData(null);
      setCountdown(0);
      if (onTransferSuccess) onTransferSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể hủy yêu cầu chuyển bàn.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!transferData?.transferCode) return;
    navigator.clipboard?.writeText(transferData.transferCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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
            onClick={onClose}
            className="text-[#9E9AA0] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
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
                onClick={handleCancelTransfer}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs tracking-wider border border-zinc-700 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Hủy Yêu Cầu Chuyển Bàn</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
