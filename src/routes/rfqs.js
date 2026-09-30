const express = require('express');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');
const { Rfq, Quotation, Category } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('rfqs'));
const MONTHLY_QUOTE_QUOTA = 10;

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { q = '', categoryId = 'all' } = req.query;

  let rfqs = await Rfq.findAll({ where: { status: 'open' } });
  if (q) {
    const qLower = q.toLowerCase();
    rfqs = rfqs.filter((r) => r.title.toLowerCase().includes(qLower));
  }
  if (categoryId !== 'all') {
    rfqs = rfqs.filter((r) => r.categoryId === categoryId);
  }
  rfqs = [...rfqs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const shopQuotations = await Quotation.findAll({ where: { shopId } });
  const quotedRfqIds = shopQuotations.map((q) => q.rfqId);
  const usedThisMonth = shopQuotations.filter((qt) => dayjs(qt.createdAt).isSame(dayjs(), 'month')).length;

  const categories = await Category.findAll();
  const totalQuota = MONTHLY_QUOTE_QUOTA + (req.shop.extraRfqQuota || 0);

  res.render('rfqs/index', {
    title: 'Yêu cầu báo giá',
    active: 'rfqs',
    rfqs,
    categories,
    filters: { q, categoryId },
    quotedRfqIds,
    remainingQuota: Math.max(0, totalQuota - usedThisMonth),
    monthlyQuota: totalQuota,
    dayjs
  });
});

const QUOTA_PACKAGES = [
  { id: 'p10', qty: 10, price: 50000 },
  { id: 'p30', qty: 30, price: 120000 },
  { id: 'p100', qty: 100, price: 350000 }
];

router.get('/buy-quota', (req, res) => {
  res.render('rfqs/buy-quota', { title: 'Mua lượt báo giá', active: 'rfqs', packages: QUOTA_PACKAGES, purchased: req.query.purchased, shop: req.shop, formatMoney: res.locals.formatMoney });
});

router.post('/buy-quota', async (req, res) => {
  const pkg = QUOTA_PACKAGES.find((p) => p.id === req.body.packageId);
  if (pkg) {
    await req.shop.update({ extraRfqQuota: (req.shop.extraRfqQuota || 0) + pkg.qty });
  }
  res.redirect('/rfqs/buy-quota?purchased=1');
});

router.get('/quotations', async (req, res) => {
  const shopId = req.shop.id;
  const quotations = await Quotation.findAll({ where: { shopId } });
  const rfqs = await Rfq.findAll();
  const rfqMap = Object.fromEntries(rfqs.map((r) => [r.id, r]));
  const enriched = [...quotations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((q) => ({ ...q.toJSON(), rfq: rfqMap[q.rfqId] }));

  res.render('rfqs/quotations', { title: 'Báo giá đã gửi', active: 'rfqs', quotations: enriched, dayjs });
});

router.get('/notifications', (req, res) => {
  res.render('rfqs/notifications', { title: 'Cài đặt nhận thông báo', active: 'rfqs', saved: req.query.saved, shop: req.shop });
});

router.post('/notifications', async (req, res) => {
  const { rfqNotifyEmail, rfqNotifyCategories } = req.body;
  await req.shop.update({
    rfqNotifyEmail: rfqNotifyEmail === 'on',
    rfqNotifyCategories: [].concat(rfqNotifyCategories || [])
  });
  res.redirect('/rfqs/notifications?saved=1');
});

router.post('/:id/quote', async (req, res) => {
  const { price, note } = req.body;
  const rfq = await Rfq.findByPk(req.params.id);
  if (!rfq) return res.redirect('/rfqs');

  const already = await Quotation.findOne({ where: { rfqId: rfq.id, shopId: req.shop.id } });
  if (!already) {
    await Quotation.create({
      id: nanoid(10),
      rfqId: rfq.id,
      shopId: req.shop.id,
      price: parseInt(price, 10) || 0,
      note: note || '',
      createdAt: dayjs().toISOString()
    });
  }
  res.redirect('/rfqs');
});

module.exports = router;
