import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Utensils, Lock, Receipt, ShieldAlert, Bell, Check } from 'lucide-react';
import {
  CustomerHeader,
  CollaborativeBanner,
  CustomerCategorySidebar,
  CustomerDishCard,
  CustomerBottomCartBar,
  CustomerCartDrawer,
  CustomerCartSidebar,
  TableTransferModal,
  CATEGORY_ICONS,
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
import { orderApi } from '@/features/customer/api/orderApi';
import useKdsStore, { normalizeTableCode, playChimeSound } from '@/stores/useKdsStore';
import { wsManager } from '@/lib/websocket';

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
  const currentNormTable = useMemo(() => normalizeTableCode(tableNumber), [tableNumber]);

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
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Trạng thái Bàn bị khóa / Đóng băng order khi nhân viên xem hóa đơn tạm tính hoặc chốt đơn
  const [isOrderLocked, setIsOrderLocked] = useState(() => {
    const s = getStoredTableSession();
    if (s && (s.tableNumber === tableNumber || s.tableNumber === currentNormTable) && s.isOrderLocked) {
      return true;
    }
    try {
      const lockedMap = JSON.parse(localStorage.getItem('hoadiemcat_locked_tables') || '{}');
      if (
        lockedMap[tableNumber.toUpperCase()] ||
        lockedMap[currentNormTable.toUpperCase()]
      ) {
        return true;
      }
    } catch {}
    return false;
  });

  const [serverTableTotal, setServerTableTotal] = useState(0);
  const [calledSupport, setCalledSupport] = useState(false);
  const [isCallingSupport, setIsCallingSupport] = useState(false);

  const handleCallSupportStaff = async () => {
    if (isCallingSupport || calledSupport) return;
    setIsCallingSupport(true);
    try {
      await tableApi.callStaff(tableNumber, 'CALL_STAFF', `Bàn ${tableNumber} cần nhân viên hỗ trợ thanh toán`);
      setCalledSupport(true);
      setTimeout(() => setCalledSupport(false), 5000);
    } catch (e) {
      console.warn('Lỗi gọi nhân viên hỗ trợ:', e);
    } finally {
      setIsCallingSupport(false);
    }
  };

  // Kiểm tra phiên bàn ăn hợp lệ từ localStorage và đồng bộ trạng thái thiết bị
  useEffect(() => {
    let isMounted = true;

    const checkSessionAndDevices = async () => {
      // 1. Luôn kiểm tra trạng thái khóa order của bàn từ Server trước
      let isTableLocked = false;
      try {
        const info = await tableApi.getTablePublicInfo(tableNumber);
        if (info && info.isOrderLocked !== undefined) {
          isTableLocked = Boolean(info.isOrderLocked);
          if (isMounted) setIsOrderLocked(isTableLocked);
        }
        if (info && info.totalAmount !== undefined) {
          if (isMounted) setServerTableTotal(Number(info.totalAmount) || 0);
        }
      } catch (err) {
        try {
          const lockedMap = JSON.parse(localStorage.getItem('hoadiemcat_locked_tables') || '{}');
          if (
            lockedMap[tableNumber.toUpperCase()] ||
            lockedMap[currentNormTable.toUpperCase()]
          ) {
            isTableLocked = true;
            if (isMounted) setIsOrderLocked(true);
          }
        } catch {}
      }

      // NẾU BÀN ĐANG TRONG QUÁ TRÌNH THANH TOÁN / KHÓA ORDER:
      // Tuyệt đối không bao giờ hiển thị popup nhập mã PIN!
      if (isTableLocked || isOrderLocked) {
        if (isMounted) setIsPasscodeRequired(false);
        return;
      }

      // 2. Nếu bàn bình thường (không bị khóa), mới kiểm tra session
      const session = getStoredTableSession();
      if (!session || !session.sessionToken || session.tableNumber !== tableNumber) {
        if (isMounted) setIsPasscodeRequired(true);
        return;
      }

      // 3. Xác thực session với Backend
      try {
        const isValid = await tableApi.validateSession();
        if (!isValid) {
          if (isTableLocked || isOrderLocked) {
            if (isMounted) setIsPasscodeRequired(false);
            return;
          }
          clearTableSession();
          if (isMounted) setIsPasscodeRequired(true);
          return;
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra session bàn ăn:', err.message);
      }

      if (isMounted) {
        setIsPasscodeRequired(false);
        if (session.isHost !== undefined) {
          setIsHost(Boolean(session.isHost));
        }
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
    const interval = setInterval(checkSessionAndDevices, 4000);
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

  // Lắng nghe sự kiện Khóa Order / Đóng Băng tức thời 0ms giữa các tab
  useEffect(() => {
    // 1. BroadcastChannel (đồng bộ các tab trên cùng máy)
    let channel;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        channel = new BroadcastChannel('hoadiemcat_table_sync');
        channel.onmessage = (event) => {
          const data = event.data;
          if (!data) return;
          const targetNum = (data.tableNumber || '').toUpperCase().trim();
          if (
            targetNum === tableNumber.toUpperCase().trim() ||
            targetNum === currentNormTable.toUpperCase().trim()
          ) {
            if (data.type === 'ORDER_LOCKED') {
              setIsOrderLocked(Boolean(data.isOrderLocked));
              if (data.isOrderLocked) {
                setCartTab('all');
              }
            }
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel error:', err);
    }

    // 2. CustomEvent 'table_order_locked'
    const handleLockEvent = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const targetNum = (detail.tableNumber || '').toUpperCase().trim();
      if (
        targetNum === tableNumber.toUpperCase().trim() ||
        targetNum === currentNormTable.toUpperCase().trim()
      ) {
        setIsOrderLocked(Boolean(detail.isOrderLocked));
        if (detail.isOrderLocked) {
          setCartTab('all');
        }
      }
    };

    // 3. Storage event
    const handleStorageChange = (e) => {
      if (e.key === 'hoadiemcat_locked_tables') {
        try {
          const map = JSON.parse(e.newValue || '{}');
          if (map[tableNumber.toUpperCase()] !== undefined) {
            setIsOrderLocked(Boolean(map[tableNumber.toUpperCase()]));
            if (map[tableNumber.toUpperCase()]) {
              setCartTab('all');
            }
          }
        } catch {}
      }
      if (e.key === 'hoadiemcat_table_session') {
        try {
          const s = JSON.parse(e.newValue || '{}');
          if (s.tableNumber === tableNumber && s.isOrderLocked !== undefined) {
            setIsOrderLocked(Boolean(s.isOrderLocked));
            if (s.isOrderLocked) {
              setCartTab('all');
            }
          }
        } catch {}
      }
    };

    window.addEventListener('table_order_locked', handleLockEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('table_order_locked', handleLockEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [tableNumber, currentNormTable]);

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
          if (Array.isArray(items)) {
            setDbItems(items);
          }
          if (Array.isArray(cats)) {
            setDbCategories(cats);
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải thực đơn từ Database:', err);
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
    return [
      {
        id: 'ban-chay',
        name: 'Bán Chạy',
        icon: 'flame',
        highlight: true,
      },
    ];
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
    return [];
  }, [dbItems]);

  // Khởi tạo giỏ hàng rỗng ban đầu cho khách hàng
  const [cartItems, setCartItems] = useState([]);

  // Quản lý tab giỏ hàng đang kích hoạt ('draft': Chọn món | 'all': Tất cả)
  const [cartTab, setCartTab] = useState('draft');

  // Quản lý đơn món thời gian thực từ KDS Store
  const allOrders = useKdsStore((state) => state.orders);
  const submitCustomerOrder = useKdsStore((state) => state.submitCustomerOrder);
  const lastBroadcastEvent = useKdsStore((state) => state.lastBroadcastEvent);

  // Đồng bộ đơn hàng từ Server MySQL & Lắng nghe WebSocket thời gian thực (Hỗ trợ đa máy tính)
  useEffect(() => {
    let isMounted = true;

    // 1. Tải danh sách đơn từ Server MySQL
    const syncTableOrders = async () => {
      try {
        let serverOrders = await orderApi.getTableOrders(tableNumber);
        if ((!serverOrders || serverOrders.length === 0) && currentNormTable !== tableNumber) {
          serverOrders = await orderApi.getTableOrders(currentNormTable);
        }
        if (isMounted && Array.isArray(serverOrders)) {
          useKdsStore.getState().syncTableOrders(currentNormTable, serverOrders);
        }
      } catch (err) {
        console.warn('Lỗi khi tải đơn hàng của bàn từ server:', err);
      }
    };

    syncTableOrders();

    // 2. Lắng nghe WebSocket qua kênh /topic/table/{tableNumber}/status
    const handleRemoteUpdate = (payload) => {
      if (!payload) return;

      if (payload.isOrderLocked !== undefined) {
        setIsOrderLocked(Boolean(payload.isOrderLocked));
        if (payload.isOrderLocked) {
          setCartTab('all');
        }
        const s = getStoredTableSession();
        if (s && s.tableNumber === tableNumber) {
          saveTableSession({ ...s, isOrderLocked: Boolean(payload.isOrderLocked) });
        }
      }

      if (payload.type === 'KITCHEN_ITEM_STATUS_TOGGLED' || payload.type === 'WAITER_ITEM_DELIVERED') {
        useKdsStore.getState().applyRemoteItemStatusUpdate(payload);
      } else if (payload.type === 'WAITER_ALL_ITEMS_DELIVERED') {
        useKdsStore.getState().deliverAllReadyItems(payload.orderId);
      } else {
        syncTableOrders();
      }
    };

    const unsub1 = wsManager.subscribe(`/topic/table/${tableNumber}/status`, handleRemoteUpdate);
    const unsub2 = (tableNumber !== currentNormTable)
      ? wsManager.subscribe(`/topic/table/${currentNormTable}/status`, handleRemoteUpdate)
      : null;

    // Lắng nghe kênh tổng /topic/tables
    const unsubTables = wsManager.subscribe('/topic/tables', (tableData) => {
      if (!tableData) return;
      const tNum = (tableData.tableNumber || '').toUpperCase().trim();
      if (tNum === tableNumber.toUpperCase().trim() || tNum === currentNormTable.toUpperCase().trim()) {
        if (tableData.isOrderLocked !== undefined) {
          setIsOrderLocked(Boolean(tableData.isOrderLocked));
          if (tableData.isOrderLocked) {
            setCartTab('all');
          }
          const s = getStoredTableSession();
          if (s) {
            saveTableSession({ ...s, isOrderLocked: Boolean(tableData.isOrderLocked) });
          }
        }
      }
    });

    // Lắng nghe sự kiện chuyển bàn thời gian thực (được kích hoạt khi bàn được chuyển/ghép)
    const currentSession = getStoredTableSession();
    const unsubTransferred = currentSession?.sessionToken
      ? wsManager.subscribe(`/topic/table/${currentSession.sessionToken}`, (msg) => {
          if (msg?.event === 'TABLE_TRANSFERRED') {
            alert(`Bàn ăn của bạn đã được chuyển sang ${msg.newTableNumber}! Hệ thống sẽ tự động cập nhật.`);
            saveTableSession({
              ...currentSession,
              tableNumber: msg.newTableNumber,
              tableName: msg.newTableName || `Bàn ${msg.newTableNumber}`,
              sessionToken: msg.newSessionToken,
            });
            navigate(`/menu?table=${msg.newTableNumber}`);
            window.location.reload();
          }
        })
      : null;

    // 3. Polling dự phòng mỗi 4 giây (đảm bảo đồng bộ ngay cả khi WebSocket chập chờn trên mạng đa máy tính)
    const interval = setInterval(syncTableOrders, 4000);

    return () => {
      isMounted = false;
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsubTables) unsubTables();
      if (unsubTransferred) unsubTransferred();
      clearInterval(interval);
    };
  }, [tableNumber, currentNormTable, navigate]);

  // Danh sách toàn bộ các món đã gửi bếp của bàn (đồng bộ thời gian thực từ useKdsStore)
  const orderedItems = useMemo(() => {
    const tableOrders = allOrders.filter(
      (o) => normalizeTableCode(o.tableCode) === currentNormTable
    );

    const list = [];
    tableOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const dishMatch = dishesList.find(
            (d) => String(d.id) === String(item.menuItemId) || d.name === item.name
          );

          list.push({
            ...item,
            entryId: item.id,
            dishId: item.menuItemId || dishMatch?.id || item.id,
            image: item.image || item.imageUrl || dishMatch?.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
            orderId: order.id,
            orderCode: order.orderCode,
            tableCode: order.tableCode,
            orderedAt: item.orderedAt || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''),
          });
        });
      }
    });

    // Gom nhóm các món ở trạng thái "Đã phục vụ" (DELIVERED) cùng loại với nhau
    const result = [];
    const deliveredMap = new Map(); // groupKey -> index trong result

    list.forEach((item) => {
      const isDelivered = item.status === 'DELIVERED' || item.status === 'delivered';
      if (!isDelivered) {
        // Món đang chế biến hoặc chờ phục vụ: hiển thị riêng lẻ theo từng đợt gọi
        result.push({ ...item });
      } else {
        // Món đã phục vụ: gom nhóm theo món
        const groupKey = String(item.dishId || item.menuItemId || item.name).trim().toLowerCase();
        if (deliveredMap.has(groupKey)) {
          const existingIndex = deliveredMap.get(groupKey);
          const existing = result[existingIndex];
          existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
          if (item.note && !existing.notes?.includes(item.note)) {
            existing.notes = existing.notes ? [...existing.notes, item.note] : [existing.note, item.note].filter(Boolean);
            existing.note = existing.notes.join(', ');
          }
          if (item.orderedAt) {
            existing.orderedAt = item.orderedAt;
          }
        } else {
          const groupedItem = {
            ...item,
            entryId: `grouped-delivered-${item.dishId || item.id}`,
            notes: item.note ? [item.note] : [],
          };
          deliveredMap.set(groupKey, result.length);
          result.push(groupedItem);
        }
      }
    });

    return result;
  }, [allOrders, currentNormTable, dishesList]);

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

  // Tổng tiền các món đã gọi của bàn phục vụ cho popup đóng băng
  const totalOrderedAmount = useMemo(() => {
    return orderedItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [orderedItems]);

  const freezeSubtotal = useMemo(() => {
    return totalOrderedAmount || serverTableTotal;
  }, [totalOrderedAmount, serverTableTotal]);

  const freezeVat = useMemo(() => {
    return Math.round(freezeSubtotal * 0.08);
  }, [freezeSubtotal]);

  const freezeFinalTotal = useMemo(() => {
    return freezeSubtotal + freezeVat;
  }, [freezeSubtotal, freezeVat]);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0);
  };

  // Lấy số lượng của từng món trong giỏ hàng (theo id)
  const getDishCartQuantity = (dishId) => {
    const found = cartItems.find((item) => item.id === dishId);
    return found ? found.quantity : 0;
  };

  // Thêm món vào giỏ (Tự động chuyển từ tab 'Tất cả' về 'Chọn món')
  const handleAddToCart = (dish, price) => {
    if (isOrderLocked) {
      alert('Bàn đang được chốt hóa đơn tạm tính. Thao tác gọi món tạm thời bị đóng băng.');
      return;
    }
    setCartTab('draft');
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

  // Cập nhật số lượng món (Nếu tăng thêm món -> tự động nhảy về tab 'Chọn món')
  const handleUpdateQuantity = (dishId, newQuantity) => {
    if (isOrderLocked) return;
    if (newQuantity > 0) {
      setCartTab('draft');
    }
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
    if (isOrderLocked) return;
    setCartItems((prev) => prev.filter((item) => item.id !== dishId));
  };

  // Xóa toàn bộ giỏ
  const handleClearCart = () => {
    if (isOrderLocked) return;
    setCartItems([]);
  };

  // Cập nhật ghi chú riêng cho từng món
  const handleUpdateItemNote = (dishId, note) => {
    if (isOrderLocked) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, note } : item))
    );
  };

  // Ref chống gửi trùng lặp đơn hàng (Double submit guard)
  const isSubmittingOrder = useRef(false);

  // Xác nhận gửi bếp: Đẩy đơn vào Trạm Bếp KDS và đổi trạng thái món thành 'Đang chế biến'
  const handleSubmitOrder = async (orderData) => {
    if (isOrderLocked) {
      alert('Bàn đang được chốt hóa đơn tạm tính. Không thể gửi thêm đơn vào bếp lúc này.');
      return;
    }
    if (isSubmittingOrder.current) return;

    const itemsToSubmit = (orderData && orderData.items) ? orderData.items : cartItems;
    if (itemsToSubmit.length === 0) return;

    isSubmittingOrder.current = true;

    // Chuẩn bị payload gửi lên Spring Boot / MySQL
    const payload = {
      tableNumber: tableNumber || currentNormTable,
      note: (orderData && orderData.note) || '',
      totalAmount: (orderData && orderData.totalAmount) || totalAmount,
      items: itemsToSubmit.map((item) => ({
        menuItemId: typeof item.id === 'number' ? item.id : (item.numericId || null),
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        note: item.note || '',
      })),
    };

    try {
      // 1. Gửi đơn lên Server Spring Boot để lưu vào MySQL
      const serverResponse = await orderApi.createOrder(payload);

      // 2. Đẩy vào useKdsStore để Bếp và Phục vụ nhận ngay lập tức qua BroadcastChannel với ID DB thực
      submitCustomerOrder({
        tableCode: currentNormTable,
        items: itemsToSubmit,
        totalAmount: (orderData && orderData.totalAmount) || totalAmount,
        serverOrder: serverResponse,
      });

      // 3. Làm rỗng giỏ hàng nháp
      setCartItems([]);
    } catch (err) {
      console.warn('Lỗi khi gửi order lên server, chuyển sang chế độ dự phòng cục bộ:', err);
      // Fallback: Nếu mạng gián đoạn, vẫn lưu cục bộ để không gián đoạn trải nghiệm
      submitCustomerOrder({
        tableCode: currentNormTable,
        items: itemsToSubmit,
        totalAmount: (orderData && orderData.totalAmount) || totalAmount,
      });
      setCartItems([]);
    } finally {
      setTimeout(() => {
        isSubmittingOrder.current = false;
      }, 1000);
    }
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
        isOrderLocked={isOrderLocked}
        deviceCount={deviceCount}
        onOpenDevices={() => setIsDevicesModalOpen(true)}
        onOpenTransfer={() => setIsTransferModalOpen(true)}
      />

      {/* 2. Thanh Thông Báo Trạng Thái Bàn / Đóng Băng Order */}
      {isOrderLocked ? (
        <div className="flex-shrink-0 z-20 bg-gradient-to-r from-[#2F0A0E] via-[#3F1218] to-[#1F080A] border-y border-amber-500/50 px-3 sm:px-5 py-2.5 shadow-lg flex items-center justify-between gap-3 text-white animate-fadeIn">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center flex-shrink-0 animate-pulse shadow-xs">
              <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-[#FFE088] uppercase tracking-wide">
                  Bàn Đang Được Chốt Hóa Đơn Tạm Tính
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-red-950/90 text-red-300 border border-red-500/50 font-black uppercase tracking-wider">
                  Đã Đóng Băng Order
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-[#D6D3CD] leading-snug mt-0.5 truncate xs:whitespace-normal">
                Thu ngân đang kiểm tra hóa đơn và làm thủ tục thanh toán. Mọi thao tác đặt thêm món tạm thời bị khóa để đảm bảo tính tiền chính xác.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCartTab('all');
              setIsCartOpen(true);
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-amber-600/25 hover:from-amber-500/35 hover:to-amber-600/35 border border-amber-500/50 text-[#FFE088] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Xem Hóa Đơn</span>
            <span>({orderedItems.length} món)</span>
          </button>
        </div>
      ) : (
        <CollaborativeBanner collaboratorCount={deviceCount} />
      )}

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
                          isOrderLocked={isOrderLocked}
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
          isOrderLocked={isOrderLocked}
          activeTab={cartTab}
          onTabChange={setCartTab}
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
        orderedCount={orderedItems.reduce((sum, i) => sum + (i.quantity || 1), 0)}
        activeCookingCount={orderedItems.filter((i) => i.status === 'COOKING' || i.status === 'cooking').reduce((sum, i) => sum + (i.quantity || 1), 0)}
        waitingServeCount={orderedItems.filter((i) => i.status === 'SERVED' || i.status === 'served' || i.status === 'READY' || i.status === 'ready').reduce((sum, i) => sum + (i.quantity || 1), 0)}
        deliveredCount={orderedItems.filter((i) => i.status === 'DELIVERED' || i.status === 'delivered').reduce((sum, i) => sum + (i.quantity || 1), 0)}
        isHost={isHost}
        isOrderLocked={isOrderLocked}
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
        isOrderLocked={isOrderLocked}
        activeTab={cartTab}
        onTabChange={setCartTab}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
        onUpdateNote={handleUpdateItemNote}
      />

      {/* 6. Modal Xác Thực Mã PIN Bàn Ăn nếu chưa có phiên hợp lệ (Chỉ hiển thị khi bàn KHÔNG bị đóng băng/khóa order) */}
      <TablePasscodeModal
        isOpen={isPasscodeRequired && !isOrderLocked}
        tableCode={tableNumber}
        onClose={() => {
          navigate(`/table/${tableNumber.toLowerCase()}`);
        }}
        onSuccess={(res) => {
          setIsPasscodeRequired(false);
          setIsHost(Boolean(res?.isHost));
        }}
      />

      {/* 6.1. Popup Modal Đóng Băng Toàn Bộ Giao Diện: Đang Trong Quá Trình Thanh Toán */}
      {isOrderLocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
          <div className="bg-[#141417] border border-amber-500/40 rounded-2xl w-full max-w-lg sm:max-w-xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col transform-gpu animate-scaleIn">
            {/* Header: Gọn gàng, giảm chiều cao */}
            <div className="bg-gradient-to-r from-[#2A050A] via-[#3D0A12] to-[#2A050A] border-b border-amber-500/30 px-4 py-3 sm:py-3.5 text-center relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/60 text-amber-300 mx-auto flex items-center justify-center shadow-md shadow-amber-500/10 mb-1.5 animate-pulse">
                <Receipt className="w-5 h-5 text-amber-300" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#FFE088] tracking-wide uppercase">
                Bàn Đang Trong Quá Trình Thanh Toán
              </h3>
              <p className="text-[11.5px] text-[#D6D3CD] mt-0.5 max-w-sm mx-auto leading-relaxed">
                Nhân viên thu ngân đang kiểm tra hóa đơn và làm thủ tục thanh toán cho <span className="text-white font-bold">Bàn {tableNumber}</span>.
              </p>
            </div>

            {/* Body */}
            <div className="p-3.5 sm:p-4 space-y-3 overflow-hidden">
              {/* 1. DANH SÁCH MÓN ĂN ĐỐI SOÁT (Đưa lên trên tổng số tiền) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#FFE088] uppercase tracking-wider px-1">
                  <span>Danh sách món ăn đối soát</span>
                  <span className="text-[10.5px] text-[#A0A0A5] normal-case font-normal">Chế độ chỉ đọc</span>
                </div>

                <div className="bg-[#101012] border border-white/10 rounded-xl overflow-hidden shadow-inner">
                  {/* Table Header: STT, Tên món, Số lượng, Đơn giá, Thành tiền */}
                  <div className="bg-white/[0.04] border-b border-white/10 px-3 py-2 flex items-center text-[10.5px] font-bold text-amber-200/90 uppercase tracking-wider">
                    <span className="w-8 text-center flex-shrink-0">STT</span>
                    <span className="flex-1 min-w-0 px-2">Tên món</span>
                    <span className="w-12 text-center flex-shrink-0">SL</span>
                    <span className="w-20 text-right flex-shrink-0">Đơn giá</span>
                    <span className="w-24 text-right flex-shrink-0">Thành tiền</span>
                  </div>

                  {/* Table Rows: Cuộn mượt với độ cao vừa đúng kích thước 5 món */}
                  <div className="divide-y divide-white/5 max-h-[210px] overflow-y-auto custom-scrollbar">
                    {orderedItems.length > 0 ? (
                      orderedItems.map((item, idx) => (
                        <div
                          key={item.entryId || idx}
                          className="px-3 py-2 flex items-center text-xs hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="w-8 text-center text-[#8E8E93] font-mono text-[11px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0 px-2">
                            <span className="font-medium text-white text-xs leading-snug line-clamp-2 break-words">
                              {item.name}
                            </span>
                          </div>
                          <span className="w-12 text-center font-bold text-amber-300 font-mono text-xs flex-shrink-0">
                            {item.quantity || 1}
                          </span>
                          <span className="w-20 text-right text-zinc-400 font-mono text-[11px] flex-shrink-0">
                            {formatPrice(item.price || 0)} ₫
                          </span>
                          <span className="w-24 text-right font-mono font-bold text-zinc-100 text-xs flex-shrink-0">
                            {formatPrice((item.price || 0) * (item.quantity || 1))} ₫
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#8E8E93]">
                        Bàn chưa có đơn món nào được gửi vào bếp.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. MỤC TỔNG TIỀN (3 dòng: Tạm tính, Thuế, Tổng cộng thanh toán) */}
              <div className="bg-[#101012] border border-white/10 rounded-xl p-3 space-y-1.5 shadow-inner">
                {/* Dòng 1: Tạm tính */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A0A0A5] font-medium">Tạm tính:</span>
                  <span className="font-mono text-zinc-200 font-semibold">
                    {formatPrice(freezeSubtotal)} ₫
                  </span>
                </div>

                {/* Dòng 2: Thuế (VAT 8%) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A0A0A5] font-medium">Thuế (VAT 8%):</span>
                  <span className="font-mono text-zinc-200 font-semibold">
                    {formatPrice(freezeVat)} ₫
                  </span>
                </div>

                {/* Dòng 3: Tổng cộng thanh toán */}
                <div className="border-t border-white/10 pt-2 mt-1 flex items-center justify-between">
                  <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">
                    Tổng cộng thanh toán:
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-[#FFD54F]">
                    {formatPrice(freezeFinalTotal)} ₫
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#101012] border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isCallingSupport}
                onClick={handleCallSupportStaff}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer ${
                  calledSupport
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#1e1e24] hover:bg-[#272730] border-amber-500/40 text-amber-300'
                }`}
              >
                {isCallingSupport ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : calledSupport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã gọi nhân viên hỗ trợ!</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gọi Nhân Viên Hỗ Trợ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Quản Lý Thiết Bị Kết Nối & Nhượng Quyền Chủ Bàn */}
      <TableDevicesModal
        isOpen={isDevicesModalOpen}
        onClose={() => setIsDevicesModalOpen(false)}
        tableNumber={tableNumber}
        isCurrentHost={isHost}
        onHostTransferred={handleHostTransferred}
      />

      {/* 8. Modal Chuyển Bàn / Ghép Bàn */}
      <TableTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        tableNumber={tableNumber}
        isHost={isHost}
        onTransferSuccess={() => {
          setIsTransferModalOpen(false);
        }}
      />
    </div>
  );
}
