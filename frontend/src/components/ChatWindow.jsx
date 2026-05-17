import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebRTCContext';
import { fileAPI } from '../services/api';
import { encryptMessage, decryptMessage, getStoredKeys } from '../utils/encryption';
import axios from 'axios';
import SearchBar from './SearchBar';

const API_URL = import.meta.env.VITE_API_URL;

const ChatWindow = ({ selectedUser, messages, currentUser }) => {
  const { initiateCall } = useWebRTC();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [receiverPublicKey, setReceiverPublicKey] = useState(null);
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const { sendMessage, sendTypingStatus, typingUsers, markMessageAsRead, addReaction, removeReaction } = useSocket();

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  const filteredMessages = messages.filter(
    (msg) =>
      (msg.sender._id === currentUser._id && msg.receiver._id === selectedUser._id) ||
      (msg.sender._id === selectedUser._id && msg.receiver._id === currentUser._id)
  );

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
    if (query.trim()) {
      const results = filteredMessages.filter(msg =>
        msg.content?.toLowerCase().includes(query.toLowerCase()) ||
        msg.fileAttachment?.filename?.toLowerCase().includes(query.toLowerCase())
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
        msg.fileAttachment?.filename?.toLowerCase().includes(searchQuery)
      )
    : filteredMessages;

  // Fetch receiver's public key
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/users/${selectedUser._id}/public-key`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setReceiverPublicKey(response.data.publicKey);
      } catch (error) {
        console.error('Error fetching public key:', error);
      }
    };

    if (selectedUser) {
      fetchPublicKey();
    }
  }, [selectedUser]);

  // Decrypt messages
  useEffect(() => {
    const decryptMessages = async () => {
      const { privateKey } = getStoredKeys();
      if (!privateKey) return;

      const newDecrypted = {};

      for (const msg of filteredMessages) {
        if (msg.isEncrypted && msg.sender._id === selectedUser._id && !decryptedMessages[msg._id]) {
          try {
            const decrypted = await decryptMessage(msg.content, privateKey);
            newDecrypted[msg._id] = decrypted;
          } catch (error) {
            console.error('Error decrypting message:', error);
            newDecrypted[msg._id] = '[Decryption failed]';
          }
        }
      }

      if (Object.keys(newDecrypted).length > 0) {
        setDecryptedMessages(prev => ({ ...prev, ...newDecrypted }));
      }
    };

    decryptMessages();
  }, [filteredMessages, selectedUser._id]);

  useEffect(() => {
    scrollToBottom();

    // Mark unread messages as read
    filteredMessages.forEach((msg) => {
      if (msg.sender._id === selectedUser._id && !msg.isRead) {
        markMessageAsRead(msg._id, msg.sender._id);
      }
    });
  }, [filteredMessages, selectedUser._id, markMessageAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(selectedUser._id, true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(selectedUser._id, false);
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

    // Encrypt message if receiver has public key
    let messageContent = newMessage.trim();
    let isEncrypted = false;

    if (receiverPublicKey && messageContent) {
      try {
        messageContent = await encryptMessage(messageContent, receiverPublicKey);
        isEncrypted = true;
      } catch (error) {
        console.error('Encryption error:', error);
        // Send unencrypted if encryption fails
      }
    }

    sendMessage(selectedUser._id, messageContent, fileAttachment, isEncrypted);
    setNewMessage('');
    setSelectedFile(null);
    setIsTyping(false);
    sendTypingStatus(selectedUser._id, false);
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

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <img
          src={selectedUser.avatar || 'https://ui-avatars.com/api/?background=random'}
          alt={selectedUser.username}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800">{selectedUser.username}</h2>
          <p className="text-sm text-gray-500">
            {typingUsers[selectedUser._id] ? (
              <span className="text-purple-600">typing...</span>
            ) : (
              <span>{selectedUser.isOnline ? 'Online' : 'Offline'}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => initiateCall(selectedUser._id, 'audio')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Audio Call"
        >
          📞
        </button>
        <button
          onClick={() => initiateCall(selectedUser._id, 'video')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Video Call"
        >
          📹
        </button>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Search messages"
        >
          🔍
        </button>
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
                <div className="relative group">
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
                        {message.isEncrypted && !isSender
                          ? (decryptedMessages[message._id] || 'Decrypting...')
                          : (searchQuery ? highlightText(message.content, searchQuery) : message.content)
                        }
                      </p>
                    )}
                    <div
                      className={`flex items-center gap-1 text-xs mt-1 ${
                        isSender ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {message.isEncrypted && (
                        <span className="ml-1" title="End-to-end encrypted">
                          🔒
                        </span>
                      )}
                      {isSender && (
                        <span className="ml-1">
                          {message.isRead ? (
                            <span className="text-blue-300" title="Read">✓✓</span>
                          ) : (
                            <span title="Sent">✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reactions Display */}
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

                  {/* Reaction Button */}
                  <button
                    onClick={() => setShowReactionPicker(
                      showReactionPicker === message._id ? null : message._id
                    )}
                    className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-200 hover:bg-gray-300 rounded-full p-1 text-sm transition"
                    title="Add reaction"
                  >
                    😊
                  </button>

                  {/* Reaction Picker */}
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

export default ChatWindow;
