import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '@/components/post/PostCard';
import EditProfileModal from '@/components/profile/EditProfileModal';
import FollowersModal from '../components/follow/FollowersModal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, postsAPI } from '../lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [closeFriendLoading, setCloseFriendLoading] = useState(false);

  const isOwnProfile = !username || username === currentUser?.username;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const targetUsername = username || currentUser?.username;
      const [profileResponse, postsResponse] = await Promise.all([
        usersAPI.getProfile(targetUsername),
        postsAPI.getUserPosts(targetUsername),
      ]);
      setProfileUser(profileResponse.data);
      setPosts(postsResponse.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, currentUser]);

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

  const formatJoinDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div>
       {/* Banner */}
       <div className="h-48 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 w-full"></div>
       
       <div className="px-4 pb-4">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
             <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={profileUser.avatar} className="object-cover" />
                <AvatarFallback>{profileUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
             </Avatar>
             
             {isOwnProfile ? (
               <Button 
                 className="mb-2 rounded-full font-semibold" 
                 variant="outline"
                 onClick={() => setEditModalOpen(true)}
               >
                 Edit Profile
               </Button>
             ) : (
               <div className="flex gap-2 mb-2">
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
          
          <div className="space-y-4">
             <div>
                <h1 className="text-2xl font-heading font-bold">{profileUser.username}</h1>
                <p className="text-muted-foreground">@{profileUser.username}</p>
             </div>
             
             {profileUser.bio && (
               <p className="text-base leading-relaxed max-w-lg">{profileUser.bio}</p>
             )}
             
             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
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
          
          <TabsContent value="posts" className="space-y-4 p-4">
             {posts.length === 0 ? (
               <div className="text-center py-10 text-muted-foreground">No posts yet</div>
             ) : (
               posts.map(post => (
                 <PostCard key={post.id} post={post} onUpdate={loadProfile} />
               ))
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
  );
}
