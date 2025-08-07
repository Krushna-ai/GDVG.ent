import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserProfile = ({ darkTheme, currentUser, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    location: ''
  });

  // Settings form state
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      social: true,
      recommendations: true
    },
    privacy: {
      profile_public: true,
      activity_public: true,
      lists_public: true
    }
  });

  // Avatar upload state
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        bio: currentUser.bio || '',
        location: currentUser.location || ''
      });
      setAvatarPreview(currentUser.avatar_url);
    }
    
    fetchUserSettings();
  }, [currentUser]);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API}/auth/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.put(`${API}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onProfileUpdate) {
        onProfileUpdate(response.data);
      }

      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select an image file');
        return;
      }

      setSelectedAvatar(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatar) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      const formData = new FormData();
      formData.append('avatar_file', selectedAvatar);

      const response = await axios.post(`${API}/auth/avatar`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (onProfileUpdate) {
        onProfileUpdate(response.data);
      }

      setSelectedAvatar(null);
      showMessage('success', 'Avatar updated successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API}/auth/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', 'Settings updated successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        activeTab === id
          ? 'bg-red-600 text-white'
          : darkTheme
          ? 'text-gray-400 hover:text-white hover:bg-gray-800'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  const ProfileTab = () => (
    <div className="space-y-6">
      <h3 className={`text-xl font-bold ${
        darkTheme ? 'text-white' : 'text-gray-900'
      }`}>
        Profile Information
      </h3>

      {/* Avatar Section */}
      <div className={`p-6 rounded-xl border ${
        darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className={`font-semibold mb-4 ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Profile Picture
        </h4>
        
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden ${
            darkTheme ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-red-600">
                {currentUser?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                darkTheme
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Choose Image
            </label>
            
            {selectedAvatar && (
              <button
                onClick={handleAvatarUpload}
                disabled={loading}
                className="ml-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            )}
            
            <p className={`text-sm mt-2 ${
              darkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Max file size: 5MB. Supported: JPG, PNG, GIF
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              First Name
            </label>
            <input
              type="text"
              value={profileData.first_name}
              onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="John"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Last Name
            </label>
            <input
              type="text"
              value={profileData.last_name}
              onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                darkTheme
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Bio
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            rows="4"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              darkTheme
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Tell us about yourself and your entertainment preferences..."
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            darkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Location
          </label>
          <input
            type="text"
            value={profileData.location}
            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
              darkTheme
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="City, Country"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <h3 className={`text-xl font-bold ${
        darkTheme ? 'text-white' : 'text-gray-900'
      }`}>
        Account Settings
      </h3>

      <form onSubmit={handleSettingsSubmit} className="space-y-6">
        {/* Theme Settings */}
        <div className={`p-6 rounded-xl border ${
          darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className={`font-semibold mb-4 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Appearance
          </h4>
          
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              darkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({...settings, theme: 'dark'})}
                className={`p-3 rounded-lg border text-left transition-all ${
                  settings.theme === 'dark'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : darkTheme
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-900 rounded mr-3"></div>
                  <span className={darkTheme ? 'text-white' : 'text-gray-900'}>Dark</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setSettings({...settings, theme: 'light'})}
                className={`p-3 rounded-lg border text-left transition-all ${
                  settings.theme === 'light'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : darkTheme
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 rounded mr-3"></div>
                  <span className={darkTheme ? 'text-white' : 'text-gray-900'}>Light</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className={`p-6 rounded-xl border ${
          darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className={`font-semibold mb-4 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Notifications
          </h4>
          
          <div className="space-y-4">
            {Object.entries({
              email: 'Email notifications',
              push: 'Push notifications',
              social: 'Social activity',
              recommendations: 'Content recommendations'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <label className={`text-sm ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {label}
                </label>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [key]: !settings.notifications[key]
                    }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications[key] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className={`p-6 rounded-xl border ${
          darkTheme ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 className={`font-semibold mb-4 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Privacy
          </h4>
          
          <div className="space-y-4">
            {Object.entries({
              profile_public: 'Public profile',
              activity_public: 'Public activity',
              lists_public: 'Public lists'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <label className={`text-sm ${
                  darkTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {label}
                </label>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    privacy: {
                      ...settings.privacy,
                      [key]: !settings.privacy[key]
                    }
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.privacy[key] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 font-medium"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Account Settings
        </h2>
        <p className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your profile, preferences, and privacy settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <TabButton
          id="profile"
          label="Profile"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <TabButton
          id="settings"
          label="Settings"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
};

export default UserProfile;