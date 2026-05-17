const User = require('../models/User');
const Message = require('../models/Message');

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('bannedBy', 'username email');

    const total = await User.countDocuments(query);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ban a user
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot ban yourself' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: 'Cannot ban an admin user' });
    }

    if (user.isBanned) {
      return res.status(400).json({ message: 'User is already banned' });
    }

    user.isBanned = true;
    user.bannedAt = new Date();
    user.bannedBy = req.user.id;
    user.isOnline = false;
    await user.save();

    res.json({
      message: 'User banned successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unban a user
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isBanned) {
      return res.status(400).json({ message: 'User is not banned' });
    }

    user.isBanned = false;
    user.bannedAt = null;
    user.bannedBy = null;
    await user.save();

    res.json({
      message: 'User unbanned successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: 'Cannot delete an admin user' });
    }

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics
const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const activeUsers = await User.countDocuments({ isOnline: true });
    const totalMessages = await Message.countDocuments();

    // Get new users in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get messages sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: today }
    });

    // Get top active users (by message count)
    const topUsers = await Message.aggregate([
      {
        $group: {
          _id: '$sender',
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          email: '$user.email',
          avatar: '$user.avatar',
          messageCount: 1
        }
      }
    ]);

    // Get daily message stats for last 7 days
    const dailyStats = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      bannedUsers,
      activeUsers,
      totalMessages,
      newUsers,
      messagesToday,
      topUsers,
      dailyStats
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Make user admin
const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.isAdmin = true;
    await user.save();

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove admin privileges
const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot remove your own admin privileges' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    user.isAdmin = false;
    await user.save();

    res.json({
      message: 'Admin privileges removed successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  getAnalytics,
  makeAdmin,
  removeAdmin
};
