const express = require('express');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');
const { Promotion } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('promotions'));

function computeStatus(promo) {
  const now = dayjs();
  if (now.isBefore(dayjs(promo.startDate))) return 'scheduled';
  if (now.isAfter(dayjs(promo.endDate))) return 'expired';
  if (promo.usageLimit > 0 && promo.used >= promo.usageLimit) return 'expired';
  return 'active';
}

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  let promotions = await Promotion.findAll({ where: { shopId } });
  promotions = promotions.map((p) => ({ ...p.toJSON(), status: computeStatus(p) }));
  promotions = [...promotions].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  res.render('promotions/index', { title: 'Khuyến mãi', active: 'promotions', promotions, dayjs });
});

router.get('/new', (req, res) => {
  res.render('promotions/form', { title: 'Tạo khuyến mãi', active: 'promotions' });
});

router.post('/new', async (req, res) => {
  const { method, code, name, orderSource, type, value, minReqType, minOrderValue, minOrderQty, hasUsageLimit, usageLimit, startDate, endDate } = req.body;
  await Promotion.create({
    id: nanoid(10),
    shopId: req.shop.id,
    method: method || 'code',
    code: method === 'auto' ? '' : (code || '').toUpperCase(),
    name,
    orderSource: orderSource || 'all',
    type,
    value: parseInt(value, 10) || 0,
    minReqType: minReqType || 'none',
    minOrderValue: minReqType === 'value' ? (parseInt(minOrderValue, 10) || 0) : 0,
    minOrderQty: minReqType === 'qty' ? (parseInt(minOrderQty, 10) || 0) : 0,
    usageLimit: hasUsageLimit === 'on' ? (parseInt(usageLimit, 10) || 0) : 0,
    used: 0,
    startDate: dayjs(startDate).toISOString(),
    endDate: dayjs(endDate).toISOString()
  });
  res.redirect('/promotions');
});

router.post('/:id/delete', async (req, res) => {
  await Promotion.destroy({ where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/promotions');
});

module.exports = router;
