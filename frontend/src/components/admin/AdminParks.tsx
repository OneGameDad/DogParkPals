import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Modal, Button, Loading } from '../common';
import type { Park } from '../../types';
import { Amenity } from '../../types';

interface ParkFormData {
  name: string;
  latitude: string;
  longitude: string;
  address: string;
  description: string;
  separateSmallDogArea: boolean;
  amenities: string[];
}

const emptyForm: ParkFormData = {
  name: '',
  latitude: '',
  longitude: '',
  address: '',
  description: '',
  separateSmallDogArea: false,
  amenities: [],
};

const AdminParks = () => {
  const { t } = useTranslation();
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ park: Park | null; isNew: boolean } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Park | null>(null);
  const [formData, setFormData] = useState<ParkFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Park[]>('/api/parks');
      setParks(data);
    } catch {
      toast.error(t('admin.parks.failedToLoadParks'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchParks(); }, [fetchParks]);

  const openEdit = (park: Park | null) => {
    if (park) {
      setFormData({
        name: park.name,
        latitude: String(park.latitude),
        longitude: String(park.longitude),
        address: park.address,
        description: park.description || '',
        separateSmallDogArea: park.separateSmallDogArea,
        amenities: park.amenities || [],
      });
    } else {
      setFormData(emptyForm);
    }
    setEditModal({ park, isNew: !park });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address,
        description: formData.description,
        separateSmallDogArea: formData.separateSmallDogArea,
        amenities: formData.amenities,
      };

      if (editModal?.park) {
        await api.put(`/api/parks/${editModal.park.id}`, payload);
        toast.success(t('admin.parks.parkUpdated'));
      } else {
        await api.post('/api/parks', payload);
        toast.success(t('admin.parks.parkCreated'));
      }
      setEditModal(null);
      fetchParks();
    } catch (err: any) {
      toast.error(err.message || t('admin.parks.failedToSavePark'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/parks/${deleteModal.id}`);
      toast.success(t('admin.parks.parkDeleted'));
      setDeleteModal(null);
      fetchParks();
    } catch (err: any) {
      toast.error(err.message || t('admin.common.failedToDelete', { resource: t('admin.parks.park') }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const filtered = parks.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  if (loading) return <Loading message={t('admin.parks.loadingMessage')} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('admin.parks.title')} ({parks.length})</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={t('admin.parks.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button text={t('admin.parks.addButton')} onClick={() => openEdit(null)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.id')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.parks.name')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.parks.address')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.parks.amenities')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.parks.smallDogArea')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((park) => (
              <tr key={park.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{park.id}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{park.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{park.address}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{park.amenities?.length || 0}</td>
                <td className="px-4 py-3 text-gray-600">{park.separateSmallDogArea ? t('admin.parks.yes') : t('admin.parks.no')}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(park)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('admin.common.edit')}</button>
                  <button onClick={() => setDeleteModal(park)} className="text-red-600 hover:text-red-800 text-xs font-medium">{t('admin.common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">{t('admin.parks.noFound')}</p>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.isNew ? t('admin.parks.addTitle') : t('admin.parks.editTitle')}
      >
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.parks.name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.parks.address')} *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.parks.latitude')} *</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.parks.longitude')} *</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.parks.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="park-small-dog"
              checked={formData.separateSmallDogArea}
              onChange={(e) => setFormData(prev => ({ ...prev, separateSmallDogArea: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="park-small-dog" className="text-sm text-gray-700">{t('admin.parks.separateSmallDogArea')}</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.parks.amenities')}</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Amenity).map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {amenity.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setEditModal(null)} />
            <Button
              text={t('admin.common.save')}
              onClick={handleSave}
              loading={isSubmitting}
              disabled={isSubmitting || !formData.name || !formData.address || !formData.latitude || !formData.longitude}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('admin.parks.deleteTitle')}>
        <div className="p-6">
          <p className="text-gray-700">{t('admin.parks.deleteMessage', { name: deleteModal?.name || '' })}</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setDeleteModal(null)} />
            <Button text={t('admin.common.delete')} variant="danger" onClick={handleDelete} loading={isSubmitting} disabled={isSubmitting} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminParks;
