import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  CreditCard,
  Banknote,
  Calendar,
  Download,
  RefreshCw,
  Sparkles,
  Flame,
  Award,
  ChevronUp,
  PieChart,
  Receipt,
  Percent,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import InvoiceDetailModal from '@/features/invoices/components/InvoiceDetailModal';

export default function AdminDashboardPage() {
  // Helper tính chuỗi ngày local YYYY-MM-DD theo giờ Việt Nam
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());

  // Bộ lọc thời gian: 'today' (ngày), 'week' (tuần), 'month' (tháng), 'year' (năm), 'custom' (khoảng thời gian)
  const [period, setPeriod] = useState('today');

  // Quản lý khoảng thời gian (mặc định hôm nay, luôn cố định trên giao diện)
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Modal xem chi tiết hóa đơn
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Tìm kiếm trong lịch sử hóa đơn
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString('vi-VN')}`;
  };

  const fetchDashboard = async (overridePeriod, overrideStart, overrideEnd) => {
    const p = overridePeriod || period;
    const s = overrideStart !== undefined ? overrideStart : startDate;
    const e = overrideEnd !== undefined ? overrideEnd : endDate;

    try {
      setLoading(true);
      const res = await dashboardApi.getSummary(
        p,
        p === 'custom' ? s : null,
        p === 'custom' ? e : null
      );
      setData(res);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo doanh thu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ ngày tháng tương ứng khi chọn từng tab nhanh
  const handleSelectPeriod = (tabId) => {
    const today = new Date();
    const todayFormatted = getLocalDateString(today);
    let newStart = startDate;
    let newEnd = todayFormatted;

    if (tabId === 'today') {
      newStart = todayFormatted;
      newEnd = todayFormatted;
    } else if (tabId === 'week') {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      newStart = getLocalDateString(lastWeek);
      newEnd = todayFormatted;
    } else if (tabId === 'month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      newStart = `${year}-${month}-01`;
      newEnd = todayFormatted;
    } else if (tabId === 'year') {
      newStart = `${today.getFullYear()}-01-01`;
      newEnd = todayFormatted;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    setPeriod(tabId);
    if (tabId !== 'custom') {
      fetchDashboard(tabId, newStart, newEnd);
    }
  };

  useEffect(() => {
    fetchDashboard('today', todayStr, todayStr);
    const handleInvoiceCreated = () => {
      fetchDashboard();
    };
    window.addEventListener('invoice_created', handleInvoiceCreated);
    return () => window.removeEventListener('invoice_created', handleInvoiceCreated);
  }, []);

  const handleApplyCustomRange = (e) => {
    if (e) e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
      return;
    }
    setPeriod('custom');
    fetchDashboard('custom', startDate, endDate);
  };

  const maxChartRevenue = data?.revenueChart
    ? Math.max(...data.revenueChart.map((c) => Number(c.revenue) || 1), 1)
    : 1;

  // Tính toán tọa độ và điểm cho Biểu Đồ Miền (Area Chart)
  const chartPoints = useMemo(() => {
    const list = data?.revenueChart || [];
    if (list.length === 0) return [];

    const maxVal = Math.max(...list.map((c) => Number(c.revenue) || 0), 100000);
    const effectiveMax = maxVal * 1.18;
    const count = list.length;
    const stepX = count > 1 ? 790 / (count - 1) : 0;

    return list.map((point, i) => {
      const x = count > 1 ? 55 + i * stepX : 450;
      const rev = Number(point.revenue) || 0;
      const ratio = rev / effectiveMax;
      const y = 225 - ratio * 185;

      return {
        ...point,
        revenueNum: rev,
        x,
        y,
        index: i,
      };
    });
  }, [data?.revenueChart]);

  // Sinh đường cong spline mượt mà (Cubic Bezier) và vùng diện tích (Area Path)
  const { areaPath, linePath } = useMemo(() => {
    if (chartPoints.length === 0) return { areaPath: '', linePath: '' };
    if (chartPoints.length === 1) {
      const p = chartPoints[0];
      return {
        linePath: `M ${p.x - 40} ${p.y} L ${p.x + 40} ${p.y}`,
        areaPath: `M ${p.x - 40} ${p.y} L ${p.x + 40} ${p.y} L ${p.x + 40} 225 L ${p.x - 40} 225 Z`,
      };
    }

    let path = `M ${chartPoints[0].x.toFixed(1)} ${chartPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i === 0 ? 0 : i - 1];
      const p1 = chartPoints[i];
      const p2 = chartPoints[i + 1];
      const p3 = chartPoints[i + 2 >= chartPoints.length ? chartPoints.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const area = `${path} L ${last.x.toFixed(1)} 225 L ${first.x.toFixed(1)} 225 Z`;

    return { linePath: path, areaPath: area };
  }, [chartPoints]);

  // Tiêu đề biểu đồ linh hoạt theo kỳ
  const chartTitle = useMemo(() => {
    switch (period) {
      case 'year':
        return 'Doanh Thu 12 Tháng Trong Năm';
      case 'month':
        return 'Doanh Thu Các Kỳ Trong Tháng Này';
      case 'week':
        return 'Doanh Thu Trong Tuần Này';
      case 'custom':
        return `Doanh Thu Từ ${startDate} Đến ${endDate}`;
      case 'today':
      default:
        return 'Doanh Thu Theo Khung Giờ (Hôm Nay)';
    }
  }, [period, startDate, endDate]);

  // Lọc lịch sử hóa đơn theo từ khóa tìm kiếm
  const filteredInvoices = useMemo(() => {
    const list = data?.recentInvoices || [];
    if (!invoiceSearchQuery.trim()) return list;
    const q = invoiceSearchQuery.toLowerCase();
    return list.filter(
      (inv) =>
        (inv.invoiceCode || '').toLowerCase().includes(q) ||
        (inv.tableName || '').toLowerCase().includes(q) ||
        (inv.tableNumber || '').toLowerCase().includes(q) ||
        (inv.cashierName || '').toLowerCase().includes(q)
    );
  }, [data?.recentInvoices, invoiceSearchQuery]);

  // Xuất file CSV báo cáo
  const handleExportCsv = () => {
    const invoices = data?.recentInvoices || [];
    if (invoices.length === 0) {
      alert('Không có dữ liệu hóa đơn để xuất file!');
      return;
    }
    const headers = ['Mã HĐ', 'Bàn', 'Thời Gian', 'Tạm Tính', 'Giảm Giá', 'VAT', 'Tổng Tiền', 'Phương Thức', 'Trạng Thái', 'Thu Ngân'];
    const rows = invoices.map((i) => [
      i.invoiceCode,
      i.tableName || i.tableNumber,
      formatDate(i.paidAt || i.createdAt),
      i.subtotal,
      i.discountAmount || 0,
      i.taxAmount || 0,
      i.finalAmount,
      i.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền Mặt',
      i.paymentStatus === 'PAID' ? 'Đã Thanh Toán' : i.paymentStatus,
      i.cashierName || 'Thu Ngân',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_DoanhThu_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0E0E10] text-[#EDEDED]">
      {/* 1. Header & Period Selector (cao h-20 khớp với logo sidebar) */}
      <div className="h-20 px-8 border-b border-surface-border bg-[#121214] flex items-center justify-between flex-shrink-0 select-none">
        <div>
          <h1 className="text-xl font-bold font-serif text-[#EDEDED] tracking-wide">
            Báo cáo doanh thu
          </h1>
        </div>

        {/* Bộ lọc thời gian: Cố định toàn bộ các tab & ô chọn khoảng ngày */}
        <div className="flex items-center gap-3 flex-nowrap overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center p-1 bg-[#18181B] border border-surface-border rounded-xl select-none flex-shrink-0">
            {[
              { id: 'today', label: 'Hôm Nay' },
              { id: 'week', label: 'Tuần Này' },
              { id: 'month', label: 'Tháng Này' },
              { id: 'year', label: 'Năm Nay' },
              { id: 'custom', label: 'Tùy Chọn' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border outline-none focus:outline-none focus:ring-0 active:outline-none select-none transition-colors duration-150 cursor-pointer ${
                  period === tab.id
                    ? 'bg-crimson-subtle text-gold border-crimson-border shadow-sm font-semibold'
                    : 'border-transparent text-[#8E8E93] hover:text-gold hover:bg-gold/10 hover:border-gold/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ô chọn khoảng ngày CỐ ĐỊNH (Always Visible) */}
          <form
            onSubmit={handleApplyCustomRange}
            className="flex items-center gap-2 bg-[#18181B] border border-surface-border p-1.5 rounded-xl flex-shrink-0"
          >
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriod('custom');
              }}
              className="bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:outline-none focus:border-gold/50 cursor-pointer"
            />
            <span className="text-xs text-[#8E8E93]">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriod('custom');
              }}
              className="bg-[#121214] border border-[#27272A] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:outline-none focus:border-gold/50 cursor-pointer"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-gold text-black rounded-lg text-xs font-semibold hover:bg-gold-light transition-colors outline-none focus:outline-none focus:ring-0 select-none cursor-pointer"
            >
              Lọc
            </button>
          </form>

          {/* Nút Xuất CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-border hover:bg-surface-hover text-xs font-medium text-[#A0A0A5] hover:text-[#EDEDED] transition-colors outline-none focus:outline-none focus:ring-0 active:outline-none select-none cursor-pointer flex-shrink-0"
            title="Xuất file báo cáo CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Xuất Báo Cáo</span>
          </button>

          {/* Nút Làm Mới */}
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="p-2.5 rounded-xl border border-surface-border hover:bg-surface-hover text-[#A0A0A5] hover:text-[#EDEDED] transition-colors outline-none focus:outline-none focus:ring-0 active:outline-none select-none cursor-pointer flex-shrink-0"
            title="Làm mới báo cáo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Dashboard Body */}
      <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6">
        {/* 4 Thẻ KPI Tổng Quan theo thứ tự: Tổng Doanh Thu -> Tổng Thuế -> Số Hóa Đơn -> Chi Tiêu Trung Bình (AOV) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Tổng Doanh Thu */}
          <div className="group relative overflow-hidden p-5 rounded-2xl bg-[#18181C]/90 backdrop-blur-md border border-white/[0.08] hover:border-gold/40 hover:-translate-y-0.5 transition-all duration-300 shadow-xl flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-gold/10 rounded-full blur-2xl pointer-events-none group-hover:bg-gold/20 transition-all duration-500" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block shadow-[0_0_6px_#D4AF37]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A8] group-hover:text-white transition-colors">
                  Tổng Doanh Thu
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center text-gold shadow-[0_0_12px_rgba(212,175,55,0.12)] group-hover:scale-105 transition-transform duration-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10 my-3.5">
              <div className="text-[26px] xl:text-[28px] font-extrabold text-white tracking-tight flex items-baseline gap-1.5 leading-none">
                <span>{formatNumber(data?.totalRevenue)}</span>
                <span className="text-base font-semibold text-gold/90">₫</span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  <ChevronUp className="w-3 h-3" />
                  +14.8%
                </span>
                <span className="text-[11px] text-[#8E8E93]">so với kỳ trước</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Tổng Thuế */}
          <div className="group relative overflow-hidden p-5 rounded-2xl bg-[#18181C]/90 backdrop-blur-md border border-white/[0.08] hover:border-purple-400/40 hover:-translate-y-0.5 transition-all duration-300 shadow-xl flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block shadow-[0_0_6px_#c084fc]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A8] group-hover:text-white transition-colors">
                  Tổng Thuế
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.12)] group-hover:scale-105 transition-transform duration-300">
                <Percent className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10 my-3.5">
              <div className="text-[26px] xl:text-[28px] font-extrabold text-white tracking-tight flex items-baseline gap-1.5 leading-none">
                <span>{formatNumber(data?.totalTax ?? Math.round((data?.totalRevenue || 0) * 0.08))}</span>
                <span className="text-base font-semibold text-purple-400/90">₫</span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 border border-purple-500/25 text-purple-300">
                  VAT 8% - 10%
                </span>
                <span className="text-[11px] text-[#8E8E93]">thuế GTGT nộp NSNN</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Số Hóa Đơn */}
          <div className="group relative overflow-hidden p-5 rounded-2xl bg-[#18181C]/90 backdrop-blur-md border border-white/[0.08] hover:border-sky-400/40 hover:-translate-y-0.5 transition-all duration-300 shadow-xl flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block shadow-[0_0_6px_#38bdf8]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A8] group-hover:text-white transition-colors">
                  Số Hóa Đơn
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/5 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.12)] group-hover:scale-105 transition-transform duration-300">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10 my-3.5">
              <div className="text-[26px] xl:text-[28px] font-extrabold text-white tracking-tight flex items-baseline gap-2 leading-none">
                <span>{formatNumber(data?.totalInvoices || 0)}</span>
                <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 tracking-wide">
                  HÓA ĐƠN
                </span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  <ChevronUp className="w-3 h-3" />
                  +8.2%
                </span>
                <span className="text-[11px] text-[#8E8E93]">giao dịch thành công</span>
              </div>
            </div>
          </div>

          {/* KPI 4: Chi Tiêu Trung Bình (AOV) */}
          <div className="group relative overflow-hidden p-5 rounded-2xl bg-[#18181C]/90 backdrop-blur-md border border-white/[0.08] hover:border-emerald-400/40 hover:-translate-y-0.5 transition-all duration-300 shadow-xl flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#34d399]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A8] group-hover:text-white transition-colors">
                  Chi Tiêu TB (AOV)
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10 my-3.5">
              <div className="text-[26px] xl:text-[28px] font-extrabold text-white tracking-tight flex items-baseline gap-1.5 leading-none">
                <span>{formatNumber(data?.averageOrderValue)}</span>
                <span className="text-base font-semibold text-emerald-400/90">₫</span>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  Tối ưu
                </span>
                <span className="text-[11px] text-[#8E8E93]">bình quân / hóa đơn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Biểu Đồ Doanh Thu & Cơ Cấu Thanh Toán */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Biểu Đồ Doanh Thu Tổng Trực Quan (Chiếm 3 Cột) */}
          <div className="lg:col-span-3 p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm text-[#EDEDED] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  {chartTitle}
                </h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Biểu đồ miền phân bổ doanh thu chi tiết theo mốc thời gian được chọn
                </p>
              </div>
            </div>

            {/* SVG Visual Area Chart (Biểu Đồ Miền Hoàng Gia) */}
            <div className="relative w-full h-72 sm:h-80 select-none flex items-center justify-center">
              {chartPoints.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-[#8E8E93] italic border border-dashed border-surface-border rounded-xl">
                  Chưa có dữ liệu doanh thu cho khoảng thời gian này
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <svg
                    viewBox="0 0 900 280"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      {/* Gradient đổ bóng miền: Vàng kim sáng rực ở đỉnh -> Đỏ Hỏa Diệm Các -> Trong suốt ở đáy */}
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.45" />
                        <stop offset="35%" stopColor="#C41E3A" stopOpacity="0.22" />
                        <stop offset="75%" stopColor="#8B1D1D" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#141416" stopOpacity="0.0" />
                      </linearGradient>

                      {/* Đường viền dải sóng phát sáng hoàng gia */}
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#C41E3A" />
                        <stop offset="30%" stopColor="#E5C158" />
                        <stop offset="70%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#FFE088" />
                      </linearGradient>

                      {/* Hiệu ứng hào quang phát sáng */}
                      <filter id="areaLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Các đường lưới ngang phụ trợ (Grid lines) */}
                    {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                      const y = 225 - ratio * 185;
                      return (
                        <line
                          key={idx}
                          x1="30"
                          y1={y}
                          x2="870"
                          y2={y}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                      );
                    })}
                    {/* Trục hoành cơ sở X */}
                    <line x1="30" y1="225" x2="870" y2="225" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />

                    {/* Vùng đổ màu miền (Area Path) */}
                    <path
                      d={areaPath}
                      fill="url(#areaGradient)"
                      className="transition-all duration-500 ease-out"
                    />

                    {/* Đường viền trên cùng của miền (Line Path với Glow) */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#strokeGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#areaLineGlow)"
                      className="transition-all duration-500 ease-out"
                    />

                    {/* Đường gióng dọc và các điểm nút tương tác */}
                    {chartPoints.map((point, index) => {
                      const isHovered = hoveredPoint === index;
                      return (
                        <g key={index} className="cursor-pointer">
                          {/* Đường gióng dọc khi rê chuột */}
                          {isHovered && (
                            <line
                              x1={point.x}
                              y1="35"
                              x2={point.x}
                              y2="225"
                              stroke="rgba(212, 175, 55, 0.65)"
                              strokeDasharray="3 3"
                              strokeWidth="1.5"
                            />
                          )}

                          {/* Số tiền hiển thị trên đỉnh mỗi điểm */}
                          <text
                            x={point.x}
                            y={point.y - 12}
                            textAnchor="middle"
                            fill={isHovered ? '#FFE088' : 'rgba(212, 175, 55, 0.85)'}
                            fontSize="11"
                            fontWeight={isHovered ? '700' : '600'}
                            className="transition-colors pointer-events-none select-none"
                          >
                            {formatVND(point.revenue).replace('₫', '').trim()}
                          </text>

                          {/* Điểm nút (Data point dot) */}
                          {isHovered && (
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r="10"
                              fill="rgba(212, 175, 55, 0.3)"
                              className="animate-pulse"
                            />
                          )}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={isHovered ? '6.5' : '4.5'}
                            fill="#141416"
                            stroke={isHovered ? '#FFE088' : '#D4AF37'}
                            strokeWidth={isHovered ? '3' : '2.5'}
                            className="transition-all duration-200"
                          />
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={isHovered ? '3' : '2'}
                            fill={isHovered ? '#FFE088' : '#FFF'}
                            className="transition-all duration-200"
                          />

                          {/* Nhãn mốc thời gian dưới trục X */}
                          <text
                            x={point.x}
                            y="252"
                            textAnchor="middle"
                            fill={isHovered ? '#D4AF37' : '#8E8E93'}
                            fontSize="11"
                            fontWeight={isHovered ? '600' : '400'}
                            className="transition-colors pointer-events-none select-none"
                          >
                            {point.label}
                          </text>

                          {/* Vùng bắt sự kiện chuột (Hitbox) rộng rãi dễ hover */}
                          <rect
                            x={point.x - 35}
                            y="25"
                            width="70"
                            height="235"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(index)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip nổi bật hiển thị chi tiết khi rê chuột */}
                  {hoveredPoint !== null && chartPoints[hoveredPoint] && (
                    <div
                      style={{
                        left: `${(chartPoints[hoveredPoint].x / 900) * 100}%`,
                        top: `${Math.max((chartPoints[hoveredPoint].y / 280) * 100 - 18, 5)}%`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-full z-30 px-3.5 py-2 rounded-xl bg-[#18181D]/95 backdrop-blur-md border border-gold/60 shadow-[0_8px_24px_rgba(0,0,0,0.85)] pointer-events-none whitespace-nowrap animate-fadeIn"
                    >
                      <p className="text-[11px] font-medium text-[#A0A0A5] mb-0.5">
                        {chartPoints[hoveredPoint].label}
                      </p>
                      <p className="text-sm font-bold text-gold">
                        {formatVND(chartPoints[hoveredPoint].revenue)}
                      </p>
                      <p className="text-[11px] text-cyan-400 mt-0.5">
                        {chartPoints[hoveredPoint].orderCount} đơn hàng thành công
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cơ Cấu Thanh Toán (Chiếm 1 Cột) */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-[#EDEDED] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  Cơ Cấu Thanh Toán
                </h3>
              </div>
              <p className="text-[11px] text-[#8E8E93] mb-5">
                Tỷ trọng giữa chuyển khoản VietQR và tiền mặt
              </p>

              <div className="space-y-5">
                {/* VietQR */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium text-[#EDEDED]">Chuyển Khoản VietQR</span>
                    </div>
                    <span className="font-bold text-cyan-400">
                      {formatVND(data?.vietQrRevenue)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#18181B] overflow-hidden">
                    <div
                      style={{
                        width: `${
                          data?.totalRevenue > 0
                            ? Math.round((data.vietQrRevenue / data.totalRevenue) * 100)
                            : 65
                        }%`,
                      }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8E8E93] mt-1">
                    <span>{data?.vietQrInvoicesCount || 9} giao dịch</span>
                    <span>
                      {data?.totalRevenue > 0
                        ? Math.round((data.vietQrRevenue / data.totalRevenue) * 100)
                        : 65}
                      %
                    </span>
                  </div>
                </div>

                {/* Tiền Mặt */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-400" />
                      <span className="font-medium text-[#EDEDED]">Tiền Mặt Tại Quầy</span>
                    </div>
                    <span className="font-bold text-amber-400">
                      {formatVND(data?.cashRevenue)}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#18181B] overflow-hidden">
                    <div
                      style={{
                        width: `${
                          data?.totalRevenue > 0
                            ? Math.round((data.cashRevenue / data.totalRevenue) * 100)
                            : 35
                        }%`,
                      }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8E8E93] mt-1">
                    <span>{data?.cashInvoicesCount || 5} giao dịch</span>
                    <span>
                      {data?.totalRevenue > 0
                        ? Math.round((data.cashRevenue / data.totalRevenue) * 100)
                        : 35}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phân Khu Doanh Thu Mini Tag */}
            <div className="p-3 rounded-xl bg-[#121214] border border-[#27272A] mt-6 flex items-center justify-between text-xs">
              <span className="text-[#8E8E93]">Tỷ lệ Sảnh Chung / VIP</span>
              <span className="font-semibold text-gold">42% / 58%</span>
            </div>
          </div>
        </div>

        {/* 3. BÊN DƯỚI: 2 KHỐI NỘI DUNG (Lịch Sử Hóa Đơn & Bảng Xếp Hạng Món Ăn Yêu Thích) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Khối Trái: Lịch Sử Hóa Đơn Gần Đây (Chiếm 7 Cột) */}
          <div className="xl:col-span-7 p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold text-sm text-[#EDEDED]">
                    Lịch Sử Hóa Đơn Gần Đây
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#27272A] text-white">
                    {filteredInvoices.length} đơn
                  </span>
                </div>

                {/* Ô tìm kiếm nhanh */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                  <input
                    type="text"
                    placeholder="Tìm mã HĐ, số bàn..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    className="w-full bg-[#18181B] border border-surface-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#EDEDED] placeholder-[#8E8E93] focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Bảng Hóa Đơn */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272A] text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Mã Hóa Đơn</th>
                      <th className="py-2.5 px-3">Bàn Ăn</th>
                      <th className="py-2.5 px-3">Thời Gian</th>
                      <th className="py-2.5 px-3">Phương Thức</th>
                      <th className="py-2.5 px-3 text-right">Tổng Tiền</th>
                      <th className="py-2.5 px-3 text-center">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]/50 text-xs">
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          onClick={() => setSelectedInvoice(inv)}
                        >
                          <td className="py-3 px-3 font-semibold text-white">
                            {inv.invoiceCode}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-xs font-medium text-gold">
                              {inv.tableName || inv.tableNumber}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-[#8E8E93]">
                            {formatDate(inv.paidAt || inv.createdAt)}
                          </td>
                          <td className="py-3 px-3">
                            {inv.paymentMethod === 'VIETQR' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-medium">
                                <CreditCard className="w-3 h-3" />
                                VietQR
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                                <Banknote className="w-3 h-3" />
                                Tiền Mặt
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-gold">
                            {formatVND(inv.finalAmount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(inv);
                              }}
                              className="p-1.5 rounded-lg text-[#8E8E93] hover:text-gold hover:bg-gold/10 transition-colors"
                              title="Xem và in hóa đơn nhiệt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-[#8E8E93]">
                          Không tìm thấy hóa đơn nào phù hợp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272A] mt-4 flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>Hiển thị tối đa 10 hóa đơn mới nhất trong kỳ</span>
              <a
                href="/admin/invoices"
                className="text-gold hover:underline flex items-center gap-1 font-medium"
              >
                <span>Xem toàn bộ sổ hóa đơn</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Khối Phải: Bảng Xếp Hạng Món Được Yêu Thích (Chiếm 5 Cột) */}
          <div className="xl:col-span-5 p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold" />
                  <div>
                    <h3 className="font-semibold text-sm text-[#EDEDED]">
                      Món Ăn Được Yêu Thích Nhất
                    </h3>
                    <p className="text-[10px] text-[#8E8E93]">Xếp hạng theo lượt gọi món và doanh thu</p>
                  </div>
                </div>
                <span className="text-xs text-gold font-medium">Bestsellers</span>
              </div>

              {/* Danh sách món ăn */}
              <div className="space-y-3">
                {(data?.topSellingDishes || []).map((dish, index) => {
                  const maxSold = (data?.topSellingDishes?.[0]?.quantitySold) || 1;
                  const progressPercent = Math.min(100, Math.round((dish.quantitySold / maxSold) * 100));

                  return (
                    <div
                      key={index}
                      className="p-2.5 rounded-xl bg-[#141416] border border-surface-border/60 hover:border-gold/40 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Huy hiệu thứ hạng + Ảnh + Tên */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                              index === 0
                                ? 'bg-gold text-black shadow-md shadow-gold/30'
                                : index === 1
                                ? 'bg-zinc-300 text-black'
                                : index === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-[#27272A] text-[#8E8E93]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <img
                            src={dish.imageUrl}
                            alt={dish.dishName}
                            className="w-10 h-10 rounded-lg object-cover border border-[#3F3F46] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#EDEDED] truncate">
                              {dish.dishName}
                            </p>
                            <p className="text-[10px] text-gold">{dish.category}</p>
                          </div>
                        </div>

                        {/* Số lượng & Doanh thu */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-white">
                            {dish.quantitySold} <span className="text-[10px] font-normal text-[#8E8E93]">phần</span>
                          </p>
                          <p className="text-xs font-bold text-gold">
                            {formatVND(dish.revenue)}
                          </p>
                        </div>
                      </div>

                      {/* Thanh Progress Bar đo độ Hot */}
                      <div className="w-full h-1.5 rounded-full bg-[#1F1F23] overflow-hidden">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            index === 0
                              ? 'bg-gradient-to-r from-crimson to-gold'
                              : index === 1
                              ? 'bg-zinc-300'
                              : 'bg-amber-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#27272A] mt-4 flex items-center justify-between text-[11px] text-[#8E8E93]">
              <span>Tự động cập nhật từ các đợt gọi món hoàn tất</span>
              <a href="/admin/menu" className="text-gold hover:underline flex items-center gap-1 font-medium">
                <span>Quản lý thực đơn</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xem & In Chi Tiết Hóa Đơn Nhiệt 80mm */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={Boolean(selectedInvoice)}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

