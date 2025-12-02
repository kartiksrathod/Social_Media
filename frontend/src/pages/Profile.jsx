import React from 'react';
import { USERS, POSTS } from '@/lib/mockData';
import PostCard from '@/components/post/PostCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const user = USERS[0]; // Mock user (Sarah Wilson)

  return (
    <div>
       {/* Banner */}
       <div className="h-48 bg-gradient-hero w-full"></div>
       
       <div className="px-4 pb-4">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
             <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={user.avatar} className="object-cover" />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
             </Avatar>
             <Button className="mb-2 rounded-full font-semibold" variant="outline">
                Edit Profile
             </Button>
          </div>
          
          <div className="space-y-4">
             <div>
                <h1 className="text-2xl font-heading font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.handle}</p>
             </div>
             
             <p className="text-base leading-relaxed max-w-lg">{user.bio}</p>
             
             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                   <MapPin className="w-4 h-4" /> San Francisco, CA
                </div>
                <div className="flex items-center gap-1">
                   <LinkIcon className="w-4 h-4" /> sarahwilson.design
                </div>
                <div className="flex items-center gap-1">
                   <Calendar className="w-4 h-4" /> Joined March 2023
                </div>
             </div>
             
             <div className="flex gap-6 text-sm">
                <div><span className="font-bold text-foreground">{user.following}</span> <span className="text-muted-foreground">Following</span></div>
                <div><span className="font-bold text-foreground">{user.followers}</span> <span className="text-muted-foreground">Followers</span></div>
             </div>
          </div>
       </div>
       
       <Tabs defaultValue="posts" className="w-full mt-6">
          <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none px-4 space-x-6">
             <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base">Posts</TabsTrigger>
             <TabsTrigger value="replies" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base text-muted-foreground">Replies</TabsTrigger>
             <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base text-muted-foreground">Media</TabsTrigger>
             <TabsTrigger value="likes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-base text-muted-foreground">Likes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 p-4">
             {POSTS.filter(p => p.user.id === user.id).map(post => (
                <PostCard key={post.id} post={post} />
             ))}
             {/* Mock content if empty */}
             {POSTS.length === 0 && <div className="text-center py-10 text-muted-foreground">No posts yet</div>}
          </TabsContent>
       </Tabs>
    </div>
  );
}
