const express = require('express');
const path = require('path');
const multer = require('multer');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');
const { FeedPost, Product } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('feed'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, `feed-${Date.now()}-${nanoid(6)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const feedPosts = await FeedPost.findAll({ where: { shopId } });
  const posts = [...feedPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const products = await Product.findAll({ where: { shopId } });

  res.render('feed/index', { title: 'Feed', active: 'feed', posts, products, dayjs });
});

router.post('/', upload.array('images', 5), async (req, res) => {
  const { content, productId } = req.body;
  const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
  if (content || images.length) {
    await FeedPost.create({
      id: nanoid(10),
      shopId: req.shop.id,
      content: content || '',
      images,
      productId: productId || null,
      createdAt: dayjs().toISOString()
    });
  }
  res.redirect('/feed');
});

router.post('/:id/delete', async (req, res) => {
  await FeedPost.destroy({ where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/feed');
});

module.exports = router;
