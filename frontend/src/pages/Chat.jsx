import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { userAPI, messageAPI, groupAPI } from '../services/api';
import UserList from '../components/UserList';
import GroupList from '../components/GroupList';
import ChatWindow from '../components/ChatWindow';
import GroupChatWindow from '../components/GroupChatWindow';
import CreateGroupModal from '../components/CreateGroupModal';
import NotificationSettings from '../components/NotificationSettings';
import IncomingCallModal from '../components/IncomingCallModal';
import ActiveCallWindow from '../components/ActiveCallWindow';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'groups'
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('Available');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { user, logout } = useAuth();
  const { onlineUsers, messages, setMessages, socket, changeStatus } = useSocket();
  const {
    localStream,
    remoteStream,
    callState,
    callType,
    currentCall,
    incomingCall,
    isMuted,
    isVideoOff,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useWebRTC();
  const navigate = useNavigate();

  const statuses = [
    { name: 'Available', color: 'bg-green-500', icon: '🟢' },
    { name: 'Away', color: 'bg-yellow-500', icon: '🟡' },
    { name: 'Busy', color: 'bg-red-500', icon: '🔴' },
    { name: 'Do Not Disturb', color: 'bg-gray-500', icon: '⛔' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchGroups();

    if (socket) {
      socket.on('user_status_updated', ({ userId, status }) => {
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, status } : u
        ));

        if (selectedUser?._id === userId) {
          setSelectedUser(prev => ({ ...prev, status }));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('user_status_updated');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (selectedUser && activeTab === 'users') {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser, activeTab]);

  useEffect(() => {
    if (selectedGroup && activeTab === 'groups') {
      fetchGroupMessages(selectedGroup._id);
    }
  }, [selectedGroup, activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await messageAPI.getMessages(userId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupAPI.getGroups();
      setGroups(response.data);
      setGroupsLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroupsLoading(false);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await groupAPI.getGroupMessages(groupId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setActiveTab('users');
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    setActiveTab('groups');
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
    setSelectedGroup(newGroup);
    setSelectedUser(null);
    setActiveTab('groups');
  };

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    changeStatus(status);
    setShowStatusMenu(false);
  };

  const getCurrentStatusInfo = () => {
    return statuses.find(s => s.name === currentStatus) || statuses[0];
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-dark">
      <header className="glass-dark shadow-premium px-6 py-4 flex justify-between items-center border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-premium flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            SecureChat
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&background=667eea&color=fff`}
                alt={user?.username}
                className="w-10 h-10 rounded-full border-2 border-accent-purple/50 shadow-glow"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 ${getCurrentStatusInfo().color} border-2 border-dark-900 rounded-full`}></span>
            </div>
            <div>
              <span className="font-semibold text-white block">{user?.username}</span>
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="text-xs text-dark-400 hover:text-dark-200 flex items-center gap-1 transition-colors"
                >
                  <span>{getCurrentStatusInfo().icon}</span>
                  <span>{currentStatus}</span>
                  <span>▼</span>
                </button>

                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-1 glass-dark border border-dark-700 rounded-lg shadow-premium py-1 z-50 min-w-[180px]">
                    {statuses.map((status) => (
                      <button
                        key={status.name}
                        onClick={() => handleStatusChange(status.name)}
                        className={`w-full px-4 py-2 text-left hover:bg-dark-700/50 flex items-center gap-2 transition-colors ${
                          currentStatus === status.name ? 'bg-accent-purple/20' : ''
                        }`}
                      >
                        <span className={`w-3 h-3 ${status.color} rounded-full`}></span>
                        <span className="text-sm text-white">{status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors text-2xl"
            title="Notification Settings"
          >
            🔔
          </button>
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="btn-premium px-4 py-2 rounded-lg text-sm font-medium"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 glass-dark border-r border-dark-700/50 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-dark-700/50">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'users'
                  ? 'text-white border-b-2 border-accent-purple bg-accent-purple/10'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/30'
              }`}
            >
              💬 Users
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                activeTab === 'groups'
                  ? 'text-white border-b-2 border-accent-purple bg-accent-purple/10'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/30'
              }`}
            >
              👥 Groups
            </button>
          </div>

          {/* Create Group Button */}
          {activeTab === 'groups' && (
            <div className="p-3 border-b border-dark-700/50">
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="w-full btn-premium py-2 rounded-lg text-sm font-semibold shadow-lg"
              >
                + Create Group
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'users' ? (
              <UserList
                users={users}
                onlineUsers={onlineUsers}
                selectedUser={selectedUser}
                onUserSelect={handleUserSelect}
                loading={loading}
              />
            ) : (
              <GroupList
                groups={groups}
                selectedGroup={selectedGroup}
                onGroupSelect={handleGroupSelect}
                loading={groupsLoading}
              />
            )}
          </div>
        </div>

        {selectedUser ? (
          <ChatWindow
            selectedUser={selectedUser}
            messages={messages}
            currentUser={user}
          />
        ) : selectedGroup ? (
          <GroupChatWindow
            selectedGroup={selectedGroup}
            messages={messages}
            currentUser={user}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-premium mb-6 shadow-glow">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to SecureChat
              </h2>
              <p className="text-dark-400 max-w-md">
                {activeTab === 'users'
                  ? 'Select a user from the list to start a secure conversation'
                  : 'Select a group or create a new one to start chatting'}
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-dark-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />

      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      <IncomingCallModal
        isOpen={!!incomingCall}
        caller={incomingCall?.caller}
        callType={incomingCall?.type}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {(callState === 'active' || callState === 'calling') && (
        <ActiveCallWindow
          localStream={localStream}
          remoteStream={remoteStream}
          callType={callType}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          callDuration={callDuration}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
          remotePeerName={
            currentCall?.receiverId
              ? users.find(u => u._id === currentCall.receiverId)?.username || selectedUser?.username
              : 'Unknown User'
          }
        />
      )}
    </div>
  );
};

export default Chat;
