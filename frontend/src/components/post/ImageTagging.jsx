import React, { useState, useRef, useEffect } from 'react';
import { X, Tag, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usersAPI } from '../../lib/api';

export default function ImageTagging({ 
  imageUrl, 
  imageIndex, 
  existingTags = [], 
  onTagsChange, 
  onClose 
}) {
  const [tags, setTags] = useState(existingTags);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagPosition, setTagPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await usersAPI.search(searchQuery);
          setSearchResults(response.data);
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

  const handleImageClick = (e) => {
    if (showTagInput) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTagPosition({ x, y });
    setShowTagInput(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUserSelect = (user) => {
    if (!tagPosition) return;
    
    const newTag = {
      image_index: imageIndex,
      x: tagPosition.x,
      y: tagPosition.y,
      user_id: user.id,
      username: user.username,
      avatar: user.avatar
    };
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    setShowTagInput(false);
    setTagPosition(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeTag = (index) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
  };

  const handleSave = () => {
    onTagsChange(tags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Tag People</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Image with tags */}
            <div className="relative">
              <div className="relative inline-block">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Tag people"
                  className="w-full rounded-lg cursor-crosshair"
                  onClick={handleImageClick}
                />
                
                {/* Render existing tags */}
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="absolute group"
                    style={{ 
                      left: `${tag.x}%`, 
                      top: `${tag.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background border border-border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap flex items-center gap-2">
                        <span className="text-sm font-medium">@{tag.username}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTag(index);
                          }}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* New tag position indicator */}
                {showTagInput && tagPosition && (
                  <div
                    className="absolute w-8 h-8 bg-primary/50 rounded-full border-2 border-white animate-pulse"
                    style={{ 
                      left: `${tagPosition.x}%`, 
                      top: `${tagPosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-text-muted mt-2">
                Click on the image to tag people
              </p>
            </div>

            {/* Tag input and search */}
            <div className="space-y-4">
              {showTagInput ? (
                <div>
                  <div className="mb-2">
                    <Input
                      placeholder="Search for a person..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  {loading && (
                    <p className="text-sm text-text-muted">Searching...</p>
                  )}
                  
                  {searchResults.length > 0 && (
                    <Card className="max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3"
                          onClick={() => handleUserSelect(user)}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">@{user.username}</div>
                            {user.bio && (
                              <div className="text-xs text-text-muted truncate">{user.bio}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </Card>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setShowTagInput(false);
                      setTagPosition(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium mb-2">Tagged People ({tags.length})</h3>
                  {tags.length === 0 ? (
                    <p className="text-sm text-text-muted">No one tagged yet</p>
                  ) : (
                    <div className="space-y-2">
                      {tags.map((tag, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-accent/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={tag.avatar} />
                              <AvatarFallback className="text-xs">
                                {tag.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">@{tag.username}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTag(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="button-primary">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
