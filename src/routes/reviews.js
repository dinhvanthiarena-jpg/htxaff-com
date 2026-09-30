const express = require('express');
const { Review } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('reviews'));

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { rating = 'all' } = req.query;
  const allReviews = await Review.findAll({ where: { shopId } });
  let reviews = allReviews;

  if (rating !== 'all') {
    reviews = reviews.filter((r) => r.rating === parseInt(rating, 10));
  }
  reviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const avgRating = allReviews.length
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : '—';
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: allReviews.filter((rv) => rv.rating === r).length
  }));

  res.render('reviews/index', {
    title: 'Đánh giá',
    active: 'reviews',
    reviews,
    filters: { rating },
    avgRating,
    totalReviews: allReviews.length,
    ratingCounts
  });
});

router.post('/:id/reply', async (req, res) => {
  const { reply } = req.body;
  const review = await Review.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (review) {
    await review.update({ reply });
  }
  res.redirect('/reviews');
});

module.exports = router;
