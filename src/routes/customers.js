const express = require('express');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');
const { Customer } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');
const provinces = require('../data/provinces');

const router = express.Router();
router.use(requireAuth, requirePermission('customers'));

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { q = '' } = req.query;
  let customers = await Customer.findAll({ where: { shopId } });
  if (q) {
    const qLower = q.toLowerCase();
    customers = customers.filter((c) => c.name.toLowerCase().includes(qLower) || (c.phone || '').includes(q));
  }
  customers = [...customers].sort((a, b) => b.totalPaid - a.totalPaid);

  res.render('customers/index', { title: 'Khách hàng', active: 'customers', customers, filters: { q } });
});

router.get('/new', (req, res) => {
  res.render('customers/form', { title: 'Thêm khách hàng', active: 'customers', provinces });
});

router.post('/new', async (req, res) => {
  const { firstName, lastName, email, phone, marketingOptIn, addressProvince, addressDistrict, addressStreet, note, tags } = req.body;
  const name = [firstName, lastName].filter(Boolean).join(' ');
  const address = [addressStreet, addressDistrict, addressProvince].filter(Boolean).join(', ');
  if (name) {
    await Customer.create({
      id: nanoid(10),
      shopId: req.shop.id,
      name,
      email: email || '',
      phone: phone || '',
      marketingOptIn: marketingOptIn === 'on',
      location: address || '',
      note: note || '',
      tags: (tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      ordersCount: 0,
      totalPaid: 0,
      createdAt: dayjs().toISOString()
    });
  }
  res.redirect('/customers');
});

module.exports = router;
