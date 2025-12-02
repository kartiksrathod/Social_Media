import React from 'react';
import { NOTIFICATIONS } from '@/lib/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, UserPlus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Notifications() {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-heading font-bold mb-6">Notifications</h2>
      
      <div className="space-y-2">
         {NOTIFICATIONS.map((notif) => (
            <div key={notif.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 cursor-pointer">
               <div className="mt-1">
                  {notif.type === 'like' && <Heart className="w-6 h-6 text-accent fill-current" />}
                  {notif.type === 'follow' && <UserPlus className="w-6 h-6 text-primary fill-current" />}
                  {notif.type === 'comment' && <MessageCircle className="w-6 h-6 text-blue-500 fill-current" />}
               </div>
               
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <Avatar className="w-8 h-8">
                        <AvatarImage src={notif.user.avatar} />
                        <AvatarFallback>{notif.user.name[0]}</AvatarFallback>
                     </Avatar>
                     <span className="font-semibold text-sm">{notif.user.name}</span>
                     <span className="text-muted-foreground text-sm">{notif.timestamp}</span>
                  </div>
                  <p className="text-base">{notif.content}</p>
               </div>
            </div>
         ))}
         {/* Duplicating for full list effect */}
         {[1,2,3].map(i => (
            <div key={`dup-${i}`} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 cursor-pointer">
               <div className="mt-1">
                   <Heart className="w-6 h-6 text-accent fill-current" />
               </div>
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 5}`} />
                        <AvatarFallback>U</AvatarFallback>
                     </Avatar>
                     <span className="font-semibold text-sm">User {i}</span>
                     <span className="text-muted-foreground text-sm">2h ago</span>
                  </div>
                  <p className="text-base">liked your recent post</p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
