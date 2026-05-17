const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  getAnalytics,
  makeAdmin,
  removeAdmin
} = require('../controllers/adminController');

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminAuth);

// User management routes
router.get('/users', getAllUsers);
router.patch('/users/:userId/ban', banUser);
router.patch('/users/:userId/unban', unbanUser);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/make-admin', makeAdmin);
router.patch('/users/:userId/remove-admin', removeAdmin);

// Analytics route
router.get('/analytics', getAnalytics);

module.exports = router;
