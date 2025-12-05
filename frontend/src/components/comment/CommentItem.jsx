import React, { useState } from 'react';
import { MessageCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { commentsAPI } from '../../lib/api';
import CommentInput from './CommentInput';
import CommentReplies from './CommentReplies';
import ReactionButton from '../post/ReactionButton';
import { useNavigate } from 'react-router-dom';

const CommentItem = ({ comment, currentUser, onUpdate, onDelete }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [userReaction, setUserReaction] = useState(comment.user_reaction || null);
  const [reactionCounts, setReactionCounts] = useState(comment.reaction_summary || {});

  const isOwnComment = currentUser?.id === comment.user_id;
  const isDeleted = comment.text === '[deleted]';

  // Render text with mentions as clickable links
  const renderTextWithMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add mention as clickable link
      const username = match[1];
      parts.push(
        <span
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${username}`);
          }}
          className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-medium"
        >
          @{username}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const handleReact = async (reactionType) => {
    // Optimistic update
    const prevReaction = userReaction;
    const prevCounts = { ...reactionCounts };

    if (prevReaction) {
      setReactionCounts(prev => ({
        ...prev,
        [prevReaction]: Math.max(0, (prev[prevReaction] || 0) - 1)
      }));
    }

    if (prevReaction === reactionType) {
      // Removing reaction
      setUserReaction(null);
    } else {
      // Adding/changing reaction
      setUserReaction(reactionType);
      setReactionCounts(prev => ({
        ...prev,
        [reactionType]: (prev[reactionType] || 0) + 1
      }));
    }

    try {
      const response = await commentsAPI.react(comment.id, reactionType);
      setReactionCounts(response.data.reaction_summary || {});
      setUserReaction(response.data.user_reaction);
    } catch (error) {
      console.error('Failed to react to comment:', error);
      // Revert on error
      setUserReaction(prevReaction);
      setReactionCounts(prevCounts);
    }
  };

  const handleRemoveReaction = async () => {
    const prevReaction = userReaction;
    const prevCounts = { ...reactionCounts };

    // Optimistic update
    if (prevReaction) {
      setReactionCounts(prev => ({
        ...prev,
        [prevReaction]: Math.max(0, (prev[prevReaction] || 0) - 1)
      }));
    }
    setUserReaction(null);

    try {
      const response = await commentsAPI.removeReaction(comment.id, prevReaction);
      setReactionCounts(response.data.reaction_summary || {});
      setUserReaction(null);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      // Revert on error
      setUserReaction(prevReaction);
      setReactionCounts(prevCounts);
    }
  };

  const handleEdit = async (text) => {
    try {
      const response = await commentsAPI.update(comment.id, text);
      onUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    
    try {
      await commentsAPI.delete(comment.id);
      onDelete(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReplySubmit = async (text) => {
    try {
      await commentsAPI.create({
        post_id: comment.post_id,
        text: text,
        parent_comment_id: comment.id
      });
      setShowReplyInput(false);
      setShowReplies(true);
      // Notify parent to refresh
      if (onUpdate) {
        onUpdate({ ...comment, reply_count: (comment.reply_count || 0) + 1 });
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      throw error;
    }
  };

  if (isDeleted) {
    return (
      <div className="flex gap-3 opacity-60">
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">[deleted]</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <img
          src={comment.avatar || `https://ui-avatars.com/api/?name=${comment.username}&background=random`}
          alt={comment.username}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <CommentInput
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              initialValue={comment.text}
              autoFocus
              buttonText="Save"
            />
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {comment.is_edited && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">(edited)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                    {renderTextWithMentions(comment.text)}
                  </p>
                </div>
                
                {isOwnComment && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!isEditing && (
            <div className="flex items-center gap-3 mt-1 ml-2">
              <ReactionButton
                userReaction={userReaction}
                reactionCounts={reactionCounts}
                onReact={handleReact}
                onRemoveReaction={handleRemoveReaction}
              />
              
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-purple-500 transition-colors px-2 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Reply</span>
              </button>
              
              {comment.reply_count > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {showReplies ? 'Hide' : 'View'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showReplyInput && (
        <div className="ml-11">
          <CommentInput
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyInput(false)}
            placeholder="Write a reply..."
            autoFocus
            replyingTo={comment.username}
          />
        </div>
      )}
      
      {showReplies && comment.reply_count > 0 && (
        <div className="ml-11">
          <CommentReplies commentId={comment.id} postId={comment.post_id} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
};

export default CommentItem;