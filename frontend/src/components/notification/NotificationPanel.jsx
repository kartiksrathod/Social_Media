import React from 'react';
import { X, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import LazyImage from '../ui/lazy-image';
import { getAvatarUrl } from '../../lib/imageOptimizer';

const NotificationPanel = ({ notifications, onClose, onMarkAsRead, onMarkAllAsRead }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-primary" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'mention':
        return 'mentioned you in a post';
      default:
        return '';
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.type === 'follow') {
      return `/profile/${notification.actor_username}`;
    }
    return `/post/${notification.post_id}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-12 w-96 max-h-[600px] card-premium rounded-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:surface-700 rounded-full transition-colors hover-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead(notification.id);
                    }
                    onClose();
                  }}
                  className={`
                    flex items-start gap-3 p-4 hover:surface-700 transition-colors
                    ${!notification.read ? 'bg-primary/10' : ''}
                  `}
                >
                  <div className="relative">
                    <LazyImage
                      src={getAvatarUrl(notification.actor_avatar || `https://ui-avatars.com/api/?name=${notification.actor_username}&background=random`, 40)}
                      alt={notification.actor_username}
                      className="w-10 h-10 rounded-full ring-2 ring-border"
                      width={40}
                      height={40}
                    />
                    <div className="absolute -bottom-1 -right-1 surface-800 rounded-full p-1 border border-border">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">{notification.actor_username}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        {getNotificationText(notification)}
                      </span>
                    </p>
                    {notification.text && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        "{notification.text}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
