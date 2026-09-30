const express = require('express');
const path = require('path');
const multer = require('multer');
const { nanoid } = require('nanoid');
const dayjs = require('dayjs');
const { Product, Category, Branch } = require('../models');
const { requireAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requirePermission('products'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'public', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${nanoid(6)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });
const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'sizeChartImage', maxCount: 1 }
]);

function buildPriceTiers(body) {
  const tiers = [];
  const qtys = [].concat(body.tierQty || []);
  const prices = [].concat(body.tierPrice || []);
  qtys.forEach((q, i) => {
    const minQty = parseInt(q, 10);
    const price = parseInt(prices[i], 10);
    if (!Number.isNaN(minQty) && !Number.isNaN(price)) {
      tiers.push({ minQty, price });
    }
  });
  tiers.sort((a, b) => a.minQty - b.minQty);
  return tiers.length ? tiers : [{ minQty: 1, price: 0 }];
}

function buildSpecs(body) {
  const keys = [].concat(body.specKey || []);
  const values = [].concat(body.specValue || []);
  const specs = [];
  keys.forEach((k, i) => {
    if (k && values[i]) specs.push({ key: k, value: values[i] });
  });
  return specs;
}

function buildBranchStock(body, branches) {
  const ids = [].concat(body.branchId || []);
  const qtys = [].concat(body.branchQty || []);
  const stockByBranch = {};
  ids.forEach((id, i) => {
    stockByBranch[id] = parseInt(qtys[i], 10) || 0;
  });
  const result = [{ branchId: 'default', stock: stockByBranch.default || 0 }];
  branches.forEach((b) => {
    result.push({ branchId: b.id, stock: stockByBranch[b.id] || 0 });
  });
  return result;
}

