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
  
  const result = {
    ...postObj,
    likes_count: postObj.likes ? postObj.likes.length : 0,
    comments_count: postObj.comments ? postObj.comments.length : 0,
    is_liked: currentUserId && postObj.likes ? postObj.likes.includes(currentUserId) : false,
    is_saved: savedPosts.includes(postObj.id),
    repost_count: postObj.repost_count || 0
  };

  // If this is a repost and we have the original post, include it
  if (postObj.is_repost && originalPost) {
    const originalPostObj = originalPost.toObject ? originalPost.toObject() : originalPost;
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
      repost_count: originalPostObj.repost_count || 0
    };
  }

  return result;
};

module.exports = {
  extractHashtags,
  extractMentions,
  postToPublic
};
