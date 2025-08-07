import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserProfile from './UserProfile';
import UserStats from './UserStats';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserDashboard = ({ darkTheme, onLogout, currentUser }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'profile', 'stats'

  useEffect(() => {
    fetchUserProfile();
    fetchTrendingContent();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        onLogout();
      }
    }
  };

  const fetchTrendingContent = async () => {
    try {
      const response = await axios.get(`${API}/trending?limit=8`);
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching trending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    onLogout();
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  const UserHeader = () => (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
      darkTheme 
        ? 'bg-black/95 border-red-900/50' 
        : 'bg-white/95 border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent tracking-wider">
              GDVG
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => setCurrentView('home')}
              className={`transition-colors ${
                currentView === 'home'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              Discover
            </button>
            <button 
              onClick={() => setCurrentView('stats')}
              className={`transition-colors ${
                currentView === 'stats'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              My Stats
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={`transition-colors ${
                currentView === 'profile'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              Profile
            </button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search content..."
                className={`w-64 px-4 py-2 pl-10 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  darkTheme
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* User Avatar & Menu */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                  darkTheme ? 'bg-red-600' : 'bg-red-500'
                }`}>
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {userProfile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <span className={`hidden md:block font-medium ${
                  darkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {userProfile?.first_name}
                </span>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg transition-colors ${
                    darkTheme
                      ? 'text-gray-400 hover:bg-gray-900 hover:text-red-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-red-600'
                  }`}
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  const WelcomeSection = () => (
    <div className="relative py-16 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1710988486897-e933e4b0f72c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxnbG9iYWwlMjBjaW5lbWF8ZW58MHx8fHwxNzUzNTI3MjU2fDA&ixlib=rb-4.1.0&q=85)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome back, {userProfile?.first_name}!
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Ready to discover amazing content from around the world?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setCurrentView('home')}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
            >
              Discover New Content
            </button>
            <button 
              onClick={() => setCurrentView('stats')}
              className={`px-6 py-3 rounded-lg transition-colors border ${
                darkTheme
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-white/30 text-white hover:bg-white/20'
              }`}
            >
              View My Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ContentGrid = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`animate-pulse rounded-xl ${
              darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
            }`}>
              <div className="aspect-[2/3] rounded-t-xl bg-current opacity-20" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-current opacity-20 rounded" />
                <div className="h-3 bg-current opacity-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {contents.map((content) => (
          <div 
            key={content.id}
            className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              darkTheme ? 'hover:shadow-2xl' : 'hover:shadow-xl'
            }`}
          >
            <div className={`rounded-xl overflow-hidden transition-all duration-300 ${
              darkTheme 
                ? 'bg-gray-900 group-hover:bg-gray-800' 
                : 'bg-white group-hover:bg-gray-50'
            }`}>
              {/* Poster */}
              <div className="relative aspect-[2/3] overflow-hidden">
                <img
                  src={content.poster_url}
                  alt={content.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                    <span className="text-white font-semibold text-sm">{content.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Content Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold uppercase">
                    {content.content_type}
                  </span>
                </div>
              </div>

              {/* Content Info */}
              <div className="p-4">
                <h3 className={`font-bold text-lg mb-1 line-clamp-2 ${
                  darkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  {content.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium ${
                    darkTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {content.year}
                  </span>
                  <span className={`text-xs ${
                    darkTheme ? 'text-gray-500' : 'text-gray-400'
                  }`}>•</span>
                  <span className={`text-sm ${
                    darkTheme ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {content.country}
                  </span>
                </div>

                <p className={`text-sm line-clamp-2 ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {content.synopsis}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading && !userProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkTheme ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkTheme ? 'bg-black' : 'bg-gray-50'
    }`}>
      <UserHeader />
      <WelcomeSection />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className={`text-3xl font-bold mb-2 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Trending Now
          </h2>
          <p className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
            Popular content across all regions and genres
          </p>
        </div>

        <ContentGrid />
      </main>
    </div>
  );
};

export default UserDashboard;