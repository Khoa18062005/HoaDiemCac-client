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
  {
    id: 'QR_TABLES',
    code: 'tables_qr',
    label: 'Quản Lý Bàn & QR',
    description: 'Thiết lập danh sách bàn theo khu vực và tạo/in mã QR gọi món tại bàn',
    category: 'Vận hành bàn',
    icon: 'QrCode',
    color: '#34A853',
  },
  {
    id: 'KDS_ORDERS',
    code: 'kds_orders',
    label: 'Khách Gọi Món & Bếp KDS',
    description: 'Xem đơn gọi món của khách, gửi món vào bếp và quản lý tiến độ ra món',
    category: 'Bếp & Đơn hàng',
    icon: 'ChefHat',
    color: '#E65100',
  },
  {
    id: 'INVOICES',
    code: 'invoices',
    label: 'Lịch Sử Hóa Đơn & Thu Ngân',
    description: 'Xem lịch sử đơn thanh toán, xuất phiếu tạm tính và in hóa đơn thanh toán',
    category: 'Thu ngân',
    icon: 'ReceiptText',
    color: '#29B6F6',
  },
  {
    id: 'REPORTS',
    code: 'reports',
    label: 'Báo Cáo Doanh Thu',
    description: 'Thống kê doanh thu theo ngày/tháng, số lượng bàn phục vụ và món bán chạy',
    category: 'Kinh doanh',
    icon: 'BarChart3',
    color: '#AB47BC',
  },
  {
    id: 'EMPLOYEES',
    code: 'employees',
    label: 'Quản Lý Nhân Viên',
    description: 'Tạo tài khoản nhân viên, cấp phát mật khẩu tự động và phân quyền chức năng',
    category: 'Quản trị',
    icon: 'ShieldCheck',
    color: '#FFD54F',
  },
];

// Quyền mẫu định sẵn theo từng vị trí làm việc
export const ROLE_PERMISSION_PRESETS = [
  {
    roleId: 'SERVER',
    name: 'Phục Vụ Bàn',
    permissions: ['TABLES', 'KDS_ORDERS'],
  },
  {
    roleId: 'CASHIER',
    name: 'Thu Ngân',
    permissions: ['TABLES', 'INVOICES', 'REPORTS'],
  },
  {
    roleId: 'KITCHEN',
    name: 'Bếp / Pha Chế',
    permissions: ['MENU', 'KDS_ORDERS'],
  },
  {
    roleId: 'MANAGER',
    name: 'Quản Lý Ca',
    permissions: ['TABLES', 'MENU', 'QR_TABLES', 'KDS_ORDERS', 'INVOICES', 'REPORTS'],
  },
  {
    roleId: 'ADMIN',
    name: 'Quản Trị Viên (Toàn Quyền)',
    permissions: ['TABLES', 'MENU', 'QR_TABLES', 'KDS_ORDERS', 'INVOICES', 'REPORTS', 'EMPLOYEES'],
  },
];

/**
 * Hàm sinh mật khẩu tự động cho nhân viên:
 * - Tổng chiều dài đúng 6 ký tự
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

  // 2 ký tự còn lại để đủ 6 ký tự: Lấy ngẫu nhiên từ tập hợp hỗn hợp
  const mixedPool = upperLetters + lowerLetters + digits + specialChars;
  remainingSlots.push(mixedPool[Math.floor(Math.random() * mixedPool.length)]);
  remainingSlots.push(mixedPool[Math.floor(Math.random() * mixedPool.length)]);

  // Trộn ngẫu nhiên 5 ký tự phía sau
  for (let i = remainingSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingSlots[i], remainingSlots[j]] = [remainingSlots[j], remainingSlots[i]];
  }

  return char0 + remainingSlots.join('');
}

// Danh sách nhân viên ban đầu của nhà hàng
export const initialEmployees = [
  {
    id: 'emp-001',
    code: 'QL-01',
    fullName: 'Trần Gia Hưng',
    email: 'hung.tran@hoadiemcac.vn',
    phone: '0908 123 456',
    role: 'Quản Lý Ca Tối',
    rolePreset: 'MANAGER',
    permissions: ['TABLES', 'MENU', 'QR_TABLES', 'KDS_ORDERS', 'INVOICES', 'REPORTS'],
    status: 'ACTIVE',
    createdAt: '2026-03-01T08:00:00Z',
    lastLoginAt: '2026-09-14T21:45:00Z',
  },
  {
    id: 'emp-002',
    code: 'TN-01',
    fullName: 'Lê Thục Anh',
    email: 'thucanh.le@hoadiemcac.vn',
    phone: '0912 345 678',
    role: 'Thu Ngân Quầy 1',
    rolePreset: 'CASHIER',
    permissions: ['TABLES', 'INVOICES', 'REPORTS'],
    status: 'ACTIVE',
    createdAt: '2026-03-10T09:30:00Z',
    lastLoginAt: '2026-09-14T20:10:00Z',
  },
  {
    id: 'emp-003',
    code: 'PV-01',
    fullName: 'Nguyễn Văn Hoàng',
    email: 'hoang.nguyen@hoadiemcac.vn',
    phone: '0938 765 432',
    role: 'Trưởng Ca Phục Vụ',
    rolePreset: 'SERVER',
    permissions: ['TABLES', 'KDS_ORDERS'],
    status: 'ACTIVE',
    createdAt: '2026-04-05T14:15:00Z',
    lastLoginAt: '2026-09-14T19:25:00Z',
  },
  {
    id: 'emp-004',
    code: 'BP-01',
    fullName: 'Phạm Quốc Bảo',
    email: 'bao.pham@hoadiemcac.vn',
    phone: '0977 889 900',
    role: 'Bếp Trưởng Nước Lẩu',
    rolePreset: 'KITCHEN',
    permissions: ['MENU', 'KDS_ORDERS'],
    status: 'ACTIVE',
    createdAt: '2026-04-12T10:00:00Z',
    lastLoginAt: '2026-09-14T18:00:00Z',
  },
  {
    id: 'emp-005',
    code: 'PV-02',
    fullName: 'Đỗ Thảo Vy',
    email: 'thaovy.do@hoadiemcac.vn',
    phone: '0981 223 344',
    role: 'Nhân Viên Phục Vụ VIP',
    rolePreset: 'SERVER',
    permissions: ['TABLES', 'KDS_ORDERS'],
    status: 'INACTIVE',
    createdAt: '2026-05-18T16:00:00Z',
    lastLoginAt: '2026-08-30T22:15:00Z',
  },
];

const STORAGE_KEY = 'hoadiemcac_employees_list';

// Helper tải danh sách nhân viên từ localStorage hoặc fallback về mặc định
export function loadEmployeesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return initialEmployees;
}

// Helper lưu danh sách nhân viên vào localStorage
export function saveEmployeesToStorage(employees) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch {
    // ignore
  }
}
