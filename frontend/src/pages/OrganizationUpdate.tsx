
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrganization } from '../hooks';
import { InputText, Button, ErrorMessage, Loading } from '../components/common';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const OrganizationUpdate = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        organization,
        loading: fetchLoading,
        error: fetchError,
        canEdit,
        isOwner,
        isAdmin
    } = useOrganization(id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState(''); // Not used in UI yet but good for state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prefill form when data loads
    useEffect(() => {
        if (organization) {
            if (!canEdit) {
                toast.error(t('organizations.noPermission', 'You do not have permission to edit this organization'));
                navigate(`/organizations/${id}`);
                return;
            }
            setName(organization.name);
            setDescription(organization.description || '');
            setWebsiteUrl(organization.websiteUrl || '');
            setProfilePictureUrl(organization.profilePictureUrl || '');
        }
    }, [organization, canEdit, navigate, id, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.put(`/api/organizations/${id}`, {
                name,
                description,
                websiteUrl
            });
            toast.success(t('organizations.updateSuccess', 'Organization updated successfully'));
            navigate(`/organizations/${id}`);
        } catch (error: any) {
            const message = error.response?.data?.message || t('organizations.updateError', 'Failed to update organization');
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('organizations.deleteConfirm', 'Are you sure you want to delete this organization? This action cannot be undone.'))) {
            return;
        }

        try {
            await api.delete(`/api/organizations/${id}`);
            toast.success(t('organizations.deleteSuccess', 'Organization deleted successfully'));
            navigate('/organizations');
        } catch (error: any) {
            const message = error.response?.data?.message || t('organizations.deleteError', 'Failed to delete organization');
            toast.error(message);
        }
    };

    if (fetchLoading) return <Loading />;
    if (fetchError) return <ErrorMessage message={fetchError} />;
    if (!organization) return <ErrorMessage message={t('organizations.notFound', 'Organization not found')} />;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-md">
                {t('organizations.editTitle', 'Edit Organization')}
            </h1>

            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputText
                        label={t('organizations.form.nameLabel', 'Organization Name')}
                        value={name}
                        onChange={setName}
                        required
                        placeholder="e.g. Acme Corp"
                    />

                    <InputText
                        label={t('organizations.form.websiteLabel', 'Website URL')}
                        value={websiteUrl}
                        onChange={setWebsiteUrl}
                        placeholder="https://example.com"
                    />

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('organizations.form.descriptionLabel', 'Description')}
                        </label>
                        <textarea
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 border-gray-300"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('organizations.form.descriptionPlaceholder', 'Tell us about your organization')}
                        />
                    </div>

                    {/* TODO: Profile Picture Upload Component */}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            text={t('common.cancel', 'Cancel')}
                            onClick={() => navigate(`/organizations/${id}`)}
                            variant="outline"
                            type="button"
                        />
                        <Button
                            text={isSubmitting ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
                            type="submit"
                            disabled={isSubmitting}
                        />
                    </div>
                </form>

                {(isOwner || isAdmin) && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium text-red-600">{t('organizations.dangerZone', 'Danger Zone')}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {t('organizations.deleteDescription', 'Once you delete an organization, there is no going back. Please be certain.')}
                                </p>
                            </div>
                            <Button
                                text={t('organizations.delete', 'Delete Organization')}
                                onClick={handleDelete}
                                variant="danger"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationUpdate;
