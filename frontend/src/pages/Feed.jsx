import React, { useState, useEffect } from 'react';
import CreatePost from '@/components/post/CreatePost';
import PostCard from '@/components/post/PostCard';
import StoriesBar from '@/components/story/StoriesBar';
import { postsAPI } from '../lib/api';
import { toast } from 'sonner';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const response = await postsAPI.getFeed();
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
       <h2 className="text-xl font-heading font-bold sticky top-0 bg-background/95 backdrop-blur z-30 py-3 -mx-4 px-4 border-b border-border/50 md:hidden">
          Home
       </h2>
       
       <StoriesBar />
       
       <CreatePost onPostCreated={loadFeed} />
       
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
         <div className="space-y-5">
           {posts.map(post => (
             <PostCard key={post.id} post={post} onUpdate={loadFeed} />
           ))}
         </div>
       )}
    </div>
  );
}
