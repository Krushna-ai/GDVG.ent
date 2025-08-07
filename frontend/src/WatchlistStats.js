import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WatchlistStats = ({ darkTheme }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/watchlist/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching watchlist stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    want_to_watch: { label: 'Want to Watch', icon: '📌', color: 'blue' },
    watching: { label: 'Watching', icon: '▶️', color: 'green' },
    completed: { label: 'Completed', icon: '✅', color: 'purple' },
    dropped: { label: 'Dropped', icon: '❌', color: 'red' }
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-xl ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-6 rounded w-48 ${darkTheme ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-16 rounded ${darkTheme ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={`p-6 rounded-xl ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          📊 Watchlist Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusLabels).map(([key, config]) => {
            const count = stats.status_counts[key] || 0;
            return (
              <div
                key={key}
                className={`p-4 rounded-lg text-center transition-transform hover:scale-105 ${
                  colorClasses[config.color]
                }`}
              >
                <div className="text-2xl mb-2">{config.icon}</div>
                <div className="text-2xl font-bold mb-1">{count}</div>
                <div className="text-sm font-medium">{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Total Count */}
        <div className={`text-center p-4 rounded-lg ${
          darkTheme 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            {stats.total_content}
          </div>
          <div className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Content Tracked
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <div className={`p-6 rounded-xl ${
          darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            🕒 Recent Activity
          </h3>
          
          <div className="space-y-3">
            {stats.recent_activity.slice(0, 5).map((item, index) => {
              const statusConfig = statusLabels[item.status];
              const timeSince = new Date(item.updated_date);
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    darkTheme 
                      ? 'hover:bg-gray-800 border border-gray-800' 
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {/* Content Poster */}
                  <div className="flex-shrink-0 w-12 h-16 overflow-hidden rounded">
                    <img
                      src={item.content.poster_url}
                      alt={item.content.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content Info */}
                  <div className="flex-grow min-w-0">
                    <h4 className={`font-semibold line-clamp-1 ${
                      darkTheme ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.content.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        colorClasses[statusConfig.color]
                      }`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                      {item.progress && item.total_episodes && (
                        <span className={`text-xs ${
                          darkTheme ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.progress}/{item.total_episodes} eps
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className={`flex-shrink-0 text-xs ${
                    darkTheme ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {timeSince.toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Insights */}
      {stats.status_counts.watching > 0 && (
        <div className={`p-6 rounded-xl ${
          darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            📈 Progress Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completion Rate */}
            <div className={`p-4 rounded-lg text-center ${
              darkTheme 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`text-2xl font-bold ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>
                {stats.total_content > 0 
                  ? Math.round((stats.status_counts.completed / stats.total_content) * 100)
                  : 0}%
              </div>
              <div className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Completion Rate
              </div>
            </div>

            {/* Active Watching */}
            <div className={`p-4 rounded-lg text-center ${
              darkTheme 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className={`text-2xl font-bold ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.status_counts.watching}
              </div>
              <div className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Currently Watching
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistStats;