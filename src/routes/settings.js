const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { Shop, Member, Branch } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');
const provinces = require('../data/provinces');
const { MODULES, ROLE_PRESETS } = require('../data/permissions');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, `logo-${Date.now()}-${nanoid(6)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.use(requireAuth);
router.use((req, res, next) => {
  if (req.path === '/security') return next();
  return requirePermission('settings')(req, res, next);
});

router.get('/', (req, res) => {
  res.render('settings/index', { title: 'Cài đặt', active: 'settings', dayjs });
});

router.get('/general', (req, res) => {
  res.render('settings/general', { title: 'Cài đặt chung', active: 'settings', saved: req.query.saved });
});

router.post('/general', async (req, res) => {
  const {
    taxInfo, introduction, salesPolicy,
    vacationMode, hidePrices, negotiablePrice,
    minOrderQty, minOrderValue,
    codEnabled, codMaxShippingFee, codMaxOrderValue,
    autoReplyEnabled, autoReplyMessage,
    companyName, taxCode, capital, employeeCount, foundedYear, factoryScale,
    companyOverview, businessAddress, businessLine, businessModel,
    mainProducts, factoryAddress, allowCustomization
  } = req.body;

  await req.shop.update({
    taxInfo,
    introduction,
    salesPolicy,
    vacationMode: vacationMode === 'on',
    hidePrices: hidePrices === 'on',
    negotiablePrice: negotiablePrice === 'on',
    minOrderQty: parseInt(minOrderQty, 10) || 0,
    minOrderValue: parseInt(minOrderValue, 10) || 0,
    codEnabled: codEnabled === 'on',
    codMaxShippingFee: parseInt(codMaxShippingFee, 10) || 0,
    codMaxOrderValue: parseInt(codMaxOrderValue, 10) || 0,
    autoReplyEnabled: autoReplyEnabled === 'on',
    autoReplyMessage: autoReplyMessage || '',
    company: {
      name: companyName || '', taxCode: taxCode || '', capital: parseInt(capital, 10) || 0,
      employeeCount: employeeCount || '', foundedYear: foundedYear || '', factoryScale: factoryScale || '',
      overview: companyOverview || '', businessAddress: businessAddress || '', businessLine: businessLine || '',
      businessModel: businessModel || '', mainProducts: mainProducts || '', factoryAddress: factoryAddress || '',
      allowCustomization: allowCustomization === 'on'
    }
  });
  res.redirect('/settings/general?saved=1');
});

router.post('/delete-account-request', async (req, res) => {
  await req.shop.update({ deleteRequested: true });
  res.redirect('/settings/general?saved=1');
});

router.get('/shop', (req, res) => {
  res.render('settings/shop', { title: 'Thông tin gian hàng', active: 'settings', saved: req.query.saved, provinces });
});

router.post('/shop', upload.fields([{ name: 'shopLogo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), async (req, res) => {
  const {
    shopName, shopEmail, businessType, phone, businessScope, shopBanner, introPost, dropshipIntroPost,
    addressProvince, addressDistrict, addressWard, addressStreet
  } = req.body;
  const files = req.files || {};
  const address = [addressStreet, addressWard, addressDistrict, addressProvince].filter(Boolean).join(', ');
  const update = {
    shopName, shopEmail, businessType, phone,
    addressProvince: addressProvince || '', addressDistrict: addressDistrict || '',
    addressWard: addressWard || '', addressStreet: addressStreet || '',
    address,
    businessScope: businessScope || 'Toàn quốc',
    shopBanner: shopBanner || '',
    introPost: introPost || '',
    dropshipIntroPost: dropshipIntroPost || ''
  };
  if (files.shopLogo && files.shopLogo[0]) update.shopLogo = `/uploads/${files.shopLogo[0].filename}`;
  if (files.coverImage && files.coverImage[0]) update.coverImage = `/uploads/${files.coverImage[0].filename}`;
  await req.shop.update(update);
  res.redirect('/settings/shop?saved=1');
});

const bannerUpload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

router.get('/decoration', (req, res) => {
  res.render('settings/decoration', { title: 'Trang trí gian hàng', active: 'settings' });
});

router.post('/decoration/banners', bannerUpload.single('banner'), async (req, res) => {
  if (req.file) {
    const banners = [...(req.shop.banners || []), { id: nanoid(8), image: `/uploads/${req.file.filename}`, link: req.body.link || '' }];
    await req.shop.update({ banners });
  }
  res.redirect('/settings/decoration');
});

router.post('/decoration/banners/:bannerId/delete', async (req, res) => {
  const banners = (req.shop.banners || []).filter((b) => b.id !== req.params.bannerId);
  await req.shop.update({ banners });
  res.redirect('/settings/decoration');
});

router.post('/decoration/theme', async (req, res) => {
  await req.shop.update({ shopTheme: req.body.theme || 'orange' });
  res.redirect('/settings/decoration?saved=1');
});

router.get('/branches', async (req, res) => {
  const branches = await Branch.findAll({ where: { shopId: req.shop.id } });
  res.render('settings/branches', { title: 'Chi nhánh/Điểm lấy hàng', active: 'settings', branches });
});

router.post('/branches', async (req, res) => {
  const { name, address } = req.body;
  if (name && address) {
    await Branch.create({ id: nanoid(10), shopId: req.shop.id, name, address, isDefault: false });
  }
  res.redirect('/settings/branches');
});

router.post('/branches/:id/delete', async (req, res) => {
  await Branch.destroy({ where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/settings/branches');
});

router.get('/bank', (req, res) => {
  res.render('settings/bank', { title: 'Tài khoản ngân hàng', active: 'settings', saved: req.query.saved });
});

router.post('/bank', async (req, res) => {
  const { bankName, accountNumber, accountHolder } = req.body;
  await req.shop.update({ bank: { bankName, accountNumber, accountHolder } });
  res.redirect('/settings/bank?saved=1');
});

router.get('/shipping', (req, res) => {
  res.render('settings/shipping', { title: 'Vận chuyển', active: 'settings', saved: req.query.saved });
});

router.post('/shipping', async (req, res) => {
  const methods = [].concat(req.body.methods || []).filter(Boolean);
  await req.shop.update({ shippingMethods: methods });
  res.redirect('/settings/shipping?saved=1');
});

router.get('/integrations', (req, res) => {
  res.render('settings/integrations', { title: 'Tích hợp đối tác', active: 'settings' });
});

router.get('/members', async (req, res) => {
  const members = await Member.findAll({ where: { shopId: req.shop.id } });
  res.render('settings/members/index', { title: 'Thành viên gian hàng', active: 'settings', members, MODULES, shop: req.shop });
});

router.get('/members/new', (req, res) => {
  res.render('settings/members/form', { title: 'Thêm thành viên', active: 'settings', member: null, MODULES, ROLE_PRESETS, error: null });
});

router.post('/members/new', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  const exists = await Shop.findOne({ where: { [Op.or]: [{ email }, { phone }] } })
    || await Member.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
  if (exists) {
    return res.render('settings/members/form', {
      title: 'Thêm thành viên', active: 'settings', member: null, MODULES, ROLE_PRESETS,
      error: 'Email hoặc số điện thoại này đã được dùng cho một tài khoản khác'
    });
  }

  const preset = ROLE_PRESETS[role] || ROLE_PRESETS.custom;
  const permissions = {};
  MODULES.forEach((m) => { permissions[m.key] = req.body[`perm_${m.key}`] === 'on'; });

  await Member.create({
    id: nanoid(10),
    shopId: req.shop.id,
    name,
    email,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role || 'custom',
    roleLabel: preset.label,
    permissions,
    status: 'active',
    createdAt: dayjs().toISOString()
  });
  res.redirect('/settings/members');
});

router.get('/members/:id/edit', async (req, res) => {
  const member = await Member.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (!member) return res.redirect('/settings/members');
  res.render('settings/members/form', { title: 'Sửa thành viên', active: 'settings', member, MODULES, ROLE_PRESETS, error: null });
});

router.post('/members/:id/edit', async (req, res) => {
  const member = await Member.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (!member) return res.redirect('/settings/members');

  const { name, email, phone, password, role } = req.body;
  const preset = ROLE_PRESETS[role] || ROLE_PRESETS.custom;
  const permissions = {};
  MODULES.forEach((m) => { permissions[m.key] = req.body[`perm_${m.key}`] === 'on'; });

  const update = { name, email, phone, role: role || 'custom', roleLabel: preset.label, permissions };
  if (password) update.passwordHash = bcrypt.hashSync(password, 10);
  await member.update(update);
  res.redirect('/settings/members');
});

router.post('/members/:id/toggle-status', async (req, res) => {
  const member = await Member.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (member) {
    await member.update({ status: member.status === 'active' ? 'inactive' : 'active' });
  }
  res.redirect('/settings/members');
});

router.post('/members/:id/delete', async (req, res) => {
  await Member.destroy({ where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/settings/members');
});

router.get('/security', (req, res) => {
  res.render('settings/security', { title: 'Bảo mật', active: 'settings', error: null, saved: req.query.saved });
});

router.post('/security', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const account = req.member || req.shop;

  if (!bcrypt.compareSync(currentPassword || '', account.passwordHash)) {
    return res.render('settings/security', { title: 'Bảo mật', active: 'settings', error: 'Mật khẩu hiện tại không đúng', saved: null });
  }
  await account.update({ passwordHash: bcrypt.hashSync(newPassword, 10) });
  res.redirect('/settings/security?saved=1');
});

module.exports = router;
