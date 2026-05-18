import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.emit('user_online', user._id);

      newSocket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_status_change', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          if (isOnline) {
            return [...new Set([...prev, userId])];
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      });

      newSocket.on('receive_message', (message) => {
        setMessages((prev) => [...prev, message]);

        // Show notification if window is not focused
        if (!document.hasFocus() && message.sender._id !== user._id) {
          notificationService.showMessageNotification(message, false);
        }
      });

      newSocket.on('message_sent', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on('user_typing', ({ senderId, isTyping }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [senderId]: isTyping
        }));
      });

      newSocket.on('message_read_confirmation', ({ messageId, readAt }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, isRead: true, readAt } : msg
          )
        );
      });

      newSocket.on('reaction_added', ({ messageId, reactions }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          )
        );
      });

      newSocket.on('reaction_removed', ({ messageId, reactions }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          )
        );
      });

      newSocket.on('user_status_updated', ({ userId, status }) => {
        // This will be handled by the Chat component to update user list
      });

      newSocket.on('receive_group_message', (message) => {
        setMessages((prev) => [...prev, message]);

        // Show notification if window is not focused
        if (!document.hasFocus() && message.sender._id !== user._id) {
          notificationService.showMessageNotification(message, true);
        }
      });

      newSocket.on('group_user_typing', ({ senderId, username, isTyping }) => {
        setGroupTypingUsers((prev) => ({
          ...prev,
          [senderId]: isTyping ? username : null
        }));

        setTimeout(() => {
          setGroupTypingUsers((prev) => ({
            ...prev,
            [senderId]: null
          }));
        }, 3000);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendMessage = (receiverId, content, fileAttachment = null, isEncrypted = false, originalMessage = null) => {
    if (socket && user) {
      socket.emit('send_message', {
        senderId: user._id,
        receiverId,
        content,
        fileAttachment,
        isEncrypted,
        originalMessage
      });
    }
  };

  const sendTypingStatus = (receiverId, isTyping) => {
    if (socket && user) {
      socket.emit('typing', {
        senderId: user._id,
        receiverId,
        isTyping
      });
    }
  };

  const markMessageAsRead = (messageId, senderId) => {
    if (socket && user) {
      socket.emit('message_read', {
        messageId,
        senderId
      });
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && user) {
      socket.emit('add_reaction', {
        messageId,
        emoji,
        userId: user._id,
        username: user.username
      });
    }
  };

  const removeReaction = (messageId, emoji) => {
    if (socket && user) {
      socket.emit('remove_reaction', {
        messageId,
        emoji,
        userId: user._id
      });
    }
  };

  const changeStatus = (status) => {
    if (socket && user) {
      socket.emit('change_status', {
        userId: user._id,
        status
      });
    }
  };

  const joinGroup = (groupId) => {
    if (socket) {
      socket.emit('join_group', groupId);
    }
  };

  const leaveGroup = (groupId) => {
    if (socket) {
      socket.emit('leave_group', groupId);
    }
  };

  const sendGroupMessage = (groupId, content, fileAttachment = null) => {
    if (socket && user) {
      socket.emit('send_group_message', {
        senderId: user._id,
        groupId,
        content,
        fileAttachment
      });
    }
  };

  const sendGroupTypingStatus = (groupId, isTyping) => {
    if (socket && user) {
      socket.emit('group_typing', {
        groupId,
        senderId: user._id,
        username: user.username,
        isTyping
      });
    }
  };

  const value = {
    socket,
    onlineUsers,
    messages,
    typingUsers,
    groupTypingUsers,
    sendMessage,
    sendTypingStatus,
    markMessageAsRead,
    addReaction,
    removeReaction,
    changeStatus,
    joinGroup,
    leaveGroup,
    sendGroupMessage,
    sendGroupTypingStatus,
    setMessages
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
