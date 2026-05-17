require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST']
  }
});

// Multer configuration for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-memory storage
let users = [];
let messages = [];
let groups = [];
let userIdCounter = 1;
let messageIdCounter = 1;
let groupIdCounter = 1;

// Helper functions
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d'
  });
};

const generateAvatar = (username) => {
  return `https://ui-avatars.com/api/?name=${username}&background=random`;
};

// Auth middleware
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = users.find(u => u._id === decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = { ...user };
      delete req.user.password;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Real-time Chat API is running (In-Memory Mode)' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = users.find(u => u.email === email || u.username === username);

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = {
      _id: String(userIdCounter++),
      username,
      email,
      password: hashedPassword,
      avatar: generateAvatar(username),
      isOnline: false,
      status: 'Available',
      lastSeen: new Date(),
      createdAt: new Date()
    };

    users.push(user);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = users.find(u => u.email === email);

    if (user && (await bcrypt.compare(password, user.password))) {
      user.isOnline = true;
      user.lastSeen = new Date();

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
app.get('/api/auth/me', protect, (req, res) => {
  res.json(req.user);
});

// Update user status
app.patch('/api/users/status', protect, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'Away', 'Busy', 'Do Not Disturb'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = users.find(u => u._id === req.user._id);
    if (user) {
      user.status = status;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
app.get('/api/users', protect, (req, res) => {
  const filteredUsers = users
    .filter(u => u._id !== req.user._id)
    .map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    })
    .sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.username.localeCompare(b.username);
    });

  res.json(filteredUsers);
});

