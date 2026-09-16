import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CustomerHeader,
  CollaborativeBanner,
  CustomerCategorySidebar,
  CustomerDishCard,
  CustomerBottomCartBar,
  CustomerCartDrawer,
  CustomerCartSidebar,
  CUSTOMER_CATEGORIES,
  CATEGORY_ICONS,
  mockCustomerDishes,
} from '@/features/customer';
import TablePasscodeModal from '@/features/tables/components/TablePasscodeModal';
import TableDevicesModal from '@/features/customer/components/TableDevicesModal';
import { getStoredTableSession, saveTableSession, tableApi } from '@/features/tables/api/tableApi';

/**
 * MenuPage (Customer Responsive với ScrollSpy 2 chiều)
 * Màn hình gọi món chính thích ứng linh hoạt trên cả 3 nền tảng:
 * - Điện thoại (Mobile): Split view dọc gọn gàng + giỏ hàng nổi chân trang.
 * - Máy tính bảng (iPad): Lưới 2 cột món ăn rộng rãi + giỏ hàng nổi chân trang.
 * - Máy tính/Laptop (Desktop): Bố cục 3 cột (Danh mục - Lưới món ăn - Bảng giỏ hàng cố định bên phải).
 *
 * Tính năng ScrollSpy 2 chiều:
 * 1. Cuộn thực đơn -> Tab danh mục bên trái tự động nhảy sáng theo section đang xem.
 * 2. Click tab danh mục bên trái -> Màn hình phải tự động cuộn lướt êm ái đến đúng nhóm món.
 */
