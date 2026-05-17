import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { fileAPI } from '../services/api';
import SearchBar from './SearchBar';

const GroupChatWindow = ({ selectedGroup, messages, currentUser }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const { sendGroupMessage, sendGroupTypingStatus, groupTypingUsers, joinGroup, addReaction, removeReaction } = useSocket();
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  const filteredMessages = messages.filter(msg => msg.groupId === selectedGroup._id);

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
    if (query.trim()) {
      const results = filteredMessages.filter(msg =>
        msg.content?.toLowerCase().includes(query.toLowerCase()) ||
        msg.fileAttachment?.filename?.toLowerCase().includes(query.toLowerCase()) ||
        msg.sender?.username?.toLowerCase().includes(query.toLowerCase())
      );
      return results;
    }
    return [];
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-300">{part}</mark>
      ) : (
        part
      )
    );
  };

  const displayedMessages = searchQuery
    ? filteredMessages.filter(msg =>
        msg.content?.toLowerCase().includes(searchQuery) ||
        msg.fileAttachment?.filename?.toLowerCase().includes(searchQuery) ||
        msg.sender?.username?.toLowerCase().includes(searchQuery)
      )
    : filteredMessages;

  useEffect(() => {
    if (selectedGroup) {
      joinGroup(selectedGroup._id);
    }
  }, [selectedGroup, joinGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendGroupTypingStatus(selectedGroup._id, true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendGroupTypingStatus(selectedGroup._id, false);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) {
      return;
    }

    let fileAttachment = null;

    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fileAPI.uploadFile(formData);
        fileAttachment = response.data;
      } catch (error) {
        console.error('File upload error:', error);
        alert('Failed to upload file. Please try again.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    sendGroupMessage(selectedGroup._id, newMessage.trim(), fileAttachment);
    setNewMessage('');
    setSelectedFile(null);
    setIsTyping(false);
    sendGroupTypingStatus(selectedGroup._id, false);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReaction = (messageId, emoji) => {
    const message = filteredMessages.find(m => m._id === messageId);
    const userReaction = message?.reactions?.find(
      r => r.userId === currentUser._id && r.emoji === emoji
    );

    if (userReaction) {
      removeReaction(messageId, emoji);
    } else {
      addReaction(messageId, emoji);
    }
    setShowReactionPicker(null);
  };

  const getReactionCounts = (reactions) => {
    if (!reactions || reactions.length === 0) return {};
    const counts = {};
    reactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  };

  const hasUserReacted = (reactions, emoji) => {
    return reactions?.some(r => r.userId === currentUser._id && r.emoji === emoji);
  };

  const getTypingText = () => {
    const typingUsernames = Object.entries(groupTypingUsers)
      .filter(([_, username]) => username)
      .map(([_, username]) => username);

    if (typingUsernames.length === 0) return null;
    if (typingUsernames.length === 1) return `${typingUsernames[0]} is typing...`;
    if (typingUsernames.length === 2) return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`;
    return `${typingUsernames.length} people are typing...`;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="font-semibold text-gray-800 text-lg">{selectedGroup.name}</h2>
            <p className="text-sm text-gray-500">
              {getTypingText() || `${selectedGroup.members.length} members`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Search messages"
            >
              🔍
            </button>
            {selectedGroup.members.slice(0, 5).map((member) => (
              <img
                key={member._id}
                src={member.avatar}
                alt={member.username}
                className="w-8 h-8 rounded-full border-2 border-white"
                title={member.username}
              />
            ))}
            {selectedGroup.members.length > 5 && (
              <span className="text-sm text-gray-500">+{selectedGroup.members.length - 5}</span>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <SearchBar
          onSearch={handleSearch}
          onClose={() => {
            setShowSearch(false);
            setSearchQuery('');
          }}
          totalMessages={filteredMessages.length}
        />
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {displayedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              {searchQuery ? 'No messages found' : 'No messages yet. Start the conversation!'}
            </p>
          </div>
        ) : (
          displayedMessages.map((message) => {
            const isSender = message.sender._id === currentUser._id;
            const reactionCounts = getReactionCounts(message.reactions);

            return (
              <div
                key={message._id}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div className="relative group max-w-xs lg:max-w-md">
                  {!isSender && (
                    <div className="flex items-center gap-2 mb-1">
                      <img
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs font-semibold text-gray-600">
                        {message.sender.username}
                      </span>
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isSender
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {message.fileAttachment && (
                      <div className="mb-2">
                        {message.fileAttachment.mimetype.startsWith('image/') ? (
                          <img
                            src={message.fileAttachment.url}
                            alt={message.fileAttachment.filename}
                            className="rounded max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(message.fileAttachment.url, '_blank')}
                          />
                        ) : (
                          <a
                            href={message.fileAttachment.url}
                            download={message.fileAttachment.filename}
                            className={`flex items-center gap-2 p-2 rounded ${
                              isSender ? 'bg-purple-700' : 'bg-gray-100'
                            } hover:opacity-80`}
                          >
                            <span className="text-2xl">{getFileIcon(message.fileAttachment.mimetype)}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isSender ? 'text-white' : 'text-gray-800'}`}>
                                {message.fileAttachment.filename}
                              </p>
                              <p className={`text-xs ${isSender ? 'text-purple-200' : 'text-gray-500'}`}>
                                {formatFileSize(message.fileAttachment.size)}
                              </p>
                            </div>
                            <span className={`text-sm ${isSender ? 'text-white' : 'text-gray-600'}`}>⬇</span>
                          </a>
                        )}
                      </div>
                    )}
                    {message.content && (
                      <p className="break-words">
                        {searchQuery ? highlightText(message.content, searchQuery) : message.content}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isSender ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>

                  {Object.keys(reactionCounts).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message._id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                            hasUserReacted(message.reactions, emoji)
                              ? 'bg-purple-100 border-2 border-purple-500'
                              : 'bg-gray-100 border border-gray-300'
                          } hover:scale-110 transition`}
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-700">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowReactionPicker(
                      showReactionPicker === message._id ? null : message._id
                    )}
                    className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-200 hover:bg-gray-300 rounded-full p-1 text-sm transition"
                    title="Add reaction"
                  >
                    😊
                  </button>

                  {showReactionPicker === message._id && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-2 z-10">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(message._id, emoji)}
                          className={`text-2xl hover:scale-125 transition ${
                            hasUserReacted(message.reactions, emoji) ? 'scale-110' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={removeSelectedFile}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
            title="Attach file"
          >
            📎
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || uploading}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupChatWindow;