// Get user by ID
app.get('/api/users/:id', protect, (req, res) => {
  const user = users.find(u => u._id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Get messages
app.get('/api/messages/:userId', protect, (req, res) => {
  const { userId } = req.params;

  const userMessages = messages.filter(
    msg =>
      (msg.sender._id === req.user._id && msg.receiver._id === userId) ||
      (msg.sender._id === userId && msg.receiver._id === req.user._id)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json(userMessages);
});

// Send message
app.post('/api/messages', protect, (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!content || !receiverId) {
      return res.status(400).json({ message: 'Please provide content and receiver' });
    }

    const sender = users.find(u => u._id === req.user._id);
    const receiver = users.find(u => u._id === receiverId);

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = {
      _id: String(messageIdCounter++),
      sender: {
        _id: sender._id,
        username: sender.username,
        avatar: sender.avatar
      },
      receiver: {
        _id: receiver._id,
        username: receiver.username,
        avatar: receiver.avatar
      },
      content,
      isRead: false,
      reactions: [],
      createdAt: new Date()
    };

    messages.push(message);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload file
app.post('/api/upload', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileData = {
      _id: String(messageIdCounter++),
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer.toString('base64'),
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    res.status(201).json({
      fileId: fileData._id,
      filename: fileData.filename,
      mimetype: fileData.mimetype,
      size: fileData.size,
      url: `/api/files/${fileData._id}`
    });

    // Store file data temporarily (in real app, use cloud storage)
    messages.push({
      _id: fileData._id,
      type: 'file',
      fileData: fileData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download file
app.get('/api/files/:fileId', protect, (req, res) => {
  try {
    const fileMessage = messages.find(m => m._id === req.params.fileId && m.type === 'file');

    if (!fileMessage || !fileMessage.fileData) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileData = fileMessage.fileData;
    const buffer = Buffer.from(fileData.data, 'base64');

    res.set({
      'Content-Type': fileData.mimetype,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create group
app.post('/api/groups', protect, (req, res) => {
  try {
    const { name, memberIds } = req.body;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: 'Please provide group name and members' });
    }

    const members = memberIds.map(id => {
      const user = users.find(u => u._id === id);
      return user ? { _id: user._id, username: user.username, avatar: user.avatar } : null;
    }).filter(m => m !== null);

    if (members.length === 0) {
      return res.status(400).json({ message: 'No valid members found' });
    }

    const currentUser = users.find(u => u._id === req.user._id);
    const allMembers = [
      { _id: currentUser._id, username: currentUser.username, avatar: currentUser.avatar },
      ...members.filter(m => m._id !== currentUser._id)
    ];

    const group = {
      _id: String(groupIdCounter++),
      name,
      members: allMembers,
      admin: req.user._id,
      createdAt: new Date()
    };

    groups.push(group);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all groups for current user
app.get('/api/groups', protect, (req, res) => {
  try {
    const userGroups = groups.filter(g =>
      g.members.some(m => m._id === req.user._id)
    );
    res.json(userGroups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get group by ID
app.get('/api/groups/:id', protect, (req, res) => {
  try {
    const group = groups.find(g => g._id === req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id === req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get group messages
app.get('/api/groups/:id/messages', protect, (req, res) => {
  try {
    const group = groups.find(g => g._id === req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id === req.user._id);
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const groupMessages = messages.filter(m => m.groupId === req.params.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json(groupMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to group
app.post('/api/groups/:id/members', protect, (req, res) => {
  try {
    const { userId } = req.body;
    const group = groups.find(g => g._id === req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.admin !== req.user._id) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    const user = users.find(u => u._id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyMember = group.members.some(m => m._id === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push({
      _id: user._id,
      username: user.username,
      avatar: user.avatar
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove member from group
app.delete('/api/groups/:id/members/:userId', protect, (req, res) => {
  try {
    const group = groups.find(g => g._id === req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.admin !== req.user._id && req.params.userId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    group.members = group.members.filter(m => m._id !== req.params.userId);

    if (group.members.length === 0) {
      groups = groups.filter(g => g._id !== group._id);
      return res.json({ message: 'Group deleted as no members left' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Socket.io
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);

    const user = users.find(u => u._id === userId);
    if (user) {
      user.isOnline = true;
      user.lastSeen = new Date();
    }

    io.emit('user_status_change', {
      userId,
      isOnline: true
    });

    socket.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('change_status', (data) => {
    const { userId, status } = data;
    const user = users.find(u => u._id === userId);

    if (user) {
      user.status = status;
      io.emit('user_status_updated', {
        userId,
        status
      });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content, fileAttachment } = data;

      const sender = users.find(u => u._id === senderId);
      const receiver = users.find(u => u._id === receiverId);

      if (!sender || !receiver) {
        socket.emit('message_error', { message: 'User not found' });
        return;
      }

      const message = {
        _id: String(messageIdCounter++),
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar
        },
        receiver: {
          _id: receiver._id,
          username: receiver.username,
          avatar: receiver.avatar
        },
        content: content || '',
        fileAttachment: fileAttachment || null,
        isRead: false,
        reactions: [],
        createdAt: new Date()
      };

      messages.push(message);

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', message);
      }

      socket.emit('message_sent', message);
    } catch (error) {
      socket.emit('message_error', { message: error.message });
    }
  });

  socket.on('typing', (data) => {
    const { receiverId, senderId, isTyping } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        senderId,
        isTyping
      });
    }
  });

  socket.on('message_read', (data) => {
    const { messageId, senderId } = data;

    const message = messages.find(m => m._id === messageId);
    if (message) {
      message.isRead = true;
      message.readAt = new Date();

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_read_confirmation', {
          messageId,
          readAt: message.readAt
        });
      }
    }
  });

  socket.on('add_reaction', (data) => {
    const { messageId, emoji, userId, username } = data;

    const message = messages.find(m => m._id === messageId);
    if (message) {
      if (!message.reactions) {
        message.reactions = [];
      }

      const existingReaction = message.reactions.find(
        r => r.userId === userId && r.emoji === emoji
      );

      if (!existingReaction) {
        message.reactions.push({ emoji, userId, username });

        const otherUserId = message.sender._id === userId ? message.receiver._id : message.sender._id;
        const otherUserSocketId = onlineUsers.get(otherUserId);

        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('reaction_added', {
            messageId,
            reactions: message.reactions
          });
        }

        socket.emit('reaction_added', {
          messageId,
          reactions: message.reactions
        });
      }
    }
  });

  socket.on('remove_reaction', (data) => {
    const { messageId, emoji, userId } = data;

    const message = messages.find(m => m._id === messageId);
    if (message && message.reactions) {
      message.reactions = message.reactions.filter(
        r => !(r.userId === userId && r.emoji === emoji)
      );

      const otherUserId = message.sender._id === userId ? message.receiver._id : message.sender._id;
      const otherUserSocketId = onlineUsers.get(otherUserId);

      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit('reaction_removed', {
          messageId,
          reactions: message.reactions
        });
      }

      socket.emit('reaction_removed', {
        messageId,
        reactions: message.reactions
      });
    }
  });

  // Group Chat Events
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  socket.on('send_group_message', async (data) => {
    try {
      const { senderId, groupId, content, fileAttachment } = data;

      const group = groups.find(g => g._id === groupId);
      if (!group) {
        socket.emit('message_error', { message: 'Group not found' });
        return;
      }

      const sender = users.find(u => u._id === senderId);
      if (!sender) {
        socket.emit('message_error', { message: 'Sender not found' });
        return;
      }

      const isMember = group.members.some(m => m._id === senderId);
      if (!isMember) {
        socket.emit('message_error', { message: 'Not a group member' });
        return;
      }

      const message = {
        _id: String(messageIdCounter++),
        sender: {
          _id: sender._id,
          username: sender.username,
          avatar: sender.avatar
        },
        groupId,
        groupName: group.name,
        content: content || '',
        fileAttachment: fileAttachment || null,
        reactions: [],
        createdAt: new Date()
      };

      messages.push(message);

      io.to(`group_${groupId}`).emit('receive_group_message', message);
    } catch (error) {
      socket.emit('message_error', { message: error.message });
    }
  });

  socket.on('group_typing', (data) => {
    const { groupId, senderId, username, isTyping } = data;
    socket.to(`group_${groupId}`).emit('group_user_typing', {
      senderId,
      username,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      const user = users.find(u => u._id === disconnectedUserId);
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
      }

      io.emit('user_status_change', {
        userId: disconnectedUserId,
        isOnline: false
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (In-Memory Mode)`);
  console.log(`📝 No database required - using in-memory storage`);
  console.log(`⚠️  Note: All data will be lost when server restarts`);
});
