import React from 'react';

const HeroSection = ({ darkTheme }) => {
  return (
    <div className="relative h-96 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1710988486897-e933e4b0f72c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxnbG9iYWwlMjBjaW5lbWF8ZW58MHx8fHwxNzUzNTI3MjU2fDA&ixlib=rb-4.1.0&q=85)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Discover Global
              <span className="block bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                Entertainment
              </span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              From Korean dramas to Bollywood blockbusters, Japanese anime to Spanish thrillers.
              Your gateway to the world's best entertainment, all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="px-4 py-2 bg-red-600/80 backdrop-blur-sm rounded-full text-white font-medium border border-red-500/50">
                🇰🇷 K-Dramas
              </span>
              <span className="px-4 py-2 bg-red-600/80 backdrop-blur-sm rounded-full text-white font-medium border border-red-500/50">
                🇯🇵 Anime
              </span>
              <span className="px-4 py-2 bg-red-600/80 backdrop-blur-sm rounded-full text-white font-medium border border-red-500/50">
                🇮🇳 Bollywood
              </span>
              <span className="px-4 py-2 bg-red-600/80 backdrop-blur-sm rounded-full text-white font-medium border border-red-500/50">
                🇪🇸 Spanish Cinema
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
