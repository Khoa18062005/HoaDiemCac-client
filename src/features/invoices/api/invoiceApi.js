import { apiClient } from '@/lib/axios';

export const invoiceApi = {
  // Tìm kiếm danh sách hóa đơn phân trang & lọc
  getInvoices: async (params = {}) => {
    try {
      const res = await apiClient.get('/admin/invoices', { params });
      if (res?.content && Array.isArray(res.content)) return res;
      if (res?.result?.content) return res.result;
    } catch (err) {
      console.warn('Backend hóa đơn chưa online, sử dụng dữ liệu giả lập:', err.message);
    }

    // Mock realistic invoice history data
    const mockInvoices = [
      {
        id: 1,
        invoiceCode: 'HD-20260916-0101',
        tableNumber: 'B02',
        tableName: 'Bàn 02',
        subtotal: 890000,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 8,
        taxAmount: 71200,
        finalAmount: 961200,
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 45 * 60000).toISOString(),
        cashierName: 'Nguyễn Văn Quản Lý',
        transactionRef: 'VQR98234120',
        isPrinted: true,
        items: [
          { name: 'Nước Lẩu Cà Chua Hoàng Gia', quantity: 1, price: 150000 },
          { name: 'Ba Chỉ Bò Mỹ Thượng Hạng', quantity: 2, price: 220000 },
          { name: 'Rau Nấm Thập Cẩm Cung Đình', quantity: 1, price: 110000 },
          { name: 'Mì Tươi Kéo Tay', quantity: 2, price: 35000 },
          { name: 'Trà Sâm Hạt Sen', quantity: 3, price: 40000 },
        ],
      },
      {
        id: 2,
        invoiceCode: 'HD-20260916-0102',
        tableNumber: 'VIP 11',
        tableName: 'Phòng VIP 11',
        subtotal: 6850000,
        discountPercent: 5,
        discountAmount: 342500,
        taxPercent: 8,
        taxAmount: 520600,
        finalAmount: 7028100,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 110 * 60000).toISOString(),
        cashierName: 'Lê Thu Ngân',
        cashReceived: 7100000,
        cashChange: 71900,
        isPrinted: true,
        items: [
          { name: 'Lẩu Hoàng Kim 9 Tầng Cay Nồng', quantity: 2, price: 399000 },
          { name: 'Bò Wagyu A5 Xếp Cánh Sen', quantity: 6, price: 399000 },
          { name: 'Hải Sản Hoàng Triều Ngũ Vị', quantity: 3, price: 489000 },
          { name: 'Tôm Sú Nhảy Tươi Sống', quantity: 4, price: 250000 },
          { name: 'Rượu Quế Hoa Tửu Thượng Hạng', quantity: 2, price: 550000 },
        ],
      },
      {
        id: 3,
        invoiceCode: 'HD-20260916-0103',
        tableNumber: 'B07',
        tableName: 'Bàn 07',
        subtotal: 740000,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 8,
        taxAmount: 59200,
        finalAmount: 799200,
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 180 * 60000).toISOString(),
        cashierName: 'Nguyễn Văn Quản Lý',
        transactionRef: 'VQR98234125',
        isPrinted: true,
        items: [
          { name: 'Nước Lẩu Nấm Dưỡng Sinh', quantity: 1, price: 160000 },
          { name: 'Thăn Bò Úc Ướp Tiêu Đen', quantity: 2, price: 210000 },
          { name: 'Đậu Hũ Phô Mai Nhúng Lẩu', quantity: 2, price: 65000 },
          { name: 'Nước Mơ Ngâm Hoàng Triều', quantity: 2, price: 45000 },
        ],
      },
      {
        id: 4,
        invoiceCode: 'HD-20260916-0104',
        tableNumber: 'VIP 15',
        tableName: 'Phòng VIP 15',
        subtotal: 5150000,
        discountPercent: 10,
        discountAmount: 515000,
        taxPercent: 8,
        taxAmount: 370800,
        finalAmount: 5005800,
        paymentMethod: 'VIETQR',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 240 * 60000).toISOString(),
        cashierName: 'Lê Thu Ngân',
        transactionRef: 'VQR98234130',
        isPrinted: true,
        items: [
          { name: 'Lẩu 4 Ngăn Bát Quái', quantity: 1, price: 280000 },
          { name: 'Bò Wagyu A5 Xếp Cánh Sen', quantity: 4, price: 399000 },
          { name: 'Bào Ngư Sống Thượng Phẩm', quantity: 4, price: 420000 },
          { name: 'Hồng Trà Quýt Sấy Lạnh', quantity: 6, price: 55000 },
        ],
      },
      {
        id: 5,
        invoiceCode: 'HD-20260916-0105',
        tableNumber: 'B03',
        tableName: 'Bàn 03',
        subtotal: 1620000,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: 8,
        taxAmount: 129600,
        finalAmount: 1749600,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        paidAt: new Date(Date.now() - 310 * 60000).toISOString(),
        cashierName: 'Trần Phục Vụ',
        cashReceived: 1800000,
        cashChange: 50400,
        isPrinted: true,
        items: [
          { name: 'Nước Lẩu Tứ Xuyên Siêu Cay', quantity: 1, price: 170000 },
          { name: 'Ba Chỉ Bò Mỹ Thượng Hạng', quantity: 3, price: 220000 },
          { name: 'Thịt Cừu Non Mông Cổ', quantity: 2, price: 280000 },
          { name: 'Nấm Đông Cô Tươi', quantity: 2, price: 65000 },
          { name: 'Bia Thủ Công Hỏa Diệm', quantity: 4, price: 60000 },
        ],
      },
    ];

    return {
      content: mockInvoices,
      totalElements: mockInvoices.length,
      totalPages: 1,
      number: 0,
    };
  },

  // Xem chi tiết hóa đơn
  getInvoiceById: async (id) => {
    try {
      return await apiClient.get(`/admin/invoices/${id}`);
    } catch {
      return null;
    }
  },
};

export default invoiceApi;
