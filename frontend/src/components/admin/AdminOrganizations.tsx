import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Modal, Button, Loading } from '../common';
import type { Organization } from '../../types';

interface OrgFormData {
  name: string;
  description: string;
  websiteUrl: string;
}

const emptyForm: OrgFormData = {
  name: '',
  description: '',
  websiteUrl: '',
};

const AdminOrganizations = () => {
  const { t } = useTranslation();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ org: Organization | null; isNew: boolean } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<OrgFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Organization[]>('/api/organizations');
      setOrgs(data);
    } catch {
      toast.error(t('admin.organizations.failedToLoadOrgs'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const openEdit = (org: Organization | null) => {
    if (org) {
      setFormData({
        name: org.name,
        description: org.description || '',
        websiteUrl: org.websiteUrl || '',
      });
    } else {
      setFormData(emptyForm);
    }
    setEditModal({ org, isNew: !org });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
      };

      if (editModal?.org) {
        await api.put(`/api/organizations/${editModal.org.id}`, payload);
        toast.success(t('admin.organizations.orgUpdated'));
      } else {
        await api.post('/api/organizations', payload);
        toast.success(t('admin.organizations.orgCreated'));
      }
      setEditModal(null);
      fetchOrgs();
    } catch (err: any) {
      toast.error(err.message || t('admin.organizations.failedToSaveOrg'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/organizations/${deleteModal.id}`);
      toast.success(t('admin.organizations.orgDeleted'));
      setDeleteModal(null);
      fetchOrgs();
    } catch (err: any) {
      toast.error(err.message || t('admin.common.failedToDelete', { resource: 'organization' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  if (loading) return <Loading message={t('admin.organizations.loadingMessage')} />;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('admin.organizations.title')} ({orgs.length})</h2>
        <input
          type="text"
          placeholder={t('admin.organizations.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.id')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.organizations.name')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.organizations.description')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.organizations.website')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.organizations.ownerId')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.created')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((org) => (
              <tr key={org.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{org.id}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{org.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{org.description || '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">
                  {org.websiteUrl ? (
                    <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {org.websiteUrl}
                    </a>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{org.ownerId}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(org.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(org)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('admin.common.edit')}</button>
                  <button onClick={() => setDeleteModal(org)} className="text-red-600 hover:text-red-800 text-xs font-medium">{t('admin.common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">{t('admin.organizations.noFound')}</p>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.isNew ? t('admin.organizations.addTitle') : t('admin.organizations.editTitle')}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.organizations.name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.organizations.websiteUrl')}</label>
            <input
              type="text"
              value={formData.websiteUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              className={inputClass}
              placeholder={t('admin.organizations.websiteUrlPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.organizations.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setEditModal(null)} />
            <Button text={t('admin.common.save')} onClick={handleSave} loading={isSubmitting} disabled={isSubmitting || !formData.name} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('admin.organizations.deleteTitle')}>
        <div className="p-6">
          <p className="text-gray-700">{t('admin.organizations.deleteMessage', { name: deleteModal?.name || '' })}</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setDeleteModal(null)} />
            <Button text={t('admin.common.delete')} variant="danger" onClick={handleDelete} loading={isSubmitting} disabled={isSubmitting} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrganizations;
