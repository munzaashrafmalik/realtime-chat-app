const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: 'Group name and members are required' });
    }

    // Create group with current user as admin
    const group = await Group.create({
      name,
      admin: req.user.id,
      members: [req.user.id, ...memberIds]
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all groups for current user
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id
    })
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get group messages
exports.getGroupMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.some(member => member.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ group: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add member to group
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    // Check if user already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    // Cannot remove admin
    if (userId === group.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove admin' });
    }

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');

    res.json(updatedGroup);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
