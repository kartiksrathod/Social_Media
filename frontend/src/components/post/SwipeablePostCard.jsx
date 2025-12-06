import React, { useState, useRef, useEffect } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import PostCard from './PostCard';

/**
 * Swipeable wrapper for PostCard with left/right swipe actions
 * Swipe right: Like/Unlike
 * Swipe left: Save/Unsave
 */
export default function SwipeablePostCard({ post, onUpdate, onLike, onSave }) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [action, setAction] = useState(null); // 'like' or 'save'
  
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const elementRef = useRef(null);

  const SWIPE_THRESHOLD = 100; // Distance to trigger action
  const MAX_OFFSET = 120; // Maximum swipe distance

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      // Don't interfere with other touch interactions
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[role="button"]')
      ) {
        return;
      }

      startXRef.current = e.touches[0].clientX;
      setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
      if (!isSwiping) return;

      currentXRef.current = e.touches[0].clientX;
      const diff = currentXRef.current - startXRef.current;

      // Apply resistance
      const resistance = 2.5;
      const offset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, diff / resistance));
      
      setOffsetX(offset);

      // Determine action based on swipe direction
      if (offset > 30) {
        setAction('like');
      } else if (offset < -30) {
        setAction('save');
      } else {
        setAction(null);
      }
    };

    const handleTouchEnd = async () => {
      if (!isSwiping) return;

      const finalOffset = offsetX * 2.5; // Reverse resistance calculation

      // Trigger action if threshold is met
      if (finalOffset > SWIPE_THRESHOLD && action === 'like') {
        if (navigator.vibrate) navigator.vibrate(50);
        if (onLike) await onLike();
      } else if (finalOffset < -SWIPE_THRESHOLD && action === 'save') {
        if (navigator.vibrate) navigator.vibrate(50);
        if (onSave) await onSave();
      }

      // Reset state
      setIsSwiping(false);
      setOffsetX(0);
      setAction(null);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isSwiping, offsetX, action, onLike, onSave]);

  // Calculate action indicator opacity
  const actionOpacity = Math.min(Math.abs(offsetX) / 40, 1);
  const showLikeIndicator = action === 'like' && offsetX > 0;
  const showSaveIndicator = action === 'save' && offsetX < 0;

  return (
    <div className="relative overflow-hidden">
      {/* Left action indicator (Like) */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-24 flex items-center justify-start pl-6 bg-red-500/20 transition-opacity duration-200',
          showLikeIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{ opacity: showLikeIndicator ? actionOpacity : 0 }}
      >
        <Heart className="w-8 h-8 text-red-500 fill-red-500" />
      </div>

      {/* Right action indicator (Save) */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end pr-6 bg-blue-500/20 transition-opacity duration-200',
          showSaveIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{ opacity: showSaveIndicator ? actionOpacity : 0 }}
      >
        <Bookmark className="w-8 h-8 text-blue-500 fill-blue-500" />
      </div>

      {/* Post card with swipe effect */}
      <div
        ref={elementRef}
        className={cn(
          'transition-transform duration-200',
          isSwiping ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <PostCard post={post} onUpdate={onUpdate} />
      </div>
    </div>
  );
}
