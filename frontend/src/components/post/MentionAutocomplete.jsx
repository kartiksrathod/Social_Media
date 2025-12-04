import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card } from '../ui/card';

export default function MentionAutocomplete({ 
  suggestions, 
  position, 
  onSelect, 
  selectedIndex 
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuRef.current && selectedIndex >= 0) {
      const selectedItem = menuRef.current.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card 
      ref={menuRef}
      className="absolute z-50 w-72 max-h-60 overflow-y-auto shadow-lg"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px` 
      }}
    >
      <div className="py-1">
        {suggestions.map((user, index) => (
          <button
            key={user.id}
            type="button"
            className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3 ${
              index === selectedIndex ? 'bg-accent' : ''
            }`}
            onClick={() => onSelect(user)}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="font-medium text-sm truncate">@{user.username}</div>
              {user.bio && (
                <div className="text-xs text-text-muted truncate">{user.bio}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
