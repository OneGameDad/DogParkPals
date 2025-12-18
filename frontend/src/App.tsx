import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Placeholder Pages (Move these to src/pages/ later)
const Home = () => <h1 className="text-3xl font-bold">🐶🐶🐶🐶🐶 DogTinderInc 🐶🐶🐶🐶</h1>;
const Login = () => <h1>Login Page</h1>;
const Dashboard = () => <h1>User Dashboard</h1>;

function App() {
  return (
    <BrowserRouter>
      {/* Temporary Navbar for testing */}
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
        <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
        <Link to="/dashboard">Dashboard</Link>
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