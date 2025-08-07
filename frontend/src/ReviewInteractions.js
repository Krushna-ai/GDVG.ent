import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReviewInteractions = ({ reviewId, darkTheme, initialLikeCount = 0, initialCommentCount = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reviewId) {
      checkLikeStatus();
    }
  }, [reviewId]);

  useEffect(() => {
    if (showComments && reviewId) {
      fetchComments();
    }
  }, [showComments, reviewId]);

  const checkLikeStatus = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      // For now, we'll assume not liked - in a full implementation,
      // you'd check if the current user has liked this review
      setLiked(false);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        alert('Please sign in to like reviews');
        return;
      }

      const response = await axios.post(`${API}/reviews/${reviewId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.liked) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error liking review:', error);
      if (error.response?.status === 401) {
        alert('Please sign in to like reviews');
      } else {
        alert('Failed to like review');
      }
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/reviews/${reviewId}/comments`);
      setComments(response.data.comment_threads || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        alert('Please sign in to comment on reviews');
        return;
      }

      await axios.post(`${API}/reviews/${reviewId}/comments`, {
        review_id: reviewId,
        comment_text: newComment.trim(),
        parent_comment_id: replyingTo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewComment('');
      setReplyingTo(null);
      setCommentCount(prev => prev + 1);
      
      // Refresh comments
      if (showComments) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 401) {
        alert('Please sign in to comment on reviews');
      } else {
        alert('Failed to add comment');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('user_token');
      await axios.delete(`${API}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCommentCount(prev => Math.max(0, prev - 1));
      
      // Refresh comments
      if (showComments) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const CommentThread = ({ thread }) => {
    const { comment, replies } = thread;

    return (
      <div className="space-y-3">
        {/* Parent Comment */}
        <div className={`p-3 rounded-lg ${
          darkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              darkTheme ? 'bg-red-600' : 'bg-red-500'
            }`}>
              {comment.user?.avatar_url ? (
                <img src={comment.user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white font-semibold text-xs">
                  {comment.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium text-sm ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {comment.user?.username}
                </span>
                {comment.user?.is_verified && (
                  <svg className="h-3 w-3 text-blue-500 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
                <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <p className={`text-sm ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {comment.comment_text}
              </p>
              
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className={`text-xs hover:underline ${
                    darkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Reply
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="ml-8 space-y-2">
            {replies.map((reply) => (
              <div key={reply.id} className={`p-3 rounded-lg ${
                darkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    darkTheme ? 'bg-red-600' : 'bg-red-500'
                  }`}>
                    {reply.user?.avatar_url ? (
                      <img src={reply.user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-white font-semibold text-xs">
                        {reply.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-xs ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
                        {reply.user?.username}
                      </span>
                      <span className={`text-xs ${darkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className={`text-xs ${darkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      {reply.comment_text}
                    </p>
                    
                    <button
                      onClick={() => handleDeleteComment(reply.id)}
                      className="text-xs text-red-500 hover:underline mt-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            liked
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : darkTheme
                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'
          }`}
        >
          <svg className="h-4 w-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{liked ? 'Liked' : 'Like'}</span>
          {likeCount > 0 && <span>({likeCount})</span>}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            darkTheme
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{showComments ? 'Hide Comments' : 'Comments'}</span>
          {commentCount > 0 && <span>({commentCount})</span>}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={`border-t pt-4 ${darkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Add Comment */}
          <div className="mb-4">
            {replyingTo && (
              <div className={`text-sm mb-2 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                Replying to comment...{' '}
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-red-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                rows={2}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm ${
                  darkTheme
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                Post
              </button>
            </div>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`animate-pulse p-3 rounded-lg ${
                  darkTheme ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-current opacity-20 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-current opacity-20 rounded w-1/4" />
                      <div className="h-3 bg-current opacity-20 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((thread, index) => (
                <CommentThread key={index} thread={thread} />
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${darkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <svg className="mx-auto h-8 w-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to share your thoughts</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewInteractions;