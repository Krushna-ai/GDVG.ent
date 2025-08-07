import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SocialInteractions = ({ darkTheme }) => {
  const [notifications, setNotifications] = useState([]);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('notifications'); // 'notifications', 'trending'

  useEffect(() => {
    if (currentView === 'notifications') {
      fetchNotifications();
    } else if (currentView === 'trending') {
      fetchTrendingUsers();
    }
  }, [currentView]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/social/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/social/trending-users`);
      setTrendingUsers(response.data.users); // Updated to match new API structure
    } catch (error) {
      console.error('Error fetching trending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (username) => {
    try {
      const token = localStorage.getItem('user_token');
      await axios.post(`${API}/social/follow/${username}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh trending users to update follow status
      if (currentView === 'trending') {
        fetchTrendingUsers();
      }
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user');
    }
  };

  const NotificationCard = ({ notification }) => {
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'new_follower': return '👥';
        case 'review_liked': return '❤️';
        case 'review_commented': return '💬';
        case 'mentioned': return '📢';
        default: return '🔔';
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${
        darkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            darkTheme ? 'bg-red-600' : 'bg-red-500'
          }`}>
            {notification.user?.avatar_url ? (
              <img src={notification.user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-semibold">
                {notification.user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Notification Content */}
            <div className="flex items-start gap-2 mb-2">
              <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1">
                <p className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {notification.user?.username}
                  </span>
                  {notification.user?.is_verified && (
                    <svg className="inline h-4 w-4 ml-1 text-blue-500 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                  {' '}
                  {notification.message?.replace(notification.user?.username, '') || 'interacted with your content'}
                </p>
                
                {/* Content Preview */}
                {notification.content && (
                  <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <img
                      src={notification.content.poster_url}
                      alt={notification.content.title}
                      className="w-10 h-12 object-cover rounded"
                    />
                    <div>
                      <h4 className={`font-medium text-sm ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                        {notification.content.title}
                      </h4>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(notification.created_at).toRelativeTimeString?.() || 
               new Date(notification.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TrendingUserCard = ({ user, rank }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg ${
      darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rank <= 3 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
            : darkTheme
              ? 'bg-gray-800 text-gray-300'
              : 'bg-gray-200 text-gray-700'
        }`}>
          #{rank}
        </div>

        {/* User Info */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          darkTheme ? 'bg-red-600' : 'bg-red-500'
        }`}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-white font-semibold">
              {user.username?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              {user.username}
            </span>
            {user.is_verified && (
              <svg className="h-4 w-4 text-blue-500 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {user.followers_count} followers
            </span>
            <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {user.reviews_count} reviews
            </span>
            <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {user.recent_activities_count} recent activities
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => handleFollow(user.username)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Follow
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🔔 Social Activity
        </h2>
        
        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('notifications')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'notifications'
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setCurrentView('trending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'trending'
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`animate-pulse p-4 rounded-lg ${
              darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-current opacity-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-current opacity-20 rounded w-3/4" />
                  <div className="h-3 bg-current opacity-20 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentView === 'notifications' ? (
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <NotificationCard key={index} notification={notification} />
            ))
          ) : (
            <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a9 9 0 11-12.73 0L7 17h5m-3 4v-4m6 4v-4" />
              </svg>
              <p className="text-lg font-medium mb-2">No notifications yet</p>
              <p className="text-sm">Social activities will appear here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {trendingUsers.length > 0 ? (
            <div>
              <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                🔥 Trending Users This Week
              </h3>
              {trendingUsers.map((user, index) => (
                <TrendingUserCard key={user.username} user={user} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-lg font-medium mb-2">No trending data yet</p>
              <p className="text-sm">Check back later for trending users</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialInteractions;