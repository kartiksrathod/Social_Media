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
 * @returns {Object} Post in public format
 */
const postToPublic = (post, currentUserId = null, savedPosts = []) => {
  const postObj = post.toObject ? post.toObject() : post;
  
  return {
    ...postObj,
    likes_count: postObj.likes ? postObj.likes.length : 0,
    comments_count: postObj.comments ? postObj.comments.length : 0,
    is_liked: currentUserId && postObj.likes ? postObj.likes.includes(currentUserId) : false,
    is_saved: savedPosts.includes(postObj.id)
  };
};

module.exports = {
  extractHashtags,
  postToPublic
};
