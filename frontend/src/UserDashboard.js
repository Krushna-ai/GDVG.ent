import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserProfile from './UserProfile';
import UserStats from './UserStats';
import AdvancedSearch from './AdvancedSearch';
import FeaturedSections from './FeaturedSections';
import WatchlistManager from './WatchlistManager';
import WatchlistButton from './WatchlistButton';
import ReviewSystem from './ReviewSystem';
import QuickRating from './QuickRating';
import PersonalAnalytics from './PersonalAnalytics';
import SocialFeatures from './SocialFeatures';
import SocialInteractions from './SocialInteractions';
import ReviewInteractions from './ReviewInteractions';
import SmartRecommendations from './SmartRecommendations';
import PremiumFeatures from './PremiumFeatures';
import { AdSenseBanner, useAdManagement } from './AdIntegration';
import Footer from './Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserDashboard = ({ darkTheme, onLogout, currentUser }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'profile', 'stats', 'watchlist', 'analytics', 'social', 'recommendations', 'premium'
  const [homeView, setHomeView] = useState('featured'); // 'featured', 'search'
  const [selectedContent, setSelectedContent] = useState(null);
  const { shouldShowAds } = useAdManagement();

  useEffect(() => {
    fetchUserProfile();
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

  const handleContentClick = (content) => {
    setSelectedContent(content);
  };

  const closeContentModal = () => {
    setSelectedContent(null);
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
          <nav className="hidden md:flex space-x-4">
            <button 
              onClick={() => setCurrentView('home')}
              className={`transition-colors text-sm px-2 py-1 ${
                currentView === 'home'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              Discover
            </button>
            <button 
              onClick={() => setCurrentView('recommendations')}
              className={`transition-colors text-sm px-2 py-1 ${
                currentView === 'recommendations'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              For You
            </button>
            <button 
              onClick={() => setCurrentView('watchlist')}
              className={`transition-colors text-sm px-2 py-1 ${
                currentView === 'watchlist'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              My List
            </button>
            <button 
              onClick={() => setCurrentView('social')}
              className={`transition-colors text-sm px-2 py-1 ${
                currentView === 'social'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              Social
            </button>
            <button 
              onClick={() => setCurrentView('analytics')}
              className={`transition-colors text-sm px-2 py-1 ${
                currentView === 'analytics'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              Stats
            </button>
            <button 
              onClick={() => setCurrentView('premium')}
              className={`transition-colors text-sm px-2 py-1 ${
                currentView === 'premium'
                  ? 'text-red-400'
                  : darkTheme
                  ? 'text-gray-400 hover:text-red-400'
                  : 'text-gray-600 hover:text-red-600'
              }`}>
              ⭐ Premium
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={`transition-colors text-sm px-2 py-1 ${
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
              onClick={() => setHomeView('featured')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                homeView === 'featured'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : darkTheme
                  ? 'border border-white/20 text-white hover:bg-white/10'
                  : 'border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              Featured Content
            </button>
            <button 
              onClick={() => setHomeView('search')}
              className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                homeView === 'search'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : darkTheme
                  ? 'border border-white/20 text-white hover:bg-white/10'
                  : 'border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              Advanced Search
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


  // Content Detail Modal
  const ContentDetailModal = ({ content, onClose }) => {
    if (!content) return null;

    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-black opacity-75" />
          </div>

          <div className={`inline-block align-bottom rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
            darkTheme ? 'bg-black border border-red-900/50' : 'bg-white border border-gray-200'
          }`}>
            {/* Header with banner */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={content.banner_url || content.poster_url}
                alt={content.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-red-600/80 transition-all duration-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Title overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-4xl font-bold text-white mb-2">{content.title}</h2>
                {content.original_title && content.original_title !== content.title && (
                  <p className="text-xl text-gray-300">{content.original_title}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Info bar */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <svg className="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                  <span className={`font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {content.rating.toFixed(1)}
                  </span>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  content.content_type === 'movie' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                  content.content_type === 'series' ? 'bg-red-200 text-red-900 dark:bg-red-800/50 dark:text-red-200' :
                  content.content_type === 'drama' ? 'bg-red-300 text-red-900 dark:bg-red-700/50 dark:text-red-100' :
                  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)}
                </span>

                <span className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  {content.year}
                </span>

                <span className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  {content.country}
                </span>

                {content.duration && (
                  <span className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatDuration(content.duration)}
                  </span>
                )}

                {content.episodes && (
                  <span className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {content.episodes} episodes
                  </span>
                )}
              </div>

              {/* Genres */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {content.genres.map((genre) => (
                    <span
                      key={genre}
                      className={`px-3 py-1 rounded-full text-sm ${
                        darkTheme
                          ? 'bg-red-900/30 text-red-300 border border-red-800/50'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {genre.charAt(0).toUpperCase() + genre.slice(1).replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Synopsis */}
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-3 ${
                  darkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  Synopsis
                </h3>
                <p className={`leading-relaxed ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {content.synopsis}
                </p>
              </div>

              {/* Cast */}
              {content.cast && content.cast.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-3 ${
                    darkTheme ? 'text-white' : 'text-gray-900'
                  }`}>
                    Cast
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {content.cast.slice(0, 6).map((actor, index) => (
                      <div key={actor.id || index} className={`flex items-center gap-3 p-3 rounded-lg ${
                        darkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          darkTheme ? 'bg-gray-700 border border-gray-600' : 'bg-gray-200 border border-gray-300'
                        }`}>
                          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className={`font-medium ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                            {actor.name}
                          </div>
                          <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {actor.character}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streaming Platforms */}
              {content.streaming_platforms && content.streaming_platforms.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-3 ${
                    darkTheme ? 'text-white' : 'text-gray-900'
                  }`}>
                    Watch On
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {content.streaming_platforms.map((platform, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Watchlist Button */}
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <WatchlistButton 
                  content={content} 
                  darkTheme={darkTheme} 
                  size="lg" 
                />
                <div className="text-center">
                  <div className={`text-sm font-medium mb-1 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Quick Rate
                  </div>
                  <QuickRating 
                    content={content} 
                    darkTheme={darkTheme} 
                    size="md" 
                  />
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div className={`border-t ${darkTheme ? 'border-gray-800' : 'border-gray-200'}`}>
              <ReviewSystem 
                contentId={content.id} 
                darkTheme={darkTheme} 
              />
            </div>
          </div>
        </div>
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
      
      {currentView === 'home' && (
        <>
          <WelcomeSection />
          {/* Top Content Ad for Free Users */}
          {shouldShowAds && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <AdSenseBanner slot="banner_top" size="728x90" className="mb-6" />
            </div>
          )}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {homeView === 'featured' ? (
              <FeaturedSections 
                darkTheme={darkTheme}
                onContentClick={handleContentClick}
                showAds={shouldShowAds}
              />
            ) : (
              <AdvancedSearch 
                darkTheme={darkTheme}
                onContentClick={handleContentClick}
              />
            )}
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'profile' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <UserProfile 
              darkTheme={darkTheme} 
              currentUser={userProfile} 
              onProfileUpdate={handleProfileUpdate}
            />
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'watchlist' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <WatchlistManager 
              darkTheme={darkTheme} 
              onContentClick={handleContentClick}
            />
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'analytics' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <PersonalAnalytics 
              darkTheme={darkTheme} 
              currentUser={userProfile}
            />
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'recommendations' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <SmartRecommendations 
              darkTheme={darkTheme} 
              currentUser={userProfile}
              onContentClick={handleContentClick}
            />
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'premium' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <PremiumFeatures 
              darkTheme={darkTheme} 
              currentUser={userProfile}
            />
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'social' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SocialFeatures 
                darkTheme={darkTheme} 
                currentUser={userProfile}
              />
              <SocialInteractions 
                darkTheme={darkTheme}
              />
            </div>
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {currentView === 'stats' && (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <UserStats 
              darkTheme={darkTheme} 
              currentUser={userProfile}
            />
          </main>
          <Footer darkTheme={darkTheme} />
        </>
      )}

      {/* Content Detail Modal */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          onClose={closeContentModal}
        />
      )}
    </div>
  );
};

export default UserDashboard;