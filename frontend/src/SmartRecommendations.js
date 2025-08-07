import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SmartRecommendations = ({ darkTheme, onContentClick }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('for-you'); // 'for-you', 'trending', 'similar'
  const [trendingContent, setTrendingContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [similarContent, setSimilarContent] = useState([]);

  useEffect(() => {
    if (currentView === 'for-you') {
      fetchPersonalizedRecommendations();
    } else if (currentView === 'trending') {
      fetchTrendingContent();
    }
  }, [currentView]);

  const fetchPersonalizedRecommendations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/recommendations/for-you?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data.recommendations);
      setUserPreferences(response.data.user_preferences);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingContent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/discovery/trending?time_period=week&limit=20`);
      setTrendingContent(response.data.trending_content);
    } catch (error) {
      console.error('Error fetching trending content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarContent = async (contentId) => {
    try {
      const response = await axios.get(`${API}/recommendations/similar/${contentId}?limit=10`);
      setSimilarContent(response.data.similar_content);
      setSelectedContent(response.data.original_content);
      setCurrentView('similar');
    } catch (error) {
      console.error('Error fetching similar content:', error);
    }
  };

  const RecommendationCard = ({ content, showAlgorithm = true }) => {
    const getAlgorithmBadge = (type) => {
      const badges = {
        collaborative: { label: 'Similar Users', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
        content_based: { label: 'Your Taste', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
        trending: { label: 'Trending', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' }
      };
      return badges[type] || { label: 'Recommended', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300' };
    };

    const confidencePercentage = Math.round((content.confidence_score || 0.5) * 100);

    return (
      <div className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
        darkTheme ? 'hover:shadow-2xl' : 'hover:shadow-xl'
      }`}>
        <div className={`rounded-xl overflow-hidden transition-all duration-300 ${
          darkTheme 
            ? 'bg-gray-900 group-hover:bg-gray-800 border border-gray-800' 
            : 'bg-white group-hover:bg-gray-50 border border-gray-200'
        }`}>
          {/* Poster */}
          <div className="relative aspect-[2/3] overflow-hidden" onClick={() => onContentClick(content)}>
            <img
              src={content.poster_url}
              alt={content.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Algorithm Badge */}
            {showAlgorithm && content.recommendation_type && (
              <div className="absolute top-2 left-2">
                {(() => {
                  const badge = getAlgorithmBadge(content.recommendation_type);
                  return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            )}

            {/* Confidence Score */}
            {content.confidence_score && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-white font-semibold text-xs">{confidencePercentage}% match</span>
              </div>
            )}

            {/* Rating Badge */}
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
              <div className="flex items-center gap-1">
                <svg className="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <span className="text-white font-semibold text-xs">{content.rating?.toFixed(1) || 'N/A'}</span>
              </div>
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
              <span className={`text-sm font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {content.year}
              </span>
              <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
              <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {content.country}
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-3">
              {content.genres?.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className={`px-2 py-1 rounded text-xs ${
                    darkTheme
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1).replace('_', ' ')}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => fetchSimilarContent(content.id)}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  darkTheme
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                Find Similar
              </button>
              {content.trending_score && (
                <span className={`text-xs font-medium ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                  🔥 Trending
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PreferencesInsight = () => {
    if (!userPreferences) return null;

    return (
      <div className={`p-6 rounded-xl mb-6 ${
        darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🎯 Your Taste Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Favorite Genres */}
          {userPreferences.favorite_genres?.length > 0 && (
            <div>
              <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                Favorite Genres
              </h4>
              <div className="space-y-2">
                {userPreferences.favorite_genres.slice(0, 3).map((genre, index) => (
                  <div key={genre.genre} className="flex items-center justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {genre.genre.charAt(0).toUpperCase() + genre.genre.slice(1).replace('_', ' ')}
                    </span>
                    <div className={`flex-1 h-2 mx-3 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(genre.score / userPreferences.favorite_genres[0].score) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                      {Math.round(genre.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Countries */}
          {userPreferences.favorite_countries?.length > 0 && (
            <div>
              <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                Favorite Regions
              </h4>
              <div className="space-y-2">
                {userPreferences.favorite_countries.slice(0, 3).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {country.country}
                    </span>
                    <div className={`flex-1 h-2 mx-3 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(country.score / userPreferences.favorite_countries[0].score) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                      {country.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🧠 Smart Recommendations
        </h2>
        
        {/* Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('for-you')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'for-you'
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            For You
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
      ) : currentView === 'for-you' ? (
        <>
          <PreferencesInsight />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((content) => (
              <RecommendationCard key={content.id} content={content} />
            ))}
          </div>
          {recommendations.length === 0 && (
            <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-lg font-medium mb-2">Building your recommendations</p>
              <p className="text-sm">Rate more content to get better suggestions</p>
            </div>
          )}
        </>
      ) : currentView === 'trending' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingContent.map((content) => (
            <RecommendationCard key={content.id} content={content} showAlgorithm={false} />
          ))}
        </div>
      ) : currentView === 'similar' ? (
        <div className="space-y-6">
          {selectedContent && (
            <div className={`p-4 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                Content similar to: <span className="text-red-500">{selectedContent.title}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedContent.genres?.map((genre) => (
                  <span
                    key={genre}
                    className={`px-2 py-1 rounded text-xs ${
                      darkTheme
                        ? 'bg-red-900/30 text-red-300'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {genre.charAt(0).toUpperCase() + genre.slice(1).replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {similarContent.map((content) => (
              <RecommendationCard key={content.id} content={content} showAlgorithm={false} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SmartRecommendations;