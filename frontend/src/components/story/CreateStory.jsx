import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Image, Video, X } from 'lucide-react';
import { storiesAPI } from '../../lib/api';
import { toast } from 'sonner';

export default function CreateStory({ open, onClose, onStoryCreated }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${type === 'video' ? '50MB' : '10MB'}`);
      return;
    }

    setSelectedFile(file);
    setMediaType(type);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select an image or video');
      return;
    }

    setLoading(true);

    try {
      // Upload media
      const uploadResponse = await storiesAPI.uploadMedia(selectedFile);
      const { url, media_type } = uploadResponse.data;

      // Create story
      await storiesAPI.create({
        media_url: url,
        media_type: media_type
      });

      toast.success('Story created successfully!');
      handleRemove();
      if (onStoryCreated) {
        onStoryCreated();
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!preview ? (
            <div className="space-y-3">
              <input
                type="file"
                id="story-image"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'image')}
                className="hidden"
              />
              <label htmlFor="story-image">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 cursor-pointer"
                  asChild
                >
                  <div className="flex flex-col items-center gap-2">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <span>Upload Image</span>
                    <span className="text-xs text-muted-foreground">Max 10MB</span>
                  </div>
                </Button>
              </label>

              <input
                type="file"
                id="story-video"
                accept="video/*"
                onChange={(e) => handleFileSelect(e, 'video')}
                className="hidden"
              />
              <label htmlFor="story-video">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 cursor-pointer"
                  asChild
                >
                  <div className="flex flex-col items-center gap-2">
                    <Video className="h-8 w-8 text-muted-foreground" />
                    <span>Upload Video</span>
                    <span className="text-xs text-muted-foreground">Max 50MB</span>
                  </div>
                </Button>
              </label>
            </div>
          ) : (
            <div className="relative">
              {mediaType === 'image' ? (
                <img
                  src={preview}
                  alt="Story preview"
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="w-full h-96 rounded-lg"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {preview && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRemove}
                disabled={loading}
              >
                Change
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Posting...' : 'Post Story'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
