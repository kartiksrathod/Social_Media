import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll functionality
 * @param {Function} loadMore - Function to call when user scrolls near bottom
 * @param {Boolean} hasMore - Whether there are more items to load
 * @param {Boolean} loading - Whether currently loading
 * @param {Number} threshold - Distance from bottom (in pixels) to trigger load (default: 300px)
 */
export const useInfiniteScroll = (loadMore, hasMore, loading, threshold = 300) => {
  const observerTarget = useRef(null);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [loadMore, hasMore, loading]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, threshold]);

  return observerTarget;
};

export default useInfiniteScroll;
