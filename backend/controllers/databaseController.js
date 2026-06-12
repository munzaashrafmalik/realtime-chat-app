const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Call = require('../models/Call');

// Clear all database data
exports.clearAllData = async (req, res) => {
  try {
    // Delete all data from all collections
    await Promise.all([
      User.deleteMany({}),
      Message.deleteMany({}),
      Group.deleteMany({}),
      Call.deleteMany({})
    ]);

    res.json({
      success: true,
      message: '✅ Database cleared successfully! All accounts and data removed.',
      details: {
        users: 'All users deleted',
        messages: 'All messages deleted',
        groups: 'All groups deleted',
        calls: 'All call records deleted'
      }
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear database',
      error: error.message
    });
  }
};

// Get database statistics
exports.getDatabaseStats = async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      messages: await Message.countDocuments(),
      groups: await Group.countDocuments(),
      calls: await Call.countDocuments()
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database statistics',
      error: error.message
    });
  }
};
