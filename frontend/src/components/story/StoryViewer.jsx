import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import LazyImage from '../ui/lazy-image';
import { storiesAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import StoryViewersModal from './StoryViewersModal';
import { getOptimizedImageUrl } from '../../lib/imageOptimizer';

export default function StoryViewer({ open, onClose, storiesData, initialUserId }) {
  const { user } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewersModalOpen, setViewersModalOpen] = useState(false);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    const index = storiesData.findIndex(u => u.user_id === initialUserId);
    if (index !== -1) {
      setCurrentUserIndex(index);
    }
  }, [initialUserId, storiesData]);

  const currentUserStories = storiesData[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];

  useEffect(() => {
    if (!currentStory || !open) return;

    // Mark story as viewed
    if (!currentStory.has_viewed) {
      storiesAPI.viewStory(currentStory.id).catch(console.error);
    }

    // Reset progress
    setProgress(0);

    // Auto-advance logic
    const duration = currentStory.media_type === 'video' ? null : 5000; // 5s for images, video duration for videos

    if (currentStory.media_type === 'image' && !isPaused) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (duration / 100));
          if (newProgress >= 100) {
            nextStory();
            return 0;
          }
          return newProgress;
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory, isPaused, open]);

  const nextStory = () => {
    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      nextUser();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else {
      prevUser();
    }
  };

  const nextUser = () => {
    if (currentUserIndex < storiesData.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const prevUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(0);
    }
  };

  const handleVideoEnd = () => {
    nextStory();
  };

  const handleDelete = async () => {
    if (!currentStory) return;

    try {
      await storiesAPI.deleteStory(currentStory.id);
      toast.success('Story deleted');
      
      // If this was the last story for this user, move to next user or close
      if (currentUserStories.stories.length === 1) {
        if (storiesData.length === 1) {
          onClose();
        } else {
          nextUser();
        }
      } else {
        // Stay on same user, adjust index if needed
        if (currentStoryIndex >= currentUserStories.stories.length - 1) {
          setCurrentStoryIndex(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  if (!open || !currentUserStories || !currentStory) return null;

  const isOwnStory = currentUserStories.user_id === user?.id;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        {/* Progress bars */}
        <div className="flex gap-1 mb-4">
          {currentUserStories.stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index === currentStoryIndex
                    ? `${progress}%`
                    : index < currentStoryIndex
                    ? '100%'
                    : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white">
              <AvatarImage src={currentUserStories.user_avatar} />
              <AvatarFallback>{currentUserStories.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">
                {isOwnStory ? 'Your Story' : currentUserStories.username}
              </p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwnStory && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleDelete}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-lg h-full max-h-[90vh] flex items-center justify-center">
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-full h-full object-contain"
            onClick={() => setIsPaused(!isPaused)}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            autoPlay
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current.play();
                  setIsPaused(false);
                } else {
                  videoRef.current.pause();
                  setIsPaused(true);
                }
              }
            }}
            onEnded={handleVideoEnd}
          />
        )}

        {/* Navigation buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={prevStory}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={nextStory}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      {/* Bottom info */}
      {isOwnStory && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={() => setViewersModalOpen(true)}
            className="max-w-lg mx-auto bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm hover:bg-white/20 transition-colors flex items-center gap-2 justify-center w-full cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{currentStory.views_count} {currentStory.views_count === 1 ? 'view' : 'views'}</span>
          </button>
        </div>
      )}

      {/* Viewers Modal */}
      <StoryViewersModal
        open={viewersModalOpen}
        onClose={() => setViewersModalOpen(false)}
        storyId={currentStory?.id}
      />
    </div>
  );
}
