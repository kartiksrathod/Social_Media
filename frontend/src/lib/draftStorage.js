/**
 * Draft Storage Utility
 * Manages post drafts in localStorage with auto-cleanup
 */

const DRAFT_KEY = 'post_draft';
const DRAFT_MAX_AGE_DAYS = 7;

/**
 * Save a post draft to localStorage
 * @param {Object} draft - Draft data
 * @param {string} draft.text - Post text
 * @param {string} draft.visibility - Post visibility (public/close_friends)
 * @param {Array} draft.imagePreviews - Array of image preview URLs (data URLs)
 * @param {Array} draft.uploadedImageUrls - Array of uploaded image URLs
 * @param {Array} draft.imageTags - Array of image tags
 * @param {string} draft.videoPreview - Video preview URL (data URL)
 * @param {Object} draft.collaborator - Collaborator data
 */
export function saveDraft(draft) {
  try {
    const draftData = {
      ...draft,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    return true;
  } catch (error) {
    console.error('Error saving draft:', error);
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Clearing old drafts...');
      cleanupOldDrafts(0); // Clear all drafts if storage is full
    }
    return false;
  }
}

/**
 * Load a post draft from localStorage
 * @returns {Object|null} Draft data or null if no draft exists
 */
export function loadDraft() {
  try {
    const draftJson = localStorage.getItem(DRAFT_KEY);
    if (!draftJson) return null;
    
    const draft = JSON.parse(draftJson);
    
    // Check if draft is too old
    const age = getDraftAge(draft.timestamp);
    if (age > DRAFT_MAX_AGE_DAYS) {
      deleteDraft();
      return null;
    }
    
    return draft;
  } catch (error) {
    console.error('Error loading draft:', error);
    // Clear corrupted draft
    deleteDraft();
    return null;
  }
}

/**
 * Delete the current draft
 */
export function deleteDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}

/**
 * Get the age of a draft in days
 * @param {number} timestamp - Draft timestamp
 * @returns {number} Age in days
 */
export function getDraftAge(timestamp) {
  if (!timestamp) return Infinity;
  const now = Date.now();
  const ageMs = now - timestamp;
  return ageMs / (1000 * 60 * 60 * 24);
}

/**
 * Clean up old drafts
 * @param {number} maxAgeDays - Maximum age in days (default: 7)
 */
export function cleanupOldDrafts(maxAgeDays = DRAFT_MAX_AGE_DAYS) {
  try {
    const draft = loadDraft();
    if (draft) {
      const age = getDraftAge(draft.timestamp);
      if (age > maxAgeDays) {
        deleteDraft();
        console.log(`Cleaned up draft older than ${maxAgeDays} days`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up drafts:', error);
  }
}

/**
 * Check if a draft exists
 * @returns {boolean}
 */
export function hasDraft() {
  const draft = loadDraft();
  return draft !== null && (draft.text?.trim() || draft.imagePreviews?.length > 0 || draft.videoPreview);
}

/**
 * Get formatted time since draft was saved
 * @param {number} timestamp - Draft timestamp
 * @returns {string} Formatted time string
 */
export function getTimeSinceDraft(timestamp) {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
