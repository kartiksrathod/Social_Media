import { useState, useEffect } from 'react';

/**
 * Custom hook for scroll-to-top button functionality
 * @param {number} threshold - Scroll threshold to show button (default: 300px)
 * @returns {Object} - Show state and scroll function
 */
export function useScrollToTop(threshold = 300) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = (behavior = 'smooth') => {
    window.scrollTo({
      top: 0,
      behavior,
    });

    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  return {
    showScrollTop,
    scrollToTop,
  };
}
