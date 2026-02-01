import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSubmit } from '../hooks/useSubmit';
import { api } from '../services/api';
import { Header } from '../components/layout';
import { Button, Picture, BodyText, InputText, Loading } from '../components/common';

const EditProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilePictureUrl: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        profilePictureUrl: user.profilePictureUrl || '',
      });
    }
  }, [user]);

  const { submit, isSubmitting } = useSubmit({
    onSuccess: () => {
      window.dispatchEvent(new Event('auth:login'));
      navigate('/profile');
    },
    successMessage: t('profile.profileUpdated'),
    loadingMessage: t('profile.updatingProfile'),
    errorMessage: t('profile.failedToUpdate'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const updates: any = {};

    if (formData.firstName.trim()) {
      updates.first_name = formData.firstName.trim();
    }
    if (formData.lastName.trim()) {
      updates.last_name = formData.lastName.trim();
    }
    if (formData.profilePictureUrl.trim()) {
      updates.profilePictureUrl = formData.profilePictureUrl.trim();
    }

    if (Object.keys(updates).length === 0) {
      // No fields were changed; show a localized validation message and skip submit.
      window.alert(t('profile.updateAtLeastOneField'));
      return;
    }

    await submit(async () => {
      await api.patch('/users/profile', updates);
    });
  };

  if (authLoading) {
    return <Loading message={t('profile.loading')} />;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <BodyText text={t('profile.pleaseLogin')} colour="text-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <Header text={t('profile.editProfileTitle')} level="h1" />
          <Button
            text={t('profile.cancel')}
            onClick={() => navigate('/profile')}
            className="bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Preview */}
          <div className="flex justify-center mb-6">
            <div className="border-4 border-gray-200 rounded-full">
              <Picture
                location={formData.profilePictureUrl || user.profilePictureUrl || '/imgs/exampleprofilepic.jpg'}
                size={128}
                shape="circle"
                alt="Profile Preview"
              />
            </div>
          </div>

          {/* Profile Picture URL */}
          <InputText
            label={t('profile.profilePictureUrl')}
            type="text"
            value={formData.profilePictureUrl}
            onChange={(value) => setFormData(prev => ({ ...prev, profilePictureUrl: value }))}
            placeholder={t('profile.profilePictureUrlPlaceholder')}
          />

          {/* First Name */}
          <InputText
            label={t('profile.firstName')}
            type="text"
            value={formData.firstName}
            onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
          />

          {/* Last Name */}
          <InputText
            label={t('profile.lastName')}
            type="text"
            value={formData.lastName}
            onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
          />

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              text={isSubmitting ? t('profile.saving') : t('profile.saveChanges')}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
            />
            <Button
              type="button"
              text={t('profile.cancel')}
              onClick={() => navigate('/profile')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
