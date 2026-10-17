import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  X,
  UtensilsCrossed,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  Check,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  ShoppingCart,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { orderApi } from '@/features/customer/api/orderApi';
import { wsManager } from '@/lib/websocket';

// Hook tối ưu tốc độ cuộn chuột (Mouse Wheel Booster) cho danh sách trong modal
function useFastWheelScroll(speedMultiplier = 2.0) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (el.scrollHeight <= el.clientHeight) return;

      const delta = e.deltaY;
      const canScrollDown = delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      const canScrollUp = delta < 0 && el.scrollTop > 1;

      if (canScrollDown || canScrollUp) {
        e.preventDefault();
        const factor = Math.abs(delta) >= 40 ? speedMultiplier : 1.3;
        el.scrollTop += delta * factor;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [speedMultiplier]);

  return containerRef;
}

// Chuẩn hóa tên hiển thị bàn
function getDisplayTableName(table) {
  if (!table) return 'Bàn';
  if (table.name && !table.name.toLowerCase().startsWith('bàn bàn')) {
    return table.name;
  }
  const rawNum = table.tableNumber || table.code || '';
  const numOnly = rawNum.replace(/\D/g, '');
  return numOnly ? `Bàn ${numOnly}` : `Bàn ${rawNum}`;
}

// Format giá tiền VND
function formatCurrency(amount) {
  return (Number(amount) || 0).toLocaleString('vi-VN') + ' đ';
}

const QUICK_CANCEL_REASONS = [
  'Khách chờ lâu muốn hủy món',
  'Bếp hết nguyên liệu đột xuất',
  'Khách gọi nhầm / đổi món khác',
  'Món lên trễ khách đã dùng xong',
];

