import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Smile, MapPin, Calendar } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CreatePost() {
  return (
    <Card className="border-border/50 shadow-sm bg-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 hidden sm:block">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
             <Textarea 
                placeholder="What's happening?" 
                className="min-h-[80px] resize-none border-none focus-visible:ring-0 p-0 text-lg placeholder:text-muted-foreground bg-transparent"
             />
             
             <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-primary">
                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                      <Image className="w-5 h-5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                      <Smile className="w-5 h-5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hidden sm:inline-flex">
                      <Calendar className="w-5 h-5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hidden sm:inline-flex">
                      <MapPin className="w-5 h-5" />
                   </Button>
                </div>
                
                <Button className="rounded-full px-6 font-semibold shadow-md shadow-primary/20 hover:shadow-primary/40">
                   Post
                </Button>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
