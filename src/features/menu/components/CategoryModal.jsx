import React, { useState, useEffect } from 'react';
import { X, Layers, Sparkles } from 'lucide-react';

/**
 * Hàm chuyển đổi chuỗi tiếng Việt có dấu thành slug thân thiện URL
 */
function toSlug(str) {
  if (!str) return '';
  let s = str.toLowerCase().trim();
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[đĐ]/g, 'd');
  s = s.replace(/[^a-z0-9\s-]/g, '');
  s = s.replace(/\s+/g, '-').replace(/-+/g, '-');
  return s;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    displayOrder: 1,
    description: '',
    isActive: true,
  });

  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        displayOrder: initialData.displayOrder ?? 1,
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
      });
      setIsCustomSlug(true);
    } else {
      setFormData({
        name: '',
        slug: '',
        displayOrder: 1,
        description: '',
        isActive: true,
      });
      setIsCustomSlug(false);
    }
    setError('');
    setSubmitting(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: newName,
      slug: isCustomSlug ? prev.slug : toSlug(newName),
    }));
  };

  const handleSlugChange = (e) => {
    setIsCustomSlug(true);
    setFormData((prev) => ({
      ...prev,
      slug: toSlug(e.target.value),
    }));
  };

  const handleAutoSlug = () => {
    const generated = toSlug(formData.name);
    setFormData((prev) => ({ ...prev, slug: generated }));
    setIsCustomSlug(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    const finalSlug = formData.slug.trim() || toSlug(formData.name);

    try {
      setSubmitting(true);
      setError('');
      await onSave({
        name: formData.name.trim(),
        slug: finalSlug,
        displayOrder: Number(formData.displayOrder) || 0,
        description: formData.description.trim(),
        isActive: formData.isActive,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu danh mục');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4 font-sans animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {isEditing ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
              </h3>
              <p className="text-[11px] text-[#8E8E93]">
                {isEditing ? `ID: #${initialData.id}` : 'Tạo nhóm thực đơn hiển thị trên hệ thống'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-crimson/20 border border-crimson text-[#ff8080] font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Tên danh mục */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold flex items-center justify-between">
              <span>Tên nhóm danh mục *</span>
              <span className="text-[10px] text-[#6E6E78]">VD: Nước Lẩu Hoàng Gia</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="VD: Hải Sản Thượng Hạng"
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Mã Slug định danh & Nút tạo tự động */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[#A0A0A5] font-semibold">Mã Slug định danh URL *</label>
              <button
                type="button"
                onClick={handleAutoSlug}
                className="text-[11px] text-gold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Tạo tự động
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="vd: hai-san-thuong-hang"
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-gold font-mono placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Thứ tự hiển thị */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold flex items-center justify-between">
              <span>Thứ tự hiển thị ưu tiên</span>
              <span className="text-[10px] text-[#6E6E78]">Số nhỏ hơn hiển thị trước</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Mô tả danh mục */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold">Mô tả đặc trưng danh mục</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Giới thiệu phong vị hoặc nguyên liệu đặc trưng của nhóm món..."
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-white placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* Kích hoạt hiển thị */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-jade-bright focus:ring-0 cursor-pointer w-4 h-4"
              />
              <div>
                <span className="text-white font-medium">Kích hoạt hiển thị</span>
                <p className="text-[11px] text-[#8E8E93]">Hiển thị danh mục này trên thực đơn gọi món của khách</p>
              </div>
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
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-crimson hover:bg-crimson-glow text-white font-bold shadow-md shadow-crimson/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Đang lưu...' : isEditing ? 'Lưu Thay Đổi' : 'Thêm Danh Mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
