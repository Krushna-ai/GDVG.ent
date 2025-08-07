import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PersonalAnalytics = ({ darkTheme, currentUser }) => {
  const [analytics, setAnalytics] = useState(null);
  const [viewingHistory, setViewingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'history'
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    fetchAnalytics();
    if (currentView === 'history') {
      fetchViewingHistory();
    }
  }, [currentView, historyPage]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViewingHistory = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/analytics/history?page=${historyPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewingHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching viewing history:', error);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${mins}m`;
    }
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const StatsCard = ({ title, value, subtitle, icon, color = 'red' }) => {
    const colorClasses = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
    };

    return (
      <div className={`p-6 rounded-xl transition-transform hover:scale-105 ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <div className="text-2xl">{icon}</div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </div>
            <div className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {subtitle}
            </div>
          </div>
        </div>
        <h3 className={`font-semibold ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
          {title}
        </h3>
      </div>
    );
  };

  const AchievementBadge = ({ achievement }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      darkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
    }`}>
      <span className="text-2xl">{achievement.split(' ')[0]}</span>
      <span className={`font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
        {achievement.substring(achievement.indexOf(' ') + 1)}
      </span>
    </div>
  );

  const MonthlyChart = () => {
    if (!analytics?.monthly_stats) return null;

    const months = Object.values(analytics.monthly_stats).reverse();
    const maxContent = Math.max(...months.map(m => m.content_count));
    const maxTime = Math.max(...months.map(m => m.viewing_time));

    return (
      <div className={`p-6 rounded-xl ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          📈 Monthly Activity
        </h3>
        <div className="space-y-4">
          {months.map((month, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  {month.month_name}
                </span>
                <div className="flex items-center gap-4">
                  <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {month.content_count} shows
                  </span>
                  <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDuration(month.viewing_time)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className={`flex-1 h-2 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${maxContent > 0 ? (month.content_count / maxContent) * 100 : 0}%` }}
                  />
                </div>
                <div className={`flex-1 h-2 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${maxTime > 0 ? (month.viewing_time / maxTime) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Content Count
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className={`text-xs ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Viewing Time
            </span>
          </div>
        </div>
      </div>
    );
  };

  const TopRatedContent = () => {
    if (!analytics?.top_rated_content?.length) return null;

    return (
      <div className={`p-6 rounded-xl ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          ⭐ Your Top Rated Content
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analytics.top_rated_content.slice(0, 6).map((item, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
              darkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            }`}>
              <img
                src={item.poster_url}
                alt={item.title}
                className="w-12 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium line-clamp-1 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.year}
                  </span>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                    <span className={`text-sm font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.rating}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ViewingHistoryList = () => (
    <div className="space-y-4">
      {viewingHistory.map((entry, index) => (
        <div key={index} className={`flex items-center gap-4 p-4 rounded-lg ${
          darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <img
            src={entry.content.poster_url}
            alt={entry.content.title}
            className="w-12 h-16 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold line-clamp-1 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              {entry.content.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {entry.content.year} • {entry.content.content_type}
              </span>
              {entry.viewing_duration && (
                <>
                  <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                  <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatDuration(entry.viewing_duration)}
                  </span>
                </>
              )}
            </div>
            <div className={`text-xs mt-1 ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(entry.viewed_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`animate-pulse p-6 rounded-xl ${
              darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
            }`}>
              <div className="h-16 bg-current opacity-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
        <p className="text-lg">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <h2 className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          📊 Personal Analytics
        </h2>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'history'
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {currentView === 'dashboard' ? (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Content Watched"
              value={analytics.total_content_watched}
              subtitle="unique titles"
              icon="🎬"
              color="red"
            />
            <StatsCard
              title="Total Watch Time"
              value={formatDuration(analytics.total_viewing_time)}
              subtitle="all time"
              icon="⏰"
              color="blue"
            />
            <StatsCard
              title="Completion Rate"
              value={`${analytics.completion_rate}%`}
              subtitle="finished shows"
              icon="✅"
              color="green"
            />
            <StatsCard
              title="Viewing Streak"
              value={analytics.viewing_streak}
              subtitle="days active"
              icon="🔥"
              color="yellow"
            />
          </div>

          {/* Achievements */}
          {analytics.achievements.length > 0 && (
            <div className={`p-6 rounded-xl ${
              darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                🏆 Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.achievements.map((achievement, index) => (
                  <AchievementBadge key={index} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {/* Favorite Genres & Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.favorite_genres.length > 0 && (
              <div className={`p-6 rounded-xl ${
                darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  🎭 Favorite Genres
                </h3>
                <div className="space-y-3">
                  {analytics.favorite_genres.map((genre, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                        {genre.genre.charAt(0).toUpperCase() + genre.genre.slice(1).replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 w-24 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${(genre.count / analytics.favorite_genres[0].count) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium w-6 text-right ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {genre.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.favorite_countries.length > 0 && (
              <div className={`p-6 rounded-xl ${
                darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  🌍 Favorite Countries
                </h3>
                <div className="space-y-3">
                  {analytics.favorite_countries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                        {country.country}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 w-24 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(country.count / analytics.favorite_countries[0].count) * 100}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium w-6 text-right ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {country.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Chart */}
          <MonthlyChart />

          {/* Top Rated Content */}
          <TopRatedContent />
        </>
      ) : (
        /* Viewing History */
        <div>
          <h3 className={`text-2xl font-bold mb-6 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            📺 Viewing History
          </h3>
          <ViewingHistoryList />
        </div>
      )}
    </div>
  );
};

export default PersonalAnalytics;