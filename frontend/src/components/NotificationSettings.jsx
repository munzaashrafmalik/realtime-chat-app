import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationSettings = ({ isOpen, onClose }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationService.enabled);
  const [soundEnabled, setSoundEnabled] = useState(notificationService.soundEnabled);
  const [permission, setPermission] = useState(notificationService.permission);

  useEffect(() => {
    if (isOpen) {
      setNotificationsEnabled(notificationService.enabled);
      setSoundEnabled(notificationService.soundEnabled);
      setPermission(notificationService.permission);
    }
  }, [isOpen]);

  const handleEnableNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await notificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');

      if (!granted) {
        alert('Please enable notifications in your browser settings');
        return;
      }
    }

    notificationService.setEnabled(true);
    setNotificationsEnabled(true);
  };

  const handleDisableNotifications = () => {
    notificationService.setEnabled(false);
    setNotificationsEnabled(false);
  };

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    notificationService.setSoundEnabled(newValue);
    setSoundEnabled(newValue);
  };

  const handleTestNotification = () => {
    if (notificationService.isEnabled()) {
      notificationService.showMessageNotification({
        sender: {
          _id: 'test',
          username: 'Test User',
          avatar: 'https://ui-avatars.com/api/?name=Test'
        },
        content: 'This is a test notification!',
        _id: 'test-msg'
      }, false);
    } else {
      alert('Please enable notifications first');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Browser Support Check */}
          {!notificationService.isSupported() && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Your browser does not support notifications
            </div>
          )}

          {/* Permission Status */}
          {permission === 'denied' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Notifications are blocked. Please enable them in your browser settings.
            </div>
          )}

          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Desktop Notifications</h3>
              <p className="text-sm text-gray-500">Get notified of new messages</p>
            </div>
            <button
              onClick={notificationsEnabled ? handleDisableNotifications : handleEnableNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                notificationsEnabled ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-800">Notification Sound</h3>
              <p className="text-sm text-gray-500">Play sound for new messages</p>
            </div>
            <button
              onClick={handleToggleSound}
              disabled={!notificationsEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                soundEnabled && notificationsEnabled ? 'bg-purple-600' : 'bg-gray-300'
              } ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Test Notification */}
          <button
            onClick={handleTestNotification}
            disabled={!notificationsEnabled}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Notification
          </button>

          {/* Info */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            💡 Notifications only appear when the window is not focused
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
