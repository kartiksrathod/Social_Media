import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { storiesAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import CreateStory from './CreateStory';
import StoryViewer from './StoryViewer';

export default function StoriesBar() {
  const { user } = useAuth();
  const [storiesData, setStoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchStories = async () => {
    try {
      const response = await storiesAPI.getAll();
      setStoriesData(response.data);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleStoryClick = (userId) => {
    setSelectedUserId(userId);
    setViewerOpen(true);
  };

  const handleStoryCreated = () => {
    setCreateStoryOpen(false);
    fetchStories();
  };

  const handleViewerClose = () => {
    setViewerOpen(false);
    setSelectedUserId(null);
    fetchStories(); // Refresh to update viewed status
  };

  if (loading) {
    return (
      <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story Button - Accent with subtle glow */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setCreateStoryOpen(true)}
            className="relative w-16 h-16 rounded-full border-2 border-dashed border-primary hover:bg-primary/10 transition-all flex items-center justify-center group glow-subtle"
          >
            <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-xs text-text-muted">Your Story</span>
        </div>

        {/* Stories from followed users - Soft gradient ring */}
        {storiesData.map((userStories) => (
          <div
            key={userStories.user_id}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
            onClick={() => handleStoryClick(userStories.user_id)}
          >
            <div
              className={`relative w-16 h-16 rounded-full p-[2.5px] transition-all ${
                userStories.has_viewed_all
                  ? 'bg-border'
                  : 'gradient-ring glow-subtle'
              }`}
            >
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={userStories.user_avatar} />
                <AvatarFallback>{userStories.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs text-center truncate max-w-[64px] text-text-secondary">
              {userStories.user_id === user?.id ? 'You' : userStories.username}
            </span>
          </div>
        ))}
      </div>

      {/* Create Story Dialog */}
      <CreateStory 
        open={createStoryOpen} 
        onClose={() => setCreateStoryOpen(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer */}
      {viewerOpen && selectedUserId && (
        <StoryViewer
          open={viewerOpen}
          onClose={handleViewerClose}
          storiesData={storiesData}
          initialUserId={selectedUserId}
        />
      )}
    </>
  );
}
