import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserStats = ({ darkTheme, currentUser }) => {
  const [stats, setStats] = useState({
    totalWatched: 0,
    totalHours: 0,
    favoriteGenres: [],
    recentActivity: [],
    monthlyProgress: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, we'll use mock data since we don't have watchlist functionality yet
    // This will be replaced with real API calls in later days
    generateMockStats();
  }, [currentUser]);

  const generateMockStats = () => {
    // Mock data to show the stats UI
    const mockStats = {
      totalWatched: 47,
      totalHours: 156,
      favoriteGenres: [
        { name: 'Drama', count: 18 },
        { name: 'Romance', count: 12 },
        { name: 'Thriller', count: 8 },
        { name: 'Comedy', count: 6 },
        { name: 'Action', count: 3 }
      ],
      recentActivity: [
        { title: 'Squid Game', action: 'completed', date: '2 days ago' },
        { title: 'Your Name', action: 'rated 9.5', date: '1 week ago' },
        { title: 'Parasite', action: 'added to watchlist', date: '2 weeks ago' }
      ],
      monthlyProgress: [
        { month: 'Jan', completed: 8 },
        { month: 'Feb', completed: 12 },
        { month: 'Mar', completed: 15 },
        { month: 'Apr', completed: 12 }
      ]
    };

    setStats(mockStats);
    setLoading(false);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'red' }) => (
    <div className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
      darkTheme 
        ? 'bg-gray-900 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </p>
          <p className={`text-sm font-medium ${
            darkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${
              darkTheme ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`animate-pulse p-6 rounded-xl ${
            darkTheme ? 'bg-gray-900' : 'bg-gray-200'
          }`}>
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold mb-2 ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Your Entertainment Stats
        </h2>
        <p className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Track your viewing progress and discover your entertainment patterns
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Content Watched"
          value={stats.totalWatched}
          subtitle="Across all platforms"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a1 1 0 011-1h4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8H5z" />
            </svg>
          }
        />

        <StatCard
          title="Hours Watched"
          value={stats.totalHours}
          subtitle="This year"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="blue"
        />

        <StatCard
          title="Favorite Genre"
          value={stats.favoriteGenres[0]?.name || 'Drama'}
          subtitle={`${stats.favoriteGenres[0]?.count || 0} titles`}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          color="green"
        />

        <StatCard
          title="This Month"
          value={stats.monthlyProgress[stats.monthlyProgress.length - 1]?.completed || 0}
          subtitle="Completed titles"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="purple"
        />
      </div>

      {/* Genre Distribution */}
      <div className={`p-6 rounded-xl border ${
        darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Genre Preferences
        </h3>
        
        <div className="space-y-4">
          {stats.favoriteGenres.map((genre, index) => (
            <div key={genre.name}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {genre.name}
                </span>
                <span className={`text-sm ${
                  darkTheme ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {genre.count} titles
                </span>
              </div>
              <div className={`w-full rounded-full h-2 ${
                darkTheme ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="bg-gradient-to-r from-red-600 to-red-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(genre.count / stats.favoriteGenres[0].count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`p-6 rounded-xl border ${
        darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Recent Activity
        </h3>
        
        <div className="space-y-4">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className={`flex items-center p-4 rounded-lg ${
              darkTheme ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                activity.action.includes('completed') ? 'bg-green-100 text-green-600' :
                activity.action.includes('rated') ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {activity.action.includes('completed') ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : activity.action.includes('rated') ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  darkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {activity.title}
                </p>
                <p className={`text-sm ${
                  darkTheme ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {activity.action} • {activity.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Progress Chart */}
      <div className={`p-6 rounded-xl border ${
        darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Monthly Progress
        </h3>
        
        <div className="flex items-end justify-between h-40 space-x-2">
          {stats.monthlyProgress.map((month) => (
            <div key={month.month} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-red-600 to-red-500 rounded-t-lg transition-all duration-300"
                style={{ height: `${(month.completed / 15) * 120}px` }}
              />
              <p className={`text-xs mt-2 font-medium ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {month.month}
              </p>
              <p className={`text-xs ${
                darkTheme ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {month.completed}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Future Features Teaser */}
      <div className={`p-6 rounded-xl border-2 border-dashed ${
        darkTheme ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            darkTheme ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h4 className={`text-lg font-semibold mb-2 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            More Analytics Coming Soon
          </h4>
          <p className={`text-sm ${
            darkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Advanced insights, comparison with friends, and personalized recommendations will be available as we build more features.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserStats;