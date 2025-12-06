import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { storiesAPI } from '../../lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

export default function StoryViewersModal({ open, onClose, storyId }) {
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && storyId) {
      loadViewers();
    }
  }, [open, storyId]);

  const loadViewers = async () => {
    setLoading(true);
    try {
      const response = await storiesAPI.getViewers(storyId);
      setViewers(response.data.viewers);
      setTotalViews(response.data.total_views);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load viewers');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (username) => {
    navigate(`/profile/${username}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Story Viewers ({totalViews})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 overflow-y-auto max-h-[450px] -mx-2 px-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No views yet
            </div>
          ) : (
            viewers.map((viewer) => (
              <div
                key={viewer.user_id}
                onClick={() => handleViewProfile(viewer.username)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-700 transition-colors cursor-pointer"
              >
                <Avatar className="w-12 h-12 ring-2 ring-border">
                  <AvatarImage src={viewer.avatar} />
                  <AvatarFallback>
                    {viewer.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {viewer.name || viewer.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{viewer.username}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(viewer.viewed_at), { addSuffix: true })}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
