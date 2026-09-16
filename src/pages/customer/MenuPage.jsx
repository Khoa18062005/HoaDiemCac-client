import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Utensils } from 'lucide-react';
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
import {
  getStoredTableSession,
  saveTableSession,
  clearTableSession,
  tableApi,
} from '@/features/tables/api/tableApi';
import { menuApi } from '@/features/menu';

/**
 * MenuPage (Customer Responsive với ScrollSpy 2 chiều)
 * Màn hình gọi món chính thích ứng linh hoạt trên cả 3 nền tảng:
 * - Điện thoại (Mobile): Split view dọc gọn gàng + giỏ hàng nổi chân trang.
 * - Máy tính bảng (iPad): Lưới 2 cột món ăn rộng rãi + giỏ hàng nổi chân trang.
 * - Máy tính/Laptop (Desktop): Bố cục 3 cột (Danh mục - Lưới món ăn - Bảng giỏ hàng cố định bên phải).
 *
 * Tích hợp tự động tải thực đơn trực tiếp từ Database MySQL (API /api/v1/menu-items).
 */
export default function MenuPage() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const normalizeTableNumber = (raw) => {
    if (!raw) return 'B01';
    const upper = raw.toUpperCase().trim();
    if (/^\d+$/.test(upper)) {
      return `B${upper.padStart(2, '0')}`;
    }
    return upper;
  };

  const tableNumber = normalizeTableNumber(tableId || searchParams.get('table') || 'B01');

  const [activeCategoryId, setActiveCategoryId] = useState('ban-chay');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(false);

  // Trạng thái Chủ Bàn (Host) & Quản lý thiết bị
  const [isHost, setIsHost] = useState(() => {
    const s = getStoredTableSession();
    return s && s.tableNumber === tableNumber ? (s.isHost ?? true) : false;
  });
  const [deviceCount, setDeviceCount] = useState(1);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);

  // Kiểm tra phiên bàn ăn hợp lệ từ localStorage và đồng bộ trạng thái thiết bị
  useEffect(() => {
    const checkSessionAndDevices = async () => {
      const session = getStoredTableSession();

      // Bắt buộc phải có session VÀ session phải đúng bàn này
      if (!session || !session.sessionToken || session.tableNumber !== tableNumber) {
        setIsPasscodeRequired(true);
        return;
      }

      // Xác thực session với Backend xem bàn có bị khóa hoặc reset không
      try {
        const isValid = await tableApi.validateSession();
        if (!isValid) {
          clearTableSession();
          setIsPasscodeRequired(true);
          return;
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra session bàn ăn:', err.message);
      }

      setIsPasscodeRequired(false);
      if (session.isHost !== undefined) {
        setIsHost(Boolean(session.isHost));
      }

      // Tải danh sách thiết bị kết nối thời gian thực
      try {
        const devices = await tableApi.getDevices(tableNumber);
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
                clearTableSession();
                window.location.reload();
              }
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải danh sách thiết bị:', err.message);
      }
    };

    checkSessionAndDevices();
    const interval = setInterval(checkSessionAndDevices, 5000);
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

  // State lưu dữ liệu từ Database
  const [dbItems, setDbItems] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refs cho cơ chế ScrollSpy đồng bộ 2 chiều
  const scrollContainerRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Tải danh sách món ăn và danh mục từ Database
  useEffect(() => {
    let isMounted = true;
    const loadMenuFromDB = async () => {
      try {
        setLoading(true);
        const [items, cats] = await Promise.all([
          menuApi.getMenuItems(),
          menuApi.getCategories().catch(() => []),
        ]);
        if (isMounted) {
          if (Array.isArray(items) && items.length > 0) {
            setDbItems(items);
          }
          if (Array.isArray(cats) && cats.length > 0) {
            setDbCategories(cats);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải thực đơn từ Database, dùng dữ liệu mẫu dự phòng:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMenuFromDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hiển thị TẤT CẢ danh mục từ Database trên màn hình khách hàng
  const customerCategories = useMemo(() => {
    if (dbCategories.length > 0) {
      // Lấy toàn bộ danh mục đang hoạt động (isActive !== false)
      const activeCats = dbCategories.filter((c) => c.isActive !== false);
      const mapped = activeCats.map((c) => {
        const slug = (c.slug || '').toLowerCase();
        let icon = 'flame';
        if (slug.includes('lau')) icon = 'pot';
        else if (slug.includes('bo') || slug.includes('thit')) icon = 'beef';
        else if (slug.includes('hai-san') || slug.includes('ca') || slug.includes('tom')) icon = 'seafood';
        else if (slug.includes('vien')) icon = 'meatball';
        else if (slug.includes('rau') || slug.includes('nam')) icon = 'veggie';
        else if (slug.includes('uong') || slug.includes('nuoc') || slug.includes('tra') || slug.includes('bia') || slug.includes('ruou')) icon = 'drink';

        return {
          id: c.slug || String(c.id),
          numericId: c.id,
          name: c.name,
          icon,
          highlight: false,
        };
      });

      return [
        {
          id: 'ban-chay',
          name: 'Bán Chạy',
          icon: 'flame',
          highlight: true,
        },
        ...mapped,
      ];
    }
    return CUSTOMER_CATEGORIES;
  }, [dbCategories]);

  // Danh sách món ăn chuẩn hóa từ Database
  const dishesList = useMemo(() => {
    if (dbItems.length > 0) {
      return dbItems.map((item) => {
        let catId = item.categoryId;
        if (!catId && item.categories && item.categories.length > 0) {
          catId = item.categories[0].slug || item.categories[0].id;
        }
        return {
          id: item.id,
          code: item.code,
          name: item.name,
          categoryId: catId || 'khac',
          categories: item.categories || [],
          subTitle: item.unit || '',
          description: item.description || '',
          price: Number(item.price),
          image: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
          tag: item.isFeatured ? 'Đặc sắc' : null,
          tagType: item.isFeatured ? 'gold' : 'crimson',
          isAvailable: item.isAvailable ?? true,
          isFeatured: item.isFeatured ?? false,
        };
      });
    }
    return mockCustomerDishes;
  }, [dbItems]);

  // Khởi tạo giỏ hàng sẵn món theo thiết kế hoàng triều
  const [cartItems, setCartItems] = useState([
    {
      id: 'c02',
      name: 'Ba Chỉ Bò Mỹ Thượng Hạng',
      price: 220000,
      quantity: 1,
      image: mockCustomerDishes[1]?.image || '',
    },
    {
      id: 'c04',
      name: 'Bò Wagyu A5 Xếp Cánh Sen',
      price: 399000,
      quantity: 1,
      image: mockCustomerDishes[3]?.image || '',
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
      image: mockCustomerDishes[0]?.image || '',
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
      image: mockCustomerDishes[6]?.image || '',
      orderedAt: '12:18',
      status: 'served',
    },
  ]);

  // Chuẩn bị các section danh mục liên tục phục vụ trải nghiệm cuộn liền mạch (Continuous Scroll)
  const categorySections = useMemo(() => {
    // Chỉ hiển thị các món đang mở bán (isAvailable !== false)
    const availableDishes = dishesList.filter((d) => d.isAvailable !== false);

    return customerCategories.map((cat) => {
      let dishes = [];
      if (cat.id === 'ban-chay') {
        // Món Bán Chạy: Lấy các món nổi bật (isFeatured), nếu ít hơn 4 thì lấy thêm các món đầu tiên
        const featured = availableDishes.filter((d) => d.isFeatured);
        dishes = featured.length >= 2 ? featured : availableDishes.slice(0, 6);
      } else {
        dishes = availableDishes.filter((d) => {
          if (d.categoryId === cat.id || String(d.categoryId) === String(cat.id)) return true;
          if (cat.numericId && String(d.categoryId) === String(cat.numericId)) return true;
          if (d.categories && Array.isArray(d.categories)) {
            return d.categories.some(
              (c) => (c.slug && c.slug === cat.id) || String(c.id) === String(cat.id) || (cat.numericId && c.id === cat.numericId)
            );
          }
          return false;
        });
      }

      // Lọc theo từ khóa tìm kiếm nếu có
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        dishes = dishes.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.description && d.description.toLowerCase().includes(q)) ||
            (d.subTitle && d.subTitle.toLowerCase().includes(q))
        );
      }

      return {
        category: cat,
        dishes,
      };
    }).filter((section) => {
      // Khi đang tìm kiếm theo từ khóa thì chỉ hiện các nhóm có món khớp
      if (searchQuery.trim()) {
        return section.dishes.length > 0;
      }
      // Bình thường: hiển thị TẤT CẢ các danh mục trong Database
      return true;
    });
  }, [customerCategories, dishesList, searchQuery]);

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
          categories={customerCategories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
        />

        {/* Cột 2: Danh Sách Món Ăn Cuộn Liền Mạch (Continuous Section Scroll) */}
        <section
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 bg-[#141418] px-3 sm:px-5 py-3 overflow-y-auto no-scrollbar pb-32 lg:pb-8 space-y-7"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFD54F]" />
              <span className="text-xs text-[#D6D3CD] font-medium tracking-wide">
                Đang tải thực đơn Hỏa Diệm Các từ máy chủ...
              </span>
            </div>
          ) : categorySections.length === 0 ? (
            <div className="py-16 text-center text-[#9E9AA0] text-xs">
              Không tìm thấy món ăn phù hợp với từ khóa "{searchQuery}".
            </div>
          ) : (
            categorySections.map(({ category, dishes }) => (
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
                {dishes.length > 0 ? (
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
                ) : (
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#1D1D22]/60 border border-white/5 flex flex-col items-center justify-center text-center gap-1.5 py-6 sm:py-7">
                    <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-0.5">
                      <Utensils className="w-4 h-4 text-gold" />
                    </div>
                    <p className="text-xs font-semibold text-[#FFE088]">
                      Danh mục đang được cập nhật món mới
                    </p>
                    <p className="text-[11px] text-[#9E9AA0] max-w-xs leading-relaxed">
                      Bếp trưởng Hỏa Diệm Các đang chuẩn bị các món ăn đặc sắc cho nhóm thực đơn này.
                    </p>
                  </div>
                )}
              </div>
            ))
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
        onClose={() => {
          navigate(`/table/${tableNumber.toLowerCase()}`);
        }}
        onSuccess={(res) => {
          setIsPasscodeRequired(false);
          setIsHost(Boolean(res?.isHost));
        }}
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
