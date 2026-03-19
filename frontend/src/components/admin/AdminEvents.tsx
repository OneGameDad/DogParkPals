import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Modal, Button, Loading } from '../common';
import type { Event, Park } from '../../types';
import { EventPrivacy } from '../../types';

interface EventFormData {
  title: string;
  description: string;
  private: string;
  date: string;
  startTime: string;
  endTime: string;
  parkId: string;
}

const emptyForm: EventFormData = {
  title: '',
  description: '',
  private: 'PUBLIC',
  date: '',
  startTime: '',
  endTime: '',
  parkId: '',
};

const AdminEvents = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ event: Event | null; isNew: boolean } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsData, parksData] = await Promise.all([
        api.get<Event[]>('/api/events'),
        api.get<Park[]>('/api/parks'),
      ]);
      setEvents(eventsData);
      setParks(parksData);
    } catch {
      toast.error(t('admin.events.failedToLoadEvents'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (event: Event | null) => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        private: event.private,
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        parkId: String(event.parkId),
      });
    } else {
      setFormData(emptyForm);
    }
    setEditModal({ event, isNew: !event });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        private: formData.private,
        date: new Date(formData.date).toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        parkId: parseInt(formData.parkId, 10),
      };

      if (editModal?.event) {
        await api.put(`/api/events/${editModal.event.id}`, payload);
        toast.success(t('admin.events.eventUpdated'));
      } else {
        await api.post('/api/events', payload);
        toast.success(t('admin.events.eventCreated'));
      }
      setEditModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t('admin.events.failedToSaveEvent'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/events/${deleteModal.id}`);
      toast.success(t('admin.events.eventDeleted'));
      setDeleteModal(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t('admin.events.failedToSaveEvent'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParkName = (parkId: number) => {
    return parks.find(p => p.id === parkId)?.name || `Park #${parkId}`;
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  if (loading) return <Loading message={t('admin.events.loadingMessage')} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('admin.events.title')} ({events.length})</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={t('admin.events.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button text={t('admin.events.addButton')} onClick={() => openEdit(null)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.id')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.events.title')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.events.date')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.events.time')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.events.park')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.events.privacy')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((event) => (
              <tr key={event.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{event.id}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{event.title}</td>
                <td className="px-4 py-3 text-gray-600">{event.date ? new Date(event.date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {event.startTime || '—'} – {event.endTime || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{getParkName(event.parkId)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.private === 'PRIVATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {event.private}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(event)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('admin.common.edit')}</button>
                  <button onClick={() => setDeleteModal(event)} className="text-red-600 hover:text-red-800 text-xs font-medium">{t('admin.common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">{t('admin.events.noFound')}</p>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.isNew ? t('admin.events.addTitle') : t('admin.events.editTitle')}
      >
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.title')} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.date')} *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.privacy')}</label>
              <select
                value={formData.private}
                onChange={(e) => setFormData(prev => ({ ...prev, private: e.target.value }))}
                className={inputClass}
              >
                {Object.values(EventPrivacy).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.startTime')}</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.endTime')}</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.events.park')} *</label>
            <select
              value={formData.parkId}
              onChange={(e) => setFormData(prev => ({ ...prev, parkId: e.target.value }))}
              className={inputClass}
              required
            >
              <option value="">{t('admin.events.selectPark')}</option>
              {parks.map(park => (
                <option key={park.id} value={park.id}>{park.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setEditModal(null)} />
            <Button
              text={t('admin.common.save')}
              onClick={handleSave}
              loading={isSubmitting}
              disabled={isSubmitting || !formData.title || !formData.date || !formData.parkId}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('admin.events.deleteTitle')}>
        <div className="p-6">
          <p className="text-gray-700">{t('admin.events.deleteMessage', { title: deleteModal?.title || '' })}</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setDeleteModal(null)} />
            <Button text={t('admin.common.delete')} variant="danger" onClick={handleDelete} loading={isSubmitting} disabled={isSubmitting} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminEvents;
