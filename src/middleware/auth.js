const { Shop, Member, Notification } = require('../models');

async function requireAuth(req, res, next) {
  if (!req.session.shopId) {
    return res.redirect('/login');
  }
  try {
    const shop = await Shop.findByPk(req.session.shopId);
    if (!shop) {
      return req.session.destroy(() => res.redirect('/login'));
    }
    req.shop = shop;
    res.locals.shop = shop;

    if (req.session.memberId) {
      const member = await Member.findOne({ where: { id: req.session.memberId, shopId: shop.id } });
      if (!member || member.status !== 'active') {
        return req.session.destroy(() => res.redirect('/login'));
      }
      req.member = member;
      res.locals.member = member;
      res.locals.isOwner = false;
      res.locals.permissions = member.permissions;
    } else {
      req.member = null;
      res.locals.member = null;
      res.locals.isOwner = true;
      res.locals.permissions = null;
    }

    res.locals.unreadCount = await Notification.count({ where: { shopId: shop.id, read: false } });
    next();
  } catch (err) {
    next(err);
  }
}

function requirePermission(key) {
  return (req, res, next) => {
    if (res.locals.isOwner) return next();
    if (res.locals.permissions && res.locals.permissions[key]) return next();
    return res.redirect('/?denied=1');
  };
}

function redirectIfAuthed(req, res, next) {
  if (req.session.shopId) {
    return res.redirect('/');
  }
  next();
}

module.exports = { requireAuth, requirePermission, redirectIfAuthed };
