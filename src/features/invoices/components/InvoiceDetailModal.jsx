import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, Receipt, CheckCircle, CreditCard, Banknote } from 'lucide-react';
import logoImg from '@/assets/images/logo.png';

export default function InvoiceDetailModal({ invoice, isOpen, onClose }) {
  const receiptRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold" />
            <h3 className="font-semibold text-[#EDEDED] text-sm tracking-wide">
              Chi Tiết Hóa Đơn • {invoice.invoiceCode}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E8E93] hover:text-[#EDEDED] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 80mm Thermal Receipt View (Printable) */}
        <div className="p-6 bg-[#0E0E10] overflow-y-auto max-h-[72vh] flex justify-center">
          <div
            ref={receiptRef}
            id="printable-bill"
            className="w-[340px] bg-white text-black p-5 rounded-lg shadow-xl font-mono text-xs border border-gray-200"
          >
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
                <strong className="font-bold">{invoice.invoiceCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Bàn phục vụ:</span>
                <strong className="font-bold">{invoice.tableName || invoice.tableNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span>{formatDate(invoice.paidAt || invoice.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{invoice.cashierName || 'Quản Trị Viên'}</span>
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
                {(invoice.items || [
                  { name: 'Nước Lẩu Cà Chua Hoàng Gia', quantity: 1, price: 150000 },
                  { name: 'Ba Chỉ Bò Mỹ Thượng Hạng', quantity: 2, price: 220000 },
                  { name: 'Rau Nấm Thập Cẩm Cung Đình', quantity: 1, price: 110000 },
                  { name: 'Mì Tươi Kéo Tay', quantity: 2, price: 35000 },
                  { name: 'Trà Sâm Hạt Sen', quantity: 3, price: 40000 },
                ]).map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 leading-tight">
                    <span className="col-span-6 font-medium text-gray-900">{item.name}</span>
                    <span className="col-span-2 text-center text-gray-600">{item.quantity}</span>
                    <span className="col-span-4 text-right font-semibold">
                      {formatVND(item.price * item.quantity).replace('₫', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chi tiết tính tiền */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{formatVND(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Chiết khấu ({invoice.discountPercent}%):</span>
                  <span>-{formatVND(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Thuế VAT ({invoice.taxPercent || 8}%):</span>
                <span>{formatVND(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300">
                <span className="uppercase">TỔNG THANH TOÁN:</span>
                <span className="text-red-700">{formatVND(invoice.finalAmount)}</span>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Phương thức:</span>
                <strong className="uppercase">
                  {invoice.paymentMethod === 'VIETQR' ? 'Chuyển Khoản VietQR' : 'Tiền Mặt'}
                </strong>
              </div>
              {invoice.paymentMethod === 'CASH' && invoice.cashReceived && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Tiền khách đưa:</span>
                    <span>{formatVND(invoice.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tiền thối lại:</span>
                    <span>{formatVND(invoice.cashChange || 0)}</span>
                  </div>
                </>
              )}
              {invoice.paymentMethod === 'VIETQR' && (
                <div className="flex justify-between text-gray-600">
                  <span>Mã GD VietQR:</span>
                  <span className="font-mono">{invoice.transactionRef || 'VQR98234120'}</span>
                </div>
              )}
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#3F3F46] hover:bg-[#27272A] text-xs font-medium text-[#A0A0A5] transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-crimson to-[#B91C1C] hover:from-[#B91C1C] hover:to-crimson text-white text-xs font-semibold shadow-lg shadow-crimson/20 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Tính Tiền (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
