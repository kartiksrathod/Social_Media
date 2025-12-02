import React from 'react';
import CreatePost from '@/components/post/CreatePost';
import PostCard from '@/components/post/PostCard';
import { POSTS } from '@/lib/mockData';

export default function Feed() {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
       <h2 className="text-xl font-heading font-bold sticky top-0 bg-background/95 backdrop-blur z-30 py-3 -mx-4 px-4 border-b border-border/50 md:hidden">
          Home
       </h2>
       
       <CreatePost />
       
       <div className="space-y-5">
          {POSTS.map(post => (
             <PostCard key={post.id} post={post} />
          ))}
          {/* Duplicate for scrolling effect */}
          {POSTS.map(post => (
             <PostCard key={`dup-${post.id}`} post={{...post, id: `dup-${post.id}`}} />
          ))}
       </div>
    </div>
  );
}
