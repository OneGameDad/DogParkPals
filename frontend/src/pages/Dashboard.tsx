import { useTranslation } from 'react-i18next';
import { FavoriteParks, ParkExplorer } from '../components/parks';

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('dashboard', 'Dashboard')}</h1>

      <FavoriteParks />

      <ParkExplorer />
    </div>
  );
};

export default Dashboard;