import { useState, useEffect, useCallback } from 'react';
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
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

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
        toast.success('Organization updated');
      } else {
        await api.post('/api/organizations', payload);
        toast.success('Organization created');
      }
      setEditModal(null);
      fetchOrgs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/api/organizations/${deleteModal.id}`);
      toast.success('Organization deleted');
      setDeleteModal(null);
      fetchOrgs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  if (loading) return <Loading message="Loading organizations..." />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Organizations ({orgs.length})</h2>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Description</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Website</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Owner ID</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Created</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
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
                  <button onClick={() => openEdit(org)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                  <button onClick={() => setDeleteModal(org)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No organizations found.</p>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal?.isNew ? 'Add Organization' : 'Edit Organization'}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input
              type="text"
              value={formData.websiteUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              className={inputClass}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button text="Cancel" variant="outline" onClick={() => setEditModal(null)} />
            <Button text="Save" onClick={handleSave} loading={isSubmitting} disabled={isSubmitting || !formData.name} />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Organization">
        <div className="p-6">
          <p className="text-gray-700">Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text="Cancel" variant="outline" onClick={() => setDeleteModal(null)} />
            <Button text="Delete" variant="danger" onClick={handleDelete} loading={isSubmitting} disabled={isSubmitting} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminOrganizations;
