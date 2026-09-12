import React, { useState, useMemo } from 'react';
import {
  TableCard,
  FloorStatusHeader,
  FloorAreaSection,
  initialTables
} from '@/features/tables';

export default function TableManagePage() {
  const [tables, setTables] = useState(initialTables);
  const [activeTab, setActiveTab] = useState('ALL');

  // Thống kê nhanh các chỉ số trên Header
  const stats = useMemo(() => {
    return {
      total: tables.length,
      available: tables.filter(t => t.status === 'AVAILABLE').length,
      occupied: tables.filter(t => t.status === 'OCCUPIED').length,
      cleaning: tables.filter(t => t.status === 'CLEANING').length,
      paying: tables.filter(t => t.isPaying).length,
      callStaff: tables.filter(t => t.hasCallStaff).length,
    };
  }, [tables]);

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
    return tables.filter(t => !t.isVip && filterByTab(t, activeTab));
  }, [tables, activeTab]);

  const vipTables = useMemo(() => {
    return tables.filter(t => t.isVip && filterByTab(t, activeTab));
  }, [tables, activeTab]);

  const handleSelectTable = (table) => {
    if (table.hasCallStaff) {
      // Tắt chuông gọi phục vụ khi bấm vào bàn
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, hasCallStaff: false } : t));
    }
  };

  const handleSelectTab = (tabId) => {
    // Bấm lại tab đang chọn (khác ALL) thì chuyển về ALL, hoặc chuyển sang tab mới
    if (activeTab === tabId && tabId !== 'ALL') {
      setActiveTab('ALL');
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* 1. Thanh thống kê trạng thái trên cùng với tabs tương tác và thanh trượt màu */}
      <FloorStatusHeader
        stats={stats}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* 2. Vùng cuộn sơ đồ bàn ăn */}
      <div className="flex-1 px-8 py-7 overflow-y-auto space-y-10 relative">
        {/* Phân khu 1: Khu vực chung */}
        <FloorAreaSection
          title="Khu Vực Chung"
          capacityInfo="4 Khách / Bàn"
          countLabel={`${standardTables.length} Bàn`}
          isVip={false}
        >
          {standardTables.length > 0 ? (
            standardTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                onSelect={handleSelectTable}
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
            vipTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                onSelect={handleSelectTable}
              />
            ))
          ) : (
            <div className="col-span-5 py-8 text-center text-xs text-[#8E8E93] italic border border-dashed border-surface-border rounded-xl">
              Không có phòng nào thuộc trạng thái này trong Phòng VIP
            </div>
          )}
        </FloorAreaSection>
      </div>
    </div>
  );
}
