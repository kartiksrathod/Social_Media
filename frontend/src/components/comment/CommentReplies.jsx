import React, { useState, useEffect } from 'react';
import { commentsAPI } from '../../lib/api';
import CommentItem from './CommentItem';

const CommentReplies = ({ commentId, postId, currentUser }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReplies();
  }, [commentId]);

  const loadReplies = async () => {
    try {
      setLoading(true);
      const response = await commentsAPI.getReplies(commentId);
      setReplies(response.data.replies || []);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReply = (updatedReply) => {
    setReplies(replies.map(r => r.id === updatedReply.id ? updatedReply : r));
  };

  const handleDeleteReply = (replyId) => {
    setReplies(replies.filter(r => r.id !== replyId));
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        Loading replies...
      </div>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={{ ...reply, post_id: postId }}
          currentUser={currentUser}
          onUpdate={handleUpdateReply}
          onDelete={handleDeleteReply}
        />
      ))}
    </div>
  );
};

export default CommentReplies;