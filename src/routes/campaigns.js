const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.render('campaigns/index', { title: 'Kênh marketing', active: 'campaigns' });
});

module.exports = router;
