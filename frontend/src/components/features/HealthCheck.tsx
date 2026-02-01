import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const HealthCheck: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const checkHealth = async () => {
    setIsLoading(true);
    setError(false);
    setStatus('Pinging server...');

    try {
      await new Promise(r => setTimeout(r, 500));
      
      const data = await api.healthCheck();
      setStatus(data.status);
    } catch (err) {
      console.error(err);
      setError(true);
      setStatus('OFFLINE');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className={`p-6 rounded-lg border shadow-sm transition-all ${
      isLoading ? "bg-gray-50 border-gray-200" :
      error ? "bg-red-50 border-red-200" :
      "bg-green-50 border-green-200"
    }`}>
      <h2 className="text-lg font-semibold text-gray-700 mb-2">Backend Connectivity</h2>
      
      <div className="flex items-center gap-3">
        {/* Status Indicator Dot */}
        <span className={`h-3 w-3 rounded-full ${
          isLoading ? "bg-gray-400 animate-pulse" :
          error ? "bg-red-500" :
          "bg-green-500"
        }`} />
        
        <span className={`font-mono text-xl ${
          error ? "text-red-700" : "text-green-700"
        }`}>
          {status || 'Waiting...'}
        </span>
      </div>


      {/* Retry Button */}
      <button
        onClick={checkHealth}
        disabled={isLoading}
        className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Checking...' : 'Refresh Status'}
      </button>
    </div>
  );
};

export default HealthCheck;
