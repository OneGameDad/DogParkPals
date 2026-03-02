import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth, useHeartbeat } from './hooks';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Social from './pages/Social';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Profile from './pages/Profile';
import { Navbar, Footer } from './components/layout';
import DogProfile from './pages/DogProfile';
import GoogleCallback from './pages/GoogleCallback';
import { ProtectedRoute } from './components/features';
import EditProfile from './pages/EditProfile';
import EditDogProfile from './pages/EditDogProfile';
import ParkDetails from './pages/ParkDetails';
import CreateOrganization from './pages/CreateOrganization';
import OrganizationList from './components/organizations/OrganizationList';
import OrganizationProfile from './pages/OrganizationProfile';
import OrganizationUpdate from './pages/OrganizationUpdate';
import Messages from './pages/Messages';
import Events from './pages/Events';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';

  // Send heartbeat for logged-in users
  useHeartbeat({
    enabled: !!user,
    interval: 120000 // 2 minutes
  });

  return (
    <>
      <Toaster position="top-right" />
      <div
        className={
          isMessagesPage
            ? "flex flex-col h-screen overflow-hidden"
            : "flex flex-col min-h-screen"
        }
        style={{
          backgroundImage: "url(/imgs/background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}>
        <Navbar />
        {/* The Router Switch */}
        <div className={isMessagesPage ? "flex-1 overflow-hidden relative flex flex-col min-h-0" : "flex-1 overflow-y-auto p-8"}>
          <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path="/" element={<Home />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/social" element={
              <ProtectedRoute>
                <Social />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/user/:id" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/dog/add" element={
              <ProtectedRoute>
                <EditDogProfile />
              </ProtectedRoute>
            } />
            <Route path="/dog/:id" element={
              <ProtectedRoute>
                <DogProfile />
              </ProtectedRoute>
            } />
            <Route path="/logout" element={
              <ProtectedRoute>
                <Logout />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/dog/:id/edit" element={
              <ProtectedRoute>
                <EditDogProfile />
              </ProtectedRoute>
            } />
            <Route path="/parks/:id" element={
              <ProtectedRoute>
                <ParkDetails />
              </ProtectedRoute>
            } />
            <Route path="/organizations" element={
              <ProtectedRoute>
                <OrganizationList />
              </ProtectedRoute>
            } />
            <Route path="/organizations/create" element={
              <ProtectedRoute>
                <CreateOrganization />
              </ProtectedRoute>
            } />
            <Route path="/organizations/:id" element={
              <ProtectedRoute>
                <OrganizationProfile />
              </ProtectedRoute>
            } />
            <Route path="/organizations/:id/edit" element={
              <ProtectedRoute>
                <OrganizationUpdate />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
          </Routes>
        </div>

        {!isMessagesPage && <Footer />}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;