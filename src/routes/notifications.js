const express = require('express');
const { Notification } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const notifications = await Notification.findAll({ where: { shopId: req.shop.id } });
  const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.render('notifications/index', { title: 'Thông báo', active: 'notifications', notifications: sorted });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  await Notification.update({ read: true }, { where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/notifications');
});

router.post('/read-all', requireAuth, async (req, res) => {
  await Notification.update({ read: true }, { where: { shopId: req.shop.id } });
  res.redirect('/notifications');
});

module.exports = router;
