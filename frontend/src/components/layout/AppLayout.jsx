import React from 'react';
import { 
  Home, 
  Search, 
  Bell, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  PlusCircle,
  Sparkles,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const SidebarContent = ({ isMobile = false }) => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const links = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Explore", href: "/explore", icon: Search },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Messages", href: "/messages", icon: MessageSquare }, // Mocked route
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-full py-6 px-4">
      <div className="flex items-center gap-3 mb-8 px-2">
         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          SocialVibe
        </h1>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className={`
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive(link.href) 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
          >
            <link.icon className={`w-6 h-6 ${isActive(link.href) ? 'fill-current' : ''}`} />
            <span className="text-lg">{link.label}</span>
          </Link>
        ))}
        
        <Button className="w-full mt-6 rounded-full h-12 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
           <PlusCircle className="mr-2 w-5 h-5" /> Post
        </Button>
      </nav>

      <div className="mt-auto border-t border-border pt-6">
         <div className="flex items-center gap-3 px-2 mb-4 cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors">
            <Avatar>
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold truncate">John Doe</p>
               <p className="text-xs text-muted-foreground truncate">@johndoe</p>
            </div>
         </div>
         <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="mr-2 w-5 h-5" /> Logout
         </Button>
      </div>
    </div>
  );
};

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 fixed left-0 top-0 bottom-0 border-r border-border/50 bg-card/50 backdrop-blur-md z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 px-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">SocialVibe</span>
         </div>
         <Sheet>
            <SheetTrigger asChild>
               <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
               </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
               <SidebarContent isMobile />
            </SheetContent>
         </Sheet>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl md:ml-72 min-h-screen border-x border-border/50 pb-20 md:pb-0 pt-16 md:pt-0">
         <Outlet />
      </main>

      {/* Right Sidebar (Suggestions) */}
      <aside className="hidden lg:block w-80 fixed right-0 top-0 bottom-0 border-l border-border/50 p-6 bg-card/50 backdrop-blur-md z-40">
         <div className="sticky top-6">
            <div className="relative mb-8">
               <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
               <input 
                  type="text" 
                  placeholder="Search SocialVibe" 
                  className="w-full bg-muted/50 border-none rounded-full pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all"
               />
            </div>

            <div className="mb-8">
               <h3 className="font-heading font-bold text-lg mb-4">Trends for you</h3>
               <div className="space-y-4">
                  {['#DesignSystem', '#WebDev', '#AIArt', '#Photography', '#StartupLife'].map((tag, i) => (
                     <div key={i} className="flex justify-between items-start group cursor-pointer">
                        <div>
                           <p className="text-xs text-muted-foreground">Trending in Tech</p>
                           <p className="font-semibold group-hover:text-primary transition-colors">{tag}</p>
                           <p className="text-xs text-muted-foreground">12.5K Posts</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-xl">...</span>
                        </Button>
                     </div>
                  ))}
               </div>
            </div>

            <div>
               <h3 className="font-heading font-bold text-lg mb-4">Who to follow</h3>
               <div className="space-y-4">
                  {[
                     { name: "Sarah Wilson", handle: "@sarahw", img: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?auto=format&fit=crop&w=100&h=100" },
                     { name: "Alex Chen", handle: "@alexc", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&h=100" }
                  ].map((user, i) => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10">
                              <AvatarImage src={user.img} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                           </Avatar>
                           <div className="flex flex-col">
                              <span className="text-sm font-semibold hover:underline cursor-pointer">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.handle}</span>
                           </div>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                           Follow
                        </Button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </aside>
    </div>
  );
}
