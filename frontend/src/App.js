import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SocketProvider } from "./contexts/SocketContext";

// Lazy load all page components for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Feed = lazy(() => import("./pages/Feed"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const Explore = lazy(() => import("./pages/Explore"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const HashtagPage = lazy(() => import("./pages/HashtagPage"));
const Messages = lazy(() => import("./pages/Messages"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const CloseFriends = lazy(() => import("./pages/CloseFriends"));
const AppLayout = lazy(() => import("./components/layout/AppLayout"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Protected Route - Requires authentication
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App antialiased">
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  {/* Protected App Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/home" element={<Feed />} />
                      <Route path="/explore" element={<Explore />} />
                      <Route path="/search" element={<SearchResults />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/saved" element={<SavedPosts />} />
                      <Route path="/close-friends" element={<CloseFriends />} />
                      <Route path="/hashtag/:tag" element={<HashtagPage />} />
                      <Route path="/profile/:username" element={<Profile />} />
                      <Route path="/profile" element={<Profile />} /> {/* Self profile */}
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster position="bottom-right" theme="system" />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
