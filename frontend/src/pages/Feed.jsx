import React, { useState, useEffect, useCallback } from 'react';
import PostCard from '@/components/post/PostCard';
import StoriesBar from '@/components/story/StoriesBar';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

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

  useEffect(() => {
    loadFeed();
  }, []);

  const handlePostUpdate = () => {
    // Reset and reload from start
    setSkip(0);
    setHasMore(true);
    loadFeed(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
       <h2 className="text-xl font-heading font-bold sticky top-0 bg-background/95 backdrop-blur z-30 py-3 -mx-4 px-4 border-b border-border/50 md:hidden">
          Home
       </h2>
       
       <StoriesBar />
       
       {loading ? (
         <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
         </div>
       ) : posts.length === 0 ? (
         <div className="text-center py-12">
           <p className="text-muted-foreground">
             No posts yet. Follow some users or create your first post!
           </p>
         </div>
       ) : (
         <>
           <div className="space-y-5">
             {posts.map(post => (
               <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
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
  );
}
