const UserList = ({ users, onlineUsers, selectedUser, onUserSelect, loading }) => {
  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const getStatusColor = (status) => {
    const statusColors = {
      'Available': 'bg-green-500',
      'Away': 'bg-yellow-500',
      'Busy': 'bg-red-500',
      'Do Not Disturb': 'bg-gray-500'
    };
    return statusColors[status] || 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-dark-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-dark-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-dark-700/50">
        <h2 className="text-lg font-semibold text-white">Messages</h2>
        <p className="text-sm text-dark-400">{users.length} users available</p>
      </div>

      <div>
        {users.length === 0 ? (
          <div className="p-4 text-center text-dark-400">No users found</div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              onClick={() => onUserSelect(user)}
              className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
                selectedUser?._id === user._id
                  ? 'bg-accent-purple/20 border-l-4 border-accent-purple shadow-inner-glow'
                  : 'hover:bg-dark-700/30'
              }`}
            >
              <div className="relative">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff`}
                  alt={user.username}
                  className="w-12 h-12 rounded-full border-2 border-dark-700"
                />
                {isUserOnline(user._id) && (
                  <span className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} border-2 border-dark-900 rounded-full shadow-glow`}></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{user.username}</h3>
                <p className="text-sm text-dark-400">
                  {isUserOnline(user._id) ? (
                    <span className="text-green-400">{user.status || 'Available'}</span>
                  ) : (
                    <span>Offline</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;
