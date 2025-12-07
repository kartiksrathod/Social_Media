import { setupCache } from 'axios-cache-adapter';

/**
 * Request Caching Configuration
 * - Caches GET requests to reduce server load
 * - Configurable TTL per endpoint
 * - In-memory storage (can be upgraded to IndexedDB)
 */

// Create cache adapter
export const cache = setupCache({
  maxAge: 5 * 60 * 1000, // Default: 5 minutes
  exclude: {
    // Don't cache these methods
    methods: ['post', 'patch', 'put', 'delete'],
    // Don't cache these endpoints
    query: false,
  },
  // Store in memory (fastest)
  store: 'memory',
  // Ignore cache headers from server
  ignoreCache: false,
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Cache configuration for different endpoint types
 */
export const cacheConfig = {
  // Static data - cache for 1 hour
  static: {
    cache: {
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  },
  
  // User profiles - cache for 10 minutes
  profile: {
    cache: {
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  },
  
  // Feed data - cache for 2 minutes
  feed: {
    cache: {
      maxAge: 2 * 60 * 1000, // 2 minutes
    },
  },
  
  // Notifications - cache for 30 seconds
  notifications: {
    cache: {
      maxAge: 30 * 1000, // 30 seconds
    },
  },
  
  // Trending hashtags - cache for 5 minutes
  trending: {
    cache: {
      maxAge: 5 * 60 * 1000, // 5 minutes
    },
  },
  
  // User suggestions - cache for 15 minutes
  suggestions: {
    cache: {
      maxAge: 15 * 60 * 1000, // 15 minutes
    },
  },
  
  // No cache for real-time data
  noCache: {
    cache: {
      maxAge: 0,
    },
  },
};

/**
 * Clear cache for specific endpoint or all
 * @param {string} endpoint - Optional specific endpoint to clear
 */
export const clearCache = async (endpoint = null) => {
  if (endpoint) {
    await cache.store.removeItem(endpoint);
  } else {
    await cache.store.clear();
  }
};

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export const getCacheStats = async () => {
  const keys = await cache.store.keys();
  return {
    totalEntries: keys.length,
    keys,
  };
};

/**
 * Invalidate cache for user-related endpoints after mutations
 */
export const invalidateUserCache = async (userId) => {
  const keys = await cache.store.keys();
  const userKeys = keys.filter(key => key.includes(`/users/${userId}`) || key.includes('/users/me'));
  
  for (const key of userKeys) {
    await cache.store.removeItem(key);
  }
};

/**
 * Invalidate cache for post-related endpoints after mutations
 */
export const invalidatePostCache = async (postId = null) => {
  const keys = await cache.store.keys();
  
  if (postId) {
    const postKeys = keys.filter(key => key.includes(`/posts/${postId}`));
    for (const key of postKeys) {
      await cache.store.removeItem(key);
    }
  } else {
    // Invalidate all post-related caches
    const postKeys = keys.filter(key => 
      key.includes('/posts/feed') || 
      key.includes('/posts/explore') ||
      key.includes('/posts/saved')
    );
    for (const key of postKeys) {
      await cache.store.removeItem(key);
    }
  }
};

export default cache;
