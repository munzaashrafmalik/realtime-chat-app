const express = require('express');
const { getMessages, sendMessage, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);
router.patch('/:messageId/read', protect, markAsRead);

module.exports = router;
