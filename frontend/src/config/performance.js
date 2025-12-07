/**
 * Performance Configuration
 * 
 * Central configuration for performance optimizations
 */

export const PERFORMANCE_CONFIG = {
  // Virtual scrolling configuration
  ENABLE_VIRTUAL_SCROLLING: true, // Automatically enabled for feeds with 100+ posts
  VIRTUAL_SCROLL_OVERSCAN: 400, // Pixels to render outside viewport
  VIRTUAL_SCROLL_INCREASE_VIEWPORT: { top: 800, bottom: 800 },

  // Post management
  MAX_POSTS_IN_DOM: 50, // Maximum posts to keep in DOM (if virtual scrolling disabled)
  POSTS_PER_PAGE: 10, // Number of posts to load per request

  // Image optimization
  LAZY_LOAD_THRESHOLD: '200px', // Distance from viewport to start loading
  IMAGE_QUALITY: {
    avatar: 85,
    post: 85,
    thumbnail: 80
  },

  // Scroll behavior
  SCROLL_THROTTLE: 16, // ~60fps (16ms)
  SCROLL_DEBOUNCE: 150,
  INFINITE_SCROLL_THRESHOLD: 200, // Pixels from bottom to trigger load

  // Cache settings
  API_CACHE_TTL: {
    feed: 60000, // 1 minute
    profile: 600000, // 10 minutes
    trending: 600000, // 10 minutes
    suggestions: 1800000, // 30 minutes
    static: 3600000 // 1 hour
  },

  // Re-render optimization
  ENABLE_MEMO: true, // Use React.memo for components
  ENABLE_CALLBACK_OPTIMIZATION: true, // Use useCallback/useMemo

  // Mobile optimizations
  MOBILE_BREAKPOINT: 768,
  ENABLE_PULL_TO_REFRESH: true,
  ENABLE_SWIPE_GESTURES: true,

  // Development
  DEBUG_PERFORMANCE: false, // Log performance metrics
  SHOW_RENDER_COUNT: false // Show component render counts
};

/**
 * Check if device is mobile
 */
export function isMobileDevice() {
  return window.innerWidth < PERFORMANCE_CONFIG.MOBILE_BREAKPOINT;
}

/**
 * Check if virtual scrolling should be enabled based on post count
 */
export function shouldUseVirtualScrolling(postCount) {
  // Only enable virtual scrolling for very long feeds
  // For most users, the regular infinite scroll is sufficient
  return PERFORMANCE_CONFIG.ENABLE_VIRTUAL_SCROLLING && postCount > 100;
}

/**
 * Get optimal page size based on device
 */
export function getOptimalPageSize() {
  return isMobileDevice() ? 10 : 15;
}

/**
 * Throttle function for scroll events
 */
export function throttle(func, delay = PERFORMANCE_CONFIG.SCROLL_THROTTLE) {
  let timeoutId;
  let lastRan;

  return function (...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (Date.now() - lastRan >= delay) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, delay - (Date.now() - lastRan));
    }
  };
}

/**
 * Debounce function for search/input events
 */
export function debounce(func, delay = PERFORMANCE_CONFIG.SCROLL_DEBOUNCE) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Log performance metric (only in debug mode)
 */
export function logPerformance(metric, value) {
  if (PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) {
    console.log(`[Performance] ${metric}:`, value);
  }
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName, callback) {
  if (PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    console.log(`[Performance] ${componentName} render time: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return callback();
}
