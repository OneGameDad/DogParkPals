import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Modal, Button, Loading } from '../common';
import type { Dog } from '../../types';
import { DogBreed, DogSize, DogGender, DogPlaystyle } from '../../types';

interface DogFormData {
  name: string;
  breed: string;
  gender: string;
  size: string;
  playstyle: string;
  description: string;
  dateOfBirth: string;
  fixed: boolean;
}

const emptyForm: DogFormData = {
  name: '',
  breed: 'UNKNOWN',
  gender: 'MALE',
  size: 'MEDIUM',
  playstyle: 'SOCIAL',
  description: '',
  dateOfBirth: '',
  fixed: false,
};

const AdminDogs = () => {
  const { t } = useTranslation();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ dog: Dog | null; isNew: boolean } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Dog | null>(null);
  const [formData, setFormData] = useState<DogFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Dog[]>('/api/dogs');
      setDogs(data);
    } catch {
      toast.error(t('admin.dogs.failedToLoadDogs'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchDogs(); }, [fetchDogs]);

  const openEdit = (dog: Dog | null) => {
    if (dog) {
      setFormData({
        name: dog.name,
        breed: dog.breed,
        gender: dog.gender,
        size: dog.size,
        playstyle: dog.playstyle,
        description: dog.description || '',
        dateOfBirth: dog.dateOfBirth ? new Date(dog.dateOfBirth).toISOString().split('T')[0] : '',
        fixed: dog.fixed,
      });
    } else {
      setFormData(emptyForm);
    }
    setEditModal({ dog, isNew: !dog });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        breed: formData.breed,
        gender: formData.gender,
        size: formData.size,
        playstyle: formData.playstyle,
        description: formData.description,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        fixed: formData.fixed,
      };

      if (editModal?.dog) {
        await api.put(`/api/dogs/${editModal.dog.id}`, payload);
        toast.success(t('admin.dogs.dogUpdated'));
      } else {
        await api.post('/api/dogs', payload);
        toast.success(t('admin.dogs.dogCreated'));
      }
      setEditModal(null);
      fetchDogs();
    } catch (err: any) {
      toast.error(err.message || t('admin.dogs.failedToSaveDog'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/dogs/${deleteModal.id}`);
      toast.success(t('admin.dogs.dogDeleted'));
      setDeleteModal(null);
      fetchDogs();
    } catch (err: any) {
      toast.error(err.message || t('admin.dogs.failedToSaveDog'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = dogs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.breed.toLowerCase().includes(search.toLowerCase())
  );

  const selectClass = "border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  if (loading) return <Loading message={t('admin.dogs.loadingMessage')} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('admin.dogs.title')} ({dogs.length})</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={t('admin.dogs.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button text={t('admin.dogs.addButton')} onClick={() => openEdit(null)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.id')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.dogs.name')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.dogs.breed')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.dogs.gender')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.dogs.size')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.dogs.fixed')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((dog) => (
              <tr key={dog.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{dog.id}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{dog.name}</td>
                <td className="px-4 py-3 text-gray-600">{dog.breed.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-gray-600">{dog.gender}</td>
                <td className="px-4 py-3 text-gray-600">{dog.size}</td>
                <td className="px-4 py-3 text-gray-600">{dog.fixed ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(dog)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('admin.common.edit')}</button>
                  <button onClick={() => setDeleteModal(dog)} className="text-red-600 hover:text-red-800 text-xs font-medium">{t('admin.common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">{t('admin.dogs.noFound')}</p>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.isNew ? t('admin.dogs.addTitle') : t('admin.dogs.editTitle')}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.dogs.name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={selectClass}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.dogs.breed')}</label>
              <select value={formData.breed} onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))} className={selectClass}>
                {Object.values(DogBreed).map(b => <option key={b} value={b}>{b.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.dogs.gender')}</label>
              <select value={formData.gender} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))} className={selectClass}>
                {Object.values(DogGender).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.dogs.size')}</label>
              <select value={formData.size} onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))} className={selectClass}>
                {Object.values(DogSize).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Playstyle</label>
              <select value={formData.playstyle} onChange={(e) => setFormData(prev => ({ ...prev, playstyle: e.target.value }))} className={selectClass}>
                {Object.values(DogPlaystyle).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.dogs.dateOfBirth')} *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className={selectClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.dogs.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={selectClass}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dog-fixed"
              checked={formData.fixed}
              onChange={(e) => setFormData(prev => ({ ...prev, fixed: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="dog-fixed" className="text-sm text-gray-700">{t('admin.dogs.fixed')}/Neutered</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setEditModal(null)} />
            <Button text={t('admin.common.save')} onClick={handleSave} loading={isSubmitting} disabled={isSubmitting || !formData.name || !formData.dateOfBirth} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('admin.dogs.deleteTitle')}>
        <div className="p-6">
          <p className="text-gray-700">{t('admin.dogs.deleteMessage', { name: deleteModal?.name || '' })}</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setDeleteModal(null)} />
            <Button text={t('admin.common.delete')} variant="danger" onClick={handleDelete} loading={isSubmitting} disabled={isSubmitting} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDogs;