export default function AdminOrderAdjustmentModal({
  isOpen,
  onClose,
  table,
  onOrderChanged,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Ref lưu danh sách orders mới nhất để callback WebSocket luôn đọc được mà không re-subscribe effect
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // State chỉnh sửa ghi chú inline: { [itemId]: newNote }
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  // State dialog xác nhận hủy món
  const [cancellingItem, setCancellingItem] = useState(null); // item object
  const [cancelReason, setCancelReason] = useState(QUICK_CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const tableIdentifier = table?.tableNumber || table?.code || table?.id;

  // Refs tăng tốc độ cuộn chuột (Mouse Wheel Booster)
  const orderListScrollRef = useFastWheelScroll(2.0);
  const reasonsScrollRef = useFastWheelScroll(1.8);

  // Hiển thị feedback nhanh
  const showFeedback = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Quản lý trạng thái nạp dữ liệu: Chỉ hiển thị spinner ở LẦN MỞ ĐẦU TIÊN
  const isInitialLoadRef = useRef(true);
  const syncTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      isInitialLoadRef.current = true;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    }
  }, [isOpen]);

  // Tải danh sách đơn hàng của bàn (hoàn toàn êm dịu, không giật lag)
  const fetchTableOrders = useCallback(async (showSpinner = false) => {
    if (!tableIdentifier) return;
    if (showSpinner && isInitialLoadRef.current) {
      setLoading(true);
    }
    try {
      const res = await orderApi.getAdminTableOrders(tableIdentifier);
      const list = Array.isArray(res) ? res : (res ? [res] : []);
      setOrders(list);
      isInitialLoadRef.current = false;
    } catch (err) {
      console.warn('Lỗi khi nạp danh sách order của bàn:', err);
    } finally {
      setLoading(false);
    }
  }, [tableIdentifier]);

  // Nạp dữ liệu khi mở modal & lắng nghe WebSocket realtime êm ái
  useEffect(() => {
    if (!isOpen || !tableIdentifier) return;

    // 1. Tải dữ liệu ban đầu
    fetchTableOrders(true);

    const tableNum = (table?.tableNumber || '').toString().trim();
    const tableName = (table?.name || '').toString().trim();
    const tableCode = (table?.code || '').toString().trim();
    const tableIdStr = table?.id ? String(table.id) : '';

    // Hàm đồng bộ ngầm debounced 300ms, không gây re-render giật UI
    const triggerSync = () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        fetchTableOrders(false);
      }, 300);
    };

    // Callback xử lý tín hiệu trực tiếp từ topic của bàn
    const handleDirectTableEvent = (payload) => {
      if (!payload) return;
      triggerSync();
    };

    // Callback xử lý tín hiệu từ KDS/Bếp và Phục Vụ (chuyển trạng thái nấu, chờ phục vụ, đã phục vụ, gửi order mới)
    const handleKitchenWaiterEvent = (payload) => {
      if (!payload) return;

      // 1. Nếu payload chứa orderId trùng với các đơn hàng hiện có của bàn
      if (payload.orderId && ordersRef.current.some((o) => o.id === payload.orderId || String(o.id) === String(payload.orderId))) {
        triggerSync();
        return;
      }

      // 2. Nếu payload chứa thông tin bàn đích
      const pTable = (payload.affectedTable || payload.affectedTableCode || payload.tableName || payload.tableNumber || '').toString().toUpperCase().trim();
      const pTableId = payload.tableId ? String(payload.tableId) : '';

      if (pTableId && tableIdStr && pTableId === tableIdStr) {
        triggerSync();
        return;
      }

      const idents = [tableNum, tableName, tableCode].filter(Boolean);
      const isMatch = idents.some((ident) => {
        const norm = ident.toUpperCase().trim();
        return pTable === norm || pTable.includes(norm) || norm.includes(pTable);
      });

      if (isMatch) {
        triggerSync();
      }
    };

    // Callback xử lý tín hiệu cập nhật bàn chung (/topic/tables)
    const handleTablesEvent = (tableUpdate) => {
      if (!tableUpdate) return;
      if (
        (tableUpdate.id && String(tableUpdate.id) === tableIdStr) ||
        (tableUpdate.tableNumber && tableUpdate.tableNumber === tableNum)
      ) {
        triggerSync();
      }
    };

    // 2. Đăng ký các kênh WebSocket Realtime
    const unsubs = [];

    // A. Kênh riêng của bàn
    if (tableNum) {
      unsubs.push(wsManager.subscribe(`/topic/table/${tableNum}/status`, handleDirectTableEvent));
      unsubs.push(wsManager.subscribe(`/topic/table/${tableNum}/cart`, handleDirectTableEvent));
    }
    if (tableName && tableName !== tableNum) {
      unsubs.push(wsManager.subscribe(`/topic/table/${tableName}/status`, handleDirectTableEvent));
      unsubs.push(wsManager.subscribe(`/topic/table/${tableName}/cart`, handleDirectTableEvent));
    }
    if (tableCode && tableCode !== tableNum && tableCode !== tableName) {
      unsubs.push(wsManager.subscribe(`/topic/table/${tableCode}/status`, handleDirectTableEvent));
    }

    // B. Kênh Bếp (KDS) & Phục Vụ: Bắt chuyển trạng thái món (chờ phục vụ, đã phục vụ, hủy món, gửi món mới)
    unsubs.push(wsManager.subscribe('/topic/kitchen/orders', handleKitchenWaiterEvent));
    unsubs.push(wsManager.subscribe('/topic/waiter/orders', handleKitchenWaiterEvent));

    // C. Kênh thông tin bàn
    unsubs.push(wsManager.subscribe('/topic/tables', handleTablesEvent));

    // 3. Polling dự phòng nhẹ nhàng mỗi 12 giây
    const pollInterval = setInterval(() => {
      fetchTableOrders(false);
    }, 12000);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      unsubs.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
      clearInterval(pollInterval);
    };
  }, [isOpen, tableIdentifier, table?.tableNumber, table?.name, table?.code, table?.id, fetchTableOrders]);

  // Thao tác chỉnh số lượng món
  const handleUpdateQuantity = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) {
      return; // Giới hạn số lượng nhỏ nhất là 1 món
    }
    if (newQty > 99) {
      showFeedback('Số lượng tối đa cho mỗi món là 99 phần', true);
      return;
    }

    setActionLoading(`qty_${item.id}`);
    try {
      await orderApi.updateItemQuantity(item.id, newQty);
      // Xóa thông báo khi tăng/giảm số lượng theo yêu cầu của người dùng
      setFeedback(null);
      await fetchTableOrders(false);
      if (onOrderChanged) onOrderChanged();
    } catch (err) {
      showFeedback(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật số lượng', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Mở hộp thoại sửa ghi chú
  const handleStartEditNote = (item) => {
    setEditingNoteId(item.id);
    setTempNote(item.note || '');
  };

  // Lưu ghi chú mới
  const handleSaveNote = async (item) => {
    setActionLoading(`note_${item.id}`);
    try {
      await orderApi.updateItemNote(item.id, tempNote.trim());
      setEditingNoteId(null);
      await fetchTableOrders(false);
      if (onOrderChanged) onOrderChanged();
    } catch (err) {
      showFeedback(err?.response?.data?.message || err?.message || 'Lỗi khi sửa ghi chú', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Mở dialog hủy món
  const handleOpenCancelDialog = (item) => {
    setCancellingItem(item);
    setCancelReason(QUICK_CANCEL_REASONS[0]);
    setCustomReason('');
  };

  // Xác nhận hủy món
  const handleConfirmCancel = async () => {
    if (!cancellingItem) return;
    const finalReason = customReason.trim() ? customReason.trim() : cancelReason;
    if (!finalReason) {
      showFeedback('Vui lòng chọn hoặc nhập lý do hủy món theo quy định BR13.1', true);
      return;
    }

    setActionLoading('cancel_item');
    try {
      await orderApi.cancelOrderItem(cancellingItem.id, finalReason);
      showFeedback(`Đã hủy món "${cancellingItem.name}" khỏi order`);
      setCancellingItem(null);
      await fetchTableOrders(false);
      if (onOrderChanged) onOrderChanged();
    } catch (err) {
      showFeedback(err?.response?.data?.message || err?.message || 'Lỗi khi hủy món', true);
    } finally {
      setActionLoading(null);
    }
  };

  // Tính tổng số lượng và thành tiền của các món đang hoạt động (không bị hủy)
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (item.status !== 'CANCELLED') {
          totalItems += item.quantity || 1;
          totalAmount += Number(item.totalPrice) || (Number(item.price || 0) * Number(item.quantity || 1));
        }
      });
    });
    return { totalItems, totalAmount };
  }, [orders]);

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl bg-[#121214] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Modal */}
        <div className="px-5 py-3.5 border-b border-surface-border bg-gradient-to-r from-[#18181C] to-[#141416] flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-gold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                {getDisplayTableName(table)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-red-600 text-white border border-red-500/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 shadow-sm shadow-red-950/50"
            title="Đóng giao diện"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Toast thông báo phản hồi */}
        {feedback && (
          <div
            className={`px-5 py-2.5 text-xs font-medium flex items-center gap-2 border-b animate-slideDown ${
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

        {/* 3. Nội dung danh sách món theo từng lượt order */}
        <div
          ref={orderListScrollRef}
          className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-[#0F0F11]"
        >
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold opacity-80" />
              <p className="text-xs text-[#8E8E93]">Đang đồng bộ danh sách đợt order từ bếp...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-surface-border rounded-xl">
              <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-300">Bàn này chưa gửi món nào vào bếp</div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Khách tại bàn chưa bấm chốt gửi giỏ hàng hoặc các đợt order trước đó đã được thanh toán và dọn dẹp.
              </p>
            </div>
          ) : (
            orders.map((order, orderIdx) => {
              const activeCount = (order.items || []).filter((i) => i.status !== 'CANCELLED').length;
              const hasDuplicateRounds = orders.some((o, i) => orders.some((other, j) => i !== j && o.roundNumber === other.roundNumber));
              const roundNum = (!hasDuplicateRounds && order.roundNumber) ? order.roundNumber : (orderIdx + 1);
              const orderTimeStr = order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={order.id || orderIdx}
                  className="rounded-xl border border-surface-border bg-[#161619] overflow-hidden shadow-sm"
                >
                  {/* Tiêu đề Đợt Order */}
                  <div className="px-4 py-2.5 bg-[#1B1B1F] border-b border-surface-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Đợt {roundNum} ({activeCount} món)
                      </span>
                      {orderTimeStr && (
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {orderTimeStr}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-gold">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>

                  {/* Danh sách món trong đợt */}
                  <div className="divide-y divide-surface-border/30">
                    {(order.items || []).map((item) => {
                      const isCancelled = item.status === 'CANCELLED';
                      const isDelivered = item.status === 'DELIVERED';
                      const isServed = item.status === 'SERVED';
                      const isCooking = item.status === 'COOKING' || !item.status;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isCancelled
                              ? 'bg-rose-950/10 opacity-60'
                              : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Cột trái: Ảnh & Tên & Ghi chú */}
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            {/* Khung ảnh minh họa: Kích thước chuẩn bằng đúng chiều cao từ tên món đến ghi chú */}
                            <img
                              src={
                                item.imageUrl ||
                                item.image ||
                                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'
                              }
                              alt={item.name}
                              className={`w-[76px] h-[76px] rounded-xl object-cover border flex-shrink-0 shadow-sm ${
                                isCancelled ? 'border-rose-900/40 grayscale' : 'border-surface-border'
                              }`}
                            />

                            <div className="min-w-0 flex-1 flex flex-col justify-between min-h-[76px] py-0.5">
                              <div>
                                <div className="text-xs font-bold leading-snug line-clamp-1">
                                  <span
                                    className={
                                      isCancelled ? 'line-through text-zinc-500' : 'text-zinc-100'
                                    }
                                  >
                                    {item.name}
                                  </span>
                                </div>

                                {/* Badge trạng thái theo QĐ8 - Thống nhất luôn nằm ở hàng bên dưới tên món */}
                                <div className="mt-1 flex items-center">
                                  {isCancelled ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      Đã Hủy
                                    </span>
                                  ) : isDelivered ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      Đã phục vụ
                                    </span>
                                  ) : isServed ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                      Chờ phục vụ
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                      Đang nấu
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-zinc-400 font-mono mt-1.5">
                                  Đơn giá: <span className="text-zinc-300 font-semibold">{formatCurrency(item.price)}</span>
                                </div>
                              </div>

                              {/* Ghi chú món ăn hoặc form sửa ghi chú */}
                              <div className="mt-1">
                                {isCancelled ? (
                                  <p className="text-[11px] text-rose-400 italic">
                                    Lý do hủy: {item.cancelReason || 'Khách yêu cầu hủy'}
                                  </p>
                                ) : editingNoteId === item.id ? (
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <input
                                      type="text"
                                      value={tempNote}
                                      onChange={(e) => setTempNote(e.target.value)}
                                      placeholder="Ghi chú mới (VD: không cay...)"
                                      className="h-7 px-2 bg-black/50 border border-amber-500/50 rounded text-xs text-white outline-none flex-1 focus:border-gold"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveNote(item);
                                        if (e.key === 'Escape') setEditingNoteId(null);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      disabled={actionLoading === `note_${item.id}`}
                                      onClick={() => handleSaveNote(item)}
                                      className="h-7 px-2.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs flex items-center justify-center transition-all"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingNoteId(null)}
                                      className="h-7 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs flex items-center justify-center transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                                    <span className="italic text-amber-200/80">
                                      {item.note ? `Ghi chú: "${item.note}"` : 'Không có ghi chú'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditNote(item)}
                                      className="text-zinc-500 hover:text-gold p-0.5 rounded transition-colors"
                                      title="Sửa ghi chú món"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Cột phải: Bộ tăng giảm số lượng, thành tiền & nút hủy */}
                          {!isCancelled && (
                            <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                              {/* Bộ tăng giảm số lượng */}
                              <div className="flex items-center border border-surface-border rounded-lg bg-[#111113] overflow-hidden">
                                <button
                                  type="button"
                                  disabled={actionLoading === `qty_${item.id}` || item.quantity <= 1}
                                  onClick={() => handleUpdateQuantity(item, -1)}
                                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                  title={item.quantity > 1 ? 'Giảm 1 phần' : 'Số lượng tối thiểu là 1 món'}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center text-xs font-mono font-bold text-white select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={actionLoading === `qty_${item.id}` || item.quantity >= 99}
                                  onClick={() => handleUpdateQuantity(item, 1)}
                                  className={`w-7 h-7 flex items-center justify-center transition-all ${
                                    item.quantity >= 99
                                      ? 'text-zinc-600 cursor-not-allowed opacity-20'
                                      : 'text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90 disabled:opacity-40'
                                  }`}
                                  title={item.quantity >= 99 ? 'Đã đạt số lượng tối đa 99 phần' : 'Thêm 1 phần'}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Thành tiền */}
                              <div className="text-right min-w-[90px]">
                                <div className="text-xs font-mono font-bold text-gold">
                                  {formatCurrency(item.totalPrice || item.price * item.quantity)}
                                </div>
                              </div>

                              {/* Nút Hủy / Xóa món */}
                              <button
                                type="button"
                                onClick={() => handleOpenCancelDialog(item)}
                                className="h-7 w-7 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400 flex items-center justify-center transition-all active:scale-90"
                                title="Hủy món khỏi order (UC13)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer Modal */}
        <div className="p-4 bg-[#141416] border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-zinc-300">
            <div>
              Tổng món đang phục vụ: <strong className="text-white font-mono">{stats.totalItems} phần</strong>
            </div>
            <div className="w-px h-3.5 bg-surface-border" />
            <div>
              Tổng tạm tính: <strong className="text-gold font-mono text-sm">{formatCurrency(stats.totalAmount)}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs border border-red-500/50 shadow-md shadow-red-950/50 hover:scale-105 active:scale-95 transition-transform duration-200"
          >
            Đóng Giao Diện
          </button>
        </div>

        {/* 5. Dialog Xác Nhận Hủy Món Kèm Lý Do Bắt Buộc (BR13.1) */}
        {cancellingItem && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div
              className="w-full max-w-md bg-[#18181C] border border-rose-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-white animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Xác Nhận Xóa Món Ăn</h4>
                  <p className="text-xs text-zinc-400">
                    Bạn có chắc chắn muốn xóa món này khỏi danh sách order của bàn?
                  </p>
                </div>
              </div>

              {/* Chi tiết món bị hủy */}
              <div className="p-3 rounded-xl bg-black/40 border border-surface-border text-xs space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      cancellingItem.imageUrl ||
                      cancellingItem.image ||
                      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={cancellingItem.name}
                    className="w-14 h-14 rounded-xl object-cover border border-surface-border flex-shrink-0 shadow-sm bg-zinc-800"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-bold text-zinc-100 line-clamp-1">{cancellingItem.name}</div>
                    <div className="text-zinc-400 flex items-center justify-between">
                      <span>Số lượng: {cancellingItem.quantity} phần</span>
                      <span className="text-gold font-mono font-bold">
                        {formatCurrency(cancellingItem.totalPrice || cancellingItem.price * cancellingItem.quantity)}
                      </span>
                    </div>
                    {cancellingItem.note && (
                      <div className="text-[11px] text-amber-300/80 italic truncate">
                        Ghi chú: "{cancellingItem.note}"
                      </div>
                    )}
                  </div>
                </div>

                {cancellingItem.status === 'DELIVERED' && (
                  <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>Món này đã được nhân viên bưng lên bàn cho khách. Hãy chắc chắn khách muốn trả lại món!</span>
                  </div>
                )}
              </div>

              {/* Chọn lý do hủy nhanh */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Lý do xóa món (Quy định bắt buộc BR13.1):
                </label>
                <div
                  ref={reasonsScrollRef}
                  className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-0.5"
                >
                  {QUICK_CANCEL_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setCancelReason(reason);
                        setCustomReason('');
                      }}
                      className={`px-3 py-2 rounded-lg text-xs text-left border transition-all ${
                        cancelReason === reason && !customReason
                          ? 'bg-rose-600/20 border-rose-500 text-rose-200 font-semibold'
                          : 'bg-surface-card border-surface-border text-zinc-400 hover:text-white'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {/* Hoặc nhập lý do khác */}
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Hoặc nhập lý do xóa món khác..."
                  className="w-full h-8 px-3 mt-1 bg-black/60 border border-surface-border rounded-lg text-xs text-white outline-none focus:border-rose-400"
                />
              </div>

              {/* Nút hành động trong popup */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={actionLoading === 'cancel_item'}
                  onClick={() => setCancellingItem(null)}
                  className="px-4 py-2 rounded-xl border border-surface-border text-zinc-300 font-bold text-xs hover:bg-white/5 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoading === 'cancel_item'}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {actionLoading === 'cancel_item' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Xác Nhận Xóa Món</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
