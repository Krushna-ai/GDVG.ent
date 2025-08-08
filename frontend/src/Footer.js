import React from 'react';

const Footer = ({ darkTheme }) => {
  return (
    <footer className={`border-t transition-all duration-300 ${
      darkTheme 
        ? 'bg-black border-red-900/50' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <h3 className={`text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4`}>
              Global Drama Verse Guide
            </h3>
            <p className={`text-sm leading-relaxed mb-4 ${
              darkTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Your gateway to the world's best entertainment. Discover dramas, movies, and anime from every corner of the globe, all in one beautifully designed platform.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-red-600/20 text-red-600 rounded-full text-xs font-medium">
                🇰🇷 Korean
              </span>
              <span className="px-3 py-1 bg-red-600/20 text-red-600 rounded-full text-xs font-medium">
                🇯🇵 Japanese
              </span>
              <span className="px-3 py-1 bg-red-600/20 text-red-600 rounded-full text-xs font-medium">
                🇮🇳 Indian
              </span>
              <span className="px-3 py-1 bg-red-600/20 text-red-600 rounded-full text-xs font-medium">
                🇪🇸 Spanish
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-semibold mb-4 ${
              darkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Discover
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Trending
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  K-Dramas
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Anime
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Movies
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className={`font-semibold mb-4 ${
              darkTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Romance
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Thriller
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Comedy
                </a>
              </li>
              <li>
                <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
                  darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
                }`}>
                  Drama
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={`border-t pt-8 mt-8 flex flex-col md:flex-row justify-between items-center ${
          darkTheme ? 'border-red-900/50' : 'border-gray-200'
        }`}>
          <div className={`text-sm ${
            darkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            © 2025 Global Drama Verse Guide. All rights reserved.
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
              darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
            }`}>
              Privacy Policy
            </a>
            <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
              darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
            }`}>
              Terms of Service
            </a>
            <a href="#" className={`text-sm hover:text-red-600 transition-colors ${
              darkTheme ? 'text-gray-400 hover:text-red-400' : 'text-gray-600'
            }`}>
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;