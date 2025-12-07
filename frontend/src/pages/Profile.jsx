import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '@/components/post/PostCard';
import SwipeablePostCard from '@/components/post/SwipeablePostCard';
import CreatePost from '@/components/post/CreatePost';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FollowersModal from '../components/follow/FollowersModal';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import PostCardSkeleton from '@/components/skeletons/PostCardSkeleton';
import ReportDialog from '@/components/safety/ReportDialog';
import { MoreHorizontal, Flag, Ban } from 'lucide-react';
import { blockUser } from '@/lib/safetyAPI';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import VirtualizedFeed from '@/components/feed/VirtualizedFeed';
import { Calendar, Star, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, postsAPI } from '../lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { 
  PERFORMANCE_CONFIG, 
  shouldUseVirtualScrolling,
  getOptimalPageSize 
} from '../config/performance';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [closeFriendLoading, setCloseFriendLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const LIMIT = getOptimalPageSize();

  const isOwnProfile = !username || username === currentUser?.username;

  // Determine if we should use virtual scrolling
  const useVirtualScroll = useMemo(() => 
    shouldUseVirtualScrolling(posts.length), 
    [posts.length]
  );

  const loadProfile = async () => {
    setLoading(true);
    try {
      const targetUsername = username || currentUser?.username;
      const profileResponse = await usersAPI.getProfile(targetUsername);
      setProfileUser(profileResponse.data);
      
      // Reset posts state when loading new profile
      setPosts([]);
      setSkip(0);
      setHasMore(true);
      
      // Load first batch of posts
      await loadPosts(targetUsername, false);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (targetUsername, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      }

      const currentSkip = isLoadMore ? skip : 0;
      const postsResponse = await postsAPI.getUserPosts(targetUsername, LIMIT, currentSkip);
      const newPosts = postsResponse.data;

      if (isLoadMore) {
        setPosts(prev => {
          const combined = [...prev, ...newPosts];
          
          // DOM cleanup: keep max posts to prevent memory issues
          if (!useVirtualScroll && combined.length > PERFORMANCE_CONFIG.MAX_POSTS_IN_DOM) {
            const excess = combined.length - PERFORMANCE_CONFIG.MAX_POSTS_IN_DOM;
            console.log(`[Performance] Cleaning up ${excess} old posts from DOM`);
            return combined.slice(excess);
          }
          
          return combined;
        });
      } else {
        setPosts(newPosts);
      }

      setSkip(currentSkip + newPosts.length);
      setHasMore(newPosts.length === LIMIT);
    } catch (error) {
      if (!isLoadMore) {
        toast.error('Failed to load posts');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && profileUser) {
      const targetUsername = username || currentUser?.username;
      loadPosts(targetUsername, true);
    }
  }, [loadingMore, hasMore, skip, profileUser, username, currentUser]);

  const scrollRef = useInfiniteScroll(loadMore, hasMore, loadingMore);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await loadProfile();
  };

  const { containerRef, isPulling, pullDistance, isRefreshing, refreshProgress } = 
    usePullToRefresh(handleRefresh, { enabled: !loading });

  // Scroll-to-top functionality
  const { showScrollTop, scrollToTop } = useScrollToTop(300);

  useEffect(() => {
    loadProfile();
  }, [username, currentUser]);

  const handlePostUpdate = () => {
    // Reset and reload from start
    setSkip(0);
    setHasMore(true);
    const targetUsername = username || currentUser?.username;
    loadPosts(targetUsername, false);
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

  const handleFollow = async () => {
    if (!profileUser) return;
    
    setFollowLoading(true);
    try {
      if (profileUser.is_following) {
        await usersAPI.unfollow(profileUser.id);
        toast.success(`Unfollowed @${profileUser.username}`);
      } else {
        await usersAPI.follow(profileUser.id);
        toast.success(`Following @${profileUser.username}`);
      }
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleCloseFriend = async () => {
    if (!profileUser) return;
    
    setCloseFriendLoading(true);
    try {
      if (profileUser.is_close_friend) {
        await usersAPI.removeFromCloseFriends(profileUser.id);
        toast.success(`Removed from close friends`);
      } else {
        await usersAPI.addToCloseFriends(profileUser.id);
        toast.success(`Added to close friends!`);
      }
      await loadProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update close friends');
    } finally {
      setCloseFriendLoading(false);
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser(profileUser.id);
      setBlockDialogOpen(false);
      toast.success(`Blocked @${profileUser.username}`, {
        description: 'You will no longer see their posts or receive messages.'
      });
      // Optionally navigate back or reload
      window.history.back();
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const formatJoinDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

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

      <div ref={containerRef}>
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 w-full"></div>
       
       <div className="container-padding pb-6">
          <div className="relative flex justify-between items-end -mt-16 mb-6">
             <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={profileUser.avatar} className="object-cover" />
                <AvatarFallback>{profileUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
             </Avatar>
             
             {isOwnProfile ? (
               <Button 
                 className="rounded-full font-semibold" 
                 variant="outline"
                 onClick={() => setEditModalOpen(true)}
               >
                 Edit Profile
               </Button>
             ) : (
               <div className="flex gap-2">
                 <Button 
                   className="rounded-full font-semibold" 
                   variant={profileUser.is_following ? "outline" : "default"}
                   onClick={handleFollow}
                   disabled={followLoading}
                 >
                   {followLoading ? 'Loading...' : profileUser.is_following ? 'Unfollow' : 'Follow'}
                 </Button>
                 <Button 
                   className="rounded-full font-semibold" 
                   variant={profileUser.is_close_friend ? "default" : "outline"}
                   size="icon"
                   onClick={handleToggleCloseFriend}
                   disabled={closeFriendLoading}
                   title={profileUser.is_close_friend ? "Remove from Close Friends" : "Add to Close Friends"}
                 >
                   <Star className={`w-5 h-5 ${profileUser.is_close_friend ? 'fill-current' : ''}`} />
                 </Button>
               </div>
             )}
          </div>
          
          <div className="profile-section-spacing">
             <div className="space-y-1">
                <h1 className="text-2xl font-heading font-bold">{profileUser.name || profileUser.username}</h1>
                <p className="text-muted-foreground">@{profileUser.username}</p>
             </div>
             
             {profileUser.bio && (
               <p className="text-base leading-relaxed max-w-lg">{profileUser.bio}</p>
             )}
             
             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                   <Calendar className="w-4 h-4" /> Joined {formatJoinDate(profileUser.created_at || new Date())}
                </div>
             </div>
             
             <div className="flex gap-6 text-sm">
                <button 
                  onClick={() => setFollowingModalOpen(true)}
                  className="hover:underline"
                >
                  <span className="font-bold text-foreground">{profileUser.following_count}</span>{' '}
                  <span className="text-muted-foreground">Following</span>
                </button>
                <button 
                  onClick={() => setFollowersModalOpen(true)}
                  className="hover:underline"
                >
                  <span className="font-bold text-foreground">{profileUser.followers_count}</span>{' '}
                  <span className="text-muted-foreground">Followers</span>
                </button>
             </div>
          </div>
       </div>
       
       <Tabs defaultValue="posts" className="w-full mt-6">
          <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none px-4 space-x-6">
             <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base">
               Posts
             </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="post-list-spacing container-padding">
             {/* Show CreatePost component only on own profile */}
             {isOwnProfile && (
               <CreatePost onPostCreated={handlePostUpdate} />
             )}
             
             {posts.length === 0 ? (
               <div className="text-center empty-state-spacing text-muted-foreground">
                 {isOwnProfile ? "Create your first post above!" : "No posts yet"}
               </div>
             ) : (
               <>
                 {posts.map(post => (
                   <SwipeablePostCard 
                     key={post.id} 
                     post={post} 
                     onUpdate={handlePostUpdate}
                     onLike={() => handleLike(post.id)}
                     onSave={() => handleSave(post.id)}
                   />
                 ))}

                 {/* Infinite scroll trigger */}
                 <div ref={scrollRef} className="flex justify-center infinite-scroll-spacing">
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
          </TabsContent>
       </Tabs>

       <EditProfileModal 
         open={editModalOpen}
         onOpenChange={setEditModalOpen}
         onProfileUpdated={loadProfile}
       />

       <FollowersModal
         isOpen={followersModalOpen}
         onClose={() => setFollowersModalOpen(false)}
         userId={profileUser?.id}
         title="Followers"
       />

       <FollowersModal
         isOpen={followingModalOpen}
         onClose={() => setFollowingModalOpen(false)}
         userId={profileUser?.id}
         title="Following"
       />
      </div>
    </>
  );
}
