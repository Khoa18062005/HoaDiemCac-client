import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Clock,
  QrCode,
  Smartphone,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  UtensilsCrossed,
  ArrowLeftRight,
  Users2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { tableApi, getStoredTableSession, saveTableSession } from '@/features/tables/api/tableApi';
import { orderApi } from '@/features/customer/api/orderApi';
import { apiClient } from '@/lib/axios';
import { normalizeTableCode } from '@/stores/useKdsStore';
import { PaymentStepperModal } from '@/features/payment';

export function formatCurrencyVND(amount) {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export function formatNumberWithDots(val) {
  if (!val) return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(clean));
}

export const DEFAULT_MENU_ITEMS = [
  { name: 'Nước Lẩu Cà Chua Hoàng Gia', quantity: 1, price: 150000 },
  { name: 'Ba Chỉ Bò Mỹ Thượng Hạng', quantity: 2, price: 220000 },
  { name: 'Rau Nấm Thập Cẩm Cung Đình', quantity: 1, price: 110000 },
  { name: 'Mì Tươi Kéo Tay', quantity: 2, price: 35000 },
  { name: 'Trà Sâm Hạt Sen', quantity: 3, price: 40000 },
];

export function getDisplayTableName(table) {
  if (!table) return 'Bàn';
  const name = String(table.name || table.tableNumber || table.code || '').trim();
  if (!name) return 'Bàn';
  if (/^bàn/i.test(name)) return name;
  return `Bàn ${name}`;
}

