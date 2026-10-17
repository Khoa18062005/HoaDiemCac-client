import apiClient from '@/lib/axios';

/**
 * Kiểm tra cấu trúc Magic Bytes đầu tệp hình ảnh để phát hiện tệp thực thi / nhị phân giả mạo đuôi ảnh
 * @param {File} file
 * @returns {Promise<{ isValid: boolean, reason?: string }>}
 */
export async function validateImageMagicBytes(file) {
  if (!file) return { isValid: false, reason: 'Tệp không tồn tại' };

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!reader.result) {
        resolve({ isValid: false, reason: 'Không thể đọc nội dung tệp' });
        return;
      }
      const arr = new Uint8Array(reader.result);
      if (arr.length < 4) {
        resolve({ isValid: false, reason: 'Tệp rỗng hoặc quá ngắn' });
        return;
      }

      // Phát hiện tệp thực thi Windows PE / DOS (.exe, .dll, .sys): 0x4D, 0x5A ("MZ")
      if (arr[0] === 0x4d && arr[1] === 0x5a) {
        resolve({ isValid: false, reason: 'Phát hiện tệp thực thi Windows (PE/EXE) giả mạo' });
        return;
      }

      // Phát hiện tệp thực thi Linux ELF: 0x7F, 'E', 'L', 'F'
      if (arr[0] === 0x7f && arr[1] === 0x45 && arr[2] === 0x4c && arr[3] === 0x46) {
        resolve({ isValid: false, reason: 'Phát hiện tệp thực thi Linux (ELF) giả mạo' });
        return;
      }

      // Phát hiện tệp nén / Office (PK..): 0x50, 0x4B, 0x03, 0x04
      if (arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04) {
        resolve({ isValid: false, reason: 'Phát hiện tệp lưu trữ/nén (ZIP/PK)' });
        return;
      }

      // Phát hiện tệp tài liệu PDF: 0x25, 0x50, 0x44, 0x46 (%PDF)
      if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
        resolve({ isValid: false, reason: 'Phát hiện tệp tài liệu PDF' });
        return;
      }

      // 1. JPEG: FF D8 FF
      const isJpeg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff;
      // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
      const isPng =
        arr.length >= 8 &&
        arr[0] === 0x89 &&
        arr[1] === 0x50 &&
        arr[2] === 0x4e &&
        arr[3] === 0x47 &&
        arr[4] === 0x0d &&
        arr[5] === 0x0a &&
        arr[6] === 0x1a &&
        arr[7] === 0x0a;
      // 3. GIF: GIF8
      const isGif = arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38;
      // 4. WEBP: RIFF....WEBP
      const isWebp =
        arr.length >= 12 &&
        arr[0] === 0x52 &&
        arr[1] === 0x49 &&
        arr[2] === 0x46 &&
        arr[3] === 0x46 &&
        arr[8] === 0x57 &&
        arr[9] === 0x45 &&
        arr[10] === 0x42 &&
        arr[11] === 0x50;

      if (isJpeg || isPng || isGif || isWebp) {
        resolve({ isValid: true });
      } else {
        resolve({ isValid: false, reason: 'Cấu trúc byte không tương thích với định dạng hình ảnh' });
      }
    };
    reader.onerror = () => resolve({ isValid: false, reason: 'Lỗi khi đọc byte của tệp' });
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
}

/**
 * Service tải ảnh món ăn từ máy tính cá nhân.
 * Gửi file trực tiếp lên Backend Spring Boot REST API (/api/v1/public/upload/image).
 * Backend sẽ chịu trách nhiệm tải ảnh lên CDN (Cloudinary) và trả về link URL ảnh trực tiếp.
 */
export async function uploadImageToCDN(file) {
  if (!file) {
    throw new Error('Vui lòng chọn tệp hình ảnh');
  }

  // 1. Kiểm tra định dạng tệp ảnh bề mặt
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WEBP hoặc GIF');
  }

  // 2. Kiểm tra cấu trúc byte thực tế (Magic Bytes)
  const magicCheck = await validateImageMagicBytes(file);
  if (!magicCheck.isValid) {
    throw new Error('Tệp không phải là hình ảnh hợp lệ. Vui lòng chọn tệp hình ảnh thực tế (JPG, PNG, WEBP, GIF).');
  }

  // 3. Kiểm tra dung lượng (tối đa 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Dung lượng hình ảnh vượt quá giới hạn 10MB');
  }

  // 4. Đóng gói FormData và gửi trực tiếp về Backend
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
    const serverMessage = err.response?.data?.message || err.message || '';
    if (serverMessage.toLowerCase().includes('invalid image') || serverMessage.toLowerCase().includes('cloudinary') || serverMessage.toLowerCase().includes('không tương thích') || serverMessage.toLowerCase().includes('không hợp lệ')) {
      throw new Error(
        serverMessage.includes('Dịch vụ lưu trữ từ chối') || serverMessage.includes('không hợp lệ')
          ? serverMessage
          : 'Dịch vụ lưu trữ từ chối tệp: Định dạng ảnh không hợp lệ hoặc tệp ảnh bị hỏng. Vui lòng chọn tệp ảnh khác.'
      );
    }
    throw new Error(serverMessage || 'Không thể tải ảnh lên máy chủ');
  }
}

export default uploadImageToCDN;
