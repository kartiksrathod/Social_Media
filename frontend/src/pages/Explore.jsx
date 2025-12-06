import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PostCard from '@/components/post/PostCard';
import SwipeablePostCard from '@/components/post/SwipeablePostCard';
import PostCardSkeleton from '@/components/skeletons/PostCardSkeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { Link } from 'react-router-dom';
import { postsAPI, usersAPI } from '../lib/api';
import { toast } from 'sonner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useScrollToTop } from '../hooks/useScrollToTop';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  const loadExploreFeed = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentSkip = isLoadMore ? skip : 0;
      const response = await postsAPI.getExplore(LIMIT, currentSkip);
      const newPosts = response.data;

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setSkip(currentSkip + newPosts.length);
      setHasMore(newPosts.length === LIMIT);
    } catch (error) {
      toast.error('Failed to load explore feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadExploreFeed(true);
    }
  }, [loadingMore, hasMore, skip]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    setSkip(0);
    setHasMore(true);
    await loadExploreFeed(false);
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, refreshProgress } = 
    usePullToRefresh(handleRefresh, { enabled: !loading });

  // Scroll-to-top functionality
  const { showScrollTop, scrollToTop } = useScrollToTop(300);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      const response = await usersAPI.search(query);
      setUsers(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  useEffect(() => {
    loadExploreFeed();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePostUpdate = () => {
    // Reset and reload from start
    setSkip(0);
    setHasMore(true);
    loadExploreFeed(false);
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
        className="w-full max-w-2xl mx-auto py-4 sm:py-6 px-4 sm:px-5 space-y-5 sm:space-y-6"
      >
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
           <Input 
              placeholder="Search for people..." 
              className="input-mobile pl-12 h-12 rounded-full bg-muted/50 border-none text-base touch-manipulation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>

        {searchQuery && users.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Search Results</h3>
              {users.map(user => (
                <Link to={`/profile/${user.username}`} key={user.id}>
                  <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors touch-manipulation min-h-[56px]">
                    <Avatar className="w-11 h-11 sm:w-10 sm:h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-base sm:text-sm">{user.username}</p>
                      <p className="text-sm sm:text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className="text-sm sm:text-xs text-muted-foreground">
                      {user.followers_count} followers
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div>
           <h3 className="text-lg font-heading font-bold mb-4">Discover Posts</h3>
           {loading ? (
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <PostCardSkeleton key={i} />
               ))}
             </div>
           ) : posts.length === 0 ? (
             <div className="text-center py-12">
               <p className="text-muted-foreground">No posts to explore yet</p>
             </div>
           ) : (
             <>
               <div className="space-y-4">
                 {posts.map(post => (
                   <SwipeablePostCard 
                     key={post.id} 
                     post={post} 
                     onUpdate={handlePostUpdate}
                     onLike={() => handleLike(post.id)}
                     onSave={() => handleSave(post.id)}
                   />
                 ))}
               </div>

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
    </>
  );
}
