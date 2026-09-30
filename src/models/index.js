const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Local dev: SQLite file, zero external services needed.
// Production: set DATABASE_URL (e.g. postgres://user:pass@host:5432/db) and this
// switches to PostgreSQL automatically — no other code changes required, since every
// query in this app goes through Sequelize's dialect-agnostic API.
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { logging: false })
  : new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', 'data', 'app.db'),
    logging: false
  });

const idColumn = { id: { type: DataTypes.STRING, primaryKey: true } };
const noTimestamps = { timestamps: false };

const Shop = sequelize.define('Shop', {
  ...idColumn,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  passwordHash: DataTypes.STRING,
  shopName: DataTypes.STRING,
  shopLogo: DataTypes.STRING,
  businessType: DataTypes.STRING,
  address: DataTypes.STRING,
  addressProvince: DataTypes.STRING,
  addressDistrict: DataTypes.STRING,
  addressWard: DataTypes.STRING,
  addressStreet: DataTypes.STRING,
  bank: DataTypes.JSON,
  shippingMethods: DataTypes.JSON,
  ratingAvg: DataTypes.FLOAT,
  tier: DataTypes.STRING,
  viewCount: DataTypes.INTEGER,
  taxInfo: DataTypes.STRING,
  introduction: DataTypes.TEXT,
  salesPolicy: DataTypes.TEXT,
  vacationMode: DataTypes.BOOLEAN,
  hidePrices: DataTypes.BOOLEAN,
  negotiablePrice: DataTypes.BOOLEAN,
  minOrderQty: DataTypes.INTEGER,
  minOrderValue: DataTypes.INTEGER,
  codEnabled: DataTypes.BOOLEAN,
  codMaxShippingFee: DataTypes.INTEGER,
  codMaxOrderValue: DataTypes.INTEGER,
  autoReplyEnabled: DataTypes.BOOLEAN,
  autoReplyMessage: DataTypes.TEXT,
  company: DataTypes.JSON,
  deleteRequested: DataTypes.BOOLEAN,
  shopEmail: DataTypes.STRING,
  businessScope: DataTypes.STRING,
  shopBanner: DataTypes.STRING,
  introPost: DataTypes.TEXT,
  dropshipIntroPost: DataTypes.TEXT,
  coverImage: DataTypes.STRING,
  banners: DataTypes.JSON,
  shopTheme: DataTypes.STRING,
  extraRfqQuota: DataTypes.INTEGER,
  rfqNotifyEmail: DataTypes.BOOLEAN,
  rfqNotifyCategories: DataTypes.JSON,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Category = sequelize.define('Category', {
  ...idColumn,
  name: DataTypes.STRING
}, noTimestamps);

const Product = sequelize.define('Product', {
  ...idColumn,
  shopId: DataTypes.STRING,
  sku: DataTypes.STRING,
  name: DataTypes.STRING,
  categoryId: DataTypes.STRING,
  unit: DataTypes.STRING,
  images: DataTypes.JSON,
  video: DataTypes.STRING,
  sizeChartImage: DataTypes.STRING,
  specs: DataTypes.JSON,
  priceTiers: DataTypes.JSON,
  retailPrice: DataTypes.INTEGER,
  retailSuggestPrice: DataTypes.INTEGER,
  weight: DataTypes.INTEGER,
  dimensions: DataTypes.JSON,
  variants: DataTypes.JSON,
  branchStock: DataTypes.JSON,
  stock: DataTypes.INTEGER,
  sold: DataTypes.INTEGER,
  status: DataTypes.STRING,
  description: DataTypes.TEXT,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Order = sequelize.define('Order', {
  ...idColumn,
  shopId: DataTypes.STRING,
  code: DataTypes.STRING,
  customer: DataTypes.JSON,
  items: DataTypes.JSON,
  subtotal: DataTypes.INTEGER,
  shippingFee: DataTypes.INTEGER,
  discount: DataTypes.INTEGER,
  total: DataTypes.INTEGER,
  status: DataTypes.STRING,
  paymentMethod: DataTypes.STRING,
  channel: DataTypes.STRING,
  timeline: DataTypes.JSON,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Promotion = sequelize.define('Promotion', {
  ...idColumn,
  shopId: DataTypes.STRING,
  method: DataTypes.STRING,
  code: DataTypes.STRING,
  name: DataTypes.STRING,
  orderSource: DataTypes.STRING,
  type: DataTypes.STRING,
  value: DataTypes.INTEGER,
  minReqType: DataTypes.STRING,
  minOrderValue: DataTypes.INTEGER,
  minOrderQty: DataTypes.INTEGER,
  usageLimit: DataTypes.INTEGER,
  used: DataTypes.INTEGER,
  startDate: DataTypes.DATE,
  endDate: DataTypes.DATE
}, noTimestamps);

const Review = sequelize.define('Review', {
  ...idColumn,
  shopId: DataTypes.STRING,
  productId: DataTypes.STRING,
  productName: DataTypes.STRING,
  customerName: DataTypes.STRING,
  rating: DataTypes.INTEGER,
  comment: DataTypes.TEXT,
  reply: DataTypes.TEXT,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Notification = sequelize.define('Notification', {
  ...idColumn,
  shopId: DataTypes.STRING,
  type: DataTypes.STRING,
  message: DataTypes.STRING,
  read: DataTypes.BOOLEAN,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Rfq = sequelize.define('Rfq', {
  ...idColumn,
  categoryId: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  quantity: DataTypes.INTEGER,
  unit: DataTypes.STRING,
  targetPrice: DataTypes.INTEGER,
  buyerName: DataTypes.STRING,
  buyerLocation: DataTypes.STRING,
  status: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  expiresAt: DataTypes.DATE
}, noTimestamps);

const Quotation = sequelize.define('Quotation', {
  ...idColumn,
  rfqId: DataTypes.STRING,
  shopId: DataTypes.STRING,
  price: DataTypes.INTEGER,
  note: DataTypes.STRING,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Conversation = sequelize.define('Conversation', {
  ...idColumn,
  shopId: DataTypes.STRING,
  customerName: DataTypes.STRING,
  unreadForShop: DataTypes.BOOLEAN,
  messages: DataTypes.JSON
}, noTimestamps);

const FeedPost = sequelize.define('FeedPost', {
  ...idColumn,
  shopId: DataTypes.STRING,
  content: DataTypes.TEXT,
  images: DataTypes.JSON,
  productId: DataTypes.STRING,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Customer = sequelize.define('Customer', {
  ...idColumn,
  shopId: DataTypes.STRING,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  marketingOptIn: DataTypes.BOOLEAN,
  location: DataTypes.STRING,
  note: DataTypes.TEXT,
  tags: DataTypes.JSON,
  ordersCount: DataTypes.INTEGER,
  totalPaid: DataTypes.INTEGER,
  createdAt: DataTypes.DATE
}, noTimestamps);

const Recruitment = sequelize.define('Recruitment', {
  ...idColumn,
  shopId: DataTypes.STRING,
  title: DataTypes.STRING,
  type: DataTypes.STRING,
  region: DataTypes.STRING,
  categoryId: DataTypes.STRING,
  description: DataTypes.TEXT,
  contactPhone: DataTypes.STRING,
  cta: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  expiresAt: DataTypes.DATE,
  moderation: DataTypes.STRING,
  status: DataTypes.STRING
}, noTimestamps);

const Branch = sequelize.define('Branch', {
  ...idColumn,
  shopId: DataTypes.STRING,
  name: DataTypes.STRING,
  address: DataTypes.STRING,
  isDefault: DataTypes.BOOLEAN
}, noTimestamps);

const Transaction = sequelize.define('Transaction', {
  ...idColumn,
  shopId: DataTypes.STRING,
  type: DataTypes.STRING,
  status: DataTypes.STRING,
  content: DataTypes.STRING,
  amount: DataTypes.INTEGER,
  at: DataTypes.DATE
}, noTimestamps);

const Member = sequelize.define('Member', {
  ...idColumn,
  shopId: DataTypes.STRING,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  passwordHash: DataTypes.STRING,
  role: DataTypes.STRING,
  roleLabel: DataTypes.STRING,
  permissions: DataTypes.JSON,
  status: DataTypes.STRING,
  createdAt: DataTypes.DATE
}, noTimestamps);

async function syncModels() {
  await sequelize.sync();
}

module.exports = {
  sequelize,
  syncModels,
  Shop, Category, Product, Order, Promotion, Review, Notification,
  Rfq, Quotation, Conversation, FeedPost, Customer, Recruitment,
  Branch, Transaction, Member
};
