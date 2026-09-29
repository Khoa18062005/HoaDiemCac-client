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
  ArrowLeft,
  Banknote,
  CreditCard,
  Radio,
  Wallet,
} from 'lucide-react';
import { tableApi, getStoredTableSession, saveTableSession } from '@/features/tables/api/tableApi';
import { orderApi } from '@/features/customer/api/orderApi';
import { apiClient } from '@/lib/axios';
import { saveInvoiceToHistory } from '@/features/invoices/api/invoiceApi';
import { normalizeTableCode } from '@/stores/useKdsStore';

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

  // Trạng thái các bước theo luồng nghiệp vụ mới:
  // Bước 1: Hộp thoại xác nhận mở hóa đơn tạm tính
  const [isConfirmFirstOpen, setIsConfirmFirstOpen] = useState(false);
  // Bước 2: Cửa sổ Hóa Đơn Tạm Tính
  const [isCheckoutBillOpen, setIsCheckoutBillOpen] = useState(false);
  // Bước 3: Cửa sổ Phương Thức Thanh Toán (Tiền mặt / Chuyển khoản VietQR)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // Bước 3.1: Hộp thoại xác nhận thanh toán lần nữa
  const [isFinalPaymentConfirmOpen, setIsFinalPaymentConfirmOpen] = useState(false);
  // Bước 4: Trang hỏi có muốn in hóa đơn (đã thanh toán) hay không
  const [isPrintInvoicePromptOpen, setIsPrintInvoicePromptOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER'
  const [cashReceived, setCashReceived] = useState('');
  // Trạng thái tín hiệu từ bên thứ ba cho chuyển khoản ('WAITING' | 'RECEIVED')
  const [thirdPartySignalStatus, setThirdPartySignalStatus] = useState('WAITING');

  // Mã hóa đơn thống nhất toàn hệ thống
  const [currentInvoiceCode, setCurrentInvoiceCode] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);

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
      const today = new Date();
      const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const rand = String(Math.floor(1000 + Math.random() * 9000));
      setCurrentInvoiceCode(`HD-${ymd}-${rand}`);
    } else {
      // Reset các trạng thái popup khi đóng modal
      setIsConfirmFirstOpen(false);
      setIsCheckoutBillOpen(false);
      setIsPaymentModalOpen(false);
      setIsFinalPaymentConfirmOpen(false);
      setIsPrintInvoicePromptOpen(false);
      setPaymentMethod('CASH');
      setCashReceived('');
      setThirdPartySignalStatus('WAITING');
      setIsDirectTransferOpen(false);
      setIsClusterOpen(false);
      setSelectedSlaveIds([]);
      setCompletedInvoice(null);
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

  // Tiền khách đưa & tiền thừa
  const numCashReceived = Number(cashReceived) || 0;
  const cashChange = Math.max(0, numCashReceived - finalTotal);

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
      if (onTableUpdated) onTableUpdated();
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

  // Khi nhân viên bấm [Xác Nhận] xem hóa đơn tạm tính:
  // Ngay lập tức đóng order của khách hàng và phía màn hình của khách rơi vào trạng thái đóng băng!
  const handleConfirmViewTempInvoice = async () => {
    // 1. Chuyển sang cửa sổ xem Hóa đơn tạm tính
    setIsConfirmFirstOpen(false);
    setIsCheckoutBillOpen(true);

    const targetTableNum = table.tableNumber || table.code || '';

    // 2. Phản hồi 0ms (Optimistic UI): Đóng và khóa order ngay lập tức
    table.isOrderLocked = true;
    syncOrderLockState(table.id, targetTableNum, true);
    showFeedback(`Đã đóng order bàn ${getDisplayTableName(table)}. Màn hình khách đã được đóng băng.`);

    // 3. Gọi API Backend để chốt khóa order trong Database và phát WebSocket tới mọi client
    try {
      await tableApi.setOrderLock(table.id, true);
    } catch (err) {
      console.warn('Lỗi gọi setOrderLock từ server:', err);
    }

    if (onTableUpdated) {
      onTableUpdated();
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

  // Hoàn tất thanh toán lần cuối: Bàn ngay lập tức chuyển sang CLEANING (0ms Optimistic UI)
  // Sau đó chuyển sang màn hình hỏi có in hóa đơn đã thanh toán hay không
  const handleConfirmFinalPayment = async () => {
    setActionLoading('settle');

    // 1. Phản hồi giao diện tức thì 0ms (Optimistic UI)
    if (onOptimisticUpdate) {
      onOptimisticUpdate(table.id, 'CLEANING');
    }
    setCurrentStatus('CLEANING');

    // Tạo đối tượng hóa đơn hoàn chỉnh để ghi nhận lịch sử toàn hệ thống
    const completedInvoiceData = {
      id: Date.now(),
      invoiceCode: currentInvoiceCode,
      tableId: table.id,
      tableNumber: table.tableNumber || table.code || 'B01',
      tableName: getDisplayTableName(table),
      subtotal: subtotal,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 8,
      taxAmount: vat,
      finalAmount: finalTotal,
      paymentMethod: paymentMethod === 'TRANSFER' ? 'VIETQR' : 'CASH',
      paymentStatus: 'PAID',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      cashierName: 'Quản Trị Viên',
      cashReceived: paymentMethod === 'CASH' && numCashReceived ? numCashReceived : (paymentMethod === 'CASH' ? finalTotal : null),
      cashChange: paymentMethod === 'CASH' ? cashChange : null,
      transactionRef: paymentMethod === 'TRANSFER' ? `VQR${Date.now()}` : null,
      isPrinted: true,
      items: allItems.map((item) => ({
        name: item.name || item.dishName || 'Món ăn',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || ((Number(item.totalPrice) || 0) / (Number(item.quantity) || 1)) || 0,
      })),
    };

    setCompletedInvoice(completedInvoiceData);
    saveInvoiceToHistory(completedInvoiceData);

    // Chuyển cửa sổ từ xác nhận sang cửa sổ hỏi in hóa đơn đã thanh toán
    setIsFinalPaymentConfirmOpen(false);
    setIsPaymentModalOpen(false);
    setIsCheckoutBillOpen(false);
    setIsConfirmFirstOpen(false);
    setIsPrintInvoicePromptOpen(true);

    // 2. Chạy API thanh toán & giải phóng phiên bàn ngầm ở backend
    const apiMethod = paymentMethod === 'TRANSFER' ? 'VIETQR' : 'CASH';
    try {
      await apiClient.post(
        `/admin/invoices/${table.id}/settle?method=${apiMethod}${
          paymentMethod === 'CASH' && numCashReceived ? `&cashReceived=${numCashReceived}` : ''
        }`
      );
    } catch (err) {
      console.warn('Lỗi khi gọi API settle hóa đơn, thực hiện fallback đổi status sang CLEANING:', err);
      try {
        await tableApi.updateTableStatus(table.id, 'CLEANING');
      } catch (e) {
        console.error('Không thể cập nhật trạng thái bàn:', e);
      }
    } finally {
      setActionLoading(null);
    }

    // 3. Kích hoạt cập nhật lại danh sách bàn
    if (onTableUpdated) {
      onTableUpdated();
    }
  };

  // Tiêu đề phiếu in nhiệt tùy theo màn hình hiện tại
  const receiptTitle = isPrintInvoicePromptOpen
    ? 'HÓA ĐƠN THANH TOÁN (ĐÃ THANH TOÁN)'
    : isPaymentModalOpen
    ? 'HÓA ĐƠN THANH TOÁN'
    : 'PHIẾU TẠM TÍNH';

  return (
    <>
      {/* 1. Modal Chi Tiết Bàn Ăn Chính (Chỉ hiển thị khi chưa mở các popup/modal thanh toán) */}
      {!isCheckoutBillOpen && !isConfirmFirstOpen && !isPaymentModalOpen && !isFinalPaymentConfirmOpen && !isPrintInvoicePromptOpen && (
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
                    onClick={() => setIsConfirmFirstOpen(true)}
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

      {/* 2. Thông Báo Xác Nhận Lần 1: Mở Hóa Đơn Tạm Tính */}
      {isConfirmFirstOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
          <div className="relative bg-[#16161A] border border-gold/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scaleUp overflow-hidden transform-gpu">
            {/* Tia sáng vàng hoàng gia đỉnh modal */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
            {/* Vầng hào quang mờ */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

            {/* Icon trung tâm */}
            <div className="flex flex-col items-center text-center space-y-3 pt-1">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 via-gold/15 to-transparent border border-gold/40 flex items-center justify-center text-gold shadow-lg shadow-gold/15 ring-4 ring-gold/10">
                <Receipt className="w-8 h-8 text-gold drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/30 border border-gold/50 text-gold flex items-center justify-center text-[10px]">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <div>
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-gold/15 text-gold border border-gold/30 uppercase tracking-widest mb-1.5">
                  {getDisplayTableName(table)}
                </span>
                <h4 className="text-lg font-bold text-white tracking-wide">
                  Xác Nhận Xem Hóa Đơn Tạm Tính
                </h4>
                <p className="text-xs text-[#A0A0A5] max-w-xs mx-auto mt-1 leading-relaxed">
                  Bạn có muốn mở danh sách món ăn và kiểm tra hóa đơn tạm tính cho <span className="text-white font-semibold">{getDisplayTableName(table)}</span> không?
                </p>
              </div>
            </div>

            {/* Thẻ tóm tắt thông tin bàn & món ăn */}
            <div className="bg-[#101012] border border-surface-border rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-[#A0A0A5]">
                  <Clock className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#8E8E93]">Thời gian phục vụ</p>
                  <p className="font-semibold text-white">{table.timeSpent || 'Đang phục vụ'}</p>
                </div>
              </div>

              <div className="h-7 w-px bg-surface-border" />

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-[#8E8E93]">Tổng tạm tính ({allItems.length} món)</p>
                <p className="font-mono font-extrabold text-gold text-sm">
                  {formatCurrencyVND(finalTotal)}
                </p>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmFirstOpen(false)}
                className="h-11 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-[#EDEDED] hover:text-white font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmViewTempInvoice}
                className="h-11 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-gold/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <span>Xác Nhận</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Cửa Sổ Hóa Đơn Tạm Tính (Có nút [In Hóa Đơn] và [Phương Thức Thanh Toán]) */}
      {isCheckoutBillOpen && !isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
          <div className="bg-[#141417] border border-surface-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transform-gpu">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#101012]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                    <span>Hóa Đơn Tạm Tính – {getDisplayTableName(table)}</span>
                    {table.isVip && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/40">
                        VIP
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Mã bàn: <span className="font-mono text-white">{table.tableNumber || table.code}</span>
                    {table.timeSpent && ` • Thời gian: ${table.timeSpent}`}
                    {` • ${allItems.length} món ăn`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckoutBillOpen(false)}
                className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              {/* Bảng Danh Sách Các Món Ăn: STT, Tên món, Số lượng, Đơn giá, Thành tiền */}
              <div className="overflow-hidden rounded-xl border border-surface-border/80 bg-[#101012]">
                <table className="w-full text-left text-xs table-fixed border-collapse">
                  <thead className="bg-[#18181C] text-[#A0A0A5] uppercase text-[11px] font-bold tracking-wider border-b border-surface-border select-none">
                    <tr>
                      <th className="py-3.5 px-3 text-center w-[8%] whitespace-nowrap">STT</th>
                      <th className="py-3.5 px-4 w-[38%]">Tên Món</th>
                      <th className="py-3.5 px-3 text-center w-[15%] whitespace-nowrap">Số Lượng</th>
                      <th className="py-3.5 px-3 text-right w-[18%] whitespace-nowrap">Đơn Giá</th>
                      <th className="py-3.5 px-4 text-right w-[21%] whitespace-nowrap">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50 text-[#EDEDED]">
                    {loadingOrders && allItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#8E8E93]">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                            <span>Đang tải danh sách món ăn từ bàn...</span>
                          </div>
                        </td>
                      </tr>
                    ) : allItems.length > 0 ? (
                      allItems.map((item, idx) => {
                        const qty = Number(item.quantity) || 1;
                        const unitPrice = Number(item.price) || 0;
                        const itemTotal = Number(item.totalPrice) || (unitPrice * qty);
                        return (
                          <tr key={item.id || idx} className="hover:bg-surface-card/40 transition-colors">
                            <td className="py-3.5 px-3 text-center w-[8%] whitespace-nowrap font-mono text-xs text-[#8E8E93] font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 w-[38%] font-medium text-white">
                              <p className="font-semibold text-white leading-snug line-clamp-2" title={item.name || item.dishName}>
                                {item.name || item.dishName || `Món ăn #${idx + 1}`}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 text-center w-[15%] whitespace-nowrap">
                              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md bg-surface-elevated border border-surface-border font-bold text-gold text-xs">
                                {qty}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#D0D0D5] w-[18%] whitespace-nowrap">
                              {formatCurrencyVND(unitPrice)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-extrabold text-white w-[21%] whitespace-nowrap">
                              {formatCurrencyVND(itemTotal)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#8E8E93] italic">
                          {subtotal > 0
                            ? `Đơn hàng đang có tổng tiền ${formatCurrencyVND(subtotal)} (chi tiết món đang cập nhật)`
                            : 'Bàn chưa có món ăn nào được ghi nhận.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bảng Tổng Hợp Tài Chính: Tạm tính, VAT, Tổng tiền */}
              <div className="bg-[#18181C] border border-surface-border rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#A0A0A5]">
                  <span>Tạm tính (tiền chưa VAT):</span>
                  <span className="font-mono text-white font-medium">{formatCurrencyVND(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A0A0A5]">
                  <span>Thuế VAT (8%):</span>
                  <span className="font-mono text-purple-400 font-medium">+{formatCurrencyVND(vat)}</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-surface-border text-sm">
                  <span className="font-bold text-white uppercase tracking-wider">Tổng Tiền Thanh Toán:</span>
                  <span className="font-mono text-xl font-extrabold text-gold tracking-tight">
                    {formatCurrencyVND(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: 2 button nằm cuối cùng là [In Hóa Đơn] và [Phương Thức Thanh Toán] theo yêu cầu */}
            <div className="px-6 py-4 border-t border-surface-border bg-[#101012] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold font-bold text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>In Hóa Đơn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCheckoutBillOpen(false);
                  setIsPaymentModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-gold/20 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Wallet className="w-4 h-4" />
                <span>Phương Thức Thanh Toán</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cửa Sổ Giao Diện Phương Thức Thanh Toán (Tiền Mặt hoặc Chuyển Khoản; Có Chờ Tín Hiệu Bên Thứ Ba) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
          <div className="bg-[#141417] border border-surface-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transform-gpu">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#101012]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Phương Thức Thanh Toán – {getDisplayTableName(table)}
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-0.5">
                    Mã bàn: <span className="font-mono text-white">{table.tableNumber || table.code}</span>
                    {table.timeSpent && ` • ${table.timeSpent}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setIsCheckoutBillOpen(true);
                  }}
                  className="px-3 py-1 rounded-lg text-xs text-gold hover:bg-gold/10 border border-gold/20 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại tạm tính</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setIsCheckoutBillOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              {/* Banner tổng số tiền cần thanh toán */}
              <div className="bg-[#18181C] border border-surface-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#A0A0A5] block">Tổng số tiền cần thanh toán:</span>
                  <span className="text-xs text-[#8E8E93] mt-0.5 block">{allItems.length} món ăn (Đã gồm 8% VAT)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-black text-gold tracking-tight">
                    {formatCurrencyVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Tabs lựa chọn Phương thức thanh toán: Tiền mặt vs Chuyển khoản */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-gold/20 border-gold text-gold shadow-md shadow-gold/10'
                      : 'bg-[#18181C] border-surface-border text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tiền Mặt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2.5 transition-all ${
                    paymentMethod === 'TRANSFER'
                      ? 'bg-gold/20 border-gold text-gold shadow-md shadow-gold/10'
                      : 'bg-[#18181C] border-surface-border text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Chuyển Khoản (VietQR)</span>
                </button>
              </div>

              {/* Nội dung 1: Thanh toán TIỀN MẶT */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Nhập tiền khách đưa & tiền thừa (tự động phân cách dấu chấm ví dụ 1.000.000, không có số mặc định) */}
                  <div className="bg-[#101012] border border-surface-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A0A0A5] font-medium">Tiền khách đưa:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={cashReceived ? formatNumberWithDots(cashReceived) : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setCashReceived(raw);
                          }}
                          className="w-44 px-3 py-1.5 bg-surface-card border border-surface-border rounded-lg text-right font-mono text-white text-xs outline-none focus:border-gold"
                        />
                        <span className="font-mono text-xs text-[#8E8E93]">₫</span>
                      </div>
                    </div>

                    {/* Nút bấm chọn nhanh tiền */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[11px] text-[#8E8E93]">Gợi ý:</span>
                      <button
                        type="button"
                        onClick={() => setCashReceived(String(finalTotal))}
                        className="px-2.5 py-1 rounded-md bg-surface-card border border-surface-border hover:border-gold/40 text-[11px] font-mono text-[#EDEDED] hover:text-gold transition-colors"
                      >
                        Đúng số tiền
                      </button>
                      {[
                        Math.ceil(finalTotal / 500000) * 500000,
                        Math.ceil(finalTotal / 100000) * 100000 + 100000,
                        2000000,
                      ]
                        .filter((amt, idx, arr) => amt > finalTotal && arr.indexOf(amt) === idx)
                        .slice(0, 3)
                        .map((quickAmt) => (
                          <button
                            key={quickAmt}
                            type="button"
                            onClick={() => setCashReceived(String(quickAmt))}
                            className="px-2.5 py-1 rounded-md bg-surface-card border border-surface-border hover:border-gold/40 text-[11px] font-mono text-[#EDEDED] hover:text-gold transition-colors"
                          >
                            {formatCurrencyVND(quickAmt)}
                          </button>
                        ))}
                    </div>

                    {numCashReceived > 0 && (
                      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-surface-border/50">
                        <span className="text-[#8E8E93]">Tiền thừa trả khách:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrencyVND(cashChange)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nội dung 2: Thanh toán CHUYỂN KHOẢN (VietQR) */}
              {paymentMethod === 'TRANSFER' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-[#101012] border border-surface-border rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                    <div className="p-2.5 bg-white rounded-xl shadow-lg flex-shrink-0">
                      <img
                        src={`https://img.vietqr.io/image/MB-0317892341-compact2.png?amount=${finalTotal}&addInfo=Thanh%20toan%20${table.tableNumber || table.code || 'B01'}`}
                        alt="VietQR Chuyển Khoản"
                        className="w-36 h-36 object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-2 text-xs flex-1 w-full">
                      <div className="flex items-center justify-between pb-1.5 border-b border-surface-border/60">
                        <span className="text-[#8E8E93]">Ngân hàng:</span>
                        <span className="font-bold text-white">MB Bank (Quân Đội)</span>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-surface-border/60">
                        <span className="text-[#8E8E93]">Số tài khoản:</span>
                        <span className="font-mono font-bold text-gold text-sm">0317892341</span>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-surface-border/60">
                        <span className="text-[#8E8E93]">Chủ tài khoản:</span>
                        <span className="font-bold text-white uppercase">NHA HANG HOA DIEM CAT</span>
                      </div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-surface-border/60">
                        <span className="text-[#8E8E93]">Số tiền:</span>
                        <span className="font-mono font-extrabold text-gold text-sm">{formatCurrencyVND(finalTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#8E8E93]">Nội dung CK:</span>
                        <span className="font-mono font-bold text-white bg-surface-card px-2 py-0.5 rounded border border-surface-border">
                          Thanh toan {table.tableNumber || table.code || 'B01'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tín hiệu giao dịch chuyển khoản / bên thứ ba (chỉ để lại bên chuyển khoản theo yêu cầu) */}
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider font-semibold text-[#A0A0A5] flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tín Hiệu Chuyển Khoản / Ngân Hàng Bên Thứ Ba</span>
                    </label>

                    {thirdPartySignalStatus === 'WAITING' ? (
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3.5 w-3.5 flex-shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                            </span>
                            <div>
                              <p className="text-xs font-bold text-amber-300">
                                Đang chờ tín hiệu nhận tiền từ ngân hàng...
                              </p>
                              <p className="text-[11px] text-[#A0A0A5] mt-0.5">
                                Hệ thống đang lắng nghe biến động số dư VietQR cho số tiền {formatCurrencyVND(finalTotal)}.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setThirdPartySignalStatus('RECEIVED')}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-black font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
                          >
                            Mô phỏng: Ngân hàng báo Có (OK)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between animate-fadeIn">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-400">
                              Đã nhận tín hiệu chuyển khoản thành công từ ngân hàng
                            </p>
                            <p className="text-[11px] text-[#A0A0A5] mt-0.5">
                              Ngân hàng MB Bank đã xác nhận nhận số tiền {formatCurrencyVND(finalTotal)} cho {getDisplayTableName(table)} hoàn tất.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setThirdPartySignalStatus('WAITING')}
                          className="text-[11px] text-[#8E8E93] hover:text-white underline transition-colors"
                        >
                          Đặt lại tín hiệu
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer: Xóa nút in hóa đơn ở mục này theo yêu cầu, chỉ còn nút [Xác Nhận Thanh Toán Hoàn Tất] */}
            <div className="px-6 py-4 border-t border-surface-border bg-[#101012] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setIsFinalPaymentConfirmOpen(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-gold/25 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Thanh Toán Hoàn Tất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Hộp Thoại Xác Nhận Thanh Toán Lần Nữa Theo Yêu Cầu */}
      {isFinalPaymentConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
          <div className="bg-[#18181C] border border-amber-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Xác Nhận Thanh Toán Lần Nữa
                </h3>
                <p className="text-xs text-[#A0A0A5] leading-relaxed">
                  Bạn có chắc chắn muốn hoàn tất thanh toán cho <span className="text-white font-semibold">{getDisplayTableName(table)}</span>?
                </p>
              </div>
            </div>

            {/* Chi tiết tóm tắt */}
            <div className="bg-[#101012] border border-surface-border rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#A0A0A5]">
                <span>Phương thức thanh toán:</span>
                <span className="text-white font-medium">
                  {paymentMethod === 'TRANSFER' ? 'Chuyển Khoản (VietQR)' : 'Tiền Mặt'}
                </span>
              </div>
              {paymentMethod === 'CASH' && numCashReceived > 0 && (
                <>
                  <div className="flex justify-between items-center text-[#A0A0A5]">
                    <span>Tiền khách đưa:</span>
                    <span className="font-mono text-white font-medium">{formatCurrencyVND(numCashReceived)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#A0A0A5]">
                    <span>Tiền thừa trả khách:</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatCurrencyVND(cashChange)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-surface-border/60">
                <span className="text-white font-bold uppercase text-[11px]">Tổng số tiền thu:</span>
                <span className="font-mono text-base font-extrabold text-gold">{formatCurrencyVND(finalTotal)}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8E8E93] italic bg-surface-card/40 p-2.5 rounded-lg border border-surface-border/40">
              * Lưu ý: Sau khi xác nhận, bàn sẽ ngay lập tức được chuyển sang trạng thái <b>Đang dọn dẹp</b>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsFinalPaymentConfirmOpen(false);
                  setIsPaymentModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-surface-border hover:bg-surface-elevated text-xs font-semibold text-[#A0A0A5] hover:text-white transition-colors"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={actionLoading === 'settle'}
                onClick={handleConfirmFinalPayment}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-gold/25 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading === 'settle' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Xác Nhận Thanh Toán</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Trang Hỏi Có Muốn In Hóa Đơn (Đã Thanh Toán) Hay Không - Form Đồng Nhất 100% Với Chi Tiết Hóa Đơn */}
      {isPrintInvoicePromptOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gold" />
                <h3 className="font-semibold text-[#EDEDED] text-sm tracking-wide">
                  Chi Tiết Hóa Đơn • {currentInvoiceCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPrintInvoicePromptOpen(false);
                  onClose();
                }}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-[#EDEDED] hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông báo thanh toán thành công */}
            <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-center">
              <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Thanh toán thành công cho {getDisplayTableName(table)} & Đã lưu vào lịch sử!</span>
              </p>
            </div>

            {/* 80mm Thermal Receipt View Preview Đồng Nhất Với Form Hệ Thống */}
            <div className="p-6 bg-[#0E0E10] overflow-y-auto max-h-[60vh] flex justify-center items-start custom-scrollbar">
              <div className="w-[340px] h-fit min-h-fit bg-white text-black p-5 rounded-lg shadow-xl font-mono text-xs border border-gray-200 flex-shrink-0">
                {/* Logo & Header */}
                <div className="text-center pb-3 border-b border-dashed border-gray-400">
                  <p className="font-bold text-base tracking-wider uppercase">HỎA DIỆM CÁC</p>
                  <p className="text-[10px] text-gray-600">Đệ Nhất Lẩu Hoàng Gia</p>
                  <p className="text-[10px] text-gray-500">128 Nguyễn Đình Chiểu, P. Đa Kao, Q.1, TP.HCM</p>
                  <p className="text-[10px] text-gray-500">Hotline: 1900 8899 • MST: 0317892341</p>
                  <h2 className="font-bold text-sm mt-2 uppercase tracking-wide">PHIẾU THANH TOÁN</h2>
                </div>

                {/* Thông tin bàn & thời gian */}
                <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Số HĐ:</span>
                    <strong className="font-bold">{currentInvoiceCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Bàn phục vụ:</span>
                    <strong className="font-bold">{getDisplayTableName(table)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian:</span>
                    <span>
                      {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thu ngân:</span>
                    <span>Quản Trị Viên</span>
                  </div>
                </div>

                {/* Bảng Món Ăn (grid 12 cột chuẩn form) */}
                <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px]">
                  <div className="grid grid-cols-12 font-bold pb-1 text-gray-700 border-b border-gray-200">
                    <span className="col-span-6">Tên món</span>
                    <span className="col-span-2 text-center">SL</span>
                    <span className="col-span-4 text-right">T.Tiền</span>
                  </div>
                  <div className="pt-2 space-y-2">
                    {allItems.map((item, idx) => {
                      const qty = Number(item.quantity) || 1;
                      const price = Number(item.price) || 0;
                      const itemTotal = Number(item.totalPrice) || (price * qty);
                      return (
                        <div key={idx} className="grid grid-cols-12 leading-tight">
                          <span className="col-span-6 font-medium text-gray-900">{item.name || item.dishName}</span>
                          <span className="col-span-2 text-center text-gray-600">{qty}</span>
                          <span className="col-span-4 text-right font-semibold">
                            {new Intl.NumberFormat('vi-VN').format(itemTotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chi tiết tính tiền */}
                <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span>{formatCurrencyVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Thuế VAT (8%):</span>
                    <span>+{formatCurrencyVND(vat)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
                    <span className="uppercase">TỔNG THANH TOÁN:</span>
                    <span className="text-red-700 font-extrabold">{formatCurrencyVND(finalTotal)}</span>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Phương thức:</span>
                    <strong className="uppercase">
                      {paymentMethod === 'TRANSFER' ? 'Chuyển Khoản VietQR' : 'Tiền Mặt'}
                    </strong>
                  </div>
                  {paymentMethod === 'CASH' && numCashReceived > 0 && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>Tiền khách đưa:</span>
                        <span>{formatCurrencyVND(numCashReceived)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tiền thối lại:</span>
                        <span>{formatCurrencyVND(cashChange)}</span>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'TRANSFER' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Mã GD VietQR:</span>
                      <span className="font-mono">VQR{table.tableNumber || table.code || '98234120'}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-0.5">
                    <span>Trạng thái:</span>
                    <strong className="text-emerald-700 uppercase">[ ĐÃ THANH TOÁN ]</strong>
                  </div>
                </div>

                {/* Lời Cảm Ơn */}
                <div className="pt-3 text-center text-[10px] text-gray-600 space-y-1">
                  <p className="font-semibold italic">Trân trọng cảm ơn quý khách!</p>
                  <p>Hẹn gặp lại quý khách tại Hỏa Diệm Các!</p>
                  <p className="text-[9px] text-gray-400">Hệ thống quản lý bán hàng Hỏa Diệm Các POS</p>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="px-6 py-4 border-t border-[#27272A] bg-[#121214] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPrintInvoicePromptOpen(false);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl border border-[#3F3F46] hover:bg-[#27272A] text-xs font-medium text-[#A0A0A5] hover:text-white transition-colors"
              >
                Đóng / Trở Về
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsPrintInvoicePromptOpen(false);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-crimson to-[#B91C1C] hover:from-[#B91C1C] hover:to-crimson text-white text-xs font-semibold shadow-lg shadow-crimson/20 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu Tính Tiền (80mm)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bản In Hóa Đơn Nhiệt 80mm Khổ K80 (Đồng nhất 100% với form chuẩn hệ thống) */}
      <div id="printable-bill" className="hidden print:block font-mono text-black text-xs leading-normal">
        <div className="w-[340px] mx-auto bg-white text-black p-4 font-mono text-xs">
          {/* Logo & Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-400">
            <p className="font-bold text-base tracking-wider uppercase">HỎA DIỆM CÁC</p>
            <p className="text-[10px] text-gray-600">Đệ Nhất Lẩu Hoàng Gia</p>
            <p className="text-[10px] text-gray-500">128 Nguyễn Đình Chiểu, P. Đa Kao, Q.1, TP.HCM</p>
            <p className="text-[10px] text-gray-500">Hotline: 1900 8899 • MST: 0317892341</p>
            <h2 className="font-bold text-sm mt-2 uppercase tracking-wide">
              {isPrintInvoicePromptOpen ? 'PHIẾU THANH TOÁN' : 'PHIẾU TẠM TÍNH'}
            </h2>
          </div>

          {/* Thông tin bàn & thời gian */}
          <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Số HĐ:</span>
              <strong className="font-bold">{currentInvoiceCode}</strong>
            </div>
            <div className="flex justify-between">
              <span>Bàn phục vụ:</span>
              <strong className="font-bold">{getDisplayTableName(table)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Thu ngân:</span>
              <span>Quản Trị Viên</span>
            </div>
          </div>

          {/* Bảng Món Ăn (grid 12 cột chuẩn form) */}
          <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px]">
            <div className="grid grid-cols-12 font-bold pb-1 text-gray-700 border-b border-gray-200">
              <span className="col-span-6">Tên món</span>
              <span className="col-span-2 text-center">SL</span>
              <span className="col-span-4 text-right">T.Tiền</span>
            </div>
            <div className="pt-2 space-y-2">
              {allItems.map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const itemTotal = Number(item.totalPrice) || (price * qty);
                return (
                  <div key={idx} className="grid grid-cols-12 leading-tight">
                    <span className="col-span-6 font-medium text-gray-900">{item.name || item.dishName}</span>
                    <span className="col-span-2 text-center text-gray-600">{qty}</span>
                    <span className="col-span-4 text-right font-semibold">
                      {new Intl.NumberFormat('vi-VN').format(itemTotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chi tiết tính tiền */}
          <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm tính:</span>
              <span>{formatCurrencyVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Thuế VAT (8%):</span>
              <span>+{formatCurrencyVND(vat)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
              <span className="uppercase">TỔNG THANH TOÁN:</span>
              <span className="text-red-700 font-extrabold">{formatCurrencyVND(finalTotal)}</span>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Phương thức:</span>
              <strong className="uppercase">
                {paymentMethod === 'TRANSFER' ? 'Chuyển Khoản VietQR' : 'Tiền Mặt'}
              </strong>
            </div>
            {paymentMethod === 'CASH' && numCashReceived > 0 && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Tiền khách đưa:</span>
                  <span>{formatCurrencyVND(numCashReceived)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tiền thối lại:</span>
                  <span>{formatCurrencyVND(cashChange)}</span>
                </div>
              </>
            )}
            {paymentMethod === 'TRANSFER' && (
              <div className="flex justify-between text-gray-600">
                <span>Mã GD VietQR:</span>
                <span className="font-mono">VQR{table.tableNumber || table.code || '98234120'}</span>
              </div>
            )}
            <div className="flex justify-between pt-0.5">
              <span>Trạng thái:</span>
              <strong className={isPrintInvoicePromptOpen ? 'text-emerald-700 uppercase' : 'text-amber-700 uppercase'}>
                {isPrintInvoicePromptOpen ? '[ ĐÃ THANH TOÁN ]' : '[ TẠM TÍNH ]'}
              </strong>
            </div>
          </div>

          {/* Lời Cảm Ơn */}
          <div className="pt-3 text-center text-[10px] text-gray-600 space-y-1">
            <p className="font-semibold italic">Trân trọng cảm ơn quý khách!</p>
            <p>Hẹn gặp lại quý khách tại Hỏa Diệm Các!</p>
            <p className="text-[9px] text-gray-400">Hệ thống quản lý bán hàng Hỏa Diệm Các POS</p>
          </div>
        </div>
      </div>
    </>
  );
}
