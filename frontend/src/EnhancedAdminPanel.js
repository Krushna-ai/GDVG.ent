import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancedAdminPanel = ({ darkTheme }) => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'smart-import', 'web-scrape', 'api-sync'
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Smart Import States
  const [importFile, setImportFile] = useState(null);
  const [mergeStrategy, setMergeStrategy] = useState('update');
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);

  // Web Scraping States
  const [scrapeSource, setScrapeSource] = useState('mydramalist');
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scrapeResults, setScrapeResults] = useState(null);
  const [scraping, setScraping] = useState(false);

  // API Sync States
  const [apiSource, setApiSource] = useState('tmdb');
  const [syncType, setSyncType] = useState('update');
  const [syncResults, setSyncResults] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchDashboardAnalytics();
    }
  }, [currentView]);

  const fetchDashboardAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartImport = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await axios.post(
        `${API}/admin/content/smart-import?merge_strategy=${mergeStrategy}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImportResults(response.data);
    } catch (error) {
      console.error('Error during smart import:', error);
      alert('Import failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setImporting(false);
    }
  };

  const handleWebScrape = async () => {
    if (!scrapeQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    setScraping(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/content/web-scrape?source=${scrapeSource}&query=${encodeURIComponent(scrapeQuery)}&limit=20`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setScrapeResults(response.data);
    } catch (error) {
      console.error('Error during web scraping:', error);
      alert('Scraping failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setScraping(false);
    }
  };

  const handleApiSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/content/api-sync?api_source=${apiSource}&sync_type=${syncType}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSyncResults(response.data);
    } catch (error) {
      console.error('Error during API sync:', error);
      alert('Sync failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSyncing(false);
    }
  };

  const DashboardView = () => {
    if (loading || !adminAnalytics) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`animate-pulse p-6 rounded-xl ${
              darkTheme ? 'bg-gray-900' : 'bg-gray-200'
            }`}>
              <div className="h-16 bg-current opacity-20 rounded" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Content
                </p>
                <p className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {adminAnalytics.content_stats.total_content.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">🎬</div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Users
                </p>
                <p className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {adminAnalytics.user_stats.total_users.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Users (Week)
                </p>
                <p className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {adminAnalytics.user_stats.active_this_week.toLocaleString()}
                </p>
                <p className={`text-xs ${darkTheme ? 'text-green-400' : 'text-green-600'}`}>
                  {adminAnalytics.user_stats.activity_rate}% active
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Reviews
                </p>
                <p className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {adminAnalytics.review_stats.total_reviews.toLocaleString()}
                </p>
                <p className={`text-xs ${darkTheme ? 'text-blue-400' : 'text-blue-600'}`}>
                  {adminAnalytics.review_stats.recent_reviews} this week
                </p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content by Type */}
          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              Content by Type
            </h3>
            <div className="space-y-3">
              {adminAnalytics.content_stats.by_type.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className={`font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.type?.charAt(0)?.toUpperCase() + item.type?.slice(1) || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 w-32 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(item.count / adminAnalytics.content_stats.by_type[0].count) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content by Country */}
          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              Content by Country
            </h3>
            <div className="space-y-3">
              {adminAnalytics.content_stats.by_country.slice(0, 5).map((item, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <span className={`font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.country || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 w-32 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.count / adminAnalytics.content_stats.by_country[0].count) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Content */}
        {adminAnalytics.popular_content.length > 0 && (
          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
              🏆 Most Popular Content
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {adminAnalytics.popular_content.map((content, index) => (
                <div key={content._id} className={`p-4 rounded-lg ${darkTheme ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-lg font-bold ${index < 3 ? 'text-yellow-500' : darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      #{index + 1}
                    </span>
                    <span className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {content.country}
                    </span>
                  </div>
                  <h4 className={`font-semibold mb-1 line-clamp-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {content.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      ⭐ {content.rating.toFixed(1)}
                    </span>
                    <span className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {content.review_count} reviews
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SmartImportView = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🧠 Smart Content Import
        </h3>
        <p className={`text-sm mb-6 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Upload Excel or CSV files with flexible column formats. The system will automatically detect and map columns, handle duplicates intelligently.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Select File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Merge Strategy
            </label>
            <select
              value={mergeStrategy}
              onChange={(e) => setMergeStrategy(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="update">Update (merge new data)</option>
              <option value="skip">Skip duplicates</option>
              <option value="replace">Replace existing</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSmartImport}
          disabled={!importFile || importing}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 font-medium"
        >
          {importing ? 'Importing...' : 'Start Smart Import'}
        </button>
      </div>

      {importResults && (
        <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <h4 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Import Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{importResults.imported}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Imported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{importResults.updated}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{importResults.skipped}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{importResults.total_errors}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Errors</div>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div>
              <h5 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                Sample Errors:
              </h5>
              <div className={`text-sm space-y-1 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {importResults.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const WebScrapeView = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🕷️ Web Scraping
        </h3>
        <p className={`text-sm mb-6 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Search and scrape content from various sources. Results will show if content already exists in your database.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Source
            </label>
            <select
              value={scrapeSource}
              onChange={(e) => setScrapeSource(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="mydramalist">MyDramaList</option>
              <option value="imdb">IMDb</option>
              <option value="tmdb">TMDB</option>
              <option value="manual">Manual Search</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Search Query
            </label>
            <input
              type="text"
              value={scrapeQuery}
              onChange={(e) => setScrapeQuery(e.target.value)}
              placeholder="Enter title, genre, or keywords..."
              className={`w-full px-3 py-2 border rounded-lg ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        <button
          onClick={handleWebScrape}
          disabled={!scrapeQuery.trim() || scraping}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200 font-medium"
        >
          {scraping ? 'Scraping...' : 'Start Scraping'}
        </button>
      </div>

      {scrapeResults && (
        <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <h4 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Scraping Results ({scrapeResults.count} found, {scrapeResults.new_content} new)
          </h4>
          <div className="space-y-3">
            {scrapeResults.results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.exists_in_db
                    ? darkTheme
                      ? 'border-yellow-500 bg-yellow-900/20'
                      : 'border-yellow-300 bg-yellow-50'
                    : darkTheme
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-green-300 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className={`font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                      {result.title}
                    </h5>
                    <p className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                      {result.country} • {result.year}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    result.exists_in_db
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {result.exists_in_db ? 'Exists' : 'New'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ApiSyncView = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🔄 API Synchronization
        </h3>
        <p className={`text-sm mb-6 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Sync your content database with external APIs to update missing information like posters, ratings, and descriptions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              API Source
            </label>
            <select
              value={apiSource}
              onChange={(e) => setApiSource(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="tmdb">TMDB (Movies & TV)</option>
              <option value="omdb">OMDB (Movies)</option>
              <option value="tvmaze">TVMaze (TV Shows)</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Sync Type
            </label>
            <select
              value={syncType}
              onChange={(e) => setSyncType(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="update">Update missing data</option>
              <option value="refresh">Refresh existing data</option>
              <option value="new_only">New content only</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleApiSync}
          disabled={syncing}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 font-medium"
        >
          {syncing ? 'Syncing...' : 'Start API Sync'}
        </button>
      </div>

      {syncResults && (
        <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <h4 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Sync Results
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{syncResults.updated}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{syncResults.synced}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Synced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{syncResults.total_errors}</div>
              <div className={`text-sm ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Errors</div>
            </div>
          </div>

          {syncResults.errors && syncResults.errors.length > 0 && (
            <div>
              <h5 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                Sample Errors:
              </h5>
              <div className={`text-sm space-y-1 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                {syncResults.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          🛠️ Enhanced Admin Panel
        </h2>
        <div className="flex gap-2">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'smart-import', label: 'Smart Import', icon: '🧠' },
            { key: 'web-scrape', label: 'Web Scrape', icon: '🕷️' },
            { key: 'api-sync', label: 'API Sync', icon: '🔄' }
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
      </div>

      {/* Content Views */}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'smart-import' && <SmartImportView />}
      {currentView === 'web-scrape' && <WebScrapeView />}
      {currentView === 'api-sync' && <ApiSyncView />}
    </div>
  );
};

export default EnhancedAdminPanel;