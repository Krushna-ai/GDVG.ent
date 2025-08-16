import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WatchlistManager = ({ darkTheme, onContentClick }) => {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const statusLabels = {
    want_to_watch: 'Want to Watch',
    watching: 'Watching',
    completed: 'Completed',
    dropped: 'Dropped'
  };

  const statusColors = {
    want_to_watch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    watching: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    dropped: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  };

  useEffect(() => {
    fetchWatchlist();
  }, [statusFilter, currentPage]);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('page', currentPage);
      params.append('limit', 20);

      const response = await axios.get(`${API}/watchlist?${params}`);

      setWatchlistItems(response.data.items);
      setTotalItems(response.data.total);
      setStatusCounts(response.data.status_counts);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setWatchlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId, newStatus, progress = null) => {
    try {
      const updateData = { status: newStatus };
      
      if (progress !== null) {
        updateData.progress = progress;
      }

      await axios.put(`${API}/watchlist/${itemId}`, updateData);

      // Refresh the list
      fetchWatchlist();
    } catch (error) {
      console.error('Error updating watchlist item:', error);
    }
  };

  const removeFromWatchlist = async (itemId) => {
    try {
      await axios.delete(`${API}/watchlist/${itemId}`);

      // Refresh the list
      fetchWatchlist();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const WatchlistCard = ({ item }) => {
    const content = item.content;
    const progressPercentage = item.total_episodes && item.progress 
      ? (item.progress / item.total_episodes) * 100 
      : 0;

    return (
      <div className={`group rounded-xl overflow-hidden transition-all duration-300 ${
        darkTheme 
          ? 'bg-gray-900 hover:bg-gray-800 border border-gray-800' 
          : 'bg-white hover:bg-gray-50 border border-gray-200'
      }`}>
        {/* Content Header */}
        <div 
          className="relative aspect-[16/9] overflow-hidden cursor-pointer"
          onClick={() => onContentClick(content)}
        >
          <img
            src={content.banner_url || content.poster_url}
            alt={content.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusColors[item.status]}`}>
              {statusLabels[item.status]}
            </span>
          </div>

          {/* Progress Bar */}
          {item.status === 'watching' && progressPercentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-white text-xs mt-1">
                {item.progress}/{item.total_episodes} episodes
              </div>
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="p-4">
          <h3 className={`font-bold text-lg mb-2 line-clamp-1 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            {content.title}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm ${darkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              {content.year} • {content.country}
            </span>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
              <span className={`text-sm font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {content.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {item.status === 'want_to_watch' && (
              <button
                onClick={() => updateItemStatus(item.id, 'watching')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Start Watching
              </button>
            )}
            
            {item.status === 'watching' && (
              <>
                <button
                  onClick={() => updateItemStatus(item.id, 'completed')}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                >
                  Mark Complete
                </button>
                {content.episodes && (
                  <input
                    type="number"
                    min="0"
                    max={content.episodes}
                    value={item.progress || 0}
                    onChange={(e) => updateItemStatus(item.id, item.status, parseInt(e.target.value))}
                    className={`w-20 px-2 py-1 rounded border text-sm ${
                      darkTheme
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Ep"
                  />
                )}
              </>
            )}

            <button
              onClick={() => removeFromWatchlist(item.id)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                darkTheme
                  ? 'bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white'
              }`}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`animate-pulse rounded-xl ${
            darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
          }`}>
            <div className="aspect-[16/9] rounded-t-xl bg-current opacity-20" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-current opacity-20 rounded" />
              <div className="h-3 bg-current opacity-20 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          My Watchlist
        </h2>
        
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-red-600 text-white'
                : darkTheme
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
          </button>
          {Object.entries(statusLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-red-600 text-white'
                  : darkTheme
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label} ({statusCounts[value] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Grid */}
      {watchlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlistItems.map((item) => (
            <WatchlistCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-lg font-medium mb-2">Your watchlist is empty</p>
          <p className="text-sm">Add some content to start tracking your viewing progress</p>
        </div>
      )}

      {/* Pagination */}
      {totalItems > 20 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          <span className={`px-4 py-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            Page {currentPage} of {Math.ceil(totalItems / 20)}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(totalItems / 20)}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default WatchlistManager;