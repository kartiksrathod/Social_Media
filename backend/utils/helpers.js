/**
 * Extract hashtags from text
 * @param {String} text - Post text
 * @returns {Array<String>} Array of unique hashtags (lowercase)
 */
const extractHashtags = (text) => {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex) || [];
  const hashtags = matches.map(tag => tag.substring(1).toLowerCase());
  return [...new Set(hashtags)]; // Return unique hashtags
};

/**
 * Extract mentions (@username) from text
 * @param {String} text - Post text
 * @returns {Array<String>} Array of unique mentions (lowercase usernames without @)
 */
const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex) || [];
  const mentions = matches.map(mention => mention.substring(1).toLowerCase());
  return [...new Set(mentions)]; // Return unique mentions
};

/**
 * Convert post to public format with additional metadata
 * @param {Object} post - Post document
 * @param {String} currentUserId - Current user ID
 * @param {Array<String>} savedPosts - Array of saved post IDs
 * @param {Object} originalPost - Original post if this is a repost
 * @returns {Object} Post in public format
 */
const postToPublic = (post, currentUserId = null, savedPosts = [], originalPost = null) => {
  const postObj = post.toObject ? post.toObject() : post;
  
  // Calculate reaction counts
  const reactions = postObj.reactions || [];
  const reactionCounts = {
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    angry: 0
  };
  
  reactions.forEach(reaction => {
    if (reactionCounts.hasOwnProperty(reaction.type)) {
      reactionCounts[reaction.type]++;
    }
  });

  // Find current user's reaction
  const userReaction = currentUserId 
    ? reactions.find(r => r.user_id === currentUserId) 
    : null;
  
  const result = {
    ...postObj,
    likes_count: postObj.likes ? postObj.likes.length : 0,
    comments_count: postObj.comments ? postObj.comments.length : 0,
    is_liked: currentUserId && postObj.likes ? postObj.likes.includes(currentUserId) : false,
    is_saved: savedPosts.includes(postObj.id),
    repost_count: postObj.repost_count || 0,
    reactions_count: reactions.length,
    reaction_counts: reactionCounts,
    user_reaction: userReaction ? userReaction.type : null
  };

  // If this is a repost and we have the original post, include it
  if (postObj.is_repost && originalPost) {
    const originalPostObj = originalPost.toObject ? originalPost.toObject() : originalPost;
    
    // Calculate reactions for original post too
    const originalReactions = originalPostObj.reactions || [];
    const originalReactionCounts = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0
    };
    
    originalReactions.forEach(reaction => {
      if (originalReactionCounts.hasOwnProperty(reaction.type)) {
        originalReactionCounts[reaction.type]++;
      }
    });

    const originalUserReaction = currentUserId 
      ? originalReactions.find(r => r.user_id === currentUserId) 
      : null;

    result.original_post = {
      id: originalPostObj.id,
      author_id: originalPostObj.author_id,
      author_username: originalPostObj.author_username,
      author_avatar: originalPostObj.author_avatar,
      text: originalPostObj.text,
      image_url: originalPostObj.image_url,
      images: originalPostObj.images,
      video_url: originalPostObj.video_url,
      created_at: originalPostObj.created_at,
      likes_count: originalPostObj.likes ? originalPostObj.likes.length : 0,
      comments_count: originalPostObj.comments ? originalPostObj.comments.length : 0,
      repost_count: originalPostObj.repost_count || 0,
      reactions_count: originalReactions.length,
      reaction_counts: originalReactionCounts,
      user_reaction: originalUserReaction ? originalUserReaction.type : null
    };
  }

  return result;
};

module.exports = {
  extractHashtags,
  extractMentions,
  postToPublic
};
