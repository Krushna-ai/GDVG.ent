import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SocialFeatures = ({ darkTheme, currentUser }) => {
  const [currentView, setCurrentView] = useState('feed'); // 'feed', 'following', 'followers', 'discover'
  const [activityFeed, setActivityFeed] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [socialStats, setSocialStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchSocialStats();
    if (currentView === 'feed') {
      fetchActivityFeed();
    } else if (currentView === 'followers') {
      fetchFollowers();
    } else if (currentView === 'following') {
      fetchFollowing();
    }
  }, [currentView]);

  const fetchActivityFeed = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/social/feed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityFeed(response.data.activities);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/social/followers/${currentUser.username}`);
      setFollowers(response.data.followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/social/following/${currentUser.username}`);
      setFollowing(response.data.following);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialStats = async () => {
    try {
      const response = await axios.get(`${API}/social/stats/${currentUser.username}`);
      setSocialStats(response.data);
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  };

  const handleFollow = async (username) => {
    try {
      const token = localStorage.getItem('user_token');
      await axios.post(`${API}/social/follow/${username}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh data
      fetchSocialStats();
      if (currentView === 'following') {
        fetchFollowing();
      }
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user');
    }
  };

  const handleUnfollow = async (username) => {
    try {
      const token = localStorage.getItem('user_token');
      await axios.delete(`${API}/social/unfollow/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh data
      fetchSocialStats();
      if (currentView === 'following') {
        fetchFollowing();
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      alert('Failed to unfollow user');
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      // This would be a user search endpoint - for now simulate
      // In a real implementation, you'd have a /api/users/search endpoint
      setSearchResults([]);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const ActivityCard = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'watched': return '👀';
        case 'rated': return '⭐';
        case 'reviewed': return '✍️';
        case 'added_to_list': return '📌';
        case 'followed_user': return '👥';
        default: return '📱';
      }
    };

    const getActivityText = (activity) => {
      switch (activity.activity_type) {
        case 'watched':
          return `watched ${activity.content?.title}`;
        case 'rated':
          return `rated ${activity.content?.title} ${activity.metadata?.rating}/10`;
        case 'reviewed':
          return `reviewed ${activity.content?.title}`;
        case 'added_to_list':
          return `added ${activity.content?.title} to ${activity.metadata?.list_status} list`;
        case 'followed_user':
          return `followed ${activity.metadata?.followed_username}`;
        default:
          return 'did something';
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${
        darkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            darkTheme ? 'bg-red-600' : 'bg-red-500'
          }`}>
            {activity.user?.avatar_url ? (
              <img src={activity.user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-semibold text-sm">
                {activity.user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Activity Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                {activity.user?.username}
              </span>
              {activity.user?.is_verified && (
                <svg className="h-4 w-4 text-blue-500 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              )}
              <span className="text-xl">{getActivityIcon(activity.activity_type)}</span>
              <span className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {getActivityText(activity)}
              </span>
            </div>

            {/* Content Preview */}
            {activity.content && (
              <div className="flex items-center gap-3 mt-3">
                <img
                  src={activity.content.poster_url}
                  alt={activity.content.title}
                  className="w-12 h-16 object-cover rounded"
                />
                <div>
                  <h4 className={`font-medium line-clamp-1 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {activity.content.title}
                  </h4>
                  <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.content.year} • {activity.content.content_type}
                  </div>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className={`text-xs mt-3 ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(activity.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UserCard = ({ user, showFollowButton = true, isFollowing = false }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg ${
      darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
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
          {user.followed_at && (
            <div className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
              Followed {new Date(user.followed_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      
      {showFollowButton && user.username !== currentUser?.username && (
        <button
          onClick={() => isFollowing ? handleUnfollow(user.username) : handleFollow(user.username)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isFollowing
              ? darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`animate-pulse p-4 rounded-lg ${
            darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-current opacity-20 rounded w-1/3" />
                <div className="h-3 bg-current opacity-20 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Social Stats */}
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          👥 Social
        </h2>
        {socialStats && (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                {socialStats.followers_count}
              </div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Followers
              </div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                {socialStats.following_count}
              </div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Following
              </div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                {socialStats.public_reviews}
              </div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Reviews
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'feed', label: 'Activity Feed', icon: '📱' },
          { key: 'following', label: 'Following', icon: '👥' },
          { key: 'followers', label: 'Followers', icon: '👋' },
          { key: 'discover', label: 'Discover', icon: '🔍' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCurrentView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              currentView === tab.key
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Based on Current View */}
      {currentView === 'feed' && (
        <div className="space-y-4">
          {activityFeed.length > 0 ? (
            activityFeed.map((activity, index) => (
              <ActivityCard key={index} activity={activity} />
            ))
          ) : (
            <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium mb-2">No activity yet</p>
              <p className="text-sm">Follow some users to see their activity here</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'following' && (
        <div className="space-y-4">
          {following.length > 0 ? (
            following.map((user, index) => (
              <UserCard key={index} user={user} isFollowing={true} />
            ))
          ) : (
            <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-lg font-medium mb-2">Not following anyone yet</p>
              <p className="text-sm">Discover and follow users to see their activity</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'followers' && (
        <div className="space-y-4">
          {followers.length > 0 ? (
            followers.map((user, index) => (
              <UserCard key={index} user={user} showFollowButton={false} />
            ))
          ) : (
            <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-lg font-medium mb-2">No followers yet</p>
              <p className="text-sm">Share your reviews and lists to attract followers</p>
            </div>
          )}
        </div>
      )}

      {currentView === 'discover' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Search users..."
            />
            <button
              onClick={searchUsers}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((user, index) => (
                <UserCard key={index} user={user} />
              ))}
            </div>
          )}

          {/* Suggested Users (placeholder) */}
          <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">Discover New Users</p>
            <p className="text-sm">Search for users by username to follow them</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeatures;