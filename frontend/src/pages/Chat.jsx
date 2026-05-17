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
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-600">Real-time Chat</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar || 'https://ui-avatars.com/api/?background=random'}
                alt={user?.username}
                className="w-10 h-10 rounded-full"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 ${getCurrentStatusInfo().color} border-2 border-white rounded-full`}></span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 block">{user?.username}</span>
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <span>{getCurrentStatusInfo().icon}</span>
                  <span>{currentStatus}</span>
                  <span>▼</span>
                </button>

                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                    {statuses.map((status) => (
                      <button
                        key={status.name}
                        onClick={() => handleStatusChange(status.name)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                          currentStatus === status.name ? 'bg-purple-50' : ''
                        }`}
                      >
                        <span className={`w-3 h-3 ${status.color} rounded-full`}></span>
                        <span className="text-sm">{status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Notification Settings"
          >
            🔔
          </button>
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === 'users'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-3 text-sm font-semibold ${
                activeTab === 'groups'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Groups
            </button>
          </div>

          {/* Create Group Button */}
          {activeTab === 'groups' && (
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
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
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Welcome to Real-time Chat
              </h2>
              <p className="text-gray-500">
                {activeTab === 'users'
                  ? 'Select a user to start chatting'
                  : 'Select a group or create a new one'}
              </p>
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
