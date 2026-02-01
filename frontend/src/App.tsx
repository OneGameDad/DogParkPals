import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
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



function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="flex flex-col min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/imgs/background.png')" }}>
        <Navbar />
        {/* The Router Switch */}
        <div className="flex-grow p-8">
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
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;