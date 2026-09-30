const MODULES = [
  { key: 'orders', label: 'Đơn hàng & Hỏi mua' },
  { key: 'products', label: 'Sản phẩm & Kho hàng' },
  { key: 'finance', label: 'Tài chính' },
  { key: 'promotions', label: 'Giảm giá' },
  { key: 'rfqs', label: 'Yêu cầu báo giá' },
  { key: 'customers', label: 'Khách hàng' },
  { key: 'feed', label: 'Feed & Tin nhắn' },
  { key: 'recruitment', label: 'Tuyển NPP, Đại lý, CTV' },
  { key: 'reports', label: 'Thống kê' },
  { key: 'reviews', label: 'Đánh giá' },
  { key: 'settings', label: 'Cài đặt gian hàng & Thành viên' }
];

const ALL_TRUE = Object.fromEntries(MODULES.map((m) => [m.key, true]));
const ALL_FALSE = Object.fromEntries(MODULES.map((m) => [m.key, false]));

const ROLE_PRESETS = {
  manager: { label: 'Quản lý', permissions: { ...ALL_TRUE } },
  sales: {
    label: 'Nhân viên bán hàng',
    permissions: { ...ALL_FALSE, orders: true, products: true, customers: true, feed: true, promotions: true, reviews: true, rfqs: true }
  },
  warehouse: {
    label: 'Nhân viên kho',
    permissions: { ...ALL_FALSE, orders: true, products: true }
  },
  accountant: {
    label: 'Kế toán',
    permissions: { ...ALL_FALSE, finance: true, reports: true }
  },
  custom: { label: 'Tuỳ chỉnh', permissions: { ...ALL_FALSE } }
};

module.exports = { MODULES, ROLE_PRESETS };
