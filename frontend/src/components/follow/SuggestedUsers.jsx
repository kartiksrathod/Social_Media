import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../lib/api';
import FollowButton from './FollowButton';

const SuggestedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestedUsers();
  }, []);

  const loadSuggestedUsers = async () => {
    try {
      const response = await usersAPI.getSuggested();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId, isFollowing) => {
    if (isFollowing) {
      // Remove from suggestions after following
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="card-premium rounded-2xl p-4 space-y-4">
        <h2 className="font-bold text-xl text-foreground">Suggested For You</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 surface-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 surface-600 rounded w-24"></div>
                <div className="h-3 surface-600 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="card-premium rounded-2xl p-4 space-y-4">
      <h2 className="font-bold text-xl text-foreground">Suggested For You</h2>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:surface-700 transition-colors">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-foreground">{user.username}</p>
                {user.bio && (
                  <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                )}
              </div>
            </Link>
            <FollowButton
              userId={user.id}
              initialIsFollowing={false}
              onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;