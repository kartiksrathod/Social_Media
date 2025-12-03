import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SocketProvider } from "./contexts/SocketContext";
import LandingPage from "./pages/LandingPage";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import SavedPosts from "./pages/SavedPosts";
import HashtagPage from "./pages/HashtagPage";
import Messages from "./pages/Messages";
import AppLayout from "./components/layout/AppLayout";

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
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/saved" element={<SavedPosts />} />
                    <Route path="/hashtag/:tag" element={<HashtagPage />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/profile" element={<Profile />} /> {/* Self profile */}
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster position="bottom-right" theme="system" />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
