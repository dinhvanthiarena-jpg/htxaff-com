require('dotenv').config();

const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');
const {
  sequelize, syncModels, Shop, Category, Product, Order, Promotion, Review,
  Notification, Rfq, Quotation, Conversation, FeedPost, Customer, Recruitment,
  Branch, Transaction, Member
} = require('./models');
const { ROLE_PRESETS } = require('./data/permissions');

function id() {
  return nanoid(10);
}

// Demo passwords come from env vars so no real credential ever lives in source control.
// Falls back to a random one-time password printed at the end if not set.
const DEMO_PASSWORD = process.env.SEED_PASSWORD || nanoid(12);

async function seed() {
  await syncModels();

  // Wipe all tables (force re-create) for a clean, repeatable demo dataset.
  await sequelize.sync({ force: true });

  const shopId = id();
  const shop = {
    id: shopId,
    email: 'dinhnam0103@gmail.com',
    phone: '0901234567',
    passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10),
    shopName: 'Nam Phát Wholesale Store',
    shopLogo: '',
    businessType: 'Hộ kinh doanh cá thể',
    address: '123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A, Quận 9, TP Hồ Chí Minh',
    addressProvince: 'TP Hồ Chí Minh',
    addressDistrict: 'Quận 9',
    addressWard: 'Phường Tăng Nhơn Phú A',
    addressStreet: '123 Đường Lê Văn Việt',
    bank: {
      bankName: 'Vietcombank',
      accountNumber: '0123456789',
      accountHolder: 'DINH VAN NAM'
    },
    shippingMethods: ['Giao Hàng Nhanh', 'J&T Express'],
    ratingAvg: 4.6,
    tier: 'Thường',
    viewCount: 286,
    taxInfo: '',
    introduction: '',
    salesPolicy: '',
    rfqNotifyEmail: true,
    rfqNotifyCategories: [],
    createdAt: dayjs().subtract(8, 'month').toISOString()
  };
  await Shop.create(shop);

  const categoryNames = ['Thời trang nam', 'Thời trang nữ', 'Gia dụng', 'Mỹ phẩm', 'Thực phẩm khô', 'Đồ điện tử'];
  const categories = categoryNames.map((name) => ({ id: id(), name }));
  await Category.bulkCreate(categories);

  const branches = [
    { id: id(), shopId, name: 'Kho Bình Dương', address: 'Số 5 KCN Sóng Thần, Dĩ An, Bình Dương', isDefault: false }
  ];
  await Branch.bulkCreate(branches);

  const members = [
    {
      id: id(), shopId, name: 'Trần Văn Sales', email: 'sales@htxaff.demo', phone: '0911111111',
      passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'sales', roleLabel: ROLE_PRESETS.sales.label,
      permissions: ROLE_PRESETS.sales.permissions, status: 'active', createdAt: dayjs().subtract(60, 'day').toISOString()
    },
    {
      id: id(), shopId, name: 'Lê Thị Kế Toán', email: 'ketoan@htxaff.demo', phone: '0922222222',
      passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'accountant', roleLabel: ROLE_PRESETS.accountant.label,
      permissions: ROLE_PRESETS.accountant.permissions, status: 'active', createdAt: dayjs().subtract(40, 'day').toISOString()
    }
  ];
  await Member.bulkCreate(members);

  const productSeeds = [
    { name: 'Áo thun cổ tròn unisex form rộng', cat: 0, unit: 'cái', base: 55000, stock: 480 },
    { name: 'Quần jean nam ống suông', cat: 0, unit: 'cái', base: 145000, stock: 220 },
    { name: 'Váy suông linen nữ', cat: 1, unit: 'cái', base: 98000, stock: 150 },
    { name: 'Áo kiểu công sở nữ tay lỡ', cat: 1, unit: 'cái', base: 89000, stock: 310 },
    { name: 'Bộ nồi inox 5 đáy 3 món', cat: 2, unit: 'bộ', base: 320000, stock: 60 },
    { name: 'Chăn ga gối 4 món cotton', cat: 2, unit: 'bộ', base: 265000, stock: 90 },
    { name: 'Kem chống nắng nâng tone SPF50', cat: 3, unit: 'tuýp', base: 42000, stock: 700 },
    { name: 'Son kem lì lâu trôi', cat: 3, unit: 'cây', base: 28000, stock: 900 },
    { name: 'Combo hạt điều rang muối 500g', cat: 4, unit: 'gói', base: 75000, stock: 340 },
    { name: 'Trà atiso túi lọc hộp 20 gói', cat: 4, unit: 'hộp', base: 38000, stock: 500 },
    { name: 'Tai nghe bluetooth thể thao', cat: 5, unit: 'cái', base: 115000, stock: 180 },
    { name: 'Sạc dự phòng 10000mAh', cat: 5, unit: 'cái', base: 165000, stock: 130 }
  ];

  const products = productSeeds.map((p, idx) => {
    const catId = categories[p.cat].id;
    const priceTiers = [
      { minQty: 1, price: p.base },
      { minQty: 10, price: Math.round(p.base * 0.92 / 500) * 500 },
      { minQty: 50, price: Math.round(p.base * 0.85 / 500) * 500 }
    ];
    const hasVariant = idx % 4 === 0;
    return {
      id: id(),
      shopId,
      sku: `SP${String(idx + 1).padStart(4, '0')}`,
      name: p.name,
      categoryId: catId,
      unit: p.unit,
      images: [],
      video: '',
      sizeChartImage: '',
      specs: [{ key: 'Xuất xứ', value: 'Việt Nam' }, { key: 'Chất liệu', value: 'Cao cấp' }],
      priceTiers,
      retailPrice: Math.round(p.base * 1.3 / 1000) * 1000,
      retailSuggestPrice: Math.round(p.base * 1.4 / 1000) * 1000,
      weight: 200 + idx * 30,
      dimensions: { length: 20, width: 15, height: 5 },
      variants: hasVariant ? [
        { color: 'Đen', size: 'M', stock: 30 },
        { color: 'Đen', size: 'L', stock: 25 },
        { color: 'Trắng', size: 'M', stock: 20 },
        { color: 'Trắng', size: 'L', stock: 15 }
      ] : [],
      branchStock: [
        { branchId: 'default', stock: Math.round(p.stock * 0.7) },
        { branchId: branches[0].id, stock: Math.round(p.stock * 0.3) }
      ],
      stock: p.stock,
      sold: Math.floor(Math.random() * 400),
      status: idx === productSeeds.length - 1 ? 'pending' : 'active',
      description: `${p.name} - hàng sỉ chất lượng, đóng gói theo yêu cầu, hỗ trợ xuất hóa đơn VAT.`,
      createdAt: dayjs().subtract(Math.floor(Math.random() * 200), 'day').toISOString()
    };
  });
  await Product.bulkCreate(products);

  const customerNames = ['Trần Thị Hoa', 'Nguyễn Văn Bình', 'Lê Thị Mai', 'Phạm Quốc Huy', 'Đỗ Thị Lan', 'Vũ Đình Khoa'];
  const statuses = ['pending_confirm', 'pending_payment', 'pending_pickup', 'shipping', 'delivered', 'delivered', 'delivered', 'cancelled'];
  const orders = [];
  for (let i = 0; i < 24; i++) {
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const items = [];
    let subtotal = 0;
    for (let j = 0; j < itemCount; j++) {
      const prod = products[Math.floor(Math.random() * products.length)];
      const qty = [1, 5, 10, 20, 50][Math.floor(Math.random() * 5)];
      const tier = [...prod.priceTiers].reverse().find((t) => qty >= t.minQty) || prod.priceTiers[0];
      const lineTotal = tier.price * qty;
      subtotal += lineTotal;
      items.push({ productId: prod.id, name: prod.name, qty, price: tier.price });
    }
    const shippingFee = 25000;
    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.05 / 1000) * 1000 : 0;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = dayjs().subtract(Math.floor(Math.random() * 45), 'day');
    orders.push({
      id: id(),
      code: `HTX${dayjs(createdAt).format('YYMMDD')}${String(i + 1).padStart(3, '0')}`,
      shopId,
      customer: {
        name: customerNames[Math.floor(Math.random() * customerNames.length)],
        phone: '09' + Math.floor(10000000 + Math.random() * 89999999),
        address: 'Số ' + (1 + Math.floor(Math.random() * 300)) + ' đường Nguyễn Trãi, Quận 5, TP.HCM'
      },
      items,
      subtotal,
      shippingFee,
      discount,
      total: subtotal + shippingFee - discount,
      status,
      paymentMethod: Math.random() > 0.5 ? 'cod' : 'bank_transfer',
      channel: ['web', 'zalo', 'dropship'][Math.floor(Math.random() * 3)],
      timeline: [{ status: 'pending_confirm', at: createdAt.toISOString(), note: 'Đơn hàng được tạo' }],
      createdAt: createdAt.toISOString()
    });
  }
  await Order.bulkCreate(orders);

  const promotions = [
    {
      id: id(), shopId, method: 'code', code: 'SIMOI10', name: 'Giảm 10% cho khách sỉ mới', orderSource: 'all', type: 'percent', value: 10,
      minReqType: 'value', minOrderValue: 500000, minOrderQty: 0, usageLimit: 100, used: 32,
      startDate: dayjs().subtract(10, 'day').toISOString(), endDate: dayjs().add(20, 'day').toISOString()
    },
    {
      id: id(), shopId, method: 'auto', code: '', name: 'Miễn phí vận chuyển đơn từ 1 triệu', orderSource: 'all', type: 'fixed', value: 25000,
      minReqType: 'value', minOrderValue: 1000000, minOrderQty: 0, usageLimit: 200, used: 145,
      startDate: dayjs().subtract(30, 'day').toISOString(), endDate: dayjs().add(5, 'day').toISOString()
    },
    {
      id: id(), shopId, method: 'code', code: 'FLASH50', name: 'Flash sale cuối tuần', orderSource: 'all', type: 'percent', value: 15,
      minReqType: 'none', minOrderValue: 0, minOrderQty: 0, usageLimit: 50, used: 50,
      startDate: dayjs().subtract(40, 'day').toISOString(), endDate: dayjs().subtract(38, 'day').toISOString()
    }
  ];
  await Promotion.bulkCreate(promotions);

  const reviews = [];
  for (let i = 0; i < 10; i++) {
    const prod = products[Math.floor(Math.random() * products.length)];
    reviews.push({
      id: id(),
      shopId,
      productId: prod.id,
      productName: prod.name,
      customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
      rating: 3 + Math.floor(Math.random() * 3),
      comment: 'Hàng đóng gói cẩn thận, giao nhanh, chất lượng đúng như mô tả. Sẽ ủng hộ shop dài dài.',
      reply: i % 3 === 0 ? 'Cảm ơn quý khách đã tin tưởng shop!' : '',
      createdAt: dayjs().subtract(Math.floor(Math.random() * 60), 'day').toISOString()
    });
  }
  await Review.bulkCreate(reviews);

  const notifications = [
    { id: id(), shopId, type: 'order', message: 'Bạn có đơn hàng mới cần xác nhận', read: false, createdAt: dayjs().subtract(1, 'hour').toISOString() },
    { id: id(), shopId, type: 'promotion', message: 'Chương trình FREESHIP sắp hết hạn trong 5 ngày', read: false, createdAt: dayjs().subtract(1, 'day').toISOString() },
    { id: id(), shopId, type: 'system', message: 'Hồ sơ định danh gian hàng đã được duyệt', read: true, createdAt: dayjs().subtract(5, 'day').toISOString() }
  ];
  await Notification.bulkCreate(notifications);

  // RFQs (buyer requests, not tied to this shop) + a couple of quotations already sent
  const rfqSeeds = [
    { title: 'Cần mua sỉ áo thun cotton form rộng', cat: 0, qty: 200, unit: 'cái', target: 50000, buyer: 'Cửa hàng Thời Trang An Khang', loc: 'Cần Thơ', desc: 'Cần nguồn áo thun cotton ổn định, giao hàng định kỳ hàng tháng, ưu tiên xưởng may trực tiếp.' },
    { title: 'Tìm nguồn mỹ phẩm chăm sóc da giá sỉ', cat: 3, qty: 500, unit: 'hộp', target: 35000, buyer: 'Spa Ngọc Hà', loc: 'Đà Nẵng', desc: 'Cần kem chống nắng và serum, có giấy tờ công bố đầy đủ, hỗ trợ đổi trả hàng lỗi.' },
    { title: 'Nhập sỉ đồ gia dụng nhà bếp', cat: 2, qty: 100, unit: 'bộ', target: 280000, buyer: 'Siêu thị Mini Phát Đạt', loc: 'Hà Nội', desc: 'Ưu tiên bộ nồi inox, chảo chống dính, có bảo hành tối thiểu 12 tháng.' },
    { title: 'Cần mua sỉ trà túi lọc các loại', cat: 4, qty: 1000, unit: 'hộp', target: 30000, buyer: 'Đại lý Thực Phẩm Sạch', loc: 'TP. Hồ Chí Minh', desc: 'Số lượng lớn, cần báo giá theo từng mốc số lượng, có hỗ trợ vận chuyển tỉnh.' },
    { title: 'Tìm xưởng may sỉ quần jean nam', cat: 0, qty: 300, unit: 'cái', target: 130000, buyer: 'Shop Thời Trang Nam Việt', loc: 'Bình Dương', desc: 'Cần xưởng may số lượng lớn, có thể may theo mẫu riêng.' }
  ];
  const rfqs = rfqSeeds.map((r) => ({
    id: id(),
    categoryId: categories[r.cat].id,
    title: r.title,
    description: r.desc,
    quantity: r.qty,
    unit: r.unit,
    targetPrice: r.target,
    buyerName: r.buyer,
    buyerLocation: r.loc,
    status: 'open',
    createdAt: dayjs().subtract(Math.floor(Math.random() * 10), 'day').toISOString(),
    expiresAt: dayjs().add(Math.floor(Math.random() * 20) + 5, 'day').toISOString()
  }));
  await Rfq.bulkCreate(rfqs);

  await Quotation.create({
    id: id(), rfqId: rfqs[1].id, shopId, price: 34000, note: 'Sẵn hàng, giao trong 3 ngày', createdAt: dayjs().subtract(2, 'day').toISOString()
  });

  // Messenger conversations
  const conversations = [
    {
      id: id(), shopId, customerName: 'HTXAFF.com', unreadForShop: false,
      messages: [
        { from: 'customer', text: 'Chào mừng bạn tham gia bán hàng trên HTXAFF! Hãy đăng sản phẩm đầu tiên ngay để bắt đầu tiếp cận khách hàng sỉ nhé!', at: dayjs().subtract(8, 'month').toISOString() }
      ]
    },
    {
      id: id(), shopId, customerName: 'Trần Thị Hoa', unreadForShop: true,
      messages: [
        { from: 'customer', text: 'Shop ơi cho mình hỏi áo thun form rộng còn màu đen size L không ạ?', at: dayjs().subtract(3, 'hour').toISOString() },
        { from: 'customer', text: 'Mình cần lấy sỉ 50 cái', at: dayjs().subtract(3, 'hour').add(2, 'minute').toISOString() }
      ]
    },
    {
      id: id(), shopId, customerName: 'Vũ Đình Khoa', unreadForShop: false,
      messages: [
        { from: 'customer', text: 'Đơn hàng của mình khi nào giao vậy shop?', at: dayjs().subtract(1, 'day').toISOString() },
        { from: 'shop', text: 'Dạ đơn của anh đang được đóng gói, dự kiến giao trong 2 ngày tới ạ!', at: dayjs().subtract(1, 'day').add(10, 'minute').toISOString() }
      ]
    }
  ];
  await Conversation.bulkCreate(conversations);

  await FeedPost.create({
    id: id(), shopId,
    content: 'Xưởng nhà mình vừa lên mẫu áo thun form rộng mới, giá sỉ chỉ từ 47.000đ/cái khi lấy từ 50 cái. Ib shop để nhận bảng giá chi tiết nhé!',
    images: [], productId: products[0].id, createdAt: dayjs().subtract(2, 'day').toISOString()
  });

  // Customers (aggregated from orders)
  const customerAgg = {};
  orders.forEach((o) => {
    const key = o.customer.phone;
    if (!customerAgg[key]) {
      customerAgg[key] = { name: o.customer.name, phone: o.customer.phone, location: 'TP. Hồ Chí Minh', ordersCount: 0, totalPaid: 0 };
    }
    customerAgg[key].ordersCount += 1;
    if (o.status === 'delivered') customerAgg[key].totalPaid += o.total;
  });
  const customers = Object.values(customerAgg).map((c) => ({ id: id(), shopId, ...c, createdAt: dayjs().subtract(60, 'day').toISOString() }));
  await Customer.bulkCreate(customers);

  await Recruitment.create({
    id: id(), shopId, title: 'Tuyển đại lý phân phối thời trang khu vực miền Tây',
    type: 'Tuyển đại lý', description: 'Chiết khấu hấp dẫn, hỗ trợ trưng bày, đổi trả hàng lỗi 100%.',
    createdAt: dayjs().subtract(5, 'day').toISOString(), expiresAt: dayjs().add(25, 'day').toISOString(),
    moderation: 'approved', status: 'active'
  });

  // Finance transactions derived from delivered orders
  const transactions = [];
  orders.filter((o) => o.status === 'delivered').forEach((o) => {
    const fee = Math.round(o.total * 0.02);
    const net = o.total - fee;
    const isRecent = dayjs(o.createdAt).isAfter(dayjs().subtract(3, 'day'));
    transactions.push({
      id: id(),
      shopId,
      type: 'order',
      status: isRecent ? 'pending_reconcile' : 'reconciled',
      content: `Đối soát đơn hàng ${o.code} (đã trừ 2% phí sàn)`,
      amount: net,
      at: o.createdAt
    });
  });
  transactions.push({
    id: id(), shopId, type: 'withdraw', status: 'completed',
    content: `Lệnh rút tiền về ${shop.bank.bankName} - ${shop.bank.accountNumber}`,
    amount: -500000, at: dayjs().subtract(10, 'day').toISOString()
  });
  await Transaction.bulkCreate(transactions);

  console.log('Seed thành công!');
  console.log('Đăng nhập demo (mật khẩu giống nhau cho cả 3 tài khoản):');
  console.log('  Chủ gian hàng:       dinhnam0103@gmail.com');
  console.log('  Nhân viên bán hàng:  sales@htxaff.demo');
  console.log('  Kế toán:             ketoan@htxaff.demo');
  console.log(`  Mật khẩu: ${DEMO_PASSWORD}`);
  if (!process.env.SEED_PASSWORD) {
    console.log('  (Mật khẩu ngẫu nhiên vì chưa đặt biến môi trường SEED_PASSWORD — LƯU LẠI ngay, sẽ không hiện lại lần sau.)');
  }
}

seed()
  .then(() => sequelize.close())
  .catch((err) => {
    console.error('Seed thất bại:', err);
    process.exit(1);
  });
