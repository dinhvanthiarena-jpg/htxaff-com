const express = require('express');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');
const { Recruitment, Category } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('recruitment'));

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const recruitments = await Recruitment.findAll({ where: { shopId } });
  const posts = [...recruitments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.render('recruitment/index', { title: 'Tuyển NPP, Đại lý, CTV', active: 'recruitment', posts, dayjs });
});

router.get('/new', async (req, res) => {
  const categories = await Category.findAll();
  res.render('recruitment/form', { title: 'Đăng tin', active: 'recruitment', categories });
});

router.post('/new', async (req, res) => {
  const { title, type, region, expiresAt, categoryId, description, contactPhone, cta } = req.body;
  await Recruitment.create({
    id: nanoid(10),
    shopId: req.shop.id,
    title,
    type,
    region: region || 'Toàn quốc',
    categoryId: categoryId || '',
    description: description || '',
    contactPhone: contactPhone || '',
    cta: cta || 'Đăng ký ngay',
    createdAt: dayjs().toISOString(),
    expiresAt: expiresAt ? dayjs(expiresAt).toISOString() : dayjs().add(30, 'day').toISOString(),
    moderation: 'pending',
    status: 'active'
  });
  res.redirect('/recruitment');
});

router.post('/:id/delete', async (req, res) => {
  await Recruitment.destroy({ where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/recruitment');
});

module.exports = router;
