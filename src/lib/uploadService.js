import apiClient from '@/lib/axios';

/**
 * Service tải ảnh món ăn từ máy tính cá nhân.
 * Gửi file trực tiếp lên Backend Spring Boot REST API (/api/v1/public/upload/image).
 * Backend sẽ chịu trách nhiệm tải ảnh lên CDN (Cloudinary) và trả về link URL ảnh trực tiếp.
 */
export async function uploadImageToCDN(file) {
  if (!file) {
    throw new Error('Vui lòng chọn tệp hình ảnh');
  }

  // 1. Kiểm tra định dạng tệp ảnh
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WEBP hoặc GIF');
  }

  // 2. Kiểm tra dung lượng (tối đa 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Dung lượng hình ảnh vượt quá giới hạn 10MB');
  }

  // 3. Đóng gói FormData và gửi trực tiếp về Backend
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/public/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const fileUrl = typeof response === 'string' ? response : (response?.result || response?.data);
    if (!fileUrl) {
      throw new Error('Không nhận được link ảnh từ máy chủ');
    }

    return {
      url: fileUrl,
      provider: fileUrl.includes('cloudinary') ? 'Cloudinary CDN' : 'Server CDN',
    };
  } catch (err) {
    console.error('Lỗi khi tải ảnh lên máy chủ:', err);
    throw new Error(err.message || 'Không thể tải ảnh lên máy chủ');
  }
}

export default uploadImageToCDN;
