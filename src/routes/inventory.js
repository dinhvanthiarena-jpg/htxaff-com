const express = require('express');
const { Product, Category } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('products'));

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { q = '', filter = 'all' } = req.query;
  let products = await Product.findAll({ where: { shopId } });

  if (q) {
    const qLower = q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(qLower) || p.sku.toLowerCase().includes(qLower));
  }
  if (filter === 'low') {
    products = products.filter((p) => p.stock <= 20);
  } else if (filter === 'out') {
    products = products.filter((p) => p.stock === 0);
  }

  products = [...products].sort((a, b) => a.stock - b.stock);

  const categories = await Category.findAll();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  res.render('inventory/index', {
    title: 'Kho hàng',
    active: 'inventory',
    products,
    categoryMap,
    filters: { q, filter }
  });
});

router.post('/:id/adjust', async (req, res) => {
  const { delta } = req.body;
  const product = await Product.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (product) {
    const newStock = Math.max(0, product.stock + (parseInt(delta, 10) || 0));
    await product.update({ stock: newStock });
  }
  res.redirect('/inventory');
});

router.post('/:id/set', async (req, res) => {
  const { stock } = req.body;
  const product = await Product.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (product) {
    await product.update({ stock: Math.max(0, parseInt(stock, 10) || 0) });
  }
  res.redirect('/inventory');
});

module.exports = router;
