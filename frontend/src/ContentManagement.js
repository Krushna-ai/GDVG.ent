import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContentManagement = ({ darkTheme, onStatsUpdate }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit'
  const [selectedContent, setSelectedContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    original_title: '',
    poster_url: '',
    banner_url: '',
    synopsis: '',
    year: new Date().getFullYear(),
    country: '',
    content_type: 'movie',
    genres: [],
    rating: 8.0,
    episodes: null,
    duration: null,
    cast: [],
    crew: [],
    streaming_platforms: [],
    tags: []
  });

  const contentTypes = ['movie', 'series', 'drama', 'anime'];
  const genreOptions = [
    'romance', 'comedy', 'action', 'thriller', 'horror', 'fantasy',
    'drama', 'mystery', 'slice_of_life', 'historical', 'crime', 'adventure'
  ];

  useEffect(() => {
    fetchContents();
  }, [searchQuery, pagination.page]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery })
      });

      const response = await axios.get(`${API}/admin/content?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setContents(response.data.contents);
      setPagination(prev => ({
        ...prev,
        total: response.data.total
      }));
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file, field) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          [field]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      
      if (currentView === 'edit' && selectedContent) {
        // Update existing content
        await axios.put(`${API}/admin/content/${selectedContent.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new content
        await axios.post(`${API}/admin/content`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Reset form and refresh list
      resetForm();
      setCurrentView('list');
      fetchContents();
      onStatsUpdate();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        const token = localStorage.getItem('admin_token');
        await axios.delete(`${API}/admin/content/${contentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        fetchContents();
        onStatsUpdate();
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error deleting content');
      }
    }
  };

  const handleEdit = (content) => {
    setSelectedContent(content);
    setFormData({
      title: content.title,
      original_title: content.original_title || '',
      poster_url: content.poster_url,
      banner_url: content.banner_url || '',
      synopsis: content.synopsis,
      year: content.year,
      country: content.country,
      content_type: content.content_type,
      genres: content.genres,
      rating: content.rating,
      episodes: content.episodes,
      duration: content.duration,
      cast: content.cast || [],
      crew: content.crew || [],
      streaming_platforms: content.streaming_platforms || [],
      tags: content.tags || []
    });
    setCurrentView('edit');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      original_title: '',
      poster_url: '',
      banner_url: '',
      synopsis: '',
      year: new Date().getFullYear(),
      country: '',
      content_type: 'movie',
      genres: [],
      rating: 8.0,
      episodes: null,
      duration: null,
      cast: [],
      crew: [],
      streaming_platforms: [],
      tags: []
    });
    setSelectedContent(null);
  };

  const addCastMember = () => {
    setFormData(prev => ({
      ...prev,
      cast: [...prev.cast, { name: '', character: '', profile_image: null }]
    }));
  };

  const updateCastMember = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cast: prev.cast.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const removeCastMember = (index) => {
    setFormData(prev => ({
      ...prev,
      cast: prev.cast.filter((_, i) => i !== index)
    }));
  };

  const ContentForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          {currentView === 'edit' ? 'Edit Content' : 'Add New Content'}
        </h2>
        <button
          onClick={() => {
            setCurrentView('list');
            resetForm();
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            darkTheme
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              darkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Basic Information
            </h3>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Original Title
              </label>
              <input
                type="text"
                value={formData.original_title}
                onChange={(e) => setFormData(prev => ({ ...prev, original_title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Year *
                </label>
                <input
                  type="number"
                  required
                  min="1900"
                  max="2030"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    darkTheme
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Rating *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    darkTheme
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Country *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="e.g., South Korea, Japan, India"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Content Type *
              </label>
              <select
                required
                value={formData.content_type}
                onChange={(e) => setFormData(prev => ({ ...prev, content_type: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {contentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Images and Details */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${
              darkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Images & Details
            </h3>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Poster Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0], 'poster_url')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              {formData.poster_url && (
                <img src={formData.poster_url} alt="Poster" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0], 'banner_url')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              {formData.banner_url && (
                <img src={formData.banner_url} alt="Banner" className="mt-2 h-20 w-full object-cover rounded" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    darkTheme
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Episodes
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.episodes || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    episodes: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    darkTheme
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Synopsis *
          </label>
          <textarea
            required
            rows="4"
            value={formData.synopsis}
            onChange={(e) => setFormData(prev => ({ ...prev, synopsis: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              darkTheme
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Enter a detailed synopsis..."
          />
        </div>

        {/* Genres */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Genres *
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {genreOptions.map(genre => (
              <label key={genre} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.genres.includes(genre)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, genres: [...prev.genres, genre] }));
                    } else {
                      setFormData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
                    }
                  }}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className={`text-sm ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {genre.charAt(0).toUpperCase() + genre.slice(1).replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Streaming Platforms */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Streaming Platforms (comma separated)
          </label>
          <input
            type="text"
            value={formData.streaming_platforms.join(', ')}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              streaming_platforms: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
            }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              darkTheme
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Netflix, Amazon Prime, Hulu"
          />
        </div>

        {/* Cast Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className={`text-sm font-medium ${
              darkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Cast Members
            </label>
            <button
              type="button"
              onClick={addCastMember}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Add Cast Member
            </button>
          </div>
          
          {formData.cast.map((member, index) => (
            <div key={index} className={`grid grid-cols-3 gap-4 p-4 border rounded-lg mb-2 ${
              darkTheme ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <input
                type="text"
                placeholder="Actor Name"
                value={member.name}
                onChange={(e) => updateCastMember(index, 'name', e.target.value)}
                className={`px-3 py-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <input
                type="text"
                placeholder="Character Name"
                value={member.character}
                onChange={(e) => updateCastMember(index, 'character', e.target.value)}
                className={`px-3 py-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                type="button"
                onClick={() => removeCastMember(index)}
                className="px-3 py-2 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
          >
            {currentView === 'edit' ? 'Update Content' : 'Create Content'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentView('list');
              resetForm();
            }}
            className={`px-6 py-3 rounded-lg transition-colors ${
              darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const ContentList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Content Management
        </h2>
        <button
          onClick={() => setCurrentView('add')}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
        >
          Add New Content
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
            darkTheme
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${
          darkTheme ? 'bg-gray-900' : 'bg-white'
        }`}>
          <table className="min-w-full divide-y divide-gray-300">
            <thead className={darkTheme ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkTheme ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Content
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkTheme ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkTheme ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Country
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkTheme ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Rating
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkTheme ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              darkTheme ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {contents.map((content) => (
                <tr key={content.id} className={darkTheme ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-16 w-12 object-cover rounded"
                        src={content.poster_url}
                        alt={content.title}
                      />
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          darkTheme ? 'text-white' : 'text-gray-900'
                        }`}>
                          {content.title}
                        </div>
                        <div className={`text-sm ${
                          darkTheme ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {content.year}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      content.content_type === 'movie' ? 'bg-red-100 text-red-800' :
                      content.content_type === 'series' ? 'bg-blue-100 text-blue-800' :
                      content.content_type === 'drama' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkTheme ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {content.country}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkTheme ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    ⭐ {content.rating.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(content)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-between">
          <div className={`text-sm ${
            darkTheme ? 'text-gray-400' : 'text-gray-700'
          }`}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded border ${
                pagination.page === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${
                darkTheme
                  ? 'border-gray-700 text-gray-300'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className={`px-3 py-1 rounded border ${
                pagination.page * pagination.limit >= pagination.total
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${
                darkTheme
                  ? 'border-gray-700 text-gray-300'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {currentView === 'list' && <ContentList />}
      {(currentView === 'add' || currentView === 'edit') && <ContentForm />}
    </div>
  );
};

export default ContentManagement;