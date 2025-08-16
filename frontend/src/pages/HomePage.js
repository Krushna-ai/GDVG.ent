import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ContentGrid from '../components/ContentGrid';
import Footer from '../Footer';
import ContentDetail from '../ContentDetail';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = ({ darkTheme, setDarkTheme }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async (search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }

      const response = await axios.get(`${API}/content?${params}`);
      setContents(response.data.contents);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchContents(query);
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
  };

  const closeModal = () => {
    setSelectedContent(null);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkTheme ? 'bg-black' : 'bg-gray-50'
    }`}>
      <Header
        onSearch={handleSearch}
        darkTheme={darkTheme}
        setDarkTheme={setDarkTheme}
        onAuthClick={onAuthClick}
      />

      {!searchQuery && <HeroSection darkTheme={darkTheme} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchQuery && (
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-2 ${
              darkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Search Results for "{searchQuery}"
            </h2>
            <p className={`${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {contents.length} results found
            </p>
          </div>
        )}

        {!searchQuery && (
          <div className="mb-8">
            <h2 className={`text-3xl font-bold mb-6 ${
              darkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Trending Global Content
            </h2>
          </div>
        )}

        <ContentGrid
          contents={contents}
          darkTheme={darkTheme}
          onContentClick={handleContentClick}
          loading={loading}
        />
      </main>

      {selectedContent && (
        <ContentDetail
          content={selectedContent}
          darkTheme={darkTheme}
          onClose={closeModal}
        />
      )}

      <Footer darkTheme={darkTheme} />
    </div>
  );
};

export default HomePage;
