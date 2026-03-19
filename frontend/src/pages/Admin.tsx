import { useState } from 'react';
import { FilterTabs } from '../components/common';
import { AdminUsers, AdminDogs, AdminParks, AdminOrganizations, AdminEvents } from '../components/admin';
import { useTranslation } from 'react-i18next';

type AdminTab = 'users' | 'dogs' | 'parks' | 'organizations' | 'events';

const Admin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  const tabs = [
    { id: 'users' as AdminTab, label: t('admin.tabs.users') },
    { id: 'dogs' as AdminTab, label: t('admin.tabs.dogs') },
    { id: 'parks' as AdminTab, label: t('admin.tabs.parks') },
    { id: 'organizations' as AdminTab, label: t('admin.tabs.organizations') },
    { id: 'events' as AdminTab, label: t('admin.tabs.events') },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-md">
        {t('admin.title')}
      </h1>

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
