import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      {/* Temporary Navbar for testing */}
      <nav className='p-4 border-b border-gray-200 bg-white flex gap-6 shadow-sm items-center'>
          <Link to="/" className='text-gray-600 hover:text-blue-600 font-medium transition-colors'>Home</Link>
          <Link to="/login" className='text-gray-600 hover:text-blue-600 font-medium transition-colors'>Login</Link>
        <Link to="/dashboard" className='text-gray-600 hover:text-blue-600 font-medium transition-colors'>Dashboard</Link>
      </nav>

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