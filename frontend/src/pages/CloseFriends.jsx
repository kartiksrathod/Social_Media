import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Star, X, UserPlus, Search } from 'lucide-react';
import { usersAPI } from '../lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function CloseFriends() {
  const [closeFriends, setCloseFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadCloseFriends();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadCloseFriends = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getCloseFriends();
      setCloseFriends(response.data);
    } catch (error) {
      toast.error('Failed to load close friends');
      console.error('Load close friends error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);
      const response = await usersAPI.search(searchQuery);
      // Filter out users already in close friends
      const filtered = response.data.filter(
        user => !closeFriends.some(cf => cf.id === user.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToCloseFriends = async (userId) => {
    try {
      await usersAPI.addToCloseFriends(userId);
      toast.success('Added to close friends!');
      loadCloseFriends();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to close friends');
    }
  };

  const handleRemoveFromCloseFriends = async (userId) => {
    try {
      await usersAPI.removeFromCloseFriends(userId);
      toast.success('Removed from close friends');
      setCloseFriends(closeFriends.filter(user => user.id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove from close friends');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-green-500 text-green-500" />
            Close Friends
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Share posts exclusively with your close friends. They won't be notified when you add them.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-2">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{user.bio}</p>
                        )}
                      </div>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCloseFriends(user.id)}
                      className="shrink-0"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !searching && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </div>

          {/* Close Friends List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              YOUR CLOSE FRIENDS ({closeFriends.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : closeFriends.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No close friends yet</p>
                <p className="text-sm text-muted-foreground">
                  Search for users above to add them to your close friends list
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {closeFriends.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFromCloseFriends(user.id)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
