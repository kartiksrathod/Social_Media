import React from 'react';
import { NOTIFICATIONS } from '@/lib/mockData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, UserPlus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Notifications() {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-heading font-bold mb-6 text-text-primary">Notifications</h2>
      
      <div className="space-y-3">
         {NOTIFICATIONS.map((notif) => (
            <div 
              key={notif.id} 
              className="flex items-start gap-4 p-4 rounded-xl bg-surface-700 hover:bg-surface-600 transition-all duration-200 border border-border hover:border-primary/30 cursor-pointer group card-premium"
            >
               <div className="mt-1">
                  {notif.type === 'like' && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Heart className="w-5 h-5 text-primary fill-current" />
                    </div>
                  )}
                  {notif.type === 'follow' && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <UserPlus className="w-5 h-5 text-primary fill-current" />
                    </div>
                  )}
                  {notif.type === 'comment' && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MessageCircle className="w-5 h-5 text-primary fill-current" />
                    </div>
                  )}
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                     <Avatar className="w-8 h-8 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={notif.user.avatar} />
                        <AvatarFallback>{notif.user.name[0]}</AvatarFallback>
                     </Avatar>
                     <span className="font-semibold text-sm text-text-primary truncate">{notif.user.name}</span>
                     <span className="text-xs text-text-muted flex-shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{notif.content}</p>
               </div>
            </div>
         ))}
         {/* Duplicating for full list effect */}
         {[1,2,3].map(i => (
            <div 
              key={`dup-${i}`} 
              className="flex items-start gap-4 p-4 rounded-xl bg-surface-700 hover:bg-surface-600 transition-all duration-200 border border-border hover:border-primary/30 cursor-pointer group card-premium"
            >
               <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Heart className="w-5 h-5 text-primary fill-current" />
                  </div>
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                     <Avatar className="w-8 h-8 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                        <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 5}`} />
                        <AvatarFallback>U</AvatarFallback>
                     </Avatar>
                     <span className="font-semibold text-sm text-text-primary truncate">User {i}</span>
                     <span className="text-xs text-text-muted flex-shrink-0">2h ago</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">liked your recent post</p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
