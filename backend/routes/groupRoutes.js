const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createGroup,
  getGroups,
  getGroupById,
  getGroupMessages,
  addMember,
  removeMember
} = require('../controllers/groupController');

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/:id', protect, getGroupById);
router.get('/:id/messages', protect, getGroupMessages);
router.post('/:groupId/members', protect, addMember);
router.delete('/:groupId/members/:userId', protect, removeMember);

module.exports = router;
