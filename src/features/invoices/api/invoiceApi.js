import { apiClient } from '@/lib/axios';

const INVOICE_HISTORY_KEY = 'hoadiemcat_invoice_history';

export const getStoredInvoices = () => {
  try {
    const raw = localStorage.getItem(INVOICE_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Lỗi đọc lịch sử hóa đơn từ localStorage:', e);
  }
  return [];
};

export const saveInvoiceToHistory = (newInvoice) => {
  try {
    const current = getStoredInvoices();
    const filtered = current.filter(
      (i) => i.invoiceCode !== newInvoice.invoiceCode && String(i.id) !== String(newInvoice.id)
    );
    const updated = [newInvoice, ...filtered];
    localStorage.setItem(INVOICE_HISTORY_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('invoice_created', { detail: newInvoice }));
    return updated;
  } catch (e) {
    console.warn('Lỗi lưu hóa đơn vào lịch sử:', e);
    return [];
  }
};

export const clearStoredInvoices = () => {
  try {
    localStorage.removeItem(INVOICE_HISTORY_KEY);
  } catch (e) {
    console.warn('Lỗi xóa lịch sử hóa đơn trong localStorage:', e);
  }
};

export const invoiceApi = {
  saveInvoiceToHistory,
  getStoredInvoices,
  clearStoredInvoices,

  // Tìm kiếm danh sách hóa đơn phân trang & lọc từ máy chủ
  getInvoices: async (params = {}) => {
    try {
      const res = await apiClient.get('/admin/invoices', { params });
      let list = [];
      let totalElements = 0;
      let totalPages = 1;
      let number = 0;

      if (res?.content && Array.isArray(res.content)) {
        list = res.content;
        totalElements = res.totalElements ?? list.length;
        totalPages = res.totalPages ?? 1;
        number = res.number ?? 0;
      } else if (res?.result?.content) {
        list = res.result.content;
        totalElements = res.result.totalElements ?? list.length;
        totalPages = res.result.totalPages ?? 1;
        number = res.result.number ?? 0;
      } else if (Array.isArray(res)) {
        list = res;
        totalElements = list.length;
      }

      return {
        content: list,
        totalElements,
        totalPages,
        number,
      };
    } catch (err) {
      console.warn('Lỗi khi tải danh sách hóa đơn từ máy chủ:', err.message);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
      };
    }
  },

  // Xem chi tiết hóa đơn từ máy chủ
  getInvoiceById: async (id) => {
    try {
      const res = await apiClient.get(`/admin/invoices/${id}`);
      return res?.result || res;
    } catch (err) {
      console.error('Không tìm thấy hóa đơn:', err);
      return null;
    }
  },
};

export default invoiceApi;
