import React from 'react';
import HealthCheck from '../components/HealthCheck';

const Home = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">System Dashboard</h1>
      <HealthCheck />
    </div>
  );
};

export default Home;