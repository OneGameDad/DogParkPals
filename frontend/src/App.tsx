import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DogProfile from './pages/DogProfile';
import GoogleCallback from './pages/GoogleCallback';


function App() {
  return (
    <BrowserRouter>
    <div className="flex flex-col min-h-screen bg-cover bg-center bg-fixed" 
     style={{backgroundImage: "url('/imgs/background.png')"}}>
      <Navbar />
      {/* The Router Switch */}
      <div className="flex-grow p-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dog/:id" element={<DogProfile />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
        </Routes>
      </div>

      <Footer />
    </div>
    </BrowserRouter>
  );
}

export default App;