export default function AdminTableDetailModal({
  table,
  orders = [],
  allTables = [],
  isOpen,
  onClose,
  onTableUpdated,
  onOptimisticUpdate,
  onOpenDevices,
  onOpenPrint,
}) {
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Danh sách các đợt order của bàn được tải trực tiếp theo thời gian thực
  const [localOrders, setLocalOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Modal Quy Trình Thanh Toán Thống Nhất 4 Bước (Payment Stepper Workflow)
  const [isPaymentStepperOpen, setIsPaymentStepperOpen] = useState(false);

  // Trạng thái Chuyển / Ghép bàn trực tiếp từ POS
  const [isDirectTransferOpen, setIsDirectTransferOpen] = useState(false);
  const [transferType, setTransferType] = useState('MOVE'); // 'MOVE' | 'MERGE'
  const [selectedTargetTableId, setSelectedTargetTableId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Trạng thái Cụm Bàn Tiệc Lớn (Master-Slave Table Clustering)
  const [isClusterOpen, setIsClusterOpen] = useState(false);
  const [selectedSlaveIds, setSelectedSlaveIds] = useState([]);

  // Tự động tải danh sách đợt order của bàn từ API khi mở modal
  const fetchOrdersForTable = useCallback(async () => {
    const tNum = table?.tableNumber || table?.code;
    if (!tNum) return;
    setLoadingOrders(true);
    try {
      const res = await orderApi.getTableOrders(tNum);
      const list = Array.isArray(res) ? res : (res ? [res] : []);
      setLocalOrders(list);
    } catch (err) {
      console.warn('Lỗi khi tải chi tiết đợt gọi món của bàn:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [table?.tableNumber, table?.code]);

  useEffect(() => {
    if (isOpen && table) {
      fetchOrdersForTable();
    } else {
      // Reset các trạng thái popup khi đóng modal
      setIsPaymentStepperOpen(false);
      setIsDirectTransferOpen(false);
      setIsClusterOpen(false);
      setSelectedSlaveIds([]);
    }
  }, [isOpen, table?.id, table?.tableNumber, fetchOrdersForTable]);

  // Khóa cuộn trang nền khi mở modal để triệt tiêu re-render layout và giật lag chuột
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Trạng thái cục bộ phản hồi tức thì 0ms (Optimistic UI)
  const [currentStatus, setCurrentStatus] = useState(table?.status || 'AVAILABLE');
  useEffect(() => {
    if (table?.status && !actionLoading) {
      setCurrentStatus(table.status);
    }
  }, [table?.status, actionLoading]);

  if (!isOpen || !table) return null;

  // Hiển thị thông báo toast nhỏ trong modal
  const showFeedback = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Hợp nhất dữ liệu order: Ưu tiên localOrders vừa tải, fallback sang props orders
  const currentOrders = localOrders.length > 0 ? localOrders : (orders || []);
  const tableOrders = currentOrders.filter((o) => {
    const tNum = o.tableNumber || o.tableCode || '';
    const myNum = table.tableNumber || table.code || '';
    return (
      !tNum ||
      tNum.toLowerCase() === myNum.toLowerCase() ||
      String(o.tableId) === String(table.id)
    );
  });

  const rawItems = tableOrders.flatMap((o) => o.items || o.orderItems || []);
  // Nếu bàn đã có order thì dùng danh sách thực tế; nếu bàn chưa có món (bàn trống mới tạo) thì dùng danh mục món tiêu chuẩn
  const allItems = rawItems.length > 0
    ? rawItems
    : (Number(table.totalAmount || table.amount || 0) > 0
        ? [
            { name: 'Combo Đại Tiệc Lẩu Hoàng Gia', quantity: 1, price: Number(table.totalAmount || table.amount) }
          ]
        : DEFAULT_MENU_ITEMS);

  // Tính toán tiền:
  const computedSubtotal = allItems.reduce(
    (acc, item) => acc + (Number(item.totalPrice) || (Number(item.price) || 0) * (Number(item.quantity) || 1)),
    0
  );

  const subtotal = computedSubtotal > 0
    ? computedSubtotal
    : Number(table.totalAmount || table.amount || 0);

  const vat = Math.round(subtotal * 0.08);
  const finalTotal = subtotal + vat;

  // Đổi trạng thái bàn (AVAILABLE / OCCUPIED / CLEANING) với Optimistic UI (0ms)
  const handleChangeStatus = async (newStatus) => {
    if (currentStatus === newStatus) return;
    const previousStatus = currentStatus;

    setCurrentStatus(newStatus);
    if (onOptimisticUpdate) {
      onOptimisticUpdate(table.id, newStatus);
    }
    setActionLoading(`status_${newStatus}`);

    try {
      const res = await tableApi.updateTableStatus(table.id, newStatus);
      if (onTableUpdated) onTableUpdated(res);
    } catch (err) {
      setCurrentStatus(previousStatus);
      if (onOptimisticUpdate) {
        onOptimisticUpdate(table.id, previousStatus);
      }
      showFeedback('Lỗi khi đổi trạng thái: ' + (err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  // Sinh lại mã PIN
  const handleRegeneratePin = async () => {
    if (!window.confirm(`Sinh lại mã PIN 4 số mới cho bàn ${getDisplayTableName(table)}? Lượt khách hiện tại sẽ bị ngắt kết nối.`)) {
      return;
    }
    setActionLoading('pin');
    try {
      const res = await tableApi.regeneratePin(table.id);
      showFeedback(`Đã cấp mã PIN mới: ${res?.currentPasscode || 'Thành công'}`);
      if (onTableUpdated) onTableUpdated(res);
    } catch (err) {
      showFeedback('Lỗi khi sinh PIN: ' + (err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  // Đồng bộ trạng thái khóa order tới tất cả các tab và thiết bị
  const syncOrderLockState = (tableId, tableNumber, isLocked) => {
    const rawNum = tableNumber || '';
    const norm = rawNum.toUpperCase().trim();
    const kdsNorm = normalizeTableCode(rawNum);

    // 1. BroadcastChannel (đồng bộ các tab trên cùng máy)
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('hoadiemcat_table_sync');
        channel.postMessage({
          type: 'ORDER_LOCKED',
          tableId,
          tableNumber: norm,
          kdsTableCode: kdsNorm,
          isOrderLocked: isLocked,
          timestamp: Date.now(),
        });
        channel.close();
      }
    } catch {}

    // 2. CustomEvent & localStorage cho các tab
    try {
      window.dispatchEvent(
        new CustomEvent('table_order_locked', {
          detail: {
            tableId,
            tableNumber: norm,
            kdsTableCode: kdsNorm,
            isOrderLocked: isLocked,
          },
        })
      );
      const lockedTables = JSON.parse(localStorage.getItem('hoadiemcat_locked_tables') || '{}');
      if (isLocked) {
        lockedTables[norm] = true;
        lockedTables[kdsNorm] = true;
      } else {
        delete lockedTables[norm];
        delete lockedTables[kdsNorm];
      }
      localStorage.setItem('hoadiemcat_locked_tables', JSON.stringify(lockedTables));

      // Cập nhật session storage nếu đúng bàn
      const currentSession = getStoredTableSession();
      if (
        currentSession &&
        (currentSession.tableNumber === norm ||
          normalizeTableCode(currentSession.tableNumber) === kdsNorm ||
          String(currentSession.tableId) === String(tableId))
      ) {
        saveTableSession({ ...currentSession, isOrderLocked: isLocked });
      }
    } catch {}
  };

  // Khóa / Mở khóa gọi món khẩn cấp (Nút ngoài)
  const handleToggleOrderLock = async () => {
    setActionLoading('lock');
    const targetTableNum = table.tableNumber || table.code || '';
    const newLockState = !Boolean(table.isOrderLocked);
    table.isOrderLocked = newLockState;
    syncOrderLockState(table.id, targetTableNum, newLockState);

    try {
      const res = await tableApi.toggleOrderLock(table.id);
      const isLocked = res?.isOrderLocked !== undefined ? res.isOrderLocked : newLockState;
      table.isOrderLocked = isLocked;
      syncOrderLockState(table.id, targetTableNum, isLocked);
      showFeedback(isLocked ? 'Đã đóng và khóa gọi món cho bàn' : 'Đã mở khóa gọi món cho bàn');
      if (onTableUpdated) onTableUpdated();
    } catch (err) {
      showFeedback('Lỗi khi khóa/mở khóa: ' + (err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };


  // Thực hiện Chuyển hoặc Ghép bàn trực tiếp từ POS
  const handleDirectTransfer = async () => {
    if (!selectedTargetTableId) {
      showFeedback('Vui lòng chọn bàn đích!', true);
      return;
    }
    setActionLoading('transfer');
    try {
      const res = await tableApi.directTransfer(
        table.id,
        Number(selectedTargetTableId),
        transferType,
        transferReason || 'Nhân viên thực hiện trực tiếp trên POS'
      );
      showFeedback(res?.message || 'Chuyển bàn thành công!');
      setIsDirectTransferOpen(false);
      if (onTableUpdated) onTableUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      showFeedback('Lỗi chuyển bàn: ' + (err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  // Liên kết các bàn phụ vào Cụm bàn chính này
  const handleLinkCluster = async () => {
    if (selectedSlaveIds.length === 0) {
      showFeedback('Vui lòng chọn ít nhất 1 bàn phụ để liên kết!', true);
      return;
    }
    setActionLoading('cluster');
    try {
      const res = await tableApi.linkCluster(table.id, selectedSlaveIds);
      showFeedback(res?.message || 'Liên kết Cụm bàn tiệc thành công!');
      setIsClusterOpen(false);
      setSelectedSlaveIds([]);
      if (onTableUpdated) onTableUpdated();
    } catch (err) {
      showFeedback('Lỗi liên kết cụm: ' + (err.response?.data?.message || err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  // Tách bàn phụ ra khỏi Cụm bàn liên kết
  const handleUnlinkSlave = async (slaveTableId) => {
    setActionLoading('unlink_' + slaveTableId);
    try {
      const res = await tableApi.unlinkCluster(slaveTableId);
      showFeedback(res?.message || 'Đã tách bàn phụ ra khỏi cụm bàn!');
      if (onTableUpdated) onTableUpdated();
    } catch (err) {
      showFeedback('Lỗi khi tách bàn: ' + (err.response?.data?.message || err.message || ''), true);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {/* 1. Modal Chi Tiết Bàn Ăn Chính (Chỉ hiển thị khi chưa mở modal thanh toán) */}
      {!isPaymentStepperOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-[#141417] border border-surface-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transform-gpu">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#101012]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-gold shadow-inner">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {getDisplayTableName(table)}
                    </h3>
                    {table.isVip || table.area === 'VIP' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/40">
                        VIP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-elevated text-[#A0A0A5] border border-surface-border">
                        Khu Vực Chung
                      </span>
                    )}
                    <span className="text-xs text-[#8E8E93]">
                      • Sức chứa: {table.capacity || (table.isVip ? 10 : 4)} Khách
                    </span>
                    {table.timeSpent && (
                      <span className="text-xs text-gold flex items-center gap-1 font-medium">
                        • <Clock className="w-3 h-3 text-gold" /> {table.timeSpent}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Mã bàn hệ thống: <span className="font-mono text-white">{table.tableNumber || table.code}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Alert Toast */}
            {feedback && (
              <div
                className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 border-b ${
                  feedback.isError
                    ? 'bg-crimson/15 border-crimson/30 text-crimson-glow'
                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {feedback.isError ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{feedback.msg}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              {/* A. Trạng thái vận hành của bàn */}
              <div>
                <label className="text-xs font-semibold text-[#A0A0A5] uppercase tracking-wider block mb-2">
                  Trạng thái vận hành của bàn
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 select-none cursor-default transition-colors ${
                      currentStatus === 'AVAILABLE'
                        ? 'bg-jade/20 border-jade text-jade-bright shadow-sm'
                        : 'bg-[#141417] border-surface-border/40 text-[#8E8E93]/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus === 'AVAILABLE' ? 'bg-jade-bright' : 'bg-[#8E8E93]/30'}`} />
                    <span>Sẵn Sàng</span>
                  </div>

                  <div
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 select-none cursor-default transition-colors ${
                      currentStatus === 'OCCUPIED'
                        ? 'bg-crimson/20 border-crimson text-white shadow-sm'
                        : 'bg-[#141417] border-surface-border/40 text-[#8E8E93]/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus === 'OCCUPIED' ? 'bg-crimson-glow animate-pulse' : 'bg-[#8E8E93]/30'}`} />
                    <span>Đang Phục Vụ</span>
                  </div>

                  <div
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 select-none cursor-default transition-colors ${
                      currentStatus === 'CLEANING'
                        ? 'bg-amber/20 border-amber text-amber shadow-sm'
                        : 'bg-[#141417] border-surface-border/40 text-[#8E8E93]/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus === 'CLEANING' ? 'bg-amber animate-pulse' : 'bg-[#8E8E93]/30'}`} />
                    <span>Đang Dọn Dẹp</span>
                  </div>
                </div>
              </div>

              {/* B. Thông tin bảo mật PIN & Quản lý thiết bị */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PIN & Khóa gọi món */}
                <div className="bg-[#18181C] border border-surface-border rounded-xl pt-2 pb-3 px-3.5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between h-7">
                    <span className="text-xs text-[#A0A0A5] font-medium flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-gold" />
                      Mã PIN Gọi Món:
                    </span>
                    <span className="font-mono text-sm font-bold text-gold tracking-widest bg-gold/10 px-2.5 h-6 inline-flex items-center rounded border border-gold/20 leading-none">
                      {table.currentPasscode || '----'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoading === 'pin'}
                      onClick={handleRegeneratePin}
                      className="flex-1 h-8 rounded-lg bg-surface-card border border-surface-border hover:border-gold/40 text-xs text-[#EDEDED] hover:text-gold flex items-center justify-center gap-1.5 transition-colors"
                      title="Sinh lại mã PIN mới cho lượt khách mới"
                    >
                      <RefreshCw className={`w-3 h-3 ${actionLoading === 'pin' ? 'animate-spin' : ''}`} />
                      <span>Sinh PIN Mới</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading === 'lock'}
                      onClick={handleToggleOrderLock}
                      className={`flex-1 h-8 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        table.isOrderLocked
                          ? 'bg-crimson/20 border-crimson/50 text-crimson-glow hover:bg-crimson/30'
                          : 'bg-surface-card border-surface-border text-[#A0A0A5] hover:text-white'
                      }`}
                      title="Khóa/mở quyền đặt món khẩn cấp"
                    >
                      {table.isOrderLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{table.isOrderLocked ? 'Đang Khóa' : 'Khóa Order'}</span>
                    </button>
                  </div>
                </div>

                {/* Thiết bị & Standee QR */}
                <div className="bg-[#18181C] border border-surface-border rounded-xl pt-2 pb-3 px-3.5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between h-7">
                    <span className="text-xs text-[#A0A0A5] font-medium flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      Thiết bị kết nối:
                    </span>
                    <span className="text-xs font-bold text-white bg-blue-500/10 px-2.5 h-6 inline-flex items-center rounded border border-blue-500/20 leading-none">
                      {table.activeDeviceCount || 0} Thiết bị
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDevices && onOpenDevices(table)}
                      className="flex-1 h-8 rounded-lg bg-surface-card border border-surface-border hover:border-blue-400/40 text-xs text-[#EDEDED] hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Quản Lý Máy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPrint && onOpenPrint(table)}
                      className="flex-1 h-8 rounded-lg bg-surface-card border border-surface-border hover:border-gold/40 text-xs text-[#EDEDED] hover:text-gold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>In Mã QR</span>
                    </button>

                    {/* Nút Đổi / Ghép Bàn */}
                    {(currentStatus === 'OCCUPIED' || allItems.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDirectTransferOpen((prev) => !prev);
                          setIsClusterOpen(false);
                        }}
                        className={`flex-1 h-8 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                          isDirectTransferOpen
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-surface-card border-surface-border hover:border-amber-400/40 text-[#EDEDED] hover:text-amber-300'
                        }`}
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Đổi/Ghép</span>
                      </button>
                    )}

                    {/* Nút Cụm Bàn Tiệc (Master-Slave) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsClusterOpen((prev) => !prev);
                        setIsDirectTransferOpen(false);
                      }}
                      className={`flex-1 h-8 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        isClusterOpen
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-surface-card border-surface-border hover:border-purple-400/40 text-[#EDEDED] hover:text-purple-300'
                      }`}
                    >
                      <Users2 className="w-3 h-3" />
                      <span>{table.isLinked ? 'Cụm Bàn' : (table.isMaster ? 'Cụm Đang Ghép' : 'Tạo Cụm')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cụm Bàn Tiệc: Banner nếu là Bàn Phụ */}
              {table.isLinked && (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Users2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>Bàn phụ thuộc Cụm bàn chính: <strong>{table.masterTableNumber}</strong></span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Khách quét QR tại bàn này sẽ tự động gọi món vào bàn {table.masterTableNumber}.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading === 'unlink_' + table.id}
                    onClick={() => handleUnlinkSlave(table.id)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400 text-purple-200 text-xs font-semibold whitespace-nowrap transition-all"
                  >
                    {actionLoading === 'unlink_' + table.id ? 'Đang tách...' : 'Tách Khỏi Cụm'}
                  </button>
                </div>
              )}

              {/* Cụm Bàn Tiệc: Bảng điều khiển Quản Lý Cụm Bàn */}
              {isClusterOpen && !table.isLinked && (
                <div className="border border-purple-500/40 rounded-xl bg-purple-500/5 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users2 className="w-4 h-4" />
                      Liên Kết Cụm Bàn Tiệc Lớn (Master-Slave Clustering)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsClusterOpen(false)}
                      className="text-xs text-[#8E8E93] hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>

                  {table.linkedTableNumbers && table.linkedTableNumbers.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-purple-950/30 border border-purple-500/30">
                      <span className="text-xs font-semibold text-purple-300 block">Các bàn phụ đang ghép cùng bàn này:</span>
                      <div className="flex flex-wrap gap-2">
                        {table.linkedTableNumbers.map((tblNum) => {
                          const slaveTbl = allTables.find((t) => (t.tableNumber || t.code) === tblNum);
                          return (
                            <span
                              key={tblNum}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-900/60 border border-purple-400/50 text-purple-200 text-xs font-mono font-bold"
                            >
                              <span>Bàn {tblNum}</span>
                              {slaveTbl && (
                                <button
                                  type="button"
                                  title="Tách bàn này ra khỏi cụm"
                                  onClick={() => handleUnlinkSlave(slaveTbl.id)}
                                  className="hover:text-rose-400 ml-1 text-sm font-bold"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Chọn thêm bàn phụ để ghép vào cụm */}
                  <div className="space-y-2">
                    <label className="text-xs text-[#A0A0A5] block">
                      Chọn các bàn phụ muốn ghép cùng bàn này (Đoàn 20–50 người):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-lg bg-[#18181C] border border-surface-border custom-scrollbar">
                      {allTables
                        .filter((t) => String(t.id) !== String(table.id) && !t.isLinked)
                        .map((t) => {
                          const isChecked = selectedSlaveIds.includes(t.id);
                          return (
                            <label
                              key={t.id}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                                  : 'bg-surface-card border-surface-border text-zinc-300 hover:border-zinc-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSlaveIds((prev) => [...prev, t.id]);
                                  } else {
                                    setSelectedSlaveIds((prev) => prev.filter((id) => id !== t.id));
                                  }
                                }}
                                className="rounded text-purple-600 focus:ring-0"
                              />
                              <span className="font-mono font-bold">{t.tableNumber || t.code}</span>
                              <span className="text-[10px] text-zinc-400">({t.capacity || 4}k)</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading === 'cluster' || selectedSlaveIds.length === 0}
                    onClick={handleLinkCluster}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === 'cluster' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users2 className="w-4 h-4" />
                    )}
                    <span>Ghép {selectedSlaveIds.length} Bàn Vào Cụm {table.tableNumber || table.code}</span>
                  </button>
                </div>
              )}

              {/* C. Điều chuyển bàn (nếu bấm mở) */}
              {isDirectTransferOpen && (
                <div className="border border-amber-500/40 rounded-xl bg-amber-500/5 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowLeftRight className="w-4 h-4" />
                      Điều Chuyển Bàn Trực Tiếp (POS 1-Click)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDirectTransferOpen(false)}
                      className="text-xs text-[#8E8E93] hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferType('MOVE');
                        setSelectedTargetTableId('');
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        transferType === 'MOVE'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-surface-card border-surface-border text-[#8E8E93]'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Chuyển Bàn (Sang bàn trống)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTransferType('MERGE');
                        setSelectedTargetTableId('');
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        transferType === 'MERGE'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-surface-card border-surface-border text-[#8E8E93]'
                      }`}
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      <span>Ghép Bàn (Vào bàn đang ăn)</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#A0A0A5]">
                      Chọn bàn đích tiếp nhận:
                    </label>
                    <select
                      value={selectedTargetTableId}
                      onChange={(e) => setSelectedTargetTableId(e.target.value)}
                      className="w-full h-9 px-3 bg-[#1A1A1E] border border-surface-border rounded-lg text-xs text-white outline-none focus:border-amber-400"
                    >
                      <option value="">-- Chọn bàn đích ({transferType === 'MOVE' ? 'Bàn trống' : 'Bàn đang ăn'}) --</option>
                      {allTables
                        .filter((t) => {
                          if (String(t.id) === String(table.id)) return false;
                          if (transferType === 'MOVE') {
                            return t.status === 'AVAILABLE';
                          } else {
                            return t.status === 'OCCUPIED';
                          }
                        })
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {getDisplayTableName(t)} ({t.tableNumber}) - {t.status === 'AVAILABLE' ? 'Đang trống' : 'Đang có khách'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#A0A0A5]">
                      Ghi chú / Lý do điều chuyển (tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="VD: Đổi bàn rộng hơn, khách yêu cầu..."
                      className="w-full h-8 px-3 bg-[#1A1A1E] border border-surface-border rounded-lg text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading === 'transfer' || !selectedTargetTableId}
                    onClick={handleDirectTransfer}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === 'transfer' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Xác Nhận {transferType === 'MOVE' ? 'Chuyển Bàn' : 'Ghép Bàn'} Ngay</span>
                  </button>
                </div>
              )}

              {/* D. Nút Thao Tác Chính Tại Đáy: Chỉ hiện 1 button Thanh Toán khi bàn đang phục vụ */}
              <div className="pt-2">
                {currentStatus === 'OCCUPIED' ? (
                  <button
                    type="button"
                    onClick={() => setIsPaymentStepperOpen(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-sm shadow-lg shadow-gold/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Thanh Toán</span>
                  </button>
                ) : currentStatus === 'CLEANING' ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleChangeStatus('AVAILABLE')}
                    className="w-full py-3 rounded-xl bg-jade/20 border border-jade text-jade-bright hover:bg-jade/30 font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'status_AVAILABLE' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Xác Nhận Đã Dọn Xong</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleChangeStatus('OCCUPIED')}
                    className="w-full py-3 rounded-xl bg-crimson hover:bg-crimson/90 text-white font-bold text-sm shadow-md shadow-crimson/20 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'status_OCCUPIED' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UtensilsCrossed className="w-4 h-4" />
                    )}
                    <span>Mở Bàn Đón Khách Mới</span>
                  </button>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Quy Trình Thanh Toán Thống Nhất 4 Bước (Payment Stepper Workflow) */}
      {isPaymentStepperOpen && (
        <PaymentStepperModal
          isOpen={isPaymentStepperOpen}
          onClose={() => {
            setIsPaymentStepperOpen(false);
            if (currentStatus === 'CLEANING') {
              onClose();
            }
          }}
          table={table}
          allItems={allItems}
          subtotal={subtotal}
          vat={vat}
          finalTotal={finalTotal}
          loadingOrders={loadingOrders}
          onTableUpdated={onTableUpdated}
          onOptimisticUpdate={onOptimisticUpdate}
          syncOrderLockState={syncOrderLockState}
        />
      )}
    </>
  );
}
