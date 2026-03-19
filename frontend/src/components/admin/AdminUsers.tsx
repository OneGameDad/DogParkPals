import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Modal, Button, Loading } from '../common';
import type { User } from '../../types';
import { UserRole } from '../../types';

const DELETED_USER_USERNAME = 'deleted_user';
const DELETED_USER_EMAIL = 'deleted_user@dogparkpals.local';

const isDeletedUserSentinel = (user: User) => {
  const normalizedUsername = user.username.trim().toLowerCase();
  const normalizedEmail = user.email.trim().toLowerCase();

  return (
    normalizedUsername === DELETED_USER_USERNAME ||
    normalizedEmail === DELETED_USER_EMAIL
  );
};

const AdminUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleModal, setRoleModal] = useState<{ user: User; newRole: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<User[]>('/users');
      setUsers(data.filter((user) => !isDeletedUserSentinel(user)));
    } catch {
      toast.error(t('admin.users.failedToLoadUsers'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!roleModal) return;
    setIsSubmitting(true);
    try {
      await api.patch('/users/role', {
        userId: roleModal.user.id,
        role: roleModal.newRole,
      });
      toast.success(t('admin.users.roleUpdated', { role: roleModal.newRole }));
      setRoleModal(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || t('admin.users.failedToChangeRole'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${deleteModal.id}`);
      toast.success(t('admin.users.userDeleted', { username: deleteModal.username }));
      setDeleteModal(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || t('admin.common.failedToDelete', { resource: 'user' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading message={t('admin.users.loadingMessage')} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t('admin.users.title')} ({users.length})</h2>
        <input
          type="text"
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.id')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.users.username')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.users.email')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.users.role')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.created')}</th>
              <th className="px-4 py-3 font-semibold text-gray-600">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{user.id}</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{user.username}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    user.role === 'DEVELOPER' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={roleModal && roleModal.user.id === user.id ? roleModal.newRole : user.role}
                      onChange={(e) => setRoleModal({ user, newRole: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setDeleteModal(user)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      {t('admin.common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">{t('admin.users.noFound')}</p>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title={t('admin.users.deleteTitle')}
      >
        <div className="p-6">
          <p className="text-gray-700">
            {t('admin.users.deleteMessage', { username: deleteModal?.username || '' })}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setDeleteModal(null)} />
            <Button
              text={t('admin.common.delete')}
              variant="danger"
              onClick={handleDeleteUser}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Modal>

      {/* Role Change Confirmation Modal */}
      <Modal
        isOpen={!!roleModal}
        onClose={() => setRoleModal(null)}
        title={t('admin.users.roleChangeTitle')}
      >
        <div className="p-6">
          <p className="text-gray-700">
            {t('admin.users.roleChangeMessage', {
              username: roleModal?.user.username || '',
              oldRole: roleModal?.user.role || '',
              newRole: roleModal?.newRole || ''
            })}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text={t('admin.common.cancel')} variant="outline" onClick={() => setRoleModal(null)} />
            <Button
              text={t('admin.common.confirm')}
              variant="danger"
              onClick={handleRoleChange}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
