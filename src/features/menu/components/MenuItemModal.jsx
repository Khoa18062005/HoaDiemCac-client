import React, { useState, useEffect } from 'react';
import { X, Upload, Utensils } from 'lucide-react';
import { MENU_CATEGORIES } from '../data/mockMenuItems';

export default function MenuItemModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    categoryId: 'nuoc-lau',
    price: '',
    unit: '',
    description: '',
    image: '',
    isAvailable: true,
    isFeatured: false,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        categoryId: initialData.categoryId || 'nuoc-lau',
        price: initialData.price || '',
        unit: initialData.unit || '',
        description: initialData.description || '',
        image: initialData.image || '',
        isAvailable: initialData.isAvailable ?? true,
        isFeatured: initialData.isFeatured ?? false,
      });
    } else {
      setFormData({
        name: '',
        categoryId: 'nuoc-lau',
        price: '',
        unit: '',
        description: '',
        image: '',
        isAvailable: true,
        isFeatured: false,
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên món ăn');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Giá món ăn phải lớn hơn 0 ₫');
      return;
    }

    const catObj = MENU_CATEGORIES.find(c => c.id === formData.categoryId);

    onSave({
      ...(initialData || {}),
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      categoryName: catObj ? catObj.label : 'Món Khác',
      price: Number(formData.price),
      unit: formData.unit.trim() || 'Phần',
      description: formData.description.trim(),
      image: formData.image.trim(),
      isAvailable: formData.isAvailable,
      isFeatured: formData.isFeatured,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4 font-sans animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold"></span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {isEditing ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-crimson/20 border border-crimson text-[#ff8080] font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Tên món */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold">Tên món ăn *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Lẩu Nấm Đông Trùng Hạ Thảo"
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Danh mục & Đơn vị tính */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[#A0A0A5] font-semibold">Danh mục *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white focus:border-gold/60 focus:outline-none transition-all"
              >
                {MENU_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-surface-card text-white">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A0A0A5] font-semibold">Đơn vị tính</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="VD: Nồi 2 ngăn, Khay 250g..."
                className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Giá bán */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold">Giá bán (VNĐ) *</label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="VD: 350000"
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-gold font-bold placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Link ảnh & Preview */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold">URL Ảnh món ăn</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3 py-2 bg-surface rounded-lg border border-surface-border text-white placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
              />
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface border border-surface-border flex items-center justify-center flex-shrink-0">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Utensils className="w-4 h-4 text-[#656569]" />
                )}
              </div>
            </div>
          </div>

          {/* Mô tả món ăn */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold">Mô tả nguyên liệu / hương vị</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn gọn về món ăn..."
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Các tùy chọn boolean */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="rounded text-jade-bright focus:ring-0 cursor-pointer"
              />
              <span className="text-white font-medium">Đang bán</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded text-gold focus:ring-0 cursor-pointer"
              />
              <span className="text-gold font-medium">Món đặc sắc (HOT)</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover text-[#A0A0A5] hover:text-white font-medium transition-all"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-crimson hover:bg-crimson-glow text-white font-bold shadow-md shadow-crimson/30 transition-all active:scale-95"
            >
              {isEditing ? 'Lưu Thay Đổi' : 'Thêm Món Ăn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
