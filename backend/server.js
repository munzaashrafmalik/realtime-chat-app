require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const groupRoutes = require('./routes/groupRoutes');
const User = require('./models/User');
const Message = require('./models/Message');
const Call = require('./models/Call');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://realtime-chat-app-munza-ashrafs-projects.vercel.app',
      /\.vercel\.app$/
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

connectDB();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://realtime-chat-app-munza-ashrafs-projects.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Real-time Chat API is running' });
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_online', async (userId) => {
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: Date.now()
    });

    io.emit('user_status_change', {
      userId,
      isOnline: true
    });

    socket.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content, isEncrypted, originalMessage } = data;

      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
        isEncrypted: isEncrypted || false
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar');

      // Send to receiver with encrypted content
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', populatedMessage);
      }

      // Send back to sender with original message if encrypted
      const senderMessage = {
        ...populatedMessage.toObject(),
        originalMessage: isEncrypted ? originalMessage : null
      };
      socket.emit('message_sent', senderMessage);
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

  socket.on('message_read', async (data) => {
    const { messageId, userId } = data;

    try {
      await Message.findByIdAndUpdate(messageId, {
        isRead: true,
        readAt: Date.now()
      });

      const senderSocketId = onlineUsers.get(userId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_read_confirmation', { messageId });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // WebRTC Call Signaling Events
  socket.on('call_initiate', async (data) => {
    try {
      const { callerId, receiverId, type } = data;

      const call = await Call.create({
        caller: callerId,
        receiver: receiverId,
        type,
        status: 'ringing'
      });

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming_call', {
          callId: call._id,
          callerId,
          type,
          caller: await User.findById(callerId).select('username avatar')
        });
      } else {
        call.status = 'missed';
        await call.save();
        socket.emit('call_failed', { message: 'User is offline' });
      }
    } catch (error) {
      console.error('Call initiate error:', error);
      socket.emit('call_error', { message: error.message });
    }
  });

  socket.on('call_accept', async (data) => {
    try {
      const { callId, receiverId } = data;

      const call = await Call.findById(callId);
      if (call) {
        call.status = 'accepted';
        call.startTime = new Date();
        await call.save();

        const callerSocketId = onlineUsers.get(call.caller.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call_accepted', {
            callId,
            receiverId
          });
        }
      }
    } catch (error) {
      console.error('Call accept error:', error);
    }
  });

  socket.on('call_reject', async (data) => {
    try {
      const { callId } = data;

      const call = await Call.findById(callId);
      if (call) {
        call.status = 'rejected';
        await call.save();

        const callerSocketId = onlineUsers.get(call.caller.toString());
        if (callerSocketId) {
          io.to(callerSocketId).emit('call_rejected', { callId });
        }
      }
    } catch (error) {
      console.error('Call reject error:', error);
    }
  });

  socket.on('call_end', async (data) => {
    try {
      const { callId, userId } = data;

      const call = await Call.findById(callId);
      if (call) {
        call.status = 'ended';
        call.endTime = new Date();
        call.calculateDuration();
        await call.save();

        const otherUserId = call.caller.toString() === userId
          ? call.receiver.toString()
          : call.caller.toString();

        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('call_ended', { callId });
        }
      }
    } catch (error) {
      console.error('Call end error:', error);
    }
  });

  socket.on('webrtc_offer', (data) => {
    const { receiverId, offer, callId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc_offer', {
        offer,
        callId,
        senderId: data.senderId
      });
    }
  });

  socket.on('webrtc_answer', (data) => {
    const { callerId, answer, callId } = data;
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit('webrtc_answer', {
        answer,
        callId
      });
    }
  });

  socket.on('ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    const targetSocketId = onlineUsers.get(targetUserId);

    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', {
        candidate,
        senderId: data.senderId
      });
    }
  });

  socket.on('disconnect', async () => {
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
      await User.findByIdAndUpdate(disconnectedUserId, {
        isOnline: false,
        lastSeen: Date.now()
      });

      io.emit('user_status_change', {
        userId: disconnectedUserId,
        isOnline: false
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
