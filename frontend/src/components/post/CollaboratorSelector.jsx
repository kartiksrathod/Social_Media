import React, { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usersAPI } from '../../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export default function CollaboratorSelector({ collaborator, onCollaboratorChange, open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchQuery.length > 0) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await usersAPI.search(searchQuery);
          setSearchResults(response.data.slice(0, 10));
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    onCollaboratorChange(user);
    setSearchQuery('');
    setSearchResults([]);
    onOpenChange(false);
  };

  const handleRemoveCollaborator = () => {
    onCollaboratorChange(null);
  };

  return (
    <>
      {collaborator ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
          <UserPlus className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Collaborating with:</span>
          <Avatar className="w-6 h-6">
            <AvatarImage src={collaborator.avatar} />
            <AvatarFallback className="text-xs">
              {collaborator.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">@{collaborator.username}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveCollaborator}
            className="ml-auto h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Collaborator
        </Button>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Collaborator</DialogTitle>
            <DialogDescription>
              Search for a user to collaborate on this post. Maximum 2 authors per post.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {loading && (
              <div className="text-center py-4 text-text-muted text-sm">
                Searching...
              </div>
            )}

            {!loading && searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{user.name || user.username}</p>
                      <p className="text-text-muted text-xs">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && searchQuery.length > 0 && searchResults.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">
                No users found
              </div>
            )}

            {!loading && searchQuery.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">
                Start typing to search for users
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
