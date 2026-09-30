const express = require('express');
const dayjs = require('dayjs');
const { Order, Product, Review, Conversation, FeedPost, Promotion } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const shopId = req.shop.id;
  const shop = req.shop;
  const orders = await Order.findAll({ where: { shopId } });
  const products = await Product.findAll({ where: { shopId } });
  const reviews = await Review.findAll({ where: { shopId } });
  const conversations = await Conversation.findAll({ where: { shopId } });
  const feedPosts = await FeedPost.findAll({ where: { shopId } });

  const today = dayjs();
  const last7 = [...Array(7)].map((_, i) => today.subtract(6 - i, 'day'));

  const revenueByDay = last7.map((d) => {
    const dayOrders = orders.filter(
      (o) => o.status === 'delivered' && dayjs(o.createdAt).isSame(d, 'day')
    );
    return {
      label: d.format('DD/MM'),
      value: dayOrders.reduce((sum, o) => sum + o.total, 0)
    };
  });

  const totalRevenue30 = orders
    .filter((o) => o.status === 'delivered' && dayjs(o.createdAt).isAfter(today.subtract(30, 'day')))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending_confirm').length;
  const processingOrders = orders.filter((o) => ['pending_payment', 'pending_pickup', 'shipping'].includes(o.status)).length;
  const lowStockProducts = products.filter((p) => p.stock <= 20 && p.status === 'active');
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const topProducts = [...products]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const unreadMessages = conversations.filter((c) => c.unreadForShop).length;
  const promotions = await Promotion.findAll({ where: { shopId } });
  const activePromotions = promotions
    .filter((p) => dayjs().isAfter(dayjs(p.startDate)) && dayjs().isBefore(dayjs(p.endDate))).length;
  const postedToday = feedPosts.filter((f) => dayjs(f.createdAt).isSame(today, 'day')).length;

  const todoList = [
    { done: unreadMessages === 0, label: 'Tin nhắn chưa đọc', count: unreadMessages, link: '/messengers' },
    { done: shop.shippingMethods && shop.shippingMethods.length > 0, label: 'Cài đặt vận chuyển', count: 1, link: '/settings/shipping' },
    { done: activePromotions > 0, label: 'Cài đặt Deal Sỉ', count: 1, link: '/promotions' },
    { done: !!shop.taxInfo, label: 'Bổ sung thông tin thuế', count: 1, link: '/settings/general' },
    { done: !!shop.introduction, label: 'Bổ sung giới thiệu', count: 1, link: '/settings/shop' }
  ].filter((t) => !t.done);

  const shopTier = {
    level: shop.tier || 'Mới',
    viewCount: shop.viewCount || 0,
    viewQuota: 500,
    productCount: products.length,
    productQuota: 30,
    visibleProductCount: products.filter((p) => p.status === 'active').length,
    feedQuota: 1,
    feedPostedToday: postedToday
  };

  res.render('dashboard/index', {
    title: 'Trang chủ',
    active: 'dashboard',
    stats: {
      totalRevenue30,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      avgRating
    },
    revenueByDay,
    recentOrders,
    topProducts,
    lowStockProducts,
    todoList,
    shopTier,
    denied: req.query.denied
  });
});

module.exports = router;
