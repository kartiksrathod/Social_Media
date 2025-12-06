import React, { useState, useEffect, useCallback } from 'react';
import { X, MessageCircle, ArrowUpDown, Loader2 } from 'lucide-react';
import { commentsAPI } from '../../lib/api';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import { useSocket } from '../../contexts/SocketContext';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const CommentSection = ({ postId, onClose, initialCommentCount = 0, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(initialCommentCount);
  // Load saved sort preference from localStorage, default to 'newest'
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('commentSortPreference') || 'newest';
  });
  const limit = 20;
  const { socket } = useSocket();
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_replied', label: 'Most Replied' },
  ];

  useEffect(() => {
    loadComments();
  }, [postId, sortBy]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Join post room for real-time updates
    socket.emit('join_post_room', postId);

    // Listen for new comments
    socket.on('new_comment', (data) => {
      if (data.comment.post_id === postId && !data.parent_comment_id) {
        setComments(prev => [data.comment, ...prev]);
        setTotal(prev => {
          const newTotal = prev + 1;
          if (onCommentCountChange) onCommentCountChange(newTotal);
          return newTotal;
        });
      }
    });

    // Listen for edited comments
    socket.on('edit_comment', (data) => {
      if (data.comment.post_id === postId) {
        setComments(prev => prev.map(c => 
          c.id === data.comment.id ? data.comment : c
        ));
      }
    });

    // Listen for deleted comments
    socket.on('delete_comment', (data) => {
      if (data.is_soft_delete) {
        // Soft delete - update comment text to [deleted]
        setComments(prev => prev.map(c => 
          c.id === data.comment_id 
            ? { ...c, text: '[deleted]', username: '[deleted]', avatar: null }
            : c
        ));
      } else {
        // Hard delete - remove from list
        setComments(prev => prev.filter(c => c.id !== data.comment_id));
        setTotal(prev => {
          const newTotal = Math.max(0, prev - 1);
          if (onCommentCountChange) onCommentCountChange(newTotal);
          return newTotal;
        });
      }
    });

    // Listen for comment reactions
    socket.on('comment_reaction', (data) => {
      setComments(prev => prev.map(c => {
        if (c.id === data.comment_id) {
          const reactionSummary = {};
          data.reactions.forEach(r => {
            reactionSummary[r.type] = (reactionSummary[r.type] || 0) + 1;
          });
          const userReaction = data.reactions.find(r => r.user_id === currentUser.id);
          return {
            ...c,
            reactions: data.reactions,
            reaction_summary: reactionSummary,
            user_reaction: userReaction ? userReaction.type : null
          };
        }
        return c;
      }));
    });

    return () => {
      socket.off('new_comment');
      socket.off('edit_comment');
      socket.off('delete_comment');
      socket.off('comment_reaction');
      socket.emit('leave_post_room', postId);
    };
  }, [socket, postId, currentUser.id]);

  const loadComments = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const currentOffset = isLoadMore ? offset : 0;
      const response = await commentsAPI.getPostComments(postId, limit, currentOffset, sortBy);
      const newComments = response.data.comments || [];
      
      if (isLoadMore) {
        setComments(prev => [...prev, ...newComments]);
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
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadComments(true);
    }
  }, [loadingMore, hasMore, offset]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  const handleSortChange = (value) => {
    setSortBy(value);
    // Save sort preference to localStorage
    localStorage.setItem('commentSortPreference', value);
    setOffset(0);
    setComments([]);
  };

  const handleAddComment = async (text) => {
    try {
      const response = await commentsAPI.create({
        post_id: postId,
        text: text
      });
      
      // Add new comment to the beginning
      setComments([response.data, ...comments]);
      const newTotal = total + 1;
      setTotal(newTotal);
      if (onCommentCountChange) onCommentCountChange(newTotal);
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
    const newTotal = Math.max(0, total - 1);
    setTotal(newTotal);
    if (onCommentCountChange) onCommentCountChange(newTotal);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold">
              Comments {total > 0 && `(${total})`}
            </h2>
            
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 sm:h-10 gap-1.5 min-w-[44px] touch-manipulation">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">
                    {sortOptions.find(opt => opt.value === sortBy)?.label}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sortOptions.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={sortBy === option.value ? 'bg-accent' : ''}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Add Comment Input */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-700">
          <CommentInput
            onSubmit={handleAddComment}
            placeholder="Write a comment..."
          />
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6 overscroll-contain">
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