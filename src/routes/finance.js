const express = require('express');
const dayjs = require('dayjs');
const { nanoid } = require('nanoid');
const { Transaction } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('finance'));

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { tab = 'pending' } = req.query;
  const transactions = await Transaction.findAll({ where: { shopId } });

  const pending = transactions.filter((t) => t.type === 'order' && t.status === 'pending_reconcile');
  const reconciled = transactions.filter((t) => t.type === 'order' && t.status === 'reconciled');
  const withdrawals = transactions.filter((t) => t.type === 'withdraw');

  const pendingBalance = pending.reduce((s, t) => s + t.amount, 0);
  const withdrawableBalance = reconciled.reduce((s, t) => s + t.amount, 0) - withdrawals.reduce((s, t) => s + Math.abs(t.amount), 0);

  const listMap = { pending, reconciled, withdrawals };
  const activeList = [...(listMap[tab] || pending)].sort((a, b) => new Date(b.at) - new Date(a.at));

  res.render('finance/index', {
    title: 'Tài chính',
    active: 'finance',
    tab,
    pendingBalance,
    withdrawableBalance: Math.max(0, withdrawableBalance),
    activeList,
    dayjs
  });
});

router.post('/withdraw', async (req, res) => {
  const shopId = req.shop.id;
  const transactions = await Transaction.findAll({ where: { shopId } });
  const reconciled = transactions.filter((t) => t.type === 'order' && t.status === 'reconciled');
  const withdrawals = transactions.filter((t) => t.type === 'withdraw');
  const withdrawable = reconciled.reduce((s, t) => s + t.amount, 0) - withdrawals.reduce((s, t) => s + Math.abs(t.amount), 0);

  const amount = Math.min(parseInt(req.body.amount, 10) || 0, withdrawable);
  if (amount > 0) {
    await Transaction.create({
      id: nanoid(10),
      shopId,
      type: 'withdraw',
      status: 'processing',
      content: `Lệnh rút tiền về ${req.shop.bank.bankName || 'ngân hàng'} - ${req.shop.bank.accountNumber || ''}`,
      amount: -amount,
      at: dayjs().toISOString()
    });
  }
  res.redirect('/finance?tab=withdrawals');
});

module.exports = router;
