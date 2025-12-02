import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden bg-card">
      <CardHeader className="p-4 pb-2 flex flex-row items-start gap-4 space-y-0">
        <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all">
          <AvatarImage src={post.user.avatar} />
          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm hover:underline cursor-pointer">{post.user.name}</h4>
              <p className="text-xs text-muted-foreground">{post.user.handle} • {post.timestamp}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        
        {post.image && (
          <div className="rounded-xl overflow-hidden border border-border/50 bg-muted">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full text-muted-foreground">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`group px-2 h-8 hover:text-accent ${liked ? 'text-accent' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`w-5 h-5 mr-1.5 transition-transform group-active:scale-75 ${liked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{likeCount}</span>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="group px-2 h-8 hover:text-primary">
                  <MessageCircle className="w-5 h-5 mr-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">{post.comments}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                         <AvatarImage src="https://i.pravatar.cc/100?img=12" />
                         <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                         <Input placeholder="Write a comment..." className="w-full" />
                      </div>
                   </div>
                   <div className="space-y-4 mt-4 max-h-[300px] overflow-y-auto pr-2">
                      {[1, 2, 3].map((c) => (
                         <div key={c} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                               <AvatarImage src={`https://i.pravatar.cc/100?img=${c + 5}`} />
                               <AvatarFallback>U{c}</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted/50 p-3 rounded-xl rounded-tl-none text-sm">
                               <span className="font-semibold block text-xs mb-1">User {c}</span>
                               This is a mock comment to show the UI structure. Looks great!
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" className="group px-2 h-8 hover:text-green-500">
              <Share2 className="w-5 h-5 mr-1.5 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-medium">{post.shares}</span>
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
             <Bookmark className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
