const express = require('express');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');
const { Op } = require('sequelize');
const { Shop, Product, Category, Review, Conversation } = require('../models');

const router = express.Router();

async function publicHome(req, res) {
  const shops = await Shop.findAll();
  const products = await Product.findAll({
    where: { status: 'active' },
    order: [['sold', 'DESC']],
    limit: 12
  });
  const productShopMap = {};
  shops.forEach((s) => { productShopMap[s.id] = s; });

  res.render('storefront/home', {
    title: 'HTXAFF.com - Kênh bán sỉ B2B',
    layout: false,
    shops,
    products,
    productShopMap
  });
}

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  const products = q
    ? await Product.findAll({ where: { status: 'active', name: { [Op.like]: `%${q}%` } } })
    : [];
  const shops = await Shop.findAll();
  const productShopMap = {};
  shops.forEach((s) => { productShopMap[s.id] = s; });

  res.render('storefront/search', {
    title: `Tìm kiếm "${q}" - HTXAFF.com`,
    layout: false,
    q,
    products,
    productShopMap
  });
});

router.get('/store/:shopId', async (req, res) => {
  const shop = await Shop.findByPk(req.params.shopId);
  if (!shop) return res.status(404).send('Không tìm thấy gian hàng');

  const categoryId = req.query.category || '';
  const q = (req.query.q || '').trim();
  const where = { shopId: shop.id, status: 'active' };
  if (categoryId) where.categoryId = categoryId;
  if (q) where.name = { [Op.like]: `%${q}%` };

  const products = await Product.findAll({ where, order: [['createdAt', 'DESC']] });
  const allActiveProducts = await Product.findAll({ where: { shopId: shop.id, status: 'active' } });
  const categoryIds = [...new Set(allActiveProducts.map((p) => p.categoryId).filter(Boolean))];
  const categories = categoryIds.length
    ? await Category.findAll({ where: { id: { [Op.in]: categoryIds } } })
    : [];
  const reviews = await Review.findAll({ where: { shopId: shop.id } });
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  res.render('storefront/shop', {
    title: `${shop.shopName} - HTXAFF.com`,
    layout: false,
    shop,
    products,
    categories,
    categoryId,
    q,
    productCount: allActiveProducts.length,
    avgRating
  });
});

router.get('/store/:shopId/product/:productId', async (req, res) => {
  const shop = await Shop.findByPk(req.params.shopId);
  const product = await Product.findOne({ where: { id: req.params.productId, shopId: req.params.shopId } });
  if (!shop || !product) return res.status(404).send('Không tìm thấy sản phẩm');

  const category = product.categoryId ? await Category.findByPk(product.categoryId) : null;
  const reviews = await Review.findAll({ where: { productId: product.id }, order: [['createdAt', 'DESC']] });
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const related = await Product.findAll({
    where: { shopId: shop.id, status: 'active', id: { [Op.ne]: product.id } },
    limit: 4
  });

  res.render('storefront/product', {
    title: `${product.name} - HTXAFF.com`,
    layout: false,
    shop,
    product,
    category,
    reviews,
    avgRating,
    related,
    sent: req.query.sent
  });
});

router.post('/store/:shopId/contact', async (req, res) => {
  const shop = await Shop.findByPk(req.params.shopId);
  if (!shop) return res.status(404).send('Không tìm thấy gian hàng');

  const { name, phone, message, productName } = req.body;
  const back = req.get('Referer') || `/store/${shop.id}`;
  const sep = back.includes('?') ? '&' : '?';

  if (!name || !message) {
    return res.redirect(back);
  }

  const customerLabel = `${name} - ${phone || 'chưa để lại SĐT'}`;
  const text = (productName ? `[Hỏi về: ${productName}] ` : '') + message;

  const existing = await Conversation.findOne({ where: { shopId: shop.id, customerName: customerLabel } });
  if (existing) {
    const messages = [...(existing.messages || []), { from: 'customer', text, at: dayjs().toISOString() }];
    await existing.update({ messages, unreadForShop: true });
  } else {
    await Conversation.create({
      id: nanoid(10),
      shopId: shop.id,
      customerName: customerLabel,
      unreadForShop: true,
      messages: [{ from: 'customer', text, at: dayjs().toISOString() }]
    });
  }

  res.redirect(`${back}${sep}sent=1`);
});

module.exports = { router, publicHome };
