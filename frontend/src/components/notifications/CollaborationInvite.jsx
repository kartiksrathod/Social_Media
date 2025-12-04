import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { UserPlus, Check, X } from 'lucide-react';
import { collaborationsAPI } from '../../lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function CollaborationInvite({ notification, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending'); // pending, accepted, rejected

  const handleAccept = async () => {
    setLoading(true);
    try {
      await collaborationsAPI.acceptInvite(notification.post_id);
      setStatus('accepted');
      toast.success('Collaboration invite accepted!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept collaboration');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await collaborationsAPI.rejectInvite(notification.post_id);
      setStatus('rejected');
      toast.success('Collaboration invite rejected');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject collaboration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-700 hover:bg-surface-600 transition-all duration-200 border border-border hover:border-primary/30 group card-premium">
      <div className="mt-1">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <Link to={`/profile/${notification.actor_username}`}>
            <Avatar className="w-8 h-8 ring-2 ring-border group-hover:ring-primary/30 transition-all cursor-pointer">
              <AvatarImage src={notification.actor_avatar} />
              <AvatarFallback>{notification.actor_username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${notification.actor_username}`} className="font-semibold text-sm text-text-primary hover:underline">
              @{notification.actor_username}
            </Link>
            <span className="text-sm text-text-secondary"> {notification.text}</span>
          </div>
          <span className="text-xs text-text-muted flex-shrink-0">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>

        {status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={loading}
              size="sm"
              className="button-primary gap-2"
            >
              <Check className="w-4 h-4" />
              Accept
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Decline
            </Button>
          </div>
        )}

        {status === 'accepted' && (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✓ Collaboration accepted
          </div>
        )}

        {status === 'rejected' && (
          <div className="text-sm text-text-muted">
            Collaboration declined
          </div>
        )}
      </div>
    </div>
  );
}
