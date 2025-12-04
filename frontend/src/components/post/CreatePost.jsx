import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Image, Video, X } from 'lucide-react';
import { postsAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (videoFile) {
      toast.error('Cannot add images with video');
      return;
    }
    if (files.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);

    // Generate previews
    const newPreviews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imageFiles.length > 0) {
      toast.error('Cannot add video with images');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file too large. Maximum size is 50MB');
      return;
    }

    setVideoFile(file);

    // Generate video preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && imageFiles.length === 0 && !videoFile) {
      toast.error('Please add some text, an image, or a video');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = [];
      let videoUrl = null;
      
      // Upload all images if selected
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const uploadResponse = await postsAPI.uploadImage(file);
          imageUrls.push(uploadResponse.data.url);
        }
      }

      // Upload video if selected
      if (videoFile) {
        const uploadResponse = await postsAPI.uploadVideo(videoFile);
        videoUrl = uploadResponse.data.url;
      }

      // Create post with multiple images or video
      await postsAPI.create({
        text: text.trim(),
        images: imageUrls,
        image_url: imageUrls[0] || null, // For backward compatibility
        video_url: videoUrl,
      });

      toast.success('Post created successfully!');
      setText('');
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFile(null);
      setVideoPreview(null);
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 card-premium">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 ring-2 ring-border">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent placeholder:text-text-muted"
              />
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {videoPreview && (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-96 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeVideo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="post-image"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label htmlFor="post-image">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      asChild
                      disabled={imageFiles.length >= 5 || videoFile}
                    >
                      <span>
                        <Image className="h-4 w-4 mr-2" />
                        Add Images {imageFiles.length > 0 && `(${imageFiles.length}/5)`}
                      </span>
                    </Button>
                  </label>

                  <input
                    type="file"
                    id="post-video"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <label htmlFor="post-video">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      asChild
                      disabled={videoFile || imageFiles.length > 0}
                    >
                      <span>
                        <Video className="h-4 w-4 mr-2" />
                        Add Video
                      </span>
                    </Button>
                  </label>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
