import React, { useState, useEffect, useCallback } from 'react';
import { postsAPI } from '../lib/api';
import PostCard from '../components/post/PostCard';
import SwipeablePostCard from '../components/post/SwipeablePostCard';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { Bookmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function SavedPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  const loadSavedPosts = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentSkip = isLoadMore ? skip : 0;
      const response = await postsAPI.getSaved(LIMIT, currentSkip);
      const newPosts = response.data;

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setSkip(currentSkip + newPosts.length);
      setHasMore(newPosts.length === LIMIT);
    } catch (error) {
      toast.error('Failed to load saved posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadSavedPosts(true);
    }
  }, [loadingMore, hasMore, skip]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const handlePostUpdate = () => {
    // Reset and reload from start
    setSkip(0);
    setHasMore(true);
    loadSavedPosts(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Bookmark className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-heading font-bold">Saved Posts</h1>
            <p className="text-xs text-muted-foreground">Posts you've bookmarked</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="divide-y divide-border/50">
        {posts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you save posts, they'll appear here so you can easily find them later.
            </p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <div key={post.id} className="px-4 py-4">
                <PostCard post={post} onUpdate={handlePostUpdate} />
              </div>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={scrollRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
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
    </div>
  );
}
