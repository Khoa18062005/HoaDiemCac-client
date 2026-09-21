import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, AlertTriangle, CheckCircle, PackageX, RefreshCw, Loader2 } from 'lucide-react';
import { menuApi } from '@/features/menu';
import { kitchenApi } from '../api/kitchenApi';

export default function OutOfStockModal({ isOpen, onClose, onShowToast }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', label: 'Tất Cả' }]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadingItemId, setLoadingItemId] = useState(null);

  // Tải danh sách món ăn và danh mục từ Database khi mở modal
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      menuApi.getMenuItems().catch(() => []),
      menuApi.getCategories().catch(() => []),
    ]).then(([itemsData, catsData]) => {
      if (!isMounted) return;
      if (Array.isArray(itemsData)) {
        setItems(itemsData);
      }
      if (Array.isArray(catsData) && catsData.length > 0) {
        setCategories([
          { id: 'all', label: 'Tất Cả' },
          ...catsData.map((c) => ({ id: c.slug || String(c.id), label: c.name })),
        ]);
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Lọc danh sách món ăn
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const catId = item.categoryId || (item.categories && item.categories[0]?.slug) || '';
      if (selectedCategory !== 'all' && catId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(query) || (item.categoryName && item.categoryName.toLowerCase().includes(query));
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Toggle trạng thái Còn Hàng / Hết Hàng
  const handleToggleStock = async (item) => {
    const nextState = !item.isAvailable;
    setLoadingItemId(item.id);

    try {
      await kitchenApi.toggleItemStock(item.id, nextState);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextState } : i))
      );

      if (onShowToast) {
        onShowToast(
          nextState
            ? `Đã mở bán lại: ${item.name}`
            : `ĐÃ BÁO HẾT MÓN: ${item.name} (Đã khóa trên menu khách)`
        );
      }
    } catch (e) {
      if (onShowToast) onShowToast('Không thể cập nhật trạng thái món');
    } finally {
      setLoadingItemId(null);
    }
  };

  const outOfStockCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-[#141418] border border-surface-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-[#19191E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-subtle border border-amber/40 flex items-center justify-center text-amber">
              <PackageX className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Báo Hết Món Khẩn Cấp <span className="text-[11px] text-amber font-mono font-normal">(UC19)</span>
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Khóa nhanh món khi cạn nguyên liệu, lập tức cập nhật tới menu của khách
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tìm kiếm & lọc danh mục */}
        <div className="p-4 border-b border-surface-border bg-[#101013] space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món cần báo hết..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-surface-card border border-surface-border text-white placeholder-[#8E8E93] focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>
            <div className="text-xs text-[#8E8E93] flex-shrink-0">
              Đang tạm hết: <span className="font-bold text-amber font-mono">{outOfStockCount}</span> món
            </div>
          </div>

          {/* Danh mục tab cuộn ngang */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-gold text-black font-semibold'
                    : 'bg-surface-card text-[#A0A0A5] hover:text-white border border-surface-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách món ăn với công tắc Còn / Hết hàng */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-surface-border/60 custom-scrollbar space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#8E8E93]">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-gold" />
              <span className="text-xs">Đang tải danh sách món ăn từ cơ sở dữ liệu...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#8E8E93] italic">
              Không tìm thấy món ăn nào phù hợp
            </div>
          ) : (
            filteredItems.map((item) => {
            const isAvailable = item.isAvailable;
            const isLoading = loadingItemId === item.id;

            return (
              <div
                key={item.id}
                className="pt-2 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-11 h-11 rounded-lg object-cover bg-black border border-surface-border flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100/1e1e22/d4af37?text=HOTPOT';
                    }}
                  />
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${isAvailable ? 'text-white' : 'text-[#8E8E93] line-through'}`}>
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#8E8E93]">
                      {item.categoryName} • <span className="font-mono text-gold">{item.price?.toLocaleString('vi-VN')} đ</span>
                    </p>
                  </div>
                </div>

                {/* Công tắc Báo Hết / Còn Hàng */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleToggleStock(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border flex-shrink-0 active:scale-95 ${
                    isAvailable
                      ? 'bg-jade/15 text-jade-bright border-jade/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40'
                      : 'bg-crimson/20 text-red-400 border-crimson/50 hover:bg-jade/20 hover:text-jade-bright hover:border-jade/40'
                  }`}
                  title={isAvailable ? 'Nhấn để BÁO HẾT HÀNG' : 'Nhấn để MỞ BÁN LẠI'}
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isAvailable ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Còn Hàng</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>TẠM HẾT</span>
                    </>
                  )}
                </button>
              </div>
            );
          }))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111114] border-t border-surface-border flex items-center justify-between text-xs text-[#8E8E93]">
          <span>Thay đổi được phát realtime đến tất cả điện thoại khách tại bàn</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-card border border-surface-border text-white hover:bg-surface-elevated font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
