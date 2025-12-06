import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { postsAPI } from '../lib/api';
import PostCard from '../components/post/PostCard';
import { Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export default function HashtagPage() {
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const LIMIT = 10;

  const loadPosts = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentSkip = isLoadMore ? skip : 0;
      const response = await postsAPI.getByHashtag(tag, LIMIT, currentSkip);
      const newPosts = response.data;

      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setSkip(currentSkip + newPosts.length);
      setHasMore(newPosts.length === LIMIT);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPosts(true);
    }
  }, [loadingMore, hasMore, skip, tag]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    // Reset state when tag changes
    setPosts([]);
    setSkip(0);
    setHasMore(true);
    loadPosts();
  }, [tag]);

  const handlePostUpdate = () => {
    // Reset and reload from start
    setSkip(0);
    setHasMore(true);
    loadPosts(false);
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
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">#{tag}</h1>
            <p className="text-xs text-muted-foreground">{posts.length} posts</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="divide-y divide-border/50">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No posts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              There are no posts with #{tag} yet. Be the first to post!
            </p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="px-4 py-4">
              <PostCard post={post} onUpdate={loadPosts} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
