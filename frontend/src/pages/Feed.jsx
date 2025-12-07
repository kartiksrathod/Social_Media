import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PostCard from '@/components/post/PostCard';
import SwipeablePostCard from '@/components/post/SwipeablePostCard';
import StoriesBar from '@/components/story/StoriesBar';
import PostCardSkeleton from '@/components/skeletons/PostCardSkeleton';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import VirtualizedFeed from '@/components/feed/VirtualizedFeed';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { Loader2 } from 'lucide-react';
import { 
  PERFORMANCE_CONFIG, 
  shouldUseVirtualScrolling,
  getOptimalPageSize 
} from '../config/performance';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = getOptimalPageSize();

  // Determine if we should use virtual scrolling
  const useVirtualScroll = useMemo(() => 
    shouldUseVirtualScrolling(posts.length), 
    [posts.length]
  );

  const loadFeed = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentSkip = isLoadMore ? skip : 0;
      const response = await postsAPI.getFeed(LIMIT, currentSkip);
      const newPosts = response.data;

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setSkip(currentSkip + newPosts.length);
      setHasMore(newPosts.length === LIMIT);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadFeed(true);
    }
  }, [loadingMore, hasMore, skip]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    setSkip(0);
    setHasMore(true);
    await loadFeed(false);
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, refreshProgress } = 
    usePullToRefresh(handleRefresh, { enabled: !loading });

  // Scroll-to-top functionality
  const { showScrollTop, scrollToTop } = useScrollToTop(300);

  useEffect(() => {
    loadFeed();
  }, []);

  const handlePostUpdate = () => {
    // Reset and reload from start
    setSkip(0);
    setHasMore(true);
    loadFeed(false);
  };

  const handleLike = async (postId) => {
    try {
      const postToUpdate = posts.find(p => p.id === postId);
      if (!postToUpdate) return;

      if (postToUpdate.is_liked) {
        await postsAPI.unlike(postId);
      } else {
        await postsAPI.like(postId);
      }
      handlePostUpdate();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleSave = async (postId) => {
    try {
      const postToUpdate = posts.find(p => p.id === postId);
      if (!postToUpdate) return;

      if (postToUpdate.is_saved) {
        await postsAPI.unsave(postId);
        toast.success('Post removed from saved');
      } else {
        await postsAPI.save(postId);
        toast.success('Post saved');
      }
      handlePostUpdate();
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  return (
    <>
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        refreshProgress={refreshProgress}
      />

      {/* Scroll-to-top button */}
      <ScrollToTopButton show={showScrollTop} onClick={scrollToTop} />

      <div 
        ref={containerRef}
        className="w-full max-w-2xl mx-auto container-padding-y container-padding section-spacing-sm"
      >
         <h2 className="text-xl sm:text-2xl font-heading font-bold sticky top-0 bg-background/95 backdrop-blur z-30 py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-border/50 md:hidden">
            Home
         </h2>
         
         <StoriesBar />
         
         {loading ? (
           <div className="post-list-spacing flex flex-col">
             {[1, 2, 3].map((i) => (
               <PostCardSkeleton key={i} />
             ))}
           </div>
         ) : posts.length === 0 ? (
           <div className="text-center empty-state-spacing">
             <p className="text-base text-muted-foreground">
               No posts yet. Follow some users or create your first post!
             </p>
           </div>
         ) : (
           <>
             <div className="post-list-spacing flex flex-col">
               {posts.map((post, index) => (
                 <div key={post.id} className={index < 5 ? 'stagger-fade-in' : ''}>
                   <SwipeablePostCard 
                     post={post} 
                     onUpdate={handlePostUpdate}
                     onLike={() => handleLike(post.id)}
                     onSave={() => handleSave(post.id)}
                   />
                 </div>
               ))}
             </div>

             {/* Infinite scroll trigger */}
             <div ref={scrollRef} className="flex justify-center infinite-scroll-spacing">
               {loadingMore && (
                 <div className="flex items-center gap-3 text-muted-foreground">
                   <Loader2 className="w-6 h-6 animate-spin" />
                   <span className="text-sm">Loading more posts...</span>
                 </div>
               )}
               {!hasMore && posts.length > 0 && (
                 <p className="text-sm text-muted-foreground">No more posts to load</p>
               )}
             </div>
           </>
         )}
      </div>
    </>
  );
}
