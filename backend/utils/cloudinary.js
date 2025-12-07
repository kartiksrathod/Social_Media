const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload image/video buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} folder - Cloudinary folder name
 * @param {Object} options - Additional upload options (e.g., {resource_type: 'video'})
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'uploads', options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if we're in test mode (no valid Cloudinary credentials)
    if (process.env.CLOUDINARY_CLOUD_NAME === 'test_cloud') {
      // Mock upload for testing
      const mockResult = {
        public_id: `${folder}/test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: `https://res.cloudinary.com/test_cloud/${options.resource_type || 'image'}/upload/v1/${folder}/test_image.${options.resource_type === 'video' ? 'mp4' : 'jpg'}`,
        width: options.width || 800,
        height: options.height || 600,
        format: options.format || (options.resource_type === 'video' ? 'mp4' : 'jpg'),
        duration: options.resource_type === 'video' ? 30 : null,
        resource_type: options.resource_type || 'image',
        bytes: fileBuffer.length
      };
      
      console.log('Mock upload successful:', mockResult.url);
      resolve(mockResult);
      return;
    }

    const uploadOptions = {
      folder: folder,
      resource_type: options.resource_type || 'image',
      secure: true,
      // Add transformation options for Cloudinary
      transformation: options.resource_type === 'image' ? [
        { fetch_format: 'auto', quality: 'auto' }
      ] : undefined,
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        } else {
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            duration: result.duration || null, // For videos
            resource_type: result.resource_type,
            bytes: result.bytes
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Boolean>} Deletion success
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    return false;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
