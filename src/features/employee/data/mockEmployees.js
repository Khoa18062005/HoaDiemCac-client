// Hệ thống chức năng phân quyền trong nhà hàng Hỏa Diệm Các
export const SYSTEM_PERMISSIONS = [
  {
    id: 'TABLES',
    code: 'tables',
    label: 'Sơ Đồ Bàn Ăn',
    description: 'Xem trạng thái bàn, xếp chỗ, đổi trạng thái bàn và xử lý chuông gọi',
    category: 'Vận hành bàn',
    icon: 'LayoutGrid',
    color: '#D4AF37',
  },
  {
    id: 'MENU',
    code: 'menu',
    label: 'Quản Lý Thực Đơn',
    description: 'Xem danh sách món, thêm mới, sửa giá và cập nhật trạng thái còn/hết món',
    category: 'Thực đơn & Giá',
    icon: 'UtensilsCrossed',
    color: '#C41E3A',
  },
];

// Quyền mẫu định sẵn theo từng vị trí làm việc
export const ROLE_PERMISSION_PRESETS = [
  {
    roleId: 'SERVER',
    name: 'Phục Vụ Bàn',
    permissions: ['TABLES'],
  },
  {
    roleId: 'CASHIER',
    name: 'Thu Ngân',
    permissions: ['TABLES'],
  },
  {
    roleId: 'KITCHEN',
    name: 'Bếp / Pha Chế',
    permissions: ['MENU'],
  },
  {
    roleId: 'MANAGER',
    name: 'Quản Lý Ca',
    permissions: ['TABLES', 'MENU'],
  },
  {
    roleId: 'ADMIN',
    name: 'Quản Trị Viên (Toàn Quyền)',
    permissions: ['TABLES', 'MENU'],
  },
];

/**
 * Hàm sinh mật khẩu tự động cho nhân viên:
 * - Tổng chiều dài đúng 8 ký tự
 * - Ký tự đầu tiên: Viết hoa ([A-Z])
 * - Có chứa chữ thường ([a-z])
 * - Có chứa chữ số ([0-9])
 * - Có chứa ký tự đặc biệt (!@#$%&*)
 */
export function generateEmployeePassword() {
  const upperLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowerLetters = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const specialChars = '!@#$%&*';

  // Ký tự đầu tiên: Bắt buộc viết hoa
  const char0 = upperLetters[Math.floor(Math.random() * upperLetters.length)];

  // 3 ký tự kế tiếp: Đảm bảo có ít nhất 1 chữ thường, 1 số, 1 ký tự đặc biệt
  const remainingSlots = [
    lowerLetters[Math.floor(Math.random() * lowerLetters.length)],
    digits[Math.floor(Math.random() * digits.length)],
    specialChars[Math.floor(Math.random() * specialChars.length)],
  ];

  // 4 ký tự còn lại để đủ 8 ký tự: Lấy ngẫu nhiên từ tập hợp hỗn hợp
  const mixedPool = upperLetters + lowerLetters + digits + specialChars;
  remainingSlots.push(mixedPool[Math.floor(Math.random() * mixedPool.length)]);
  remainingSlots.push(mixedPool[Math.floor(Math.random() * mixedPool.length)]);
  remainingSlots.push(mixedPool[Math.floor(Math.random() * mixedPool.length)]);
  remainingSlots.push(mixedPool[Math.floor(Math.random() * mixedPool.length)]);

  // Trộn ngẫu nhiên 7 ký tự phía sau
  for (let i = remainingSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingSlots[i], remainingSlots[j]] = [remainingSlots[j], remainingSlots[i]];
  }

  return char0 + remainingSlots.join('');
}

export const initialEmployees = [];

const STORAGE_KEY = 'hoadiemcac_employees_list';

// Helper tải danh sách nhân viên từ localStorage hoặc fallback về mặc định
export function loadEmployeesFromStorage() {
  // Force clear mock data from localStorage
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return [];
}

// Helper lưu danh sách nhân viên vào localStorage
export function saveEmployeesToStorage(employees) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch {
    // ignore
  }
}
