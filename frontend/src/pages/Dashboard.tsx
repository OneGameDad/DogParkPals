import { useTranslation } from 'react-i18next';
import { FavoriteParks, ParkExplorer } from '../components/parks';
import OrganizationList from '../components/organizations/OrganizationList';

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-md">{t('dashboard', 'Dashboard')}</h1>

      <FavoriteParks />

      <div className="mt-12">
        <ParkExplorer />
      </div>

      <div className="mt-12">
        <OrganizationList />
      </div>
    </div>
  );
};

export default Dashboard;