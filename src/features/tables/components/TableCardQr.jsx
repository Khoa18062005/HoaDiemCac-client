import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock,
  Unlock,
  RefreshCw,
  Copy,
  Check,
  Printer,
  Smartphone,
  ShieldAlert,
  Eye,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function TableCardQr({
  table,
  onRegeneratePin,
  onToggleLock,
  onUpdateStatus,
  onOpenPrintModal,
}) {
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const qrUrl = window.location.origin + `/table/${table.tableNumber.toLowerCase()}`;

  const handleCopyPin = (e) => {
    e.stopPropagation();
    if (!table.currentPasscode) return;
    navigator.clipboard.writeText(table.currentPasscode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async (e) => {
    e.stopPropagation();
    setIsRotating(true);
    try {
      await onRegeneratePin(table.id);
    } finally {
      setTimeout(() => setIsRotating(false), 600);
    }
  };

  // Màu sắc theo trạng thái bàn
  const statusConfig = {
    AVAILABLE: {
      label: 'Bàn Trống',
      dot: 'bg-emerald-400',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    OCCUPIED: {
      label: 'Đang Dùng',
      dot: 'bg-amber-400',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    CLEANING: {
      label: 'Đang Dọn',
      dot: 'bg-blue-400',
      badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
  }[table.status] || {
    label: table.status,
    dot: 'bg-gray-400',
    badge: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <div
      className={`group relative bg-[#18181B] border rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:border-gold/40 flex flex-col justify-between overflow-hidden ${
        table.isOrderLocked
          ? 'border-red-900/60 bg-red-950/10'
          : 'border-[#27272A] hover:bg-[#1C1C20]'
      }`}
    >
      {/* 1. Header: Tên bàn & Trạng thái */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#EDEDED] group-hover:text-gold transition-colors font-serif">
                {table.name}
              </span>
              {table.area === 'VIP' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gold/15 text-gold border border-gold/30">
                  VIP
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8E8E93]">
              Mã: <span className="font-mono text-zinc-300 font-medium">{table.tableNumber}</span> • {table.capacity} Khách
            </p>
          </div>

          {/* Trạng thái Bàn Badge */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusConfig.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>

            {table.isOrderLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldAlert className="w-3 h-3" />
                Khóa Order
              </span>
            )}
          </div>
        </div>

        {/* 2. Body: QR Code & Mã PIN 4 Số Nổi Bật */}
        <div className="flex items-center gap-4 my-3 p-3 rounded-xl bg-[#121214] border border-[#27272A]/80">
          {/* QR Code thumbnail (Click để xem to / in) & Link Quét Thử */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              onClick={() => onOpenPrintModal(table)}
              className="relative p-2 bg-white rounded-lg cursor-pointer hover:scale-105 transition-transform shadow-md group/qr"
              title="Click để phóng to hoặc in tem QR để bàn"
            >
              <QRCodeSVG
                value={qrUrl}
                size={64}
                level="M"
              />
              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/qr:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Eye className="w-4 h-4 text-gold" />
              </div>
            </div>

            {/* Quick click to test link directly */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(qrUrl, '_blank');
              }}
              className="mt-1.5 w-full py-1 px-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[10px] text-blue-300 hover:text-blue-200 font-medium flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
              title={`Mở link khách quét bàn ${table.tableNumber}: ${qrUrl}`}
            >
              <ExternalLink className="w-2.5 h-2.5" />
              <span>Quét thử</span>
            </button>
          </div>

          {/* Mã PIN 4 số của bàn */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#A0A0A5] uppercase tracking-wider font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-gold" />
              Mật khẩu PIN vào bàn
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="px-3 py-1.5 rounded-lg bg-[#1C1616] border border-crimson-border/60 flex items-center gap-2 shadow-inner">
                <span className="font-mono text-lg font-black tracking-widest text-gold selection:bg-gold selection:text-black">
                  {table.currentPasscode || '----'}
                </span>
                <button
                  onClick={handleCopyPin}
                  className="p-1 rounded hover:bg-white/10 text-[#8E8E93] hover:text-gold transition-colors"
                  title="Sao chép mã PIN"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Nút sinh lại mã PIN */}
              <button
                onClick={handleRegenerate}
                disabled={isRotating}
                className={`p-2 rounded-lg border border-[#3F3F46] hover:border-gold/50 bg-[#1F1F23] hover:bg-[#27272A] text-[#EDEDED] transition-colors ${
                  isRotating ? 'animate-spin text-gold' : ''
                }`}
                title="Đổi mã PIN mới (Vô hiệu hóa phiên cũ để chống quét phá)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chỉ số thiết bị đang kết nối */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#8E8E93]">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                Thiết bị kết nối:{' '}
                <strong className="text-[#EDEDED] font-mono">
                  {table.activeDeviceCount || 0}
                </strong>{' '}
                / {table.maxActiveDevices || 6}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer Action Controls */}
      <div className="pt-3 border-t border-[#27272A] flex items-center justify-between gap-2 mt-2">
        {/* Đổi trạng thái nhanh */}
        <select
          value={table.status}
          onChange={(e) => onUpdateStatus(table.id, e.target.value)}
          className="flex-1 min-w-0 bg-[#121214] border border-[#3F3F46] text-[#EDEDED] text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-gold cursor-pointer truncate"
        >
          <option value="AVAILABLE">Trống (Sẵn sàng)</option>
          <option value="OCCUPIED">Có Khách</option>
          <option value="CLEANING">Dọn Dẹp</option>
        </select>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Nút Khóa / Mở Order */}
          <button
            onClick={() => onToggleLock(table.id)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors ${
              table.isOrderLocked
                ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                : 'border-[#3F3F46] hover:bg-[#27272A] text-[#8E8E93] hover:text-[#EDEDED]'
            }`}
            title={table.isOrderLocked ? 'Mở khóa order cho bàn này' : 'Khóa order khẩn cấp (khách không thể gửi đơn)'}
          >
            {table.isOrderLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Nút In Tem QR */}
          <button
            onClick={() => onOpenPrintModal(table)}
            className="px-2.5 py-1.5 rounded-lg bg-[#27272A] hover:bg-[#323238] border border-[#3F3F46] hover:border-gold/40 text-xs font-medium text-[#EDEDED] flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0"
            title="In tem QR để bàn"
          >
            <Printer className="w-3.5 h-3.5 text-gold" />
            <span>In Tem QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
