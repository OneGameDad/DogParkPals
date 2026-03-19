import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Verify authentication by calling /auth/me
        await api.get('/auth/me');
        
        // Dispatch auth event
        window.dispatchEvent(new Event('auth:login'));
        
        // Redirect to home
        navigate('/');
      } catch (error) {
        console.error('Authentication failed:', error);
        // Redirect to login on error
        navigate('/login');
      }
    })();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Signing you in...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
