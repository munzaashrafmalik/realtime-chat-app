const express = require('express');
const { getUsers, getUserById, getPublicKey, updatePublicKey } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.get('/:userId/public-key', protect, getPublicKey);
router.put('/public-key', protect, updatePublicKey);

module.exports = router;
