
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OrganizationMember, OrgRole, User } from '../../types';
import { Picture, Button } from '../common';
import { SearchBar } from '../features';
import { useUserSearch } from '../../hooks';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import UserList from '../users/UserList';

interface OrganizationMembersProps {
    organizationId: number;
    members: OrganizationMember[];
    canManageMembers: boolean;
    onMemberUpdate: () => void;
}

const OrganizationMembers: React.FC<OrganizationMembersProps> = ({
    organizationId,
    members,
    canManageMembers,
    onMemberUpdate
}) => {
    const { t } = useTranslation();
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Search state


    // Use the shared user search hook
    const {
        searchQuery,
        setSearchQuery,
        users: searchResults,
        loading: searchLoading
    } = useUserSearch();

    // Filter out existing members from search results
    const filteredSearchResults = searchResults.filter(
        user => !members.some(member => member.userId === user.id)
    );

    const handleRemoveMember = async (userId: number) => {
        if (!window.confirm(t('organizations.confirmRemoveMember', 'Are you sure you want to remove this member?'))) {
            return;
        }

        try {
            await api.delete(`/api/organizations/${organizationId}/members/${userId}`);
            toast.success(t('organizations.memberRemoved', 'Member removed successfully'));
            onMemberUpdate();
        } catch (error) {
            toast.error(t('organizations.removeMemberFailed', 'Failed to remove member'));
        }
    };

    const handleUpdateRole = async (userId: number, newRole: OrgRole) => {
        try {
            await api.put(`/api/organizations/${organizationId}/members/${userId}`, { role: newRole });
            toast.success(t('organizations.roleUpdated', 'Role updated successfully'));
            onMemberUpdate();
        } catch (error) {
            toast.error(t('organizations.updateRoleFailed', 'Failed to update role'));
        }
    };

    const handleSearchUsers = (query: string) => {
        setSearchQuery(query);
    };

    const handleAddMember = async (user: User) => {
        if (!window.confirm(t('organizations.confirmAddMember', 'Add {{username}} to organization?', { username: user.username }))) {
            return;
        }

        setLoading(true);
        try {
            await api.post(`/api/organizations/${organizationId}/members`, {
                userId: user.id,
                role: 'MEMBER'
            });
            toast.success(t('organizations.memberAdded', 'Member added successfully'));
            onMemberUpdate();
            // Clear search query to reset
            setSearchQuery('');
        } catch (error) {
            toast.error(t('organizations.addMemberFailed', 'Failed to add member.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    {t('organizations.members', 'Members')} ({members.length})
                </h2>
                {canManageMembers && (
                    <Button
                        text={isAddingMember ? t('common.done', 'Done') : t('organizations.addMember', 'Add Member')}
                        onClick={() => {
                            setIsAddingMember(!isAddingMember);
                            setSearchQuery('');
                        }}
                        size="sm"
                        variant={isAddingMember ? "outline" : "primary"}
                    />
                )}
            </div>

            {isAddingMember && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                    <h3 className="text-sm font-medium mb-3">{t('organizations.searchUsers', 'Search Users to Add')}</h3>
                    <SearchBar
                        onSearch={handleSearchUsers}
                        placeholder={t('organizations.searchPlaceholder', 'Enter exact username...')}
                    />

                    <div className="mt-4">
                        {searchLoading && (!searchResults || searchResults.length === 0) ? (
                            <div className="text-gray-500 text-sm text-center py-2">{t('common.loading', 'Loading...')}</div>
                        ) : searchQuery && filteredSearchResults.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center py-2">
                                {t('organizations.noUserFound', 'No user found with that name.')}
                            </div>
                        ) : (
                            <UserList
                                users={filteredSearchResults}
                                onUserClick={handleAddMember}
                                showChevron={false}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                    <div
                        key={member.userId}
                        className="flex items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 bg-white"
                    >
                        <div className="flex-shrink-0 mr-3">
                            <Picture
                                location={member.user?.profilePictureUrl}
                                size={40}
                                shape="circle"
                                alt={member.user?.username || `User ${member.userId}`}
                            />
                        </div>

                        <div className="flex-grow min-w-0">
                            <div className="font-medium text-gray-800 truncate">
                                {member.user?.username || `User ${member.userId}`}
                            </div>
                            {member.user && (
                                <div className="text-xs text-gray-500 truncate">
                                    {member.user.first_name || member.user.last_name ? `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim() : ''}
                                </div>
                            )}
                            <div className="text-xs text-blue-600 font-medium mt-0.5">
                                {t(`roles.${member.role}`, member.role)} • {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                        </div>

                        {canManageMembers && member.role !== 'OWNER' && (
                            <div className="flex flex-col gap-1 items-end ml-2">
                                <select
                                    className="text-[10px] py-1 pl-1 pr-6 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    value={member.role}
                                    onChange={(e) => handleUpdateRole(member.userId, e.target.value as OrgRole)}
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="MODERATOR">Moderator</option>
                                </select>
                                <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="text-red-500 hover:text-red-700 text-[10px] font-medium px-1"
                                >
                                    {t('common.remove', 'Remove')}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrganizationMembers;
