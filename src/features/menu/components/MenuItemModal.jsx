import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Utensils,
  ImagePlus,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Trash2,
  Globe,
  HardDrive
} from 'lucide-react';
import { uploadImageToCDN } from '@/lib/uploadService';

export default function MenuItemModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  categories = [],
}) {
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef(null);
  const defaultCategory = categories[0]?.slug || String(categories[0]?.id || '');

  const [formData, setFormData] = useState({
    name: '',
    categoryId: defaultCategory,
    price: '',
    unit: '',
    description: '',
    image: '',
    isAvailable: true,
    isFeatured: false,
  });

  // State cho chế độ chọn ảnh: 'upload' (từ máy tính qua CDN) | 'url' (nhập link)
  const [imageMode, setImageMode] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const fallbackCat = categories[0]?.slug || String(categories[0]?.id || '');
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        categoryId: initialData.categoryId || fallbackCat,
        price: initialData.price || '',
        unit: initialData.unit || '',
        description: initialData.description || '',
        image: initialData.image || initialData.imageUrl || '',
        isAvailable: initialData.isAvailable ?? true,
        isFeatured: initialData.isFeatured ?? false,
      });
      setImageMode('upload');
    } else {
      setFormData({
        name: '',
        categoryId: fallbackCat,
        price: '',
        unit: '',
        description: '',
        image: '',
        isAvailable: true,
        isFeatured: false,
      });
      setImageMode('upload');
    }
    setError('');
    setIsSaving(false);
    setSelectedFile(null);
    setPreviewUrl('');

    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Xử lý khi người dùng chọn file ảnh từ máy tính (chưa upload ngay mà tạo preview)
  const handleSelectFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa là 10MB');
      return;
    }

    // Thu hồi link blob cũ nếu có
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const localUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localUrl);
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleSelectFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Hủy file ảnh vừa chọn từ máy tính
  const handleCancelSelectedFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xóa ảnh hoàn toàn
  const handleRemoveImage = () => {
    handleCancelSelectedFile();
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  // Xử lý khi nhấn nút Lưu: Upload ảnh lên CDN (nếu có file mới) và lưu vào Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên món ăn');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Giá món ăn phải lớn hơn 0 ₫');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      let finalImageUrl = formData.image?.trim() || '';

      // Chỉ khi người dùng bấm Lưu mới tải ảnh lên CDN và lấy link trực tiếp
      if (selectedFile) {
        const uploadResult = await uploadImageToCDN(selectedFile);
        finalImageUrl = uploadResult.url;
      }

      const availableCategories = Array.isArray(categories) ? categories : [];
      const catObj = availableCategories.find((c) => (c.id || c.slug) === formData.categoryId);

      await onSave({
        ...(initialData || {}),
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        categoryName: catObj ? (catObj.label || catObj.name) : 'Món Khác',
        price: Number(formData.price),
        unit: formData.unit.trim() || 'Phần',
        description: formData.description.trim(),
        image: finalImageUrl,
        imageUrl: finalImageUrl,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
      });

      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu món ăn và ảnh CDN:', err);
      setError(err.message || 'Không thể lưu món ăn. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  const availableCategories = Array.isArray(categories) && categories.length > 0 ? categories : MENU_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm p-4 font-sans animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
            className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-surface-elevated transition-colors cursor-pointer"
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
              placeholder="VD: Lẩu 9 Ngăn Trùng Khánh Đại Hồng Bào"
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
                {availableCategories.filter((c) => (c.id || c.slug) !== 'all').map((cat) => (
                  <option
                    key={cat.id || cat.slug}
                    value={cat.id || cat.slug}
                    className="bg-surface-card text-white"
                  >
                    {cat.label || cat.name}
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
                placeholder="VD: Nồi 9 ngăn, Khay 250g..."
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
              placeholder="VD: 389000"
              className="w-full px-3 py-2 bg-surface rounded-lg border border-surface-border text-gold font-bold placeholder:text-[#656569] focus:border-gold/60 focus:outline-none transition-all"
            />
          </div>

          {/* ========================================================================= */}
          {/* KHU VỰC TẢI ẢNH TỪ MÁY TÍNH CÁ NHÂN / QUA CDN                             */}
          {/* ========================================================================= */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[#A0A0A5] font-semibold flex items-center gap-1.5">
                <span>Hình ảnh món ăn</span>
                <span className="text-[10px] text-gold">(Lưu trữ CDN)</span>
              </label>

              {/* Chuyển đổi phương thức: Từ máy tính hoặc Nhập URL */}
              <div className="flex items-center p-0.5 bg-surface rounded-lg border border-surface-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${imageMode === 'upload'
                      ? 'bg-gold/20 text-gold font-bold border border-gold/40'
                      : 'text-[#8E8E93] hover:text-white'
                    }`}
                >
                  <HardDrive className="w-3 h-3" />
                  <span>Từ máy tính</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${imageMode === 'url'
                      ? 'bg-gold/20 text-gold font-bold border border-gold/40'
                      : 'text-[#8E8E93] hover:text-white'
                    }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Link URL</span>
                </button>
              </div>
            </div>

            {/* Input file ẩn từ máy tính */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Chế độ 1: Tải ảnh từ máy tính lên CDN */}
            {imageMode === 'upload' && (
              <div className="space-y-2">
                {previewUrl ? (
                  // Trường hợp 1: Người dùng vừa chọn ảnh mới từ máy tính (chờ bấm Lưu mới tải lên CDN)
                  <div className="p-3 bg-surface rounded-xl border border-gold/50 flex items-center gap-4 bg-gold/[0.03]">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-elevated border border-gold/40 flex-shrink-0 flex items-center justify-center relative shadow-md">
                      <img
                        src={previewUrl}
                        alt="Preview ảnh mới"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold mb-1">
                        <Upload className="w-3.5 h-3.5 text-gold animate-bounce" />
                        <span>Ảnh mới (Sẽ tải lên CDN khi bấm Lưu)</span>
                      </div>
                      <p className="text-[11px] text-white font-medium truncate">
                        {selectedFile?.name || 'Tệp hình ảnh'}
                      </p>
                      <span className="text-[10px] text-[#A0A0A5] font-mono">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 text-gold border border-surface-border text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelSelectedFile}
                        className="p-1 rounded-lg text-[#8E8E93] hover:text-crimson hover:bg-crimson/10 transition-colors cursor-pointer self-center"
                        title="Hủy chọn ảnh mới"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : formData.image ? (
                  // Trường hợp 2: Đã có ảnh từ trước (CDN hoặc URL)
                  <div className="p-3 bg-surface rounded-xl border border-surface-border flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-elevated border border-surface-border flex-shrink-0 flex items-center justify-center relative">
                      <img
                        src={formData.image}
                        alt="Dish Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-jade-bright text-[11px] font-bold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ảnh hiện tại (Lưu trữ CDN)</span>
                      </div>
                      <p className="text-[11px] font-mono text-[#A0A0A5] truncate select-all bg-surface-card px-2 py-1 rounded border border-surface-border/80">
                        {formData.image}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 text-gold border border-surface-border text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1 rounded-lg text-[#8E8E93] hover:text-crimson hover:bg-crimson/10 transition-colors cursor-pointer self-center"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Trường hợp 3: Chưa có ảnh nào -> Hiển thị khung Dropzone
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-gold bg-gold/10'
                        : 'border-surface-border hover:border-gold/60 hover:bg-surface-elevated/30 bg-surface'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-xs">
                          Nhấn để chọn ảnh từ máy tính cá nhân
                        </p>
                        <p className="text-[11px] text-[#8E8E93]">
                          hoặc kéo thả tệp hình ảnh vào đây
                        </p>
                      </div>
                      <span className="text-[10px] text-[#656569] font-mono">
                        Hỗ trợ JPG, PNG, WEBP, GIF (Chỉ tải lên CDN khi bấm Lưu)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chế độ 2: Nhập link URL trực tiếp */}
            {imageMode === 'url' && (
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
            )}
          </div>

          {/* Mô tả món ăn */}
          <div className="space-y-1.5">
            <label className="text-[#A0A0A5] font-semibold">Mô tả nguyên liệu / hương vị</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả ngắn gọn về món ăn, gia vị đặc trưng..."
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
                className="rounded text-jade-bright focus:ring-0 cursor-pointer w-4 h-4"
              />
              <span className="text-white font-medium">Đang bán</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded text-gold focus:ring-0 cursor-pointer w-4 h-4"
              />
              <span className="text-gold font-medium">Món đặc sắc (HOT)</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover text-[#A0A0A5] hover:text-white font-medium transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-crimson hover:bg-crimson-glow text-white font-bold shadow-md shadow-crimson/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{selectedFile ? 'Đang tải ảnh CDN & Lưu...' : 'Đang lưu vào Database...'}</span>
                </>
              ) : (
                <span>{isEditing ? 'Lưu Thay Đổi' : 'Thêm Món Ăn'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
