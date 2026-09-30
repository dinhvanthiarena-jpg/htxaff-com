const express = require('express');
const dayjs = require('dayjs');
const { Conversation } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('feed'));

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const conversations = await Conversation.findAll({ where: { shopId } });
  const sorted = [...conversations].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1];
    const bLast = b.messages[b.messages.length - 1];
    return new Date(bLast.at) - new Date(aLast.at);
  });

  const activeId = req.query.c || (sorted[0] && sorted[0].id);
  const activeConversation = sorted.find((c) => c.id === activeId);

  if (activeConversation && activeConversation.unreadForShop) {
    await Conversation.update({ unreadForShop: false }, { where: { id: activeConversation.id } });
    activeConversation.unreadForShop = false;
  }

  res.render('messengers/index', {
    title: 'Tin nhắn',
    active: 'messengers',
    conversations: sorted,
    activeConversation,
    dayjs
  });
});

router.post('/:id/reply', async (req, res) => {
  const { text } = req.body;
  const conv = await Conversation.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (conv && text) {
    const messages = [...(conv.messages || []), { from: 'shop', text, at: dayjs().toISOString() }];
    await conv.update({ messages });
  }
  res.redirect(`/messengers?c=${req.params.id}`);
});

module.exports = router;
