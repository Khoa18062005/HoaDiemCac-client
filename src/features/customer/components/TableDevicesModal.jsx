import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Crown,
  UserX,
  ShieldCheck,
  RefreshCw,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { tableApi, getStoredTableSession, saveTableSession } from '@/features/tables/api/tableApi';

/**
 * TableDevicesModal
 * Modal quản lý danh sách thiết bị đang kết nối vào bàn ăn (Tầng 2 Bảo Mật):
 * - Hiển thị danh sách thiết bị: Ai là Chủ Bàn (👑 Host), ai là Thành Viên (👤 Member).
 * - Chủ Bàn có quyền:
 *    + Bấm "Đá Ra" (Kick Device) để tống cổ ngay kẻ lạ/phá hoại ra khỏi bàn.
 *    + Bấm "Chuyển Chủ Bàn" (Transfer Host) cho bạn bè nếu cần nhường quyền.
 * - Thành Viên: Xem được danh sách bạn cùng bàn và biết ai là Chủ Bàn giữ quyền gửi bếp.
 */
export default function TableDevicesModal({ isOpen, onClose, tableNumber = 'B01', onHostChanged }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const session = getStoredTableSession();
  const isCurrentHost = Boolean(session?.isHost);
  const currentToken = session?.deviceToken;

  const loadDevices = async () => {
    try {
      setLoading(true);
      const res = await tableApi.getDevices(tableNumber);
      if (Array.isArray(res)) {
        setDevices(res);
      } else if (res?.result && Array.isArray(res.result)) {
        setDevices(res.result);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách thiết bị:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      setFeedbackMsg({ type: '', text: '' });
    }
  }, [isOpen, tableNumber]);

  if (!isOpen) return null;

  const handleKickDevice = async (targetDevice) => {
    if (!window.confirm(`Bạn có chắc chắn muốn đá thiết bị "${targetDevice.deviceName}" ra khỏi bàn không?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setFeedbackMsg({ type: '', text: '' });
      await tableApi.kickDevice(tableNumber, targetDevice.deviceToken);

      setFeedbackMsg({
        type: 'success',
        text: `Đã đá "${targetDevice.deviceName}" ra khỏi bàn thành công!`,
      });

      // Tải lại danh sách
      await loadDevices();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Lỗi khi đá thiết bị',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferHost = async (targetDevice) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển quyền Chủ Bàn (👑) cho "${targetDevice.deviceName}" không? Sau khi chuyển, bạn sẽ thành Thành Viên và người này sẽ giữ nút Gửi Bếp.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setFeedbackMsg({ type: '', text: '' });
      await tableApi.transferHost(tableNumber, targetDevice.deviceToken);

      // Cập nhật session của máy hiện tại thành Member
      if (session) {
        saveTableSession({ ...session, isHost: false });
      }

      setFeedbackMsg({
        type: 'success',
        text: `Đã chuyển quyền Chủ Bàn cho "${targetDevice.deviceName}"!`,
      });

      if (onHostChanged) {
        onHostChanged(false);
      }

      await loadDevices();
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Lỗi khi chuyển quyền chủ bàn',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#EDEDED] text-sm tracking-wide">
                Thiết Bị Cùng Bàn • {tableNumber}
              </h3>
              <p className="text-[10px] text-[#8E8E93]">
                {devices.length} thiết bị đang kết nối
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E8E93] hover:text-[#EDEDED] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Role Banner */}
        <div className={`px-5 py-2.5 border-b text-xs flex items-center gap-2 ${
          isCurrentHost
            ? 'bg-amber-950/20 border-amber-500/30 text-[#FFD54F]'
            : 'bg-zinc-900/60 border-zinc-700/40 text-zinc-300'
        }`}>
          {isCurrentHost ? (
            <>
              <Crown className="w-4 h-4 text-gold flex-shrink-0" />
              <span>
                Bạn là <strong>Chủ Bàn (👑 Host)</strong>: Có toàn quyền <strong>Gửi Bếp</strong> và <strong>Đá thiết bị lạ</strong>.
              </span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span>
                Bạn là <strong>Thành Viên (👤 Member)</strong>: Bạn có thể chọn món vào giỏ chung, Chủ Bàn sẽ bấm Gửi Bếp.
              </span>
            </>
          )}
        </div>

        {/* Feedback Alert */}
        {feedbackMsg.text && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}>
            {feedbackMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Devices List Body */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#8E8E93]">
              <RefreshCw className="w-6 h-6 animate-spin text-gold" />
              <p className="text-xs">Đang tải danh sách máy...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E8E93]">
              Chưa có thiết bị nào khác kết nối.
            </div>
          ) : (
            devices.map((device, idx) => {
              const isThisDeviceCurrent = Boolean(
                device.isCurrentDevice || (currentToken && device.deviceToken === currentToken)
              );

              return (
                <div
                  key={device.deviceToken || idx}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isThisDeviceCurrent
                      ? 'bg-[#22181A] border-crimson-border/60 shadow-sm'
                      : 'bg-[#141418] border-[#27272A] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Device Icon / Avatar */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
                      device.isHost
                        ? 'bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-black font-bold'
                        : 'bg-[#1F1F24] border border-zinc-700 text-zinc-300'
                    }`}>
                      {device.isHost ? (
                        <Crown className="w-4 h-4" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                    </div>

                    {/* Device Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#EDEDED] truncate">
                          {device.deviceName || `Thiết bị ${idx + 1}`}
                        </span>
                        {isThisDeviceCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gold/20 text-gold border border-gold/40">
                            Bạn
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium ${
                          device.isHost ? 'text-amber-400 font-bold' : 'text-[#8E8E93]'
                        }`}>
                          {device.isHost ? '👑 Chủ Bàn' : '👤 Thành Viên'}
                        </span>
                        {device.connectedAt && (
                          <span className="text-[10px] text-zinc-500">
                            • Vào lúc {new Date(device.connectedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Host: Transfer host or Kick */}
                  {isCurrentHost && !isThisDeviceCurrent && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Nút Chuyển quyền Chủ Bàn */}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleTransferHost(device)}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-medium text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
                        title="Chuyển quyền Chủ Bàn cho người này"
                      >
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">Chuyển quyền</span>
                      </button>

                      {/* Nút Đá Ra */}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleKickDevice(device)}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-medium text-rose-300 hover:text-rose-200 flex items-center gap-1 transition-colors"
                        title="Đá thiết bị này ra khỏi bàn (Chống quét phá)"
                      >
                        <UserX className="w-3 h-3 text-rose-400" />
                        <span>Đá ra</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-[#27272A] bg-[#121214] flex items-center justify-between text-[10.5px] text-[#8E8E93]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Hệ thống bảo vệ phiên bàn & chống quậy phá</span>
          </div>
          <button
            type="button"
            onClick={loadDevices}
            disabled={loading}
            className="text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
