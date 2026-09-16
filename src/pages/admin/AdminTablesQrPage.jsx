import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  ShieldAlert,
  CheckCircle,
  Users,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import TableCardQr from '@/features/tables/components/TableCardQr';
import TableQrPrintModal from '@/features/tables/components/TableQrPrintModal';
import AdminTableDevicesModal from '@/features/tables/components/AdminTableDevicesModal';
import { tableApi } from '@/features/tables/api/tableApi';

export default function AdminTablesQrPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL'); // ALL, COMMON, VIP
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, AVAILABLE, OCCUPIED, CLEANING

  // Modal in ấn standee QR
  const [selectedPrintTable, setSelectedPrintTable] = useState(null);

  // Modal quản lý thiết bị kết nối & phân quyền Chủ Bàn
  const [selectedDevicesTable, setSelectedDevicesTable] = useState(null);

  // Modal tạo bàn mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableData, setNewTableData] = useState({
    tableNumber: '',
    name: '',
    area: 'COMMON',
    capacity: 4,
    maxActiveDevices: 6,
  });

  // Toast feedback
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tableApi.getAllTables();
      setTables(data);
    } catch (err) {
      console.error('Lỗi tải danh sách bàn:', err);
      showToast('Lỗi khi tải danh sách bàn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Handler đổi mã PIN mới
  const handleRegeneratePin = async (tableId) => {
    try {
      const res = await tableApi.regeneratePin(tableId);
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, currentPasscode: res.currentPasscode || String(Math.floor(1000 + Math.random() * 9000)), activeDeviceCount: 0 }
            : t
        )
      );
      showToast(`Đã sinh mã PIN mới cho bàn ${tables.find(t => t.id === tableId)?.tableNumber || ''}`);
    } catch (err) {
      showToast('Lỗi khi sinh mã PIN mới', 'error');
    }
  };

  // Handler bật tắt khóa order khẩn cấp
  const handleToggleLock = async (tableId) => {
    try {
      const current = tables.find((t) => t.id === tableId);
      const newLocked = !Boolean(current?.isOrderLocked);
      await tableApi.toggleOrderLock(tableId);
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, isOrderLocked: newLocked } : t))
      );
      showToast(newLocked ? 'Đã kích hoạt khóa order khẩn cấp' : 'Đã mở khóa order cho bàn');
    } catch (err) {
      showToast('Lỗi khi thao tác khóa bàn', 'error');
    }
  };

  // Handler cập nhật trạng thái bàn
  const handleUpdateStatus = async (tableId, newStatus) => {
    try {
      await tableApi.updateTableStatus(tableId, newStatus);
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: newStatus,
                activeDeviceCount: newStatus === 'AVAILABLE' ? 0 : t.activeDeviceCount,
              }
            : t
        )
      );
      showToast(`Đã cập nhật trạng thái sang: ${newStatus}`);
    } catch (err) {
      showToast('Lỗi khi cập nhật trạng thái bàn', 'error');
    }
  };

  // Handler thêm bàn mới
  const handleCreateTable = (e) => {
    e.preventDefault();
    if (!newTableData.tableNumber || !newTableData.name) {
      showToast('Vui lòng điền đầy đủ mã và tên bàn', 'error');
      return;
    }

    const newTable = {
      id: Date.now(),
      tableNumber: newTableData.tableNumber.toUpperCase().trim(),
      name: newTableData.name.trim(),
      area: newTableData.area,
      capacity: Number(newTableData.capacity),
      maxActiveDevices: Number(newTableData.maxActiveDevices) || Math.round(newTableData.capacity * 1.5),
      status: 'AVAILABLE',
      isOrderLocked: false,
      currentPasscode: String(Math.floor(1000 + Math.random() * 9000)),
      activeDeviceCount: 0,
    };

    setTables((prev) => [...prev, newTable]);
    setIsAddModalOpen(false);
    setNewTableData({ tableNumber: '', name: '', area: 'COMMON', capacity: 4, maxActiveDevices: 6 });
    showToast(`Đã thêm bàn mới: ${newTable.name}`);
  };

  // Lọc danh sách bàn
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchSearch =
        (t.tableNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchArea = areaFilter === 'ALL' || t.area === areaFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchArea && matchStatus;
    });
  }, [tables, searchQuery, areaFilter, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter((t) => t.status === 'AVAILABLE').length,
      occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
      cleaning: tables.filter((t) => t.status === 'CLEANING').length,
      locked: tables.filter((t) => t.isOrderLocked).length,
    };
  }, [tables]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0E0E10] text-[#EDEDED]">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium backdrop-blur-md animate-slideUp ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-zinc-900/95 border-gold/50 text-gold'
          }`}
        >
          {toast.type === 'error' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-gold" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header & KPI Bar */}
      <div className="px-8 py-6 border-b border-surface-border bg-[#121214] flex flex-col gap-5 select-none">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gold/10 border border-gold/20 text-gold">
                <QrCode className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold font-serif text-[#EDEDED] tracking-wide">
                Quản Lý Bàn Ăn & Mã QR Cố Định
              </h1>
            </div>
            <p className="text-xs text-[#8E8E93] mt-1">
              Hệ thống mã QR bàn cố định kết hợp mật khẩu PIN 4 số chống quét phá & tự động làm mới khi thanh toán
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTables}
              className="p-2.5 rounded-xl border border-surface-border hover:bg-surface-hover text-[#A0A0A5] hover:text-[#EDEDED] transition-colors"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-crimson to-[#B91C1C] hover:from-[#B91C1C] hover:to-crimson text-white text-xs font-semibold shadow-lg shadow-crimson/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Bàn Mới</span>
            </button>
          </div>
        </div>

        {/* 5 Thẻ Chỉ Số Vận Hành */}
        <div className="grid grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-[#8E8E93]">Tổng Bàn Ăn</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">{stats.total}</p>
            </div>
            <Layers className="w-5 h-5 text-[#8E8E93]" />
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-emerald-400">Bàn Trống Sẵn Sàng</p>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{stats.available}</p>
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-amber-400">Đang Phục Vụ</p>
              <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">{stats.occupied}</p>
            </div>
            <Users className="w-5 h-5 text-amber-400" />
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-blue-400">Đang Dọn Dẹp</p>
              <p className="text-lg font-bold font-mono text-blue-400 mt-0.5">{stats.cleaning}</p>
            </div>
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>

          <div className="p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-rose-400">Khóa Order Khẩn</p>
              <p className="text-lg font-bold font-mono text-rose-400 mt-0.5">{stats.locked}</p>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* 2. Toolbar Tìm Kiếm & Bộ Lọc */}
      <div className="px-8 py-3.5 border-b border-surface-border bg-[#0E0E10] flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm mã bàn (B01, VIP 11), tên bàn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181B] border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs text-[#EDEDED] placeholder-[#71717A] outline-none focus:border-gold/60 transition-colors"
            />
          </div>
        </div>

        {/* Filter Area Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#18181B] border border-surface-border rounded-xl">
            {[
              { id: 'ALL', label: 'Tất Cả Khu Vực' },
              { id: 'COMMON', label: 'Sảnh Chung' },
              { id: 'VIP', label: 'Phòng VIP' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAreaFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  areaFilter === tab.id
                    ? 'bg-crimson-subtle text-gold border border-crimson-border shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#EDEDED]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#18181B] border border-surface-border text-[#EDEDED] text-xs rounded-xl px-3 py-2 outline-none focus:border-gold/60 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Bàn trống</option>
            <option value="OCCUPIED">Đang có khách</option>
            <option value="CLEANING">Đang dọn</option>
          </select>
        </div>
      </div>

      {/* 3. Lưới Thẻ Bàn Chi Tiết (Scrollable) */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-[#8E8E93]">
            <RefreshCw className="w-8 h-8 animate-spin text-gold" />
            <p className="text-xs">Đang tải danh sách bàn và mã QR...</p>
          </div>
        ) : filteredTables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTables.map((table) => (
              <TableCardQr
                key={table.id}
                table={table}
                onRegeneratePin={handleRegeneratePin}
                onToggleLock={handleToggleLock}
                onUpdateStatus={handleUpdateStatus}
                onOpenPrintModal={(tbl) => setSelectedPrintTable(tbl)}
                onOpenDevices={(tbl) => setSelectedDevicesTable(tbl)}
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center gap-2 border border-dashed border-surface-border rounded-2xl text-[#8E8E93]">
            <Search className="w-8 h-8 opacity-40 text-gold" />
            <p className="text-sm font-medium">Không tìm thấy bàn nào phù hợp</p>
            <p className="text-xs text-[#71717A]">Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
          </div>
        )}
      </div>

      {/* Modal In Standee Tem QR Bàn */}
      <TableQrPrintModal
        table={selectedPrintTable}
        isOpen={Boolean(selectedPrintTable)}
        onClose={() => setSelectedPrintTable(null)}
      />

      {/* Modal Quản Lý Thiết Bị Kết Nối & Quyền Chủ Bàn */}
      <AdminTableDevicesModal
        table={selectedDevicesTable}
        isOpen={Boolean(selectedDevicesTable)}
        onClose={() => setSelectedDevicesTable(null)}
        onDeviceUpdated={fetchTables}
      />

      {/* Modal Thêm Bàn Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#121214]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold" />
                <h3 className="font-semibold text-sm text-[#EDEDED]">Thêm Bàn Ăn Mới</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8E8E93] hover:text-[#EDEDED]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-[#A0A0A5] mb-1.5 font-medium">Mã Định Danh Bàn (VD: B11, VIP21)</label>
                <input
                  type="text"
                  required
                  placeholder="B11"
                  value={newTableData.tableNumber}
                  onChange={(e) => setNewTableData({ ...newTableData, tableNumber: e.target.value })}
                  className="w-full bg-[#121214] border border-[#3F3F46] rounded-xl px-3 py-2 text-xs text-[#EDEDED] outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A0A0A5] mb-1.5 font-medium">Tên Hiển Thị (VD: Bàn 11, Phòng Long Phụng)</label>
                <input
                  type="text"
                  required
                  placeholder="Bàn 11"
                  value={newTableData.name}
                  onChange={(e) => setNewTableData({ ...newTableData, name: e.target.value })}
                  className="w-full bg-[#121214] border border-[#3F3F46] rounded-xl px-3 py-2 text-xs text-[#EDEDED] outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A0A0A5] mb-1.5 font-medium">Phân Khu Vực</label>
                  <select
                    value={newTableData.area}
                    onChange={(e) => setNewTableData({ ...newTableData, area: e.target.value })}
                    className="w-full bg-[#121214] border border-[#3F3F46] rounded-xl px-3 py-2 text-xs text-[#EDEDED] outline-none focus:border-gold"
                  >
                    <option value="COMMON">Khu Sảnh Chung</option>
                    <option value="VIP">Phòng VIP Hoàng Gia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#A0A0A5] mb-1.5 font-medium">Sức Chứa (Khách)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newTableData.capacity}
                    onChange={(e) =>
                      setNewTableData({
                        ...newTableData,
                        capacity: e.target.value,
                        maxActiveDevices: Math.round(Number(e.target.value) * 1.5),
                      })
                    }
                    className="w-full bg-[#121214] border border-[#3F3F46] rounded-xl px-3 py-2 text-xs text-[#EDEDED] outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#A0A0A5] mb-1.5 font-medium">Giới Hạn Thiết Bị Đồng Thời (Anti-Spam)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={newTableData.maxActiveDevices}
                  onChange={(e) => setNewTableData({ ...newTableData, maxActiveDevices: e.target.value })}
                  className="w-full bg-[#121214] border border-[#3F3F46] rounded-xl px-3 py-2 text-xs text-[#EDEDED] outline-none focus:border-gold"
                />
                <p className="text-[10px] text-[#71717A] mt-1">Khuyên dùng: Sức chứa × 1.5 để tránh quá tải hoặc quét phá</p>
              </div>

              <div className="pt-3 border-t border-[#27272A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#3F3F46] hover:bg-[#27272A] text-xs font-medium text-[#A0A0A5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-crimson hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-lg shadow-crimson/20"
                >
                  Lưu & Cấp Mã PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
