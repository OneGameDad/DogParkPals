import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks/useFetch';
import { useSubmit } from '../hooks/useSubmit';
import { api } from '../services/api';
import { Header } from '../components/layout';
import { Button, Picture, InputText, Loading, ErrorMessage } from '../components/common';
import FileUpload from '../components/features/FileUpload';
import uploadService from '../services/uploadService';
import { type Dog, DogBreed, DogSize, DogGender, DogPlaystyle } from '../types';
import { getDogPhotoUrl } from '../constants';

const EditDogProfile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: dog, loading: dogLoading, error: dogError } = useFetch<Dog>(
    id ? `/api/dogs/${id}` : ''
  );

  const [formData, setFormData] = useState({
    name: '',
    breed: '' as DogBreed | '',
    gender: '' as DogGender | '',
    size: '' as DogSize | '',
    playstyle: '' as DogPlaystyle | '',
    description: '',
    dateOfBirth: '',
    fixed: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDeleted, setPhotoDeleted] = useState(false);
  const [selectedVaccinationFile, setSelectedVaccinationFile] = useState<File | null>(null);
  const [vaccinationFileName, setVaccinationFileName] = useState<string | null>(null);
  const [vaccinationDeleted, setVaccinationDeleted] = useState(false);

  useEffect(() => {
    if (dog) {
      setFormData({
        name: dog.name,
        breed: dog.breed,
        gender: dog.gender,
        size: dog.size,
        playstyle: dog.playstyle,
        description: dog.description || '',
        dateOfBirth: dog.dateOfBirth ? new Date(dog.dateOfBirth).toISOString().split('T')[0] : '',
        fixed: dog.fixed,
      });
    }
  }, [dog]);

  const isEditMode = !!id;

  const { submit, isSubmitting } = useSubmit({
    onSuccess: (data) => {
      const targetId = id || (data as Dog)?.id;
      if (targetId) {
        navigate(`/dog/${targetId}`);
      } else {
        navigate('/profile');
      }
    },
    successMessage: isEditMode ? t('dogProfile.dogUpdated') : t('dogProfile.createdSuccessfully'),
    loadingMessage: isEditMode ? t('dogProfile.updatingDog') : t('dogProfile.creating'),
    errorMessage: isEditMode ? t('dogProfile.failedToUpdate') : t('dogProfile.failedToCreate'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submit(async () => {
      const payload: any = {
        name: formData.name,
        breed: formData.breed,
        gender: formData.gender,
        size: formData.size,
        playstyle: formData.playstyle,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        fixed: formData.fixed,
        description: formData.description ?? '',
      };

      let response;
      if (isEditMode) {
      if (isEditMode) {
        response = await api.put(`/api/dogs/${id}`, payload);
      } else {
        response = await api.post('/api/dogs', payload);
      }

      const dogId = id ? parseInt(id, 10) : (response as any)?.id;
      if (photoDeleted && dogId) {
        await uploadService.deleteDogPhoto(dogId);
      } else if (selectedFile && dogId) {
        await uploadService.uploadDogPhoto(dogId, selectedFile);
      }
      if (vaccinationDeleted && dogId) {
        await uploadService.deleteVaccinationRecord(dogId);
      } else if (selectedVaccinationFile && dogId) {
        await uploadService.uploadVaccinationRecord(dogId, selectedVaccinationFile);
      }

      return response;
    });
  };

  if (isEditMode && dogLoading) return <Loading message={t('dogProfile.loading')} />;
  if (isEditMode && (dogError || !dog)) return <ErrorMessage message={t('dogProfile.failedToLoad')} showBackButton backTo="/profile" />;

  const selectClassName = "bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full";
  const title = isEditMode ? t('dogProfile.editTitle') : t('dogProfile.addTitle');

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <Header text={title} level="h1" />
          <Button
            text={t('dogProfile.cancel')}
            onClick={() => navigate(isEditMode ? `/dog/${id}` : '/profile')}
            className="bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-800"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dog Photo Preview + Remove */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="border-4 border-gray-200 rounded-full">
              <Picture
                location={photoDeleted ? undefined : (previewUrl || getDogPhotoUrl(dog?.id, dog?.profilePictureUrl))}
                size={128}
                shape="circle"
                alt="Dog Preview"
              />
            </div>
            {!photoDeleted && dog?.profilePictureUrl && !previewUrl && (
              <button
                type="button"
                onClick={() => setPhotoDeleted(true)}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                {t('dogProfile.removePhoto', 'Remove photo')}
              </button>
            )}
            {previewUrl && (
              <button
                type="button"
                onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelectedFile(null); }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                {t('dogProfile.clearSelection', 'Clear selection')}
              </button>
            )}
            {photoDeleted && (
              <p className="text-sm text-red-400">
                {t('dogProfile.photoWillBeRemoved', 'Photo will be removed on save')}{' '}
                <button type="button" onClick={() => setPhotoDeleted(false)} className="underline text-blue-500">
                  {t('dogProfile.undo', 'Undo')}
                </button>
              </p>
            )}
          </div>

          <FileUpload
            category="dogPhoto"
            onFileSelect={(file) => {
              setSelectedFile(file);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            hideUploadButton={true}
            hidePreview={true}
            label={t('dogProfile.profilePictureUrl')}
          />

          {/* Vaccination Record Upload */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="font-semibold text-sm text-gray-700 mb-2">
              {t('dogProfile.vaccinationRecord', 'Vaccination Record')}
            </p>
            {isEditMode && dog?.vaccinationRecordUrl && !selectedVaccinationFile && !vaccinationDeleted && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600">✓ {t('dogProfile.vaccinationOnFile', 'Record on file')}</p>
                <button
                  type="button"
                  onClick={() => setVaccinationDeleted(true)}
                  className="text-sm text-red-500 hover:text-red-700 underline"
                >
                  {t('dogProfile.removeRecord', 'Remove')}
                </button>
              </div>
            )}
            {vaccinationDeleted && (
              <p className="text-sm text-red-400 mb-2">
                {t('dogProfile.recordWillBeRemoved', 'Record will be removed on save')}{' '}
                <button type="button" onClick={() => setVaccinationDeleted(false)} className="underline text-blue-500">
                  {t('dogProfile.undo', 'Undo')}
                </button>
              </p>
            )}
            {vaccinationFileName && (
              <p className="text-sm text-blue-600 mb-2">📄 {vaccinationFileName}</p>
            )}
            {!vaccinationDeleted && (
              <FileUpload
                category="document"
                onFileSelect={(file) => {
                  setSelectedVaccinationFile(file);
                  setVaccinationFileName(file ? file.name : null);
                }}
                hideUploadButton={true}
                hidePreview={true}
                label={t('dogProfile.uploadVaccinationRecord', 'Upload Vaccination Record (PDF/image)')}
              />
            )}
          </div>

          <InputText
            label={t('dogProfile.name')}
            value={formData.name}
            onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
            required
          />

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.breed')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.breed}
              onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value as DogBreed }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogBreed).filter(k => isNaN(Number(k))).map((breed) => (
                <option key={breed} value={breed}>{breed.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.gender')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as DogGender }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogGender).filter(k => isNaN(Number(k))).map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.size')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.size}
              onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value as DogSize }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogSize).filter(k => isNaN(Number(k))).map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 cursor-pointer">
            <span className="font-semibold text-sm">
              {t('dogProfile.playstyle')}
              <span className="text-red-500 ml-1">*</span>
            </span>
            <select
              value={formData.playstyle}
              onChange={(e) => setFormData(prev => ({ ...prev, playstyle: e.target.value as DogPlaystyle }))}
              className={selectClassName}
              required
            >
              <option value="">{t('dogProfile.selectOption')}</option>
              {Object.keys(DogPlaystyle).filter(k => isNaN(Number(k))).map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </label>

          <InputText
            label={t('dogProfile.birthdate')}
            type="date"
            value={formData.dateOfBirth}
            onChange={(val) => setFormData(prev => ({ ...prev, dateOfBirth: val }))}
            required
          />

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.fixed}
                onChange={(e) => setFormData(prev => ({ ...prev, fixed: e.target.checked }))}
                className="w-4 h-4"
              />
              {t('dogProfile.fixed')}
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">{t('dogProfile.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`${selectClassName} h-32`}
              placeholder={t('dogProfile.descriptionPlaceholder')}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              text={isSubmitting ? (isEditMode ? t('dogProfile.saving') : t('dogProfile.creating')) : (isEditMode ? t('dogProfile.saveChanges') : t('dogProfile.createDog'))}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
            />
            <Button
              type="button"
              text={t('dogProfile.cancel')}
              onClick={() => navigate(isEditMode ? `/dog/${id}` : '/profile')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDogProfile;

