import React from 'react';

const ContentCard = ({ content, darkTheme, onClick }) => {
  const formatRating = (rating) => {
    return rating.toFixed(1);
  };

  const formatGenres = (genres) => {
    return genres.slice(0, 3).map(genre =>
      genre.charAt(0).toUpperCase() + genre.slice(1).replace('_', ' ')
    ).join(' • ');
  };

  return (
    <div
      className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:z-10 ${
        darkTheme ? 'hover:shadow-2xl' : 'hover:shadow-xl'
      }`}
      onClick={() => onClick(content)}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
              <span className="text-white font-semibold text-sm">{formatRating(content.rating)}</span>
            </div>
          </div>

          {/* Content Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${
              content.content_type === 'movie' ? 'bg-red-600 text-white' :
              content.content_type === 'series' ? 'bg-red-700 text-white' :
              content.content_type === 'drama' ? 'bg-red-800 text-white' :
              'bg-red-500 text-white'
            }`}>
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

          {content.original_title && content.original_title !== content.title && (
            <p className={`text-sm mb-2 ${
              darkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {content.original_title}
            </p>
          )}

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

          <p className={`text-sm mb-3 ${
            darkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {formatGenres(content.genres)}
          </p>

          <p className={`text-sm line-clamp-2 ${
            darkTheme ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {content.synopsis}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
