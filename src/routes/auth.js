const express = require('express');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { Shop, Member } = require('../models');
const { redirectIfAuthed } = require('../middleware/auth');

const router = express.Router();

router.get('/login', redirectIfAuthed, (req, res) => {
  res.render('auth/login', { title: 'Đăng nhập', error: null, layout: false });
});

router.post('/login', redirectIfAuthed, async (req, res) => {
  const { identifier, password } = req.body;
  const shop = await Shop.findOne({ where: { [Op.or]: [{ email: identifier }, { phone: identifier }] } });

  if (shop && bcrypt.compareSync(password || '', shop.passwordHash)) {
    req.session.shopId = shop.id;
    req.session.memberId = null;
    return res.redirect('/');
  }

  const member = await Member.findOne({ where: { [Op.or]: [{ email: identifier }, { phone: identifier }] } });

  if (member && member.status === 'active' && bcrypt.compareSync(password || '', member.passwordHash)) {
    req.session.shopId = member.shopId;
    req.session.memberId = member.id;
    return res.redirect('/');
  }

  return res.render('auth/login', {
    title: 'Đăng nhập',
    error: 'Số điện thoại/Email hoặc mật khẩu không đúng',
    layout: false
  });
});

router.get('/register', redirectIfAuthed, (req, res) => {
  res.render('auth/register', { title: 'Đăng ký', error: null, layout: false });
});

router.post('/register', redirectIfAuthed, async (req, res) => {
  const { shopName, email, phone, password } = req.body;

  if (!shopName || !email || !phone || !password) {
    return res.render('auth/register', { title: 'Đăng ký', error: 'Vui lòng nhập đầy đủ thông tin', layout: false });
  }

  const exists = await Shop.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
  if (exists) {
    return res.render('auth/register', { title: 'Đăng ký', error: 'Email hoặc số điện thoại đã được đăng ký', layout: false });
  }

  const shop = await Shop.create({
    id: nanoid(10),
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    shopName,
    shopLogo: '',
    businessType: 'Hộ kinh doanh cá thể',
    address: '',
    bank: { bankName: '', accountNumber: '', accountHolder: '' },
    shippingMethods: [],
    ratingAvg: 0,
    createdAt: dayjs().toDate()
  });

  req.session.shopId = shop.id;
  req.session.memberId = null;
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
