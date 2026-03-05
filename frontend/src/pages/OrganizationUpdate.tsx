
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrganization } from '../hooks';
import { InputText, Button, ErrorMessage, Loading, Picture } from '../components/common';
import FileUpload from '../components/features/FileUpload';
import api from '../services/api';
import uploadService from '../services/uploadService';
import { getOrgPhotoUrl } from '../constants';
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [photoDeleted, setPhotoDeleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Revoke blob URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

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

            // Handle photo delete or upload
            const orgId = Number(id);
            if (!Number.isFinite(orgId)) {
                throw new Error('Invalid organization ID');
            }

            if (photoDeleted) {
                await uploadService.deleteOrganizationProfilePicture(orgId);
            } else if (selectedFile) {
                await uploadService.uploadOrganizationProfilePicture(orgId, selectedFile);
            }

            toast.success(t('organizations.updateSuccess', 'Organization updated successfully'));
            navigate(`/organizations/${id}`);
        } catch (error: any) {
            const message = error.message || t('organizations.updateError', 'Failed to update organization');
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

                    {/* Profile Picture Preview + Remove */}
                    <div className="flex flex-col items-center gap-3">
                        <label className="block text-sm font-medium text-gray-700 self-start">
                            {t('organizations.form.profilePicture', 'Profile Picture')}
                        </label>
                        <div className="border-4 border-gray-200 rounded-lg overflow-hidden">
                            <Picture
                                location={photoDeleted ? undefined : (previewUrl || getOrgPhotoUrl(organization.id, organization.profilePictureUrl))}
                                initials={organization.name?.[0]}
                                size={128}
                                shape="square"
                                alt={t('organizations.profilePictureAlt', 'Organization profile picture')}
                            />
                        </div>
                        {!photoDeleted && organization.profilePictureUrl && !previewUrl && (
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setPhotoDeleted(true);
                                    setSelectedFile(null);
                                    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
                                }}
                                className="text-sm text-red-500 hover:text-red-700 underline disabled:opacity-50"
                            >
                                {t('organizations.form.removePhoto', 'Remove photo')}
                            </button>
                        )}
                        {previewUrl && (
                            <button
                                type="button"
                                onClick={() => {
                                    URL.revokeObjectURL(previewUrl);
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                }}
                                className="text-sm text-gray-400 hover:text-gray-600 underline"
                            >
                                {t('organizations.form.clearSelection', 'Clear selection')}
                            </button>
                        )}
                        {photoDeleted && (
                            <p className="text-sm text-red-400">
                                {t('organizations.form.photoWillBeRemoved', 'Photo will be removed on save')}
                                {' '}
                                <button
                                    type="button"
                                    onClick={() => setPhotoDeleted(false)}
                                    className="underline text-blue-500"
                                >
                                    {t('common.undo', 'Undo')}
                                </button>
                            </p>
                        )}
                    </div>

                    {/* Profile Picture File Upload */}
                    <FileUpload
                        category="organizationProfile"
                        itemId={organization.id}
                        onFileSelect={(file) => {
                            setSelectedFile(file);
                            if (file) setPhotoDeleted(false);
                            setPreviewUrl(file ? URL.createObjectURL(file) : null);
                        }}
                        hideUploadButton={true}
                        hidePreview={true}
                        label={t('organizations.form.uploadPhoto', 'Upload new photo')}
                    />

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
