const express = require('express');
const dayjs = require('dayjs');
const { Order } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('orders'));

const STATUS_FLOW = ['pending_confirm', 'pending_payment', 'pending_pickup', 'shipping', 'delivered'];
const STATUS_LABELS = {
  pending_confirm: 'Chờ xác nhận',
  pending_payment: 'Chờ thanh toán',
  pending_pickup: 'Chờ lấy hàng',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  return_refund: 'Trả hàng/Hoàn tiền'
};

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { status = 'all', q = '', page = 1, channel = 'all', sort = 'newest' } = req.query;
  const allShopOrders = await Order.findAll({ where: { shopId } });
  let orders = allShopOrders;

  if (status === 'open') {
    orders = orders.filter((o) => !['delivered', 'cancelled', 'return_refund'].includes(o.status));
  } else if (status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }
  if (channel !== 'all') {
    orders = orders.filter((o) => (o.channel || 'web') === channel);
  }
  if (q) {
    const qLower = q.toLowerCase();
    orders = orders.filter(
      (o) => o.code.toLowerCase().includes(qLower) || o.customer.name.toLowerCase().includes(qLower) || o.customer.phone.includes(q)
    );
  }

  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    value_desc: (a, b) => b.total - a.total,
    value_asc: (a, b) => a.total - b.total
  };
  orders = [...orders].sort(sorters[sort] || sorters.newest);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(orders.length / perPage));
  const currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
  const paged = orders.slice((currentPage - 1) * perPage, currentPage * perPage);

  const tabCounts = {
    all: allShopOrders.length,
    open: allShopOrders.filter((o) => !['delivered', 'cancelled', 'return_refund'].includes(o.status)).length,
    pending_confirm: allShopOrders.filter((o) => o.status === 'pending_confirm').length,
    pending_payment: allShopOrders.filter((o) => o.status === 'pending_payment').length,
    pending_pickup: allShopOrders.filter((o) => o.status === 'pending_pickup').length,
    shipping: allShopOrders.filter((o) => o.status === 'shipping').length,
    delivered: allShopOrders.filter((o) => o.status === 'delivered').length,
    cancelled: allShopOrders.filter((o) => o.status === 'cancelled').length,
    return_refund: allShopOrders.filter((o) => o.status === 'return_refund').length
  };

  res.render('orders/index', {
    title: 'Đơn hàng & Hỏi mua',
    active: 'orders',
    orders: paged,
    filters: { status, q, channel, sort },
    pagination: { currentPage, totalPages, total: orders.length },
    tabCounts,
    STATUS_LABELS,
    dayjs
  });
});

router.post('/bulk-ship', async (req, res) => {
  const ids = [].concat(req.body.orderIds || []);
  for (const id of ids) {
    const order = await Order.findOne({ where: { id, shopId: req.shop.id } });
    if (order && order.status === 'pending_pickup') {
      const timeline = [...(order.timeline || []), { status: 'shipping', at: dayjs().toISOString(), note: 'Giao hàng loạt' }];
      await order.update({ status: 'shipping', timeline });
    }
  }
  res.redirect('back');
});

router.get('/:id', async (req, res) => {
  const order = await Order.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (!order) return res.redirect('/orders');
  res.render('orders/detail', {
    title: `Đơn hàng ${order.code}`,
    active: 'orders',
    order,
    STATUS_FLOW,
    STATUS_LABELS,
    dayjs
  });
});

router.post('/:id/status', async (req, res) => {
  const { nextStatus, note } = req.body;
  const order = await Order.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (order) {
    const timeline = [...(order.timeline || []), { status: nextStatus, at: dayjs().toISOString(), note: note || '' }];
    await order.update({ status: nextStatus, timeline });
  }
  res.redirect(`/orders/${req.params.id}`);
});

module.exports = router;
