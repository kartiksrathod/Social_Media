import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactionPicker, { reactions } from './ReactionPicker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ReactionButton({ 
  userReaction, 
  reactionCounts, 
  onReact, 
  onRemoveReaction 
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Find the emoji for user's current reaction
  const currentReaction = reactions.find(r => r.type === userReaction);

  // Calculate total reactions
  const totalReactions = Object.values(reactionCounts || {}).reduce((sum, count) => sum + count, 0);

  // Get top 3 reactions to display
  const topReactions = Object.entries(reactionCounts || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => {
      const reaction = reactions.find(r => r.type === type);
      return { ...reaction, count };
    });

  const handleMouseEnter = () => {
    setIsHovering(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 500); // Show picker after 500ms hover
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Delay hiding picker to allow mouse to move into it
    setTimeout(() => {
      if (!isHovering) {
        setShowPicker(false);
      }
    }, 200);
  };

  const handleClick = () => {
    if (userReaction) {
      // Remove reaction if already reacted
      onRemoveReaction();
    } else {
      // Quick react with "like" on simple click
      onReact('like');
    }
  };

  const handleReactionSelect = (type) => {
    onReact(type);
    setShowPicker(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex items-center gap-1.5">
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className={`group px-2 h-8 hover:text-accent relative ${
            userReaction ? 'text-accent' : ''
          }`}
          onClick={handleClick}
        >
          {currentReaction ? (
            <motion.span
              key={currentReaction.type}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-lg mr-1"
            >
              {currentReaction.emoji}
            </motion.span>
          ) : (
            <Heart className={`w-5 h-5 mr-1.5 transition-transform group-active:scale-75`} />
          )}
          <span className="text-xs font-medium">{totalReactions || 0}</span>
        </Button>

        <ReactionPicker 
          show={showPicker} 
          onSelect={handleReactionSelect}
          position="top"
        />
      </div>

      {/* Show top reactions as small emojis */}
      {topReactions.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center -ml-1 hover:scale-110 transition-transform">
              <div className="flex -space-x-1">
                {topReactions.map((reaction) => (
                  <span
                    key={reaction.type}
                    className="inline-block text-xs bg-muted rounded-full w-5 h-5 flex items-center justify-center border border-border"
                    title={`${reaction.label}: ${reaction.count}`}
                  >
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="space-y-1">
              {Object.entries(reactionCounts || {})
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const reaction = reactions.find(r => r.type === type);
                  return (
                    <div key={type} className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{reaction.emoji}</span>
                      <span className="font-medium">{reaction.label}</span>
                      <span className="text-muted-foreground ml-auto">{count}</span>
                    </div>
                  );
                })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
