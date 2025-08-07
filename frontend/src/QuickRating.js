import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuickRating = ({ content, darkTheme, size = 'sm', onRatingUpdate }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  useEffect(() => {
    checkUserRating();
  }, [content?.id]);

  const checkUserRating = async () => {
    if (!content?.id) return;

    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await axios.get(`${API}/reviews?content_id=${content.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find user's review in the results
      const currentUserId = await getCurrentUserId();
      if (currentUserId) {
        const existingReview = response.data.reviews.find(
          review => review.user_id === currentUserId
        );
        
        if (existingReview) {
          setUserRating(existingReview.rating);
          setHasReviewed(true);
        }
      }
    } catch (error) {
      console.error('Error checking user rating:', error);
    }
  };

  const getCurrentUserId = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return null;

      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.id;
    } catch (error) {
      return null;
    }
  };

  const handleRating = async (rating) => {
    if (!content?.id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        alert('Please sign in to rate content');
        return;
      }

      if (hasReviewed) {
        // Update existing review rating
        const response = await axios.get(`${API}/reviews?content_id=${content.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const currentUserId = await getCurrentUserId();
        const existingReview = response.data.reviews.find(
          review => review.user_id === currentUserId
        );

        if (existingReview) {
          await axios.put(`${API}/reviews/${existingReview.id}`, {
            rating: rating
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } else {
        // Create new review with just rating
        await axios.post(`${API}/reviews`, {
          content_id: content.id,
          rating: rating
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHasReviewed(true);
      }

      setUserRating(rating);
      
      // Notify parent component of rating update
      if (onRatingUpdate) {
        onRatingUpdate(rating);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.response?.status === 401) {
        alert('Please sign in to rate content');
      } else if (error.response?.status === 400) {
        alert('You have already rated this content');
      } else {
        alert('Failed to submit rating');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
        const isFilled = star <= (hoveredRating || userRating);
        const isHovered = hoveredRating > 0 && star <= hoveredRating;
        
        return (
          <button
            key={star}
            disabled={loading}
            className={`${sizeClasses[size]} cursor-pointer transition-all duration-150 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => handleRating(star)}
            title={`Rate ${star}/10`}
          >
            <svg 
              className={`w-full h-full transition-colors ${
                isFilled 
                  ? isHovered 
                    ? 'text-yellow-300 fill-current' 
                    : 'text-yellow-400 fill-current'
                  : darkTheme
                    ? 'text-gray-600 fill-current hover:text-gray-500'
                    : 'text-gray-300 fill-current hover:text-gray-400'
              }`} 
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          </button>
        );
      })}
      
      {(hoveredRating > 0 || userRating > 0) && (
        <span className={`ml-2 text-xs font-medium transition-opacity ${
          darkTheme ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {hoveredRating || userRating}/10
          {userRating > 0 && hoveredRating === 0 && (
            <span className="ml-1 text-green-500">✓</span>
          )}
        </span>
      )}
    </div>
  );
};

export default QuickRating;