function csvToList(str) {
  return (str || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function buildVariants(body, existingVariants = []) {
  if (body.hasVariants !== 'on') return [];
  const colors = csvToList(body.variantColors);
  const sizes = csvToList(body.variantSizes);

  let combos = [];
  if (colors.length && sizes.length) {
    colors.forEach((c) => sizes.forEach((s) => combos.push({ color: c, size: s })));
  } else if (colors.length) {
    combos = colors.map((c) => ({ color: c }));
  } else if (sizes.length) {
    combos = sizes.map((s) => ({ size: s }));
  }

  return combos.map((attrs) => {
    const key = [attrs.color, attrs.size].filter(Boolean).join(' - ');
    const existing = existingVariants.find(
      (v) => [v.color, v.size].filter(Boolean).join(' - ') === key
    );
    return { ...attrs, stock: existing ? existing.stock : 0 };
  });
}

const NAME_TEMPLATES = [
  (n, u) => `${n} cao cấp - hàng sỉ chất lượng - ${u ? 'đơn vị ' + u : ''}`.trim(),
  (n) => `${n} - giá sỉ tận xưởng, số lượng lớn`,
  (n) => `[HÀNG SỈ] ${n} - đa dạng mẫu mã`,
  (n) => `${n} form chuẩn, đóng gói cẩn thận - ship toàn quốc`
];

const DESC_TEMPLATE = (name, categoryName, unit) => `${name} thuộc ngành hàng ${categoryName || 'đa dạng'}, đơn vị tính ${unit || 'sản phẩm'}. ` +
  'Hàng sỉ chất lượng, có sẵn số lượng lớn, đóng gói cẩn thận theo yêu cầu, hỗ trợ xuất hóa đơn VAT. ' +
  'Giá sỉ ưu đãi theo số lượng, càng mua nhiều giá càng tốt. Hỗ trợ đổi trả nếu hàng lỗi do nhà sản xuất.';

router.post('/suggest-name', (req, res) => {
  const { keyword = '', unit = '' } = req.body || {};
  const base = keyword.trim() || 'Sản phẩm mới';
  const suggestions = NAME_TEMPLATES.map((fn) => fn(base, unit));
  res.json({ suggestions });
});

router.post('/suggest-description', async (req, res) => {
  const { name = '', categoryId = '', unit = '' } = req.body || {};
  const category = categoryId ? await Category.findByPk(categoryId) : null;
  const description = DESC_TEMPLATE(name || 'Sản phẩm', category ? category.name : '', unit);
  res.json({ description });
});

function toCsvField(value) {
  const str = String(value === undefined || value === null ? '' : value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

router.get('/export', async (req, res) => {
  const shopId = req.shop.id;
  const products = await Product.findAll({ where: { shopId } });
  const categories = await Category.findAll();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const header = ['SKU', 'Tên sản phẩm', 'Danh mục', 'Đơn vị', 'Giá bán lẻ', 'Tồn kho', 'Trạng thái'];
  const rows = products.map((p) => [
    p.sku, p.name, categoryMap[p.categoryId] || '', p.unit, p.retailPrice, p.stock,
    p.status === 'active' ? 'Đang bán' : p.status === 'hidden' ? 'Đã ẩn' : 'Chờ duyệt'
  ]);
  const csv = [header, ...rows].map((r) => r.map(toCsvField).join(',')).join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="san-pham-${dayjs().format('YYYYMMDD')}.csv"`);
  res.send('﻿' + csv);
});

router.get('/import', (req, res) => {
  res.render('products/import', { title: 'Nhập dữ liệu sản phẩm', active: 'products', result: null });
});

const importUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/import', importUpload.single('file'), async (req, res) => {
  if (!req.file) return res.render('products/import', { title: 'Nhập dữ liệu sản phẩm', active: 'products', result: { error: 'Vui lòng chọn file CSV' } });

  const shopId = req.shop.id;
  const text = req.file.buffer.toString('utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  lines.shift(); // header

  const categories = await Category.findAll();
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const existingProducts = await Product.findAll({ where: { shopId } });

  let created = 0;
  let updated = 0;
  for (const line of lines) {
    const [sku, name, categoryName, unit, retailPrice, stock] = parseCsvLine(line);
    if (!name) continue;
    const categoryId = categoryByName[(categoryName || '').toLowerCase()] || categories[0].id;
    const existing = existingProducts.find((p) => p.sku === sku);

    if (existing) {
      await existing.update({
        name, categoryId, unit: unit || existing.unit,
        retailPrice: parseInt(retailPrice, 10) || existing.retailPrice,
        stock: parseInt(stock, 10) || existing.stock
      });
      updated++;
    } else {
      const newStock = parseInt(stock, 10) || 0;
      await Product.create({
        id: nanoid(10), shopId, sku: sku || `SP${nanoid(6).toUpperCase()}`, name, categoryId, unit: unit || 'cái',
        images: [], video: '', sizeChartImage: '', specs: [],
        priceTiers: [{ minQty: 1, price: parseInt(retailPrice, 10) || 0 }],
        retailPrice: parseInt(retailPrice, 10) || 0, retailSuggestPrice: 0,
        weight: 0, dimensions: { length: 0, width: 0, height: 0 }, variants: [],
        branchStock: [{ branchId: 'default', stock: newStock }],
        stock: newStock, sold: 0, status: 'pending',
        description: '', createdAt: dayjs().toISOString()
      });
      created++;
    }
  }

  res.render('products/import', { title: 'Nhập dữ liệu sản phẩm', active: 'products', result: { created, updated } });
});

router.get('/', async (req, res) => {
  const shopId = req.shop.id;
  const { q = '', status = 'all', categoryId = 'all', page = 1 } = req.query;
  let products = await Product.findAll({ where: { shopId } });

  if (q) {
    const qLower = q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(qLower) || p.sku.toLowerCase().includes(qLower));
  }
  if (status !== 'all') {
    products = products.filter((p) => p.status === status);
  }
  if (categoryId !== 'all') {
    products = products.filter((p) => p.categoryId === categoryId);
  }

  products = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(products.length / perPage));
  const currentPage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
  const paged = products.slice((currentPage - 1) * perPage, currentPage * perPage);

  const categories = await Category.findAll();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  res.render('products/index', {
    title: 'Sản phẩm',
    active: 'products',
    products: paged,
    categoryMap,
    categories,
    filters: { q, status, categoryId },
    pagination: { currentPage, totalPages, total: products.length }
  });
});

router.get('/new', async (req, res) => {
  const categories = await Category.findAll();
  const branches = await Branch.findAll({ where: { shopId: req.shop.id } });
  res.render('products/form', { title: 'Thêm sản phẩm', active: 'products', product: null, categories, branches, shop: req.shop });
});

router.post('/new', uploadFields, async (req, res) => {
  const shopId = req.shop.id;
  const { name, sku, categoryId, unit, retailPrice, retailSuggestPrice, description, weight, length, width, height } = req.body;
  const files = req.files || {};
  const images = (files.images || []).map((f) => `/uploads/${f.filename}`);
  const video = files.video && files.video[0] ? `/uploads/${files.video[0].filename}` : '';
  const sizeChartImage = files.sizeChartImage && files.sizeChartImage[0] ? `/uploads/${files.sizeChartImage[0].filename}` : '';
  const branches = await Branch.findAll({ where: { shopId } });
  const branchStock = buildBranchStock(req.body, branches);

  await Product.create({
    id: nanoid(10),
    shopId,
    sku: sku || `SP${nanoid(6).toUpperCase()}`,
    name,
    categoryId,
    unit,
    images,
    video,
    sizeChartImage,
    specs: buildSpecs(req.body),
    priceTiers: buildPriceTiers(req.body),
    retailPrice: parseInt(retailPrice, 10) || 0,
    retailSuggestPrice: parseInt(retailSuggestPrice, 10) || 0,
    weight: parseInt(weight, 10) || 0,
    dimensions: { length: parseInt(length, 10) || 0, width: parseInt(width, 10) || 0, height: parseInt(height, 10) || 0 },
    variants: buildVariants(req.body),
    branchStock,
    stock: branchStock.reduce((s, b) => s + b.stock, 0),
    sold: 0,
    status: 'active',
    description: description || '',
    createdAt: dayjs().toISOString()
  });
  res.redirect('/products');
});

router.get('/:id/edit', async (req, res) => {
  const product = await Product.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (!product) return res.redirect('/products');
  const categories = await Category.findAll();
  const branches = await Branch.findAll({ where: { shopId: req.shop.id } });
  res.render('products/form', { title: 'Sửa sản phẩm', active: 'products', product, categories, branches, shop: req.shop });
});

router.post('/:id/edit', uploadFields, async (req, res) => {
  const product = await Product.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (!product) return res.redirect('/products');

  const { name, sku, categoryId, unit, retailPrice, retailSuggestPrice, description, weight, length, width, height } = req.body;
  const files = req.files || {};
  const newImages = (files.images || []).map((f) => `/uploads/${f.filename}`);
  const existingImages = product.images || [];
  const video = files.video && files.video[0] ? `/uploads/${files.video[0].filename}` : product.video || '';
  const sizeChartImage = files.sizeChartImage && files.sizeChartImage[0]
    ? `/uploads/${files.sizeChartImage[0].filename}`
    : product.sizeChartImage || '';
  const branches = await Branch.findAll({ where: { shopId: req.shop.id } });
  const branchStock = buildBranchStock(req.body, branches);

  await product.update({
    name,
    sku,
    categoryId,
    unit,
    priceTiers: buildPriceTiers(req.body),
    specs: buildSpecs(req.body),
    retailPrice: parseInt(retailPrice, 10) || 0,
    retailSuggestPrice: parseInt(retailSuggestPrice, 10) || 0,
    weight: parseInt(weight, 10) || 0,
    dimensions: { length: parseInt(length, 10) || 0, width: parseInt(width, 10) || 0, height: parseInt(height, 10) || 0 },
    variants: buildVariants(req.body, product.variants || []),
    branchStock,
    stock: branchStock.reduce((s, b) => s + b.stock, 0),
    description: description || '',
    video,
    sizeChartImage,
    images: newImages.length ? [...existingImages, ...newImages] : existingImages
  });

  res.redirect('/products');
});

router.post('/:id/delete', async (req, res) => {
  await Product.destroy({ where: { id: req.params.id, shopId: req.shop.id } });
  res.redirect('/products');
});

router.post('/:id/toggle-status', async (req, res) => {
  const product = await Product.findOne({ where: { id: req.params.id, shopId: req.shop.id } });
  if (product) {
    const next = product.status === 'active' ? 'hidden' : 'active';
    await product.update({ status: next });
  }
  res.redirect('back');
});

module.exports = router;
