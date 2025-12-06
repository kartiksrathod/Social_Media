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

  // Desktop: Icon-only sidebar
  if (!isMobile) {
    return (
      <div className="flex flex-col h-full py-6 px-3 items-center">
        {/* Brand Icon Only */}
        <Link to="/home" className="mb-10 group relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-primary/80 flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-primary/60 transition-all duration-500 hover:scale-110 group-hover:rotate-12 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Sparkles className="w-8 h-8 text-primary-foreground relative z-10 animate-pulse group-hover:animate-none" />
          </div>
          {/* Enhanced Tooltip */}
          <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gradient-to-r from-surface-700 to-surface-600 backdrop-blur-xl text-foreground text-sm font-semibold rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 border border-primary/20 group-hover:translate-x-0 -translate-x-2">
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">SocialVibe</span>
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-surface-700"></div>
          </div>
        </Link>

        {/* Navigation - Icon Only */}
        <nav className="flex-1 flex flex-col gap-3 w-full">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group relative"
            >
              <div
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative overflow-hidden
                  ${isActive(link.href) 
                    ? 'bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-xl shadow-primary/40 scale-105' 
                    : 'text-muted-foreground hover:bg-gradient-to-br hover:from-surface-700 hover:to-surface-600 hover:text-foreground hover:scale-110 hover:shadow-lg'
                  }
                `}
              >
                {/* Active indicator pulse */}
                {isActive(link.href) && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-pulse"></div>
                )}
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <link.icon className={`w-6 h-6 transition-all duration-500 relative z-10 ${isActive(link.href) ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-125 group-hover:rotate-6'}`} />
              </div>
              {/* Enhanced Tooltip on hover */}
              <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gradient-to-r from-surface-700 to-surface-600 backdrop-blur-xl text-foreground text-sm font-semibold rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 border border-primary/10 group-hover:translate-x-0 -translate-x-2">
                {link.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-surface-700"></div>
              </div>
            </Link>
          ))}
          
          {/* Post Button - Icon Only */}
          <Link to="/profile" className="group relative mt-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-primary/60 transition-all duration-500 hover:scale-110 group-hover:rotate-12 relative overflow-hidden">
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <PlusCircle className="w-7 h-7 text-primary-foreground relative z-10 group-hover:rotate-90 transition-transform duration-500" />
            </div>
            {/* Enhanced Tooltip */}
            <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gradient-to-r from-surface-700 to-surface-600 backdrop-blur-xl text-foreground text-sm font-semibold rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 border border-primary/20 group-hover:translate-x-0 -translate-x-2">
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Create Post</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-surface-700"></div>
            </div>
          </Link>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-border/50 w-full">
          {/* User Avatar */}
          {user && (
            <Link to="/profile" className="group relative">
              <div className="relative">
                <Avatar className="w-14 h-14 ring-2 ring-border hover:ring-primary transition-all duration-500 hover:scale-110 cursor-pointer hover:shadow-xl hover:shadow-primary/30">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground font-bold">{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                {/* Active status indicator */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full ring-2 ring-surface-800 group-hover:scale-110 transition-transform duration-300"></div>
              </div>
              {/* Enhanced Tooltip */}
              <div className="absolute left-full ml-6 bottom-0 px-4 py-3 bg-gradient-to-r from-surface-700 to-surface-600 backdrop-blur-xl rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out z-50 min-w-[180px] border border-primary/10 group-hover:translate-x-0 -translate-x-2">
                <p className="text-sm font-bold text-foreground">{user.name || user.username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">@{user.username}</p>
                <div className="absolute right-full bottom-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-surface-700"></div>
              </div>
            </Link>
          )}
          
          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="group relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-gradient-to-br hover:from-surface-700 hover:to-surface-600 hover:text-foreground transition-all duration-500 hover:scale-110 hover:shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 relative z-10 group-hover:rotate-180 transition-transform duration-700" />
              ) : (
                <Moon className="w-6 h-6 relative z-10 group-hover:-rotate-180 transition-transform duration-700" />
              )}
            </div>
            {/* Enhanced Tooltip */}
            <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gradient-to-r from-surface-700 to-surface-600 backdrop-blur-xl text-foreground text-sm font-semibold rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 border border-primary/10 group-hover:translate-x-0 -translate-x-2">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-surface-700"></div>
            </div>
          </button>
          
          {/* Logout */}
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="group relative"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-muted-foreground hover:bg-gradient-to-br hover:from-red-500/20 hover:to-destructive/20 hover:text-destructive transition-all duration-500 hover:scale-110 hover:shadow-lg hover:shadow-destructive/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <LogOut className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            {/* Enhanced Tooltip */}
            <div className="absolute left-full ml-6 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gradient-to-r from-surface-700 to-surface-600 backdrop-blur-xl text-foreground text-sm font-semibold rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 border border-destructive/20 group-hover:translate-x-0 -translate-x-2">
              <span className="text-destructive">Logout</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-surface-700"></div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Mobile: Full sidebar with labels
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
        <Link to="/profile" className="block w-full mt-6">
          <Button className="w-full rounded-full h-12 text-lg font-semibold button-primary">
             <PlusCircle className="mr-2 w-5 h-5" /> Post
          </Button>
        </Link>
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
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      {/* Desktop Sidebar - Icon-Only Sleek Design */}
      <aside className="hidden md:flex w-24 fixed left-0 top-0 bottom-0 border-r border-border/50 bg-gradient-to-b from-surface-800/95 via-surface-800/98 to-surface-900/95 backdrop-blur-2xl z-40 shadow-2xl">
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
      <main className="flex-1 w-full max-w-2xl md:ml-24 min-h-screen border-x border-border pb-20 md:pb-0 pt-16 md:pt-0 bg-surface-900">
         <Outlet />
      </main>

      {/* Mobile Bottom Navigation - Touch-optimized */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-800/95 backdrop-blur-md border-t border-border z-50 safe-area-inset-bottom">
         <nav className="h-full flex items-center justify-around px-2">
            {[
              { label: "Home", href: "/home", icon: Home },
              { label: "Explore", href: "/explore", icon: Search },
              { label: "Messages", href: "/messages", icon: MessageSquare },
              { label: "Profile", href: "/profile", icon: User },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`
                  flex flex-col items-center justify-center gap-1 min-w-[70px] min-h-[56px] flex-1
                  transition-all duration-200 touch-manipulation no-select tap-feedback rounded-lg
                  ${isActive(link.href) 
                    ? 'text-primary scale-105' 
                    : 'text-muted-foreground active:text-foreground'
                  }
                `}
              >
                <link.icon className={`w-6 h-6 ${isActive(link.href) ? 'scale-110 drop-shadow-lg' : ''} transition-all duration-200`} />
                <span className={`text-xs font-medium ${isActive(link.href) ? 'font-semibold' : ''}`}>{link.label}</span>
              </Link>
            ))}
         </nav>
      </div>

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
