const express = require('express');
const {
  castVote,
  getReceipt,
  verifySecurityQuestions,
  getVotingHistory
} = require('../controllers/voteController');
const { protect, requireMfa } = require('../middleware/auth');
const { voteLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/cast', protect, requireMfa, voteLimiter, castVote);
router.post('/verify-security', protect, requireMfa, verifySecurityQuestions);
router.get('/receipt/:receiptNumber', protect, requireMfa, getReceipt);
router.get('/history', protect, requireMfa, getVotingHistory);

module.exports = router;
