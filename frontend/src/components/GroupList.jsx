const GroupList = ({ groups, selectedGroup, onGroupSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {groups.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">No groups yet</div>
      ) : (
        groups.map((group) => (
          <div
            key={group._id}
            onClick={() => onGroupSelect(group)}
            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition ${
              selectedGroup?._id === group._id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                {group.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{group.name}</h3>
              <p className="text-sm text-gray-500">
                {group.members.length} members
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GroupList;
