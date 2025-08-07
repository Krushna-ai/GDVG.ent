import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// AdSense Banner Component
export const AdSenseBanner = ({ slot, size = "728x90", className = "", style = {} }) => {
  const [showAds, setShowAds] = useState(false);
  const [adConfig, setAdConfig] = useState(null);

  useEffect(() => {
    checkAdStatus();
  }, []);

  useEffect(() => {
    if (showAds && adConfig && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [showAds, adConfig]);

  const checkAdStatus = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        setShowAds(true);
        fetchAdConfig();
        return;
      }

      const [adsResponse, configResponse] = await Promise.all([
        axios.get(`${API}/ads/should-show`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/ads/config`)
      ]);

      setShowAds(adsResponse.data.show_ads);
      setAdConfig(configResponse.data);

      // Load AdSense script if not already loaded
      if (adsResponse.data.show_ads && !document.querySelector('[data-ad-client]')) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${configResponse.data.google_adsense.client_id}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Error checking ad status:', error);
      // Default to showing ads for non-authenticated users
      setShowAds(true);
    }
  };

  const fetchAdConfig = async () => {
    try {
      const response = await axios.get(`${API}/ads/config`);
      setAdConfig(response.data);
    } catch (error) {
      console.error('Error fetching ad config:', error);
    }
  };

  if (!showAds || !adConfig) {
    return null;
  }

  const [width, height] = size.split('x');

  return (
    <div className={`ad-container text-center ${className}`} style={style}>
      <div className="text-xs text-gray-400 mb-1">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: `${width}px`,
          height: `${height}px`,
          ...style
        }}
        data-ad-client={adConfig.google_adsense.client_id}
        data-ad-slot={adConfig.google_adsense.ad_slots[slot]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

// Native Ad Component for Content Feeds
export const AdSenseNative = ({ className = "" }) => {
  const [showAds, setShowAds] = useState(false);
  const [adConfig, setAdConfig] = useState(null);

  useEffect(() => {
    checkAdStatus();
  }, []);

  const checkAdStatus = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        setShowAds(true);
        fetchAdConfig();
        return;
      }

      const [adsResponse, configResponse] = await Promise.all([
        axios.get(`${API}/ads/should-show`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/ads/config`)
      ]);

      setShowAds(adsResponse.data.show_ads);
      setAdConfig(configResponse.data);
    } catch (error) {
      console.error('Error checking ad status:', error);
      setShowAds(true);
    }
  };

  const fetchAdConfig = async () => {
    try {
      const response = await axios.get(`${API}/ads/config`);
      setAdConfig(response.data);
    } catch (error) {
      console.error('Error fetching ad config:', error);
    }
  };

  if (!showAds || !adConfig) {
    return null;
  }

  return (
    <div className={`ad-native-container p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="text-xs text-gray-400 mb-2">Sponsored Content</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={adConfig.google_adsense.client_id}
        data-ad-slot={adConfig.google_adsense.ad_slots.native_feed}
      ></ins>
    </div>
  );
};

// Premium Upgrade Prompt (alternative to ads)
export const PremiumPrompt = ({ darkTheme, onUpgrade }) => (
  <div className={`p-6 rounded-xl border-2 border-dashed ${
    darkTheme 
      ? 'border-gray-700 bg-gray-900' 
      : 'border-gray-300 bg-gray-50'
  }`}>
    <div className="text-center">
      <div className="text-3xl mb-3">⭐</div>
      <h3 className={`font-bold text-lg mb-2 ${
        darkTheme ? 'text-white' : 'text-gray-900'
      }`}>
        Upgrade to Premium
      </h3>
      <p className={`text-sm mb-4 ${
        darkTheme ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Remove ads and unlock advanced features
      </p>
      <button
        onClick={onUpgrade}
        className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
      >
        Upgrade Now
      </button>
    </div>
  </div>
);

// Hook to manage ad display logic
export const useAdManagement = () => {
  const [shouldShowAds, setShouldShowAds] = useState(false);
  const [adConfig, setAdConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdConfiguration();
  }, []);

  const checkAdConfiguration = async () => {
    try {
      const token = localStorage.getItem('user_token');
      
      if (!token) {
        setShouldShowAds(true);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API}/ads/should-show`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShouldShowAds(response.data.show_ads);
    } catch (error) {
      console.error('Error checking ad configuration:', error);
      setShouldShowAds(true); // Default to showing ads on error
    } finally {
      setLoading(false);
    }
  };

  return {
    shouldShowAds,
    loading,
    refreshAdStatus: checkAdConfiguration
  };
};

export default {
  AdSenseBanner,
  AdSenseNative,
  PremiumPrompt,
  useAdManagement
};