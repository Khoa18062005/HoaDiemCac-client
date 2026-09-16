import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Crown,
  UserX,
  RotateCcw,
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  Laptop
} from 'lucide-react';
import { tableApi } from '@/features/tables/api/tableApi';

export default function AdminTableDevicesModal({
  table,
  isOpen,
  onClose,
  onDeviceUpdated,
}) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchDevices = async () => {
    if (!table?.id) return;
    setLoading(true);
    try {
      const data = await tableApi.getAdminDevices(table.id);
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thiết bị admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && table?.id) {
      fetchDevices();
    }
  }, [isOpen, table?.id]);

  if (!isOpen || !table) return null;

  const showFeedback = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleKickDevice = async (deviceToken, deviceName) => {
    if (!window.confirm(`Bạn có chắc muốn ngắt kết nối thiết bị "${deviceName || 'Khách'}" khỏi bàn?`)) {
      return;
    }

    setActionLoading(deviceToken);
    try {
      await tableApi.adminKickDevice(table.id, deviceToken);
      showFeedback(`Đã ngắt kết nối thiết bị "${deviceName}"`);
      await fetchDevices();
      if (onDeviceUpdated) onDeviceUpdated();
    } catch (err) {
      showFeedback('Lỗi khi ngắt kết nối thiết bị: ' + (err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetHost = async () => {
    if (!window.confirm(`Đặt lại quyền Chủ Bàn cho bàn ${table.name || table.tableNumber}? Người quét mã hoặc nhập PIN tiếp theo sẽ trở thành Chủ Bàn.`)) {
      return;
    }

    setActionLoading('reset_host');
    try {
      await tableApi.adminResetHost(table.id);
      showFeedback('Đã đặt lại quyền Chủ Bàn thành công!');
      await fetchDevices();
      if (onDeviceUpdated) onDeviceUpdated();
    } catch (err) {
      showFeedback('Lỗi khi đặt lại Chủ Bàn: ' + (err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  const activeDevices = devices.filter((d) => d.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson-bg/60 border border-crimson-border/60 flex items-center justify-center text-gold">
              <Users className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#EDEDED] text-sm flex items-center gap-2">
                Quản Lý Thiết Bị Bàn {table.name || table.tableNumber}
                {table.area === 'VIP' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/40">
                    VIP
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                {activeDevices.length} / {table.maxActiveDevices || 6} thiết bị đang kết nối
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

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b ${
              feedback.isError
                ? 'bg-rose-950/80 border-rose-800/80 text-rose-300'
                : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
            }`}
          >
            {feedback.isError ? (
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Action Bar: Reset Host */}
        <div className="px-5 py-2.5 bg-[#141416] border-b border-[#27272A] flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-gold" />
            <span>Phân quyền gửi bếp bàn</span>
          </div>
          <button
            type="button"
            onClick={handleResetHost}
            disabled={actionLoading === 'reset_host'}
            className="py-1 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] text-amber-300 font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Đặt lại quyền Chủ Bàn (Thiết bị quét tiếp theo sẽ là Chủ Bàn)"
          >
            <RotateCcw
              className={`w-3 h-3 text-amber-400 ${
                actionLoading === 'reset_host' ? 'animate-spin' : ''
              }`}
            />
            <span>Đặt Lại Chủ Bàn</span>
          </button>
        </div>

        {/* Device List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 bg-[#0E0E10]">
          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-gold" />
              <span>Đang tải danh sách thiết bị...</span>
            </div>
          ) : activeDevices.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
              <Smartphone className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
              <span>Hiện chưa có thiết bị nào kết nối vào bàn này.</span>
              <span className="text-[11px] text-zinc-600">
                Khi khách quét mã QR và nhập mã PIN, thiết bị sẽ xuất hiện tại đây.
              </span>
            </div>
          ) : (
            activeDevices.map((dev, idx) => {
              const isHost = Boolean(dev.isHost);
              return (
                <div
                  key={dev.deviceToken || idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isHost
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                      : 'bg-[#18181B] border-[#27272A] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isHost
                          ? 'bg-gradient-to-br from-amber-500/30 to-amber-700/30 border border-amber-500/60 text-gold'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {isHost ? (
                        <Crown className="w-4 h-4 text-gold" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 truncate">
                          {dev.deviceName || `Thiết bị #${idx + 1}`}
                        </span>
                        {isHost ? (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase tracking-wider bg-amber-500/20 text-gold border border-amber-500/40 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            Chủ Bàn
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Thành viên
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10.5px] text-zinc-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">
                          Token: {dev.deviceToken ? `${dev.deviceToken.slice(0, 8)}...` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleKickDevice(dev.deviceToken, dev.deviceName)}
                      disabled={actionLoading === dev.deviceToken}
                      className="py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Ngắt kết nối thiết bị này ngay lập tức"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Đá Ra</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#27272A] bg-[#121214] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Chủ Bàn là người duy nhất có quyền gửi đơn vào bếp.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
