import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Explore() {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="relative">
         <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
         <Input 
            placeholder="Search for people, tags, or posts" 
            className="pl-10 h-12 rounded-full bg-muted/50 border-none text-lg"
         />
      </div>

      <div>
         <h3 className="text-lg font-heading font-bold mb-4">Trending Now</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 border-none shadow-none hover:bg-muted/50 transition-colors cursor-pointer">
               <CardContent className="p-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Technology</p>
                  <h4 className="text-xl font-bold">#AIRevolution</h4>
                  <p className="text-sm text-muted-foreground mt-2">24.5K Posts</p>
               </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-none shadow-none hover:bg-muted/50 transition-colors cursor-pointer">
               <CardContent className="p-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Design</p>
                  <h4 className="text-xl font-bold">#Minimalism</h4>
                  <p className="text-sm text-muted-foreground mt-2">12.2K Posts</p>
               </CardContent>
            </Card>
         </div>
      </div>

      <div>
         <h3 className="text-lg font-heading font-bold mb-4">Explore Feed</h3>
         <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {[1,2,3,4,5,6,7,8,9].map((i) => (
               <div key={i} className="break-inside-avoid rounded-xl overflow-hidden group relative cursor-pointer">
                  <img 
                     src={`https://picsum.photos/seed/${i * 123}/400/${Math.floor(Math.random() * 200) + 400}`} 
                     alt="Explore" 
                     className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
