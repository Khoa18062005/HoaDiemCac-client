import React, { useState, useEffect } from 'react';
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
  PieChart
} from 'lucide-react';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('today'); // today, week, month
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getSummary(period);
      setData(res);
    } catch (err) {
      console.error('Lỗi khi tải báo cáo doanh thu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const maxChartRevenue = data?.revenueChart
    ? Math.max(...data.revenueChart.map((c) => Number(c.revenue) || 1), 1)
    : 1;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0E0E10] text-[#EDEDED]">
      {/* 1. Header & Period Selector */}
      <div className="px-8 py-6 border-b border-surface-border bg-[#121214] flex items-center justify-between select-none">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gold/10 border border-gold/20 text-gold">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-serif text-[#EDEDED] tracking-wide">
              Báo Cáo Doanh Thu & Hiệu Quả Kinh Doanh
            </h1>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            Tổng hợp dữ liệu doanh thu thời gian thực, cơ cấu thanh toán và bảng xếp hạng món ăn hoàng triều
          </p>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#18181B] border border-surface-border rounded-xl">
            {[
              { id: 'today', label: 'Hôm Nay' },
              { id: 'week', label: '7 Ngày Qua' },
              { id: 'month', label: 'Tháng Này' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === tab.id
                    ? 'bg-crimson-subtle text-gold border border-crimson-border shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#EDEDED]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl border border-surface-border hover:bg-surface-hover text-[#A0A0A5] hover:text-[#EDEDED] transition-colors"
            title="Làm mới báo cáo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Dashboard Body */}
      <div className="flex-1 px-8 py-6 overflow-y-auto space-y-6">
        {/* 4 Thẻ KPI Tổng Quan */}
        <div className="grid grid-cols-4 gap-4">
          {/* KPI 1: Doanh Thu */}
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold/40 transition-all flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-gold tracking-wider">Doanh Thu Thuần</span>
              <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatVND(data?.totalRevenue)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
                <ChevronUp className="w-3.5 h-3.5" />
                <span>+14.8% so với kỳ trước</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Lượt Khách / Hóa Đơn */}
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold/40 transition-all flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-[#8E8E93] tracking-wider">Lượt Bàn Phục Vụ</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-mono text-white tracking-tight">
                {data?.totalInvoices || 0}{' '}
                <span className="text-xs font-normal text-[#8E8E93]">lượt bàn</span>
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
                <ChevronUp className="w-3.5 h-3.5" />
                <span>+8.2% công suất bàn</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Giá Trị Trung Bình / Hóa Đơn */}
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold/40 transition-all flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-[#8E8E93] tracking-wider">Giá Trị TB / Đơn (AOV)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatVND(data?.averageOrderValue)}
              </p>
              <p className="text-xs text-[#8E8E93] mt-1">Chi tiêu trung bình mỗi bàn</p>
            </div>
          </div>

          {/* KPI 4: Tỷ Lệ Lấp Đầy */}
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold/40 transition-all flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-[#8E8E93] tracking-wider">Tỷ Lệ Bàn Lấp Đầy</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
                {data?.occupancyRate || 75}%
              </p>
              <p className="text-xs text-[#8E8E93] mt-1">
                {data?.occupiedTables || 15} / {data?.totalTables || 20} bàn đang có khách
              </p>
            </div>
          </div>
        </div>

        {/* 2 Khối Đồ Thị & Cơ Cấu Thanh Toán */}
        <div className="grid grid-cols-3 gap-6">
          {/* Biểu Đồ Doanh Thu Theo Giờ (SVG Bar Chart) */}
          <div className="col-span-2 p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-sm text-[#EDEDED] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gold" />
                  Doanh Thu Theo Khung Giờ Cao Điểm
                </h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Phân bổ doanh thu các ca trưa và ca tối tại nhà hàng
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gold/10 text-gold border border-gold/30">
                Thời gian thực
              </span>
            </div>

            {/* SVG Visual Bars */}
            <div className="h-56 flex items-end justify-between gap-4 pt-4 px-2 border-b border-[#27272A] relative">
              {(data?.revenueChart || []).map((point, index) => {
                const heightPercent = Math.max(Math.round((Number(point.revenue) / maxChartRevenue) * 100), 12);
                const isHovered = hoveredPoint === index;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 px-3 py-1.5 rounded-lg bg-zinc-900 border border-gold/50 shadow-xl text-center pointer-events-none whitespace-nowrap animate-fadeIn">
                        <p className="text-[10px] text-[#A0A0A5]">{point.label}</p>
                        <p className="text-xs font-bold font-mono text-gold">{formatVND(point.revenue)}</p>
                      </div>
                    )}

                    {/* Bar Column */}
                    <div className="w-full max-w-[48px] bg-[#1C1C22] rounded-t-xl overflow-hidden flex flex-col justify-end p-1 transition-all">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isHovered
                            ? 'bg-gradient-to-t from-crimson to-gold shadow-lg shadow-gold/20'
                            : 'bg-gradient-to-t from-[#781414] to-[#D4AF37]'
                        }`}
                      />
                    </div>

                    <span className="text-[10px] font-mono text-[#8E8E93] mt-3 group-hover:text-gold transition-colors text-center">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cơ Cấu Thanh Toán (VietQR vs Tiền Mặt) */}
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-[#EDEDED] flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  Cơ Cấu Thanh Toán
                </h3>
              </div>
              <p className="text-[11px] text-[#8E8E93] mb-6">
                Tỷ trọng giữa chuyển khoản VietQR và tiền mặt
              </p>

              {/* Progress Bars */}
              <div className="space-y-5">
                {/* VietQR */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium text-[#EDEDED]">Chuyển Khoản VietQR</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400">
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
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-amber-400" />
                      <span className="font-medium text-[#EDEDED]">Tiền Mặt Tại Quầy</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">
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
              <span className="text-[#8E8E93]">Tỷ lệ Sảnh Chung / Phòng VIP</span>
              <span className="font-semibold text-gold">42% / 58%</span>
            </div>
          </div>
        </div>

        {/* 3. Bảng Xếp Hạng Top 5 Món Ăn Bán Chạy Nhất (Leaderboard) */}
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              <h3 className="font-semibold text-sm text-[#EDEDED]">
                Top Món Ăn Hoàng Gia Bán Chạy Nhất
              </h3>
            </div>
            <span className="text-xs text-[#8E8E93]">Xếp hạng theo số lượt gọi món</span>
          </div>

          <div className="divide-y divide-surface-border/50">
            {(data?.topSellingDishes || []).map((dish, index) => (
              <div
                key={index}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] rounded-xl px-3 transition-colors"
              >
                {/* Ranking & Info */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
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
                    className="w-11 h-11 rounded-lg object-cover border border-[#3F3F46]"
                  />
                  <div>
                    <p className="font-semibold text-xs text-[#EDEDED]">{dish.dishName}</p>
                    <p className="text-[10px] text-gold">{dish.category}</p>
                  </div>
                </div>

                {/* Numbers */}
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="text-xs font-mono font-bold text-white">{dish.quantitySold} phần</p>
                    <p className="text-[10px] text-[#8E8E93]">Đã phục vụ</p>
                  </div>
                  <div className="min-w-[120px]">
                    <p className="text-xs font-mono font-bold text-gold">{formatVND(dish.revenue)}</p>
                    <p className="text-[10px] text-emerald-400">Doanh thu thu về</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
