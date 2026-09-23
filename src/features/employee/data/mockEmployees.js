// Hệ thống chức năng phân quyền trong nhà hàng Hỏa Diệm Các
export const SYSTEM_PERMISSIONS = [
  {
    id: 'TABLES',
    code: 'tables',
    label: 'Sơ Đồ Bàn Ăn',
    description: 'Xem trạng thái bàn ăn, xếp chỗ, đổi trạng thái bàn và xử lý chuông gọi phục vụ',
    category: 'Vận hành bàn',
    icon: 'LayoutGrid',
    color: '#D4AF37',
  },
  {
    id: 'KITCHEN',
    code: 'kitchen',
    label: 'Xem Màn Hình Bếp',
    description: 'Xem màn hình điều phối bếp KDS, cập nhật tiến độ chế biến và hoàn thành món',
    category: 'Điều phối bếp',
    icon: 'ChefHat',
    color: '#E67E22',
  },
  {
    id: 'WAITER',
    code: 'waiter',
    label: 'Xem Màn Hình Phục Vụ',
    description: 'Xem màn hình nhân viên phục vụ, gọi món tại bàn, nhận thông báo trả món',
    category: 'Phục vụ bàn',
    icon: 'UtensilsCrossed',
    color: '#3498DB',
  },
  {
    id: 'MENU',
    code: 'menu',
    label: 'Quản Lý Thực Đơn',
    description: 'Xem danh sách món, thêm mới, điều chỉnh giá và cập nhật trạng thái còn/hết món',
    category: 'Thực đơn & Giá',
    icon: 'ReceiptText',
    color: '#C41E3A',
  },
  {
    id: 'EMPLOYEES',
    code: 'employees',
    label: 'Quản Lý Nhân Viên',
    description: 'Quản lý tài khoản nhân sự, phân quyền truy cập và kiểm soát trạng thái hoạt động',
    category: 'Quản trị nhân sự',
    icon: 'ShieldCheck',
    color: '#E74C3C',
  },
  {
    id: 'PROFILE',
    code: 'profile',
    label: 'Hồ Sơ Cá Nhân',
    description: 'Xem và cập nhật thông tin cá nhân, đổi mật khẩu và quản lý thông tin tài khoản',
    category: 'Tài khoản cá nhân',
    icon: 'User',
    color: '#95A5A6',
  },
  {
    id: 'TABLES_QR',
    code: 'tables_qr',
    label: 'Quản Lý Bàn & QR',
    description: 'Quản lý sơ đồ vị trí bàn tiệc, cấu hình khu vực và tạo/in mã QR gọi món',
    category: 'Mã QR & Bàn',
    icon: 'QrCode',
    color: '#9B59B6',
  },
  {
    id: 'INVOICES',
    code: 'invoices',
    label: 'Lịch Sử Hóa Đơn',
    description: 'Tra cứu lịch sử thanh toán hóa đơn, đối soát phiếu thu và thông tin chi tiết đơn hàng',
    category: 'Thanh toán & Thu ngân',
    icon: 'ReceiptText',
    color: '#1ABC9C',
  },
  {
    id: 'DASHBOARD',
    code: 'dashboard',
    label: 'Báo Cáo Doanh Thu',
    description: 'Xem báo cáo doanh thu tổng quan, thống kê doanh số theo ngày/tháng và biểu đồ tăng trưởng',
    category: 'Báo cáo thống kê',
    icon: 'BarChart3',
    color: '#2ECC71',
  },
];

// Quyền mẫu định sẵn theo 4 vị trí làm việc trong hệ thống
export const ROLE_PERMISSION_PRESETS = [
  {
    roleId: 'STAFF',
    name: 'Phục Vụ',
    permissions: ['WAITER'],
  },
  {
    roleId: 'KITCHEN',
    name: 'Bếp',
    permissions: ['KITCHEN'],
  },
  {
    roleId: 'MANAGER',
    name: 'Quản Lý',
    permissions: ['DASHBOARD', 'INVOICES', 'MENU', 'KITCHEN', 'WAITER', 'TABLES_QR'],
  },
  {
    roleId: 'ADMIN',
    name: 'Quản Trị Viên',
    permissions: ['TABLES', 'KITCHEN', 'WAITER', 'MENU', 'EMPLOYEES', 'PROFILE', 'TABLES_QR', 'INVOICES', 'DASHBOARD'],
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
