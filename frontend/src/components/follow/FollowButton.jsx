import React, { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { usersAPI } from '../../lib/api';

const FollowButton = ({ userId, initialIsFollowing, onFollowChange, size = 'md' }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      if (isFollowing) {
        await usersAPI.unfollow(userId);
        setIsFollowing(false);
      } else {
        await usersAPI.follow(userId);
        setIsFollowing(true);
      }
      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Follow/unfollow failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${isFollowing 
          ? 'surface-700 border border-border text-foreground hover:surface-600' 
          : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-subtle hover:glow-primary'
        }
        rounded-full font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
      `}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  );
};

export default FollowButton;