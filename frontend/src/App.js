import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import AppLayout from "./components/layout/AppLayout";

// Protected Route Mock - For prototype we just allow access but good to have structure
const ProtectedRoute = () => {
  const isAuthenticated = true; // Mocked authentication
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App antialiased">
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
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/profile" element={<Profile />} /> {/* Self profile */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="system" />
    </div>
  );
}

export default App;
