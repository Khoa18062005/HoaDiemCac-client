import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store quản lý mã phiên bàn ăn (Dynamic Session Token) cho khách hàng quét mã QR (UC01, QĐ2).
 */
export const useTableSessionStore = create(
  persist(
    (set) => ({
      tableId: null,
      tableNumber: null,
      tableName: null,
      sessionToken: null,
      isOrderLocked: false,
      status: 'AVAILABLE',

      setTableSession: (sessionData) =>
        set({
          tableId: sessionData.tableId || null,
          tableNumber: sessionData.tableNumber || null,
          tableName: sessionData.tableName || null,
          sessionToken: sessionData.sessionToken || null,
          isOrderLocked: Boolean(sessionData.isOrderLocked),
          status: sessionData.status || 'OCCUPIED',
        }),

      setOrderLocked: (isLocked) => set({ isOrderLocked: isLocked }),

      clearTableSession: () =>
        set({
          tableId: null,
          tableNumber: null,
          tableName: null,
          sessionToken: null,
          isOrderLocked: false,
          status: 'AVAILABLE',
        }),
    }),
    {
      name: 'hoadiemcat_table_session',
    }
  )
);

export default useTableSessionStore;
