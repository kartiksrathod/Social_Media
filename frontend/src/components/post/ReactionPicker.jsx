import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const reactions = [
  { type: 'like', emoji: '❤️', label: 'Like', color: 'text-red-500' },
  { type: 'love', emoji: '😍', label: 'Love', color: 'text-pink-500' },
  { type: 'laugh', emoji: '😂', label: 'Laugh', color: 'text-yellow-500' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-blue-500' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-gray-500' },
  { type: 'angry', emoji: '😠', label: 'Angry', color: 'text-orange-500' },
];

export default function ReactionPicker({ onSelect, show, position = 'top' }) {
  const [hoveredReaction, setHoveredReaction] = useState(null);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 bg-card/95 backdrop-blur-sm border border-border/50 rounded-full px-2 py-1.5 shadow-xl flex items-center gap-1`}
      >
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.type}
            whileHover={{ scale: 1.3, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(reaction.type)}
            onMouseEnter={() => setHoveredReaction(reaction.type)}
            onMouseLeave={() => setHoveredReaction(null)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-accent/20 transition-all duration-200 ${
              hoveredReaction === reaction.type ? 'bg-accent/10' : ''
            }`}
            title={reaction.label}
          >
            <span className="text-2xl">{reaction.emoji}</span>
            
            {/* Tooltip */}
            <AnimatePresence>
              {hoveredReaction === reaction.type && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none`}
                >
                  {reaction.label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// Export reactions data for use in other components
export { reactions };
