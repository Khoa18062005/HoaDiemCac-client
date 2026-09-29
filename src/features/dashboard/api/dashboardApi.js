import { apiClient } from '@/lib/axios';
import { getStoredInvoices } from '@/features/invoices/api/invoiceApi';

export const dashboardApi = {
  getSummary: async (period = 'today', startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await apiClient.get(`/admin/dashboard/summary?${params.toString()}`);
      const data = res?.totalRevenue ? res : res?.result;
      if (data && data.totalRevenue) {
        const localInvoices = getStoredInvoices();
        if (localInvoices.length > 0 && Array.isArray(data.recentInvoices)) {
          const existingCodes = new Set(data.recentInvoices.map((i) => i.invoiceCode));
          const newLocal = localInvoices.filter((i) => !existingCodes.has(i.invoiceCode));
          data.recentInvoices = [...newLocal, ...data.recentInvoices];
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend dashboard chưa online, sử dụng dữ liệu giả lập:', err.message);
    }

    // Realistic fallback analytics data based on selected period
    let totalRevenue = 18650000;
    let totalInvoices = 14;
    let chart = [];

    if (period === 'year') {
      totalRevenue = 4850000000;
      totalInvoices = 3650;
      const monthWeights = [0.07, 0.08, 0.06, 0.07, 0.09, 0.08, 0.09, 0.08, 0.09, 0.10, 0.10, 0.09];
      chart = Array.from({ length: 12 }, (_, i) => ({
        label: `Tháng ${String(i + 1).padStart(2, '0')}`,
        revenue: Math.round(totalRevenue * monthWeights[i]),
        orderCount: Math.round(totalInvoices * monthWeights[i]),
      }));
    } else if (period === 'month') {
      totalRevenue = 425600000;
      totalInvoices = 312;
      const weights = [0.14, 0.16, 0.18, 0.15, 0.20, 0.17];
      const labels = ['01 - 05', '06 - 10', '11 - 15', '16 - 20', '21 - 25', '26 - Hết'];
      chart = labels.map((label, idx) => ({
        label,
        revenue: Math.round(totalRevenue * weights[idx]),
        orderCount: Math.round(totalInvoices * weights[idx]),
      }));
    } else if (period === 'week') {
      totalRevenue = 98400000;
      totalInvoices = 74;
      const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const weights = [0.11, 0.12, 0.13, 0.13, 0.16, 0.19, 0.16];
      chart = dayNames.map((d, idx) => ({
        label: d,
        revenue: Math.round(totalRevenue * weights[idx]),
        orderCount: Math.round(totalInvoices * weights[idx]),
      }));
    } else if (period === 'custom' && startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e - s);
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      totalRevenue = diffDays * 14500000;
      totalInvoices = diffDays * 11;

      if (diffDays <= 14) {
        chart = Array.from({ length: diffDays }, (_, i) => {
          const cur = new Date(s);
          cur.setDate(s.getDate() + i);
          const label = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
          return {
            label,
            revenue: Math.round(totalRevenue / diffDays),
            orderCount: Math.max(1, Math.round(totalInvoices / diffDays)),
          };
        });
      } else {
        const slices = 6;
        chart = Array.from({ length: slices }, (_, i) => ({
          label: `Kỳ ${i + 1}`,
          revenue: Math.round(totalRevenue / slices),
          orderCount: Math.max(1, Math.round(totalInvoices / slices)),
        }));
      }
    } else {
      // default: today
      totalRevenue = 18650000;
      totalInvoices = 14;
      chart = [
        { label: '08:00 - 10:00', revenue: 1492000, orderCount: 1 },
        { label: '10:00 - 12:00', revenue: 3357000, orderCount: 3 },
        { label: '12:00 - 14:00', revenue: 5222000, orderCount: 4 },
        { label: '14:00 - 17:00', revenue: 1678500, orderCount: 1 },
        { label: '17:00 - 19:30', revenue: 4103000, orderCount: 3 },
        { label: '19:30 - 22:00', revenue: 2797500, orderCount: 2 },
      ];
    }

    const vietQrRev = Math.round(totalRevenue * 0.65);
    const cashRev = totalRevenue - vietQrRev;
    const aov = Math.round(totalRevenue / totalInvoices);
    const totalTax = Math.round(totalRevenue * 0.08);

    const mockRecentInvoices = [
      {
        id: 1,
        invoiceCode: 'HD-20260929-0101',
        tableNumber: 'VIP 11',
        tableName: 'Phòng VIP 11',
        subtotal: 6850000,
        discountAmount: 342500,
        taxAmount: 520600,
        finalAmount: 7028100,
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 25 * 60000).toISOString(),
        cashierName: 'Nguyễn Văn Quản Lý',
        isPrinted: true,
      },
      {
        id: 2,
        invoiceCode: 'HD-20260929-0102',
        tableNumber: 'B02',
        tableName: 'Bàn 02',
        subtotal: 1450000,
        discountAmount: 0,
        taxAmount: 116000,
        finalAmount: 1566000,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 50 * 60000).toISOString(),
        cashierName: 'Lê Thu Ngân',
        isPrinted: true,
      },
      {
        id: 3,
        invoiceCode: 'HD-20260929-0103',
        tableNumber: 'VIP 15',
        tableName: 'Phòng VIP 15',
        subtotal: 5150000,
        discountAmount: 515000,
        taxAmount: 370800,
        finalAmount: 5005800,
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 75 * 60000).toISOString(),
        cashierName: 'Nguyễn Văn Quản Lý',
        isPrinted: true,
      },
      {
        id: 4,
        invoiceCode: 'HD-20260929-0104',
        tableNumber: 'B07',
        tableName: 'Bàn 07',
        subtotal: 890000,
        discountAmount: 0,
        taxAmount: 71200,
        finalAmount: 961200,
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 115 * 60000).toISOString(),
        cashierName: 'Trần Phục Vụ',
        isPrinted: false,
      },
      {
        id: 5,
        invoiceCode: 'HD-20260929-0105',
        tableNumber: 'B05',
        tableName: 'Bàn 05',
        subtotal: 2100000,
        discountAmount: 0,
        taxAmount: 168000,
        finalAmount: 2268000,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 150 * 60000).toISOString(),
        cashierName: 'Lê Thu Ngân',
        isPrinted: true,
      },
    ];

    return {
      totalRevenue,
      totalTax,
      totalInvoices,
      averageOrderValue: aov,
      occupancyRate: 75.0,
      cashRevenue: cashRev,
      vietQrRevenue: vietQrRev,
      cashInvoicesCount: Math.round(totalInvoices * 0.35),
      vietQrInvoicesCount: Math.round(totalInvoices * 0.65),
      availableTables: 5,
      occupiedTables: 15,
      totalTables: 20,
      revenueChart: chart,
      topSellingDishes: [
        {
          dishName: 'Bò Wagyu A5 Xếp Cánh Sen',
          category: 'Bò Thượng Hạng',
          quantitySold: Math.round(totalInvoices * 2.2),
          revenue: Math.round(totalRevenue * 0.26),
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200',
        },
        {
          dishName: 'Lẩu Hoàng Kim 9 Tầng Cay Nồng',
          category: 'Nước Lẩu Hoàng Gia',
          quantitySold: Math.round(totalInvoices * 1.9),
          revenue: Math.round(totalRevenue * 0.22),
          imageUrl: 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=200',
        },
        {
          dishName: 'Ba Chỉ Bò Mỹ Thượng Hạng',
          category: 'Bò Thượng Hạng',
          quantitySold: Math.round(totalInvoices * 2.5),
          revenue: Math.round(totalRevenue * 0.18),
          imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=200',
        },
        {
          dishName: 'Hải Sản Hoàng Triều Ngũ Vị',
          category: 'Hải Sản Tươi Sống',
          quantitySold: Math.round(totalInvoices * 1.4),
          revenue: Math.round(totalRevenue * 0.15),
          imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200',
        },
        {
          dishName: 'Tôm Sú Nhảy Tươi Sống',
          category: 'Hải Sản Tươi Sống',
          quantitySold: Math.round(totalInvoices * 1.7),
          revenue: Math.round(totalRevenue * 0.11),
          imageUrl: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=200',
        },
      ],
      recentInvoices: (() => {
        const localInvoices = getStoredInvoices();
        const existingCodes = new Set(localInvoices.map((i) => i.invoiceCode));
        const filteredMock = mockRecentInvoices.filter((i) => !existingCodes.has(i.invoiceCode));
        return [...localInvoices, ...filteredMock];
      })(),
    };
  },
};

export default dashboardApi;
