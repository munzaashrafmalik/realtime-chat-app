import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, currentPage, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/admin/users?page=${currentPage}&limit=20&search=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert(error.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/ban`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('User banned successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      alert(error.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/unban`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('User unbanned successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert(error.response?.data?.message || 'Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!confirm('Are you sure you want to make this user an admin?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/make-admin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('User promoted to admin successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error making admin:', error);
      alert(error.response?.data?.message || 'Failed to make user admin');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!confirm('Are you sure you want to remove admin privileges from this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/users/${userId}/remove-admin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Admin privileges removed successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      alert(error.response?.data?.message || 'Failed to remove admin privileges');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <a
              href="/chat"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Back to Chat
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="h-10 w-10 rounded-full"
                                  />
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.username}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.isBanned ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    Banned
                                  </span>
                                ) : user.isOnline ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Online
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    Offline
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.isAdmin ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    User
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {user.isBanned ? (
                                    <button
                                      onClick={() => handleUnbanUser(user._id)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Unban
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBanUser(user._id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Ban
                                    </button>
                                  )}
                                  {user.isAdmin ? (
                                    <button
                                      onClick={() => handleRemoveAdmin(user._id)}
                                      className="text-orange-600 hover:text-orange-900"
                                    >
                                      Remove Admin
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleMakeAdmin(user._id)}
                                      className="text-purple-600 hover:text-purple-900"
                                    >
                                      Make Admin
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6 space-x-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : analytics ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">Total Users</h3>
                        <p className="text-3xl font-bold text-blue-900">{analytics.totalUsers}</p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-green-600 mb-2">Active Users</h3>
                        <p className="text-3xl font-bold text-green-900">{analytics.activeUsers}</p>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-purple-600 mb-2">Total Messages</h3>
                        <p className="text-3xl font-bold text-purple-900">{analytics.totalMessages}</p>
                      </div>
                      <div className="bg-red-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-red-600 mb-2">Banned Users</h3>
                        <p className="text-3xl font-bold text-red-900">{analytics.bannedUsers}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-yellow-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">New Users (7 days)</h3>
                        <p className="text-3xl font-bold text-yellow-900">{analytics.newUsers}</p>
                      </div>
                      <div className="bg-indigo-50 p-6 rounded-lg">
                        <h3 className="text-sm font-medium text-indigo-600 mb-2">Messages Today</h3>
                        <p className="text-3xl font-bold text-indigo-900">{analytics.messagesToday}</p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Active Users</h3>
                      <div className="space-y-4">
                        {analytics.topUsers.map((user, index) => (
                          <div key={user._id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-lg font-bold text-gray-400 w-8">#{index + 1}</span>
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="h-10 w-10 rounded-full ml-4"
                              />
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-purple-600">
                              {user.messageCount} messages
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Message Stats (Last 7 Days)</h3>
                      <div className="space-y-2">
                        {analytics.dailyStats.map((stat) => (
                          <div key={stat._id} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{stat._id}</span>
                            <div className="flex items-center">
                              <div className="w-64 bg-gray-200 rounded-full h-2 mr-4">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{
                                    width: `${(stat.count / Math.max(...analytics.dailyStats.map(s => s.count))) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                                {stat.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
