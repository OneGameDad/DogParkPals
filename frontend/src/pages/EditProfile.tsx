import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSubmit } from '../hooks/useSubmit';
import { api } from '../services/api';
import { Header } from '../components/layout';
import { Button, Picture, BodyText, InputText, Loading } from '../components/common';
import FileUpload from '../components/features/FileUpload';
import uploadService from '../services/uploadService';
import { getUserPhotoUrl } from '../constants';

const EditProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDeleted, setPhotoDeleted] = useState(false);

  // Revoke blob URL on unmount or when preview changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
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
    errorMessage: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('in use')) {
        return t('profile.usernameTaken', 'Username is already taken. Please choose another.');
      }
      return t('profile.failedToUpdate');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const updates: any = {};

    // Only include a field if it's non-empty AND has changed from the server value.
    // Treat server `null` the same as an empty string when comparing.
    const serverUsername = user?.username ?? '';
    const serverFirstName = user?.first_name ?? '';
    const serverLastName = user?.last_name ?? '';

    if (formData.firstName.trim() && formData.firstName.trim() !== serverFirstName) {
      updates.first_name = formData.firstName.trim();
    }
    if (formData.lastName.trim() && formData.lastName.trim() !== serverLastName) {
      updates.last_name = formData.lastName.trim();
    }
    // profilePictureUrl is managed by the file upload, skip manual URL updates

    const usernameChanged = formData.username.trim().length > 0 && formData.username.trim() !== serverUsername;

    if (Object.keys(updates).length === 0 && !selectedFile && !photoDeleted && !usernameChanged) {
      window.alert(t('profile.updateAtLeastOneField'));
      return;
    }

    await submit(async () => {
      if (usernameChanged) {
        await api.post('/users/change-username', { newUsername: formData.username.trim() });
      }
      if (Object.keys(updates).length > 0) {
        await api.patch('/users/profile', updates);
      }
      if (photoDeleted) {
        await uploadService.deleteUserProfilePicture();
      } else if (selectedFile) {
        await uploadService.uploadUserProfilePicture(selectedFile);
      }
      await refreshUser();
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
          {/* Profile Picture Preview + Remove */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="border-4 border-gray-200 rounded-full">
              <Picture
                location={photoDeleted ? undefined : (previewUrl || getUserPhotoUrl(user.id, user.profilePictureUrl))}
                initials={user.first_name?.[0] || user.username?.[0]}
                size={128}
                shape="circle"
                alt="Profile Preview"
              />
            </div>
            {!photoDeleted && user.profilePictureUrl && !previewUrl && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setPhotoDeleted(true);
                  // Clear any pending file selection so delete wins unambiguously
                  setSelectedFile(null);
                  if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
                }}
                className="text-sm text-red-500 hover:text-red-700 underline disabled:opacity-50"
              >
                {t('profile.removePhoto', 'Remove photo')}
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
                {t('profile.clearSelection', 'Clear selection')}
              </button>
            )}
            {photoDeleted && (
              <p className="text-sm text-red-400">
                {t('profile.photoWillBeRemoved', 'Photo will be removed on save')}
                {' '}
                <button
                  type="button"
                  onClick={() => setPhotoDeleted(false)}
                  className="underline text-blue-500"
                >
                  {t('profile.undo', 'Undo')}
                </button>
              </p>
            )}
          </div>

          {/* Profile Picture Upload */}
          <FileUpload
            category="userProfile"
            onFileSelect={(file) => {
              setSelectedFile(file);
              // Selecting a new file cancels any pending delete
              if (file) setPhotoDeleted(false);
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            hideUploadButton={true}
            hidePreview={true}
            label={t('profile.profilePictureUrl')}
          />

          {/* Username */}
          <InputText
            label={t('profile.username', 'Username')}
            type="text"
            value={formData.username}
            onChange={(value: string) => setFormData((prev: typeof formData) => ({ ...prev, username: value }))}
          />

          {/* First Name */}
          <InputText
            label={t('profile.firstName')}
            type="text"
            value={formData.firstName}
            onChange={(value: string) => setFormData((prev: typeof formData) => ({ ...prev, firstName: value }))}
          />

          {/* Last Name */}
          <InputText
            label={t('profile.lastName')}
            type="text"
            value={formData.lastName}
            onChange={(value: string) => setFormData((prev: typeof formData) => ({ ...prev, lastName: value }))}
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
