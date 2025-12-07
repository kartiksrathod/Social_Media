const sharp = require('sharp');

/**
 * Image compression configuration
 */
const CONFIG = {
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  JPEG_QUALITY: 85,
  PNG_QUALITY: 85,
  WEBP_QUALITY: 85,
  AVATAR_MAX_WIDTH: 500,
  AVATAR_MAX_HEIGHT: 500
};

/**
 * Process and compress image buffer
 * @param {Buffer} buffer - Image buffer from multer
 * @param {Object} options - Processing options
 * @param {String} options.type - Image type ('post', 'avatar', 'story')
 * @param {Number} options.maxWidth - Maximum width
 * @param {Number} options.maxHeight - Maximum height
 * @param {Number} options.quality - Compression quality (0-100)
 * @returns {Promise<{buffer: Buffer, format: String, width: Number, height: Number, size: Number}>}
 */
async function processImage(buffer, options = {}) {
  try {
    const {
      type = 'post',
      maxWidth = CONFIG.MAX_WIDTH,
      maxHeight = CONFIG.MAX_HEIGHT,
      quality = CONFIG.JPEG_QUALITY
    } = options;

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Validate file size
    if (buffer.length > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Image file too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Create sharp instance
    let image = sharp(buffer);

    // Calculate resize dimensions while maintaining aspect ratio
    let resizeWidth = metadata.width;
    let resizeHeight = metadata.height;

    if (type === 'avatar') {
      // For avatars, use smaller dimensions
      const avatarMax = Math.min(CONFIG.AVATAR_MAX_WIDTH, CONFIG.AVATAR_MAX_HEIGHT);
      if (resizeWidth > avatarMax || resizeHeight > avatarMax) {
        if (resizeWidth > resizeHeight) {
          resizeWidth = avatarMax;
          resizeHeight = Math.round((avatarMax / metadata.width) * metadata.height);
        } else {
          resizeHeight = avatarMax;
          resizeWidth = Math.round((avatarMax / metadata.height) * metadata.width);
        }
      }
    } else {
      // For posts and stories, use larger dimensions
      if (resizeWidth > maxWidth || resizeHeight > maxHeight) {
        if (resizeWidth > resizeHeight) {
          resizeWidth = maxWidth;
          resizeHeight = Math.round((maxWidth / metadata.width) * metadata.height);
        } else {
          resizeHeight = maxHeight;
          resizeWidth = Math.round((maxHeight / metadata.height) * metadata.width);
        }
      }
    }

    // Resize if necessary
    if (resizeWidth !== metadata.width || resizeHeight !== metadata.height) {
      image = image.resize(resizeWidth, resizeHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Determine output format and compression
    let outputBuffer;
    let outputFormat;

    // Check if image has transparency
    const hasAlpha = metadata.hasAlpha;

    if (metadata.format === 'png' && hasAlpha) {
      // Keep PNG with transparency but compress
      outputBuffer = await image
        .png({
          quality: CONFIG.PNG_QUALITY,
          compressionLevel: 9,
          progressive: true
        })
        .toBuffer();
      outputFormat = 'png';
    } else if (metadata.format === 'webp') {
      // Keep WebP but optimize
      outputBuffer = await image
        .webp({
          quality: CONFIG.WEBP_QUALITY,
          effort: 6
        })
        .toBuffer();
      outputFormat = 'webp';
    } else {
      // Convert to JPEG for maximum compatibility and compression
      outputBuffer = await image
        .jpeg({
          quality: quality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
      outputFormat = 'jpeg';
    }

    // Get final image info
    const finalMetadata = await sharp(outputBuffer).metadata();

    const compressionRatio = ((1 - outputBuffer.length / buffer.length) * 100).toFixed(1);
    console.log(`Image processed: ${metadata.width}x${metadata.height} (${(buffer.length / 1024).toFixed(1)}KB) -> ${finalMetadata.width}x${finalMetadata.height} (${(outputBuffer.length / 1024).toFixed(1)}KB) | ${compressionRatio}% reduction`);

    return {
      buffer: outputBuffer,
      format: outputFormat,
      width: finalMetadata.width,
      height: finalMetadata.height,
      size: outputBuffer.length,
      originalSize: buffer.length,
      compressionRatio: `${compressionRatio}%`
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {Boolean} - True if valid
 * @throws {Error} - If invalid
 */
function validateImageFile(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check MIME type
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ];

  if (!validMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, HEIC');
  }

  return true;
}

/**
 * Process avatar image with specific settings
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Processed image data
 */
async function processAvatar(buffer) {
  return processImage(buffer, {
    type: 'avatar',
    maxWidth: CONFIG.AVATAR_MAX_WIDTH,
    maxHeight: CONFIG.AVATAR_MAX_HEIGHT,
    quality: CONFIG.JPEG_QUALITY
  });
}

/**
 * Process post image with specific settings
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Processed image data
 */
async function processPostImage(buffer) {
  return processImage(buffer, {
    type: 'post',
    maxWidth: CONFIG.MAX_WIDTH,
    maxHeight: CONFIG.MAX_HEIGHT,
    quality: CONFIG.JPEG_QUALITY
  });
}

/**
 * Process story image with specific settings
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} Processed image data
 */
async function processStoryImage(buffer) {
  return processImage(buffer, {
    type: 'story',
    maxWidth: 1080,
    maxHeight: 1920,
    quality: CONFIG.JPEG_QUALITY
  });
}

module.exports = {
  processImage,
  processAvatar,
  processPostImage,
  processStoryImage,
  validateImageFile,
  CONFIG
};
