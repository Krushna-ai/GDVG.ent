import React from 'react';

const ContentDetail = ({ content, darkTheme, onClose }) => {
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
            {content.cast.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-3 ${
                  darkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  Cast
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.cast.slice(0, 6).map((actor) => (
                    <div key={actor.id} className={`flex items-center gap-3 p-3 rounded-lg ${
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
            {content.streaming_platforms.length > 0 && (
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  darkTheme ? 'text-white' : 'text-gray-900'
                }`}>
                  Watch On
                </h3>
                <div className="flex flex-wrap gap-2">
                  {content.streaming_platforms.map((platform) => (
                    <span
                      key={platform}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;