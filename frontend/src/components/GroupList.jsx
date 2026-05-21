const GroupList = ({ groups, selectedGroup, onGroupSelect, loading }) => {
  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
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
      {groups.length === 0 ? (
        <div className="p-4 text-center text-dark-400 text-sm">No groups yet</div>
      ) : (
        groups.map((group) => (
          <div
            key={group._id}
            onClick={() => onGroupSelect(group)}
            className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${
              selectedGroup?._id === group._id
                ? 'bg-accent-purple/20 border-l-4 border-accent-purple shadow-inner-glow'
                : 'hover:bg-dark-700/30'
            }`}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-premium rounded-full flex items-center justify-center text-white font-bold shadow-glow">
                {group.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{group.name}</h3>
              <p className="text-sm text-dark-400">
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
