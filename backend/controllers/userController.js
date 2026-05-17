const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ isOnline: -1, username: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicKey = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('publicKey username');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      userId: user._id,
      username: user.username,
      publicKey: user.publicKey
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({ message: 'Public key is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { publicKey },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Public key updated successfully',
      publicKey: user.publicKey
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getUserById, getPublicKey, updatePublicKey };
