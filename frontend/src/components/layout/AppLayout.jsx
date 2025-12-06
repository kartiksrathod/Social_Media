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
  Sun,
  Bookmark,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import TrendingSection from './TrendingSection';
import SearchBar from '../search/SearchBar';
import NotificationBell from '../notification/NotificationBell';
import SuggestedUsers from '../follow/SuggestedUsers';

const SidebarContent = ({ isMobile = false }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const links = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Explore", href: "/explore", icon: Search },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Saved", href: "/saved", icon: Bookmark },
    { label: "Close Friends", href: "/close-friends", icon: Star },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Brand - Strong accent identity */}
      <div className="flex items-center gap-3 mb-8 px-2">
         <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-subtle">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-primary">
          SocialVibe
        </h1>
      </div>

      {/* Navigation - Active states with accent */}
      <nav className="space-y-2 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className={`
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive(link.href) 
                ? 'active-accent font-semibold border border-primary/30' 
                : 'text-muted-foreground hover:bg-surface-700 hover-accent border border-transparent'
              }
            `}
          >
            <link.icon className={`w-6 h-6 transition-colors ${isActive(link.href) ? 'fill-current' : ''}`} />
            <span className="text-lg">{link.label}</span>
          </Link>
        ))}
        
        {/* Primary Button - Accent with glow */}
        <Button className="w-full mt-6 rounded-full h-12 text-lg font-semibold button-primary">
           <PlusCircle className="mr-2 w-5 h-5" /> Post
        </Button>
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t border-border pt-6">
         {user && (
           <Link 
             to="/profile"
             className="flex items-center gap-3 px-2 mb-4 cursor-pointer hover:bg-surface-700 p-2 rounded-lg transition-colors"
           >
              <Avatar className="ring-2 ring-border">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-semibold truncate">{user.name || user.username}</p>
                 <p className="text-xs text-text-muted truncate">@{user.username}</p>
              </div>
           </Link>
         )}
         
         {/* Settings - Hover accent only */}
         <div className="space-y-2">
            <Button 
               variant="ghost" 
               className="w-full justify-start text-muted-foreground hover-accent hover:bg-surface-700"
               onClick={toggleTheme}
            >
               {theme === 'dark' ? (
                  <><Sun className="mr-2 w-5 h-5" /> Light Mode</>
               ) : (
                  <><Moon className="mr-2 w-5 h-5" /> Dark Mode</>
               )}
            </Button>
            <Button 
               variant="ghost" 
               className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-surface-700"
               onClick={() => {
                 logout();
                 navigate('/');
               }}
            >
               <LogOut className="mr-2 w-5 h-5" /> Logout
            </Button>
         </div>
      </div>
    </div>
  );
};

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      {/* Desktop Sidebar - Refined surfaces */}
      <aside className="hidden md:flex w-72 fixed left-0 top-0 bottom-0 border-r border-border bg-surface-800 backdrop-blur-md z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header - Clean with accent */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface-800/95 backdrop-blur-md border-b border-border z-50 px-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-subtle">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-primary">SocialVibe</span>
         </div>
         <div className="flex items-center gap-2">
            <NotificationBell />
            <Sheet>
               <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover-accent">
                     <Menu className="w-6 h-6" />
                  </Button>
               </SheetTrigger>
               <SheetContent side="left" className="w-80 p-0 bg-surface-800 border-border">
                  <SidebarContent isMobile />
               </SheetContent>
            </Sheet>
         </div>
      </div>

      {/* Main Content Area - Natural background */}
      <main className="flex-1 w-full max-w-2xl md:ml-72 min-h-screen border-x border-border pb-20 md:pb-0 pt-16 md:pt-0 bg-surface-900">
         <Outlet />
      </main>

      {/* Right Sidebar - Elevated surface */}
      <aside className="hidden lg:block w-80 fixed right-0 top-0 bottom-0 border-l border-border p-6 bg-surface-800 backdrop-blur-md z-40">
         <div className="sticky top-6 space-y-6">
            {/* Search Bar */}
            <SearchBar />

            {/* Trending Hashtags */}
            <TrendingSection />

            {/* Suggested Users */}
            <SuggestedUsers />
         </div>
      </aside>
    </div>
  );
}
