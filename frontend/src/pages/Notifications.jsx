import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '@/lib/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, UserPlus, MessageCircle, Repeat2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-primary fill-current" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-primary fill-current" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-primary fill-current" />;
      case 'repost':
        return <Repeat2 className="w-5 h-5 text-primary fill-current" />;
      case 'mention':
        return <User className="w-5 h-5 text-primary fill-current" />;
      default:
        return <Heart className="w-5 h-5 text-primary fill-current" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-4 sm:px-5">
        <h2 className="text-xl sm:text-2xl font-heading font-bold mb-5 sm:mb-6 text-text-primary">Notifications</h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-4 sm:px-5">
      <h2 className="text-xl sm:text-2xl font-heading font-bold mb-5 sm:mb-6 text-text-primary">Notifications</h2>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base sm:text-sm text-text-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-3">
          {notifications.map((notif, index) => (
            <Link
              key={notif.id}
              to={notif.link || '#'}
              className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-4 rounded-xl bg-surface-700 hover:bg-surface-600 transition-all duration-200 border border-border hover:border-primary/30 cursor-pointer group card-premium block touch-manipulation min-h-[72px] hover-lift-sm ${index < 5 ? 'stagger-fade-in' : ''}`}
            >
              <div className="mt-1 flex-shrink-0">
                <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Avatar className="w-9 h-9 sm:w-8 sm:h-8 ring-2 ring-border group-hover:ring-primary/30 transition-all flex-shrink-0">
                    <AvatarImage src={notif.actor_avatar} />
                    <AvatarFallback>{notif.actor_username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-base sm:text-sm text-text-primary truncate">
                    {notif.actor_username || 'Someone'}
                  </span>
                  <span className="text-sm sm:text-xs text-text-muted flex-shrink-0">
                    {formatTime(notif.created_at)}
                  </span>
                </div>
                <p className="text-base sm:text-sm text-text-secondary leading-relaxed">{notif.message}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
