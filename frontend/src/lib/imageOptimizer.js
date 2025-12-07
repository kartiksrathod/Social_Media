/**
 * Image Optimization Utilities
 * - Cloudinary CDN transformations
 * - WebP format support with fallbacks
 * - Responsive image generation
 * - Quality optimization
 */

/**
 * Optimize Cloudinary image URL with transformations
 * @param {string} url - Original image URL
 * @param {object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const optimizeCloudinaryImage = (url, options = {}) => {
  if (!url) return '';
  
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
    return url;
  }

  const {
    width = 'auto',
    height,
    quality = 'auto:good', // Enhanced quality setting
    format = 'auto', // auto will serve WebP to supported browsers
    crop = 'fill',
    gravity = 'auto',
    dpr = 'auto', // Device pixel ratio for retina displays
  } = options;

  // Build transformation string with performance optimizations
  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (dpr) transformations.push(`dpr_${dpr}`);
  
  // Add progressive loading for better perceived performance
  transformations.push('fl_progressive');
  
  // Add lossy compression for better file size
  transformations.push('fl_lossy');

  const transformString = transformations.join(',');

  // Insert transformations into Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  const urlParts = url.split('/upload/');
  if (urlParts.length === 2) {
    return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
  }

  return url;
};

/**
 * Get responsive image URLs for different screen sizes
 * @param {string} url - Original image URL
 * @param {array} sizes - Array of widths [320, 640, 1024, 1920]
 * @returns {object} Object with srcset and sizes
 */
export const getResponsiveImageUrls = (url, sizes = [320, 640, 1024, 1920]) => {
  if (!url) return { srcset: '', sizes: '' };

  const srcset = sizes
    .map((width) => {
      const optimizedUrl = optimizeCloudinaryImage(url, {
        width,
        quality: 'auto',
        format: 'auto',
      });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');

  const sizesAttr = [
    '(max-width: 640px) 320px',
    '(max-width: 1024px) 640px',
    '(max-width: 1920px) 1024px',
    '1920px',
  ].join(', ');

  return { srcset, sizes: sizesAttr };
};

/**
 * Generate thumbnail URL
 * @param {string} url - Original image URL
 * @param {number} size - Thumbnail size
 * @returns {string} Thumbnail URL
 */
export const getThumbnail = (url, size = 150) => {
  return optimizeCloudinaryImage(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    gravity: 'auto',
  });
};

/**
 * Generate avatar URL with circular crop
 * @param {string} url - Original image URL
 * @param {number} size - Avatar size
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (url, size = 200) => {
  return optimizeCloudinaryImage(url, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    format: 'auto',
  });
};

/**
 * Generate optimized URL for post images
 * @param {string} url - Original image URL
 * @param {string} size - Size preset ('thumbnail', 'medium', 'large', 'full')
 * @returns {string} Optimized URL
 */
export const getPostImageUrl = (url, size = 'medium') => {
  const sizeMap = {
    thumbnail: { width: 300, quality: 'auto:low' },
    medium: { width: 800, quality: 'auto:good' },
    large: { width: 1200, quality: 'auto:good' },
    full: { width: 1920, quality: 'auto:best' },
  };

  const options = sizeMap[size] || sizeMap.medium;
  
  return optimizeCloudinaryImage(url, {
    ...options,
    format: 'auto',
    crop: 'limit', // Don't upscale
    dpr: 'auto', // Support retina displays
  });
};

/**
 * Check if browser supports WebP
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.width === 1);
    image.onerror = () => resolve(false);
    image.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
};

/**
 * Preload critical images
 * @param {array} urls - Array of image URLs to preload
 */
export const preloadImages = (urls = []) => {
  if (typeof window === 'undefined') return;
  
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Get optimized image URL with all enhancements
 * Main function to use throughout the app
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return '';
  
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    type = 'post', // 'post', 'avatar', 'thumbnail'
  } = options;

  // Type-specific optimization
  if (type === 'avatar') {
    return getAvatarUrl(url, width || 200);
  }
  
  if (type === 'thumbnail') {
    return getThumbnail(url, width || 150);
  }

  // General optimization
  return optimizeCloudinaryImage(url, {
    width,
    height,
    quality,
    format,
    crop: 'fill',
    gravity: 'auto',
  });
};
