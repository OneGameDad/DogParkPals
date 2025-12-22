import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LanguageSwitcher from './components/LanguageSwitcher';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <LanguageSwitcher />
      <Navbar />

      {/* The Router Switch */}
      <div style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;