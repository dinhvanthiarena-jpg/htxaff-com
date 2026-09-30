const path = require('path');
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const promotionRoutes = require('./routes/promotions');
const reviewRoutes = require('./routes/reviews');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const rfqRoutes = require('./routes/rfqs');
const financeRoutes = require('./routes/finance');
const messengerRoutes = require('./routes/messengers');
const feedRoutes = require('./routes/feed');
const customerRoutes = require('./routes/customers');
const recruitmentRoutes = require('./routes/recruitment');
const campaignRoutes = require('./routes/campaigns');
const dropshipRoutes = require('./routes/dropship');
const storefrontRoutes = require('./routes/storefront');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store: persists in the same SQL database as the app data (SQLite locally,
// PostgreSQL in production via DATABASE_URL) so sessions survive restarts and are
// shared across multiple app instances — required once you run more than one server
// process behind a load balancer.
// At real production scale (many app instances, high request rate), swap this for
// Redis instead (connect-redis + a managed Redis instance): sessions are read on
// almost every request, and Redis handles that far better than a SQL table under load.
const sessionStore = new SequelizeStore({ db: sequelize, tableName: 'Sessions' });
sessionStore.sync();

app.use(session({
  secret: process.env.SESSION_SECRET || 'seller-center-clone-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatMoney = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';
  next();
});

// Guests hitting the homepage see the public storefront landing instead of being
// forced to /login — the seller dashboard (dashboardRoutes below) still owns '/'
// for logged-in sessions.
app.use('/', (req, res, next) => {
  if (req.path === '/' && req.method === 'GET' && !req.session.shopId) {
    return storefrontRoutes.publicHome(req, res, next);
  }
  next();
});

app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', storefrontRoutes.router);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/promotions', promotionRoutes);
app.use('/reviews', reviewRoutes);
app.use('/reports', reportRoutes);
app.use('/settings', settingsRoutes);
app.use('/notifications', notificationRoutes);
app.use('/rfqs', rfqRoutes);
app.use('/finance', financeRoutes);
app.use('/messengers', messengerRoutes);
app.use('/feed', feedRoutes);
app.use('/customers', customerRoutes);
app.use('/recruitment', recruitmentRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/dropship', dropshipRoutes);

app.use((req, res) => {
  res.status(404).send('Không tìm thấy trang');
});

module.exports = app;
