import { setupCache } from 'axios-cache-adapter';

/**
 * Request Caching Configuration
 * - Caches GET requests to reduce server load
 * - Configurable TTL per endpoint
 * - In-memory storage (can be upgraded to IndexedDB)
 */

// Create cache adapter with optimized settings
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
  // Respect cache headers from server if present
  ignoreCache: false,
  // Cache key customization for better hit rates
  key: req => {
    const url = req.url || '';
    const params = req.params ? JSON.stringify(req.params) : '';
    return url + params;
  },
  // Invalidate on error
  invalidate: async (config, request) => {
    if (request.response?.status >= 400) {
      await cache.store.removeItem(config.uuid);
    }
  },
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Cache configuration for different endpoint types
 * Optimized for social media app usage patterns
 */
export const cacheConfig = {
  // Static data - cache for 1 hour
  static: {
    cache: {
      maxAge: 60 * 60 * 1000, // 1 hour
      ignoreCache: false,
    },
  },
  
  // User profiles - cache for 10 minutes (frequently viewed)
  profile: {
    cache: {
      maxAge: 10 * 60 * 1000, // 10 minutes
      ignoreCache: false,
    },
  },
  
  // Feed data - cache for 1 minute (balance between freshness and performance)
  feed: {
    cache: {
      maxAge: 60 * 1000, // 1 minute
      ignoreCache: false,
    },
  },
  
  // Explore/Discovery - cache for 3 minutes
  explore: {
    cache: {
      maxAge: 3 * 60 * 1000, // 3 minutes
      ignoreCache: false,
    },
  },
  
  // Notifications - cache for 15 seconds (needs to be fresh)
  notifications: {
    cache: {
      maxAge: 15 * 1000, // 15 seconds
      ignoreCache: false,
    },
  },
  
  // Trending hashtags - cache for 10 minutes
  trending: {
    cache: {
      maxAge: 10 * 60 * 1000, // 10 minutes
      ignoreCache: false,
    },
  },
  
  // User suggestions - cache for 30 minutes (static recommendations)
  suggestions: {
    cache: {
      maxAge: 30 * 60 * 1000, // 30 minutes
      ignoreCache: false,
    },
  },
  
  // Search results - cache for 5 minutes
  search: {
    cache: {
      maxAge: 5 * 60 * 1000, // 5 minutes
      ignoreCache: false,
    },
  },
  
  // No cache for real-time data
  noCache: {
    cache: {
      maxAge: 0,
      ignoreCache: true,
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
