import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useParkDetails, useParkCheckIn, useParkFavorite, useParkEvents } from '../hooks';
import { Loading, ErrorMessage, BodyText, Button, Modal } from '../components/common';
import { ParkHero, ParkAmenities, ParkActions, ParkLocationMap, CheckInList } from '../components/parks';
import { EventList, CreateEventForm } from '../components/events';
import { Header } from '../components/layout';

const ParkDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { park, checkIns, loading, error, refetch } = useParkDetails(id);
  const { isCheckedIn, toggleCheckIn } = useParkCheckIn(id, checkIns);
  const { isFavorite, toggleFavorite } = useParkFavorite(id);
  const { events, loading: eventsLoading, refetch: refetchEvents } = useParkEvents(id);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCheckInToggle = async () => {
    if (actionLoading) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await toggleCheckIn();
      await refetch();
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (actionLoading) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await toggleFavorite();
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading />;

  if (error || !park) {
    return <ErrorMessage message={t('parks.error', 'Failed to load park details')} />;
  }

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <Link
        to="/dashboard"
        className="text-blue-600 hover:text-blue-800 mb-6 inline-block font-medium"
      >
        ← {t('common.goBack', 'Go Back')}
      </Link>

      <ParkHero
        name={park.name}
        imageUrl={park.profilePictureUrl}
      />

      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <CheckInList
          checkIns={checkIns}
          loading={loading}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Info */}
          <div className="flex-1">
            <ParkAmenities amenities={park.amenities} />

            <div className="mb-8">
              <Header
                text={t('parkDetails.description', 'Description')}
                level="h3"
                className="mb-4"
              />
              <BodyText
                text={park.description || t('parks.noDescription', 'No description available')}
                className="text-gray-700 leading-relaxed"
              />
            </div>

            <div className="mb-8 border-t border-gray-100 pt-8">
              <div className="flex justify-between items-center mb-4">
                <Header
                  text={t('parkDetails.events', 'Upcoming Events')}
                  level="h3"
                />
                <Button
                  text={t('events.createButton', 'Create Event')}
                  size="sm"
                  onClick={() => setIsEventModalOpen(true)}
                />
              </div>
              <EventList
                events={events}
                loading={eventsLoading}
                onDelete={refetchEvents}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <ParkActions
              isCheckedIn={isCheckedIn}
              isFavorite={isFavorite}
              onCheckInToggle={handleCheckInToggle}
              onFavoriteToggle={handleFavoriteToggle}
              loading={actionLoading}
            />

            <ParkLocationMap
              latitude={park.latitude}
              longitude={park.longitude}
              address={park.address}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={t('events.createTitle', 'Create New Event')}
      >
        <CreateEventForm
          parkId={Number(id)}
          onCancel={() => setIsEventModalOpen(false)}
          onSuccess={() => {
            setIsEventModalOpen(false);
            refetchEvents();
          }}
        />
      </Modal>
    </div>
  );
};

export default ParkDetails;