import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  Download,
  Eye,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { invoiceApi } from '@/features/invoices/api/invoiceApi';
import InvoiceDetailModal from '@/features/invoices/components/InvoiceDetailModal';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  const [methodFilter, setMethodFilter] = useState('ALL'); // ALL, CASH, VIETQR
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PAID, PENDING, CANCELLED

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString('vi-VN')}`;
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getInvoices();
      setInvoices(res.content || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách hóa đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Lọc danh sách hóa đơn
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (inv.invoiceCode || '').toLowerCase().includes(q) ||
        (inv.tableName || '').toLowerCase().includes(q) ||
        (inv.tableNumber || '').toLowerCase().includes(q) ||
        (inv.cashierName || '').toLowerCase().includes(q);

      const matchMethod = methodFilter === 'ALL' || inv.paymentMethod === methodFilter;
      const matchStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [invoices, searchQuery, methodFilter, statusFilter]);

  // KPI Overview
  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.paymentStatus === 'PAID');
    const totalRev = paidInvoices.reduce((acc, i) => acc + (Number(i.finalAmount) || 0), 0);
    const cashRev = paidInvoices
      .filter((i) => i.paymentMethod === 'CASH')
      .reduce((acc, i) => acc + (Number(i.finalAmount) || 0), 0);
    const vietQrRev = paidInvoices
      .filter((i) => i.paymentMethod === 'VIETQR')
      .reduce((acc, i) => acc + (Number(i.finalAmount) || 0), 0);
    const aov = paidInvoices.length > 0 ? Math.round(totalRev / paidInvoices.length) : 0;

    return {
      count: paidInvoices.length,
      totalRevenue: totalRev,
      cashRevenue: cashRev,
      vietQrRevenue: vietQrRev,
      averageOrderValue: aov,
    };
  }, [invoices]);

  // Xuất file CSV
  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) return;
    const headers = ['Mã HĐ', 'Bàn', 'Thời Gian', 'Tạm Tính', 'Giảm Giá', 'VAT', 'Tổng Tiền', 'Phương Thức', 'Trạng Thái', 'Thu Ngân'];
    const rows = filteredInvoices.map((i) => [
      i.invoiceCode,
      i.tableName || i.tableNumber,
      formatDate(i.paidAt || i.createdAt),
      i.subtotal,
      i.discountAmount || 0,
      i.taxAmount || 0,
      i.finalAmount,
      i.paymentMethod,
      i.paymentStatus,
      i.cashierName || 'Quản lý',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HoaDon_HoaDiemCac_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0E0E10] text-[#EDEDED]">
      {/* 1. Header & KPI Cards */}
      <div className="px-8 py-6 border-b border-surface-border bg-[#121214] flex flex-col gap-5 select-none">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gold/10 border border-gold/20 text-gold">
                <Receipt className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold font-serif text-[#EDEDED] tracking-wide">
                Lịch Sử Hóa Đơn & Giao Dịch
              </h1>
            </div>
            <p className="text-xs text-[#8E8E93] mt-1">
              Tra cứu lịch sử thanh toán, chi tiết đợt gọi món và in lại phiếu tính tiền 80mm
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInvoices}
              className="p-2.5 rounded-xl border border-surface-border hover:bg-surface-hover text-[#A0A0A5] hover:text-[#EDEDED] transition-colors"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl border border-surface-border hover:border-gold/50 bg-surface-card hover:bg-surface-hover text-xs font-semibold text-gold flex items-center gap-2 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Báo Cáo CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Doanh Thu Nhanh */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#8E8E93]">Hóa Đơn Hoàn Tất</p>
              <p className="text-xl font-bold font-mono text-white mt-1">{stats.count}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Đã thu ngân và chốt bàn</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-gold">Tổng Doanh Thu Đã Thu</p>
              <p className="text-xl font-bold font-mono text-gold mt-1">{formatVND(stats.totalRevenue)}</p>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">TB: {formatVND(stats.averageOrderValue)} / đơn</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-cyan-400">Chuyển Khoản VietQR</p>
              <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{formatVND(stats.vietQrRevenue)}</p>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">Tỷ trọng:{' '}
                {stats.totalRevenue > 0 ? Math.round((stats.vietQrRevenue / stats.totalRevenue) * 100) : 0}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-amber-400">Thanh Toán Tiền Mặt</p>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">{formatVND(stats.cashRevenue)}</p>
              <p className="text-[10px] text-[#8E8E93] mt-0.5">Tỷ trọng:{' '}
                {stats.totalRevenue > 0 ? Math.round((stats.cashRevenue / stats.totalRevenue) * 100) : 0}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Toolbar Tìm Kiếm & Bộ Lọc */}
      <div className="px-8 py-3.5 border-b border-surface-border bg-[#0E0E10] flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ (HD-xxxx), số bàn, tên thu ngân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181B] border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-[#EDEDED] placeholder-[#71717A] outline-none focus:border-gold/60 transition-colors"
            />
          </div>
        </div>

        {/* Phương Thức Thanh Toán Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#18181B] border border-surface-border rounded-xl">
            {[
              { id: 'ALL', label: 'Tất Cả Phương Thức' },
              { id: 'VIETQR', label: 'VietQR' },
              { id: 'CASH', label: 'Tiền Mặt' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodFilter(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  methodFilter === m.id
                    ? 'bg-crimson-subtle text-gold border border-crimson-border shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#EDEDED]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#18181B] border border-surface-border text-[#EDEDED] text-xs rounded-xl px-3 py-2 outline-none focus:border-gold/60 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Hóa Đơn (Scrollable Table) */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="bg-[#18181B] border border-surface-border rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121214] border-b border-surface-border text-[#A0A0A5] uppercase font-semibold text-[11px] select-none">
              <tr>
                <th className="py-3.5 px-4">Mã Hóa Đơn</th>
                <th className="py-3.5 px-4">Bàn Phục Vụ</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4 text-right">Tạm Tính</th>
                <th className="py-3.5 px-4 text-right">VAT</th>
                <th className="py-3.5 px-4 text-right">Tổng Thanh Toán</th>
                <th className="py-3.5 px-4 text-center">Phương Thức</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50 text-[#EDEDED]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#8E8E93]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold mb-2" />
                    <span>Đang tải lịch sử hóa đơn...</span>
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#1F1F24] transition-colors cursor-pointer group"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-gold group-hover:underline">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{inv.tableName || inv.tableNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#A0A0A5] font-mono text-[11px]">
                      {formatDate(inv.paidAt || inv.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#A0A0A5]">
                      {formatVND(inv.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#A0A0A5]">
                      {formatVND(inv.taxAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatVND(inv.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          inv.paymentMethod === 'VIETQR'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {inv.paymentMethod === 'VIETQR' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                        {inv.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền Mặt'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Đã Thu Tiền
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg border border-surface-border hover:border-gold/50 bg-[#121214] hover:bg-[#27272A] text-[#8E8E93] hover:text-gold transition-colors"
                          title="Xem chi tiết hóa đơn"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg border border-surface-border hover:border-gold/50 bg-[#121214] hover:bg-[#27272A] text-[#8E8E93] hover:text-gold transition-colors"
                          title="In lại phiếu tính tiền 80mm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[#8E8E93]">
                    <Search className="w-8 h-8 opacity-40 mx-auto text-gold mb-2" />
                    <p className="text-sm">Không tìm thấy hóa đơn nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Hóa Đơn & In 80mm */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
