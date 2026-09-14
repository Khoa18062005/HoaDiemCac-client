import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ORDER_QUANTITY_LIMIT } from '../config/constants';

/**
 * Store quản lý giỏ hàng chung của bàn theo thời gian thực (UC04, QĐ9).
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      note: '',

      /**
       * Thêm món vào giỏ hàng (hoặc cộng dồn số lượng nếu đã có)
       */
      addItem: (menuItem, quantity = 1, note = '') => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.id === menuItem.id && i.note === note);

        let newItems;
        if (existingIndex > -1) {
          newItems = [...items];
          const newQty = Math.min(
            newItems[existingIndex].quantity + quantity,
            ORDER_QUANTITY_LIMIT.MAX
          );
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newQty,
          };
        } else {
          const safeQty = Math.min(
            Math.max(quantity, ORDER_QUANTITY_LIMIT.MIN),
            ORDER_QUANTITY_LIMIT.MAX
          );
          newItems = [
            ...items,
            {
              id: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              unit: menuItem.unit,
              image: menuItem.image || menuItem.imageUrl,
              quantity: safeQty,
              note: note || '',
            },
          ];
        }

        set({ items: newItems });
      },

      /**
       * Cập nhật số lượng món theo ràng buộc QĐ9: 1 <= N <= 99
       */
      updateQuantity: (itemId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          // Nếu giảm về 0 -> xóa món khỏi giỏ
          set({ items: items.filter((i) => i.id !== itemId) });
          return;
        }

        const safeQty = Math.min(
          Math.max(quantity, ORDER_QUANTITY_LIMIT.MIN),
          ORDER_QUANTITY_LIMIT.MAX
        );

        const newItems = items.map((i) =>
          i.id === itemId ? { ...i, quantity: safeQty } : i
        );

        set({ items: newItems });
      },

      /**
       * Xóa một dòng món khỏi giỏ
       */
      removeItem: (itemId) => {
        const { items } = get();
        set({ items: items.filter((i) => i.id !== itemId) });
      },

      /**
       * Đồng bộ giỏ hàng từ Server qua WebSocket (UC04)
       */
      syncCart: (serverCartItems) => {
        if (Array.isArray(serverCartItems)) {
          set({ items: serverCartItems });
        }
      },

      /**
       * Làm sạch giỏ hàng sau khi gửi đơn thành công (UC05)
       */
      clearCart: () => set({ items: [], note: '' }),

      /**
       * Tính tổng số lượng món trong giỏ
       */
      getTotalCount: () => {
        const { items } = get();
        return items.reduce((acc, item) => acc + (item.quantity || 0), 0);
      },

      /**
       * Tính tổng tiền tạm tính trong giỏ
       */
      getTotalAmount: () => {
        const { items } = get();
        return items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
      },
    }),
    {
      name: 'hoadiemcat_cart',
    }
  )
);

export default useCartStore;
