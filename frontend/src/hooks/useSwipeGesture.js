import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for detecting swipe gestures
 * @param {Object} callbacks - Object containing swipe callbacks
 * @param {Object} options - Configuration options
 * @returns {Object} - Ref and swipe state
 */
export function useSwipeGesture(callbacks = {}, options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = callbacks;

  const {
    threshold = 50, // Minimum distance for a swipe
    velocityThreshold = 0.3, // Minimum velocity for a swipe
    preventDefaultTouchMove = false,
    direction = 'horizontal', // 'horizontal', 'vertical', or 'both'
  } = options;

  const elementRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchEndRef = useRef({ x: 0, y: 0, time: 0 });
  const [swipeState, setSwipeState] = useState({
    isSwiping: false,
    direction: null,
    distance: 0,
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setSwipeState({
        isSwiping: false,
        direction: null,
        distance: 0,
      });
    };

    const handleTouchMove = (e) => {
      if (preventDefaultTouchMove) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      let detectedDirection = null;
      let distance = 0;

      if (direction === 'horizontal' || direction === 'both') {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          detectedDirection = deltaX > 0 ? 'right' : 'left';
          distance = Math.abs(deltaX);
        }
      }

      if (direction === 'vertical' || direction === 'both') {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          detectedDirection = deltaY > 0 ? 'down' : 'up';
          distance = Math.abs(deltaY);
        }
      }

      if (distance > threshold / 2) {
        setSwipeState({
          isSwiping: true,
          direction: detectedDirection,
          distance,
        });
      }
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine swipe direction and check threshold
      let swipeDetected = false;

      if (direction === 'horizontal' || direction === 'both') {
        if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) && velocityX > velocityThreshold) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
            swipeDetected = true;
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
            swipeDetected = true;
          }
        }
      }

      if (direction === 'vertical' || direction === 'both') {
        if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX) && velocityY > velocityThreshold) {
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
            swipeDetected = true;
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
            swipeDetected = true;
          }
        }
      }

      // Add haptic feedback if swipe detected
      if (swipeDetected && navigator.vibrate) {
        navigator.vibrate(30);
      }

      setSwipeState({
        isSwiping: false,
        direction: null,
        distance: 0,
      });
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold, preventDefaultTouchMove, direction]);

  return {
    elementRef,
    swipeState,
  };
}
