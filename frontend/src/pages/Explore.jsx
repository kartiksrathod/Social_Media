import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PostCard from '@/components/post/PostCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { postsAPI, usersAPI } from '../lib/api';
import { toast } from 'sonner';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadExploreFeed = async () => {
    try {
      const response = await postsAPI.getExplore();
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to load explore feed');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="relative">
         <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
         <Input 
            placeholder="Search for people..." 
            className="pl-10 h-12 rounded-full bg-muted/50 border-none text-lg"
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
                <div className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
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
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
           </div>
         ) : posts.length === 0 ? (
           <div className="text-center py-12">
             <p className="text-muted-foreground">No posts to explore yet</p>
           </div>
         ) : (
           <div className="space-y-4">
             {posts.map(post => (
               <PostCard key={post.id} post={post} onUpdate={loadExploreFeed} />
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
