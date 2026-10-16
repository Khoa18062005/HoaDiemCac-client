import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Receipt,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Banknote,
  CreditCard,
  Radio,
  Wallet,
  Check,
  RefreshCw,
} from 'lucide-react';
import { tableApi } from '@/features/tables/api/tableApi';
import { apiClient } from '@/lib/axios';
import { saveInvoiceToHistory } from '@/features/invoices/api/invoiceApi';

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

export function getDisplayTableName(table) {
  if (!table) return 'Bàn';
  const name = String(table.name || table.tableNumber || table.code || '').trim();
  if (!name) return 'Bàn';
  if (/^bàn/i.test(name)) return name;
  return `Bàn ${name}`;
}

const STEPS = [
  { id: 1, title: 'Yêu Cầu TT' },
  { id: 2, title: 'Đóng Băng Bàn' },
  { id: 3, title: 'Hóa Đơn & PTTT' },
  { id: 4, title: 'Xác Nhận Hoàn Tất' },
];

export default function PaymentStepperModal({
  isOpen,
  onClose,
  table,
  allItems = [],
  subtotal = 0,
  vat = 0,
  finalTotal = 0,
  loadingOrders = false,
  onTableUpdated,
  onOptimisticUpdate,
  syncOrderLockState,
}) {
  // Bắt đầu từ Bước 2 (sau khi ấn nút Thanh Toán ở B1 - Hình 1)
  const [currentStep, setCurrentStep] = useState(2);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Phương thức thanh toán (Tiền mặt / Chuyển khoản)
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER'
  const [cashReceived, setCashReceived] = useState('');
  const [thirdPartySignalStatus, setThirdPartySignalStatus] = useState('WAITING');

  // Mã hóa đơn thống nhất & Hóa đơn đã thanh toán
  const [currentInvoiceCode, setCurrentInvoiceCode] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Reset khi mở modal
  useEffect(() => {
    if (isOpen && table) {
      setCurrentStep(2);
      setActionLoading(null);
      setFeedback(null);
      setPaymentMethod('CASH');
      setCashReceived('');
      setThirdPartySignalStatus('WAITING');
      setCompletedInvoice(null);

      const today = new Date();
      const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const rand = String(Math.floor(1000 + Math.random() * 9000));
      setCurrentInvoiceCode(`HD-${ymd}-${rand}`);
    }
  }, [isOpen, table?.id]);

  // Khóa cuộn trang khi mở modal
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !table) return null;

  const showFeedback = (msg, isError = false) => {
    setFeedback({ msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Tính tiền khách đưa & tiền thối lại
  const numCashReceived = Number(cashReceived) || 0;
  const cashChange = Math.max(0, numCashReceived - finalTotal);
  const targetTableNum = table.tableNumber || table.code || '';

  /**
   * CƠ CHẾ HỦY & HOÀN TÁC TOÀN DIỆN (CANCEL & ROLLBACK):
   * Dừng ở bất kỳ step nào cũng sẽ xác nhận là hủy trạng thái thanh toán,
   * tự động rã băng máy khách hàng và trả bàn về hoạt động bình thường.
   */
  const handleCancelPaymentFlow = async () => {
    // Nếu bàn đang trong trạng thái đóng băng order
    if (table.isOrderLocked || currentStep >= 3) {
      try {
        // 1. Phản hồi lạc quan tức thì 0ms (Optimistic UI)
        table.isOrderLocked = false;
        if (syncOrderLockState) {
          syncOrderLockState(table.id, targetTableNum, false);
        }

        // 2. Bắn API mở khóa order cho bàn trên Database Backend
        await tableApi.setOrderLock(table.id, false);

        if (onTableUpdated) onTableUpdated();
      } catch (err) {
        console.error('Lỗi khi rã băng bàn ăn khi hủy thanh toán:', err);
      }
    }
    onClose();
  };

  /**
   * BƯỚC 2 -> BƯỚC 3:
   * Thu ngân nhấn [Xác Nhận] ở Bước 2 (Hình 2):
   * -> Bàn ăn lập tức chuyển về trạng thái đóng băng (Hình 3 trên máy khách hàng)
   * -> Stepper chuyển sang Bước 3 (Hóa đơn & Phương thức thanh toán)
   */
  const handleConfirmStep2 = async () => {
    setActionLoading('step2');

    // 1. Khóa order lạc quan 0ms
    table.isOrderLocked = true;
    if (syncOrderLockState) {
      syncOrderLockState(table.id, targetTableNum, true);
    }

    // 2. Chuyển sang Bước 3
    setCurrentStep(3);

    // 3. Đồng bộ xuống server backend
    try {
      await tableApi.setOrderLock(table.id, true);
    } catch (err) {
      console.warn('Lỗi gọi setOrderLock từ server:', err);
    } finally {
      setActionLoading(null);
    }

    if (onTableUpdated) onTableUpdated();
  };

  /**
   * BƯỚC 3 -> BƯỚC 4:
   * Thu ngân kiểm tra hóa đơn, chọn PTTT và nhấn [Xác Nhận Hoàn Tất Thanh Toán]:
   * -> Stepper chuyển sang Bước 4 (Xác nhận thanh toán lần nữa - Hình 5)
   */
  const handleConfirmStep3 = () => {
    setCurrentStep(4);
  };

  /**
   * BƯỚC 4 -> HOÀN TẤT:
   * Thu ngân nhấn [Xác Nhận Thanh Toán] ở Bước 4 (Hình 5):
   * -> Bàn ngay lập tức chuyển sang trạng thái CLEANING (Đang dọn dẹp)
   * -> Gọi API settle giải phóng phiên bàn và xoay PIN
   * -> Mở màn hình xem/in hóa đơn thanh toán K80
   */
  const handleConfirmFinalPayment = async () => {
    setActionLoading('settle');

    // 1. Cập nhật lạc quan 0ms sang trạng thái Đang dọn dẹp
    if (onOptimisticUpdate) {
      onOptimisticUpdate(table.id, 'CLEANING');
    }

    // 2. Tạo đối tượng hóa đơn hoàn chỉnh ghi nhận lịch sử
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

    // 3. Gọi API settle hóa đơn ở backend
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

    if (onTableUpdated) onTableUpdated();

    // Chuyển sang Bước 5 (Màn hình in hóa đơn K80)
    setCurrentStep(5);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
        <div
          className={`bg-[#141417] border border-gold/30 rounded-2xl w-full shadow-2xl flex flex-col overflow-hidden transform-gpu animate-scaleIn transition-all ${
            currentStep === 2
              ? 'max-w-md'
              : currentStep === 3
              ? 'max-w-3xl max-h-[92vh]'
              : currentStep === 4
              ? 'max-w-md'
              : 'max-w-lg max-h-[92vh]'
          }`}
        >
          {/* A. THANH TIẾN TRÌNH CÁC CHẤM (DOTS STEPPER INDICATOR) */}
          <div className="px-6 pt-5 pb-3.5 border-b border-surface-border bg-[#101012] select-none">
            <div className="relative grid grid-cols-4 max-w-md mx-auto">
              {/* Đường ray nền - Căn chính giữa tâm các nút tròn (y = 16px) */}
              <div className="absolute top-4 left-[12.5%] right-[12.5%] h-1 -translate-y-1/2 bg-[#222226] border border-[#2E2E34]/50 rounded-full z-0 overflow-hidden">
                {/* Dải sáng tiến độ gradient đỏ - vàng */}
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-gold rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                  style={{
                    width: `${((Math.min(currentStep, 4) - 1) / 3) * 100}%`,
                  }}
                />
              </div>

              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id || currentStep === 5;
                const isActive = currentStep === step.id;
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/40 ring-2 ring-red-400/80'
                          : isActive
                          ? 'bg-gradient-to-br from-red-500 via-amber-500 to-gold text-stone-950 font-black shadow-lg shadow-amber-500/40 ring-4 ring-amber-400/35 scale-110'
                          : 'bg-[#18181C] text-[#71717A] border-2 border-[#27272A]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3] text-white" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10.5px] font-semibold mt-1.5 transition-colors whitespace-nowrap ${
                        isActive
                          ? 'text-amber-400 font-bold drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]'
                          : isCompleted
                          ? 'text-red-400'
                          : 'text-[#71717A]'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Alert Toast */}
          {feedback && (
            <div
              className={`px-5 py-2 text-xs font-medium flex items-center gap-2 border-b ${
                feedback.isError
                  ? 'bg-crimson/15 border-crimson/30 text-crimson-glow'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
              }`}
            >
              {feedback.isError ? (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-amber-400" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* B. NỘI DUNG TỪNG BƯỚC */}

          {/* ---------------------------------------------------- */}
          {/* BƯỚC 2: XÁC NHẬN XEM HÓA ĐƠN TẠM TÍNH (HÌNH 2)        */}
          {/* ---------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="p-6 space-y-5 animate-fadeIn">
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
                    Bạn có muốn mở danh sách món ăn và kiểm tra hóa đơn tạm tính cho{' '}
                    <span className="text-white font-semibold">{getDisplayTableName(table)}</span> không?
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
                  <p className="text-[10px] uppercase tracking-wider text-[#8E8E93]">
                    Tổng tạm tính ({allItems.length} món)
                  </p>
                  <p className="font-mono font-extrabold text-gold text-sm">
                    {formatCurrencyVND(finalTotal)}
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCancelPaymentFlow}
                  className="h-11 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-elevated text-[#EDEDED] hover:text-white font-semibold text-xs transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={actionLoading === 'step2'}
                  onClick={handleConfirmStep2}
                  className="h-11 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-gold/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                >
                  {actionLoading === 'step2' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Xác Nhận</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* BƯỚC 3: HÓA ĐƠN ĐỐI SOÁT & CHỌN PTTT (HÌNH 4)         */}
          {/* ---------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="flex flex-col flex-1 overflow-hidden animate-fadeIn">
              {/* Header con của bước 3 */}
              <div className="px-6 py-3.5 border-b border-surface-border flex items-center justify-between bg-[#101012]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
                      <span>Hóa Đơn Tạm Tính – {getDisplayTableName(table)}</span>
                      {table.isVip && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/40">
                          VIP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#8E8E93]">
                      Mã bàn: <span className="font-mono text-white">{table.tableNumber || table.code}</span>
                      {table.timeSpent && ` • Thời gian: ${table.timeSpent}`}
                      {` • ${allItems.length} món ăn`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelPaymentFlow}
                  className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
                  title="Hủy quy trình thanh toán và rã băng bàn ăn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body cuộn của bước 3 */}
              <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                {/* 1. Bảng danh sách món ăn đối soát */}
                <div className="overflow-hidden rounded-xl border border-surface-border/80 bg-[#101012]">
                  <table className="w-full text-left text-xs table-fixed border-collapse">
                    <thead className="bg-[#18181C] text-[#A0A0A5] uppercase text-[11px] font-bold tracking-wider border-b border-surface-border select-none">
                      <tr>
                        <th className="py-3 px-3 text-center w-[8%] whitespace-nowrap">STT</th>
                        <th className="py-3 px-4 w-[38%]">Tên Món</th>
                        <th className="py-3 px-3 text-center w-[15%] whitespace-nowrap">Số Lượng</th>
                        <th className="py-3 px-3 text-right w-[18%] whitespace-nowrap">Đơn Giá</th>
                        <th className="py-3 px-4 text-right w-[21%] whitespace-nowrap">Thành Tiền</th>
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
                              <td className="py-3 px-3 text-center w-[8%] whitespace-nowrap font-mono text-xs text-[#8E8E93] font-medium">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 w-[38%] font-medium text-white">
                                <p className="font-semibold text-white leading-snug line-clamp-2" title={item.name || item.dishName}>
                                  {item.name || item.dishName || `Món ăn #${idx + 1}`}
                                </p>
                              </td>
                              <td className="py-3 px-3 text-center w-[15%] whitespace-nowrap">
                                <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md bg-surface-elevated border border-surface-border font-bold text-gold text-xs">
                                  {qty}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-[#D0D0D5] w-[18%] whitespace-nowrap">
                                {formatCurrencyVND(unitPrice)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-extrabold text-white w-[21%] whitespace-nowrap">
                                {formatCurrencyVND(itemTotal)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#8E8E93] italic">
                            {subtotal > 0
                              ? `Đơn hàng đang có tổng tiền ${formatCurrencyVND(subtotal)}`
                              : 'Bàn chưa có món ăn nào được ghi nhận.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2. Tổng hợp tài chính: Tạm tính, Thuế VAT, Tổng tiền */}
                <div className="bg-[#18181C] border border-surface-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#A0A0A5]">
                    <span>Tạm tính (tiền chưa VAT):</span>
                    <span className="font-mono text-white font-medium">{formatCurrencyVND(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#A0A0A5]">
                    <span>Thuế VAT (8%):</span>
                    <span className="font-mono text-purple-400 font-medium">+{formatCurrencyVND(vat)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-surface-border text-sm">
                    <span className="font-bold text-white uppercase tracking-wider">Tổng Tiền Thanh Toán:</span>
                    <span className="font-mono text-xl font-extrabold text-gold tracking-tight">
                      {formatCurrencyVND(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* 3. LỰA CHỌN PHƯƠNG THỨC THANH TOÁN (Trực tiếp trong Bước 3) */}
                <div className="space-y-3 pt-1">
                  <label className="text-xs font-bold text-[#A0A0A5] uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-gold" />
                    <span>Chọn Phương Thức Thanh Toán</span>
                  </label>

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

                  {/* Chi tiết Tiền Mặt */}
                  {paymentMethod === 'CASH' && (
                    <div className="bg-[#101012] border border-surface-border rounded-xl p-4 space-y-3 animate-fadeIn">
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

                      {/* Gợi ý số tiền */}
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
                          <span className="font-mono font-bold text-gold text-sm">
                            {formatCurrencyVND(cashChange)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chi tiết Chuyển Khoản VietQR */}
                  {paymentMethod === 'TRANSFER' && (
                    <div className="bg-[#101012] border border-surface-border rounded-xl p-4 space-y-4 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="p-2.5 bg-white rounded-xl shadow-lg flex-shrink-0">
                          <img
                            src={`https://img.vietqr.io/image/MB-0317892341-compact2.png?amount=${finalTotal}&addInfo=Thanh%20toan%20${table.tableNumber || table.code || 'B01'}`}
                            alt="VietQR Chuyển Khoản"
                            className="w-32 h-32 object-contain"
                            loading="lazy"
                          />
                        </div>

                        <div className="space-y-1.5 text-xs flex-1 w-full">
                          <div className="flex items-center justify-between pb-1 border-b border-surface-border/60">
                            <span className="text-[#8E8E93]">Ngân hàng:</span>
                            <span className="font-bold text-white">MB Bank (Quân Đội)</span>
                          </div>
                          <div className="flex items-center justify-between pb-1 border-b border-surface-border/60">
                            <span className="text-[#8E8E93]">Số tài khoản:</span>
                            <span className="font-mono font-bold text-gold text-sm">0317892341</span>
                          </div>
                          <div className="flex items-center justify-between pb-1 border-b border-surface-border/60">
                            <span className="text-[#8E8E93]">Chủ tài khoản:</span>
                            <span className="font-bold text-white uppercase">NHA HANG HOA DIEM CAT</span>
                          </div>
                          <div className="flex items-center justify-between pb-1 border-b border-surface-border/60">
                            <span className="text-[#8E8E93]">Số tiền:</span>
                            <span className="font-mono font-extrabold text-gold">{formatCurrencyVND(finalTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8E8E93]">Nội dung CK:</span>
                            <span className="font-mono font-bold text-white bg-surface-card px-2 py-0.5 rounded border border-surface-border">
                              Thanh toan {table.tableNumber || table.code || 'B01'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tín hiệu chuyển khoản bên thứ ba */}
                      <div className="space-y-2 pt-1 border-t border-surface-border/60">
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-[#A0A0A5] flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tín Hiệu Ngân Hàng Bên Thứ Ba</span>
                        </label>

                        {thirdPartySignalStatus === 'WAITING' ? (
                          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="relative flex h-3 w-3 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                              </span>
                              <div>
                                <p className="text-xs font-bold text-amber-300">
                                  Đang chờ tín hiệu nhận tiền từ ngân hàng...
                                </p>
                                <p className="text-[10px] text-[#A0A0A5]">
                                  Lắng nghe biến động số dư VietQR cho {formatCurrencyVND(finalTotal)}.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setThirdPartySignalStatus('RECEIVED')}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-black font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                              Mô phỏng: Đã Báo Có
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between animate-fadeIn">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              <p className="text-xs font-bold text-amber-400">
                                Đã nhận tín hiệu chuyển khoản thành công từ ngân hàng MB Bank!
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setThirdPartySignalStatus('WAITING')}
                              className="text-[11px] text-[#8E8E93] hover:text-white underline"
                            >
                              Đặt lại
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer của bước 3 */}
              <div className="px-6 py-4 border-t border-surface-border bg-[#101012] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCancelPaymentFlow}
                  className="px-4 py-2.5 rounded-xl border border-surface-border hover:bg-surface-elevated text-xs font-semibold text-[#A0A0A5] hover:text-rose-400 transition-colors"
                  title="Hủy thanh toán và rã băng máy khách"
                >
                  Hủy Thanh Toán
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold font-bold text-xs flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In Tạm Tính</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmStep3}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black font-extrabold text-xs shadow-lg shadow-gold/25 flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Hoàn Tất Thanh Toán</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* BƯỚC 4: XÁC NHẬN THANH TOÁN LẦN NỮA (HÌNH 5)         */}
          {/* ---------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="p-6 space-y-5 animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Xác Nhận Thanh Toán Lần Nữa
                  </h3>
                  <p className="text-xs text-[#A0A0A5] leading-relaxed">
                    Bạn có chắc chắn muốn hoàn tất thanh toán cho{' '}
                    <span className="text-white font-semibold">{getDisplayTableName(table)}</span>?
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
                      <span className="font-mono text-gold font-bold">{formatCurrencyVND(cashChange)}</span>
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
                  onClick={handleCancelPaymentFlow}
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
          )}

          {/* ---------------------------------------------------- */}
          {/* BƯỚC 5: XEM & IN HÓA ĐƠN ĐÃ THANH TOÁN (K80 THERMAL) */}
          {/* ---------------------------------------------------- */}
          {currentStep === 5 && (
            <div className="flex flex-col flex-1 overflow-hidden animate-fadeIn">
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
                  onClick={onClose}
                  className="p-1 rounded-lg text-[#8E8E93] hover:text-[#EDEDED] hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thông báo thanh toán thành công */}
              <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-center">
                <p className="text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Thanh toán thành công cho {getDisplayTableName(table)} & Bàn đã chuyển sang Đang dọn dẹp!</span>
                </p>
              </div>

              {/* 80mm Thermal Receipt View Preview */}
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

                  {/* Bảng Món Ăn */}
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
                      <strong className="text-red-700 font-extrabold uppercase">[ ĐÃ THANH TOÁN ]</strong>
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
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#3F3F46] hover:bg-[#27272A] text-xs font-medium text-[#A0A0A5] hover:text-white transition-colors"
                >
                  Đóng / Trở Về
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-crimson to-[#B91C1C] hover:from-[#B91C1C] hover:to-crimson text-white text-xs font-semibold shadow-lg shadow-crimson/20 flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu Tính Tiền (80mm)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bản In Hóa Đơn Nhiệt 80mm Khổ K80 */}
      <div id="printable-bill" className="hidden print:block font-mono text-black text-xs leading-normal">
        <div className="w-[340px] mx-auto bg-white text-black p-4 font-mono text-xs">
          <div className="text-center pb-3 border-b border-dashed border-gray-400">
            <p className="font-bold text-base tracking-wider uppercase">HỎA DIỆM CÁC</p>
            <p className="text-[10px] text-gray-600">Đệ Nhất Lẩu Hoàng Gia</p>
            <p className="text-[10px] text-gray-500">128 Nguyễn Đình Chiểu, P. Đa Kao, Q.1, TP.HCM</p>
            <p className="text-[10px] text-gray-500">Hotline: 1900 8899 • MST: 0317892341</p>
            <h2 className="font-bold text-sm mt-2 uppercase tracking-wide">
              {currentStep === 5 ? 'PHIẾU THANH TOÁN' : 'PHIẾU TẠM TÍNH'}
            </h2>
          </div>

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
              <strong className={currentStep === 5 ? 'text-emerald-700 uppercase' : 'text-amber-700 uppercase'}>
                {currentStep === 5 ? '[ ĐÃ THANH TOÁN ]' : '[ TẠM TÍNH ]'}
              </strong>
            </div>
          </div>

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
