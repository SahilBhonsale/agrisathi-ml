const express = require('express');
const User = require('../models/user');
const Product = require('../models/Product');
const Question = require('../models/Question');
const Comment = require('../models/Comment');
const CareTip = require('../models/CareTip');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/overview', async (_req, res) => {
  try {
    const [users, products, questions, comments, careTips, recentUsers, recentProducts, recentQuestions] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isDeleted: false }),
      Question.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      CareTip.countDocuments({ isDeleted: false }),
      User.find().select('name email authProvider isAdmin createdAt').sort({ createdAt: -1 }).limit(6).lean(),
      Product.find({ isDeleted: false }).select('title price category createdAt').sort({ createdAt: -1 }).limit(6).lean(),
      Question.find({ isDeleted: false }).select('title category createdAt').sort({ createdAt: -1 }).limit(6).lean()
    ]);

    return res.json({
      success: true,
      data: {
        counts: { users, products, questions, comments, careTips },
        recentUsers,
        recentProducts,
        recentQuestions
      }
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load admin overview' });
  }
});

module.exports = router;
