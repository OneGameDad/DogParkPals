import { useState } from 'react';
import { FilterTabs } from '../components/common';
import { AdminUsers, AdminDogs, AdminParks, AdminOrganizations, AdminEvents } from '../components/admin';

type AdminTab = 'users' | 'dogs' | 'parks' | 'organizations' | 'events';

const tabs = [
  { id: 'users' as AdminTab, label: 'Users' },
  { id: 'dogs' as AdminTab, label: 'Dogs' },
  { id: 'parks' as AdminTab, label: 'Parks' },
  { id: 'organizations' as AdminTab, label: 'Organizations' },
  { id: 'events' as AdminTab, label: 'Events' },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-md">Admin Panel</h1>

      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <FilterTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8" />

        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'dogs' && <AdminDogs />}
        {activeTab === 'parks' && <AdminParks />}
        {activeTab === 'organizations' && <AdminOrganizations />}
        {activeTab === 'events' && <AdminEvents />}
      </div>
    </div>
  );
};

export default Admin;
