import React, { useState, useRef, useEffect } from 'react';
import { X, Tag, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usersAPI } from '../../lib/api';
import LazyImage from '../ui/lazy-image';

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
                <div ref={imageRef} onClick={handleImageClick} className="cursor-crosshair">
                  <LazyImage
                    src={imageUrl}
                    alt="Tag people"
                    className="w-full rounded-lg"
                    loading="eager"
                  />
                </div>
                
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
                
                {/* Tag input overlay */}
                {showTagInput && tagPosition && (
                  <div
                    className="absolute bg-background border border-border rounded-lg shadow-xl p-3 w-64 z-10"
                    style={{
                      left: `${tagPosition.x}%`,
                      top: `${tagPosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search username..."
                      autoFocus
                      className="mb-2"
                    />
                    
                    {loading && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        Searching...
                      </div>
                    )}
                    
                    {!loading && searchResults.length > 0 && (
                      <div className="max-h-48 overflow-auto space-y-1">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">{user.name || user.username}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {!loading && searchQuery.length > 0 && searchResults.length === 0 && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        No users found
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        setShowTagInput(false);
                        setTagPosition(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Tagged users list */}
            <div className="space-y-3">
              <h3 className="font-semibold">Tagged People</h3>
              {tags.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click on the image to tag people
                </div>
              ) : (
                <div className="space-y-2">
                  {tags.map((tag, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={tag.avatar} />
                            <AvatarFallback>{tag.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">@{tag.username}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTag(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
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
          <Button onClick={handleSave}>
            Save Tags
          </Button>
        </div>
      </div>
    </div>
  );
}
