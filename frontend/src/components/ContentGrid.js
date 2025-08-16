import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCard from './ContentCard';

const ContentGrid = ({ contents, darkTheme, onContentClick, loading }) => {
  const navigate = useNavigate();

  // Helper function to format title for URL
  const formatTitleForUrl = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  };

  // Handle content click with navigation
  const handleContentClick = (content) => {
    const titleSlug = formatTitleForUrl(content.title);
    navigate(`/content/${content.id}/${titleSlug}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`animate-pulse rounded-xl ${
            darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
          }`}>
            <div className="aspect-[2/3] rounded-t-xl bg-current opacity-20" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-current opacity-20 rounded" />
              <div className="h-3 bg-current opacity-20 rounded" />
              <div className="h-3 bg-current opacity-20 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className={`text-center py-16 ${
        darkTheme ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 7v8a1 1 0 002 0V7a1 1 0 00-2 0zm4 0v8a1 1 0 002 0V7a1 1 0 00-2 0z" />
        </svg>
        <p className="text-lg font-medium">No content found</p>
        <p className="text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {contents.map((content) => (
        <ContentCard
          key={content.id}
          content={content}
          darkTheme={darkTheme}
          onClick={onContentClick ? () => onContentClick(content) : () => handleContentClick(content)}
        />
      ))}
    </div>
  );
};

export default ContentGrid;
