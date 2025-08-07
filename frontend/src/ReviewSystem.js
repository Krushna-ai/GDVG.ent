import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReviewSystem = ({ contentId, darkTheme }) => {
  const [reviews, setReviews] = useState([]);
  const [contentRating, setContentRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (contentId) {
      fetchReviews();
      fetchContentRating();
      checkUserReview();
    }
  }, [contentId, currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reviews?content_id=${contentId}&page=${currentPage}&limit=10`);
      setReviews(response.data.reviews);
      setTotalReviews(response.data.total);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContentRating = async () => {
    try {
      const response = await axios.get(`${API}/content/${contentId}/ratings`);
      setContentRating(response.data);
    } catch (error) {
      console.error('Error fetching content rating:', error);
    }
  };

  const checkUserReview = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await axios.get(`${API}/reviews?content_id=${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find user's review in the results
      const currentUserId = await getCurrentUserId();
      if (currentUserId) {
        const existingReview = response.data.reviews.find(
          review => review.user_id === currentUserId
        );
        setUserReview(existingReview);
      }
    } catch (error) {
      console.error('Error checking user review:', error);
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

  const StarRating = ({ rating, interactive = false, onRatingChange, size = 'md' }) => {
    const [hoveredRating, setHoveredRating] = useState(0);
    
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
          const isFilled = star <= (hoveredRating || rating);
          
          return (
            <button
              key={star}
              disabled={!interactive}
              className={`${sizeClasses[size]} ${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
              onMouseEnter={() => interactive && setHoveredRating(star)}
              onMouseLeave={() => interactive && setHoveredRating(0)}
              onClick={() => interactive && onRatingChange && onRatingChange(star)}
            >
              <svg 
                className={`w-full h-full ${isFilled ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} 
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            </button>
          );
        })}
        {interactive && (
          <span className={`ml-2 text-sm font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            {hoveredRating || rating}/10
          </span>
        )}
      </div>
    );
  };

  const RatingDistribution = () => {
    if (!contentRating?.rating_distribution) return null;

    const maxCount = Math.max(...Object.values(contentRating.rating_distribution));

    return (
      <div className={`p-4 rounded-lg ${darkTheme ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h4 className={`font-semibold mb-3 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          Rating Distribution
        </h4>
        <div className="space-y-2">
          {Object.entries(contentRating.rating_distribution)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([rating, count]) => {
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-8">
                    <span className={`text-sm font-medium ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {rating}
                    </span>
                    <svg className="h-3 w-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className={`h-2 rounded-full ${darkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm w-8 text-right ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {count}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const WriteReviewModal = () => {
    const [formData, setFormData] = useState({
      rating: userReview?.rating || 0,
      title: userReview?.title || '',
      review_text: userReview?.review_text || '',
      contains_spoilers: userReview?.contains_spoilers || false
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (formData.rating === 0) {
        alert('Please select a rating');
        return;
      }

      setSubmitting(true);
      try {
        const token = localStorage.getItem('user_token');
        if (!token) {
          alert('Please sign in to write a review');
          return;
        }

        if (userReview) {
          // Update existing review
          await axios.put(`${API}/reviews/${userReview.id}`, formData, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          // Create new review
          await axios.post(`${API}/reviews`, {
            ...formData,
            content_id: contentId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        setShowWriteReview(false);
        fetchReviews();
        fetchContentRating();
        checkUserReview();
      } catch (error) {
        console.error('Error submitting review:', error);
        if (error.response?.status === 401) {
          alert('Please sign in to write a review');
        } else if (error.response?.status === 400) {
          alert('You have already reviewed this content');
        } else {
          alert('Failed to submit review');
        }
      } finally {
        setSubmitting(false);
      }
    };

    const deleteReview = async () => {
      if (!userReview || !confirm('Are you sure you want to delete your review?')) return;

      try {
        const token = localStorage.getItem('user_token');
        await axios.delete(`${API}/reviews/${userReview.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUserReview(null);
        setShowWriteReview(false);
        fetchReviews();
        fetchContentRating();
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={() => setShowWriteReview(false)}>
            <div className="absolute inset-0 bg-black opacity-75" />
          </div>

          <div className={`inline-block align-bottom rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
            darkTheme ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <form onSubmit={handleSubmit} className="p-6">
              <h3 className={`text-lg font-bold mb-4 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                {userReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>

              {/* Rating */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rating *
                </label>
                <StarRating 
                  rating={formData.rating}
                  interactive={true}
                  onRatingChange={(rating) => setFormData({...formData, rating})}
                  size="lg"
                />
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    darkTheme
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Write a catchy title..."
                />
              </div>

              {/* Review Text */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your Review (optional)
                </label>
                <textarea
                  value={formData.review_text}
                  onChange={(e) => setFormData({...formData, review_text: e.target.value})}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none ${
                    darkTheme
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Share your thoughts about this content..."
                />
              </div>

              {/* Spoiler Warning */}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.contains_spoilers}
                    onChange={(e) => setFormData({...formData, contains_spoilers: e.target.checked})}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className={`text-sm ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    This review contains spoilers
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWriteReview(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkTheme
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || formData.rating === 0}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200"
                  >
                    {submitting ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
                  </button>
                </div>
                
                {userReview && (
                  <button
                    type="button"
                    onClick={deleteReview}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const ReviewCard = ({ review }) => {
    const [showFullReview, setShowFullReview] = useState(false);
    const reviewText = review.review_text || '';
    const isLongReview = reviewText.length > 300;
    const displayText = showFullReview || !isLongReview ? reviewText : reviewText.substring(0, 300) + '...';

    const handleVote = async (helpful) => {
      try {
        const token = localStorage.getItem('user_token');
        if (!token) {
          alert('Please sign in to vote on reviews');
          return;
        }

        await axios.post(`${API}/reviews/${review.id}/vote`, 
          { helpful },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        fetchReviews(); // Refresh to show updated vote counts
      } catch (error) {
        if (error.response?.status === 400) {
          alert('You have already voted on this review');
        } else {
          alert('Failed to vote on review');
        }
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${
        darkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              darkTheme ? 'bg-red-600' : 'bg-red-500'
            }`}>
              {review.user?.avatar_url ? (
                <img src={review.user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {review.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {review.user?.username || 'Anonymous'}
                </span>
                {review.user?.is_verified && (
                  <svg className="h-4 w-4 text-blue-500 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                {new Date(review.created_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>

        {/* Review Title */}
        {review.title && (
          <h4 className={`font-semibold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            {review.title}
          </h4>
        )}

        {/* Review Text */}
        {reviewText && (
          <div className="mb-3">
            {review.contains_spoilers && (
              <div className="mb-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  ⚠️ Contains Spoilers
                </span>
              </div>
            )}
            <p className={`${darkTheme ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {displayText}
            </p>
            {isLongReview && (
              <button
                onClick={() => setShowFullReview(!showFullReview)}
                className="text-red-500 text-sm font-medium mt-1 hover:underline"
              >
                {showFullReview ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Vote Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleVote(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
              darkTheme
                ? 'text-gray-400 hover:text-green-400 hover:bg-gray-800'
                : 'text-gray-600 hover:text-green-600 hover:bg-gray-100'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9.5 8.5v11.5a2 2 0 002 2h.5a2 2 0 002-2v-5z" />
            </svg>
            Helpful ({review.helpful_votes || 0})
          </button>
          <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
            {review.total_votes || 0} total votes
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {contentRating && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl ${darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <div className="text-center">
              <div className={`text-5xl font-bold mb-2 ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                {contentRating.average_rating.toFixed(1)}
              </div>
              <StarRating rating={contentRating.average_rating} size="lg" />
              <div className={`text-sm mt-2 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Based on {contentRating.total_reviews} review{contentRating.total_reviews !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <RatingDistribution />
        </div>
      )}

      {/* Write Review Button */}
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
          Reviews ({totalReviews})
        </h3>
        <button
          onClick={() => setShowWriteReview(true)}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
        >
          {userReview ? 'Edit Your Review' : 'Write a Review'}
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`animate-pulse p-4 rounded-lg ${
              darkTheme ? 'bg-gray-900 border border-gray-800' : 'bg-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-current opacity-20 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-current opacity-20 rounded w-1/4" />
                  <div className="h-3 bg-current opacity-20 rounded w-1/6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-current opacity-20 rounded" />
                <div className="h-4 bg-current opacity-20 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className={`text-center py-16 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
          </svg>
          <p className="text-lg font-medium mb-2">No reviews yet</p>
          <p className="text-sm">Be the first to share your thoughts about this content</p>
        </div>
      )}

      {/* Pagination */}
      {totalReviews > 10 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          <span className={`px-4 py-2 ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
            Page {currentPage} of {Math.ceil(totalReviews / 10)}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= Math.ceil(totalReviews / 10)}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Write Review Modal */}
      {showWriteReview && <WriteReviewModal />}
    </div>
  );
};

export default ReviewSystem;