import React, { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { commentsAPI } from '../../lib/api';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';

const CommentSection = ({ postId, onClose, initialCommentCount = 0 }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(initialCommentCount);
  const limit = 20;
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentOffset = loadMore ? offset : 0;
      const response = await commentsAPI.getPostComments(postId, limit, currentOffset);
      const newComments = response.data.comments || [];
      
      if (loadMore) {
        setComments([...comments, ...newComments]);
      } else {
        setComments(newComments);
      }
      
      setTotal(response.data.total || 0);
      setOffset(currentOffset + newComments.length);
      setHasMore(currentOffset + newComments.length < (response.data.total || 0));
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (text) => {
    try {
      const response = await commentsAPI.create({
        post_id: postId,
        text: text
      });
      
      // Add new comment to the beginning
      setComments([response.data, ...comments]);
      setTotal(total + 1);
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  };

  const handleUpdateComment = (updatedComment) => {
    setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
  };

  const handleDeleteComment = (commentId) => {
    setComments(comments.filter(c => c.id !== commentId));
    setTotal(Math.max(0, total - 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">
              Comments {total > 0 && `(${total})`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Add Comment Input */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <CommentInput
            onSubmit={handleAddComment}
            placeholder="Write a comment..."
          />
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading && comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-4">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No comments yet. Be the first to comment!
              </p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={() => loadComments(true)}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more comments'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;