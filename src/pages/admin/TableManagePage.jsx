import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TableCard,
  FloorStatusHeader,
  FloorAreaSection,
  AdminTableDetailModal,
  initialTables,
} from '@/features/tables';
import { tableApi } from '@/features/tables/api/tableApi';
import { kitchenApi } from '@/features/kitchen';
import AdminTableDevicesModal from '@/features/tables/components/AdminTableDevicesModal';
import TableQrPrintModal from '@/features/tables/components/TableQrPrintModal';
import { wsManager } from '@/lib/websocket';

/**
 * Format số giây đã trôi qua sang chuỗi thời gian ngắn gọn (VD: "25 phút", "1h 15p")
 */
function formatTimeSpent(createdAt) {
  if (!createdAt) return null;
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.max(0, Math.floor(elapsedMs / 60000));
  if (mins < 60) {
    return `${mins} phút`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}p`;
}

export default function TableManagePage() {
  // 1. Tải tức thì 0ms từ localStorage cache (Stale-While-Revalidate)
  const [rawTables, setRawTables] = useState(() => {
    try {
      const cached = localStorage.getItem('hoadiemcat_tables_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc cache bàn từ localStorage:', e);
    }
    return [];
  });

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(() => rawTables.length === 0);

  // Modal Chi Tiết & Thao Tác Bàn
  const [selectedTable, setSelectedTable] = useState(null);

  // Modal Quản Lý Thiết Bị Kết Nối
  const [selectedDevicesTable, setSelectedDevicesTable] = useState(null);

  // Modal In Standee Mã QR
  const [selectedPrintTable, setSelectedPrintTable] = useState(null);

  // Tải dữ liệu Bàn thời gian thực từ Backend (Chỉ 1 request duy nhất)
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial && rawTables.length === 0) setLoading(true);

      const tablesData = await tableApi.getAllTables().catch((err) => {
        console.warn('Lỗi nạp danh sách bàn:', err);
        return [];
      });

      if (Array.isArray(tablesData) && tablesData.length > 0) {
        setRawTables(tablesData);
        try {
          localStorage.setItem('hoadiemcat_tables_cache', JSON.stringify(tablesData));
        } catch (e) {
          console.warn('Lỗi lưu cache bàn vào localStorage:', e);
        }
      } else if (isInitial && rawTables.length === 0) {
        setRawTables(initialTables);
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ dữ liệu sơ đồ bàn:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [rawTables.length]);

  // Cập nhật lạc quan trạng thái bàn tức thì (0ms) & lưu cache
  const handleOptimisticUpdate = useCallback((tableId, newStatus) => {
    setRawTables((prev) => {
      const next = prev.map((t) =>
        (t.id === tableId || String(t.id) === String(tableId) || t.tableNumber === tableId)
          ? { ...t, status: newStatus }
          : t
      );
      try {
        localStorage.setItem('hoadiemcat_tables_cache', JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedTable((prev) =>
      (prev && (prev.id === tableId || String(prev.id) === String(tableId) || prev.tableNumber === tableId))
        ? { ...prev, status: newStatus }
        : prev
    );
  }, []);

  // Cập nhật bảng trực tiếp từ API response mà không cần fetch lại toàn bộ gây giật lag
  const handleTableUpdated = useCallback((updatedTable) => {
    if (updatedTable && (updatedTable.id || updatedTable.tableNumber)) {
      setRawTables((prev) => {
        const next = prev.map((t) =>
          (t.id === updatedTable.id || String(t.id) === String(updatedTable.id) || t.tableNumber === updatedTable.tableNumber)
            ? { ...t, ...updatedTable }
            : t
        );
        try {
          localStorage.setItem('hoadiemcat_tables_cache', JSON.stringify(next));
        } catch {}
        return next;
      });
      setSelectedTable((prev) =>
        (prev && (prev.id === updatedTable.id || String(prev.id) === String(updatedTable.id) || prev.tableNumber === updatedTable.tableNumber))
          ? { ...prev, ...updatedTable }
          : prev
      );
    } else {
      fetchData(false);
    }
  }, [fetchData]);

  // Xử lý khi nhấn nút "Gọi PV" trên thẻ bàn để tắt chuông ngay lập tức
  const handleResolveCallStaff = useCallback(async (table, e) => {
    if (e) e.stopPropagation();
    const tableId = table.id;

    // Cập nhật lạc quan (Optimistic update) biến mất ngay tức thì 0ms
    setRawTables((prev) => {
      const next = prev.map((t) =>
        (t.id === tableId || String(t.id) === String(tableId) || t.tableNumber === table.tableNumber)
          ? { ...t, hasCallStaff: false }
          : t
      );
      try {
        localStorage.setItem('hoadiemcat_tables_cache', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await tableApi.resolveCallStaff(tableId, 'CALL_STAFF');
    } catch (err) {
      console.error('Lỗi khi tắt chuông gọi phục vụ:', err);
    }
  }, []);

  // Xử lý khi nhấn nút "PAYING" trên thẻ bàn để tắt thông báo thanh toán ngay lập tức
  const handleResolvePaying = useCallback(async (table, e) => {
    if (e) e.stopPropagation();
    const tableId = table.id;

    // Cập nhật lạc quan (Optimistic update) biến mất ngay tức thì 0ms
    setRawTables((prev) => {
      const next = prev.map((t) =>
        (t.id === tableId || String(t.id) === String(tableId) || t.tableNumber === table.tableNumber)
          ? { ...t, isPaying: false }
          : t
      );
      try {
        localStorage.setItem('hoadiemcat_tables_cache', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await tableApi.resolveCallStaff(tableId, 'PAYMENT_REQUEST');
    } catch (err) {
      console.error('Lỗi khi tắt thông báo thanh toán:', err);
    }
  }, []);

  useEffect(() => {
    fetchData(rawTables.length === 0);

    // 1. Tự động đồng bộ thời gian thực qua WebSocket (< 50ms)
    const unsubTables = wsManager.subscribe('/topic/tables', (tableUpdate) => {
      if (!tableUpdate || !tableUpdate.id) return;
      setRawTables((prev) => {
        const next = prev.map((t) =>
          (t.id === tableUpdate.id || String(t.id) === String(tableUpdate.id) || t.tableNumber === tableUpdate.tableNumber)
            ? { ...t, ...tableUpdate }
            : t
        );
        try {
          localStorage.setItem('hoadiemcat_tables_cache', JSON.stringify(next));
        } catch {}
        return next;
      });
      setSelectedTable((prev) =>
        (prev && (prev.id === tableUpdate.id || String(prev.id) === String(tableUpdate.id) || prev.tableNumber === tableUpdate.tableNumber))
          ? { ...prev, ...tableUpdate }
          : prev
      );
    });

    const unsubKitchen = wsManager.subscribe('/topic/kitchen/orders', () => {
      fetchData(false);
    });
    const unsubWaiter = wsManager.subscribe('/topic/waiter/orders', () => {
      fetchData(false);
    });

    // 2. Polling dự phòng mỗi 30 giây (vì đã có WebSocket real-time tốc độ cao)
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    // Đồng bộ lại ngay khi người dùng chuyển lại tab này
    const handleFocus = () => {
      fetchData(false);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (typeof unsubTables === 'function') unsubTables();
      if (typeof unsubKitchen === 'function') unsubKitchen();
      if (typeof unsubWaiter === 'function') unsubWaiter();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData, rawTables.length]);

  // Hợp nhất dữ liệu bàn
  const enrichedTables = useMemo(() => {
    const list = rawTables.length > 0 ? rawTables : initialTables;

    return list.map((table) => {
      const tableNum = (table.tableNumber || table.code || '').toLowerCase();
      const tableName = (table.name || table.code || '').toLowerCase();

      // Tính thời gian ngồi từ backend sessionStartedAt
      let earliestTime = null;
      if (table.sessionStartedAt) {
        earliestTime = new Date(table.sessionStartedAt).getTime();
      }

      const timeSpent = earliestTime ? formatTimeSpent(earliestTime) : null;
      const totalAmount = Number(table.totalAmount || table.amount || 0);
      const computedStatus = table.status || 'AVAILABLE';

      const isVip =
        table.isVip ??
        (table.area === 'VIP' ||
          tableNum.startsWith('vip') ||
          tableName.includes('vip'));

      const hasCallStaff = Boolean(table.hasCallStaff);
      const isPaying = Boolean(table.isPaying);

      return {
        ...table,
        code: table.name || table.code || table.tableNumber,
        isVip,
        status: computedStatus,
        timeSpent,
        amount: totalAmount,
        hasCallStaff,
        isPaying,
        activeOrders: [],
      };
    });
  }, [rawTables]);

  // Cập nhật lại selectedTable khi dữ liệu enriched thay đổi
  useEffect(() => {
    if (selectedTable) {
      const updated = enrichedTables.find(
        (t) =>
          t.id === selectedTable.id ||
          String(t.id) === String(selectedTable.id) ||
          t.tableNumber === selectedTable.tableNumber ||
          t.code === selectedTable.code
      );
      if (updated) {
        setSelectedTable(updated);
      }
    }
  }, [enrichedTables]);

  // Thống kê nhanh các chỉ số trên Header
  const stats = useMemo(() => {
    return {
      total: enrichedTables.length,
      available: enrichedTables.filter((t) => t.status === 'AVAILABLE').length,
      occupied: enrichedTables.filter((t) => t.status === 'OCCUPIED').length,
      cleaning: enrichedTables.filter((t) => t.status === 'CLEANING').length,
      paying: enrichedTables.filter((t) => t.isPaying).length,
      callStaff: enrichedTables.filter((t) => t.hasCallStaff).length,
    };
  }, [enrichedTables]);

  // Hàm lọc bàn theo tab trạng thái đang chọn
  const filterByTab = (table, tab) => {
    switch (tab) {
      case 'AVAILABLE':
        return table.status === 'AVAILABLE';
      case 'OCCUPIED':
        return table.status === 'OCCUPIED';
      case 'CLEANING':
        return table.status === 'CLEANING';
      case 'PAYING':
        return Boolean(table.isPaying);
      case 'CALL_STAFF':
        return Boolean(table.hasCallStaff);
      case 'ALL':
      default:
        return true;
    }
  };

  // Danh sách bàn thường và bàn VIP theo bộ lọc activeTab
  const standardTables = useMemo(() => {
    return enrichedTables.filter((t) => !t.isVip && filterByTab(t, activeTab));
  }, [enrichedTables, activeTab]);

  const vipTables = useMemo(() => {
    return enrichedTables.filter((t) => t.isVip && filterByTab(t, activeTab));
  }, [enrichedTables, activeTab]);

  // Xử lý khi bấm vào thẻ bàn -> Mở Modal Chi Tiết Bàn
  const handleSelectTable = (table) => {
    setSelectedTable(table);
  };

  const handleSelectTab = (tabId) => {
    if (activeTab === tabId && tabId !== 'ALL') {
      setActiveTab('ALL');
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-obsidian">
      {/* 1. Thanh thống kê trạng thái trên cùng với tabs tương tác và thanh trượt màu */}
      <FloorStatusHeader
        stats={stats}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* 2. Vùng cuộn sơ đồ bàn ăn */}
      <div className="flex-1 px-8 py-7 overflow-y-auto space-y-10 relative custom-scrollbar">
        {/* Phân khu 1: Khu Vực Chung */}
        <FloorAreaSection
          title="Khu Vực Chung"
          capacityInfo="4 Khách / Bàn"
          countLabel={`${standardTables.length} Bàn`}
          isVip={false}
        >
          {standardTables.length > 0 ? (
            standardTables.map((table) => (
              <TableCard
                key={table.id || table.tableNumber || table.code}
                table={table}
                onSelect={handleSelectTable}
                onResolveCallStaff={handleResolveCallStaff}
                onResolvePaying={handleResolvePaying}
              />
            ))
          ) : (
            <div className="col-span-5 py-8 text-center text-xs text-[#8E8E93] italic border border-dashed border-surface-border rounded-xl">
              Không có bàn nào thuộc trạng thái này trong Khu Vực Chung
            </div>
          )}
        </FloorAreaSection>

        {/* Phân khu 2: Phòng VIP Hoàng Gia */}
        <FloorAreaSection
          title="Phòng VIP Hoàng Gia"
          capacityInfo="10 Khách / Phòng"
          countLabel={`${vipTables.length} Phòng`}
          isVip={true}
        >
          {vipTables.length > 0 ? (
            vipTables.map((table) => (
              <TableCard
                key={table.id || table.tableNumber || table.code}
                table={table}
                onSelect={handleSelectTable}
                onResolveCallStaff={handleResolveCallStaff}
                onResolvePaying={handleResolvePaying}
              />
            ))
          ) : (
            <div className="col-span-5 py-8 text-center text-xs text-[#8E8E93] italic border border-dashed border-surface-border rounded-xl">
              Không có phòng nào thuộc trạng thái này trong Phòng VIP
            </div>
          )}
        </FloorAreaSection>
      </div>

      {/* 3. Modal Chi Tiết & Thao Tác Bàn */}
      {selectedTable && (
        <AdminTableDetailModal
          table={selectedTable}
          orders={orders}
          isOpen={Boolean(selectedTable)}
          onClose={() => setSelectedTable(null)}
          onTableUpdated={handleTableUpdated}
          onOptimisticUpdate={handleOptimisticUpdate}
          onOpenDevices={(t) => setSelectedDevicesTable(t)}
          onOpenPrint={(t) => setSelectedPrintTable(t)}
        />
      )}

      {/* 4. Modal Quản Lý Thiết Bị Đang Kết Nối (Host / Kick device) */}
      {selectedDevicesTable && (
        <AdminTableDevicesModal
          table={selectedDevicesTable}
          isOpen={Boolean(selectedDevicesTable)}
          onClose={() => setSelectedDevicesTable(null)}
          onDeviceUpdated={() => fetchData(false)}
        />
      )}

      {/* 5. Modal In Standee Mã QR */}
      {selectedPrintTable && (
        <TableQrPrintModal
          table={selectedPrintTable}
          isOpen={Boolean(selectedPrintTable)}
          onClose={() => setSelectedPrintTable(null)}
        />
      )}
    </div>
  );
}
