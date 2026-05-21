import { useState, useEffect } from 'react';

const useUnreadMessages = (messages, currentUser, selectedUser) => {
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!currentUser || !messages) return;

    const counts = {};

    messages.forEach(msg => {
      // Count unread messages where current user is receiver
      if (msg.receiver?._id === currentUser._id && !msg.isRead && msg.sender?._id) {
        const senderId = msg.sender._id;
        counts[senderId] = (counts[senderId] || 0) + 1;
      }
    });

    setUnreadCounts(counts);
  }, [messages, currentUser]);

  // Clear unread count for selected user
  useEffect(() => {
    if (selectedUser) {
      setUnreadCounts(prev => ({
        ...prev,
        [selectedUser._id]: 0
      }));
    }
  }, [selectedUser]);

  return unreadCounts;
};

export default useUnreadMessages;
