import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, InputText, ErrorMessage } from '../components/common';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CreateOrganization = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState(''); // Corrected variable name
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/api/organizations', {
                name,
                description,
                websiteUrl,
                userId: user?.id,
            });
            // Redirect to dashboard or the new organization details (if ID returned and we have a route)
            // For now, redirect to dashboard as per plan
            navigate('/dashboard');
        } catch (err: any) {
            // Extract error message safely
            const errorMessage = err.message || t('common.errorOccurred');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-md">
                {t('organizations.form.title', 'Create Organization')}
            </h1>

            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-8">
                {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputText
                        label={t('organizations.form.nameLabel', 'Organization Name')}
                        value={name}
                        onChange={setName}
                        placeholder={t('organizations.form.namePlaceholder', 'Enter organization name')}
                        required
                    />

                    <InputText
                        label={t('organizations.form.websiteLabel', 'Website URL')}
                        value={websiteUrl}
                        onChange={setWebsiteUrl}
                        placeholder={t('organizations.form.websitePlaceholder', 'https://example.com')}
                        type="text"
                    />

                    {/* reusing InputText for description for now, although a textarea would be better if available. 
                        Since InputText is what we have, we'll use it. */}
                    <InputText
                        label={t('organizations.form.descriptionLabel', 'Description')}
                        value={description}
                        onChange={setDescription}
                        placeholder={t('organizations.form.descriptionPlaceholder', 'Brief description of your organization')}
                    />

                    <div className="flex justify-end pt-4">
                        <Button
                            text={loading ? t('organizations.form.submitting', 'Creating...') : t('organizations.form.submit', 'Create Organization')}
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrganization;
