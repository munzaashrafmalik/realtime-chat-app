// Notification Service for Browser Notifications

class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.enabled = localStorage.getItem('notificationsEnabled') !== 'false';
    this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  // Check if notifications are supported and enabled
  isSupported() {
    return 'Notification' in window;
  }

  isEnabled() {
    return this.enabled && this.permission === 'granted';
  }

  // Enable/disable notifications
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('notificationsEnabled', enabled);
  }

  // Enable/disable sound
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('soundEnabled', enabled);
  }

  // Show notification for new message
  showMessageNotification(message, isGroup = false) {
    if (!this.isEnabled()) return;

    const title = isGroup
      ? `${message.sender.username} in ${message.groupName}`
      : message.sender.username;

    let body = message.content || '';

    if (message.fileAttachment) {
      body = message.fileAttachment.mimetype.startsWith('image/')
        ? '📷 Sent an image'
        : `📎 Sent ${message.fileAttachment.filename}`;
    }

    const options = {
      body: body.substring(0, 100),
      icon: message.sender.avatar,
      badge: '/notification-badge.png',
      tag: isGroup ? `group-${message.groupId}` : `user-${message.sender._id}`,
      requireInteraction: false,
      silent: !this.soundEnabled,
      data: {
        messageId: message._id,
        senderId: message.sender._id,
        groupId: message.groupId || null
      }
    };

    try {
      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();

        // Trigger custom event to focus the chat
        window.dispatchEvent(new CustomEvent('notification-click', {
          detail: options.data
        }));
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Play sound if enabled
      if (this.soundEnabled) {
        this.playNotificationSound();
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuBzvLZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyy3ksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmUgND1as5++wXRgIPpba8sZzKQUrgc7y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJLX8st5LAUkd8fw3ZBACh');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Sound play failed:', err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Show typing notification (optional, less intrusive)
  showTypingNotification(username) {
    if (!this.isEnabled()) return;

    // Only show if window is not focused
    if (document.hasFocus()) return;

    const notification = new Notification(`${username} is typing...`, {
      silent: true,
      requireInteraction: false,
      tag: 'typing'
    });

    setTimeout(() => notification.close(), 2000);
  }
}

export default new NotificationService();
