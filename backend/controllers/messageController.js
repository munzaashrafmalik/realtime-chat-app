const Message = require('../models/Message');
const User = require('../models/User');

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!content || !receiverId) {
      return res.status(400).json({ message: 'Please provide content and receiver' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true, readAt: Date.now() },
      { new: true }
    );

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, sendMessage, markAsRead };
