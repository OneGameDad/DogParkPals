import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Modal, Button, Loading } from '../common';
import type { User } from '../../types';
import { UserRole } from '../../types';

const AdminUsers = () => {
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
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!roleModal) return;
    setIsSubmitting(true);
    try {
      await api.patch('/users/role', {
        userId: roleModal.user.id,
        role: roleModal.newRole,
      });
      toast.success(`Role updated to ${roleModal.newRole}`);
      setRoleModal(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${deleteModal.id}`);
      toast.success(`User "${deleteModal.username}" deleted`);
      setDeleteModal(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Users ({users.length})</h2>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Username</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Created</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
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
                      value={user.role}
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
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No users found.</p>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete User"
      >
        <div className="p-6">
          <p className="text-gray-700">
            Are you sure you want to permanently delete{' '}
            <strong>{deleteModal?.username}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text="Cancel" variant="outline" onClick={() => setDeleteModal(null)} />
            <Button
              text="Delete"
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
        title="Confirm Role Change"
      >
        <div className="p-6">
          <p className="text-gray-700">
            Change <strong>{roleModal?.user.username}</strong>'s role from{' '}
            <strong>{roleModal?.user.role}</strong> to{' '}
            <strong>{roleModal?.newRole}</strong>?
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button text="Cancel" variant="outline" onClick={() => setRoleModal(null)} />
            <Button
              text="Confirm"
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