export default function MenuPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = tableId || searchParams.get('table') || '08';

  const [activeCategoryId, setActiveCategoryId] = useState('ban-chay');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(false);

  // Trạng thái Chủ Bàn (Host) & Quản lý thiết bị
  const [isHost, setIsHost] = useState(() => getStoredTableSession()?.isHost ?? true);
  const [deviceCount, setDeviceCount] = useState(1);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);

  // Kiểm tra phiên bàn ăn hợp lệ từ localStorage và đồng bộ trạng thái thiết bị
  useEffect(() => {
    const session = getStoredTableSession();
    if (!session || !session.sessionToken) {
      setIsPasscodeRequired(true);
    } else if (session.isHost !== undefined) {
      setIsHost(Boolean(session.isHost));
    }

    // Tải danh sách thiết bị kết nối thời gian thực
    const loadDevices = async () => {
      try {
        const devices = await tableApi.getDevices();
        if (Array.isArray(devices) && devices.length > 0) {
          const activeList = devices.filter((d) => d.isActive);
          setDeviceCount(activeList.length);

          const currentToken = session?.deviceToken;
          if (currentToken) {
            const currentDev = devices.find((d) => d.deviceToken === currentToken);
            if (currentDev) {
              setIsHost(Boolean(currentDev.isHost));
              if (!currentDev.isActive) {
                alert('Thiết bị của bạn đã bị Chủ Bàn hoặc Quản Trị Viên ngắt kết nối khỏi bàn.');
                window.location.reload();
              }
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách thiết bị:', err.message);
      }
    };

    loadDevices();
    const interval = setInterval(loadDevices, 10000);
    return () => clearInterval(interval);
  }, [tableNumber]);

  // Xử lý khi nhượng quyền Chủ Bàn thành công
  const handleHostTransferred = (newHostToken) => {
    setIsHost(false);
    const curr = getStoredTableSession();
    if (curr) {
      saveTableSession({ ...curr, isHost: false });
    }
  };

  // Refs cho cơ chế ScrollSpy đồng bộ 2 chiều
  const scrollContainerRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Khởi tạo giỏ hàng sẵn món theo thiết kế hoàng triều
  const [cartItems, setCartItems] = useState([
    {
      id: 'c02',
      name: 'Ba Chỉ Bò Mỹ Thượng Hạng',
      price: 220000,
      quantity: 1,
      image: mockCustomerDishes[1].image,
    },
    {
      id: 'c04',
      name: 'Bò Wagyu A5 Xếp Cánh Sen',
      price: 399000,
      quantity: 1,
      image: mockCustomerDishes[3].image,
    },
  ]);

  // Danh sách toàn bộ các món đã gửi bếp của bàn (tách biệt từng lần gọi món)
  const [orderedItems, setOrderedItems] = useState([
    {
      entryId: 'ord_init_1',
      dishId: 'c01',
      name: 'Lẩu Cay Tứ Xuyên 9 Ngăn',
      price: 289000,
      quantity: 1,
      note: 'Ít cay',
      image: mockCustomerDishes[0].image,
      orderedAt: '12:15',
      status: 'served', // 'served' (Đã lên bàn) | 'cooking' (Bếp đang nấu)
    },
    {
      entryId: 'ord_init_2',
      dishId: 'c07',
      name: 'Mẹt Rau Nấm Tổng Hợp Thần Nông',
      price: 95000,
      quantity: 1,
      note: '',
      image: mockCustomerDishes[6].image,
      orderedAt: '12:18',
      status: 'served',
    },
  ]);

  // Chuẩn bị các section danh mục liên tục phục vụ trải nghiệm cuộn liền mạch (Continuous Scroll)
  const categorySections = useMemo(() => {
    return CUSTOMER_CATEGORIES.map((cat) => {
      let dishes = [];
      if (cat.id === 'ban-chay') {
        // Món Bán Chạy: Lấy 4 món tiêu biểu đặc sắc nhất
        dishes = [
          mockCustomerDishes[0], // Lẩu Cay Tứ Xuyên 9 Ngăn
          mockCustomerDishes[1], // Ba Chỉ Bò Mỹ Thượng Hạng
          mockCustomerDishes[2], // Khay Hải Sản Tôm Sú
          mockCustomerDishes[3], // Bò Wagyu A5 Xếp Cánh Sen
        ];
      } else {
        dishes = mockCustomerDishes.filter((d) => d.categoryId === cat.id);
      }

      // Lọc theo từ khóa tìm kiếm nếu có
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        dishes = dishes.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            (d.subTitle && d.subTitle.toLowerCase().includes(q))
        );
      }

      return {
        category: cat,
        dishes,
      };
    }).filter((section) => section.dishes.length > 0);
  }, [searchQuery]);

  // Chiều 1: Khi khách bấm vào Tab danh mục bên trái -> Cuộn mượt màn hình bên phải đến đúng nhóm món
  const handleSelectCategory = (categoryId) => {
    setActiveCategoryId(categoryId);
    const container = scrollContainerRef.current;
    const targetElement = document.getElementById(`section-${categoryId}`);

    if (container && targetElement) {
      isProgrammaticScroll.current = true;

      const containerRect = container.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollOffset = targetRect.top - containerRect.top + container.scrollTop - 6;

      container.scrollTo({
        top: Math.max(0, scrollOffset),
        behavior: 'smooth',
      });

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 700);
    }
  };

  // Chiều 2: Khi khách cuộn màn hình bên phải -> Tab danh mục bên trái tự động nhảy sang mục tương ứng (ScrollSpy)
  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    const sections = container.querySelectorAll('[data-category-section]');
    let currentActiveId = null;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const rect = section.getBoundingClientRect();
      const relativeTop = rect.top - containerTop;

      // Section nào đang nằm sát hoặc cuộn qua đỉnh container (<= 140px) sẽ được active
      if (relativeTop <= 140) {
        currentActiveId = section.getAttribute('data-category-section');
      }
    }

    if (currentActiveId && currentActiveId !== activeCategoryId) {
      setActiveCategoryId(currentActiveId);
    }
  };

  // Tính tổng số lượng và giá trị giỏ hàng
  const totalCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cartItems]);

  // Lấy số lượng của từng món trong giỏ hàng (theo id)
  const getDishCartQuantity = (dishId) => {
    const found = cartItems.find((item) => item.id === dishId);
    return found ? found.quantity : 0;
  };

  // Thêm món vào giỏ
  const handleAddToCart = (dish, price) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === dish.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            id: dish.id,
            name: dish.name,
            price: price || dish.price,
            quantity: 1,
            image: dish.image,
          },
        ];
      }
    });
  };

  // Cập nhật số lượng món
  const handleUpdateQuantity = (dishId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(dishId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === dishId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Xóa món khỏi giỏ
  const handleRemoveItem = (dishId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== dishId));
  };

  // Xóa toàn bộ giỏ
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Cập nhật ghi chú riêng cho từng món
  const handleUpdateItemNote = (dishId, note) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, note } : item))
    );
  };

  // Xác nhận gửi bếp: Tạo các bản ghi món riêng biệt cho lần gọi này (không gộp vào lần trước)
  const handleSubmitOrder = (orderData) => {
    const itemsToSubmit = (orderData && orderData.items) ? orderData.items : cartItems;
    if (itemsToSubmit.length === 0) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntries = itemsToSubmit.map((item, idx) => ({
      entryId: `ord_${Date.now()}_${idx}`,
      dishId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      note: item.note || '',
      image: item.image,
      orderedAt: timeStr,
      status: 'cooking', // Bếp đang nấu
    }));

    setOrderedItems((prev) => [...prev, ...newEntries]);
    setCartItems([]);
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-[#0F0F12]">
      {/* 1. Header Thích Ứng (Brand, Search Bar, Table Pill, Cart Button, Host Badge) */}
      <CustomerHeader
        tableNumber={tableNumber}
        cartCount={totalCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isHost={isHost}
        deviceCount={deviceCount}
        onOpenDevices={() => setIsDevicesModalOpen(true)}
      />

      {/* 2. Thanh Thông Báo Thời Gian Thực Cùng Bàn */}
      <CollaborativeBanner collaboratorCount={deviceCount} />

      {/* 3. Khung Chính: Cột Trái Danh Mục + Cột Giữa Cuộn Món (ScrollSpy) + Cột Phải Giỏ Hàng Desktop */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Cột 1: Danh Mục (Thanh Nav cuộn đồng bộ 2 chiều) */}
        <CustomerCategorySidebar
          categories={CUSTOMER_CATEGORIES}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
        />

        {/* Cột 2: Danh Sách Món Ăn Cuộn Liền Mạch (Continuous Section Scroll) */}
        <section
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 bg-[#141418] px-3 sm:px-5 py-3 overflow-y-auto no-scrollbar pb-32 lg:pb-8 space-y-7"
        >
          {categorySections.map(({ category, dishes }) => (
            <div
              key={category.id}
              id={`section-${category.id}`}
              data-category-section={category.id}
              className="space-y-3 pt-1 scroll-mt-2"
            >
              {/* Section Header: Cuộn tự nhiên cùng danh sách món, không ghim đè lên menu */}
              <div className="flex items-center justify-between border-l-4 border-[#C41E3A] pl-2.5 py-1">
                <h2 className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wide text-[#FFE088]">
                  <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[#FFD54F]">
                    {CATEGORY_ICONS[category.icon] || CATEGORY_ICONS.flame}
                  </span>
                  <span>
                    {category.name === 'Bán Chạy' ? 'Món Bán Chạy & Nổi Bật' : category.name}
                  </span>
                </h2>
              </div>

              {/* Lưới Thẻ Món: 1 cột trên Mobile, 2 cột trên iPad & Laptop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-start">
                {dishes.map((dish) => {
                  const cartQuantity = getDishCartQuantity(dish.id);

                  return (
                    <CustomerDishCard
                      key={dish.id}
                      dish={dish}
                      cartQuantity={cartQuantity}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {categorySections.length === 0 && (
            <div className="py-16 text-center text-[#9E9AA0] text-xs">
              Không tìm thấy món ăn phù hợp với từ khóa "{searchQuery}".
            </div>
          )}
        </section>

        {/* Cột 3: Bảng Giỏ Hàng Cố Định Chuyên Biệt Cho Laptop / Desktop */}
        <CustomerCartSidebar
          tableNumber={tableNumber}
          cartItems={cartItems}
          orderedItems={orderedItems}
          isHost={isHost}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onSubmitOrder={handleSubmitOrder}
          onUpdateNote={handleUpdateItemNote}
        />
      </main>

      {/* 4. Thanh Giỏ Hàng Nổi Chân Trang (Chỉ hiện trên Mobile & Tablet) */}
      <CustomerBottomCartBar
        totalCount={totalCount}
        totalAmount={totalAmount}
        isHost={isHost}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 5. Ngăn Kéo Giỏ Hàng & Gửi Bếp (Bottom Sheet cho Mobile & Tablet) */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        orderedItems={orderedItems}
        tableNumber={tableNumber}
        isHost={isHost}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
        onUpdateNote={handleUpdateItemNote}
      />

      {/* 6. Modal Xác Thực Mã PIN Bàn Ăn nếu chưa có phiên hợp lệ */}
      <TablePasscodeModal
        isOpen={isPasscodeRequired}
        tableCode={tableNumber}
        onClose={() => setIsPasscodeRequired(false)}
        onSuccess={() => setIsPasscodeRequired(false)}
      />

      {/* 7. Modal Quản Lý Thiết Bị Kết Nối & Nhượng Quyền Chủ Bàn */}
      <TableDevicesModal
        isOpen={isDevicesModalOpen}
        onClose={() => setIsDevicesModalOpen(false)}
        tableNumber={tableNumber}
        isCurrentHost={isHost}
        onHostTransferred={handleHostTransferred}
      />
    </div>
  );
}
