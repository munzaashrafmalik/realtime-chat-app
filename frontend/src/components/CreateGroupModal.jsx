import { useState, useEffect } from 'react';
import { userAPI, groupAPI } from '../services/api';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setLoading(true);

    try {
      const response = await groupAPI.createGroup({
        name: groupName,
        memberIds: selectedUsers
      });

      onGroupCreated(response.data);
      setGroupName('');
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-dark rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-dark-700 shadow-premium animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg mb-4 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-dark-200 text-sm font-semibold mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg focus:outline-none focus:border-accent-purple text-white placeholder-dark-500 transition-all"
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          <div className="mb-4">
            <label className="block text-dark-200 text-sm font-semibold mb-2">
              Select Members ({selectedUsers.length})
            </label>
            <div className="border border-dark-700 rounded-lg max-h-60 overflow-y-auto bg-dark-800/30">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserToggle(user._id)}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    selectedUsers.includes(user._id)
                      ? 'bg-accent-purple/20 border-l-4 border-accent-purple'
                      : 'hover:bg-dark-700/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => {}}
                    className="w-4 h-4 accent-accent-purple"
                  />
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full border-2 border-dark-700"
                  />
                  <span className="font-medium text-white">{user.username}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-dark-700 rounded-lg hover:bg-dark-700/50 text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
