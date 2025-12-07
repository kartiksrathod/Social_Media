import React, { useState, useEffect } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { postsAPI } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import LazyImage from '../ui/lazy-image';
import { getAvatarUrl } from '../../lib/imageOptimizer';

const CommentList = ({ postId, commentCount, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, postId]);

  const loadComments = async () => {
    try {
      const response = await postsAPI.getComments(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await postsAPI.addComment(postId, newComment);
      setComments([response.data, ...comments]);
      setNewComment('');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await postsAPI.deleteComment(postId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="border-t dark:border-gray-700">
      <button
        onClick={() => setShowComments(!showComments)}
        className="w-full px-4 py-3 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">
          {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
        </span>
      </button>

      {showComments && (
        <div className="px-4 pb-4 space-y-4">
          {/* Add Comment */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Post
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <LazyImage
                    src={getAvatarUrl(comment.avatar || `https://ui-avatars.com/api/?name=${comment.username}&background=random`, 32)}
                    alt={comment.username}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    width={32}
                    height={32}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.username}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{comment.text}</p>
                    </div>
                    {comment.user_id === currentUser.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="mt-1 ml-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentList;