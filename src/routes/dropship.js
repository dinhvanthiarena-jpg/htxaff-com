const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.render('dropship/index', { title: 'HTXAFF Dropship', active: 'dropship' });
});

module.exports = router;
